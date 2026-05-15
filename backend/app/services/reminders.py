import asyncio
import smtplib
from contextlib import suppress
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from email.message import EmailMessage

from sqlalchemy import select

from app.config import settings
from app.database import SessionLocal
from app.models import AuditLog, Project, User, WeeklyStatus


def reminder_target_friday(today: date | None = None) -> date:
    today = today or date.today()
    days_until_friday = (4 - today.weekday()) % 7
    return today + timedelta(days=days_until_friday)


def should_send_reminders(now: datetime | None = None) -> bool:
    now = now or datetime.now()
    return now.weekday() == 3 and now.hour >= settings.reminder_thursday_hour


@dataclass
class ReminderItem:
    project_name: str
    client: str


def _build_message(email_to: str, items: list[ReminderItem], target_week: date) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = f"Weekly status reminder for week ending {target_week.isoformat()}"
    msg["From"] = settings.reminder_from_email or settings.smtp_username or "noreply@nxzen.local"
    msg["To"] = email_to
    lines = "\n".join(f"- {item.project_name} ({item.client})" for item in items)
    msg.set_content(
        "Please update weekly status for the projects below before Friday close of business.\n\n"
        f"Week ending: {target_week.isoformat()}\n\n"
        f"{lines}\n\n"
        f"Open the dashboard: {settings.reminder_base_url}/weekly-status\n"
    )
    return msg


def _send_email(message: EmailMessage) -> None:
    if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
        raise RuntimeError("SMTP is not configured for weekly status reminders.")
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=20) as server:
        if settings.smtp_use_tls:
            server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)


def send_pending_weekly_status_reminders() -> int:
    if not settings.reminder_enabled:
        return 0
    if not should_send_reminders():
        return 0
    if not settings.smtp_host or not settings.smtp_username or not settings.smtp_password:
        return 0

    target_week = reminder_target_friday()
    sent_count = 0
    with SessionLocal() as db:
        active_projects = db.scalars(select(Project).where(Project.status == "Active")).all()
        existing_rows = db.scalars(
            select(WeeklyStatus).where(WeeklyStatus.week_ending == target_week)
        ).all()
        updated_project_ids = {row.project_id for row in existing_rows}

        grouped: dict[str, list[ReminderItem]] = {}
        for project in active_projects:
            if project.id in updated_project_ids:
                continue
            email = None
            if project.pm_user_id:
                pm_user = db.get(User, project.pm_user_id)
                email = pm_user.email if pm_user else None
            if not email:
                pm_user = db.scalar(select(User).where(User.role == "pm").limit(1))
                email = pm_user.email if pm_user else None
            if not email:
                continue
            grouped.setdefault(email, []).append(ReminderItem(project.name, project.client))

        for email_to, items in grouped.items():
            marker = f"{email_to}:{target_week.isoformat()}"
            already_sent = db.scalar(
                select(AuditLog).where(
                    AuditLog.action == "reminder",
                    AuditLog.entity == "weekly_status",
                    AuditLog.before_json["marker"].as_string() == marker,
                )
            )
            if already_sent:
                continue
            _send_email(_build_message(email_to, items, target_week))
            db.add(
                AuditLog(
                    action="reminder",
                    entity="weekly_status",
                    before_json={"marker": marker},
                    after_json={
                        "target_week": target_week.isoformat(),
                        "email": email_to,
                        "projects": [item.project_name for item in items],
                    },
                )
            )
            sent_count += 1
        db.commit()
    return sent_count


async def reminder_loop() -> None:
    while True:
        with suppress(Exception):
            send_pending_weekly_status_reminders()
        await asyncio.sleep(max(settings.reminder_check_interval_minutes, 5) * 60)
