import jwt from "jsonwebtoken";

function getAccessSecret(): string {
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
        throw new Error("JWT_ACCESS_SECRET is not provided");
    }

    return secret;
}

function getRefreshSecret(): string {
    const secret = process.env.JWT_REFRESH_SECRET;

    if (!secret) {
        throw new Error("JWT_REFRESH_SECRET is not provided");
    }

    return secret;
}

export function signAccessToken(payload: object, expiresIn: string): string {
    return jwt.sign(payload, getAccessSecret(), { expiresIn } as jwt.SignOptions);
}

export function signRefreshToken(payload: object, expiresIn: string): string {
    return jwt.sign(payload, getRefreshSecret(), { expiresIn } as jwt.SignOptions);
}


export function verifyAccessToken(token: string) {
    return jwt.verify(token, getAccessSecret());
}

export function verifyRefreshToken(token: string) {
    return jwt.verify(token, getRefreshSecret());
}