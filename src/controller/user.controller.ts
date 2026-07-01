import { Request, Response, NextFunction } from 'express';
import { RegisterDto } from "../dtos/register-dto";
import { LoginDto } from "../dtos/login-api.dto";
import { SearchUsersDto } from '../dtos/search-users-api.dto';
import { RefreshAccessTokenDto } from "../dtos/refresh-access-token.dto";
import * as userService from "../model/user.service";
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { handleErrors } from "./handle-errors";
import { Result } from 'pg';
import { GetBlogListDto } from '../dtos/get-blog-list-api.dto';


export async function register(req: Request, res: Response): Promise<void | Response> {
    try {
        const body = req.body;

        const input = RegisterDto.parse(body);

        console.log(input);

        const createdUser = await userService.register(input);

        return res.status(201).json({
            data: createdUser,
            message: "Registered user successfully...!",
        });

    } catch (err) {
        handleErrors(res, err);
    }
}



export async function login(req: Request, res: Response): Promise<void | Response> {
    try {

        const body = req.body;

        const input = LoginDto.parse(body);

        const token = await userService.login(input);

        return res.json({
            data: token,
            message: "Logined successfully!"
        });
    } catch (err) {
        handleErrors(res, err);
    }
}


export async function refreshAccessToken(req: Request, res: Response): Promise<void | Response> {

    try {
        const body = req.body;

        const input = RefreshAccessTokenDto.parse(body);

        const token = await userService.refreshAccessToken(input.refreshToken);

        return res.status(200).json({
            data: token,
            message: "Access token generated successfully!"
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void | Response> {
    try {


        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        const user = await userService.getMe(userId);

        return res.status(200).json({
            userInfo: {
                id: user.id,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
            },
            message: "Retrieved user information successfully!",
        });
    } catch (err) {
        handleErrors(res, err);
    }
}


export async function searchUsers(req: AuthenticatedRequest, res: Response) {
    try {
        const currentUserId = req.user?.id;

        const input = SearchUsersDto.parse(req.body);

        if (!currentUserId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }


        const user = await userService.searchUsers(currentUserId, input);

        return res.status(200).json({
            data: user,
            message: "Searched users successfully!",
        });
    } catch (err) {
        handleErrors(res, err);
    }
}


export async function followUser(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const followerId = req.user?.id;

        const followingId = req.params.id;

        if (!followerId) {
            return res.status(401).json({
                success: false,
                message: "Follower not found!.",
            });
        }

        if (!followingId) {
            return res.status(401).json({
                success: false,
                message: "Following user not found!.",
            });
        }

        const user = await userService.followUser(followerId, followingId as string);

        return res.status(201).json({
            message: "Followed successfully!!!",
            data: user,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function unfollowUser(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const followerId = req.user?.id;

        const followingId = req.params.id;

        if (!followerId) {
            return res.status(401).json({
                success: false,
                message: "Follower not found!.",
            });
        }

        if (!followingId) {
            return res.status(401).json({
                success: false,
                message: "Following user not found!.",
            });
        }

        const deletedFollow = await userService.unfollowUser(followerId, followingId as string);

        return res.status(200).json({
            message: "Unfollowed successfully!!!",
            data: deletedFollow,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function getFollowersList(req: AuthenticatedRequest, res: Response) {

    try {
        const followerId = req.user?.id;

        const followingId = req.params.id;

        if (!followerId) {
            return res.status(401).json({
                success: false,
                message: "Follower not found!.",
            });
        }

        if (!followingId) {
            return res.status(401).json({
                success: false,
                message: "Following user not found!.",
            });
        }
        const input = GetBlogListDto.parse(req.body);

        const followers = await userService.getFollowersList(followerId, followingId as string, input);

        return res.status(200).json({
            data: followers,
            message: "Followers list fetched successfully!",
        });
    } catch (err) {
        handleErrors(res, err);
    }
}

export async function getFollowingList(req: AuthenticatedRequest, res: Response) {

    try {

        const followerId = req.params.id;

        const currentUserId = req.user?.id;

        if (!followerId) {
            return res.status(401).json({
                success: false,
                message: "Follower not found!.",
            });
        }

        if (!currentUserId) {
            return res.status(401).json({
                success: false,
                message: "Current user not found!.",
            });
        }
        const input = GetBlogListDto.parse(req.body);

        const following = await userService.getFollowingList(followerId as string, currentUserId, input);

        return res.status(200).json({
            data: following,
            message: "Following list fetched successfully!",
        });
    } catch (err) {
        handleErrors(res, err);
    }
}


export async function subscribeToUser(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const followerId = req.user?.id;

        const followingId = req.params.id;

        if (!followerId) {
            return res.status(401).json({
                success: false,
                message: "Subscriber not found!.",
            });
        }

        if (!followingId) {
            return res.status(401).json({
                success: false,
                message: "User not found!.",
            });
        }

        const subscription = await userService.subscribeToUser(followerId, followingId as string);

        return res.status(201).json({
            message: "Subscribed successfully!!!",
            data: subscription,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function unsubscribeFromUser(req: AuthenticatedRequest, res: Response): Promise<void | Response> {

    try {

        const followerId = req.user?.id;

        const followingId = req.params.id;

        if (!followerId) {
            return res.status(401).json({
                success: false,
                message: "Subscriber not found!.",
            });
        }

        if (!followingId) {
            return res.status(401).json({
                success: false,
                message: "User not found!.",
            });
        }

        const unsubscribed = await userService.unsubscribeFromUser(followerId, followingId as string);

        return res.status(201).json({
            message: "Unsubscribed successfully!!!",
            data: unsubscribed,
        });

    } catch (err) {
        handleErrors(res, err);
    }
}


export async function getUserSuggestion(req: AuthenticatedRequest, res: Response) {
    try {
        const currentUserId = req.user?.id;

        const input = GetBlogListDto.parse(req.body);

        if (!currentUserId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }


        const users = await userService.getUserSuggestion(currentUserId, input);

        return res.status(200).json({
            data: users,
            message: "Fetched user suggestion successfully!",
        });
    } catch (err) {
        handleErrors(res, err);
    }
}














