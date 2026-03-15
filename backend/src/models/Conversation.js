import mongoose from "mongoose";

const lastMessageSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    content: {
      type: String,
      default: null,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    _id: false,
  },
);

const conversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },

    group: {
      type: groupSchema,
      required: function () {
        return this.type === "group";
      },
    },

    lastMessage: {
      type: lastMessageSchema,
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({ lastMessageAt: -1 });

export default mongoose.model("Conversation", conversationSchema);
