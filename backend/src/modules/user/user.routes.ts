import { Router } from "express";
import { userController } from "./user.controller";
import { authenticate } from "../../packages/middlewares/authenticate";
import { asyncHandler } from "../../packages/error-handler/async-handler";
import { validateRequest } from "../../packages/middlewares/validateRequest";
import { updateProfileSchema, searchUsersSchema, getPublicProfileSchema } from "./user.validator";

export const userRouter: ReturnType<typeof Router> = Router();

userRouter.get("/profile", authenticate, asyncHandler(userController.getProfile));
userRouter.put("/profile", authenticate, validateRequest(updateProfileSchema), asyncHandler(userController.updateProfile));
userRouter.get("/search", authenticate, validateRequest(searchUsersSchema), asyncHandler(userController.searchUsers));
userRouter.get("/:userId", authenticate, validateRequest(getPublicProfileSchema), asyncHandler(userController.getPublicProfile));
