import { User } from "./user.model";

export async function getUserById(userId: string) {
  return User.findById(userId).select("-password");
}

export async function getAllUsers() {
  return User.find().select("-password");
}
