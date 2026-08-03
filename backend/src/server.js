import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://farm-fresh-dairy.vercel.app"
      
    ],
    credentials: true,
  })
);