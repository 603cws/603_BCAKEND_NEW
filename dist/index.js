"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dbconnect_1 = __importDefault(require("./src/utils/dbconnect"));
const dotenv_1 = __importDefault(require("dotenv"));
const BookingRoutes_1 = __importDefault(require("./src/routes/BookingRoutes"));
const AuthRoutes_1 = __importDefault(require("./src/routes/AuthRoutes"));
const UserRoutes_1 = __importDefault(require("./src/routes/UserRoutes"));
const ServiceRoute_1 = __importDefault(require("./src/routes/ServiceRoute"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const SpaceRoute_1 = __importDefault(require("./src/routes/SpaceRoute"));
const creditRoute_1 = __importDefault(require("./src/routes/creditRoute"));
const cron_1 = require("./api/cron"); // Import your cron handler
const careerRoutes_1 = __importDefault(require("./src/routes/careerRoutes"));
const DayPassRoute_1 = __importDefault(require("./src/routes/DayPassRoute"));
//import order route
const OrderRoutes_1 = __importDefault(require("./src/routes/OrderRoutes"));
//morgan
const morgan = require("morgan");
//helmet
const helmet = require("helmet");
//rate limiter
const rateLimit = require("express-rate-limit");
const app = (0, express_1.default)();
app.use((0, cookie_parser_1.default)());
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
dotenv_1.default.config({ path: "./.env" });
(0, dbconnect_1.default)().catch((err) => console.error("Database connection error:", err));
app.use(express_1.default.json());
let allowedOrigins;
//new chages made
allowedOrigins = [
    "https://www.603thecoworkingspace.com",
    "https://603-cws-frontend.vercel.app",
    "https://603coworkingspace-piyush-joshis-projects.vercel.app",
    "http://localhost:5173",
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        console.log("Request Origin:", origin);
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
app.get("/api/cron", cron_1.cronHandler);
app.use("/api/v1/services", ServiceRoute_1.default);
app.use("/api/v1/spaces", SpaceRoute_1.default);
app.use("/api/v1/bookings", BookingRoutes_1.default);
app.use("/api/v1/auth", AuthRoutes_1.default);
app.use("/api/v1/users", UserRoutes_1.default);
app.use("/api/v1/career", careerRoutes_1.default);
app.use("/api/v1/credits", creditRoute_1.default);
app.use("/api/v1/daypass", DayPassRoute_1.default);
//payment route
app.use("/api/v1/order", OrderRoutes_1.default);
app.get("/", (req, res) => {
    console.log("Root URL accessed");
    res.send("Welcome to the API");
});
// Catch-all route for undefined routes
app.use((req, res) => {
    console.log("Undefined route accessed:", req.originalUrl);
    res.status(404).send("Route not found");
});
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
