import { Router } from "express";
import * as categoryController from "./category.controller";

const router = Router();

//categories
router.get("/", categoryController.getCategoryList);

export { router as categoryRoute };