import { Router } from "express";
import * as blogLogController from "./blog.log.controller";
import { authLogMiddleware } from "../middlewares/auth.log.middleware";
import { uploadCoverImage } from "../middlewares/upload.middleware";

const router = Router();

//blogs/log
router.post("/log/create", authLogMiddleware, uploadCoverImage, blogLogController.createBlog);


export { router as blogLogRoute };