import { Request, Response } from "express";
import { RegisterDto } from "../dtos/register-dto";
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