import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { StringValue } from "ms";
import { User } from "../user/user.model";
import { env } from "../../config/env";

export async function registerUser(name: string, email: string, password: string) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new Error("Email already in use");
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed });
  const token = jwt.sign({ userId: user._id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as StringValue,
  });
  return { token, user: { _id: user._id, name: user.name, email: user.email } };
}

export async function loginUser(email: string, password: string) {
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    throw new Error("Invalid credentials");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }
  const token = jwt.sign({ userId: user._id }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as StringValue,
  });
  return { token, user: { _id: user._id, name: user.name, email: user.email } };
}
