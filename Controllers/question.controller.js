import Question from "../Models/question.model.js";
import errorhandler from "../Utils/errorhandler.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import Constants from "../Utils/constant.js";

export const addQuestion = catchAsyncError(async(req ,res ,next) => {
    const { question } = req.body;


    if (!question) {
        return next( errorhandler(Constants.ERROR_MESSAGES.MISSING_REQUIRED_FIELD, Constants.STATUS_CODE.BAD_REQUEST));
    }

    try {
        const newQuestion = await Question.create({ question });
        res.status(Constants.STATUS_CODE.CREATED).json({
            message: Constants.KSTRINGS.QUESTION_ADDED_SUCCESSFULLY,
            questionId: newQuestion.id
        });
    } catch (err) {
        next( errorhandler(Constants.KSTRINGS.FAILED_TO_ADD_QUESTION,Constants.STATUS_CODE.INTERNAL_SERVER_ERROR));
    }
    
})
