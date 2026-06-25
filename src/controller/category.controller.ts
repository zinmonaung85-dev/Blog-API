import { Request, Response } from 'express';
import * as categoryService from "../model/category.service";
import { handleErrors } from "./handle-errors";

export async function getCategoryList(req: Request, res: Response): Promise<void | Response> {
    try {

        const categoryList = await categoryService.getCategoryList();

        return res.status(200).json({
            data: categoryList,
            message: "Category List fetched successfully...!",
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

