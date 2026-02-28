import smtplib
from email.message import EmailMessage
from sqlalchemy.orm import Session as OrmSession
from app.models import EmailConfig, User
from app.security import decrypt_text, encrypt_text
from app.config import settings


def _is_valid(cfg: EmailConfig) -> bool:
    if not cfg.enabled:
        return False
    if cfg.mode != "smtp":
        return False
    if not (cfg.smtp_host and cfg.smtp_port and cfg.smtp_user and cfg.smtp_pass_enc):
        return False
    if not (cfg.sender_email and cfg.sender_name):
        return False
    return True


def get_email_config(db: OrmSession) -> EmailConfig:
    cfg = db.query(EmailConfig).filter(EmailConfig.id == 1).first()
    if not cfg:
        cfg = EmailConfig(id=1)
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def update_email_config(db: OrmSession, payload: dict) -> EmailConfig:
    cfg = get_email_config(db)

    cfg.enabled = bool(payload.get("enabled", False))
    cfg.provider = payload.get("provider") or "custom_smtp"
    cfg.mode = payload.get("mode") or "smtp"

    cfg.smtp_host = payload.get("smtpHost")
    cfg.smtp_port = payload.get("smtpPort")
    cfg.smtp_user = payload.get("smtpUser")
    cfg.sender_email = payload.get("senderEmail")
    cfg.sender_name = payload.get("senderName")

    smtp_pass = payload.get("smtpPass")
    api_key = payload.get("apiKey")

    if smtp_pass:
        cfg.smtp_pass_enc = encrypt_text(smtp_pass, settings.EMAIL_CRED_SECRET)
    if api_key:
        cfg.api_key_enc = encrypt_text(api_key, settings.EMAIL_CRED_SECRET)

    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return cfg


def send_email_smtp(cfg: EmailConfig, to_email: str, subject: str, body: str) -> None:
    smtp_pass = decrypt_text(cfg.smtp_pass_enc or "", settings.EMAIL_CRED_SECRET)

    msg = EmailMessage()
    msg["From"] = f"{cfg.sender_name} <{cfg.sender_email}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    # TLS (587) typical for free-tier SMTP
    with smtplib.SMTP(cfg.smtp_host, int(cfg.smtp_port), timeout=10) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(cfg.smtp_user, smtp_pass)
        server.send_message(msg)


def try_send(db: OrmSession, to_email: str, subject: str, body: str) -> tuple[bool, str]:
    cfg = get_email_config(db)
    if not _is_valid(cfg):
        return True, "Email disabled or invalid config (skipped)."
    try:
        send_email_smtp(cfg, to_email, subject, body)
        return True, "Sent"
    except Exception as e:
        # Graceful failure: do not break app flows
        return False, f"Email send failed: {e}"


def notify_admin_new_leave(
    db,
    admin,
    employee,
    start: str,
    end: str,
    total_days: int,
    excluded_dates: list[str],
    reason: str,
    applied_at: str,
):
    excluded_txt = (
        ", ".join(excluded_dates) if excluded_dates else "None"
    )

    body = f"""
New Leave Request

Employee: {employee.name}
Employee ID: {employee.employee_code or "-"}
Email: {employee.email or "-"}

Leave Period:
• From: {start}
• To: {end}
• Total Days: {total_days}
• Excluded Dates: {excluded_txt}

Reason:
{reason or "—"}

Applied on:
{applied_at}
"""

    try_send(
        db,
        to_email=admin.email,
        subject="New Leave Request",
        body=body.strip(),
    )


def notify_employee_decision(db: OrmSession, employee: User, status: str, start: str, end: str, total_days: int, comment: str | None) -> None:
    if not employee.email:
        return  # silently skip
    subject = "Leave Approved" if status == "approved" else "Leave Rejected"
    body = (
        f"Your leave was {status}\n\n"
        f"Employee: {employee.name}\n"
        f"Dates: {start} to {end}\n"
        f"Total days: {total_days}\n"
    )
    if comment:
        body += f"\nAdmin comment: {comment}\n"
    try_send(db, employee.email, subject, body)