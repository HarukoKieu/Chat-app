import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import friendRequestRoute from "./routes/friendRequestRoute.js";
import friendRoute from "./routes/friendRoute.js";
import cookieParser from "cookie-parser";
import { protectRoute } from "./middlewares/authMiddleware.js";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

// public routes
app.use("/api/auth", authRoute);

// private routes
app.use(protectRoute);
app.use("/api/user", userRoute);
app.use("/api/friend-request", friendRequestRoute);
app.use("/api/friends", friendRoute);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
