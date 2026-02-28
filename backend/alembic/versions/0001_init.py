"""init

Revision ID: 0001_init
Revises:
Create Date: 2026-02-28
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("dob", sa.Date(), nullable=False),
        sa.Column("email", sa.String(), nullable=True),
        sa.Column("employee_code", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("role in ('admin','employee')", name="users_role_check"),
    )
    op.create_index("users_name_dob_idx", "users", ["name", "dob"])
    op.create_index("users_role_idx", "users", ["role"])
    op.create_index("users_employee_code_unique", "users", ["employee_code"], unique=True, postgresql_where=sa.text("employee_code is not null"))

    op.create_table(
        "sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ip", sa.String(), nullable=True),
        sa.Column("user_agent", sa.String(), nullable=True),
    )
    op.create_index("sessions_user_id_idx", "sessions", ["user_id"])
    op.create_index("sessions_expires_at_idx", "sessions", ["expires_at"])

    op.create_table(
        "leave_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("employee_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("excluded_dates", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("total_days", sa.Integer(), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(), nullable=False, server_default="pending"),
        sa.Column("admin_comment", sa.Text(), nullable=True),
        sa.Column("decided_by_admin_user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("status in ('pending','approved','rejected')", name="leave_status_check"),
    )
    op.create_index("leave_status_idx", "leave_requests", ["status"])
    op.create_index("leave_employee_created_idx", "leave_requests", ["employee_user_id", "created_at"])

    op.create_table(
        "email_config",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("provider", sa.String(), nullable=False, server_default="custom_smtp"),
        sa.Column("mode", sa.String(), nullable=False, server_default="smtp"),
        sa.Column("smtp_host", sa.String(), nullable=True),
        sa.Column("smtp_port", sa.Integer(), nullable=True),
        sa.Column("smtp_user", sa.String(), nullable=True),
        sa.Column("smtp_pass_enc", sa.Text(), nullable=True),
        sa.Column("api_key_enc", sa.Text(), nullable=True),
        sa.Column("sender_email", sa.String(), nullable=True),
        sa.Column("sender_name", sa.String(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.execute("insert into email_config (id) values (1) on conflict (id) do nothing;")

    op.create_table(
        "app_settings",
        sa.Column("key", sa.String(), primary_key=True),
        sa.Column("value", sa.String(), nullable=False),
    )


def downgrade():
    op.drop_table("app_settings")
    op.drop_table("email_config")
    op.drop_index("leave_employee_created_idx", table_name="leave_requests")
    op.drop_index("leave_status_idx", table_name="leave_requests")
    op.drop_table("leave_requests")
    op.drop_index("sessions_expires_at_idx", table_name="sessions")
    op.drop_index("sessions_user_id_idx", table_name="sessions")
    op.drop_table("sessions")
    op.drop_index("users_employee_code_unique", table_name="users")
    op.drop_index("users_role_idx", table_name="users")
    op.drop_index("users_name_dob_idx", table_name="users")
    op.drop_table("users")