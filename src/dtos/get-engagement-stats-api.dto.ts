import { z } from "zod";

export const GetEngagementStatsDto = z.object({
    date: z.string().date(),
});

export type GetEngagementStatsInput = z.infer<typeof GetEngagementStatsDto>;