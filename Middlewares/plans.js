import plan from "../Models/plan.model";

export const plans = (req, res, next) => {
    try {
       const {userId } = req.user;

        const userPlan = plan.findOne({where:{ userId: userId} })

        if (!userPlan) {
            return next(new errorhandler("Plan not found!", 404));
        }

        if(userPlan.status === 'Expired') {
            return next(new errorhandler("Your plan has been expired! Please renew your plan", 400));
        }   

        next();
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
}