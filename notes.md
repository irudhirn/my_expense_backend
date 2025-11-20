# Authentication with Access Token & Refresh Token

## Backend

1. Folder Structure

backend/
 ┣ controllers/
 ┃ ┗ authController.js
 ┣ models/
 ┃ ┗ User.js
 ┣ routes/
 ┃ ┗ authRoutes.js
 ┣ server.js
 ┗ .env

----------------------------------------

2. Install Dependencies

npm install express mongoose bcryptjs jsonwebtoken dotenv cookie-parser cors

----------------------------------------

3. UserModel.js

import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  refreshToken: { type: String } // store latest refresh token
});

export default mongoose.model("User", userSchema);


----------------------------------------

4. authController.js

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

export const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashed });
    res.status(201).json({ message: "User created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    // Store refresh token in cookie (HTTPOnly)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) return res.sendStatus(403);

    const newAccessToken = generateAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.sendStatus(403);
  }
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (token) {
    const decoded = jwt.decode(token);
    await User.findByIdAndUpdate(decoded.id, { refreshToken: null });
  }
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};

----------------------------------------

5. userRoutes.js

import express from "express";
import { register, login, refresh, logout } from "../controllers/authController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/refresh", refresh);
router.post("/logout", logout);

export default router;

----------------------------------------

6. server.js

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/api/auth", authRoutes);

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected");
  app.listen(5000, () => console.log("Server running on port 5000"));
});

||||||||||||||||||||||||||||||||||||||||||||||||||||||||
||||||||||||||||||||||||||||||||||||||||||||||||||||||||

## Frontend

1. api.js

// api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // important for cookies
});

export default api;

----------------------------------------

2. Login.js

import React, { useState } from "react";
import api from "./api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", res.data.accessToken);
  };

  return (
    <form onSubmit={handleLogin}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button type="submit">Login</button>
    </form>
  );
}

----------------------------------------

3. Auto Refresh Access Token (Axios Interceptor)

// setupAxios.js
import api from "./api";

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const res = await api.get("/auth/refresh");
      localStorage.setItem("accessToken", res.data.accessToken);
      api.defaults.headers.common["Authorization"] = `Bearer ${res.data.accessToken}`;
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

----------------------------------------

4. Protected Request Example

const token = localStorage.getItem("accessToken");
const res = await api.get("/user/profile", {
  headers: { Authorization: `Bearer ${token}` },
});

||||||||||||||||||||||||||||||||||||||||||||||||||||||||
||||||||||||||||||||||||||||||||||||||||||||||||||||||||

## Authentication

(Prompt - what are possible ways to implement authentication - like with JWT, with Access & Refresh Tokens, with sessions, etc?)

1. Cookie-Based Session Authentication (Server-Managed Sessions)

How it works:

After login, the server creates a session and stores it in memory/DB.

The server sends a session ID to the client in a secure cookie.

On each request, the cookie is sent to the server and the server validates the session.

Pros

Very secure (server controls session lifecycle).

Easy to revoke sessions.

Works well with same-domain apps.

Cons

Requires server-side storage (scales worse for very large systems unless using distributed stores like Redis).

Somewhat harder in cross-domain / mobile use cases.

Typical stack:
Express + express-session, Django sessions, Rails sessions.

----------------------------------------

2. JWT (JSON Web Token) Authentication – Stateless

How it works:

After login, the server creates a signed JWT containing user claims.

The client stores the token (usually in memory or secure HTTP-only cookie).

On each request, the client sends the token (usually in Authorization: Bearer ...).

The server verifies the signature; no DB lookup required.

Pros

Stateless → excellent for microservices and scalability.

Works well with mobile apps, APIs, cross-domain setups.

Self-contained access information.

Cons

Harder to revoke tokens.

If long-lived, risk increases.

Requires secure storage on client side (don’t put in localStorage).

Typical use cases:
REST APIs, serverless apps, SPAs.

----------------------------------------

3. Access + Refresh Token System (Hybrid JWT or opaque tokens)

How it works:

Short-lived Access Token (minutes) for API access.

Long-lived Refresh Token (days/weeks) used only to get new access tokens.

Refresh token is stored securely (HTTP-only cookie or secure storage).

Server validates refresh tokens (either stateless or stored in DB).

Pros

Revocation becomes possible (refresh token store).

More secure than long-lived access tokens.

Works well for large distributed systems.

Cons

More moving parts: refresh endpoints, rotation logic.

Still must handle theft of refresh tokens.

Common stacks:
Auth0, Firebase Auth, AWS Cognito, modern OAuth2 implementations.

----------------------------------------

4. OAuth 2.0 / OpenID Connect (third-party or internal)

How it works:

Delegates authentication to an identity provider (Google, Azure AD, GitHub, etc.).

Application only receives tokens (ID Token, Access Token, Refresh Token).

Pros

No password handling.

Enterprise-grade security.

Works across many platforms.

Cons

More complex initial setup.

Requires understanding OAuth/OIDC flows.

Common use cases:
Corporate SSO, "Sign in with Google", multi-tenant apps.

----------------------------------------

5. API Keys

How it works:

The server issues API keys to clients (apps, devices).

Clients include the key in headers for each request.

Pros

Simple, stable.

Good for machine-to-machine APIs.

Cons

No user identity by default (unless tied to a user).

Hard to rotate without downtime.

Must be kept secret.

----------------------------------------

6. Mutual TLS (mTLS)

How it works:

Both client and server provide TLS certificates.

Server verifies the client’s certificate for authentication.

Pros

Extremely strong security.

Great for internal service-to-service authentication.

Cons

Complex certificate management.

Not practical for public consumers.

----------------------------------------

7. One-Time Passwords (OTP) / Magic Links

How it works:

Users authenticate using a code (SMS/email/Authenticator) or a magic link.

Often used as primary auth or as second factor.

Pros

No passwords to remember.

Good UX.

Cons

Vulnerable to SIM-swap (SMS).

Email delivery delays reduce UX.

----------------------------------------

8. Passwordless Authentication (WebAuthn / Passkeys)

How it works:

Uses public-key cryptography built into devices (TouchID, Windows Hello, security keys).

No password required.

Pros

Extremely secure (phishing-resistant).

Becoming the industry standard.

Cons

Browser/device support is still evolving (but now widely supported).

Can be more complex to implement.

----------------------------------------

⭐ Choosing the Right Method

| Use Case                  | Best Options                 |
| ------------------------- | ---------------------------- |
| SPA + backend API         | Access/Refresh Tokens or JWT |
| Machine-to-machine        | API Keys or mTLS             |
| Enterprise app            | OAuth2 / OIDC (SSO)          |
| Simple monolithic website | Cookie-based sessions        |
| Mobile apps               | Access + Refresh Tokens      |
| Highest security          | WebAuthn / Passkeys          |

||||||||||||||||||||||||||||||||||||||||||||||||||||||||
||||||||||||||||||||||||||||||||||||||||||||||||||||||||

## Architectures & Examples for above

Great — here are all the extras you asked for:

✔ Architecture diagrams (ASCII)
✔ Example implementations (Node.js + Express, plus generic pseudocode)
✔ Comparison tables
✔ Recommended storage practices
✔ Security notes

If you want code in another language (Go, Python, Java, Rust), tell me.

1. Architecture Diagrams

A) Cookie-Based Session Authentication
+---------+        1. POST /login (credentials)
| Client  | ----------------------------->
+---------+        2. Server validates credentials
                     and creates a Session ID in DB
                  3. Set-Cookie: sessionId=abc123 (HttpOnly)
<------------------------------
               4. GET /resource (with session cookie)
----------------------------->
               5. Server looks up sessionId in DB
<-----------------------------   return protected data

B) Stateless JWT Authentication
Client → POST /login → Server
Server validates → signs JWT → Client stores token
Client → GET /api (Authorization: Bearer <JWT>)
Server → verifies signature → returns data

+---------+       Authorization: Bearer eyJhbGciOi...
| Client  | ---------------------------------------->
+---------+             Server checks signature
                      No DB lookup required
<--------------------------------------------------  data

C) Access + Refresh Tokens
            +----------------------+
            |   Auth Server        |
            +----------------------+

[1] Login → get:
    Access Token (short life, e.g., 10m)
    Refresh Token (long life, e.g., 30d)

[2] Access protected route using Access Token

[3] When expired:
    Send Refresh Token → get new Access Token

Client                         Server
  | POST /login ---------------> |
  | <--- AT + RT (cookie) ------ |
  | GET /data (AT) ------------> |
  | <- data ---------------------|
  | POST /refresh (RT) --------> |
  | <- new AT ------------------ |

----------------------------------------

2. Example Implementations
A) Cookie-Based Session (Node.js + Express)
import express from "express";
import session from "express-session";

const app = express();

app.use(session({
  secret: "super-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  }
}));

app.post("/login", (req, res) => {
  // Validate credentials...
  req.session.userId = user.id;
  res.send("Logged in");
});

app.get("/protected", (req, res) => {
  if (!req.session.userId) return res.status(401).send("Not authorized");
  res.send("Protected data");
});

B) Pure JWT Auth (Node.js)
import jwt from "jsonwebtoken";
import express from "express";

const app = express();
const SECRET = "jwt-secret";

app.post("/login", (req, res) => {
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "1h" });
  res.json({ token });
});

function auth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header) return res.sendStatus(401);

  const token = header.split(" ")[1];
  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get("/protected", auth, (req, res) => {
  res.json({ message: "Secret stuff" });
});

C) Access + Refresh Tokens (Node.js)
import jwt from "jsonwebtoken";
import express from "express";

const app = express();
const ACCESS_SECRET = "access";
const REFRESH_SECRET = "refresh";

const refreshStore = new Set(); // could be Redis/DB

app.post("/login", (req, res) => {
  const accessToken = jwt.sign({ id: user.id }, ACCESS_SECRET, { expiresIn: "10m" });
  const refreshToken = jwt.sign({ id: user.id }, REFRESH_SECRET, { expiresIn: "30d" });

  refreshStore.add(refreshToken);

  res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: true });
  res.json({ accessToken });
});

app.post("/refresh", (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token || !refreshStore.has(token)) return res.sendStatus(403);

  jwt.verify(token, REFRESH_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);

    const newAccess = jwt.sign({ id: user.id }, ACCESS_SECRET, { expiresIn: "10m" });
    res.json({ accessToken: newAccess });
  });
});

----------------------------------------

3. Comparison Table

High-Level Overview

| Method                      | Stateless? | Best For            | Pros                           | Cons                        |
| --------------------------- | ---------- | ------------------- | ------------------------------ | --------------------------- |
| **Cookie Sessions**         | ❌ No       | Websites            | Easy to revoke, secure cookies | Requires server storage     |
| **JWT**                     | ✔ Yes      | APIs, SPAs          | Scalable, fast                 | Harder to revoke            |
| **Access + Refresh Tokens** | ✔ Mostly   | Mobile + Web        | Safer, revocable               | More complex                |
| **OAuth2/OIDC**             | ✔ Yes      | SSO, enterprise     | No password handling           | Heavy setup                 |
| **API Keys**                | ✔ Yes      | Machine-to-machine  | Simple                         | Not user-specific           |
| **WebAuthn / Passkeys**     | ✔ Yes      | High-security apps  | Phishing-proof                 | New tech, UX learning curve |
| **OTP/Magic Links**         | Varies     | User-friendly login | No password                    | SMS/email weaknesses        |

----------------------------------------

4. Where to Store Tokens / Cookies (Correct & Safe Options)
Browser

| Storage                  | Safe?                                      | Notes                  |
| ------------------------ | ------------------------------------------ | ---------------------- |
| **HttpOnly Cookie**      | ✅ Best                                     | Protects from XSS      |
| **Memory (JS variable)** | ✔ If short-lived                           | Good for access tokens |
| **localStorage**         | ❌ No                                       | Vulnerable to XSS      |
| **sessionStorage**       | ⚠ Better than localStorage, still XSS risk |                        |

Mobile Apps

Secure storage: Keychain (iOS), Keystore (Android)

Never store refresh tokens in plain text

----------------------------------------

5. Recommended Strategies
🌐 Web Apps (React + API)

Best: Access token (in memory) + refresh token (HttpOnly cookie)

📱 Mobile Apps

Best: Access + refresh tokens stored in secure storage

🧱 Traditional monolithic websites

Best: Cookie-based server sessions

🏢 Enterprise / Multi-tenant / B2B

Best: OAuth2 + OpenID Connect (Google, Azure, Okta, Auth0)

🔒 High-security apps

Best: WebAuthn / Passkeys

----------------------------------------

6. Want More?

I can also provide:

🔧 Code examples for:

React: token handling & interceptors

Next.js: server-side sessions or JWT auth

Go, Python, Rust implementations

Database schemas for refresh-token rotation

📚 Deep dives:

Token revocation strategies

How to implement sliding sessions

Zero-trust architecture patterns

Comparison of HMAC vs RSA-signed JWTs