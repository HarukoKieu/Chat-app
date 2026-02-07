import express from "express";
import {
  getAllFriend,
  searchFriend,
  removeFriend,
} from "../controllers/friendController.js";

const router = express.Router();

router.get("/", getAllFriend);
router.get("/search", searchFriend);
router.delete("/:friendId", removeFriend);

export default router;
