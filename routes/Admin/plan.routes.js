import express from "express";
import { editPlan } from "../../Controllers/Admin/plan.controller.js";
import { createPlan ,getAllPlans,deletePlan,getPlansSimple} from "../../Controllers/Admin/plan.controller.js";
import { isAdminAuthenticated } from "../../Middlewares/Admin/isAdminAuthenticated.js";

const planRouter = express.Router();

planRouter.post('/createPlan',isAdminAuthenticated,createPlan);
planRouter.get('/getAllPlans',getAllPlans);
planRouter.delete('/deletePlan',isAdminAuthenticated,deletePlan)
planRouter.put('/editPlan',isAdminAuthenticated,editPlan)
planRouter.get('/getPlanFree',getPlansSimple)
 
export default planRouter