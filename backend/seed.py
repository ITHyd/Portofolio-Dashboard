"""One-shot seed: default users + metric catalogue + 16 projects from Portfolio_Register_v4.xlsx.

Run after `alembic upgrade head`:
    python seed.py
"""
from __future__ import annotations

import os
import sys
from datetime import date, datetime
from pathlib import Path

import openpyxl
from sqlalchemy import select

# Make `app` importable
sys.path.insert(0, str(Path(__file__).parent))

from app.auth.security import hash_password
from app.database import SessionLocal
from app.models import MetricDefinition, User
from app.services.excel_importer import import_portfolio_register

def _find_xlsx(filename: str) -> Path | None:
    candidates = [
        Path(os.environ.get("SEED_DATA_DIR", "")) / filename if os.environ.get("SEED_DATA_DIR") else None,
        Path("/data") / filename,
        Path(__file__).resolve().parents[1] / filename,
        Path(__file__).resolve().parent / filename,
    ]
    for c in candidates:
        if c and c.exists():
            return c
    return None


REGISTER_PATH = _find_xlsx("Portfolio_Register_v4.xlsx")
CATALOGUE_PATH = _find_xlsx("Portfolio Metric Catalogue v0.4.xlsx")

DEFAULT_USERS = [
    ("admin@nxzen.com", "Admin User", "admin", "admin123"),
    ("po@nxzen.com", "Laura Hargrave", "portfolio_office", "po123"),
    ("pm@nxzen.com", "PM User", "pm", "pm123"),
    ("cp@nxzen.com", "CP User", "cp", "cp123"),
    ("rm@nxzen.com", "Resource Manager", "rm", "rm123"),
    ("finance@nxzen.com", "Finance User", "finance", "finance123"),
    ("exec@nxzen.com", "Mohamed Syedian", "exec_viewer", "exec123"),
]


def _val(cell):
    v = cell.value if hasattr(cell, "value") else cell
    if isinstance(v, str):
        v = v.strip()
        return v or None
    return v


def _as_date(v):
    if v is None or v == "":
        return None
    if isinstance(v, datetime):
        return v.date()
    if isinstance(v, date):
        return v
    return None


def seed_users(db):
    for email, full_name, role, password in DEFAULT_USERS:
        existing = db.scalar(select(User).where(User.email == email))
        if existing:
            continue
        db.add(
            User(
                email=email,
                full_name=full_name,
                role=role,
                password_hash=hash_password(password),
                is_active=True,
            )
        )
    db.commit()
    print(f"Seeded {len(DEFAULT_USERS)} default users (only missing ones inserted).")


def seed_metric_definitions(db):
    if not CATALOGUE_PATH or not CATALOGUE_PATH.exists():
        print("Metric catalogue file not found — skipping metric_definitions seed.")
        return
    wb = openpyxl.load_workbook(CATALOGUE_PATH, data_only=True)
    ws = wb["Metric Catalogue"]
    inserted = 0
    for row in ws.iter_rows(min_row=4, values_only=True):
        release, num, name, category, sub_cat, description, formula, *_rest = row[:7]
        if num is None or name is None:
            continue
        try:
            num = int(num)
        except (TypeError, ValueError):
            continue
        existing = db.scalar(select(MetricDefinition).where(MetricDefinition.metric_number == num))
        if existing:
            continue
        # Re-read full row for owner/freq/unit
        data_source = row[7] if len(row) > 7 else None
        data_owner = row[9] if len(row) > 9 else None
        update_freq = row[10] if len(row) > 10 else None
        unit = row[11] if len(row) > 11 else None
        db.add(
            MetricDefinition(
                metric_number=int(num),
                name=str(name).strip(),
                category=str(category).strip() if category else None,
                sub_category=str(sub_cat).strip() if sub_cat else None,
                release=str(release).strip() if release else "TBC",
                description=str(description).strip() if description else None,
                formula=str(formula).strip() if formula else None,
                unit=str(unit).strip() if unit else None,
                update_frequency=str(update_freq).strip() if update_freq else None,
                data_owner=str(data_owner).strip() if data_owner else None,
            )
        )
        inserted += 1
    db.commit()
    print(f"Seeded {inserted} metric definitions.")


def seed_projects_and_status(db):
    if not REGISTER_PATH or not REGISTER_PATH.exists():
        print("Portfolio register file not found — skipping project seed.")
        return
    counts = import_portfolio_register(db, REGISTER_PATH)
    print(
        "Imported portfolio register: "
        + ", ".join(f"{k}={v}" for k, v in counts.items() if v)
    )


def main():
    db = SessionLocal()
    try:
        seed_users(db)
        seed_metric_definitions(db)
        seed_projects_and_status(db)
        print("\nSeed complete. Default login:  admin@nxzen.com / admin123")
        print("Other roles: po@nxzen.com/po123, pm@nxzen.com/pm123, cp@nxzen.com/cp123,")
        print("             rm@nxzen.com/rm123, finance@nxzen.com/finance123, exec@nxzen.com/exec123")
    finally:
        db.close()


if __name__ == "__main__":
    main()
