import cors from "cors";
import express from "express";
import { avatarRouter } from "./routes/avatar.routes.js";
import { errorHandler } from "./utils/apiError.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/avatar", avatarRouter);
app.use(errorHandler);
