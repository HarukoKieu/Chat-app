import Friend from "../models/Friend.js";

// helper function to extract friends from friendShips array
const extractFriend = (friendShips, userId) => {
  return friendShips
    .map((f) => {
      if (f.userA && f.userA._id.toString() !== userId.toString())
        return f.userA;
      if (f.userB && f.userB._id.toString() !== userId.toString())
        return f.userB;
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

    const escapeKeyword = (char) => {
      return char.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    const regex = new RegExp(escapeKeyword(keyword), "i");

    const friendShips = await Friend.find({
      $or: [{ userA: userId }, { userB: userId }],
      isDeleted: false,
    })
      .populate({
        path: "userA",
        select: "_id username avatarUrl",
        match: { username: regex },
      })
      .populate({
        path: "userB",
        select: "_id username avatarUrl",
        match: { username: regex },
      })
      .lean();

    if (!friendShips.length) {
      return response.status(200).json({ friends: [] });
    }

    const friends = extractFriend(friendShips, userId);

    return response.status(200).json({ friends: friends });
  } catch (error) {
    console.error("Error while calling search friend", error);
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

    const [userA, userB] = [userId.toString(), friendId.toString()].sort();

    const friendShip = await Friend.findOne({
      userA,
      userB,
      isDeleted: false,
    });

    if (!friendShip) {
      return response.status(404).json({ message: "Friend not found" });
    }

    friendShip.isDeleted = true;
    await friendShip.save();

    return response.status(200).json({ message: "Friend removed" });
  } catch (error) {
    console.error("Error while calling removeFriend", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};
