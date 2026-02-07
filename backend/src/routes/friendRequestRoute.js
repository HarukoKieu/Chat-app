import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
} from "../controllers/friendRequestController.js";

import { param } from "express-validator";
import { validate } from "../middlewares/validate.js";

const router = express.Router();

router.post("/", authMiddleware, sendFriendRequest);
router.patch(
  "/:id/accept",
  authMiddleware,
  param("id").isMongoId(),
  validate,
  acceptFriendRequest,
);
router.delete(
  "/:id/decline",
  authMiddleware,
  param("id").isMongoId(),
  validate,
  declineFriendRequest,
);
router.get("/", authMiddleware, getFriendRequests);

export default router;
