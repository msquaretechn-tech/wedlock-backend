import express from "express";
import { isAuthenticated } from "../Middlewares/auth.js";
import { toggleSection } from "../Controllers/toggleSection.controller.js";

const toggleRouter = express.Router();

toggleRouter.post('/toggle',isAuthenticated,toggleSection);

export default toggleRouter;