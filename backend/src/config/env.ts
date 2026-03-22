import dotenv from "dotenv";

dotenv.config();

const requiredVars = ["MONGO_URI", "JWT_SECRET"] as const;
requiredVars.forEach((v) => {
  if (!process.env[v]) {
    throw new Error(`Missing required environment variable: ${v}`);
  }
});

export const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  rabbitmqUrl: process.env.RABBITMQ_URL ?? "amqp://localhost",
};
