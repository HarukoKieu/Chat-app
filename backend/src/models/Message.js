import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      default: "text",
    },

    content: {
      type: String,
      trim: true,
      maxlength: 3000,
    },

    imageUrl: {
      type: String,
    },

    editedAt: Date,

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,
  },
  { timestamps: true },
);

messageSchema.index(
  { conversationId: 1, createdAt: -1 },
  { partialFilterExpression: { isDeleted: false } },
);
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ replyTo: 1, createdAt: -1 });

export default mongoose.model("Message", messageSchema);
