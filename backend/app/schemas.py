from datetime import date
from pydantic import BaseModel, Field


class BootstrapOut(BaseModel):
    has_admin: bool


class MeOut(BaseModel):
    id: str
    role: str
    name: str


class RegisterAdminIn(BaseModel):
    setupCode: str = Field(min_length=3)
    name: str = Field(min_length=1, max_length=80)
    dob: date
    email: str = Field(min_length=3, max_length=200)


class RegisterEmployeeIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    dob: date
    employeeCode: str = Field(min_length=1, max_length=40)
    email: str | None = Field(default=None, max_length=200)


class LoginIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    dob: date


class LeaveApplyIn(BaseModel):
    startDate: date
    endDate: date
    excludedDates: list[date] | None = None
    reason: str = Field(min_length=1, max_length=200)


class LeaveOut(BaseModel):
    id: str
    startDate: date
    endDate: date
    excludedDates: list[date]
    totalDays: int
    reason: str
    status: str
    adminComment: str | None
    createdAt: str


class LeaveDecisionIn(BaseModel):
    decision: str  # approved | rejected
    comment: str | None = Field(default=None, max_length=300)


class EmployeeOut(BaseModel):
    id: str
    name: str
    employeeCode: str | None


class EmailConfigOut(BaseModel):
    enabled: bool
    provider: str
    mode: str
    smtpHost: str | None
    smtpPort: int | None
    smtpUser: str | None
    senderEmail: str | None
    senderName: str | None
    isValid: bool


class EmailConfigIn(BaseModel):
    enabled: bool
    provider: str
    mode: str
    smtpHost: str | None = None
    smtpPort: int | None = None
    smtpUser: str | None = None
    smtpPass: str | None = None
    apiKey: str | None = None
    senderEmail: str | None = None
    senderName: str | None = None


class TestEmailOut(BaseModel):
    ok: bool
    message: str