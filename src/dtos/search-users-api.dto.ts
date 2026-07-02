import { z } from "zod";

export const SearchUsersDto = z.object({
    size: z.coerce.number(),

    cursor: z.object({
        firstname: z.string(),
        lastname: z.string(),
        id: z.string(),
    }).optional(),

    search: z.string().optional(),
});

export type SearchUsersInput = z.infer<typeof SearchUsersDto>;