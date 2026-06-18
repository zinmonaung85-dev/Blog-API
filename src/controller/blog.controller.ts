import { Request, Response, NextFunction } from 'express';
import { CreateBlogDto } from '../dtos/create-blog-api.dto';
import { GetBlogListDto } from '../dtos/get-blog-list-api.dto';
import * as blogService from "../model/blog.service";
import { handleErrors } from "./handle-errors";
import { UpdateBlogDto } from '../dtos/update-blog-api.dto';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';



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

        const coverImage = req.file?.filename;

        console.log(coverImage);


        const newBlog = await blogService.createBlog(authorId, input, coverImage);

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

        if (!blogId) {
            return res.status(401).json({
                success: false,
                message: "BlogId is requried!!!",
            });
        }

        const updatedBlog = await blogService.publishBlog(blogId as string, authorId);

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

        const body = req.body;
        const input = GetBlogListDto.parse(body);

        const result = await blogService.getBlogList(authorId as string, input);

        return res.status(200).json({
            success: true,
            message: "Blogs fetched successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function updateBlog(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const authorId = req.user?.id;

        const blogId = req.params.id;


        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized author!!!",
            });
        }

        const body = req.body;

        const input = UpdateBlogDto.parse(body);

        console.log(input);

        const coverImage = req.file?.filename;

        console.log(coverImage);

        const updatedBlog = await blogService.updateBlog(authorId, blogId as string, input, coverImage);

        return res.status(200).json({
            success: true,
            data: updatedBlog,
            message: "Blog updated successfully!",
        });
    } catch (err) {
        handleErrors(res, err);
    }
}


export async function deleteBlog(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {
        const blogId = req.params.id;
        const authorId = req.user?.id;

        if (!authorId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!.",
            });
        }

        const result = await blogService.deleteBlog(authorId, blogId as string);

        return res.status(200).json({
            success: true,
            message: "Blog post was successfully deleted.",
            deletedAt: result.deletedAt,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function getBlogDetail(req: Request, res: Response): Promise<void | Response> {
    try {

        const blogId = req.params.id;

        const blogDetail = await blogService.getBlogDetail(blogId as string);

        return res.status(200).json({
            success: true,
            message: "Blog detail fetched successfully",
            data: blogDetail,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}