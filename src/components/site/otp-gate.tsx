import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, ShieldCheck } from "lucide-react";

/**
 * OTP verification gate (placeholder API).
 * Wire real SMS/WhatsApp API in `sendOtp` and `verifyOtp` below.
 * Session-scoped: once verified, key is stored in sessionStorage.
 */

const OTP_STORAGE_KEY = "zaxia_otp_verified_phone";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+?\d{10,15})$/i, "Enter a valid mobile number (10-15 digits)");

const nameSchema = z.string().trim().min(2, "Enter your name").max(120);

// -------- Placeholder API calls (replace with real SMS/WhatsApp gateway) --------
async function sendOtp(_phone: string, _channel: "sms" | "whatsapp"): Promise<void> {
  // TODO: integrate real API (Twilio, MSG91, Gupshup, etc.)
  // await fetch("/api/public/otp/send", { method: "POST", body: JSON.stringify({ phone, channel }) });
  await new Promise((r) => setTimeout(r, 700));
}

async function verifyOtp(_phone: string, code: string): Promise<boolean> {
  // TODO: replace with real verification endpoint.
  // Placeholder: any 6-digit code is accepted; "000000" is rejected.
  await new Promise((r) => setTimeout(r, 500));
  return /^\d{6}$/.test(code) && code !== "000000";
}
// -------------------------------------------------------------------------------

export function isPhoneVerified(): { phone: string; name?: string } | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(OTP_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function OtpGate({
  title = "Verify your mobile number",
  description = "We send a one-time code to prevent spam.",
  requireName = true,
  onVerified,
}: {
  title?: string;
  description?: string;
  requireName?: boolean;
  onVerified: (data: { name: string; phone: string }) => void;
}) {
  const [step, setStep] = useState<"details" | "code">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"sms" | "whatsapp">("whatsapp");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireName) {
      const nameOk = nameSchema.safeParse(name);
      if (!nameOk.success) return toast.error(nameOk.error.issues[0].message);
    }
    const phoneOk = phoneSchema.safeParse(phone);
    if (!phoneOk.success) return toast.error(phoneOk.error.issues[0].message);
    setSending(true);
    try {
      await sendOtp(phone, channel);
      toast.success(`OTP sent via ${channel === "whatsapp" ? "WhatsApp" : "SMS"} (placeholder — use any 6-digit code)`);
      setStep("code");
    } catch {
      toast.error("Could not send OTP. Try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const ok = await verifyOtp(phone, code);
      if (!ok) {
        toast.error("Invalid code. Try again.");
        return;
      }
      const payload = { phone, name };
      sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(payload));
      toast.success("Mobile verified");
      onVerified(payload);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 md:p-8 shadow-soft">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      {step === "details" ? (
        <form onSubmit={handleSend} className="mt-6 space-y-4">
          {requireName && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Full name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                className="input-base"
                placeholder="Your name"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Mobile number</span>
            <div className="relative">
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                inputMode="tel"
                maxLength={20}
                className="input-base pl-9"
                placeholder="+91 98XXXXXXXX"
              />
            </div>
          </label>
          <fieldset className="flex gap-2">
            {(["whatsapp", "sms"] as const).map((c) => (
              <label
                key={c}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-sm capitalize transition ${
                  channel === c ? "border-primary bg-primary/10 text-primary" : "border-border/60 text-foreground/70"
                }`}
              >
                <input
                  type="radio"
                  name="channel"
                  value={c}
                  checked={channel === c}
                  onChange={() => setChannel(c)}
                  className="sr-only"
                />
                {c === "whatsapp" ? "WhatsApp" : "SMS"}
              </label>
            ))}
          </fieldset>
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-full gradient-brand px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-95 disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">6-digit code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              maxLength={6}
              className="input-base tracking-[0.5em] text-center text-lg"
              placeholder="••••••"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Sent to {phone} via {channel === "whatsapp" ? "WhatsApp" : "SMS"}.
            </span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep("details")}
              className="rounded-full border border-border/60 px-4 py-2.5 text-sm hover:bg-muted"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="flex-1 rounded-full gradient-brand px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-95 disabled:opacity-60"
            >
              {verifying ? "Verifying…" : "Verify & continue"}
            </button>
          </div>
        </form>
      )}

      <style>{`
        .input-base {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--color-border);
          background: var(--color-background);
          padding: 0.65rem 0.85rem;
          font-size: 0.9rem;
          color: var(--color-foreground);
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input-base:focus {
          border-color: color-mix(in oklab, var(--color-primary) 55%, transparent);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--color-ring) 25%, transparent);
        }
      `}</style>
    </div>
  );
}
