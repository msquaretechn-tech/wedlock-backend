import { catchAsyncError } from "../Middlewares/catchAsyncError.js";
import errorhandler  from "../Utils/errorhandler.js";
import FavProfile from "../Models/favProfile.model.js";




export const toggleFav = catchAsyncError(async (req, res, next) => {
    try{
        const userId = req.user.userId; 

        const { favoritedUserId } = req.body;



        if( !favoritedUserId){
            return res.status(400).json({ success: false, message: 'favoritedUserId is required.' });
        }

        const existingFavProfile = await FavProfile.findOne({where: {favoritedUserId,  userId}});


        if(existingFavProfile){
            await FavProfile.destroy({where: {favoritedUserId,  userId}});
            return res.status(200).json({ success: true, message: "Favourite Removed successfully!"});
        }


    await FavProfile.create({favoritedUserId,userId});


        return res.status(201).json({ success: true, message: "Favourite Added successfully!"});

    }catch(error){
        
        return next(new errorhandler(error.message, 500));
    }

})


export const getFavProfile = catchAsyncError(async (req, res, next) => {
    try{
        const userId = req.user.userId;

        const FavouritedProfiles = await FavProfile.findAll({
           
            where: { userId },
        })

        if(!FavouritedProfiles){
            return res.status(404).json({success: false,message: "Favourite profile not found!"});
        }

        const data = FavouritedProfiles.map((user) => {
            return {userId: user.favoritedUserId,}
        })

        return res.status(200).json({success: true ,data, message: "Favourite profile fetched successfully!"});

    }catch(error){
     return next(new errorhandler(error.message, 500));
    }
})

// export const  removeFavProfile = catchAsyncError(async (req, res, next) => {
//     try{
//         const userId = req.user.userId;

//         const {favoritedUserId} = req.body;

//         const favProfile = await FavProfile.findOne({
//             where: { favoritedUserId, userId },
//         });

//         if (!favProfile) {
//             return res.status(404).json({ success: false, message: 'Favorite profile not found.' });
//         }

//         await favProfile.destroy();

//         return res.status(200).json({ success: true, message: 'Favorite profile removed successfully.' });


//     }catch(error){
//         return next(new errorhandler(error.message, 500));
//     }

// })


