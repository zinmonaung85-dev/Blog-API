import { z } from "zod";

export const GetBlogListDto = z.object({
    page: z.coerce.number(),
    size: z.coerce.number(),
});

export type GetBlogListInput = z.infer<typeof GetBlogListDto>;