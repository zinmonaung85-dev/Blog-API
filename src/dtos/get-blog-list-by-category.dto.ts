import { z } from "zod";

export const GetBlogListByCategoryDto = z.object({
    size: z.coerce.number(),
    cursor: z.string().optional(),
    categoryId: z.string().optional(),
});

export type GetBlogListByCategoryInput = z.infer<typeof GetBlogListByCategoryDto>;