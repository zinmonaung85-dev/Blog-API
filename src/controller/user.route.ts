import { Router } from "express";
import * as userController from "./user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

//users
router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/refresh", userController.refreshAccessToken);
router.get("/me", authMiddleware, userController.getMe);

router.get("/search", authMiddleware, userController.searchUsers);
router.post("/:id/follow", authMiddleware, userController.followUser);
router.delete("/:id/unfollow", authMiddleware, userController.unfollowUser);
router.get("/:id/followers", authMiddleware, userController.getFollowersList);
router.get("/:id/following", authMiddleware, userController.getFollowingList);

router.post("/:id/subscribe", authMiddleware, userController.subscribeToUser);
router.patch("/:id/unsubscribe", authMiddleware, userController.unsubscribeFromUser);
router.get("/suggestion", authMiddleware, userController.getUserSuggestion);

export { router as userRoute };