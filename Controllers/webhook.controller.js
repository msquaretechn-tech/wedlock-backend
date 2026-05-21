import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import errorhandler from "../Utils/errorhandler.js";
import subscription from "../Models/subscription.model.js";
import User from '../Models/user.js'
import personalDetails from "../Models/personalDetails.model.js";
import sendMail from "../Utils/sendMail.js";
import Recommendation from "../Models/recommendation.model.js";
import { v4 as uuidv4 } from "uuid";
import plan from "../Models/plan.model.js";
import Stripe from "stripe";
import cron from "node-cron";
import moment from 'moment';
import { Op } from "sequelize";
import sendEmail from "../Utils/sendMail.js";


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const handlePaymentSuccess = catchAsyncError(async (req, res, next) => {
    const endpointSecret = process.env.STRIPE_SIGNING_SECRET;
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        if (endpointSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
        } else {
            event = req.body; 
        }
    } catch (err) {
        console.error("Webhook signature verification failed.", err.message);
        return res.sendStatus(400);
    }

    if (event.type === "checkout.session.completed" || event.type === "payment_intent.succeeded") {
        const session = event.data.object;

        const userId = session.metadata.userId;
        const planId = session.metadata.planId;

          let deviceType;

          if( event.type === 'checkout.session.completed'){
            deviceType = 'Web';
          }
          else{
            deviceType = 'Mobile';
          }

        

        try {
           
            const planData = await plan.findOne({ where: { planId } });

            if (!planData) {
                return next(new errorhandler("Plan not found!", 404));
            }
            const user = await User.findOne({ where: { userId } });
            const personalDetail = await personalDetails.findOne({ where: { userId } });
    
            const endDate = moment().add(planData.durationInMonths, 'months').toDate();
    
            const orderId = `WDL${uuidv4().split('-')[0].toUpperCase()}`;
    
    
            const subscriptionData = await subscription.create({
                orderId,
                planId,
                userId,
                paymentSucessId: session.id,
                endDate,
                deviceType: deviceType,
                paymentStatus: 'Completed',
            });
    
            if (subscriptionData !== null) {
                const user = await User.findOne({ where: { userId } });
                if (user !== null) {
                    await User.update({ usertype: planData.planName }, { where: { userId } })
                    await Recommendation.update({ usertype: planData.planName }, { where: { userId } })
                }
    
            }

            const email = user.email;
    
            const validUpto = moment(endDate).format('LLL');
    
            const data = {
                name: personalDetail.firstName + " " + personalDetail.lastName,
                orderId: orderId,
                planName: planData.planName,
                planType: planData.planType,
                validUpto: validUpto,
                price: planData.price,
                features: planData.featureList,
                total: planData.price,
    
            }
    
            await sendEmail({ email, subject: `Your Wedlock.au order #${orderId}`, template: "order-mail.ejs", data });
    
    
            res.status(201).json({
                success: true,
                usertype: data.planName,
                message: "Subscription created successfully!",
            });
        } catch (err) {
            console.error("Database update failed:", err);
        }
    }

    res.sendStatus(200);
});    