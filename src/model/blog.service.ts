import { Blog, Like, Comment, Reply } from "@prisma/client";
import { Favorite } from "@prisma/client";
import { ApiError } from "../controller/api-error";
import { CreateBlogInput } from "../dtos/create-blog-api.dto";
import { GetBlogListInput } from "../dtos/get-blog-list-api.dto";
import { UpdateBlogInput } from "../dtos/update-blog-api.dto";
import { CreateCommentInput } from "../dtos/create-comment-api.dto";
import { CreateReplyInput } from "../dtos/create-reply-api.dto";

import { prisma } from "../lib/prisma";




export async function createBlog(authorId: string, blogData: CreateBlogInput, coverImage?: string): Promise<Blog> {

    console.log(authorId);

    console.log("Cover image =", coverImage);

    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }

    const random4Digit = Math.floor(1000 + Math.random() * 9000);
    const slug = `${random4Digit}-${Date.now()}`;

    const newBlog = await prisma.blog.create({
        data: {
            title: blogData.title,
            content: blogData.content,
            excerpt: blogData.excerpt ?? null,
            coverImage,
            status: blogData.status ?? 'DRAFT',
            slug: slug,
            authorId: authorId,
            publishedAt: blogData.status === "PUBLISHED" ? new Date() : null,
        },
    });

    return newBlog;
};


export async function publishBlog(blogId: string, authorId: string): Promise<Blog> {

    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog) {
        throw new ApiError("Blog not found", 404);
    }

    if (existingBlog.authorId !== authorId) {
        throw new ApiError("You don't have permission to publish this blog", 403);
    }

    if (existingBlog.status === "PUBLISHED") {
        throw new ApiError("This blog has already been published!!", 400);
    }

    const updatedBlog = await prisma.blog.update({
        where: { id: blogId },
        data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
        },
    });

    return updatedBlog;

}


export async function getBlogList(authorId: string, input: GetBlogListInput) {


    const skip = (input.page - 1) * input.size;

    const [blogs, totalBlogs] = await Promise.all([
        prisma.blog.findMany({
            where: {
                status: "PUBLISHED",
                deletedAt: null,
                authorId: {
                    not: authorId,
                }
            },

            include: {
                _count: {
                    select: { likes: true }
                },
            },

            skip,
            take: input.size,
            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.blog.count({
            where: {
                status: "PUBLISHED",
                deletedAt: null,
                authorId: {
                    not: authorId,
                }
            },
        }),
    ]);

    const formattedBlogs = blogs.map((blog) => ({
        ...blog,
        likeCount: blog._count.likes,
    }));

    const totalPages = Math.ceil(totalBlogs / input.size);

    return {
        blogs: formattedBlogs,
        total: totalBlogs,
        page: input.page,
        size: input.size,
        totalPages,
    };
}



export async function updateBlog(authorId: string, blogId: string, blogData: UpdateBlogInput, coverImage?: string): Promise<Blog> {

    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog) {
        throw new ApiError("Blog not found", 404);
    }

    if (existingBlog.authorId !== authorId) {
        throw new ApiError("You don't have permission to update this blog", 403);
    }

    if (existingBlog.deletedAt !== null) {
        throw new ApiError("Blog cannot be updated", 400);
    }

    const updatedBlog = await prisma.blog.update({
        where: { id: blogId },
        data: {
            title: blogData.title ?? existingBlog.title,
            content: blogData.content ?? existingBlog.content,
            excerpt: blogData.excerpt ?? existingBlog.excerpt,
            coverImage: coverImage ?? existingBlog.coverImage,

        },
    });

    return updatedBlog;
}


export async function deleteBlog(authorId: string, blogId: string): Promise<Blog> {

    if (!authorId) {
        throw new ApiError("Author ID is required", 400);
    }

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog) {
        throw new ApiError("Blog not found to delete", 404);
    }

    if (existingBlog.deletedAt !== null) {
        throw new ApiError("Blog has already been deleted", 400);
    }

    if (existingBlog.authorId !== authorId) {
        throw new ApiError("You don't have permission to delete this blog", 403);
    }

    const deletedBlog = await prisma.blog.update({
        where: { id: blogId },
        data: {
            deletedAt: new Date(),
        },
    });

    return deletedBlog;
}


export async function getBlogDetail(blogId: string) {

    const blog = await prisma.blog.findFirst({
        where: {
            id: blogId,
            status: "PUBLISHED",
            deletedAt: null,
        },
        include: {
            author: {
                select: {
                    id: true,
                    firstname: true,
                    lastname: true,
                    email: true,
                },
            },

            _count: {
                select: {
                    likes: true,
                },
            },
        },
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    return {
        ...blog,
        likeCount: blog._count.likes,
    };
}

export async function saveBlog(userId: string, blogId: string): Promise<Favorite> {


    if (!userId) {
        throw new ApiError("User not found", 401);
    }

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog) {
        throw new ApiError("Blog not found to save", 404);
    }

    if (existingBlog.status !== "PUBLISHED" || existingBlog.deletedAt !== null) {
        throw new ApiError("Blog cannot be saved", 404);
    }

    const alreadySavedBlog = await prisma.favorite.findUnique({
        where: {
            userId_blogId: {
                userId: userId,
                blogId: blogId,
            }
        }
    });

    if (alreadySavedBlog) {
        throw new ApiError("Blog has already been saved", 400);
    }

    const savedBlog = await prisma.favorite.create({
        data: {
            userId: userId,
            blogId: blogId,
        },
    });

    return savedBlog;

}


export async function unsaveBlog(userId: string, blogId: string): Promise<Favorite> {

    if (!userId) {
        throw new ApiError("User not found", 401);
    }

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog) {
        throw new ApiError("Blog post not found to unsave", 404);
    }

    const alreadySavedBlog = await prisma.favorite.findUnique({
        where: {
            userId_blogId: {
                userId: userId,
                blogId: blogId,
            }
        }
    });

    if (!alreadySavedBlog) {
        throw new ApiError("User cannot be able to unsave this blog post cuz it is not saved yet!", 400);
    }

    const unsavedBlog = await prisma.favorite.delete({
        where: {
            userId_blogId: {
                userId: userId,
                blogId: blogId,
            }
        }
    });

    return unsavedBlog;

}


export async function getSavedBlogList(userId: string, input: GetBlogListInput) {

    const skip = (input.page - 1) * input.size;

    if (!userId) {
        throw new ApiError("User not found", 400);
    }

    const [favorites, totalBlogs] = await Promise.all([
        prisma.favorite.findMany({
            where: {
                userId: userId,
            },
            skip: skip,
            take: input.size,
            orderBy: {
                savedAt: "desc",
            },
            include: {
                blog: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                firstname: true,
                                lastname: true,
                                email: true
                            }
                        }
                    }
                }
            }
        }),

        prisma.favorite.count({
            where: {
                userId: userId,
            },
        }),
    ]);

    const blogs = favorites.map(fav => fav.blog);

    return {
        blogs,
        total: totalBlogs,
        page: input.page,
        size: input.size,
        totalPages: Math.ceil(totalBlogs / input.size),
    };
}


export async function likeBlog(userId: string, blogId: string): Promise<Like> {


    if (!userId) {
        throw new ApiError("User not found", 401);
    }

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog) {
        throw new ApiError("Blog post not found to like", 404);
    }

    if (existingBlog.status !== "PUBLISHED" || existingBlog.deletedAt !== null) {
        throw new ApiError("Blog post cannot be given like", 404);
    }

    const alreadyLikedBlog = await prisma.like.findUnique({
        where: {
            userId_blogId: {
                userId: userId,
                blogId: blogId,
            }
        }
    });

    if (alreadyLikedBlog) {
        throw new ApiError("Blog post has already been liked", 400);
    }

    const likedBlog = await prisma.like.create({
        data: {
            userId: userId,
            blogId: blogId,
        },
    });

    return likedBlog;

}


export async function unlikeBlog(userId: string, blogId: string): Promise<Like> {

    if (!userId) {
        throw new ApiError("User not found", 401);
    }

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog) {
        throw new ApiError("Blog post not found to unlike", 404);
    }

    const alreadyLikedBlog = await prisma.like.findUnique({
        where: {
            userId_blogId: {
                userId: userId,
                blogId: blogId,
            }
        }
    });

    if (!alreadyLikedBlog) {
        throw new ApiError("User cannot be able to unlike this blog post cuz it is not liked yet!", 400);
    }

    const unlikedBlog = await prisma.like.delete({
        where: {
            userId_blogId: {
                userId: userId,
                blogId: blogId,
            }
        }
    });

    return unlikedBlog;

}


export async function createComment(userId: string, input: CreateCommentInput): Promise<Comment> {

    if (!userId) {
        throw new ApiError("User not found", 401);
    }

    const existingBlog = await prisma.blog.findUnique({
        where: { id: input.blogId },
    });

    if (!existingBlog) {
        throw new ApiError("Blog post not found to comment", 404);
    }

    if (existingBlog.status !== "PUBLISHED" || existingBlog.deletedAt !== null) {
        throw new ApiError("Cannot comment on this blog post", 404);
    }

    const newComment = await prisma.comment.create({
        data: {
            userId: userId,
            blogId: input.blogId,
            content: input.content,
        },
    });

    return newComment;
}


export async function createReply(userId: string, input: CreateReplyInput): Promise<Reply> {

    if (!userId) {
        throw new ApiError("User not found", 401);
    }

    const existingComment = await prisma.comment.findUnique({
        where: { id: input.commentId },
        include: {
            blog: true,
        },
    });

    if (!existingComment) {
        throw new ApiError("Comment not found to reply", 404);
    }

    if (existingComment.blog.status !== "PUBLISHED" || existingComment.blog.deletedAt !== null) {
        throw new ApiError("Cannot reply to this comment as the blog post is unavailable", 400);
    }

    const newReply = await prisma.reply.create({
        data: {
            userId: userId,
            commentId: input.commentId,
            content: input.content,
        },
    });

    return newReply;
}

export async function commentsList(blogId: string, input: GetBlogListInput) {

    const skip = (input.page - 1) * input.size;

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog) {
        throw new ApiError("Blog post not found", 404);
    }

    const [comments, totalComments] = await Promise.all([
        prisma.comment.findMany({
            where: {
                blogId: blogId,
                deletedAt: null,
            },
            skip: skip,
            take: input.size,
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                content: true,
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                    }
                },
                _count: {
                    select: {
                        replies: true
                    }
                }
            }
        }),

        prisma.comment.count({
            where: {
                blogId: blogId,
                deletedAt: null,
            },
        }),
    ]);

    return {
        comments,
        total: totalComments,
        page: input.page,
        size: input.size,
        totalPages: Math.ceil(totalComments / input.size),
    };
}


export async function replyList(blogId: string, commentId: string, input: GetBlogListInput) {

    const skip = (input.page - 1) * input.size;

    const existingComment = await prisma.comment.findUnique({
        where: {
            id: commentId,
        },
        include: {
            blog: true,
        },
    });

    if (!existingComment || existingComment.blogId !== blogId) {
        throw new ApiError("Comment or Blog match not found", 404);
    }

    if (existingComment.blog.status !== "PUBLISHED" || existingComment.blog.deletedAt !== null) {
        throw new ApiError("Cannot view replies as the blog post is unavailable", 400);
    }

    const [replies, totalReplies] = await Promise.all([
        prisma.reply.findMany({
            where: {
                commentId: commentId,
                deletedAt: null,
            },
            skip: skip,
            take: input.size,
            orderBy: {
                createdAt: "asc",
            },
            select: {
                id: true,
                content: true,
                createdAt: true,
                user: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                    }
                }
            }
        }),

        prisma.reply.count({
            where: {
                commentId: commentId,
                deletedAt: null,
            },
        }),
    ]);

    return {
        replies,
        total: totalReplies,
        page: input.page,
        size: input.size,
        totalPages: Math.ceil(totalReplies / input.size),
    };
}