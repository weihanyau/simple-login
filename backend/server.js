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
app.use(
  cors({
    origin: CORS_ORIGIN,
    // Authorization header is not a credentialed request; no cookies involved
    credentials: false,
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

app.post("/api/login", (req, res) => {
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
