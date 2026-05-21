import { Op, Sequelize } from 'sequelize';
import moment from 'moment';


import User from '../../Models/user.js';
import personalDetails from '../../Models/personalDetails.model.js';
import imageUpload from '../../Models/imageUpload.model.js';
import Recommendation from '../../Models/recommendation.model.js';
import Connection from '../../Models/connection.model.js';

/** GET USER STATS WEEKLY, MONTHLY, YEARLY **/
export const getUserStatsForAdmin = async (req, res) => {
    try {
        const currentDate = moment();
        const startOfYear = moment().startOf('year');
        const weeksStats = [];

        for (let i = 0; i < 52; i++) {
            const startOfWeek = startOfYear.clone().add(i, 'weeks').startOf('week');
            const endOfWeek = startOfWeek.clone().endOf('week');
            if (startOfWeek.isAfter(currentDate)) break;

            const usersThisWeek = await User.count({
                where: {
                    createdAt: { [Op.between]: [startOfWeek.toDate(), endOfWeek.toDate()] }
                }
            });

            weeksStats.push({
                week: i + 1,
                users: usersThisWeek,
                startOfWeek: startOfWeek.format('YYYY-MM-DD'),
                endOfWeek: endOfWeek.format('YYYY-MM-DD'),
            });
        }

        const monthsStats = [];
        for (let month = 0; month < 12; month++) {
            const startOfMonth = moment().month(month).startOf('month');
            const endOfMonth = moment().month(month).endOf('month');
            if (startOfMonth.isAfter(currentDate)) break;

            const usersThisMonth = await User.count({
                where: {
                    createdAt: { [Op.between]: [startOfMonth.toDate(), endOfMonth.toDate()] }
                }
            });

            monthsStats.push({
                month: startOfMonth.format('MMMM'),
                users: usersThisMonth,
                startOfMonth: startOfMonth.format('YYYY-MM-DD'),
                endOfMonth: endOfMonth.format('YYYY-MM-DD'),
            });
        }

        const yearsStatsRaw = await User.findAll({
            attributes: [
                [Sequelize.fn('date_part', 'year', Sequelize.col('createdAt')), 'year'],
                [Sequelize.fn('COUNT', Sequelize.col('userId')), 'users'],
            ],
            group: ['year'],
            order: [['year', 'ASC']],
            raw: true,
        });

        const yearsStats = yearsStatsRaw.map(stat => ({
            year: parseInt(stat.year),
            users: parseInt(stat.users),
        }));

        res.status(200).json({ weeksStats, monthsStats, yearsStats });

    } catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({ error: 'Error fetching user statistics' });
    }
};

/** GET NEWLY ADDED USERS (TODAY, THIS WEEK, THIS MONTH) **/
export const getNewUserAdded = async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const todayEnd = new Date(now.setHours(23, 59, 59, 999));

        const weekStart = new Date();
        weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const users = await User.findAll({
            where: { createdAt: { [Op.lte]: monthEnd } },
            order: [['createdAt', 'DESC']]
        });

        const fetchUserDetails = async (userId) => {
            const details = await personalDetails.findOne({ where: { userId }, attributes: ['firstName'] });
            const profile = await imageUpload.findOne({ where: { userId }, attributes: ['image'] });

            return {
                firstName: details?.firstName ?? 'N/A',
                profilePic: profile?.image ?? null,
            };
        };

        const filterUsers = (users, start, end) => users.filter(user =>
            new Date(user.createdAt) >= start && new Date(user.createdAt) <= end
        );

        const formatUsers = async (userList) => {
            const result = [];
            for (const user of userList) {
                const details = await fetchUserDetails(user.userId);
                result.push({
                    userId: user.userId,
                    firstName: details.firstName,
                    profilePic: details.profilePic,
                    createdAt: user.createdAt
                });
            }
            return result;
        };

        const todayUsers = await formatUsers(filterUsers(users, todayStart, todayEnd));
        const weekUsers = await formatUsers(filterUsers(users, weekStart, weekEnd));
        const monthUsers = await formatUsers(filterUsers(users, monthStart, monthEnd));

        res.status(200).json({
            success: true,
            data: {
                today: { count: todayUsers.length, users: todayUsers },
                thisWeek: { count: weekUsers.length, users: weekUsers },
                thisMonth: { count: monthUsers.length, users: monthUsers },
                total: { count: users.length }
            }
        });

    } catch (error) {
        console.error('Error fetching new users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch new users', error: error.message });
    }
};

/** GENDER RATIO **/
export const getGenderRatio = async (req, res) => {
    try {
        const total = await Recommendation.count({ where: { gender: { [Op.ne]: null } } });
        const maleCount = await Recommendation.count({ where: { gender: 'Man' } });
        const femaleCount = await Recommendation.count({ where: { gender: 'Woman' } });

        if (total === 0) {
            return res.status(200).json({ success: true, message: 'No users with gender info' });
        }

        res.status(200).json({
            success: true,
            data: {
                totalUsersWithGender: total,
                maleCount,
                femaleCount,
                maleRatio: ((maleCount / total) * 100).toFixed(2),
                femaleRatio: ((femaleCount / total) * 100).toFixed(2),
            }
        });

    } catch (error) {
        console.error('Error fetching gender ratio:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch gender ratio', error: error.message });
    }
};

/** PROFILE COMPLETION STATS **/
export const getProfileCompletionStats = async (req, res) => {
    try {
        const users = await User.findAll();
        const recommendations = await Recommendation.findAll();

        const recMap = new Map();
        recommendations.forEach(rec => recMap.set(rec.userId, rec));

        const userFields = [
            'uid', 'userStatus', 'fcmToken', 'email', 'usertype'
        ];

        const recommendationFields = [
            'qualification', 'occupation', 'income', 'firstName', 'lastName', 'displayName', 'contactNumber',
            'maritalStatus', 'numberOfChildren', 'aboutYourSelf', 'caste', 'community', 'religion', 'placeOfBirth',
            'motherTongue', 'gotra', 'height', 'weight', 'bodyType', 'language', 'smokingHabbit', 'drinkingHabbit',
            'diet', 'complexion', 'fatherOccupation', 'motherOccupation', 'siblings', 'country', 'state',
            'currentLocation', 'cityOfResidence', 'nationality', 'gender', 'lookingFor', 'age', 'lookingPartnerAge',
            'horoscopeMatch', 'castReligionMatterOrNot', 'interest_and_hobbies', 'image'
        ];

        const totalFields = userFields.length + recommendationFields.length;
        const profileBuckets = { '0-29%': 0, '30-49%': 0, '50-79%': 0, '80-99%': 0, '100%': 0 };

        users.forEach(user => {
            let filled = userFields.filter(f => user[f]).length;
            const rec = recMap.get(user.userId);

            if (rec) {
                recommendationFields.forEach(f => {
                    const val = rec[f];
                    if (Array.isArray(val)) {
                        if (val.length > 0) filled++;
                    } else if (val && typeof val === 'object') {
                        if (Object.keys(val).length > 0) filled++;
                    } else if (val !== null && val !== '' && val !== undefined) {
                        filled++;
                    }
                });
            }

            const percent = ((filled / totalFields) * 100);
            if (percent >= 100) profileBuckets['100%']++;
            else if (percent >= 80) profileBuckets['80-99%']++;
            else if (percent >= 50) profileBuckets['50-79%']++;
            else if (percent >= 30) profileBuckets['30-49%']++;
            else profileBuckets['0-29%']++;
        });

        const totalUsers = users.length;
        const stats = Object.fromEntries(
            Object.entries(profileBuckets).map(([k, v]) => [k, totalUsers ? `${((v / totalUsers) * 100).toFixed(2)}%` : '0.00%'])
        );

        res.status(200).json({ success: true, totalUsers, profileCompletionStats: stats });

    } catch (error) {
        console.error('Error fetching profile completion stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile completion stats', error: error.message });
    }
};

/** CONNECTION STATS **/
export const getConnectionStats = async (req, res) => {
    try {
        const statsRaw = await Connection.findAll({
            attributes: [
                'status',
                [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
            ],
            group: ['status'],
            raw: true
        });

        const result = {
            acceptedConnections: 0,
            rejectedConnections: 0,
            pendingConnections: 0,
            cancelledConnections: 0
        };

        statsRaw.forEach(stat => {
            if (result.hasOwnProperty(`${stat.status}Connections`)) {
                result[`${stat.status}Connections`] = parseInt(stat.count, 10);
            }
        });

        res.status(200).json({ success: true, data: result });

    } catch (error) {
        console.error('Error fetching connection stats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch connection stats', error: error.message });
    }
};
