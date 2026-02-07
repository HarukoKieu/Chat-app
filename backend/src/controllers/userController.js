export const authMe = async (request, response) => {
  try {
    const user = request.user;
    return response.status(200).json(user);
  } catch (error) {
    console.error("Error while calling authMe", error);
    response.status(500).json({ message: "Internal server error" });
  }
};

export const test = async (request, response) => {
  return response.sendStatus(204);
};
