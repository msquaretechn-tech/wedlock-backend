import Plan from "../Models/plan.model.js";
import User from "../Models/user.js";
import Subscription from "../Models/subscription.model.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import errorhandler from "../Utils/errorhandler.js";
import moment from "moment";



export const getBillingInfo = catchAsyncError(async (req, res, next) => {
  try {
    const userId = req.user.userId;

   
    const user = await User.findOne({ where: { userId } });
    if (!user) {
      return next(new errorhandler("User not found", 404));
    }

    
    const latestSubscription = await Subscription.findOne({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    

    if (!latestSubscription) {
     return res.status(200).json({
        success: true,
        data : {
          currentPlan: "Standard",
          totalDays: 0,
          expirationDate: "N/A", 
          planType: "N/A",
          notifications: false, 
          remainingDays: 0,
          price: `Free`,
        },
        message: "Billing info fetched successfully!",
     })
    }


    const currentPlan = await Plan.findOne({
      where: { planId: latestSubscription.planId },
    });

    if (!currentPlan) {
      return next(new errorhandler("Plan not found", 404));
    }

    
    const today = moment().startOf("day");
    const startDate = moment(latestSubscription.startDate).startOf("day"); 
    const expirationDate = moment(latestSubscription.endDate).startOf("day");

    console.log("Purchase Date (startDate):", startDate.format());
    console.log("Expiration Date (endDate):", expirationDate.format());

    if (!expirationDate.isValid() || !startDate.isValid()) {
      return next(new errorhandler("Invalid subscription dates", 500));
    }

   
    const remainingDays = expirationDate.diff(today, "days"); 
    const totalDays = expirationDate.diff(startDate, "days"); 

    
    const isYearly = currentPlan.durationInMonths >= 12;

    const data = {
      currentPlan: currentPlan.planName.split(" ")[0],
      totalDays,
      expirationDate: expirationDate.format("ll"), 
      planType: isYearly ? "Year" : "Month",
      notifications: remainingDays <= 6, 
      remainingDays,
      price: `$${currentPlan.price}`,
    };

    return res.status(200).json({
      success: true,
      data,
      message: "Billing information fetched successfully!",
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});







