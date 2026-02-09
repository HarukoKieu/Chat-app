import bcrypt from "bcrypt";
import User from "../models/User.js";
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

    if (password.length < 8) {
      return response.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return response.status(409).json({
        message:
          existingUser.username === username
            ? "Username already exists"
            : "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${surname} ${name}`.trim(),
    });

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

    if (!session) {
      return response
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await Session.deleteOne({ _id: session._id });
      return response.status(403).json({ message: "Refresh token expired" });
    }

    const newAccessToken = createAccessToken(session.userId);
    const newRefreshToken = createRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    session.refreshTokenHash = newRefreshTokenHash;
    session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);

    await session.save();

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
