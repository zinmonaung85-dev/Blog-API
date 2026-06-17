import { Router } from "express";
import * as blogController from "./blog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadCoverImage } from "../middlewares/upload.middleware";

const router = Router();

//blogs
router.post("/create", authMiddleware, uploadCoverImage, blogController.createBlog);
router.patch("/publish/:id", authMiddleware, blogController.publishBlog);
router.get("/list", authMiddleware, blogController.getBlogList);
router.put("/update/:id", authMiddleware, blogController.updateBlog);
router.delete("/delete/:id", authMiddleware, blogController.deleteBlog);

export { router as blogRoute };