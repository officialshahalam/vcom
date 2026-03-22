const jwt = require("jsonwebtoken");
const User = require("./auth.model");

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const register = async ({ username, email, password }) => {
  const existing = await User.findOne({ $or: [{ email }, { username }] });
  if (existing) {
    const field = existing.email === email ? "email" : "username";
    throw Object.assign(new Error(`${field} already in use`), {
      statusCode: 409,
    });
  }

  const user = await User.create({ username, email, password });
  const token = generateToken(user._id);
  return { user, token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
  }

  const token = generateToken(user._id);
  user.password = undefined;
  return { user, token };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error("User not found"), { statusCode: 404 });
  }
  return user;
};

module.exports = { register, login, getMe };
