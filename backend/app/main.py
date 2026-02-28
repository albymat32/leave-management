import os
from datetime import datetime, timedelta, date, timezone
from pathlib import Path

from fastapi import FastAPI, Depends, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session as OrmSession

from app.config import settings
from app.deps import get_db, get_current_user, require_admin, require_employee
from app.models import User, Session as DbSession, LeaveRequest, AppSetting, EmailConfig
from app.schemas import (
    BootstrapOut, RegisterAdminIn, RegisterEmployeeIn, LoginIn, MeOut,
    LeaveApplyIn, LeaveOut, LeaveDecisionIn, EmployeeOut,
    EmailConfigOut, EmailConfigIn, TestEmailOut
)
from app.services.leave_calc import calc_total_days
from app.services.email_service import (
    get_email_config, update_email_config, notify_admin_new_leave, notify_employee_decision, try_send
)

app = FastAPI()

# Same-domain deployment: keep CORS minimal (still allow local dev if you run frontend separately)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _utcnow():
    return datetime.now(timezone.utc)

def _session_expiry():
    return _utcnow() + timedelta(days=settings.SESSION_TTL_DAYS)

def _set_session_cookie(resp: Response, session_id: str):
    resp.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=session_id,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=settings.SESSION_TTL_DAYS * 24 * 3600,
    )

def _clear_session_cookie(resp: Response):
    resp.delete_cookie(key=settings.SESSION_COOKIE_NAME, path="/")

@app.get("/api/bootstrap", response_model=BootstrapOut)
def bootstrap(db: OrmSession = Depends(get_db)):
    has_admin = db.query(User).filter(User.role == "admin").first() is not None
    return {"has_admin": has_admin}

@app.post("/api/auth/register-admin", response_model=MeOut)
def register_admin(payload: RegisterAdminIn, response: Response, request: Request, db: OrmSession = Depends(get_db)):
    if payload.setupCode != settings.ADMIN_SETUP_CODE:
        raise HTTPException(status_code=403, detail="Invalid setup code")

    # Lock after first admin
    used = db.query(AppSetting).filter(AppSetting.key == "admin_setup_used").first()
    if used and used.value == "1":
        raise HTTPException(status_code=403, detail="Admin setup already used")

    existing_admin = db.query(User).filter(User.role == "admin").first()
    if existing_admin:
        db.add(AppSetting(key="admin_setup_used", value="1"))
        db.commit()
        raise HTTPException(status_code=403, detail="Admin already exists")

    u = User(role="admin", name=payload.name.strip(), dob=payload.dob, email=payload.email.strip())
    db.add(u)
    db.commit()
    db.refresh(u)

    db.merge(AppSetting(key="admin_setup_used", value="1"))
    db.commit()

    sess = DbSession(
        user_id=u.id,
        expires_at=_session_expiry(),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)

    _set_session_cookie(response, str(sess.id))
    return {"id": str(u.id), "role": u.role, "name": u.name}

@app.post("/api/auth/register-employee", response_model=MeOut)
def register_employee(payload: RegisterEmployeeIn, response: Response, request: Request, db: OrmSession = Depends(get_db)):
    if db.query(User).filter(User.employee_code == payload.employeeCode).first():
        raise HTTPException(status_code=409, detail="Employee ID already exists")

    u = User(
        role="employee",
        name=payload.name.strip(),
        dob=payload.dob,
        employee_code=payload.employeeCode.strip(),
        email=payload.email.strip() if payload.email else None,
    )
    db.add(u)
    db.commit()
    db.refresh(u)

    sess = DbSession(
        user_id=u.id,
        expires_at=_session_expiry(),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)

    _set_session_cookie(response, str(sess.id))
    return {"id": str(u.id), "role": u.role, "name": u.name}

@app.post("/api/auth/login", response_model=MeOut)
def login(payload: LoginIn, response: Response, request: Request, db: OrmSession = Depends(get_db)):
    # No ambiguity handling per your request (assumes unique enough in your org)
    u = db.query(User).filter(User.name == payload.name.strip(), User.dob == payload.dob).first()
    if not u:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    sess = DbSession(
        user_id=u.id,
        expires_at=_session_expiry(),
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )
    db.add(sess)
    db.commit()
    db.refresh(sess)

    _set_session_cookie(response, str(sess.id))
    return {"id": str(u.id), "role": u.role, "name": u.name}

@app.post("/api/auth/logout")
def logout(response: Response, user: User = Depends(get_current_user), db: OrmSession = Depends(get_db), request: Request = None):
    sid = request.cookies.get(settings.SESSION_COOKIE_NAME) if request else None
    if sid:
        s = db.query(DbSession).filter(DbSession.id == sid).first()
        if s:
            db.delete(s)
            db.commit()
    _clear_session_cookie(response)
    return {"ok": True}

@app.get("/api/auth/me", response_model=MeOut)
def me(user: User = Depends(get_current_user)):
    return {"id": str(user.id), "role": user.role, "name": user.name}

@app.post("/api/leaves", response_model=LeaveOut)
def apply_leave(payload: LeaveApplyIn, db: OrmSession = Depends(get_db), employee: User = Depends(require_employee)):
    try:
        total, excluded_str = calc_total_days(payload.startDate, payload.endDate, payload.excludedDates)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date range")

    lr = LeaveRequest(
        employee_user_id=employee.id,
        start_date=payload.startDate,
        end_date=payload.endDate,
        excluded_dates=excluded_str,
        total_days=total,
        reason=payload.reason.strip(),
        status="pending",
    )
    db.add(lr)
    db.commit()
    db.refresh(lr)

    admin = db.query(User).filter(User.role == "admin").first()
    if admin:
        notify_admin_new_leave(
    db,
    admin=admin,
    employee=employee,
    start=lr.start_date.isoformat(),
    end=lr.end_date.isoformat(),
    total_days=lr.total_days,
    excluded_dates=lr.excluded_dates,
    reason=lr.reason,
    applied_at=lr.created_at.isoformat(),
)

    return {
        "id": str(lr.id),
        "startDate": lr.start_date,
        "endDate": lr.end_date,
        "excludedDates": [datetime.fromisoformat(d).date() for d in lr.excluded_dates],
        "totalDays": lr.total_days,
        "reason": lr.reason,
        "status": lr.status,
        "adminComment": lr.admin_comment,
        "createdAt": lr.created_at.isoformat(),
    }

@app.get("/api/leaves/my", response_model=list[LeaveOut])
def my_leaves(month: str | None = None, db: OrmSession = Depends(get_db), employee: User = Depends(require_employee)):
    q = db.query(LeaveRequest).filter(LeaveRequest.employee_user_id == employee.id)
    if month:
    # month = YYYY-MM
        y, m = map(int, month.split("-"))
        start = date(y, m, 1)

        if m == 12:
            end = date(y + 1, 1, 1)
        else:
            end = date(y, m + 1, 1)

        q = q.filter(
            LeaveRequest.created_at >= start,
            LeaveRequest.created_at < end,
        )
    q = q.order_by(LeaveRequest.created_at.desc()).limit(200)
    rows = q.all()

    out = []
    for lr in rows:
        out.append({
            "id": str(lr.id),
            "startDate": lr.start_date,
            "endDate": lr.end_date,
            "excludedDates": [datetime.fromisoformat(d).date() for d in lr.excluded_dates],
            "totalDays": lr.total_days,
            "reason": lr.reason,
            "status": lr.status,
            "adminComment": lr.admin_comment,
            "createdAt": lr.created_at.isoformat(),
        })
    return out

@app.get("/api/leaves/my/pending", response_model=list[LeaveOut])
def my_pending(db: OrmSession = Depends(get_db), employee: User = Depends(require_employee)):
    rows = (
        db.query(LeaveRequest)
        .filter(LeaveRequest.employee_user_id == employee.id, LeaveRequest.status == "pending")
        .order_by(LeaveRequest.created_at.desc())
        .all()
    )
    out = []
    for lr in rows:
        out.append({
            "id": str(lr.id),
            "startDate": lr.start_date,
            "endDate": lr.end_date,
            "excludedDates": [datetime.fromisoformat(d).date() for d in lr.excluded_dates],
            "totalDays": lr.total_days,
            "reason": lr.reason,
            "status": lr.status,
            "adminComment": lr.admin_comment,
            "createdAt": lr.created_at.isoformat(),
        })
    return out

@app.get("/api/admin/employees", response_model=list[EmployeeOut])
def admin_employees(db: OrmSession = Depends(get_db), admin: User = Depends(require_admin)):
    rows = db.query(User).filter(User.role == "employee").order_by(User.name.asc()).all()
    return [{"id": str(u.id), "name": u.name, "employeeCode": u.employee_code} for u in rows]

@app.get("/api/admin/leaves/pending", response_model=list[LeaveOut])
def admin_pending(employeeId: str | None = None, month: str | None = None, db: OrmSession = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(LeaveRequest).filter(LeaveRequest.status == "pending")
    if employeeId:
        q = q.filter(LeaveRequest.employee_user_id == employeeId)
    if month:
        q = q.filter(LeaveRequest.created_at >= f"{month}-01")
    rows = q.order_by(LeaveRequest.created_at.desc()).limit(200).all()
    out = []
    for lr in rows:
        out.append({
            "id": str(lr.id),
            "startDate": lr.start_date,
            "endDate": lr.end_date,
            "excludedDates": [datetime.fromisoformat(d).date() for d in lr.excluded_dates],
            "totalDays": lr.total_days,
            "reason": lr.reason,
            "status": lr.status,
            "adminComment": lr.admin_comment,
            "createdAt": lr.created_at.isoformat(),
        })
    return out

@app.post("/api/admin/leaves/{leave_id}/decision", response_model=LeaveOut)
def decide_leave(leave_id: str, payload: LeaveDecisionIn, db: OrmSession = Depends(get_db), admin: User = Depends(require_admin)):
    if payload.decision not in ("approved", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid decision")

    lr = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not lr:
        raise HTTPException(status_code=404, detail="Leave not found")
    if lr.status != "pending":
        raise HTTPException(status_code=409, detail="Already decided")

    lr.status = payload.decision
    lr.admin_comment = payload.comment.strip() if payload.comment else None
    lr.decided_by_admin_user_id = admin.id
    lr.decided_at = _utcnow()

    db.add(lr)
    db.commit()
    db.refresh(lr)

    employee = db.query(User).filter(User.id == lr.employee_user_id).first()
    if employee:
        notify_employee_decision(
            db,
            employee=employee,
            status=lr.status,
            start=lr.start_date.isoformat(),
            end=lr.end_date.isoformat(),
            total_days=lr.total_days,
            comment=lr.admin_comment,
        )

    return {
        "id": str(lr.id),
        "startDate": lr.start_date,
        "endDate": lr.end_date,
        "excludedDates": [datetime.fromisoformat(d).date() for d in lr.excluded_dates],
        "totalDays": lr.total_days,
        "reason": lr.reason,
        "status": lr.status,
        "adminComment": lr.admin_comment,
        "createdAt": lr.created_at.isoformat(),
    }

@app.get("/api/admin/employees/{employee_id}/leaves", response_model=list[LeaveOut])
def admin_employee_leaves(employee_id: str, month: str | None = None, db: OrmSession = Depends(get_db), admin: User = Depends(require_admin)):
    q = db.query(LeaveRequest).filter(LeaveRequest.employee_user_id == employee_id)
    if month:
        q = q.filter(LeaveRequest.created_at >= f"{month}-01")
    rows = q.order_by(LeaveRequest.created_at.desc()).limit(400).all()
    out = []
    for lr in rows:
        out.append({
            "id": str(lr.id),
            "startDate": lr.start_date,
            "endDate": lr.end_date,
            "excludedDates": [datetime.fromisoformat(d).date() for d in lr.excluded_dates],
            "totalDays": lr.total_days,
            "reason": lr.reason,
            "status": lr.status,
            "adminComment": lr.admin_comment,
            "createdAt": lr.created_at.isoformat(),
        })
    return out

@app.get("/api/admin/email-config", response_model=EmailConfigOut)
def admin_get_email_config(db: OrmSession = Depends(get_db), admin: User = Depends(require_admin)):
    cfg = get_email_config(db)

    # compute validity without decrypting
    is_valid = bool(
        cfg.enabled
        and cfg.mode == "smtp"
        and cfg.smtp_host
        and cfg.smtp_port
        and cfg.smtp_user
        and cfg.smtp_pass_enc
        and cfg.sender_email
        and cfg.sender_name
    )

    return {
        "enabled": cfg.enabled,
        "provider": cfg.provider,
        "mode": cfg.mode,
        "smtpHost": cfg.smtp_host,
        "smtpPort": cfg.smtp_port,
        "smtpUser": cfg.smtp_user,
        "senderEmail": cfg.sender_email,
        "senderName": cfg.sender_name,
        "isValid": is_valid,
    }

@app.put("/api/admin/email-config", response_model=EmailConfigOut)
def admin_put_email_config(payload: EmailConfigIn, db: OrmSession = Depends(get_db), admin: User = Depends(require_admin)):
    cfg = update_email_config(db, payload.model_dump())

    is_valid = bool(
        cfg.enabled
        and cfg.mode == "smtp"
        and cfg.smtp_host
        and cfg.smtp_port
        and cfg.smtp_user
        and cfg.smtp_pass_enc
        and cfg.sender_email
        and cfg.sender_name
    )

    return {
        "enabled": cfg.enabled,
        "provider": cfg.provider,
        "mode": cfg.mode,
        "smtpHost": cfg.smtp_host,
        "smtpPort": cfg.smtp_port,
        "smtpUser": cfg.smtp_user,
        "senderEmail": cfg.sender_email,
        "senderName": cfg.sender_name,
        "isValid": is_valid,
    }

@app.post("/api/admin/email-config/test", response_model=TestEmailOut)
def admin_test_email(db: OrmSession = Depends(get_db), admin: User = Depends(require_admin)):
    cfg = get_email_config(db)
    to_email = admin.email or cfg.sender_email
    if not to_email:
        return {"ok": False, "message": "No email address to send test mail to."}

    ok, msg = try_send(db, to_email, "Test Email", "This is a test email from Leave Management MVP.")
    return {"ok": ok, "message": msg}

# Serve built frontend (single-domain)
dist_dir = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if dist_dir.exists():
    app.mount("/", StaticFiles(directory=str(dist_dir), html=True), name="frontend")