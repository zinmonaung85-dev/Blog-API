import { Prisma, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ApiError } from "../controller/api-error";
import { RegisterInput } from "./user.model";
import { LoginInput } from "../dtos/login-api.dto";
import { SearchUsersDto, SearchUsersInput } from "../dtos/search-users-api.dto";
import { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, } from "../model/jwt";

import { prisma } from "../lib/prisma";
import { promise } from "zod";
import { GetBlogListInput } from "../dtos/get-blog-list-api.dto";



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


export async function searchUsers(currentUserId: string, input: SearchUsersInput) {

    const skip = (input.page - 1) * input.size;

    const where: Prisma.UserWhereInput = {
        id: {
            not: currentUserId,
        },
    };

    if (input.search) {
        where.OR = [
            {
                firstname: {
                    contains: input.search,
                    mode: "insensitive"
                }
            },

            {
                lastname: {
                    contains: input.search,
                    mode: "insensitive"
                }
            },

            {
                email: {
                    contains: input.search,
                    mode: "insensitive"
                }
            },
        ];
    }

    const [users, totalUsers] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: input.size,
            select: {
                id: true,
                firstname: true,
                lastname: true,
                email: true,
                followers: {
                    where: { followerId: currentUserId },
                    select: { id: true },
                },
                _count: {
                    select: { followers: true, following: true },
                },
            },
            orderBy: {
                createdAt: "desc"
            },
        }),

        prisma.user.count({
            where,
        }),
    ]);

    return {
        users: users.map((user) => ({
            id: user.id,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            followersCount: user._count.followers,
            followingCount: user._count.following,
            isFollowed: user.followers.length > 0,
        })),
        pagination: {
            total: totalUsers,
            page: input.page,
            size: input.size,
            totalPages: Math.ceil(totalUsers / input.size),
        }
    };
}


export async function followUser(followerId: string, followingId: string) {

    if (followerId === followingId) {
        throw new ApiError("You cannot follow yourself!", 400);
    }

    const followingUser = await prisma.user.findUnique({
        where: {
            id: followingId,
        }
    });

    if (!followingUser) {
        throw new ApiError("Cannot follow this user cuz user not found", 404);
    }

    const existingFollow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            }
        }
    });

    if (existingFollow) {
        throw new ApiError("Cannot follow this user again cuz you have already been followed!", 400);
    }

    const newFollowingUser = await prisma.follow.create({
        data: {
            followerId,
            followingId,
        },
    });

    return newFollowingUser;
}


export async function unfollowUser(followerId: string, followingId: string) {

    if (followerId === followingId) {
        throw new ApiError("You cannot unfollow yourself!", 400);
    }

    const followingUser = await prisma.user.findUnique({
        where: {
            id: followingId,
        }
    });

    if (!followingUser) {
        throw new ApiError("Cannot unfollow this user cuz user not found", 404);
    }

    const existingFollow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            }
        }
    });

    if (!existingFollow) {
        throw new ApiError("Cannot unfollow this user cuz you are not following them!", 400);
    }

    const deletedFollow = await prisma.follow.delete({
        where: {
            id: existingFollow.id,
        },
    });

    return deletedFollow;
}

export async function getFollowersList(followerId: string, followingId: string, input: GetBlogListInput) {

    const skip = (input.page - 1) * input.size;

    const [followers, total] = await Promise.all([
        prisma.follow.findMany({
            where: {
                followingId: followingId,
            },
            skip,
            take: input.size,
            include: {
                follower: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true,

                        followers: {
                            where: {
                                followerId: followerId,
                            },
                            select: {
                                id: true,
                            },
                        },
                        _count: {
                            select: {
                                followers: true,
                                following: true,
                            },
                        },
                    },
                },
            },
        }),

        prisma.follow.count({
            where: {
                followingId: followingId,
            },
        }),
    ]);

    return {
        followers: followers.map((followRow) => {
            const isMe = followRow.follower.id === followerId;

            return {
                id: followRow.follower.id,
                firstname: followRow.follower.firstname,
                lastname: followRow.follower.lastname,
                email: followRow.follower.email,
                followersCount: followRow.follower._count.followers,
                followingCount: followRow.follower._count.following,
                isMe,
            };
        }),
        pagination: {
            total,
            page: input.page,
            size: input.size,
            totalPages: Math.ceil(total / input.size),
        }
    };
}

export async function getFollowingList(followerId: string, currentUserId: string, input: GetBlogListInput) {

    const skip = (input.page - 1) * input.size;

    const [following, total] = await Promise.all([
        prisma.follow.findMany({
            where: {
                followerId: followerId,
            },
            skip,
            take: input.size,
            include: {
                following: {
                    select: {
                        id: true,
                        firstname: true,
                        lastname: true,
                        email: true,

                        _count: {
                            select: {
                                followers: true,
                                following: true,
                            },
                        },
                    },
                },
            },
        }),

        prisma.follow.count({
            where: {
                followerId: followerId,
            },
        }),
    ]);

    return {

        following: following.map((followRow) => {
            const isMe = followRow.following.id === currentUserId;

            return {
                id: followRow.following.id,
                firstname: followRow.following.firstname,
                lastname: followRow.following.lastname,
                email: followRow.following.email,
                followersCount: followRow.following._count.followers,
                followingCount: followRow.following._count.following,
                isMe: isMe,
                isSubscribed: followRow.isSubscribed,
            };
        }),
        pagination: {
            total: total,
            page: input.page,
            size: input.size,
            totalPages: Math.ceil(total / input.size),
        }
    };
}


export async function subscribeToUser(followerId: string, followingId: string) {

    if (followerId === followingId) {
        throw new ApiError("You cannot subscribe to yourself!", 400);
    }

    const existingFollow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            }
        }
    });

    if (!existingFollow) {
        throw new ApiError("You must follow this user first before subscribing!", 400);
    }

    if (existingFollow.isSubscribed) {
        throw new ApiError("You are already subscribed to this user!", 400);
    }

    const subscription = await prisma.follow.update({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            },
        },
        data: {
            isSubscribed: true,
        },
    });

    return subscription;
}


export async function unsubscribeFromUser(followerId: string, followingId: string) {

    if (followerId === followingId) {
        throw new ApiError("You cannot unsubscribe from yourself!", 400);
    }

    const followingUser = await prisma.user.findUnique({
        where: { id: followingId }
    });

    if (!followingUser) {
        throw new ApiError("Cannot unsubscribe from this user cuz user not found", 404);
    }

    const existingFollow = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            }
        }
    });

    if (!existingFollow || !existingFollow.isSubscribed) {
        throw new ApiError("You are not subscribed to this user!", 400);
    }

    const unsubscribed = await prisma.follow.update({
        where: {
            followerId_followingId: {
                followerId,
                followingId,
            },
        },
        data: {
            isSubscribed: false,
        },
    });

    return unsubscribed;
}