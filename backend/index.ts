import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import { handleFileUpload } from "./controller/fileUpload/FileUpload.controller";
import { connectDB } from "./utils/mongoConnect";
import { getDataFromCollection } from "./controller/getData/GetData.controller";
import { updateEntityById } from "./controller/updateData/UpdateData.controller";
dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 5000;
app.use(cors());
const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), handleFileUpload);
app.get("/data/:collectionName", getDataFromCollection);
app.patch("/data/update-entity", updateEntityById);

// ✅ CONNECT TO MONGODB
connectDB(); // make sure this runs before app.listen()

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});