import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { randomInt, randomUUID } from "node:crypto";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "whatsapp-otp-dev-proxy",
      configureServer(server) {
        const otpChallenges = new Map<string, { code: string; expiresAt: number }>();

        server.middlewares.use("/api/otp/send", async (request, response, next) => {
          if (request.method !== "POST") return next();

          const chunks: Buffer[] = [];
          request.on("data", (chunk: Buffer) => chunks.push(chunk));
          request.on("end", async () => {
            try {
              const payload = JSON.parse(Buffer.concat(chunks).toString()) as {
                mobile?: unknown;
              };
              if (typeof payload.mobile !== "string" || !/^\d{10}$/.test(payload.mobile)) {
                response.statusCode = 400;
                response.end(JSON.stringify({ error: "Invalid mobile number" }));
                return;
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
              const upstream = await fetch("https://web.cloudwhatsapp.com/wapp/api/send", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: params,
              });
              response.statusCode = upstream.status;
              if (upstream.ok) {
                response.setHeader(
                  "Set-Cookie",
                  `zaxia_otp_challenge=${challengeId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=300`,
                );
              }
              response.setHeader(
                "Content-Type",
                upstream.headers.get("content-type") ?? "text/plain",
              );
              response.end(await upstream.text());
            } catch {
              response.statusCode = 502;
              response.end(JSON.stringify({ error: "Could not reach WhatsApp service" }));
            }
          });
        });

        server.middlewares.use("/api/otp/verify", async (request, response, next) => {
          if (request.method !== "POST") return next();
          const chunks: Buffer[] = [];
          request.on("data", (chunk: Buffer) => chunks.push(chunk));
          request.on("end", () => {
            try {
              const payload = JSON.parse(Buffer.concat(chunks).toString()) as { code?: unknown };
              const challengeId = request.headers.cookie?.match(/zaxia_otp_challenge=([^;]+)/)?.[1];
              const challenge = challengeId ? otpChallenges.get(challengeId) : undefined;
              const verified =
                typeof payload.code === "string" &&
                /^\d{6}$/.test(payload.code) &&
                Boolean(
                  challenge && challenge.expiresAt > Date.now() && challenge.code === payload.code,
                );
              if (challengeId) otpChallenges.delete(challengeId);
              response.statusCode = verified ? 200 : 400;
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify({ verified }));
            } catch {
              response.statusCode = 400;
              response.end(JSON.stringify({ verified: false }));
            }
          });
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    tsconfigPaths: true,
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  server: {
    host: "::",
    port: 5173,
  },
});
