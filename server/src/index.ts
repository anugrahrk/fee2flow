import express, { Request, Response } from "express";
import http from "http";
import { initSocket } from './services/socketService.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { config } from 'dotenv'
import cors from 'cors';
import mongoose from "mongoose";
import { clerkMiddleware } from '@clerk/express'
import { limiter } from './middleware/rateLimiter.js';
import path from 'path';
import { initCronJobs } from './services/cronService.js';
import razorpayRoutes from "./routes/razorpayRoutes.js";
import authRoutes from './routes/authRoutes.js';
// import adminStatsRoutes from './routes/adminStatsRoutes.js';
import studentRoutes from './routes/studentRoutes.js';

config()
const app = express()
const server = http.createServer(app);
// Initialize WebSockets
initSocket(server);

const corsOptions = {
    // Allow both the web client and mobile app origins
    origin: true, // Allow all origins during development (mobile app connects from dynamic IPs)
    optionsSuccessStatus: 200
};


app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[DEBUG] IP: ${req.ip}`);
    next();
});
// app.use(limiter); // Apply rate limiting to all requests

// Serve uploaded files statically
app.use('/upload', express.static(path.join(process.cwd(), 'upload')));

// Initialize Cron Jobs
initCronJobs();

app.use(clerkMiddleware())
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Server is healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});
const PORT = process.env.PORT || 8080
const MONGO_URI = process.env.MONGO_URI || '';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });
app.use('/api/auth', authRoutes);
app.use('/api/su', superAdminRoutes)
app.use('/api/admin', adminRoutes);
app.use('/payments', razorpayRoutes)
// app.use('/api/admin', adminStatsRoutes); // Admin Stats: /api/admin/stats
app.use('/api/student', studentRoutes);

server.listen(PORT, () => {
    console.log(`Server started at http://localhost:${PORT}`)
})