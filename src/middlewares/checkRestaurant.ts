import type { Request, Response, NextFunction } from "express";
import { initializeRedisClient } from "../utils/client";
import { restaurantKeyById } from "../utils/keys";
import { errorRes } from "../utils/responses";

export const checkRestaurant = async (req: Request, res: Response, next: NextFunction) => {

    const { restaurantId } = req.params;

    if(!restaurantId) return errorRes(res, 400, 'restaurantId is required');

    try{
        const client  = await initializeRedisClient();

        const restaurantKey = restaurantKeyById(restaurantId as string);

        const exist = await client.exists(restaurantKey);
        if(!exist) return errorRes(res, 400, 'Invalid restaurantId');
        next();
    } catch(error){
        console.log('error', error);
        next(error)
    }
}