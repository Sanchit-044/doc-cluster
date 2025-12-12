import express from "express";
import dotenv from "dotenv";
import allRoutes from "./routes/index";
import cors from "cors"
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors())

app.use("/api", allRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
