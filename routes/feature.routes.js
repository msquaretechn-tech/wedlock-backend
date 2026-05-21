import express from "express";
import { createFeature,getFeature } from "../Controllers/feature.controller.js";
import { isAuthenticated } from "../Middlewares/auth.js";

const featureRouter = express.Router();


featureRouter.post('/createFeature',isAuthenticated,createFeature);
featureRouter.get('/getFeatures',isAuthenticated,getFeature);

export default featureRouter