import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    role: { type: String, enum: ["member", "admin"], default: "member" },

    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
    lastReadAt: Date,

    nickname: String,
    avatarUrl: String,
    mutedUntil: Date,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

participantSchema.index({ userId: 1, conversationId: 1 }, { unique: true });
participantSchema.index({ conversationId: 1 });
participantSchema.index({ userId: 1 });

export default mongoose.model("Participant", participantSchema);
