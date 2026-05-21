import express from "express";
import { addQuestion } from "../Controllers/question.controller.js";


const questionRouter = express.Router();

questionRouter.post('/addQuestion',addQuestion);

export default questionRouter;