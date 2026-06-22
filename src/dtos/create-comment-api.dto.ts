import { z } from "zod";

export const CreateCommentDto = z.object({
    blogId: z.string().cuid2(),
    content: z.string().trim(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentDto>;