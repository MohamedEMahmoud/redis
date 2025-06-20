import { cuisinesKey, restaurantCuisinesKeyById, restaurantKeyById, reviewDetailsKeyById, reviewKeyById, cuisineKey, restaurantsByRatingKey, weatherKeyById, restaurantDetailsKeyById } from './../utils/keys';
import express, { type Request, type Response, type NextFunction } from "express";
import { validate } from "../middlewares/validate";
import { RestaurantSchema, Restaurant, RestaurantDetailsSchema, type RestaurantDetails } from "../schemas/restaurant";
import { initializeRedisClient } from "../utils/client";
import { nanoid } from "../../node_modules/nanoid/index";
import { errorRes, successRes } from '../utils/responses';
import { checkRestaurant } from '../middlewares/checkRestaurant';
import { ReviewSchema, type Review } from '../schemas/review';

const router = express.Router();


router.get("/", async (req, res, next) => {

    const {page = 1, limit = 10} = req.query;

    const start = (+page - 1) * +limit;


    const end = start + +limit;

    try{


            const client = await initializeRedisClient();

            const restaurantIds = await client.zRange(restaurantsByRatingKey, start, end, {Rev: true});

            const restaurants = await Promise.all(restaurantIds.map(async (id:string) => await client.hGetAll(restaurantKeyById(id))))

            return successRes(res, restaurants, "get restaurants");

    } catch(error){
        console.log('error', error)
    }
})

router.post("/", validate(RestaurantSchema), async (req, res, next) => {
    const data = req.body as Restaurant;
    try {
        const client = await initializeRedisClient();
        const id = nanoid();
        const restaurantKey = restaurantKeyById(id);
        const bloomString = `${data.name}:${data.location}`;
        // const seenBefore = await client.bf.exists(bloomKey, bloomString);
        // if (seenBefore) {
        // return errorResponse(res, 409, "Restaurant already exists");
        // }
        const hashData = { id, name: data.name, location: data.location };
        await Promise.all([
        ...data.cuisines.map((cuisine) =>
            Promise.all([
            client.sAdd(cuisinesKey, cuisine),
            client.sAdd(cuisineKey(cuisine), id),
            client.sAdd(restaurantCuisinesKeyById(id), cuisine),
            ])
        ),
        client.hSet(restaurantKey, hashData),
        client.zAdd(restaurantsByRatingKey, {
            score: 0,
            value: id,
        }),
        // client.bf.add(bloomKey, bloomString),
        ]);
        return successRes(res, hashData, "Added new restaurant");
    } catch (error) {
        next(error);
    }
});

router.post('/:restaurantId/details', checkRestaurant, validate(RestaurantDetailsSchema), async (req: Request, res: Response, next: NextFunction) => {

    const {restaurantId} = req.params;

    const data = req.body as RestaurantDetails;

    try{

        const client = await initializeRedisClient();

        const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId as string);

        await client.json.set(restaurantDetailsKey, '$', data);

        return successRes(res, {}, 'Restaurant details added');

    } catch(error){
        console.log('error', error);
    }
})


router.get('/:restaurantId/details', checkRestaurant, async (req: Request, res: Response, next: NextFunction) => {

    const {restaurantId} = req.params;

    const data = req.body as RestaurantDetails;

    try{

        const client = await initializeRedisClient();

        const restaurantDetailsKey = restaurantDetailsKeyById(restaurantId as string);

        const details =  await client.json.get(restaurantDetailsKey);

        return successRes(res, details, 'Restaurant details added');

    } catch(error){
        console.log('error', error);
    }
})

router.get('/:restaurantId/weather', checkRestaurant, async (req: Request, res: Response) => {

    try{

        const {restaurantId} = req.params;

        const client = await initializeRedisClient();

        const weatherKey = weatherKeyById(restaurantId as string);

        const cachedWeather = await client.get(weatherKey);

        if(cachedWeather) {
            console.log('Cache Hit')
            return successRes(res, JSON.parse(cachedWeather));
        }
        const restaurantKey = restaurantKeyById(restaurantId as string);

        const coords = await client.hGet(restaurantKey, "location");

        if(!coords) {
            return errorRes(res, 404, 'coordinates have not been found');
        }


        const [lng, lat] = coords.split(',');

        const apiResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?units=imperial&lat=${lat}&lon=${lng}&appid=${process.env.WEATHER_API_KEY}`);

        if(Number(apiResponse.status) !== 200){

            return errorRes(res, 500, `Couldn't fetch weather info`);

        }

        const json = await apiResponse.json();

        await client.set(weatherKey, JSON.stringify(json), {
            EX: 60 * 60,
        });

        return successRes(res, json);

    } catch(error){
        console.log('error', error)
    }
})

router.get('/:restaurantId', checkRestaurant,  async (req: Request, res: Response, next: NextFunction) => {


        const { restaurantId } = req.params;

    try{


        const client  = await initializeRedisClient();

        const restaurantKey = restaurantKeyById(restaurantId as string);

        const [viewCount, restaurant, cuisines] = await Promise.all([
            client.hIncrBy(restaurantKey, 'views:count', 1),
            client.hGetAll(restaurantKey),
            client.sMembers(restaurantCuisinesKeyById(restaurantId as string))
        ])
        console.log(restaurantKey, viewCount, restaurant)
        return successRes(res, {viewCount, ...restaurant, cuisines}, "get restaurant");

    } catch(error){
        console.log('error', error);
        next(error)
    }

})



router.post("/:restaurantId/reviews", checkRestaurant, validate(ReviewSchema), async (req: Request, res: Response, next: NextFunction) => {


    const { restaurantId } = req.params;

    const data = req.body as Review;

    try{
    
        const client  = await initializeRedisClient();

        const reviewId = nanoid();

        const reviewKey = reviewKeyById(restaurantId as string);

        const reviewDetailsKey = reviewDetailsKeyById(reviewId);

        const restaurantKey = restaurantKeyById(restaurantId as string);

        const reviewData = {id: reviewId, ...data, timestamp: Date.now(), restaurantId}


        const [reviewCount, setResult, total] = await Promise.all([
            client.lPush(reviewKey, reviewId),
            client.hSet(reviewDetailsKey, reviewData),
            client.hIncrByFloat(restaurantKeyById(restaurantKey), "totalStars", data.rating)
        ]);

        const averageRating = Number(+total / reviewCount).toFixed(1)

        await Promise.all([

            client.zAdd(restaurantsByRatingKey, {score: +averageRating, value: restaurantId}),

            client.hSet(restaurantKey, "avgStars", averageRating)
        ])

        return successRes(res, reviewData, "Review added")
    } catch(error){
        console.log('error', error);
        next(error)
    }

})

router.get("/:restaurantId/reviews", checkRestaurant, async (req: Request, res: Response, next: NextFunction) => {


    const { restaurantId } = req.params;

    const {page = 1, limit = 10} = req.query;

    const start = (+page - 1) * +limit;

    const end = start + +limit - 1;

    try{
    
        const client  = await initializeRedisClient();

        const reviewKey = reviewKeyById(restaurantId as string);

        const reviewIds = await client.lRange(reviewKey, start, end);

        const reviews = await Promise.all(reviewIds.map(async (id:string) =>  await client.hGetAll(reviewDetailsKeyById(id))));

        return successRes(res, reviews, "get reviews");

    } catch(error){
        console.log('error', error);
        next(error)
    }

});

router.delete("/:restaurantId/reviews/:reviewId", checkRestaurant, async (req: Request, res: Response, next: NextFunction) => {

    const {restaurantId, reviewId} = req.params;

    try{

        const client = await initializeRedisClient();

        const reviewKey = reviewKeyById(restaurantId as string);

        const reviewDetailsKey = reviewDetailsKeyById(reviewId as string);

        const [removeResult, deleteResult] = await Promise.all([
            client.lRem(reviewKey, 0, reviewId),
            client.del(reviewDetailsKey)
        ])

        if(removeResult === 0) return errorRes(res, 400, 'Invalid reviewId');


        return successRes(res, reviewId as string, "Review deleted");


    } catch(error){
        console.log('error', error);
    }

})



export default router;