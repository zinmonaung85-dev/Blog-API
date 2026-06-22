import { z } from "zod";

export const CreateReplyDto = z.object({
    commentId: z.string().cuid2(),
    content: z.string().trim(),
});

export type CreateReplyInput = z.infer<typeof CreateReplyDto>;