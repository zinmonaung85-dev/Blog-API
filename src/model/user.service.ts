import { User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ApiError } from "../controller/api-error";
import { RegisterInput } from "./user.model";
import { LoginInput } from "../dtos/login-api.dto";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, } from "../model/jwt";

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

export async function login(input: LoginInput): Promise<any> {

    const foundUser = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (!foundUser) {
        throw new ApiError("User not found", 400);
    }

    const isSame = await bcrypt.compare(input.password, foundUser.password);
    if (!isSame) {
        throw new ApiError("Password not match", 400);
    }

    const accessToken = signAccessToken(
        {
            id: foundUser.id,
            email: foundUser.email,
        },
        "15m"
    );

    const refreshToken = signRefreshToken(
        {
            id: foundUser.id,
        },
        "7d"
    );

    return {
        accessToken,
        refreshToken,
        user: {
            id: foundUser.id,
            firstname: foundUser.firstname,
            lastname: foundUser.lastname,
            email: foundUser.email,
        },
    };
}



interface UserPayload {
    id: string;
}

interface RefreshTokenResponse {
    accessToken: string;
}

export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {

    if (!refreshToken) {
        throw new ApiError("Refresh token is required", 400);
    }

    try {
        const user = verifyRefreshToken(refreshToken) as UserPayload;

        const accessToken = signAccessToken({
            id: user.id,
        }, "15m");

        return { accessToken, };


    } catch (err) {
        throw new ApiError("Invalid refresh token", 400);
    }
}


export async function getMe(userId: string): Promise<User> {

    console.log(userId);

    const foundUser = await prisma.user.findUnique({
        where: {
            id: userId,
        },
    });

    if (!foundUser) {
        throw new ApiError("User not found!", 400);
    }

    return foundUser;
}