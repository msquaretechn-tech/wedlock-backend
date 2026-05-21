import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import User from "../Models/user.js";
import errorhandler from "../Utils/errorhandler.js";
import ToggleSection from "../Models/toggleSection.model.js";

export const toggleSection = catchAsyncError(async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        let { section, status } = req.body;

        // Validate input
        if (!userId || !section || status === undefined) {
            return next(new errorhandler("Invalid input data", 400));
        }

        // Ensure status is a boolean
        status = Boolean(status);

        const user = await User.findOne({ where: { userId } });
        if (!user) return next(new errorhandler("User not found", 400));

        let toggleSection = await ToggleSection.findOne({ where: { userId, section } });

        if (!toggleSection) {
            // Create new toggle entry
            toggleSection = await ToggleSection.create({ userId, section, status });
            return res.status(201).json({
                success: true,
                message: "Toggle section created successfully",
                data: { section: toggleSection.section, status: toggleSection.status }
            });
        }

        // Avoid unnecessary update if status is unchanged
        if (toggleSection.status === status) {
            return res.status(200).json({
                success: true,
                message: "No changes made",
                data: { section: toggleSection.section, status: toggleSection.status }
            });
        }

        // Update existing record
        await toggleSection.update({ status });

        res.status(200).json({
            success: true,
            message: "Toggle section updated successfully",
            data: { section: toggleSection.section, status }
        });

    } catch (error) {
        return next(new errorhandler("Internal Server Error", 500));
    }
});
