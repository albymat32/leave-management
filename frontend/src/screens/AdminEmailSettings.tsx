import { useEffect, useState } from "react";
import { Api } from "../app/api";
import type { EmailConfig } from "../app/types";
import { Card } from "../ui/components/Card";
import { Button } from "../ui/components/Button";
import { Toggle } from "../ui/components/Toggle";
import { Loader } from "../ui/components/Loader";

export function AdminEmailSettings() {
  const [cfg, setCfg] = useState<EmailConfig | null>(null);
  const [smtpPass, setSmtpPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const x = await Api.getEmailConfig();
      setCfg(x as any);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <Card>
        <h2>Email Settings</h2>
        <Loader label="Loading settings…" />
      </Card>
    );
  }

  if (!cfg) {
    return (
      <Card>
        <h2>Email Settings</h2>
        <div className="small">Failed to load settings.</div>
      </Card>
    );
  }

  const statusText = !cfg.enabled
    ? "Emails are disabled"
    : cfg.isValid
    ? "Enabled (config valid)"
    : "Enabled (config incomplete — emails will be skipped)";

  return (
    <Card>
      <h2>Email Settings</h2>
      <div className="small">{statusText}</div>

      <label>Enable notifications</label>
      <Toggle
        value={cfg.enabled}
        onChange={(v) => setCfg({ ...cfg, enabled: v })}
      />

      <label>Provider</label>
      <select
        value={cfg.provider}
        onChange={(e) => setCfg({ ...cfg, provider: e.target.value })}
      >
        <option value="brevo">Brevo</option>
        <option value="mailersend">MailerSend</option>
        <option value="sendgrid">SendGrid</option>
        <option value="custom_smtp">Custom SMTP</option>
      </select>

      <label>Mode</label>
      <select
        value={cfg.mode}
        onChange={(e) =>
          setCfg({ ...cfg, mode: e.target.value as any })
        }
      >
        <option value="smtp">SMTP</option>
        <option value="api" disabled>
          API (later)
        </option>
      </select>

      <label>SMTP host</label>
      <input
        value={cfg.smtpHost || ""}
        onChange={(e) => setCfg({ ...cfg, smtpHost: e.target.value })}
      />

      <label>SMTP port</label>
      <input
        value={String(cfg.smtpPort ?? "")}
        onChange={(e) =>
          setCfg({
            ...cfg,
            smtpPort: e.target.value ? Number(e.target.value) : null,
          })
        }
        inputMode="numeric"
      />

      <label>Username</label>
      <input
        value={cfg.smtpUser || ""}
        onChange={(e) => setCfg({ ...cfg, smtpUser: e.target.value })}
      />

      <label>Password</label>
      <input
        type="password"
        value={smtpPass}
        onChange={(e) => setSmtpPass(e.target.value)}
        placeholder="Leave blank to keep existing"
      />

      <label>Sender name</label>
      <input
        value={cfg.senderName || ""}
        onChange={(e) => setCfg({ ...cfg, senderName: e.target.value })}
      />

      <label>Sender email</label>
      <input
        value={cfg.senderEmail || ""}
        onChange={(e) => setCfg({ ...cfg, senderEmail: e.target.value })}
      />

      {msg ? <div className="small" style={{ marginTop: 10 }}>{msg}</div> : null}

      <div className="stickyBar">
        <Button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            setMsg(null);
            try {
              const payload: any = {
                enabled: cfg.enabled,
                provider: cfg.provider,
                mode: cfg.mode,
                smtpHost: cfg.smtpHost,
                smtpPort: cfg.smtpPort,
                smtpUser: cfg.smtpUser,
                senderEmail: cfg.senderEmail,
                senderName: cfg.senderName,
              };
              if (smtpPass) payload.smtpPass = smtpPass;

              const saved = await Api.putEmailConfig(payload);
              setCfg(saved as any);
              setSmtpPass("");
              setMsg("Saved.");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? <Loader label="Saving…" /> : "Save"}
        </Button>

        <div style={{ height: 10 }} />

        <Button
          tone="secondary"
          disabled={testing}
          onClick={async () => {
            setTesting(true);
            setMsg(null);
            try {
              const r = await Api.testEmail();
              setMsg((r as any).message);
            } finally {
              setTesting(false);
            }
          }}
        >
          {testing ? <Loader label="Sending…" /> : "Send test mail"}
        </Button>
      </div>
    </Card>
  );
}