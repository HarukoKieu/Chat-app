import Friend from "../models/Friend.js";

// helper function to extract friends from friendShips array

const extractFriend = (friendShips, userId) => {
  return friendShips
    .map((f) => {
      if (f.userA && f.userA._id.toString() === userId.toString()) {
        return f.userB;
      }
      if (f.userB && f.userB._id.toString() === userId.toString()) {
        return f.userA;
      }
      return null;
    })
    .filter(Boolean);
};
export const getAllFriend = async (request, response) => {
  try {
    const userId = request.user._id;

    const friendShips = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
      isDeleted: false,
    })
      .populate("userA", "_id username avatarUrl")
      .populate("userB", "_id username avatarUrl")
      .lean();

    if (!friendShips.length) {
      return response.status(200).json({ friends: [] });
    }

    const friends = extractFriend(friendShips, userId);

    return response.status(200).json({ friends });
  } catch (error) {
    console.error("Error while calling getAllFriend", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const searchFriend = async (request, response) => {
  try {
    const { keyword = "" } = request.query;
    const userId = request.user._id;

    if (!keyword.trim()) {
      return response.status(200).json({ friends: [] });
    }

    const escapeRegex = (str) =>
      str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const safeKeyword = escapeRegex(keyword.trim());
    const friends = await Friend.aggregate([
      {
        $match: {
          isDeleted: false,
          $or: [{ userA: userId }, { userB: userId }],
        },
      },
      {
        $lookup: {
          from: "users", // tên collection MongoDB (không phải model)
          localField: "userA",
          foreignField: "_id",
          as: "userA",
        },
      },
      { $unwind: "$userA" },
      {
        $lookup: {
          from: "users",
          localField: "userB",
          foreignField: "_id",
          as: "userB",
        },
      },
      { $unwind: "$userB" },
      {
        $addFields: {
          friend: {
            $cond: [{ $eq: ["$userA._id", userId] }, "$userB", "$userA"],
          },
        },
      },
      {
        $match: {
          "friend.username": { $regex: safeKeyword, $options: "i" },
        },
      },
      {
        $project: {
          _id: "$friend._id",
          username: "$friend.username",
          avatarUrl: "$friend.avatarUrl",
        },
      },
    ]);

    return response.status(200).json({ friends });
  } catch (error) {
    console.error("Error while calling searchFriend", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const removeFriend = async (request, response) => {
  try {
    const { friendId } = request.params;
    const userId = request.user._id;

    if (userId.toString() === friendId.toString()) {
      return response.status(400).json({ message: "Cannot remove yourself" });
    }

    const [userA, userB] = [userId, friendId].sort((a, b) =>
      a.toString().localeCompare(b.toString()),
    );

    const result = await Friend.updateOne(
      { userA, userB, isDeleted: false },
      { $set: { isDeleted: true } },
    );

    if (result.matchedCount === 0) {
      return response.status(404).json({ message: "Friend not found" });
    }

    return response.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error while calling removeFriend", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};
