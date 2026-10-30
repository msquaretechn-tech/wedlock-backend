import { catchAsyncError } from "../../Middlewares/catchAsyncError.js";
import errorhandler from "../../Utils/errorhandler.js";
import plan from "../../Models/plan.model.js";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPlan = catchAsyncError(async (req, res, next) => {

    try {
    
      const { planName, price, durationInMonths, description ,planType,featureList} = req.body;
  
      if (!planName || !price || !durationInMonths || !description || !planType || !featureList) {
        return next(new errorhandler("Please enter all fields", 400));
      }
  
      const product = await stripe.products.create({
        name: planName + " Plan",
      });
  
      let recurringConfig = {
        interval: "month",
      };
      if (planType === "Yearly" || Number(durationInMonths) >= 12) {
        recurringConfig = { interval: "year" };
      } else if (Number(durationInMonths) > 1) {
        recurringConfig = {
          interval: "month",
          interval_count: Number(durationInMonths),
        };
      }

      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(price * 100), 
        currency: "aud",
        recurring: recurringConfig,
        product: product.id,
      });
  
      const newPlan = await plan.create({
        planName,
        price,
        durationInMonths,
        stripePriceId: stripePrice.id,
        description,
       
        planType,
        featureList
      });
  
      res.status(201).json({
        success: true,
        data: newPlan,
        message: "Plan created successfully!",
      });
    } catch (error) {
      return next(new errorhandler(error.message, 500));
    }
  });
  


export const getAllPlans = catchAsyncError(async (req, res, next) => {
    const plans = await plan.findAll();
    if (!plans) {
      return res.status(404).json({ success: false, message: "Plans not found!" });
    }

    const data = plans.map((plan) => {
        return {
            id: plan.planId,
            planName: plan.planName,
            price: plan.price,
            durationInMonths: plan.durationInMonths,
            description: plan.description,
            planType: plan.planType,
            featureList: plan.featureList
        }
    })


    res.status(200).json({
        success: true,
        data: data,
        message: "Plans fetched successfully!",

    })
})


export const deletePlan = catchAsyncError(async (req, res, next) => {
    const { planId } = req.params;

    try {

        const planData = await plan.findOne({ where: { id: planId } });

        if (!planData) {
            return next(new errorhandler("Plan not found!", 404));
        }

        await plan.destroy({ where: { id: planId } });

        res.status(200).json({
            success: true,
            message: "Plan deleted successfully!",
        });

    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})



export const editPlan = catchAsyncError(async (req, res, next) => {
  try {
    const {
      planId,
      price,
      durationInMonths,
      description,
      planType,
      featureList,
    } = req.body;

    if (!planId) return next(new errorhandler("Plan ID is required", 400));

    const existingPlan = await plan.findOne({ where: { planId } });

    if (!existingPlan) {
      return next(new errorhandler("Plan not found", 404));
    }

    // ✅ Create new Stripe product (DO NOT reuse or store productId)
    const product = await stripe.products.create({
      name: existingPlan.planName,
    });

      let recurringConfig = {
        interval: "month",
      };
      if (planType === "Yearly" || Number(durationInMonths) >= 12) {
        recurringConfig = { interval: "year" };
      } else if (Number(durationInMonths) > 1) {
        recurringConfig = {
          interval: "month",
          interval_count: Number(durationInMonths),
        };
      }

      // ✅ Create new Stripe price linked to that product
      const newStripePrice = await stripe.prices.create({
        unit_amount: Math.round(price * 100),
        currency: "aud",
        recurring: recurringConfig,
        product: product.id,
      });

    // ✅ Update the plan (but keep planName and planId same)
    await existingPlan.update({
      price,
      durationInMonths,
      description,
      planType,
      featureList,
      stripePriceId: newStripePrice.id, // update Stripe price ID
    });

    console.log("📝 Plan updated:", {
      planId,
      planName: existingPlan.planName,
      newPrice: price,
      durationInMonths,
      planType,
      featureList,
      description,
      stripePriceId: newStripePrice.id,
    });

    return res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      updatedPlan: existingPlan,
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});


export const getPlansSimple = catchAsyncError(async (req, res, next) => {
  try {
    const plans = await plan.findAll();

    if (!plans || plans.length === 0) {
      return next(new errorhandler("No plans found!", 404));
    }

    const monthlyPlans = plans
      .filter((p) => (p.planType === "Monthly" || Number(p.durationInMonths) === 1) && !p.planType?.includes("3") && !p.planType?.includes("6"))
      .map((p) => ({
        planType: p.planType,
        planName: p.planName,
        price: p.price,
      }));

    const threeMonthPlans = plans
      .filter((p) => p.planType === "3-Month" || Number(p.durationInMonths) === 3)
      .map((p) => ({
        planType: p.planType,
        planName: p.planName,
        price: p.price,
      }));

    const sixMonthPlans = plans
      .filter((p) => p.planType === "6-Month" || Number(p.durationInMonths) === 6)
      .map((p) => ({
        planType: p.planType,
        planName: p.planName,
        price: p.price,
      }));

    const yearlyPlans = plans
      .filter((p) => p.planType === "Yearly" || Number(p.durationInMonths) >= 12)
      .map((p) => ({
        planType: p.planType,
        planName: p.planName,
        price: p.price,
      }));

    res.status(200).json({
      success: true,
      data: {
        Monthly: monthlyPlans,
        "3-Month": threeMonthPlans,
        "6-Month": sixMonthPlans,
        Yearly: yearlyPlans,
      },
      message: "Plans fetched successfully!",
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});