import express from "express";
import {
    createDropdownType, createDropdownTypeBulk, createDropdownBulk, createDropdown, IncomeDropdown,
    fatherOccupationDropdown, motherOccupationDropdown, gotrasDropdown, religionDropdown, communityDropdown,
    motherToungueDropdown, heightDropdown, qualificationDropdown, occupationDropdown, smokingHabbitDropdown,
    drinkingHabbitDropdown, dietDropdown, complexionDropdown, ethnicsDropdown,australianVisaStatusDropdown, maritalStatusDropdown, citizenshipDropdown,
    casteDropdown, bodyTypeDropdown,updateDropdown,deleteDropdownType,deleteDropdown,updateDropdownType,  fetchAllDropdowns

} from "../Controllers/dropdown.controller.js";
import { isAuthenticated } from "../Middlewares/auth.js";

const dropdownRouter = express.Router();


dropdownRouter.post('/createDropdownType', createDropdownType);
dropdownRouter.post('/createDropdownTypeBulk', createDropdownTypeBulk);
dropdownRouter.post('/createDropdownBulk', createDropdownBulk);
dropdownRouter.post('/createDropdown', createDropdown);
dropdownRouter.put('/updateDropdown', isAuthenticated, updateDropdown);
dropdownRouter.delete('/deleteDropdownType', isAuthenticated, deleteDropdownType);
dropdownRouter.put('/updateDropdownType', isAuthenticated, updateDropdownType);
dropdownRouter.delete('/deleteDropdown', isAuthenticated, deleteDropdown);
dropdownRouter.get('/getIncomeDropdown', isAuthenticated, IncomeDropdown);
dropdownRouter.get('/getFatherOccupationDropdown', isAuthenticated, fatherOccupationDropdown);
dropdownRouter.get('/getMotherOccupationDropdown', isAuthenticated, motherOccupationDropdown);
dropdownRouter.get('/getGotrasDropdown', isAuthenticated, gotrasDropdown);
dropdownRouter.get('/getReligionDropdown', isAuthenticated, religionDropdown);  
dropdownRouter.get('/getCommunityDropdown', isAuthenticated, communityDropdown);
dropdownRouter.get('/getMotherToungueDropdown', isAuthenticated, motherToungueDropdown);
dropdownRouter.get('/getHeightDropdown', isAuthenticated, heightDropdown);
dropdownRouter.get('/getQualificationDropdown', isAuthenticated, qualificationDropdown);
dropdownRouter.get('/getOccupationDropdown', isAuthenticated, occupationDropdown);
dropdownRouter.get('/getSmokingHabbitDropdown', isAuthenticated, smokingHabbitDropdown);
dropdownRouter.get('/getDrinkingHabbitDropdown', isAuthenticated, drinkingHabbitDropdown);
dropdownRouter.get('/getDietDropdown', isAuthenticated, dietDropdown);
dropdownRouter.get('/getComplexionDropdown', isAuthenticated, complexionDropdown);
dropdownRouter.get('/getAustralianVisaStatusDropdown', isAuthenticated, australianVisaStatusDropdown);
dropdownRouter.get('/getEthnicsDropdown', isAuthenticated, ethnicsDropdown);
dropdownRouter.get('/getMaritalStatusDropdown', isAuthenticated, maritalStatusDropdown);
dropdownRouter.get('/getCitizenshipDropdown', isAuthenticated, citizenshipDropdown);
dropdownRouter.get('/getCasteDropdown', isAuthenticated, casteDropdown);
dropdownRouter.get('/getBodyTypeDropdown', isAuthenticated, bodyTypeDropdown);
// tst
dropdownRouter.get('/fetchAllDropdowns', fetchAllDropdowns);





export default dropdownRouter; 