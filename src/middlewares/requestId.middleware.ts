import { v4 as uuidv4 } from "uuid";

export const requestId = (req: any, res: any, next: any) => {
    req.id = uuidv4();
    res.setHeader("x-request-id", req.id);
    next();
};