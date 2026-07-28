import express from "express";
import { isAuthenticated } from '../Middlewares/auth.js';
import { myDetails, updatePersonalDetails, updateFamilyDetails, updatePersonalBackground, updateReligiousBackground, updateLocationDetails, updateEducationAndFinancialDetails, MatchedProfiles, UserDetails, filterFieldCount, updateInterstAndHobbies, UpdatephotoUpload, adminProfileImage, matrimonialProfiles, getuserImage, allProfiles, getProfilePercentage, discoverProfiles, getFilteredProfile } from '../Controllers/profile.controller.js'
import { upload } from "../Middlewares/multer.js";




const profileRouter = express.Router();


profileRouter.get('/mydetails', isAuthenticated, myDetails);
profileRouter.get('/get-profile-img', isAuthenticated, adminProfileImage);
profileRouter.get('/get-matrimonial-profiles', isAuthenticated, matrimonialProfiles);
profileRouter.put('/updatePersonalDetails', isAuthenticated, updatePersonalDetails);
profileRouter.put('/updateFamilyDetails', isAuthenticated, updateFamilyDetails);
profileRouter.put('/updatePersonalBackground', isAuthenticated, updatePersonalBackground);
profileRouter.put('/updateReligiousBackground', isAuthenticated, updateReligiousBackground);
profileRouter.put('/updateLocationDetails', isAuthenticated, updateLocationDetails);
profileRouter.put('/updateInterstAndHobbies', isAuthenticated, updateInterstAndHobbies);
profileRouter.put('/updateEducationAndFinancialDetails', isAuthenticated, updateEducationAndFinancialDetails);
profileRouter.put('/updatephotoUpload', isAuthenticated, upload.array('profileImage', 3), UpdatephotoUpload)
profileRouter.get('/getProfiles', isAuthenticated, MatchedProfiles)
profileRouter.get('/filterFieldCount', isAuthenticated, filterFieldCount)
profileRouter.post('/getUserDetails', isAuthenticated, UserDetails)
// profileRouter.get('/filterProfiles' ,isAuthenticated,filterProfiles)
profileRouter.get('/getuserImage', isAuthenticated, getuserImage)
profileRouter.get('/allProfiles', isAuthenticated, allProfiles)
profileRouter.get('/discoverProfiles', isAuthenticated, discoverProfiles)
profileRouter.get('/getProfilePercentage', isAuthenticated, getProfilePercentage)
profileRouter.get('/filtered-profiles', isAuthenticated, getFilteredProfile);



export default profileRouter
