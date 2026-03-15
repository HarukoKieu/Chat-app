import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["member", "admin"],
      default: "member",
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

    lastSeenAt: {
      type: Date,
      default: null,
    },

    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

participantSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Participant", participantSchema);
