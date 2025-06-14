import type {Request, Response, NextFunction} from 'express';
import {errorRes} from '../utils/responses';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction){
    console.log('error', err);
    errorRes(res, 500, err);
}