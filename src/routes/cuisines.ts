import express, { type Request, type Response } from "express";
import { initializeRedisClient } from "../utils/client";
import { cuisineKey, cuisinesKey, restaurantKeyById } from "../utils/keys";
import { successRes } from "../utils/responses";


const router = express.Router();


router.get('/', async (req: Request, res: Response) => {
    
    try{

        const client = await initializeRedisClient();

        const cuisines = await client.sMembers(cuisinesKey);

        return successRes(res, cuisines);

    } catch(error){
        console.log('error', error);
    }

});



router.get('/:cuisine', async (req: Request, res: Response) => {

    try{

        const {cuisine} = req.params;

        const client = await initializeRedisClient();

        const restaurantIds = await client.sMembers(cuisineKey(cuisine as string));

        const restaurants = await Promise.all(restaurantIds.map(async (id:string) =>  await client.hGet(restaurantKeyById(id), "name")));

        return successRes(res, restaurants);

    } catch(error){
        console.log('error', error)
    }

})
export default router;