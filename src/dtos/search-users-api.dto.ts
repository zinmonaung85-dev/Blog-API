import { z } from "zod";

export const SearchUsersDto = z.object({
    page: z.coerce.number(),
    size: z.coerce.number(),
    search: z.string().optional(),
});

export type SearchUsersInput = z.infer<typeof SearchUsersDto>;