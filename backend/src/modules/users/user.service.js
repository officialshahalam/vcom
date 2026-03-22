const User = require("../auth/auth.model");

const getUsers = async (search) => {
  const query = search
    ? {
        $or: [
          { username: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};
  return User.find(query).select("-password -socketId").limit(50);
};

const getUserById = async (id) => {
  const user = await User.findById(id).select("-password -socketId");
  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }
  return user;
};

module.exports = { getUsers, getUserById };
