import express from "express";
import { isAuthenticated} from '../Middlewares/auth.js';
import {UpdateCallDuration,getCallDuration, getZegoToken} from '../Controllers/call.controller.js'

const callRouter = express.Router();

callRouter.put('/updateCallDuration',isAuthenticated,UpdateCallDuration);
callRouter.get('/getCallDuration/:callieId',isAuthenticated,getCallDuration);
callRouter.post('/generate-zego-token', isAuthenticated, getZegoToken);

export default callRouter;
 