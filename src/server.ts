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

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
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

const otpChallenges = new Map<string, { code: string; expiresAt: number }>();

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

  const challengeId = randomUUID();
  const otp = String(randomInt(100000, 1000000));
  otpChallenges.set(challengeId, { code: otp, expiresAt: Date.now() + 5 * 60 * 1000 });
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

  return new Response(responseBody, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "text/plain",
      ...(response.ok
        ? {
            "set-cookie": `zaxia_otp_challenge=${challengeId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=300`,
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
  const verified =
    typeof payload.code === "string" &&
    /^\d{6}$/.test(payload.code) &&
    Boolean(challenge && challenge.expiresAt > Date.now() && challenge.code === payload.code);

  if (challengeId) otpChallenges.delete(challengeId);
  return Response.json({ verified }, { status: verified ? 200 : 400 });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const url = new URL(request.url);
      if (request.method === "POST" && url.pathname === "/api/otp/send") {
        return await handleOtpSend(request);
      }
      if (request.method === "POST" && url.pathname === "/api/otp/verify") {
        return await handleOtpVerify(request);
      }
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
