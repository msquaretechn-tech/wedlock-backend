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
  
      const stripePrice = await stripe.prices.create({
        unit_amount: Math.round(price * 100), 
        currency: "aud",
        recurring: {
          interval: "month",
        },
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

  // ✅ Create new Stripe price linked to that product
  const newStripePrice = await stripe.prices.create({
    unit_amount: Math.round(price * 100),
    currency: "aud",
    recurring: {
      interval: planType === "Yearly" ? "year" : "month",
    },
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
});


export const getPlansSimple = catchAsyncError(async (req, res, next) => {
  try {
    const plans = await plan.findAll();

    if (!plans || plans.length === 0) {
      return next(new errorhandler("No plans found!", 404));
    }

    const monthlyPlans = plans
      .filter((p) => p.planType === "Monthly")
      .map((p) => ({
        planType: p.planType,
        planName: p.planName,
        price: p.price,
      }));

    const yearlyPlans = plans
      .filter((p) => p.planType === "Yearly")
      .map((p) => ({
        planType: p.planType,
        planName: p.planName,
        price: p.price,
      }));

    res.status(200).json({
      success: true,
      data: {
        Monthly: monthlyPlans,
        Yearly: yearlyPlans,
      },
      message: "Plans fetched successfully!",
    });
  } catch (error) {
    return next(new errorhandler(error.message, 500));
  }
});