import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "3d";
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

export const signUp = async (request, response) => {
  try {
    let { username, password, email, name, surname } = request.body;

    username = username?.trim();
    password = password?.trim();
    email = email?.trim();
    name = name?.trim();
    surname = surname?.trim();

    if (!username || !password || !email || !name || !surname) {
      return response.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return response
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const existingUserName = await User.findOne({
      username: username.toLowerCase(),
    });

    if (existingUserName) {
      return response.status(409).json({ message: "Username already exists" });
    }

    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingEmail) {
      return response.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username: username.toLowerCase(),
      hashedPassword,
      email: email.toLowerCase(),
      displayName: `${surname} ${name}`.trim(),
    });

    // ===== AUTO LOGIN PART =====

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await Session.create({
      userId: user._id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    response.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

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
    console.error("Error while calling signUp", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const signIn = async (request, response) => {
  try {
    let { username, password } = request.body;

    username = username?.trim();
    password = password?.trim();

    if (!username || !password) {
      return response.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return response
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const user = await User.findOne({ username: username.toLowerCase() });

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

    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    const refreshToken = createRefreshToken();
    const refreshTokenHash = hashToken(refreshToken);

    await Session.create({
      userId: user._id,
      refreshTokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    response.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

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
    console.error("Error while calling signIn", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const signOut = async (request, response) => {
  try {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    const refreshTokenHash = hashToken(refreshToken);

    await Session.deleteOne({ refreshTokenHash });

    response.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return response.sendStatus(204);
  } catch (error) {
    console.error("Error while calling signOut", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const refreshToken = async (request, response) => {
  try {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      return response.status(401).json({ message: "Refresh token not found" });
    }

    const refreshTokenHash = hashToken(refreshToken);

    const session = await Session.findOne({ refreshTokenHash });

    if (!session) {
      return response
        .status(403)
        .json({ message: "Refresh token invalid or expired" });
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await Session.deleteOne({ _id: session._id });
      return response.status(403).json({ message: "Refresh token expired" });
    }

    const newAccessToken = jwt.sign(
      { userId: session.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL },
    );

    const newRefreshToken = createRefreshToken();
    const newRefreshTokenHash = hashToken(newRefreshToken);

    session.refreshTokenHash = newRefreshTokenHash;
    session.expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL);
    await session.save();

    response.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });

    return response.status(200).json({
      message: "Token refreshed",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Error while calling refreshToken", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};
