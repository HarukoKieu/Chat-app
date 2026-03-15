import bcrypt from "bcrypt";
import User from "../models/User.js";
import Session from "../models/Session.js";
import validator from "validator";
import Session from "../models/Session.js";

import {
  createAccessToken,
  createRefreshToken,
  hashToken,
  setRefreshCookie,
  REFRESH_TOKEN_TTL,
} from "../utils/authUtils.js";

import { createSession } from "../services/sessionService.js";

// ================= SIGN UP =================
export const signUp = async (request, response) => {
  try {
    let { username, password, email, name, surname } = request.body;

    username = username?.trim().toLowerCase();
    password = password?.trim();
    email = email?.trim().toLowerCase();
    name = name?.trim();
    surname = surname?.trim();

    if (!username || !password || !email || !name || !surname) {
      return response.status(400).json({ message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return response.status(400).json({
        message: "Invalid email format",
      });
    }

    if (email.length > 255) {
      return response.status(400).json({
        message: "Email too long",
      });
    }

    if (password.length < 8) {
      return response.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${surname} ${name}`.trim(),
    });

    // AUTO LOGIN
    const accessToken = createAccessToken(user._id);
    const refreshToken = await createSession(user._id);

    setRefreshCookie(response, refreshToken);

    return response.status(201).json({
      message: "Signup & login successful",
      accessToken,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("signUp error:", error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return response.status(409).json({ message: `${field} already exists` });
    }
    return response.status(500).json({ message: "Internal server error" });
  }
};

// ================= SIGN IN =================
export const signIn = async (request, response) => {
  try {
    let { username, password } = request.body;

    username = username?.trim().toLowerCase();
    password = password?.trim();

    if (!username || !password) {
      return response.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return response
        .status(401)
        .json({ message: "Username or password incorrect" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return response
        .status(401)
        .json({ message: "Username or password incorrect" });
    }

    const accessToken = createAccessToken(user._id);
    const refreshToken = await createSession(user._id);

    setRefreshCookie(response, refreshToken);

    return response.status(200).json({
      message: `User ${user.displayName} logged in`,
      accessToken,
      user: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error("signIn error:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

// ================= SIGN OUT =================
export const signOut = async (request, response) => {
  try {
    const token = request.cookies?.refreshToken;

    if (!token) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const refreshTokenHash = hashToken(token);

    await Session.deleteOne({ refreshTokenHash });

    response.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return response.sendStatus(204);
  } catch (error) {
    console.error("signOut error:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

// ================= REFRESH TOKEN =================
export const refreshToken = async (request, response) => {
  try {
    const token = request.cookies?.refreshToken;

    if (!token) {
      return response.status(401).json({ message: "Refresh token not found" });
    }

    const refreshTokenHash = hashToken(token);

    const session = await Session.findOne({ refreshTokenHash });

    // 🔥 CASE 1: Token not found → possible reuse attack
    if (!session) {
      console.warn("⚠️ Possible refresh token reuse detected");

      response.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      return response.status(403).json({
        message: "Invalid or reused refresh token",
      });
    }

    // 🔥 CASE 2: Token revoked → reuse detected
    if (session.isRevoked) {
      console.warn("🚨 Reuse detected. Killing all sessions.");

      await Session.deleteMany({ userId: session.userId });

      response.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      return response.status(403).json({
        message: "Session compromised. Logged out from all devices.",
      });
    }

    // 🔥 CASE 3: Expired
    if (session.expiresAt.getTime() < Date.now()) {
      await Session.deleteOne({ _id: session._id });

      return response.status(403).json({
        message: "Refresh token expired",
      });
    }

    // 🔥 ROTATION LOGIC

    session.isRevoked = true;
    await session.save();

    const newRefreshToken = createRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await Session.create({
      userId: session.userId,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    const newAccessToken = createAccessToken(session.userId);

    setRefreshCookie(response, newRefreshToken);

    return response.status(200).json({
      message: "Token refreshed",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("refreshToken error:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

// ================= LOGOUT ALL DEVICES =================
export const logoutAllDevices = async (request, response) => {
  try {
    const userId = request.user?.userId;

    if (!userId) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    // Delete all sessions of this user
    await Session.deleteMany({ userId });

    // Clear refresh cookie on current device
    response.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return response.status(200).json({
      message: "Logged out from all devices",
    });
  } catch (error) {
    console.error("logoutAllDevices error:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};
