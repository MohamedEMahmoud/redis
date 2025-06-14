import { type Request, type Response } from "express";


export function successRes(res: Response, data: Object, message: string = "Success") {
    return res.status(200).json(data);
}


export function errorRes(res: Response, status: number, error: string) {
    return res.status(status).json({ success: false, error });
}