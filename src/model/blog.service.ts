import { Blog, Like, Comment, Reply } from "@prisma/client";
import { Favorite } from "@prisma/client";
import { ApiError } from "../controller/api-error";
import { CreateBlogInput } from "../dtos/create-blog-api.dto";
import { GetBlogListInput } from "../dtos/get-blog-list-api.dto";
import { UpdateBlogInput } from "../dtos/update-blog-api.dto";
import { CreateCommentInput } from "../dtos/create-comment-api.dto";
import { CreateReplyInput } from "../dtos/create-reply-api.dto";
import { GetEngagementStatsInput } from "../dtos/get-engagement-stats-api.dto";
import { GetBlogListByCategoryInput } from "../dtos/get-blog-list-by-category.dto";

import { sendMail } from "../model/mail.service";
import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";


export async function createBlog(authorId: string, blogData: CreateBlogInput, coverImage?: string): Promise<Blog> {

    const random4Digit = Math.floor(1000 + Math.random() * 9000);
    const slug = `${random4Digit}-${Date.now()}`;

    const newBlog = await prisma.blog.create({
        data: {
            title: blogData.title,
            content: blogData.content,
            excerpt: blogData.excerpt ?? null,
            coverImage,
            status: blogData.status,
            slug,
            authorId,
            publishedAt:
                blogData.status === "PUBLISHED"
                    ? new Date()
                    : null,

            categories: blogData.categoryIds?.length
                ? {
                    connect: blogData.categoryIds.map(id => ({
                        id,
                    })),
                }
                : undefined,
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
            categories: {
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true,
                },
            },
        },
    });

    if (newBlog.status === "PUBLISHED") {

        const followers = await prisma.follow.findMany({
            where: {
                followingId: authorId,
                isSubscribed: true,
            },
            select: {
                follower: {
                    select: {
                        email: true,
                    },
                },
            },
        });

        await Promise.all(
            followers.map((follow) =>
                sendMail(
                    follow.follower.email,
                    `${newBlog.author.firstname} ${newBlog.author.lastname}`,
                    newBlog.title,
                    newBlog.slug
                )
            )
        );
    }

    return newBlog;
}

export async function publishBlog(blogId: string, authorId: string): Promise<Blog> {

    const existingBlog = await prisma.blog.findUnique({
        where: {
            id: blogId,
        },
        include: {
            author: {
                select: {
                    firstname: true,
                    lastname: true,
                    email: true,
                },
            },
        },
    });

    if (!existingBlog) {
        throw new ApiError("Blog not found", 404);
    }

    if (existingBlog.authorId !== authorId) {
        throw new ApiError("You don't have permission to publish this blog", 403);
    }

    if (existingBlog.status === "PUBLISHED") {
        throw new ApiError("This blog has already been published", 400);
    }

    const updatedBlog = await prisma.blog.update({
        where: {
            id: blogId,
        },
        data: {
            status: "PUBLISHED",
            publishedAt: new Date(),
        },
    });

    const followers = await prisma.follow.findMany({
        where: {
            followingId: authorId,
            isSubscribed: true,
        },
        select: {
            follower: {
                select: {
                    email: true,
                },
            },
        },
    });

    await Promise.all(
        followers.map((follow) =>
            sendMail(
                follow.follower.email,
                `${existingBlog.author.firstname} ${existingBlog.author.lastname}`,
                existingBlog.title,
                existingBlog.slug
            )
        )
    );

    return updatedBlog;
}


export async function getBlogList(authorId: string, input: GetBlogListByCategoryInput) {

    const skip = (input.page - 1) * input.size;

    const where: Prisma.BlogWhereInput = {
        status: "PUBLISHED",
        deletedAt: null,

        authorId: {
            not: authorId,
        },
    };

    if (input.categoryId) {
        where.categories = {
            some: {
                id: input.categoryId,
            },
        };
    }

    const [blogs, totalBlogs] = await Promise.all([
        prisma.blog.findMany({
            where,

            include: {
                author: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true,
                    },
                },

                categories: {
                    select: {
                        id: true,
                        name: true,
                        createdAt: true,
                    },
                },

                _count: {
                    select: {
                        likes: true,
                        comments: true,
                    },
                },
            },

            skip,
            take: input.size,

            orderBy: {
                createdAt: "desc",
            },
        }),

        prisma.blog.count({
            where,
        }),
    ]);

    const formattedBlogs = blogs.map(
        ({ _count, ...blog }) => ({
            ...blog,
            likeCount: _count.likes,
            commentCount: _count.comments,
        })
    );

    return {
        blogs: formattedBlogs,
        total: totalBlogs,
        page: input.page,
        size: input.size,
        totalPages: Math.ceil(totalBlogs / input.size),
    };
}

export async function updateBlog(authorId: string, blogId: string, blogData: UpdateBlogInput, coverImage?: string): Promise<Blog> {

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

    if (!existingBlog || existingBlog.deletedAt !== null || existingBlog.status !== "PUBLISHED") {
        throw new ApiError("Blog post is unavailable", 404);
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
                        replies: {
                            where: { deletedAt: null }
                        }
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

    if (existingComment.deletedAt !== null) {
        throw new ApiError("Comment not found", 404);
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


export async function viewBlog(blogId: string, userId: string) {

    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog || existingBlog.status !== "PUBLISHED" || existingBlog.deletedAt !== null) {
        throw new ApiError("Blog post not found", 404);
    }

    if (existingBlog.authorId === userId) {
        return { message: "Blog view successfully fetched!!" };
    }

    const views = await prisma.view.upsert({
        where: {
            blogId_viewedAt_userId: {
                blogId: blogId,
                viewedAt: today,
                userId: userId,
            },
        },

        create: {
            blogId: blogId,
            viewedAt: today,
            userId: userId,
        },
        update: {},
    });

    return { message: "Blog view successfully fetched!!" };
}


export async function ownBlogList(authorId: string, input: GetBlogListInput) {

    const skip = (input.page - 1) * input.size;

    const [blogs, totalBlogs] = await Promise.all([
        prisma.blog.findMany({
            where: {
                authorId: authorId,
                deletedAt: null,
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
                authorId: authorId,
                deletedAt: null,
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


export async function stats(userId: string, blogId: string) {

    const existingBlog = await prisma.blog.findUnique({
        where: {
            id: blogId,
            deletedAt: null
        },
        include: {
            _count: {
                select: {
                    likes: true,
                    views: true,
                },
            },
        },
    });

    if (!existingBlog) {
        throw new ApiError("Blog post not found to view statistics", 404);
    }

    if (existingBlog.status !== "PUBLISHED" || existingBlog.deletedAt !== null) {
        throw new ApiError("Cannot view statistics for this blog post", 404);
    }

    if (existingBlog.authorId !== userId) {
        throw new ApiError("Author of blog post and current user does not match", 403);
    }

    const activeCommentsCount = await prisma.comment.count({
        where: {
            blogId: blogId,
            deletedAt: null
        }
    });

    const activeRepliesCount = await prisma.reply.count({
        where: {
            comment: {
                blogId: blogId
            },
            deletedAt: null
        }
    });

    return {
        blogId: existingBlog.id,
        authorId: existingBlog.authorId,
        title: existingBlog.title,
        statistics: {
            likesCount: existingBlog._count.likes,
            commentsCount: activeCommentsCount + activeRepliesCount,
            viewsCount: existingBlog._count.views,
        }
    };
}


export async function read(blogId: string, userId: string) {


    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog || existingBlog.status !== "PUBLISHED" || existingBlog.deletedAt !== null) {
        throw new ApiError("Blog post not found", 404);
    }

    const alreadyViewedBlog = await prisma.view.findUnique({
        where: {
            blogId_viewedAt_userId: {
                blogId: blogId,
                viewedAt: today,
                userId: userId,

            },
        },
    });

    if (!alreadyViewedBlog) {
        throw new ApiError("Please you must view blog post first!", 404);
    }

    if (alreadyViewedBlog.isRead !== false) {
        throw new ApiError("Blog post has already been marked as read", 400);
    }

    const markedAsRead = await prisma.view.update({
        where: {
            blogId_viewedAt_userId: {
                blogId: blogId,
                viewedAt: today,
                userId: userId,
            },
        },
        data: {
            isRead: true,
        },
    });

    return markedAsRead;
}

export async function engagement(blogId: string, userId: string, input: GetEngagementStatsInput) {

    const existingBlog = await prisma.blog.findUnique({
        where: { id: blogId },
    });

    if (!existingBlog || existingBlog.deletedAt !== null) {
        throw new ApiError("Blog post not found", 404);
    }

    if (existingBlog.authorId !== userId) {
        throw new ApiError("You do not have permission to view engagement statistics for this blog", 403);
    }

    if (!input) {
        throw new ApiError("Date input is required", 404);
    }

    const inputDate = new Date(input.date);

    if (isNaN(inputDate.getTime())) {
        throw new ApiError("Invalid date format. Use YYYY-MM-DD", 400);
    }

    const startDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth(), 1));

    const endDate = new Date(Date.UTC(inputDate.getUTCFullYear(), inputDate.getUTCMonth() + 1, 1));

    const viewRecords = await prisma.view.findMany({
        where: {
            blogId: blogId,
            viewedAt: {
                gte: startDate,
                lt: endDate,
            },
        },
        select: {
            viewedAt: true,
            isRead: true,
        },
        orderBy: {
            viewedAt: "asc",
        },
    });

    return {
        blogId: existingBlog.id,
        title: existingBlog.title,
        period: `${startDate} to ${endDate}`,
        views: viewRecords,
        totalViewRecords: viewRecords.length,
    };
}

