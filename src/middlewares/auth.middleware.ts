import { Request, Response, NextFunction } from "express";
import { User } from "@prisma/client";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { verifyAccessToken } from "../model/jwt";
import { ApiError } from "../controller/api-error";
import { logger } from "../lib/logger";


export interface AuthenticatedRequest extends Request {
    user?: User;
}

export async function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void | Response> {
    try {
        const authorizationHeader = req.headers?.authorization;
        if (!authorizationHeader) {
            throw new ApiError("Authorization header must be provided", 401);
        }

        const splittedAuthHeader = authorizationHeader.split(" ");
        if (splittedAuthHeader.length !== 2) {
            throw new ApiError("Invalid authorization header", 401);
        }

        if (splittedAuthHeader[0] !== "JWT") {
            throw new ApiError("Invalid authorization header", 401);
        }

        const jwtToken = splittedAuthHeader[1];

        const payload = verifyAccessToken(jwtToken);

        if (typeof payload === "string" || !("id" in payload) || !payload.id) {
            throw new ApiError("Invalid jwt token", 401);
        }

        const user = await prisma.user.findUnique({
            where: {
                id: payload.id as string,
            },
        });

        if (!user) {
            throw new ApiError("Invalid jwt token", 401);
        }

        req.user = user;

        return next();
    } catch (err) {
        if (err instanceof ApiError) {
            return res.status(err.statusCode).json({ message: err.message });
        }

        if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }

        logger.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}