import mongoose from "mongoose";
import env from "./env";

export async function connectDatabase(): Promise<typeof mongoose.connection> {
  await mongoose.connect(env.mongoUri);
  return mongoose.connection;
}
