import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import imageRoutes from "./routes/image";
import galleryRoutes from "./routes/gallery";
import wordbankRoutes from "./routes/wordbank";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));

app.use("/api/image", imageRoutes);
app.use("/api/gallery", galleryRoutes);
app.use("/api/wordbanks", wordbankRoutes);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`PixelWords API server running on port ${PORT}`);
});
