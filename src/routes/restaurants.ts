import express, { type Request, type Response } from "express";
import { validate } from "../middlewares/validate";
import { RestaurantSchema, Restaurant } from "../schemas/restaurant";
import { initializeRedisClient } from "../utils/client";

const router = express.Router();




router.post('/', validate(RestaurantSchema), async (req: Request, res: Response) => {

    const data = req.body as Restaurant;

    const client  = await initializeRedisClient();

    res.send('restaurants');
});


export default router;