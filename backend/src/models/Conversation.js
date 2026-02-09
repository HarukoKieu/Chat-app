import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },

    directKey: {
      type: String,
      unique: true,
      sparse: true,
    },

    name: {
      type: String,
      trim: true,
      required: function () {
        return this.type === "group";
      },
    },

    avatarUrl: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,
  },
  { timestamps: true },
);

conversationSchema.index({ type: 1 });
conversationSchema.index({ directKey: 1 }, { unique: true });

export default mongoose.model("Conversation", conversationSchema);
