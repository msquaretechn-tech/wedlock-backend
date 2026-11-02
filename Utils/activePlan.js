import { Op } from "sequelize";
import { Subscription, Plan, User, Recommendation } from "../Models/association.js";

/**
 * Returns the currently active plan name for a user ('Exclusive', 'Premium', or 'Standard').
 * Strictly checks:
 * 1. Subscription must exist and have status === 'Active'.
 * 2. Subscription endDate must be in the future (not expired).
 * If no valid active subscription exists, or if endDate has passed,
 * it automatically marks overdue subscriptions as 'Expired',
 * resets the user's usertype to 'Standard' in User and Recommendation tables,
 * and returns 'Standard'.
 *
 * @param {string} userId
 * @returns {Promise<string>} 'Exclusive' | 'Premium' | 'Standard'
 */
export const getActivePlanName = async (userId) => {
  if (!userId) return "Standard";

  try {
    const now = new Date();

    // 1. Look for an active subscription with a valid future endDate
    const activeSub = await Subscription.findOne({
      where: {
        userId,
        status: "Active",
        endDate: { [Op.gt]: now },
      },
      order: [["createdAt", "DESC"]],
      include: [{ model: Plan, as: "plans", attributes: ["planName"] }],
    });

    if (activeSub && activeSub.plans?.planName) {
      return activeSub.plans.planName;
    }

    // 2. Auto-expire any subscriptions whose endDate has passed
    try {
      await Subscription.update(
        { status: "Expired" },
        {
          where: {
            userId,
            status: "Active",
            endDate: { [Op.lte]: now },
          },
        }
      );
    } catch (subErr) {
      console.error("Error auto-expiring subscriptions in getActivePlanName:", subErr.message);
    }

    // 3. Reset usertype to Standard in User and Recommendation tables
    try {
      await User.update({ usertype: "Standard" }, { where: { userId } });
      await Recommendation.update({ usertype: "Standard" }, { where: { userId } });
    } catch (userErr) {
      console.error("Error resetting usertype to Standard in getActivePlanName:", userErr.message);
    }

    return "Standard";
  } catch (err) {
    console.error("Error in getActivePlanName helper:", err.message);
    return "Standard";
  }
};

/**
 * Syncs user's active plan into User and Recommendation tables and returns the plan name.
 *
 * @param {string} userId
 * @returns {Promise<string>}
 */
export const syncUserActivePlan = async (userId) => {
  if (!userId) return "Standard";
  const activePlan = await getActivePlanName(userId);
  try {
    await User.update({ usertype: activePlan }, { where: { userId } });
    await Recommendation.update({ usertype: activePlan }, { where: { userId } });
  } catch (err) {
    console.error("Error syncing active plan in syncUserActivePlan:", err.message);
  }
  return activePlan;
};

export default getActivePlanName;
