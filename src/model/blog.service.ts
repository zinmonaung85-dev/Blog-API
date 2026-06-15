import { User, Blog } from "@prisma/client";
import { ApiError } from "../controller/api-error";
import { CreateBlogInput } from "../dtos/create-blog-api.dto";


import { prisma } from "../lib/prisma";



export async function createBlog(authorId: string, blogData: CreateBlogInput): Promise<Blog> {

    console.log(authorId);

    if (!authorId) {
        throw new ApiError("Author not found", 400);
    }

    const currentStatus = blogData.status || 'DRAFT';

    if (currentStatus === "PUBLISHED") {
        await prisma.blog.deleteMany({
            where: {
                authorId: authorId,
                title: blogData.title,
                content: blogData.content,
                status: "DRAFT"
            }
        });
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