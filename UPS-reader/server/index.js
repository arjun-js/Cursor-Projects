import cors from "cors";
import express from "express";
import https from "https";
import { upsHosts } from "./ups-hosts.js";

const PORT = process.env.PORT || 8800;
const app = express();

app.use(cors());
app.use(express.json());

const sessions = new Map();

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "ups-reader-server" });
});

app.get("/api/ups", (_req, res) => {
  res.json(
    upsHosts.map((h) => ({
      id: h.id,
      name: h.name,
      baseUrl: h.baseUrl,
      statusPath: h.status?.path ?? "/status",
      loginPath: h.login?.path ?? "/login",
    }))
  );
});

app.post("/api/ups/:id/login", async (req, res) => {
  const host = upsHosts.find((h) => h.id === req.params.id);
  if (!host) return res.status(404).json({ ok: false, error: "Unknown UPS id" });

  const { username, password, baseUrl } = req.body ?? {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, error: "username and password required" });
  }

  const effectiveBaseUrl = normalizeBaseUrl(baseUrl) ?? host.baseUrl;
  const loginUrl = new URL(host.login.path, effectiveBaseUrl).toString();
  const body = new URLSearchParams({
    [host.login.usernameField]: username,
    [host.login.passwordField]: password,
    ...(host.login.extraFields ?? {}),
  });

  try {
    const r = await fetch(loginUrl, {
      method: host.login.method ?? "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      redirect: "manual",
      ...(agentOptionForUrl(loginUrl)),
    });

    const setCookie = r.headers.getSetCookie?.() ?? r.headers.get("set-cookie");
    const cookies = normalizeSetCookie(setCookie);

    if (cookies.length > 0) {
      sessions.set(host.id, {
        cookie: cookies.map((c) => c.split(";")[0]).join("; "),
        loggedInAt: Date.now(),
      });
    }

    res.json({
      ok: true,
      status: r.status,
      hasCookie: cookies.length > 0,
      baseUrl: effectiveBaseUrl,
      note:
        cookies.length > 0
          ? "Login cookie stored"
          : "No Set-Cookie received. You may need to adjust login path/fields/method in server/ups-hosts.js",
    });
  } catch (e) {
    res.status(502).json({ ok: false, error: e?.message ?? "Login request failed" });
  }
});

app.post("/api/ups/:id/logout", (req, res) => {
  const host = upsHosts.find((h) => h.id === req.params.id);
  if (!host) return res.status(404).json({ ok: false, error: "Unknown UPS id" });
  sessions.delete(host.id);
  res.json({ ok: true });
});

app.get("/api/ups/:id/status", async (req, res) => {
  const host = upsHosts.find((h) => h.id === req.params.id);
  if (!host) return res.status(404).json({ ok: false, error: "Unknown UPS id" });

  const effectiveBaseUrl = normalizeBaseUrl(req.query?.baseUrl) ?? host.baseUrl;
  const statusUrl = new URL(host.status.path, effectiveBaseUrl).toString();
  const session = sessions.get(host.id);
  if (!session?.cookie) {
    return res.status(401).json({ ok: false, error: "Not logged in to this UPS yet" });
  }

  try {
    const r = await fetch(statusUrl, {
      method: host.status.method ?? "GET",
      headers: {
        Cookie: session.cookie,
        Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      },
      redirect: "manual",
      ...(agentOptionForUrl(statusUrl)),
    });

    const contentType = r.headers.get("content-type") ?? "";
    const text = await r.text();

    res.json({
      ok: r.ok,
      status: r.status,
      contentType,
      fetchedAt: Date.now(),
      baseUrl: effectiveBaseUrl,
      preview: text.slice(0, 2000),
      hint:
        r.status === 401 || r.status === 403
          ? "Looks like session is invalid; re-login for this UPS"
          : undefined,
    });
  } catch (e) {
    res.status(502).json({ ok: false, error: e?.message ?? "Status request failed" });
  }
});

app.listen(PORT, () => {
  console.log(`UPS Reader API listening on http://localhost:${PORT}`);
});

function normalizeSetCookie(setCookieHeader) {
  if (!setCookieHeader) return [];
  if (Array.isArray(setCookieHeader)) return setCookieHeader;
  // Some environments join multiple cookies in one header; we keep it simple here.
  return [setCookieHeader];
}

function agentOptionForUrl(url) {
  const u = new URL(url);
  const allowInsecure = (process.env.UPS_INSECURE_TLS ?? "").toLowerCase() === "true";
  if (u.protocol !== "https:" || !allowInsecure) return {};
  return { agent: new https.Agent({ rejectUnauthorized: false }) };
}

function normalizeBaseUrl(input) {
  if (!input || typeof input !== "string") return null;
  const raw = input.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    u.pathname = "/";
    u.search = "";
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

