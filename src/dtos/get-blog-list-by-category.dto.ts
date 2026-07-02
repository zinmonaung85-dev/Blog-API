import { z } from "zod";

export const GetBlogListByCategoryDto = z.object({
    size: z.coerce.number(),

    cursor: z.object({
        id: z.string(),
        createdAt: z.coerce.date(),
    }).optional(),

    categoryId: z.string().optional(),
});

export type GetBlogListByCategoryInput = z.infer<typeof GetBlogListByCategoryDto>;