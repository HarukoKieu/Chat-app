import FriendRequest from "../models/FriendRequest.js";
import User from "../models/User.js";
import Friend from "../models/Friend.js";
export const sendFriendRequest = async (request, response) => {
  try {
    const { to, message } = request.body;
    const from = request.user._id;

    if (from.toString() === to.toString()) {
      return response
        .status(400)
        .json({ message: "You cannot send a friend request to yourself" });
    }

    const userExists = await User.exists({ _id: to });
    if (!userExists) {
      return response.status(404).json({ message: "User not found" });
    }

    const [userA, userB] = [from.toString(), to.toString()].sort();

    const blocked = await Friend.findOne({
      userA,
      userB,
      isDeleted: false,
      blockedBy: { $in: [from, to] },
    });

    if (blocked) {
      return response
        .status(403)
        .json({ message: "You cannot send friend request. User is blocked." });
    }

    const [alreadyFriends, friendRequestExists] = await Promise.all([
      Friend.findOne({ userA, userB, isDeleted: false }),
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
        status: "pending",
      }),
    ]);

    if (alreadyFriends) {
      return response
        .status(400)
        .json({ message: "You are already friends with this user" });
    }

    if (friendRequestExists) {
      return response
        .status(400)
        .json({ message: "Friend request already exists" });
    }

    const newFriendRequest = await FriendRequest.create({
      from,
      to,
      message,
    });

    return response.status(201).json({
      message: "Friend request sent successfully",
      newFriendRequest,
    });
  } catch (error) {
    console.error("Error while calling sendFriendRequest", error);

    if (error.code === 11000) {
      return response
        .status(400)
        .json({ message: "Friend request already exists" });
    }

    return response.status(500).json({ message: "Internal server error" });
  }
};

export const cancelFriendRequest = async (request, response) => {
  try {
    const { id } = request.params;
    const userId = request.user._id;

    const friendRequest = await FriendRequest.findById(id);

    if (!friendRequest) {
      return response.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.from.toString() !== userId.toString()) {
      return response.status(403).json({
        message: "You are not authorized to cancel this friend request",
      });
    }

    // delete friend request
    await FriendRequest.findByIdAndDelete(id);

    return response.status(200).json({ message: "Friend request cancelled" });
  } catch (error) {
    console.error("Error while calling cancelFriendRequest", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const acceptFriendRequest = async (request, response) => {
  try {
    const { id } = request.params;
    const userId = request.user._id;

    const friendRequest = await FriendRequest.findById(id);

    if (!friendRequest) {
      return response.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.to.toString() !== userId.toString()) {
      return response.status(403).json({
        message: "You are not authorized to accept this friend request",
      });
    }

    // create friend relationship between users
    await Friend.create({
      userA: friendRequest.from,
      userB: friendRequest.to,
    });

    // delete friend request
    await FriendRequest.findByIdAndDelete(id);

    const fromUser = await User.findById(friendRequest.from)
      .select("_id username avatarUrl")
      .lean();

    response.status(200).json({
      message: "Friend request accepted",
      newFriend: {
        _id: fromUser?._id,
        username: fromUser?.username,
        avatarUrl: fromUser?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Error while calling acceptFriendRequest", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const declineFriendRequest = async (request, response) => {
  try {
    const { id } = request.params;
    const userId = request.user._id;

    const friendRequest = await FriendRequest.findById(id);

    if (!friendRequest) {
      return response.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.to.toString() !== userId.toString()) {
      return response.status(403).json({
        message: "You are not authorized to reject this friend request",
      });
    }

    // delete friend request
    await FriendRequest.findByIdAndDelete(id);

    return response.status(200).json({ message: "Friend request declined" });
  } catch (error) {
    console.error("Error while calling declineFriendRequest", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export const getFriendRequests = async (request, response) => {
  try {
    const userId = request.user._id;

    const [sentFriendRequests, receivedFriendRequests] = await Promise.all([
      FriendRequest.find({
        to: userId,
        status: "pending",
      }).populate("from", "_id username avatarUrl"),
      FriendRequest.find({
        from: userId,
        status: "pending",
      }).populate("to", "_id username avatarUrl"),
    ]);

    return response
      .status(200)
      .json({ sentFriendRequests, receivedFriendRequests });
  } catch (error) {
    console.error("Error while calling getFriendRequests", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};
