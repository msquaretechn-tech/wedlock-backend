import {
    User, Answer, personalDetails, otherDetails, locationDetails, imageUpload,
    qualificationDetails, FavProfile, happyStories, Plan,
    Notification, ToggleSection,Recommendation
} from "../../Models/association.js";

import { Op } from "sequelize";
import Block from "../../Models/block.model.js";
import Report from "../../Models/report.model.js";
import Subscription from "../../Models/subscription.model.js";

export const getAllUsersWithDetails = async (req, res) => {
    try {
        const users = await User.findAll({
            include: [
                { model: personalDetails, as: 'personalDetails' },
                { model: qualificationDetails, as: 'qualificationDetails' },
                { model: locationDetails, as: 'locationDetails' },
                { model: otherDetails, as: 'otherDetails' },
                { model: imageUpload, as: 'imageUpload' },
                {
                    model: Subscription,
                    as: 'subscriptions',
                    include: [{ model: Plan, as: 'plans' }]
                },
                {
                    model: FavProfile,
                    as: 'FavoritingProfiles',
                    include: [{ model: User, as: 'FavoritedUser' }]
                },
                {
                    model: Recommendation,
                    as: 'recommendations'
                }
            ]
        });

        const blockedUsers = await Block.findAll();
        const reportedUsers = await Report.findAll();

        return res.status(200).json({
            success: true,
            data: users,
            blockedUsers,
            reportedUsers
        });
    } catch (error) {
        console.error("Error fetching full user data:", error);
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message
        });
    }
};

const get7DaysAgoDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
};

export const getUserStatus = async (req, res) => {
    try {
        const [totalUsers, newUsers, standardUsers, premiumUsers, exclusiveUsers] = await Promise.all([
            User.count(), // total users
            User.count({
                where: {
                    createdAt: {
                        [Op.gte]: get7DaysAgoDate(),
                    },
                },
            }),
            User.count({ where: { usertype: "Standard" } }),
            User.count({ where: { usertype: "Premium" } }),
            User.count({ where: { usertype: "Exclusive" } }),
        ]);

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                newUsersLast7Days: newUsers,
                standardUsers,
                premiumUsers,
                exclusiveUsers,
            },
        });
    } catch (error) {
        console.error("Error in getUserStats:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};