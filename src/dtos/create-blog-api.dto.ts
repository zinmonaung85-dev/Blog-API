import { z } from "zod";

export const CreateBlogDto = z.object({
    title: z.string(),
    content: z.string(),
    excerpt: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
    categoryIds: z.array(z.string()).optional(),
});



export type CreateBlogInput = z.infer<typeof CreateBlogDto>;