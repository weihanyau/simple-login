const express = require("express");
const cookieParser = require("cookie-parser");
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
app.set("trust proxy", process.env.TRUST_PROXY === "true");
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());

function getSessionUser(req) {
  const token = req.cookies.session;
  if (!token) return null;
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

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = USERS[username];

  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const token = `token_${nextTokenId++}_${Date.now()}`;
  sessions.set(token, username);

  res.cookie("session", token, {
    httpOnly: true,
    sameSite: process.env.COOKIE_SAMESITE ?? "lax", // "none" for cross-site (requires secure)
    secure: process.env.COOKIE_SECURE === "true",
    maxAge: 1000 * 60 * 60, // 1 hour
  });

  res.json({
    message: "Logged in successfully",
    user: { username, displayName: user.displayName, role: user.role },
  });
});

// --- Post-auth (protected) endpoints ---

app.post("/api/logout", (req, res) => {
  const token = req.cookies.session;
  if (token) sessions.delete(token);
  res.clearCookie("session");
  res.json({ message: "Logged out successfully" });
});

app.get("/api/me", (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: sessionUser });
});

app.get("/api/private/dashboard", (req, res) => {
  const sessionUser = getSessionUser(req);
  if (!sessionUser) return res.status(401).json({ error: "Not authenticated" });

  res.json({
    message: `Secret dashboard for ${sessionUser.displayName}`,
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
  console.log(
    `[debug] COOKIE_SECURE=${process.env.COOKIE_SECURE ?? "(unset, default false)"}`
  );
  console.log(
    `[debug] COOKIE_SAMESITE=${process.env.COOKIE_SAMESITE ?? "(unset, default lax)"}`
  );
  console.log(`[debug] TRUST_PROXY=${process.env.TRUST_PROXY ?? "(unset, default false)"}`);
});
