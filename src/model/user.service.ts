import { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ApiError } from "../controller/api-error";
import { RegisterInput } from "./user.model";

import { prisma } from "../lib/prisma";



export async function register(input: RegisterInput): Promise<User> {

    const existingUser = await prisma.user.findUnique({
        where: {
            email: input.email,
        },
    });

    if (existingUser) {
        throw new ApiError("Duplicate email!", 400);
    }

    const hashedPassword = await bcrypt.hash(input.password, 10);

    const newUser = await prisma.user.create({
        data: {
            firstname: input.firstname,
            lastname: input.lastname,
            email: input.email,
            password: hashedPassword,
        },
    });

    return newUser;
}