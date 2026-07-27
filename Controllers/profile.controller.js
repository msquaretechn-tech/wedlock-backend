import personalDetails from "../Models/personalDetails.model.js";
import qualificationDetails from "../Models/qualificationDetails.model.js";
import locationDetails from "../Models/locationDetails.model.js";
import otherDetails from "../Models/otherDetails.model.js";
import calculateCompletion from "../Utils/calculateCompletion.js";
import imageUpload from "../Models/imageUpload.model.js";
import question from "../Models/question.model.js";
import Answer from "../Models/answer.model.js";
import User from "../Models/user.js";
import dotenv from "dotenv";
import connection from "../Models/connection.model.js";
import { Op, where, Sequelize } from "sequelize";
import errorhandler from "../Utils/errorhandler.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import { uploadCloudinary } from "../Utils/cloudinary.js";
import recommendation from "../Models/recommendation.model.js";
import ToggleSection from "../Models/toggleSection.model.js";
import { redis } from "../Utils/redis.js";
import axios from "axios";
import moment from 'moment';
import Block from "../Models/block.model.js"
import { parseHeight, parseIncome } from "../Utils/helper.js";



dotenv.config();

export const myDetails = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ where: { userId } });
    const fcmToken = user?.fcmToken;
    const personalData = await personalDetails.findOne({ where: { userId } });
    const qualificationDetailsData = await qualificationDetails.findOne({ where: { userId } });
    const locationDetailsData = await locationDetails.findOne({ where: { userId } });
    const otherDetailsData = await otherDetails.findOne({ where: { userId } });
    const imageUploadData = await imageUpload.findOne({ where: { userId } }) || {};
    const basic_lifestyle = await Answer.findOne({ where: { userId, questionId: 12 } });
    const toggleSection = await ToggleSection.findAll({ where: { userId } });

    const gender = await Answer.findOne({ where: { userId } });
    const age = await Answer.findOne({ where: { userId, questionId: 7 } });
    const postedby = await Answer.findOne({ where: { userId, questionId: 6 } });

    const answer = basic_lifestyle?.answer || "Not specified";


    const sectionNames = [
      "family_details",
      "personal_details",
      "religious_details",
      "location_details",
      "education_and_financial_details"
    ];


    const toggleStatuses = sectionNames.reduce((acc, section) => {
      acc[section] = false;
      return acc;
    }, {});


    toggleSection.forEach((section) => {
      toggleStatuses[section.section] = section.status;
    });

    const data = [{
      fcmToken,
      profileImage: imageUploadData?.image || "No Image",
      toggleStatus: toggleStatuses,
      basic_and_lifestyle: {
        firstName: personalData?.firstName,
        lastName: personalData?.lastName,
        displayName: personalData?.displayName,
        gender: gender?.answer || "Not specified",
        age: age?.answer || "Not specified",
        about: personalData?.aboutYourSelf,
        religion: otherDetailsData?.religion,
        maritalStatus: personalData?.maritalStatus,
        numberOfChildren: personalData?.numberOfChildren,
        postedBy: postedby?.answer || "Not specified",
      },
      family_details: {
        fatherOccupation: otherDetailsData?.fatherOccupation,
        motherOccupation: otherDetailsData?.motherOccupation,
        numberOfSiblings: otherDetailsData?.numberOfSiblings,
        livingWithFamily: otherDetailsData?.livingWithFamily,
      },
      personal_background: {
        height: otherDetailsData?.height,
        weight: otherDetailsData?.weight,
        bodyType: otherDetailsData?.bodyType,
        language: otherDetailsData?.language,
        smokingHabbit: otherDetailsData?.smokingHabbit,
        drinkingHabbit: otherDetailsData?.drinkingHabbit,
        diet: otherDetailsData?.diet,
        complexion: otherDetailsData?.complexion,
      },
      religious_background: {
        religion: otherDetailsData?.religion,
        community: otherDetailsData?.community,
        subCommunity: otherDetailsData?.subCommunity,
        gotra: otherDetailsData?.gotra,
        timeOfBirth: otherDetailsData?.timeOfBirth,
        dateOfBirth: otherDetailsData?.dateOfBirth,
        placeOfBirth: otherDetailsData?.placeOfBirth,
        motherTongue: otherDetailsData?.motherTongue,
      },
      location_background: {
        country: locationDetailsData?.country || "Not specified",
        state: locationDetailsData?.state || "Not specified",
        currentLocation: locationDetailsData?.currentLocation || "Not specified",
        cityOfResidence: locationDetailsData?.cityOfResidence || "Not specified",
        nationality: locationDetailsData?.nationality,
        citizenShip: locationDetailsData?.citizenShip,
        residencyVisaStatus: locationDetailsData?.residencyVisaStatus,
      },
      education_and_financial: {
        qualification: qualificationDetailsData?.qualification,
        occupation: qualificationDetailsData?.occupation,
        workingStatus: qualificationDetailsData?.currentWorkingStatus,
        income: qualificationDetailsData?.income,
      },
      interest_and_hobbies: answer,
    }];

    return res.status(200).json({
      success: true,
      data,
      message: "Profile fetched successfully!",
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});


export const getuserImage = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const imageUploadData = (await imageUpload.findOne({ where: { userId } })) || "";

    const singleImage = imageUploadData.image[0] || "";

    res.status(200).json({
      success: true,
      data: singleImage
    });

    if (!imageUploadData) {
      return next(new errorhandler("Image not found!", 400));
    }


  }
  catch (error) {
    return next(new errorhandler(error.message, 500));
  }

});

export const updatePersonalDetails = catchAsyncError(async (req, res, next) => {
  const userId = req.user.userId;

  const { firstName, lastName, displayName, maritalStatus, aboutYourSelf } = req.body;

  const personalData = await personalDetails.findOne({ where: { userId } });

  if (!personalData) {
    return next(new errorhandler("Personal details not found!", 400));
  }

  await personalDetails.update(
    { firstName, lastName, displayName, aboutYourSelf, maritalStatus },
    { where: { userId } }
  );

  await recommendation.update(
    { firstName, lastName, displayName },
    { where: { userId } }
  );

  res.status(201).json({
    success: true,
    message: "Personal details updated successfully",
  });
});


export const updateFamilyDetails = catchAsyncError(async (req, res, next) => {
  const userId = req.user.userId;
  const {
    fatherOccupation,
    motherOccupation,
    numberOfSiblings,
    livingWithFamily,
  } = req.body;

  const otherDetailsData = await otherDetails.findOne({ where: { userId } });

  if (!otherDetailsData) {
    return next(new errorhandler("Other details not found!", 400));
  }

  const updateOtherDetails = await otherDetails.update(
    { fatherOccupation, motherOccupation, numberOfSiblings, livingWithFamily },
    { where: { userId } }
  );

  await recommendation.update(
    { fatherOccupation, motherOccupation, numberOfSiblings, livingWithFamily },
    { where: { userId } }
  );

  res.status(201).json({
    success: true,
    message: "Family details updated successfully",
    updateOtherDetails,
  });
});

export const updatePersonalBackground = catchAsyncError(async (req, res, next) => {
  try {

    const userId = req.user.userId;
    const {
      height,
      weight,
      bodyType,
      language,
      smokingHabbit,
      drinkingHabbit,
      diet,
      complexion,
    } = req.body;



    const otherDetailsData = await otherDetails.findOne({ where: { userId } });


    if (!otherDetailsData) {
      return next(new errorhandler("Other details not found!", 400));
    }

    const updateOtherDetails = await otherDetails.update(
      {
        height,
        weight,
        bodyType,
        language,
        smokingHabbit,
        drinkingHabbit,
        diet,
        complexion,
      },
      { where: { userId } }
    );

    await recommendation.update(
      {
        height,
        weight,
        bodyType,
        language,
        smokingHabbit,
        drinkingHabbit,
        diet,
        complexion,
      },
      { where: { userId } }
    );

    res.status(201).json({
      success: true,
      message: "Personal Background details updated successfully",
      updateOtherDetails,
    });
  }
  catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});

export const updateReligiousBackground = catchAsyncError(async (req, res, next) => {

  try {
    const userId = req.user.userId;
    const { religion, community, subCommunity, gotra, motherTongue } =
      req.body;


    const otherDetailsData = await otherDetails.findOne({ where: { userId } });

    if (!otherDetailsData) {
      return next(new errorhandler("Other details not found!", 400));
    }

    const updateOtherDetails = await otherDetails.update(
      { religion, community, subCommunity, gotra, motherTongue },
      { where: { userId } }
    );

    await recommendation.update(
      { religion, community, subCommunity, gotra, motherTongue },
      { where: { userId } }
    );

    res.status(201).json({
      success: true,
      message: "Religious Background details updated successfully",
      updateOtherDetails,
    });
  }
  catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});

export const updateLocationDetails = catchAsyncError(async (req, res, next) => {
  const userId = req.user.userId;
  const {
    country,
    state,
    currentLocation,
    cityOfResidence,
    nationality,
    citizenShip,
    residencyVisaStatus,
  } = req.body;


  const locationDetailsData = await locationDetails.findOne({
    where: { userId },
  });

  if (!locationDetailsData) {
    return next(new errorhandler("Location details not found!", 400));
  }


  const updateLocationDetails = await locationDetails.update(
    {
      country,
      state,
      currentLocation,
      cityOfResidence,
      nationality,
      citizenShip,
      residencyVisaStatus,
    },
    { where: { userId } }
  );

  await recommendation.update(
    {
      country,
      state,
      currentLocation,
      cityOfResidence,
      nationality,
      citizenShip,
      residencyVisaStatus,
    },
    { where: { userId } }
  );

  const data = [...updateLocationDetails];

  res.status(201).json({
    success: true,
    message: "Location  details updated successfully",
    data,
  });
});

export const updateEducationAndFinancialDetails = catchAsyncError(
  async (req, res, next) => {
    const userId = req.user.userId;
    const { qualification, currentWorkingStatus, income, occupation } = req.body;



    const qualificationDetailsData = await qualificationDetails.findOne({
      where: { userId },
    });

    if (!qualificationDetailsData) {
      return next(new errorhandler("Qualification details not found!", 400));
    }

    const updateQualificationDetails = await qualificationDetails.update(
      { currentWorkingStatus, income, qualification, occupation },
      { where: { userId } }
    );

    await recommendation.update(
      { qualification, currentWorkingStatus, income, occupation },
      { where: { userId } }
    );

    res.status(201).json({
      success: true,
      message: "Education and Financial details updated successfully",
      updateQualificationDetails,
    });
  }
);

export const updateInterstAndHobbies = catchAsyncError(
  async (req, res, next) => {
    const userId = req.user.userId;
    const { hobbies } = req.body;

    if (!hobbies) {
      return next(new errorhandler("Hobbies field is required!", 400));
    }

    // Check if the Answer exists for the given question and user
    const interestAndHobbiesData = await Answer.findOne({
      where: { userId, questionId: 12 },
    });


    if (!interestAndHobbiesData) {
      return next(new errorhandler("Interest and Hobbies not found!", 404));
    }

    // Update the hobbies in the Answer table
    const updateInterestAndHobbies = await Answer.update(
      { answer: hobbies },
      { where: { userId, questionId: 12 } }
    );

    await recommendation.update({ interest_and_hobbies: hobbies }, { where: { userId, } });

    res.status(200).json({
      success: true,
      message: "Interest and Hobbies updated successfully",
      updateInterestAndHobbies,
    });
  }
);
export const UpdatephotoUpload = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user.userId;


    if (!req.files) {
      return next(new errorhandler("Please upload an image!", 400));
    }


    let userImageUrls;

    if (req.files && req.files.length > 0) {
      const userImagesLocal = req.files.map((file) => file.path);

      const userImages = await uploadCloudinary(userImagesLocal);

      userImageUrls = Array.isArray(userImages) ? userImages.map((image) => image.url)
        : [userImages.url];
    }

    const imageUploadData = await imageUpload.update({ image: userImageUrls }, { where: { userId } });


    await recommendation.update({ image: userImageUrls }, { where: { userId } });

    await User.update({ isImageFormFilled: true }, { where: { userId } });

    res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
    })
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }

})

// export const MatchedProfiles = catchAsyncError(async (req, res, next) => {
//   try {
//     const { userId } = req.user;

//     const response = await axios.get(
//       "https://reco.wedlock.com.au/get_matches/",
//       {
//         params: {
//           userId,          // dynamic value
//           ...req.query     // spreads existing query parameters
//         }
//       }
//     );


//     const profiles = response.data.filter((profile) => profile.gender !== null && profile.age !== null && profile.firstName !== null && profile.lastName !== null && profile.displayName !== null && profile.occupation !== null && profile.state !== null && profile.country !== null && profile.maritalStatus !== null && profile.profileImages !== null);

//     if (!profiles || profiles.length === 0) {
//       return res.status(404).json({
//         success: false,
//         profiles: [],
//         message: "No matches found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       profiles,
//     });
//   } catch (error) {
//     return next(new errorhandler(error.message, 500));
//   }
// });

export const MatchedProfiles = catchAsyncError(async (req, res, next) => {
  try {
    const { userId } = req.user;
    console.log(" Logged-in User ID:", userId);

    // 1. Get block relationships
    const blockRelations = await Block.findAll({
      where: {
        [Op.or]: [
          { blockerUserId: userId },
          { blockedUserId: userId }
        ]
      }
    });

    const blockedUserIds = blockRelations.map(block =>
      block.blockerUserId === userId ? block.blockedUserId : block.blockerUserId
    );

    console.log("Blocked User IDs:", blockedUserIds);


    const response = await axios.get(`${process.env.RECC_BASE_URL}/get_matches/`, {
      params: {
        userId,
        ...req.query
      },
      headers: {
        'x-api-key': process.env.RECC_API_KEY
      }
    });

    const rawProfiles = response.data.profiles || [];
    console.log("📦 Profiles received from Python:", rawProfiles.length);

    // 3. Filter out incomplete profiles
    const validProfiles = [];
    for (const profile of rawProfiles) {
      const isValid =
        profile.gender &&
        profile.age &&
        profile.firstName &&
        profile.lastName &&
        profile.displayName &&
        profile.occupation &&
        profile.state &&
        profile.country &&
        profile.maritalStatus &&
        Array.isArray(profile.profileImages) &&
        profile.profileImages.length > 0;

      if (isValid) {
        validProfiles.push(profile);
      } else {
        console.log("⚠️ Skipped due to missing fields:", profile.userId, profile);
      }
    }

    console.log("✅ Valid profiles after field check:", validProfiles.length);

    const blockedIdsSet = new Set(blockedUserIds.map(id => id.toString()));

    const finalProfiles = validProfiles.filter(profile => {
      const isBlocked = blockedIdsSet.has(profile.userId?.toString());
      if (isBlocked) {
        console.log("❌ Skipped blocked profile:", profile.userId);
      }
      return !isBlocked;
    });

    console.log("🎯 Final matched profiles:", finalProfiles.length);

    if (finalProfiles.length === 0) {
      return res.status(404).json({
        success: false,
        profiles: [],
        message: "No matches found",
      });
    }

    return res.status(200).json({
      success: true,
      profiles: finalProfiles,
    });

  } catch (error) {
    console.error("🔥 Match error:", error);
    return next(new errorhandler(error.message, 500));
  }
});


export const getFilteredProfile = catchAsyncError(async (req, res, next) => {
  try {
    const { userId } = req.user;

    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const sortBy = req.query.sortBy || 'age';
    const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';

    // 1. Get blocked users
    const blockRelations = await Block.findAll({
      where: {
        [Op.or]: [
          { blockerUserId: userId },
          { blockedUserId: userId }
        ]
      }
    });

    const blockedUserIds = blockRelations.map(block =>
      block.blockerUserId === userId ? block.blockedUserId : block.blockerUserId
    );

    // 2. Fetch recommendations from Python API
    const response = await axios.get(`${process.env.RECC_BASE_URL}/get_matches/`, {
      params: { userId, ...req.query },
      headers: { 'x-api-key': process.env.RECC_API_KEY }
    });

    let profiles = response.data.profiles || [];

    // 3. Remove blocked or incomplete profiles
    profiles = profiles.filter(profile =>
      profile?.userId &&
      profile?.firstName &&
      profile?.lastName &&
      profile?.gender &&
      profile?.age &&
      profile?.displayName &&
      profile?.occupation &&
      profile?.state &&
      profile?.country &&
      profile?.maritalStatus &&
      Array.isArray(profile.profileImages) &&
      profile.profileImages.length > 0 &&
      !blockedUserIds.includes(profile.userId)
    );

    // 4. Apply filters
    const filters = req.query;

    profiles = profiles.filter(profile => {
      if (filters.ageRange) {
        const [min, max] = filters.ageRange.split('-').map(Number);
        const age = parseInt(profile.age);
        if (isNaN(age) || age < min || age > max) return false;
      }

      if (filters.height) {
        const [minH, maxH] = filters.height.split('-');
        const min = parseHeight(minH);
        const max = parseHeight(maxH);
        const userH = parseHeight(profile.height);
        if (userH === null || userH < min || userH > max) return false;
      }

      if (filters.income) {
        const f = parseIncome(filters.income);
        const u = parseIncome(profile.income);
        if (!u || u.min > f.max || u.max < f.min) return false;
      }

      if (filters.occupation && profile.occupation !== filters.occupation) return false;
      if (filters.qualification && profile.qualification !== filters.qualification) return false;
      if (filters.smokingHabit && profile.smokingHabbit !== filters.smokingHabit) return false;
      if (filters.numberOfChildren && profile.nosOfChildren !== filters.numberOfChildren) return false;

      if (filters.religion?.length && !filters.religion.includes(profile.religion)) return false;
      if (filters.ethnicity?.length && !filters.ethnicity.includes(profile.caste)) return false;
      if (filters.maritalStatus?.length && !filters.maritalStatus.includes(profile.maritalStatus)) return false;
      if (filters.eatingHabits?.length && !filters.eatingHabits.includes(profile.diet)) return false;
      if (filters.community?.length && !filters.community.includes(profile.community)) return false;

      return true;
    });

    // 5. Sort
    profiles.sort((a, b) => {
      if (sortOrder === 'asc') return a[sortBy] > b[sortBy] ? 1 : -1;
      return a[sortBy] < b[sortBy] ? 1 : -1;
    });

    return res.status(200).json({
      success: true,
      profiles,
      currentPage: page,
      totalProfiles: response.data.totalProfiles || profiles.length,
      totalPages: response.data.totalPages || Math.ceil(profiles.length / pageSize),
    });

  } catch (error) {
    console.error('❌ Recommendation Error:', error.message);
    return next(new errorhandler(error.message || "Something went wrong", 500));
  }
});


export const UserDetails = catchAsyncError(async (req, res, next) => {
  try {
    const connectedUserId = req.user.userId;
    const { userId } = req.body;

    // Fetch user details
    const user = await User.findOne({ where: { userId } });
    const fcmToken = user.fcmToken;
    const uid = user.uid;
    const personalData = await personalDetails.findOne({ where: { userId } });
    const qualificationDetailsData = await qualificationDetails.findOne({ where: { userId } });
    const locationDetailsData = await locationDetails.findOne({ where: { userId } });
    const otherDetailsData = await otherDetails.findOne({ where: { userId } });
    const imageUploadData = (await imageUpload.findOne({ where: { userId } })) || "";
    const basic_lifestyle = await Answer.findOne({ where: { userId, questionId: 12 } });
    const gender = await Answer.findOne({ where: { userId, questionId: 1 } });
    const age = await Answer.findOne({ where: { userId, questionId: 7 } });
    const postedby = await Answer.findOne({ where: { userId, questionId: 6 } });
    const answer = basic_lifestyle?.answer || "";

    // Fetch connection status
    const connectionStatus = await connection.findOne({
      where: {
        [Op.or]: [
          { senderId: connectedUserId, receiverId: userId },
          { receiverId: connectedUserId, senderId: userId }
        ]
      }
    });

    const connection_status = (() => {
      if (connectionStatus) {
        if (connectionStatus.status === 'cancelled' || connectionStatus.status === 'rejected') {
          return 'no connection';
        }
        return connectionStatus.status;
      }
      return 'no connection';
    })();

    const isSender = connectionStatus && connectionStatus.senderId === connectedUserId;
    const isReceiver = connectionStatus && connectionStatus.receiverId === connectedUserId;

    const connectionType = (() => {
      if (isSender) return 'sender';
      if (isReceiver) return 'receiver';
      return 'none';
    })();

    // 🔹 Fetch ToggleSection to check enabled/disabled status
    const toggleSections = await ToggleSection.findAll({ where: { userId } });

    // Convert to a map for quick lookup
    const sectionStatus = toggleSections.reduce((acc, section) => {
      acc[section.section] = section.status; // Example: { "family_details": false, "education_and_financial": true }
      return acc;
    }, {});

    // 🔹 Conditionally construct data object
    const profileData = [{
      fcmToken,
      uid,
      profileImage: imageUploadData.image,
      userType: user.usertype,
      ...(sectionStatus["basic_and_lifestyle"] !== false && {
        basic_and_lifestyle: {
          userId,
          firstName: personalData.firstName,
          lastName: personalData.lastName,
          displayName: personalData.displayName,
          gender: gender.answer,
          age: age.answer,
          about: personalData.aboutYourSelf,
          religion: otherDetailsData.religion,
          maritalStatus: personalData.maritalStatus,
          numberOfChildren: personalData.numberOfChildren,
          postedBy: postedby.answer,
        }
      }),
      ...(sectionStatus["family_details"] !== false && {
        family_details: {
          fatherOccupation: otherDetailsData.fatherOccupation,
          motherOccupation: otherDetailsData.motherOccupation,
          numberOfSiblings: otherDetailsData.numberOfSiblings,
          livingWithFamily: otherDetailsData.livingWithFamily,
        }
      }),
      ...(sectionStatus["personal_details"] !== false && {
        personal_background: {
          height: otherDetailsData.height,
          weight: otherDetailsData.weight,
          bodyType: otherDetailsData.bodyType,
          language: otherDetailsData.language,
          smokingHabbit: otherDetailsData.smokingHabbit,
          drinkingHabbit: otherDetailsData.drinkingHabbit,
          diet: otherDetailsData.diet,
          complexion: otherDetailsData.complexion,
        }
      }),
      ...(sectionStatus["religious_details"] !== false && {
        religious_background: {
          religion: otherDetailsData.religion,
          community: otherDetailsData.community,
          subCommunity: otherDetailsData.subCommunity,
          gotra: otherDetailsData.gotra,
          timeOfBirth: otherDetailsData.timeOfBirth,
          dateOfBirth: otherDetailsData.dateOfBirth,
          placeOfBirth: otherDetailsData.placeOfBirth,
          motherTongue: otherDetailsData.motherTongue,
        }
      }),
      ...(sectionStatus["location_details"] !== false && {
        location_background: {
          country: locationDetailsData.country || "Not specified",
          state: locationDetailsData.state || "Not specified",
          currentLocation: locationDetailsData.currentLocation,
          cityOfResidence: locationDetailsData.cityOfResidence || "",
          nationality: locationDetailsData.nationality,
          citizenShip: locationDetailsData.citizenShip,
          residencyVisaStatus: locationDetailsData.residencyVisaStatus,
        }
      }),
      ...(sectionStatus["education_and_financial_details"] !== false && {
        education_and_financial: {
          qualification: qualificationDetailsData.qualification,
          occupation: qualificationDetailsData.occupation,
          workingStatus: qualificationDetailsData.currentWorkingStatus,
          income: qualificationDetailsData.income,
        }
      }),
      ...(sectionStatus["interest_and_hobbies_details"] !== false && { interest_and_hobbies: answer }),
      connection_status,
      connectionType
    }];

    res.status(200).json({
      success: true,
      data: profileData,
      message: "Profile fetched successfully!",
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});

export const filterProfiles = catchAsyncError(async (req, res, next) => {
  try {
    const { userId } = req.user;
    const religion = req.query.religion ? req.query.religion.split(",") : null;
    const ethnicity = req.query.ethnicity ? req.query.ethnicity.split(",") : null;
    const community = req.query.community ? req.query.community.split(",") : null;
    const {
      ageRange,
      heightRange,
      income,
      highestQualification,
      smokingHabbit,
      workingwith,
      maritalStatus,
      eatingHabbits,

    } = req.query;

    const currentUser = await recommendation.findOne({ where: { userId } });
    const lookingFor = currentUser?.lookingFor;

    const Users = await User.findAll({
      where: {
        userId: { [Op.ne]: userId },
      },
    });

    const userIds = Users.map((user) => user.userId);
    const [age1, age2] = ageRange?.split("-") || [];
    const [height1, height2] = heightRange?.split("-") || [];

    const recommendedUsers = await recommendation.findAll({
      where: {
        userId: { [Op.in]: userIds },
        gender: lookingFor,
        [Op.or]: [
          { age: { [Op.between]: [age1, age2] } },
          { height: { [Op.between]: [height1, height2] } },
          { income: income || { [Op.ne]: null } },
          { nationality: ethnicity && !ethnicity.includes("All") ? { [Op.in]: ethnicity } : { [Op.ne]: null } },
          {
            religion: religion && !religion.includes("All") ? { [Op.in]: religion } : { [Op.ne]: null },
          },
          { qualification: highestQualification && highestQualification !== "All" ? highestQualification : { [Op.ne]: null } },
          { smokingHabbit: smokingHabbit || { [Op.ne]: null } },
          { diet: eatingHabbits && eatingHabbits !== "All" ? eatingHabbits : { [Op.ne]: null } },
          { occupation: workingwith && workingwith !== "All" ? workingwith : { [Op.ne]: null } },
          { maritalStatus: maritalStatus && maritalStatus !== "All" ? maritalStatus : { [Op.ne]: null } },
          { community: community && community !== "All" ? community : { [Op.ne]: null } },
        ],
      },
    });

    const totalScore = 100;
    const weights = {
      religion: 10,
      age: 10,
      height: 10,
      income: 10,
      ethnicity: 10,
      highestQualification: 10,
      smokingHabbit: 10,
      occupation: 10,
      maritalStatus: 10,
      eatingHabbits: 10,
      community: 10,
    };

    const data = recommendedUsers.map((user) => {
      let matchScore = 0;

      if (user.religion === currentUser.religion) matchScore += weights.religion;
      if (user.age >= age1 && user.age <= age2) matchScore += weights.age;
      if (user.height >= height1 && user.height <= height2) matchScore += weights.height;
      if (user.income === income) matchScore += weights.income;
      if (user.nationality === ethnicity) matchScore += weights.ethnicity;
      if (user.qualification === highestQualification) matchScore += weights.highestQualification;
      if (user.smokingHabbit === smokingHabbit) matchScore += weights.smokingHabbit;
      if (user.occupation === workingwith) matchScore += weights.occupation;
      if (user.maritalStatus === maritalStatus) matchScore += weights.maritalStatus;
      if (user.diet === eatingHabbits) matchScore += weights.eatingHabbits;
      if (user.community === community) matchScore += weights.community;

      const matchPercentage = (matchScore / totalScore) * 100;
      return {
        userId: user.userId,
        gender: user.gender,
        religion: user.religion,
        age: user.age,
        maritalStatus: user.maritalStatus,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        occupation: user.occupation,
        state: user.state,
        country: user.country,
        userType: user.usertype,
        profileImages: user.image,
        match_percentage: matchPercentage,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        profiles: data,
      },
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});

// export const UserDetails = catchAsyncError(async (req, res, next) => {
//   const connectedUserId = req.user.userId;
//   const { userId } = req.body;

//   if (connectedUserId === userId) {
//     return res.status(400).json({
//       success: false,
//       message: "You can't view your own profile this way.",
//     });
//   }

//   try {
//     // Fetch user
//     const user = await User.findOne({ where: { userId } });
//     if (!user) {
//       return res.status(404).json({ success: false, message: "User not found" });
//     }

//     // Fetch all profile data in parallel
//     const [
//       personalData,
//       qualificationDetailsData,
//       locationDetailsData,
//       otherDetailsData,
//       imageUploadData,
//       basic_lifestyle,
//       gender,
//       age,
//       postedby
//     ] = await Promise.all([
//       personalDetails.findOne({ where: { userId } }),
//       qualificationDetails.findOne({ where: { userId } }),
//       locationDetails.findOne({ where: { userId } }),
//       otherDetails.findOne({ where: { userId } }),
//       imageUpload.findOne({ where: { userId } }),
//       Answer.findOne({ where: { userId, questionId: 8 } }),
//       Answer.findOne({ where: { userId, questionId: 1 } }),
//       Answer.findOne({ where: { userId, questionId: 4 } }),
//       Answer.findOne({ where: { userId, questionId: 6 } }),
//     ]);

//     const viewerData = await personalDetails.findOne({ where: { userId: connectedUserId } });
//     const viewerImageData = await imageUpload.findOne({ where: { userId: connectedUserId } });

//     if (viewerData) {
//       try {
//         const notification = await Notification.create({
//           userId: userId,
//           title: "Profile Viewed",
//           message: `${viewerData.firstName} ${viewerData.lastName} viewed your profile.`,
//           body: {
//             type: "profile_viewed",
//             senderId: connectedUserId,
//             senderName: `${viewerData.firstName} ${viewerData.lastName}`,
//             senderImage: viewerImageData?.image?.[0] || null,
//           },
//         });

//         const io = getSocketInstance();
//         io.to(userId).emit("profile_viewed", {
//           notificationId: notification.notificationId,
//           title: notification.title,
//           message: notification.message,
//           body: notification.body,
//         });

//         console.log("📡 Notification emitted to socket");
//       } catch (notifyErr) {
//         console.warn("⚠ Notification error:", notifyErr.message);
//       }
//     } else {
//       console.warn("🚨 Viewer data not found, skipping notification.");
//     }

//     const connectionStatus = await connection.findOne({
//       where: {
//         [Op.or]: [
//           { senderId: connectedUserId, receiverId: userId },
//           { receiverId: connectedUserId, senderId: userId },
//         ],
//       },
//     });

//     const connection_status = connectionStatus
//       ? ["cancelled", "rejected"].includes(connectionStatus.status)
//         ? "no connection"
//         : connectionStatus.status
//       : "no connection";

//     const connectionType = connectionStatus
//       ? connectionStatus.senderId === connectedUserId
//         ? "sender"
//         : "receiver"
//       : "none";

//     const toggleSections = await ToggleSection.findAll({ where: { userId } });
//     const sectionStatus = toggleSections.reduce((acc, section) => {
//       acc[section.section] = section.status;
//       return acc;
//     }, {});

//     const profileData = [{
//       fcmToken: user.fcmToken,
//       uid: user.uid,
//       profileImage: imageUploadData?.image || "",
//       userType: user.usertype,
//       ...(sectionStatus["basic_and_lifestyle"] !== false && {
//         basic_and_lifestyle: {
//           userId,
//           firstName: personalData?.firstName,
//           lastName: personalData?.lastName,
//           displayName: personalData?.displayName,
//           gender: gender?.answer,
//           age: age?.answer,
//           about: personalData?.aboutYourSelf,
//           religion: otherDetailsData?.religion,
//           maritalStatus: personalData?.maritalStatus,
//           numberOfChildren: personalData?.numberOfChildren,
//           postedBy: postedby?.answer,
//         },
//       }),
//       ...(sectionStatus["family_details"] !== false && {
//         family_details: {
//           fatherOccupation: otherDetailsData?.fatherOccupation,
//           motherOccupation: otherDetailsData?.motherOccupation,
//           numberOfSiblings: otherDetailsData?.numberOfSiblings,
//           livingWithFamily: otherDetailsData?.livingWithFamily,
//         },
//       }),
//       ...(sectionStatus["personal_details"] !== false && {
//         personal_background: {
//           height: otherDetailsData?.height,
//           weight: otherDetailsData?.weight,
//           bodyType: otherDetailsData?.bodyType,
//           language: otherDetailsData?.language,
//           smokingHabbit: otherDetailsData?.smokingHabbit,
//           drinkingHabbit: otherDetailsData?.drinkingHabbit,
//           diet: otherDetailsData?.diet,
//           complexion: otherDetailsData?.complexion,
//         },
//       }),
//       ...(sectionStatus["religious_details"] !== false && {
//         religious_background: {
//           religion: otherDetailsData?.religion,
//           community: otherDetailsData?.community,
//           subCommunity: otherDetailsData?.subCommunity,
//           gotra: otherDetailsData?.gotra,
//           timeOfBirth: otherDetailsData?.timeOfBirth,
//           dateOfBirth: otherDetailsData?.dateOfBirth,
//           placeOfBirth: otherDetailsData?.placeOfBirth,
//           motherTongue: otherDetailsData?.motherTongue,
//         },
//       }),
//       ...(sectionStatus["location_details"] !== false && {
//         location_background: {
//           country: locationDetailsData?.country || "Not specified",
//           state: locationDetailsData?.state || "Not specified",
//           currentLocation: locationDetailsData?.currentLocation,
//           cityOfResidence: locationDetailsData?.cityOfResidence || "",
//           nationality: locationDetailsData?.nationality,
//         },
//       }),
//       ...(sectionStatus["education_and_financial_details"] !== false && {
//         education_and_financial: {
//           qualification: qualificationDetailsData?.qualification,
//           occupation: qualificationDetailsData?.occupation,
//           workingStatus: qualificationDetailsData?.currentWorkingStatus,
//           income: qualificationDetailsData?.income,
//         },
//       }),
//       ...(sectionStatus["interest_and_hobbies_details"] !== false && {
//         interest_and_hobbies: basic_lifestyle?.answer || "",
//       }),
//       connection_status,
//       connectionType,
//     }];

//     return res.status(200).json({
//       success: true,
//       data: profileData,
//       message: "Profile fetched successfully!",
//     });

//   } catch (error) {
//     console.error("Error in UserDetails:", error.message);
//     return next(new errorhandler(error.message, 500));
//   }
// });



export const filterFieldCount = catchAsyncError(async (req, res, next) => {

  try {

    const data = [];


    const Religion = {
      Hinduism: await otherDetails.count({ where: { religion: 'Hinduism' }, }),
      Islam: await otherDetails.count({ where: { religion: 'Islamic' } }),
      Buddhism: await otherDetails.count({ where: { religion: 'Buddhism' } }),
      Christian: await otherDetails.count({ where: { religion: 'Christianity' } }),
      judaism: await otherDetails.count({ where: { religion: 'Judaism' } }),

    }

    const Ethinicity = {
      Indian: await locationDetails.count({ where: { nationality: 'Indian' } }),
      American: await locationDetails.count({ where: { nationality: 'American' } }),
      Africaners: await locationDetails.count({ where: { nationality: 'African' } }),
      Japanese: await locationDetails.count({ where: { nationality: 'Japanese' } }),
    }

    const HighestQualification = {
      Masters: await qualificationDetails.count({ where: { qualification: 'Masters' } }),
      Bachelor: await qualificationDetails.count({ where: { qualification: 'Bachelors' } }),
      Tenth: await qualificationDetails.count({ where: { qualification: '10th' } }),
      Tweleventh: await qualificationDetails.count({ where: { qualification: '12th' } }),
    }

    const workingwith = {
      Private: await qualificationDetails.count({ where: { occupation: 'Private' } }),
      Non_Working: await qualificationDetails.count({ where: { occupation: 'Non_Working' } }),
      Businness: await qualificationDetails.count({ where: { occupation: 'Business' } }),
      Government: await qualificationDetails.count({ where: { occupation: 'Government' } }),
      Defense: await qualificationDetails.count({ where: { occupation: 'Defense' } }),
    }

    const maritalStatus = {
      NeverMarried: await personalDetails.count({ where: { maritalStatus: 'NeverMarried' } }),
      Married: await personalDetails.count({ where: { maritalStatus: 'Married' } }),
      Divorced: await personalDetails.count({ where: { maritalStatus: 'Divorced' } }),
      Widowed: await personalDetails.count({ where: { maritalStatus: 'Widowed' } }),
      AwatingDivorce: await personalDetails.count({ where: { maritalStatus: 'Awaiting Divorce' } }),
      Annualed: await personalDetails.count({ where: { maritalStatus: 'Annualed' } }),
    }

    const eatingHabbits = {
      Vegetarian: await otherDetails.count({ where: { diet: 'Vegetarian' } }),
      Non_Vegetarian: await otherDetails.count({ where: { diet: 'Non-Vegetarian' } }),
      Eggetarian: await otherDetails.count({ where: { diet: 'Eggetarian' } }),
      Jain: await otherDetails.count({ where: { diet: 'Jain' } }),
      Vegan: await otherDetails.count({ where: { diet: 'Vegan' } }),
    }


    const community = {
      Gujarati: await otherDetails.count({ where: { community: 'Gujarati' } }),
      Vaishnav: await otherDetails.count({ where: { community: 'Vaishnav' } }),
      Brahmin: await otherDetails.count({ where: { community: 'Brahmin' } }),
      Patel: await otherDetails.count({ where: { community: 'Patel' } }),
      Lohana: await otherDetails.count({ where: { community: 'Lohana' } }),
      Vania: await otherDetails.count({ where: { community: 'Vania' } }),
      Suthar: await otherDetails.count({ where: { community: 'Suthar' } }),
    }

    data.push(Religion, Ethinicity, HighestQualification, workingwith, maritalStatus, eatingHabbits, community);
    return res.status(200).json({
      success: true,
      message: "Filter count fetched successfully!",
      data: data
    })




  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }

})

export const matrimonialProfiles = catchAsyncError(async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;

    // Fetch all users excluding the current user
    const users = await User.findAll({
      where: {
        userId: { [Op.ne]: currentUserId } // Exclude the current user
      },
      order: [["createdAt", "DESC"]],
    });

    if (!users || users.length === 0) {
      return next(new errorhandler("Users not found!", 404));
    }

    // Process each user to fetch the related details
    const profiles = await Promise.all(users.map(async (user) => {
      const personalData = await personalDetails.findOne({ where: { userId: user.userId } });
      const otherDetailsData = await otherDetails.findOne({ where: { userId: user.userId } });

      // Fetch age and postedBy details from the Answer table
      const ageDetail = await Answer.findOne({
        where: { questionId: 7, userId: user.userId }
      });

      const postedByDetail = await Answer.findOne({
        where: { questionId: 6, userId: user.userId }
      });

      return {
        id: user.userId,
        name: personalData ? `${personalData.firstName} ${personalData.lastName}` : null,
        age: ageDetail ? ageDetail.answer : null,
        religion: otherDetailsData ? otherDetailsData.religion : null,
        postedBy: postedByDetail ? postedByDetail.answer : null,
      };
    }));

    res.status(200).json({
      success: true,
      data: profiles,
    });

  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});
//admin profile image
export const adminProfileImage = catchAsyncError(async (req, res, next) => {

  try {
    const userId = req.user.userId
    const imageUploadData = (await imageUpload.findOne({ where: { userId } })) || "";
    const image = imageUploadData.image[0] || "";

    res.status(200).json({
      success: true,
      image: image
    })

  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }

})

export const allProfiles = catchAsyncError(async (req, res, next) => {
  try {

    const userId = req.user.userId;


    const currentUser = await recommendation.findOne({ where: { userId } });
    const lookingFor = currentUser?.lookingFor;

    const Users = await User.findAll({
      where: {
        userId: { [Op.ne]: userId },
      },
    });
    const userIds = Users.map((user) => user.userId);


    const recommendedUsers = await recommendation.findAll({
      where: {
        userId: { [Op.in]: userIds },
        gender: lookingFor,
      },
    });



    const data = recommendedUsers.map((user) => {
      let matchScore = 0;
      return {
        userId: user.userId,
        uid: user.uid,
        fcmToken: user.fcmToken,
        gender: user.gender,
        religion: user.religion,
        age: user.age,
        maritalStatus: user.maritalStatus,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
        occupation: user.occupation,
        state: user.state,
        country: user.country,
        userType: user.usertype,
        profileImages: user.image,
        match_percentage: matchScore,

      };
    });



    res.status(200).json({
      success: true,
      profiles: data,
      message: "All profiles fetched successfully!",
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});


export const discoverProfiles = catchAsyncError(async (req, res, next) => {
  try {

    const currentUserId = req.user.userId;
    const currentDate = moment().startOf('day').toDate();

    const users = await User.findAll({
      where: {
        userId: { [Op.ne]: currentUserId },
        isImageFormFilled: true,
        isPersonalFormFilled: true,
        isQualificationFormFilled: true,
        isLocationFormFilled: true,
        isOtherFormFilled: true,
        createdAt: {
          [Op.gte]: moment().subtract(30, 'days').startOf('day').toDate(), // 30 दिन पहले से
          [Op.lt]: moment().endOf('day').toDate(), // आज तक
        },
      },
    });


    const profiles = users.map((user) => {
      return {
        userId: user.userId,
      };
    });

    res.status(200).json({
      success: true,
      data: profiles,
      message: "All profiles fetched successfully!",
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});


export const getProfilePercentage = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const personalData = await personalDetails.findOne({ where: { userId } });
    const qualificationDetailsData = await qualificationDetails.findOne({ where: { userId } });
    const locationDetailsData = await locationDetails.findOne({ where: { userId } });
    const otherDetailsData = await otherDetails.findOne({ where: { userId } });
    const basic_lifestyle = await Answer.findOne({ where: { userId, questionId: 12 } });
    const gender = await Answer.findOne({ where: { userId } });
    const age = await Answer.findOne({ where: { userId, questionId: 7 } });
    const postedby = await Answer.findOne({ where: { userId, questionId: 6 } });
    const answer = basic_lifestyle.answer;

    const data = {
      basic_and_lifestye: {
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        displayName: personalData.displayName,
        gender: gender.answer,
        age: age.answer,
        about: personalData.aboutYourSelf,
        religion: otherDetailsData.religion,
        maritalStatus: personalData.maritalStatus,
        numberOfChildren: personalData.numberOfChildren,
        postedBy: postedby.answer,
      },
      family_details: {
        fatherOccupation: otherDetailsData.fatherOccupation,
        motherOccupation: otherDetailsData.motherOccupation,
        numberOfSiblings: otherDetailsData.numberOfSiblings,
        livingWithFamily: otherDetailsData.livingWithFamily,
      },
      personal_background: {
        height: otherDetailsData.height,
        weight: otherDetailsData.weight,
        bodyType: otherDetailsData.bodyType,
        language: otherDetailsData.language,
        smokingHabbit: otherDetailsData.smokingHabbit,
        drinkingHabbit: otherDetailsData.drinkingHabbit,
        diet: otherDetailsData.diet,
        complexion: otherDetailsData.complexion,
      },
      religious_background: {
        religion: otherDetailsData.religion,
        community: otherDetailsData.community,
        subCommunity: otherDetailsData.subCommunity,
        gothra: otherDetailsData.gothra,
        timeOfBirth: otherDetailsData.timeOfBirth,
        dateOfBirth: otherDetailsData.dateOfBirth,
        placeOfBirth: otherDetailsData.placeOfBirth,
        motherTongue: otherDetailsData.motherTongue,
      },
      location_background: {
        currentLocation: locationDetailsData.currentLocation,
        cityOfResidence: locationDetailsData.cityOfResidence || "",
        nationality: locationDetailsData.nationality,
        citizenShip: locationDetailsData.citizenShip,
        residencyVisaStatus: locationDetailsData.residencyVisaStatus,
      },
      education_and_financial: {
        qualification: qualificationDetailsData.qualification,
        education: qualificationDetailsData.occupation,
        workingStatus: qualificationDetailsData.currentWorkingStatus,
        income: qualificationDetailsData.income,
      },
      interest_and_hobbies: answer,
    };

    const percentage = calculateCompletion(data);

    res.status(200).json({
      success: true,
      percentage: percentage,
      message: "Profile percentage fetched successfully!",
    });


  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }


})

