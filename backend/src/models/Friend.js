import mongoose from "mongoose";

const friendSchema = new mongoose.Schema(
  {
    userA: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userB: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    since: {
      type: Date,
      default: Date.now,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
  },
  { timestamps: true },
);

friendSchema.pre("save", async function () {
  if (this.userA.toString() > this.userB.toString()) {
    const temp = this.userA;
    this.userA = this.userB;
    this.userB = temp;
  }
});

friendSchema.index({ userA: 1, userB: 1 }, { unique: true });

export default mongoose.model("Friend", friendSchema);
