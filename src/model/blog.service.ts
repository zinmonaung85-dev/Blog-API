import { Blog } from "@prisma/client";
import { ApiError } from "../controller/api-error";
import { CreateBlogInput } from "../dtos/create-blog-api.dto";
import { GetBlogListInput } from "../dtos/get-blog-list-api.dto";
import { UpdateBlogInput } from "../dtos/update-blog-api.dto";

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
            },
        }),
    ]);

    const totalPages = Math.ceil(totalBlogs / input.size);

    return {
        blogs,
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


export async function getBlogDetail(blogId: string): Promise<Blog> {

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
                }
            }
        }
    });

    if (!blog) {
        throw new ApiError("Blog not found", 404);
    }

    return blog;
}