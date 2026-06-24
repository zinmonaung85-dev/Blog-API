import { Request, Response, NextFunction } from 'express';
import { CreateBlogDto } from '../dtos/create-blog-api.dto';
import { GetBlogListDto } from '../dtos/get-blog-list-api.dto';
import * as blogService from "../model/blog.service";
import { handleErrors } from "./handle-errors";
import { UpdateBlogDto } from '../dtos/update-blog-api.dto';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CreateCommentDto } from '../dtos/create-comment-api.dto';
import { CreateReplyDto } from '../dtos/create-reply-api.dto';



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
            message: "Blog post created successfully!",
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
            message: "Blog post published successfully!",

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
            message: "Blog posts fetched successfully",
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
            message: "Blog post updated successfully!",
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
            message: "Blog post detail fetched successfully",
            data: blogDetail,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function saveBlog(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!.",
            });
        }

        if (!blogId) {
            return res.status(401).json({
                success: false,
                message: "Blog post not found to save!.",
            });
        }

        const savedBlog = await blogService.saveBlog(userId, blogId as string);

        return res.status(201).json({
            message: "Blog post saved successfully!!!",
            data: savedBlog,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function unsaveBlog(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!.",
            });
        }

        if (!blogId) {
            return res.status(401).json({
                success: false,
                message: "Blog post not found to unsave!.",
            });
        }

        const unsavedBlog = await blogService.unsaveBlog(userId, blogId as string);

        return res.status(201).json({
            message: "Blog post unsaved successfully!!!",
            data: unsavedBlog,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function getSavedBlogList(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const userId = req.user?.id;

        const body = req.body;

        const input = GetBlogListDto.parse(body);

        const result = await blogService.getSavedBlogList(userId as string, input);

        return res.status(200).json({
            success: true,
            message: "Saved blog posts fetched successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function likeBlog(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!.",
            });
        }

        if (!blogId) {
            return res.status(401).json({
                success: false,
                message: "Blog post not found to like!.",
            });
        }

        const likedBlog = await blogService.likeBlog(userId, blogId as string);

        return res.status(201).json({
            message: "Blog post liked successfully!!!",
            data: likedBlog,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function unlikeBlog(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const userId = req.user?.id;

        const blogId = req.params.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!.",
            });
        }

        if (!blogId) {
            return res.status(401).json({
                success: false,
                message: "Blog post not found to unlike!.",
            });
        }

        const unlikedBlog = await blogService.unlikeBlog(userId, blogId as string);

        return res.status(201).json({
            message: "Blog post unliked successfully!!!",
            data: unlikedBlog,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function createComment(req: AuthenticatedRequest, res: Response): Promise<void | Response> {
    try {
        const body = req.body;

        const input = CreateCommentDto.parse(body);

        console.log(input);

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized! User ID not found in request.",
            });
        }

        const newComment = await blogService.createComment(userId, input);

        return res.status(201).json({
            success: true,
            commentInfo: {
                id: newComment.id,
                content: newComment.content,
                blogId: newComment.blogId,
                createdAt: newComment.createdAt
            },
            message: "Comment on blog post created successfully!",
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function createReply(req: AuthenticatedRequest, res: Response): Promise<void | Response> {
    try {
        const body = req.body;

        const input = CreateReplyDto.parse(body);

        console.log(input);

        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized! User ID not found in request.",
            });
        }

        const newReply = await blogService.createReply(userId, input);

        return res.status(201).json({
            success: true,
            replyInfo: {
                id: newReply.id,
                content: newReply.content,
                commentId: newReply.commentId,
                createdAt: newReply.createdAt
            },
            message: "Reply on comment of blog post created successfully!",
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function commentsList(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {


        const blogId = req.params.id;

        const body = req.body;

        const input = GetBlogListDto.parse(body);

        const result = await blogService.commentsList(blogId as string, input);

        return res.status(200).json({
            success: true,
            message: "Comments list fetched successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function replyList(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const blogId = req.params.id;
        const commentId = req.params.commentId;

        const body = req.body;

        const input = GetBlogListDto.parse(body);

        const result = await blogService.replyList(blogId as string, commentId as string, input);

        return res.status(200).json({
            success: true,
            message: "Replies list fetched successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function viewBlog(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const blogId = req.params.id;

        const userId = req.user?.id;

        if (!blogId) {
            return res.status(401).json({
                success: false,
                message: "Blog post not found to view!.",
            });
        }


        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!.",
            });
        }

        const savedBlog = await blogService.viewBlog(blogId as string, userId);

        return res.status(201).json({
            message: "Viewed blog post successfully!!!",
            data: savedBlog,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function ownBlogList(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const authorId = req.user?.id;

        const body = req.body;

        const input = GetBlogListDto.parse(body);

        const result = await blogService.ownBlogList(authorId as string, input);

        return res.status(200).json({
            success: true,
            message: "Blog posts fetched successfully",
            data: result,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function stats(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const userId = req.user?.id;

        const blogId = req.params.id;

        const statistics = await blogService.stats(userId as string, blogId as string);

        return res.status(200).json({
            success: true,
            message: "Blog statistics fetched successfully",
            data: statistics,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}

export async function read(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const blogId = req.params.id;

        const userId = req.user?.id;

        if (!blogId) {
            return res.status(401).json({
                success: false,
                message: "Blog post not found to mark as read!.",
            });
        }


        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!.",
            });
        }

        const markedAsRead = await blogService.read(blogId as string, userId);

        return res.status(201).json({
            message: "Marked blog post as read successfully!!!",
            data: markedAsRead,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}



















