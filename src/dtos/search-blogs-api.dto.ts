import { z } from "zod";

export const SearchBlogsDto = z.object({
    size: z.coerce.number(),
    cursor: z.string().optional(),
    search: z.string().optional(),
});

export type SearchBlogsInput = z.infer<typeof SearchBlogsDto>;