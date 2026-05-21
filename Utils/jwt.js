import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../Models/user.js';
import { redis } from "./redis.js";
dotenv.config();



    //parse environment variable to integrate fall back values
   const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300000'); // 5 minutes in ms
   const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '604800000'); // 7 days in ms


    //we have to add secure :true in production
 export  const accessTokenOptions ={
        expires: new Date(Date.now() + accessTokenExpire),
        maxAge: accessTokenExpire,
        httpOnly: false,
        sameSite: 'Lax',
        secure: false
    }
        //we have to add secure :true in production

 export  const refreshTokenOptions ={
        expires: new Date(Date.now() + refreshTokenExpire),
        maxAge: refreshTokenExpire,
        httpOnly: false,
        sameSite: 'Lax',
        secure: false
    }
 

export const sendToken = (user, statusCode, res,message) => {

    
    const accessToken = user.signAccessToken();
    const refreshToken = user.signRefreshToken();

    //upload session to redis
    redis.set(user.userId,JSON.stringify(user))



   
    res.cookie('access_token', accessToken, accessTokenOptions);
    res.cookie('refresh_token', refreshToken, refreshTokenOptions);
    


    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
        refreshToken,
        message
    })
}