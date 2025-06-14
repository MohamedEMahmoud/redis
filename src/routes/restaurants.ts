import express, { type Request, type Response } from "express";
import { validate } from "../middlewares/validate";
import { RestaurantSchema, Restaurant } from "../schemas/restaurant";

const router = express.Router();




router.post('/', validate(RestaurantSchema), (req: Request, res: Response) => {

    const data = req.body as Restaurant;

    res.send('restaurants');
});


export default router;