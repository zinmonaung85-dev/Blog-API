import { Request, Response, NextFunction } from 'express';
import { RegisterDto } from "../dtos/register-dto";
import { LoginDto } from "../dtos/login-api.dto";
import { RefreshAccessTokenDto } from "../dtos/refresh-access-token.dto";
import * as userService from "../model/user.service";
import { handleErrors } from "./handle-errors";


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



interface AuthenticatedRequest extends Request {
    user: { id: string };
}

export async function getMe(req: Request, res: Response): Promise<void | Response> {
    try {

        const authReq = req as AuthenticatedRequest;

        const userId = authReq.user.id;

        console.log("Retrieved userId from middleware:", userId);

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