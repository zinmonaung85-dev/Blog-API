import { Response } from "express";
import { ApiError } from "./api-error";
import z from "zod";

function handleErrors(res: Response, err: unknown) {

    if (err instanceof ApiError) {
        return res
            .status(err.statusCode)
            .json({ message: err.message, statusCode: err.statusCode });
    }

    if (err instanceof z.ZodError) {
        const fields = err.issues.map((issue) => issue.path[0]).join(", ");
        return res.status(400).json({ message: `Invalid data in fields: ${fields}`, });
    }

    console.error(err);

    const errorMessage = err instanceof Error ? err.message : "Internal server error";

    return res
        .status(500)
        .json({ message: errorMessage });
}

export { handleErrors };

