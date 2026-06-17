import { Request, Response, NextFunction } from 'express';
import { CreateBlogDto } from '../dtos/create-blog-api.dto';
import * as blogService from "../model/blog.service";
import { handleErrors } from "./handle-errors";

interface AuthenticatedRequest extends Request {
    params: {
        id: string;
    };
    user?: {
        id: string;
        email?: string;
    };
}

export async function createBlog(req: AuthenticatedRequest, res: Response): Promise<void | Response> {
    try {
        const body = req.body;

        const input = CreateBlogDto.parse(body);

        console.log(input);

        const authorId = req.user?.id;

        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized! Author ID not found in request.",
            });
        }

        const file = req.file?.filename;

        console.log(file);


        const newBlog = await blogService.createBlog(authorId, input, file);

        return res.status(201).json({
            success: true,
            blogInfo: {
                id: newBlog.id,
                title: newBlog.title,
                content: newBlog.content,
                excerpt: newBlog.excerpt,
                coverImage: newBlog.coverImage,
                status: newBlog.status,
            },
            message: "Blog created successfully!",
        });
    } catch (err) {
        handleErrors(res, err);
    }
}


export async function publishBlog(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const blogId = req.params.id;

        const authorId = req.user?.id;

        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized author!!!",
            });
        }

        const updatedBlog = await blogService.publishBlog(blogId, authorId);

        return res.status(200).json({
            updatedBlog: {
                title: updatedBlog.title,
                content: updatedBlog.content,
                excerpt: updatedBlog.excerpt,
                status: updatedBlog.status,
            },
            message: "Blog published successfully!",

        });
    } catch (err) {
        handleErrors(res, err);
    }
}


export async function getBlogList(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {
        const authorId = req.user?.id;

        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const page = Number(req.query.page) || 1;
        const size = Number(req.query.size) || 10;

        const result = await blogService.getBlogList(authorId, {
            page,
            size,
        });

        return res.status(200).json({
            success: true,
            message: "Blogs fetched successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}
