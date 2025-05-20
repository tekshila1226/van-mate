import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { initSocketIO } from './utils/socket.js';
import userRoutes from './routes/userRoutes.js';
import childRoutes from './routes/childRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import busRoutes from './routes/busRoutes.js'; // Add this line with your other route imports
import notificationRoutes from './routes/notificationRoutes.js'; // Add this with your other route imports

// Initialize express app
dotenv.config();
const app = express();
const server = http.createServer(app);

// Initialize socket.io
initSocketIO(server);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/children', childRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/buses', busRoutes); // Then add this line where you register other routes
app.use('/api/notifications', notificationRoutes); // Add this with your other app.use statements

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});