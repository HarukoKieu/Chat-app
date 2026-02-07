import mongoose from "mongoose";

const BlockSchema = new mongoose.Schema(
  {
    blocker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blocked: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

BlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

export default mongoose.model("Block", BlockSchema);
