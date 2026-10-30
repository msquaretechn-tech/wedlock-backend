import plan from "../Models/plan.model.js";
import connectDB from "./db.js";

const sequelize = connectDB();

export const ensureSubscriptionPlans = async () => {
  try {
    // 1. Run safe migration for Postgres enum/column if needed
    try {
      await sequelize.query(`
        DO $$
        BEGIN
          BEGIN
            ALTER TYPE "enum_plans_planType" ADD VALUE IF NOT EXISTS '3-Month';
            ALTER TYPE "enum_plans_planType" ADD VALUE IF NOT EXISTS '6-Month';
          EXCEPTION
            WHEN undefined_object THEN NULL;
            WHEN duplicate_object THEN NULL;
            WHEN others THEN NULL;
          END;
          BEGIN
            ALTER TABLE "plans" ALTER COLUMN "planType" TYPE VARCHAR(255);
          EXCEPTION
            WHEN others THEN NULL;
          END;
        END $$;
      `);
    } catch (migErr) {
      console.log("Plan migration note:", migErr.message);
    }

    // 2. Query all existing plans
    const existingPlans = await plan.findAll();

    const has3Month = existingPlans.some(
      (p) => p.planType === "3-Month" || p.durationInMonths === 3
    );
    const has6Month = existingPlans.some(
      (p) => p.planType === "6-Month" || p.durationInMonths === 6
    );

    if (has3Month && has6Month) {
      console.log("✅ 3-Month and 6-Month plans already exist.");
      return;
    }

    // Look for template plans
    const premiumMonthly = existingPlans.find(
      (p) => p.planName === "Premium" && (p.planType === "Monthly" || p.durationInMonths === 1)
    );
    const exclusiveMonthly = existingPlans.find(
      (p) => p.planName === "Exclusive" && (p.planType === "Monthly" || p.durationInMonths === 1)
    );

    const defaultFeaturesPremium = premiumMonthly?.featureList?.length
      ? premiumMonthly.featureList
      : [
          "Create favorites lists",
          "Create photo profile",
          "Send friend requests",
          "View profiles in full",
          "Audio & video calling",
          "Priority customer support",
        ];

    const defaultFeaturesExclusive = exclusiveMonthly?.featureList?.length
      ? exclusiveMonthly.featureList
      : [
          "Access to Exclusive profiles",
          "All Premium plan features included",
          "Dedicated relationship manager",
          "Advanced horoscope matching",
          "Unlimited audio & video calls",
          "Top priority profile spotlight",
        ];

    const premiumMonthlyPrice = premiumMonthly?.price ? Number(premiumMonthly.price) : 29.99;
    const exclusiveMonthlyPrice = exclusiveMonthly?.price ? Number(exclusiveMonthly.price) : 69.99;

    // 3 Months pricing (approx 10% discount on 3 months)
    const premium3MonthPrice = (Math.round(premiumMonthlyPrice * 3 * 0.9 * 100) / 100).toFixed(2);
    const exclusive3MonthPrice = (Math.round(exclusiveMonthlyPrice * 3 * 0.9 * 100) / 100).toFixed(2);

    // 6 Months pricing (approx 20% discount on 6 months)
    const premium6MonthPrice = (Math.round(premiumMonthlyPrice * 6 * 0.8 * 100) / 100).toFixed(2);
    const exclusive6MonthPrice = (Math.round(exclusiveMonthlyPrice * 6 * 0.8 * 100) / 100).toFixed(2);

    // Seed 3-Month plans if missing
    if (!has3Month) {
      await plan.create({
        planName: "Premium",
        planType: "3-Month",
        durationInMonths: 3,
        price: premium3MonthPrice,
        description: "Premium plan with 3 months access",
        featureList: defaultFeaturesPremium,
      });

      await plan.create({
        planName: "Exclusive",
        planType: "3-Month",
        durationInMonths: 3,
        price: exclusive3MonthPrice,
        description: "Exclusive plan with 3 months access",
        featureList: defaultFeaturesExclusive,
      });

      console.log("✅ Seeded 3-Month subscription plans (Premium & Exclusive)");
    }

    // Seed 6-Month plans if missing
    if (!has6Month) {
      await plan.create({
        planName: "Premium",
        planType: "6-Month",
        durationInMonths: 6,
        price: premium6MonthPrice,
        description: "Premium plan with 6 months access",
        featureList: defaultFeaturesPremium,
      });

      await plan.create({
        planName: "Exclusive",
        planType: "6-Month",
        durationInMonths: 6,
        price: exclusive6MonthPrice,
        description: "Exclusive plan with 6 months access",
        featureList: defaultFeaturesExclusive,
      });

      console.log("✅ Seeded 6-Month subscription plans (Premium & Exclusive)");
    }
  } catch (error) {
    console.error("Error ensuring subscription plans:", error.message);
  }
};
