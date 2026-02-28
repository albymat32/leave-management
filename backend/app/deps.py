from datetime import datetime, timezone
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session as OrmSession

from app.db import SessionLocal
from app.models import Session as DbSession, User
from app.config import settings


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _utcnow():
    return datetime.now(timezone.utc)


def get_current_user(request: Request, db: OrmSession = Depends(get_db)) -> User:
    sid = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if not sid:
        raise HTTPException(status_code=401, detail="Not authenticated")

    s = db.query(DbSession).filter(DbSession.id == sid).first()
    if not s:
        raise HTTPException(status_code=401, detail="Invalid session")

    if s.expires_at <= _utcnow():
        # Expired: delete it
        db.delete(s)
        db.commit()
        raise HTTPException(status_code=401, detail="Session expired")

    user = db.query(User).filter(User.id == s.user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


def require_employee(user: User = Depends(get_current_user)) -> User:
    if user.role != "employee":
        raise HTTPException(status_code=403, detail="Employee only")
    return user