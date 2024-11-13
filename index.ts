import express, { Request, Response } from "express";
import cors from "cors";
import dbconnect from "./src/utils/dbconnect";
import dotenv from "dotenv";
import BookingRoutes from "./src/routes/BookingRoutes";
import AuthRoutes from "./src/routes/AuthRoutes";
import UserRoutes from "./src/routes/UserRoutes";
import ServiceRoutes from "./src/routes/ServiceRoute";
import cookieParser from "cookie-parser";
import SpaceRoutes from "./src/routes/SpaceRoute";
import creditRoutes from "./src/routes/creditRoute";
import { cronHandler } from "./api/cron"; // Import your cron handler
import careerRoutes from "./src/routes/careerRoutes";
import daypassroutes from "./src/routes/DayPassRoute";

//import order route
import orderRoutes from "./src/routes/OrderRoutes";

//morgan
const morgan = require("morgan");

//helmet
const helmet = require("helmet");

//rate limiter
const rateLimit = require("express-rate-limit");

const app = express();
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet());

//limit request from same api
const limiter = rateLimit({
  max: 100, //100 req per hour
  windowMs: 15 * 60 * 1000,
  message: "Too many requests from this IP,please try again in an hour",
});
app.use("/api", limiter);

const port = process.env.PORT || 3000;

// dotenv.config({ path: "backend/.env" });
dotenv.config({ path: "./.env" });
dbconnect().catch((err) => console.error("Database connection error:", err));

app.use(express.json());

let allowedOrigins: string[];
//new chages made
allowedOrigins = [
  "https://www.603thecoworkingspace.com",
  "https://603-cws-frontend.vercel.app",
  "https://603coworkingspace-piyush-joshis-projects.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      console.log("Request Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.get("/api/cron", cronHandler);
app.use("/api/v1/services", ServiceRoutes);
app.use("/api/v1/spaces", SpaceRoutes);
app.use("/api/v1/bookings", BookingRoutes);
app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/users", UserRoutes);
app.use("/api/v1/career", careerRoutes);
app.use("/api/v1/credits", creditRoutes);
app.use("/api/v1/daypass", daypassroutes);

//payment route
app.use("/api/v1/order", orderRoutes);

app.get("/", (req: Request, res: Response) => {
  console.log("Root URL accessed");
  res.send("Welcome to the API");
});

// Catch-all route for undefined routes
app.use((req: Request, res: Response) => {
  console.log("Undefined route accessed:", req.originalUrl);
  res.status(404).send("Route not found");
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
