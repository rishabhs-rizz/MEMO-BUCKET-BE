import { Request } from "express";
import { UserModel } from "./db";

declare module 'express-serve-static-core' {
    interface Request {
        userId?: userModel._id
    }
}