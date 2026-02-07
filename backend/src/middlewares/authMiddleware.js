import jwt from "jsonwebtoken";
import User from "../models/User.js";

// authorization - verify who the user is
export const protectRoute = async (request, response, next) => {
  try {
    // get token from header
    const authHeader = request.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return response.status(401).json({ message: "Unauthorized" });
    }

    // verify token
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      async (error, decodedUser) => {
        if (error) {
          console.error(error);
          return response
            .status(403)
            .json({ message: "Access token expired or invalid" });
        }

        const user = await User.findById(decodedUser.userId).select(
          "-hashedPassword",
        );

        if (!user) {
          return response.status(404).json({ message: "User not found" });
        }

        // attach user to request
        request.user = user;
        next();
      },
    );
  } catch (error) {
    console.error("Error while verifying jwt in middleware", error);
    return response.status(500).json({ message: "Internal server error" });
  }
};

export default protectRoute;
