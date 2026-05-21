import express from "express";
 import { uploadSingleFile,deleteSingleFile } from "../Controllers/file.controller.js";
import { isAuthenticated } from "../Middlewares/auth.js";
import { upload } from "../Middlewares/multer.js";

const filerouter = express.Router();

filerouter.post("/upload", isAuthenticated, upload.single("file"), uploadSingleFile);

filerouter.delete("/delete", isAuthenticated, deleteSingleFile);

export default filerouter;