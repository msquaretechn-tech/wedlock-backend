import multer from "multer";
import  { v4 as uuidv4 } from 'uuid';


export const  storage =  multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, './public/uploads/images')
        },
        filename: function (req, file, cb) {
            cb(null, file.fieldname + '-' + uuidv4())
        }
 })




 export const upload = multer({
  storage,
 });                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               