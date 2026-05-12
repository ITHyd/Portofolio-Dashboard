from io import BytesIO

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.auth.deps import require_roles
from app.database import get_db
from app.models import User
from app.services.excel_importer import import_portfolio_register

router = APIRouter(prefix="/api/imports", tags=["imports"])


@router.post("/portfolio-register")
async def upload_portfolio_register(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("portfolio_office")),
):
    if not (file.filename or "").lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are accepted")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    try:
        counts = import_portfolio_register(db, BytesIO(content))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Import failed: {e}")
    return {"ok": True, "filename": file.filename, "counts": counts}
