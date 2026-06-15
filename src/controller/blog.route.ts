import { Router } from "express";
import * as blogController from "./blog.controller";
import { authMiddleware } from "../middlewares/auth.middleware";


const router = Router();

//blogs
router.post("/create", authMiddleware, blogController.createBlog);

export { router as BlogRoute };