import { z } from "zod";

export const RegisterDto = z.object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.string().email(),
    password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof RegisterDto>;