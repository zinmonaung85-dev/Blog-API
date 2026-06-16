import { User, Blog } from "@prisma/client";
import { ApiError } from "../controller/api-error";
import { CreateBlogInput } from "../dtos/create-blog-api.dto";
import { GetBlogListInput } from "../dtos/get-blog-list-api.dto";


import { prisma } from "../lib/prisma";



export async function createBlog(authorId: string, blogData: CreateBlogInput): Promise<Blog> {

    console.log(authorId);

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


interface BlogListResponse {
    blogs: Blog[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
}

export async function getBlogList(authorId: string, input: GetBlogListInput): Promise<BlogListResponse> {

    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }

    const skip = (input.page - 1) * input.size;

    const [blogs, totalBlogs] = await prisma.$transaction([
        prisma.blog.findMany({
            where: {
                status: "PUBLISHED",
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


