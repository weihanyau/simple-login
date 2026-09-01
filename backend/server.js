const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT ?? 3001;
const CORS_ORIGIN = (
  process.env.CORS_ORIGIN ?? "http://localhost:4321"
).split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const USERS = {
  demo: { password: "password123", displayName: "Demo User", role: "user" },
  admin: { password: "admin123", displayName: "Admin User", role: "admin" },
};

const sessions = new Map(); // token -> username
let nextTokenId = 1;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);

function getSessionUser(req) {
  const auth = req.headers.authorization ?? "";
  const [scheme, token] = auth.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  const username = sessions.get(token);
  if (!username) return null;
  const user = USERS[username];
  if (!user) return null;
  return { username, ...user, password: undefined };
}

// --- Pre-auth (public) endpoints ---

app.get("/api/public/info", (req, res) => {
  res.json({
    message: "Welcome to the public API. Log in to see secret data.",
    serverTime: new Date().toISOString(),
    stats: {
      totalUsers: Object.keys(USERS).length,
      activeSessions: sessions.size,
    },
  });
});

app.post("/api/public/contact", (req, res) => {
  const { name, email, message, origin } = req.body || {};
  const back = origin || "javascript:history.back()";
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  if (!name || !email || !message) {
    return res.status(400).send(`<!DOCTYPE html><html><head><title>Contact Error</title><style>body{font-family:system-ui,sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem}.error{color:#c0392b;font-weight:600}a{display:inline-block;margin-top:1rem;text-decoration:none;padding:0.5rem 1rem;background:#c0392b;color:#fff;border-radius:4px}</style></head><body><h1>Contact Form</h1><p class="error">Error: name, email, and message are all required.</p><a href="${esc(back)}">Back to form</a></body></html>`);
  }

  if (typeof name !== "string" || typeof email !== "string" || typeof message !== "string") {
    return res.status(400).send(`<!DOCTYPE html><html><head><title>Contact Error</title><style>body{font-family:system-ui,sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem}.error{color:#c0392b;font-weight:600}a{display:inline-block;margin-top:1rem;text-decoration:none;padding:0.5rem 1rem;background:#c0392b;color:#fff;border-radius:4px}</style></head><body><h1>Contact Form</h1><p class="error">Error: name, email, and message must be strings.</p><a href="${esc(back)}">Back to form</a></body></html>`);
  }

  if (name.trim().length === 0 || email.trim().length === 0 || message.trim().length === 0) {
    return res.status(400).send(`<!DOCTYPE html><html><head><title>Contact Error</title><style>body{font-family:system-ui,sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem}.error{color:#c0392b;font-weight:600}a{display:inline-block;margin-top:1rem;text-decoration:none;padding:0.5rem 1rem;background:#c0392b;color:#fff;border-radius:4px}</style></head><body><h1>Contact Form</h1><p class="error">Error: name, email, and message must not be empty.</p><a href="${esc(back)}">Back to form</a></body></html>`);
  }

  const serverTime = new Date().toISOString();

  res.send(`<!DOCTYPE html>
<html>
<head><title>Contact Confirmation</title>
<style>body{font-family:system-ui,sans-serif;max-width:600px;margin:2rem auto;padding:0 1rem}pre{background:#f6f6f6;padding:.75rem;border-radius:4px;overflow-x:auto}.success{color:#2c7a39;font-weight:600}a{display:inline-block;margin-top:1rem;text-decoration:none;padding:0.5rem 1rem;background:#2c7a39;color:#fff;border-radius:4px}</style>
</head>
<body>
<h1>Contact Confirmation</h1>
<p class="success">Your message has been received!</p>
<pre>${esc(JSON.stringify({ received: true, data: { name: name.trim(), email: email.trim(), message: message.trim() }, serverTime }, null, 2))}</pre>
<a href="${esc(back)}">Back to form</a>
</body>
</html>`);
});

app.post("/api/login", (req, res) => {
    console.log(req.body);
  const { username, password } = req.body || {};
  const user = USERS[username];

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = `token_${nextTokenId++}_${Date.now()}`;
  sessions.set(token, username);

  res.json({
    message: "Logged in successfully",
    token,
    user: { username, displayName: user.displayName, role: user.role },
  });
});

// --- Post-auth (protected) endpoints ---

function requireAuth(req, res, next) {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  req.sessionUser = sessionUser;
  next();
}

app.post("/api/logout", requireAuth, (req, res) => {
  sessions.delete(req.headers.authorization.split(" ")[1]);
  res.json({ message: "Logged out successfully" });
});

app.get("/api/me", requireAuth, (req, res) => {
  res.json({ user: req.sessionUser });
});

app.get("/api/private/dashboard", requireAuth, (req, res) => {
  res.json({
    message: `Secret dashboard for ${req.sessionUser.displayName}`,
    loginCount: sessions.size,
    secretItems: [
      { id: 1, name: "Classified Report A", level: "top-secret" },
      { id: 2, name: "Hidden Treasure Map", level: "secret" },
      { id: 3, name: "Recipe for Success", level: "confidential" },
    ],
  });
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
  console.log(`[debug] PORT=${PORT}`);
  console.log(`[debug] CORS_ORIGIN=${JSON.stringify(CORS_ORIGIN)}`);
  console.log(`[debug] auth mode: Authorization Bearer header`);
});
