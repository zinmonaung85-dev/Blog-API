import { Router } from "express";
import * as blogController from "./blog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadCoverImage } from "../middlewares/upload.middleware";

const router = Router();

//blogs
router.post("/create", authMiddleware, uploadCoverImage, blogController.createBlog);
router.patch("/publish/:id", authMiddleware, blogController.publishBlog);
router.put("/update/:id", authMiddleware, uploadCoverImage, blogController.updateBlog);
router.delete("/delete/:id", authMiddleware, blogController.deleteBlog);

router.get("/list", blogController.getBlogList);
router.get("/detail/:id", blogController.getBlogDetail);

router.post("/save/:id", authMiddleware, blogController.saveBlog);
router.delete("/unsave/:id", authMiddleware, blogController.unsaveBlog);
router.get("/savedList", authMiddleware, blogController.getSavedBlogList);

router.post("/like/:id", authMiddleware, blogController.likeBlog);
router.delete("/unlike/:id", authMiddleware, blogController.unlikeBlog);


export { router as blogRoute };