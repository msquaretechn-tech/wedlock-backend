import express from "express";
import { isAuthenticated} from '../Middlewares/auth.js';
import {toggleFav,getFavProfile} from '../Controllers/favProfile.controller.js'

const favProfileRouter = express.Router();


favProfileRouter.post('/toggleFav',isAuthenticated,toggleFav);
favProfileRouter.get('/getFavProfile',isAuthenticated,getFavProfile);
// favProfileRouter.post('/removeFavProfile',isAuthenticated,removeFavProfile);

export default favProfileRouter

