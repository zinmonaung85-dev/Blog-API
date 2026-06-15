import { z } from "zod";

export const CreateBlogDto = z.object({
    title: z.string(),
    content: z.string(),
    excerpt: z.string(),
    status: z.enum(["DRAFT", "PUBLISHED"]),
});

export type CreateBlogInput = z.infer<typeof CreateBlogDto>;