import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    hashedPassword: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    displayName: {
      type: String,
      trim: true,
    },

    avatarUrl: {
      type: String, // link cdn to display avatar
    },

    avatarId: {
      type: String, // id cloudinary
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 200,
    },

    phone: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true, // automatically add createdAt and updatedAt fields
  },
);

userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("User", userSchema);
