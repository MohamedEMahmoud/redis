import express from 'express';
import restaurants from './src/routes/restaurants';
import cuisines from './src/routes/cuisines';
import { errorHandler } from './src/middlewares/errorHandler';
const PORT = process.env.PORT || 3000;
const app = express();


app.use([
    express.json(),
])

app.use('/restaurants', restaurants);

app.use('/cuisines', cuisines);

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}).on("error", (error) => {
    throw new Error(error.message)
} );