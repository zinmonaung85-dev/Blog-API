import { z } from "zod";

export const RefreshAccessTokenDto = z.object({
    refreshToken: z.string(),
});


export type RefreshAccessTokenInput = z.infer<typeof RefreshAccessTokenDto>;