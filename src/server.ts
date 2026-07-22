import "./lib/error-capture";
import { randomInt, randomUUID } from "node:crypto";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  if (process.env.NODE_ENV !== "production") {
    console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  }
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

// Enhanced OTP system with rate limiting and security improvements
interface OTPChallenge {
  code: string;
  expiresAt: number;
  attempts: number;
  lastAttemptAt: number;
  mobile: string;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const otpChallenges = new Map<string, OTPChallenge>();
const rateLimits = new Map<string, RateLimitEntry>(); // IP-based rate limiting
const phoneRateLimits = new Map<string, RateLimitEntry>(); // Phone-based rate limiting

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 3;
const MAX_ATTEMPTS_PER_CHALLENGE = 3;
const COOLDOWN_TIME = 5 * 60 * 1000; // 5 minutes cooldown after max attempts

function getClientIP(request: Request): string {
  // Try various headers for the real IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) return realIP;
  if (cfConnectingIP) return cfConnectingIP;
  
  // Fallback to a hash of the request if no IP found
  return "unknown-" + request.headers.get("user-agent")?.slice(0, 20) || "unknown";
}

function checkRateLimit(identifier: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const entry = rateLimits.get(identifier);
  
  if (!entry || now > entry.resetAt) {
    // Create new entry or reset expired one
    rateLimits.set(identifier, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }
  
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true };
}

function checkPhoneRateLimit(phone: string): { allowed: boolean; resetAt?: number } {
  const now = Date.now();
  const entry = phoneRateLimits.get(phone);
  
  if (!entry || now > entry.resetAt) {
    phoneRateLimits.set(phone, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW
    });
    return { allowed: true };
  }
  
  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, resetAt: entry.resetAt };
  }
  
  entry.count++;
  return { allowed: true };
}

function isSecureEnvironment(): boolean {
  // Check if running in production/secure environment
  return process.env.NODE_ENV === "production" || 
         process.env.SECURE_COOKIES === "true" ||
         process.env.HTTPS === "true";
}

async function handleOtpSend(request: Request): Promise<Response> {
  let payload: { mobile?: unknown };
  try {
    payload = (await request.json()) as { mobile?: unknown; otp?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (typeof payload.mobile !== "string" || !/^\d{10}$/.test(payload.mobile)) {
    return Response.json({ error: "Invalid mobile number" }, { status: 400 });
  }

  // Check IP-based rate limiting
  const clientIP = getClientIP(request);
  const ipRateLimit = checkRateLimit(clientIP);
  if (!ipRateLimit.allowed) {
    const retryAfter = Math.ceil((ipRateLimit.resetAt! - Date.now()) / 1000);
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { 
        status: 429,
        headers: { "Retry-After": retryAfter.toString() }
      }
    );
  }

  // Check phone-based rate limiting
  const phoneRateLimit = checkPhoneRateLimit(payload.mobile);
  if (!phoneRateLimit.allowed) {
    const retryAfter = Math.ceil((phoneRateLimit.resetAt! - Date.now()) / 1000);
    return Response.json(
      { error: "Too many OTP requests for this number. Please try again later." },
      { 
        status: 429,
        headers: { "Retry-After": retryAfter.toString() }
      }
    );
  }

  const challengeId = randomUUID();
  const otp = String(randomInt(100000, 1000000));
  
  otpChallenges.set(challengeId, {
    code: otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
    lastAttemptAt: Date.now(),
    mobile: payload.mobile
  });
  
  const apiKey =
    process.env.CLOUD_WHATSAPP_API_KEY ??
    process.env.VITE_CLOUD_WHATSAPP_API_KEY ??
    "67fd47ab51b34699a1822c669b5d3f99";
  
  const params = new URLSearchParams({
    apikey: apiKey,
    mobile: payload.mobile,
    msg: `OTP ${otp}`,
  });

  const response = await fetch("https://web.cloudwhatsapp.com/wapp/api/send", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params,
  });
  const responseBody = await response.text();

  // Enhanced cookie security
  const isSecure = isSecureEnvironment();
  const cookieAttributes = [
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    "Max-Age=300",
    isSecure ? "Secure" : ""
  ].filter(Boolean).join("; ");

  return new Response(responseBody, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "text/plain",
      ...(response.ok
        ? {
            "set-cookie": `zaxia_otp_challenge=${challengeId}; ${cookieAttributes}`,
          }
        : {}),
    },
  });
}

async function handleOtpVerify(request: Request): Promise<Response> {
  let payload: { code?: unknown };
  try {
    payload = (await request.json()) as { code?: unknown };
  } catch {
    return Response.json({ verified: false }, { status: 400 });
  }

  const challengeId = request.headers.get("cookie")?.match(/zaxia_otp_challenge=([^;]+)/)?.[1];
  const challenge = challengeId ? otpChallenges.get(challengeId) : undefined;
  
  // Check if challenge exists and is not expired
  if (!challenge) {
    return Response.json({ verified: false, error: "Invalid or expired session" }, { status: 400 });
  }

  // Check if too many attempts
  if (challenge.attempts >= MAX_ATTEMPTS_PER_CHALLENGE) {
    const cooldownRemaining = Math.ceil((challenge.lastAttemptAt + COOLDOWN_TIME - Date.now()) / 1000);
    if (cooldownRemaining > 0) {
      otpChallenges.delete(challengeId);
      return Response.json(
        { verified: false, error: "Too many attempts. Please request a new OTP." },
        { status: 429, headers: { "Retry-After": cooldownRemaining.toString() } }
      );
    }
  }

  // Check if challenge is expired
  if (challenge.expiresAt < Date.now()) {
    otpChallenges.delete(challengeId);
    return Response.json({ verified: false, error: "OTP expired. Please request a new one." }, { status: 400 });
  }

  // Update attempt tracking
  challenge.attempts++;
  challenge.lastAttemptAt = Date.now();
  otpChallenges.set(challengeId, challenge);

  const verified =
    typeof payload.code === "string" &&
    /^\d{6}$/.test(payload.code) &&
    challenge.code === payload.code;

  if (verified) {
    otpChallenges.delete(challengeId);
  }

  return Response.json({ verified }, { status: verified ? 200 : 400 });
}

// Security headers configuration
function getSecurityHeaders(): Headers {
  const headers = new Headers();
  
  // Content Security Policy - Restricts sources of content
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "connect-src 'self' https://*.supabase.co https://web.cloudwhatsapp.com wss://*.supabase.co",
    "frame-src 'self' https://www.google.com",
    "media-src 'self' https: blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];
  
  headers.set("Content-Security-Policy", cspDirectives.join("; "));
  
  // HTTPS enforcement
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  
  // Prevent clickjacking
  headers.set("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  headers.set("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  headers.set("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Permissions policy
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  
  return headers;
}

function applySecurityHeaders(response: Response): Response {
  const securityHeaders = getSecurityHeaders();
  
  // Apply security headers to response
  securityHeaders.forEach((value, key) => {
    if (!response.headers.has(key)) {
      response.headers.set(key, value);
    }
  });
  
  return response;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      
      // Apply HTTPS redirect in production
      if (process.env.NODE_ENV === "production" && url.protocol === "http:") {
        const httpsUrl = new URL(url.toString());
        httpsUrl.protocol = "https:";
        return Response.redirect(httpsUrl.toString(), 301);
      }
      
      if (request.method === "POST" && url.pathname === "/api/otp/send") {
        const response = await handleOtpSend(request);
        return applySecurityHeaders(response);
      }
      if (request.method === "POST" && url.pathname === "/api/otp/verify") {
        const response = await handleOtpVerify(request);
        return applySecurityHeaders(response);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalizedResponse = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalizedResponse);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error(error);
      }
      const errorResponse = new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
      return applySecurityHeaders(errorResponse);
    }
  },
};
