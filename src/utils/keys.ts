export function getKeyName(...args: string[]){
    return `bites:${args.join(':')}`
}

export const restaurantKeyById = (id: string) => getKeyName('restaurants', id);

export const reviewKeyById = (id: string) => getKeyName('reviews', id);

export const reviewDetailsKeyById = (id: string) => getKeyName('reviews:details', id);

export const cuisinesKey = getKeyName('cuisines');

export const cuisineKey = (name: string) => getKeyName('cuisines', name);

export const restaurantCuisinesKeyById = (id: string) => getKeyName('restaurants:cuisines', id);

export const restaurantsByRatingKey = getKeyName('restaurants:rating');

export const weatherKeyById = (id: string) => getKeyName('weather', id);

export const restaurantDetailsKeyById = (id: string) => getKeyName('restaurants:details', id);

export const indexKey = getKeyName("idx", "restaurants");

export const bloomKey = getKeyName("bloom_restaurants");