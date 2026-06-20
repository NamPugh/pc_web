import express from 'express';
import path from 'path';
import { connectDB } from './config/db.js';
import dotenv, { parse } from 'dotenv';
import authRoute from './routes/authRoute.js';
import cookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js';
import productRoute from './routes/productRoute.js'
import cartRoute from './routes/cartRoute.js'
import orderRoute from './routes/orderRoute.js';
import categoryRoute from './routes/categoryRoute.js';
import bannerRoute from './routes/bannerRoute.js';
import brandRoute from './routes/brandRoute.js';
import buildPcRoute from './routes/buildPcRoute.js';
import reviewRoute from './routes/reviewRoute.js';
import newsRoute from './routes/newsRoute.js';
import flashSaleRoute from './routes/flashSaleRoute.js';
import homeSectionRoute from './routes/homeSectionRoute.js';
import paymentRoute from './routes/paymentRoute.js';
import siteSettingRoute from './routes/siteSettingRoute.js';
import errorMiddleware from './middlewares/errorMiddleware.js';
dotenv.config();
const PORT = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve('uploads')));
app.get('/api/health', (_req, res) => {
    res.status(200).json({ success: true, service: 'backend' });
});

// public routes
app.use('/api/auth', authRoute);
app.use('/api/categories', categoryRoute);
app.use('/api/brands', brandRoute);
app.use('/api/carts', cartRoute);
app.use('/api/orders', orderRoute);
app.use('/api/payments', paymentRoute);
app.use('/api/build-pc', buildPcRoute);
app.use('/api/banners', bannerRoute);
app.use('/api/news', newsRoute);
app.use('/api/flash-sales', flashSaleRoute);
app.use('/api/home-sections', homeSectionRoute);
app.use('/api/reviews', reviewRoute);
app.use('/api/site-settings', siteSettingRoute);
// private routes
app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use(errorMiddleware.notFound);
app.use(errorMiddleware.errorHandler);
connectDB().then(() => {
    app.listen(PORT, () => {
    console.log(`Server bắt đầu trên cổng ${PORT}`);
    });
});

