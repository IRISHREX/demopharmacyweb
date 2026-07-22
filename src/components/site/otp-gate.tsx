import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Phone, ShieldCheck } from "lucide-react";

/**
 * OTP verification gate.
 * Session-scoped: once verified, key is stored in sessionStorage.
 */

const OTP_STORAGE_KEY = "zaxia_otp_verified_phone";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+91\s?\d{10}$/i, "Enter a valid 10-digit Indian mobile number");

const nameSchema = z.string().trim().min(2, "Enter your name").max(120);

function normalizeMobile(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
}

async function postOtpEndpoint<T>(
  paths: string[],
  body: Record<string, string>,
): Promise<{ response: Response; data: T | null }> {
  let lastResponse: Response | undefined;

  for (const path of paths) {
    const response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    lastResponse = response;

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) continue;

    if (!response.ok) return { response, data: null };
    const data = contentType.includes("application/json") ? ((await response.json()) as T) : null;
    return { response, data };
  }

  throw new Error(`OTP endpoint returned ${lastResponse?.status ?? "no response"}`);
}

async function sendOtp(phone: string): Promise<void> {
  const mobile = normalizeMobile(phone);
  const { response } = await postOtpEndpoint(["/api/otp/send", "/api/otp/send.php"], { mobile });
  if (!response.ok) throw new Error(`OTP service returned ${response.status}`);
}

async function verifyOtp(code: string): Promise<boolean> {
  const { response, data } = await postOtpEndpoint<{ verified?: boolean }>(
    ["/api/otp/verify", "/api/otp/verify.php"],
    { code },
  );
  if (!response.ok) return false;
  return data?.verified === true;
}

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
  const [phone, setPhone] = useState("+91 ");
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
      await sendOtp(phone);
      toast.success("OTP sent via WhatsApp");
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
      const ok = await verifyOtp(code);
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
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").replace(/^91/, "").slice(0, 10);
                  setPhone(`+91 ${digits}`);
                }}
                required
                inputMode="tel"
                maxLength={20}
                className="input-base pl-9"
                placeholder="+91 98XXXXXXXX"
              />
            </div>
          </label>
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
              Sent to {phone} via WhatsApp.
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
