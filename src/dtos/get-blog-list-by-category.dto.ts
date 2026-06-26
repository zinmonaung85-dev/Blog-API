import { z } from "zod";

export const GetBlogListByCategoryDto = z.object({
    page: z.coerce.number(),
    size: z.coerce.number(),
    categoryId: z.string().optional(),
});

export type GetBlogListByCategoryInput = z.infer<typeof GetBlogListByCategoryDto>;