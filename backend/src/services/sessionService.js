import Session from "../models/Session.js";
import {
  createRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL,
} from "./authUtils.js";

export const createSession = async (userId) => {
  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  await Session.create({
    userId,
    refreshTokenHash,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });

  return refreshToken;
};
