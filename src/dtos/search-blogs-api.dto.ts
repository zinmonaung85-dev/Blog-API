import { z } from "zod";

export const SearchBlogsDto = z.object({
    size: z.coerce.number(),

    cursor: z.object({
        id: z.string(),
        createdAt: z.coerce.date(),
    }).optional(),

    search: z.string().optional(),
});

export type SearchBlogsInput = z.infer<typeof SearchBlogsDto>;