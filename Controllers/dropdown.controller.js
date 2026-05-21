import { Op } from "sequelize";

import dropdown from "../Models/dropdown.model.js";
import dropDownType from "../Models/dropdowntype.model.js";
import errorhandler from "../Utils/errorhandler.js";
import { catchAsyncError } from "../Middlewares/catchAsyncError.js";


//single create dropdownType
export const createDropdownType = catchAsyncError(async(req ,res ,next) => {
    try {
    const { dropdownType } = req.body;

    if (!dropdownType) {
        return next(new errorhandler("All fields are required!", 400));
    }

    const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

    if (dropdownTypeExist) {
        return next(new errorhandler("Dropdown type already exist!", 400));
    }

    const dropdownTypeData = await dropDownType.create({ dropdownType });

    if (!dropdownTypeData) {
        return next(new errorhandler("Failed to create dropdown type!", 500));
    }

    res.status(201).json({
        success: true,
        message: "Dropdown type created successfully",
        dropdownTypeData
    })

        
    } catch (err) {
        next( new errorhandler(err.message, 500));
    }
    
})
//bulk create dropDownType
export const createDropdownTypeBulk = catchAsyncError(async(req ,res ,next) => {
    try {
    const { dropdownType } = req.body;

    

    if (!dropdownType || !Array.isArray(dropdownType)) {
        return next(new errorhandler("DropdownType must be an array of strings!", 400));
    }

    const existingTypes = await dropDownType.findAll({
        where: {
            dropdownType: dropdownType,  
        },
    });

    const existingTypeNames = existingTypes.map((type) => type.dropdownType);

    const newDropdownTypes = dropdownType
    .filter((type) => !existingTypeNames.includes(type))
    .map((type) => ({ dropdownType: type }));


    if (newDropdownTypes.length === 0) {
        return next(new errorhandler("All provided dropdown types already exist!", 400));
    }


    const dropdownTypeData = await dropDownType.bulkCreate(newDropdownTypes);


    res.status(201).json({
        success: true,
        message: "Dropdown types created successfully",
        dropdownTypeData,
    });

        
    } catch (err) {
        next( new errorhandler(err.message, 500));
    }
    
})
export const createDropdown = catchAsyncError(async(req ,res ,next) => {
    try{

        const { dropdownType , dropdownValue } = req.body;

        if (!dropdownType || !dropdownValue) {
            return next(new errorhandler("Both dropdownType and dropdownValue are required!", 400));
        }

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400)); 
        }

        const dropdownValueExist = await dropdown.findOne({
            where: {
                dropDownTypeId: dropdownTypeExist.dropDownTypeId, 
                dropdownValue,
            },
        });

        if (dropdownValueExist) {
            return next(new errorhandler(`Dropdown value '${dropdownValue}' already exists for the dropdown type '${dropdownType}'!`, 400));
        }

        const dropdownValueData = await dropdown.create({
            dropDownTypeId: dropdownTypeExist.dropDownTypeId,
            dropdownValue,
        });

        if (!dropdownValueData) {
            return next(new errorhandler("Failed to create dropdown value!", 500));
        }

        res.status(201).json({
            success: true,
            message: "Dropdown value created successfully",
            dropdownValueData
        })

    }
    catch(error){
        return next (new errorhandler(error.message, 500));
    }

})
export const createDropdownBulk = catchAsyncError(async (req, res, next) => {
    try {
        const { dropdownType, dropdownValue } = req.body;

        
        if (!dropdownType || !dropdownValue || !Array.isArray(dropdownValue)) {
            return next(new errorhandler("Both 'dropdownType' and an array of 'dropdownValue' are required!", 400));
        }

        
        if (dropdownValue.some(value => typeof value !== 'string')) {
            return next(new errorhandler("'dropdownValue' should be an array of strings!", 400));
        }

        
        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }


        const existingValues = await dropdown.findAll({
            where: {
                dropDownTypeId: dropdownTypeExist.dropDownTypeId,
                dropdownValue: dropdownValue,
            },
        });

        if (existingValues.length > 0) {
            return next(new errorhandler("One or more dropdown values already exist!", 400));
        }

    
        const dataToCreate = dropdownValue.map(value => ({
            dropDownTypeId: dropdownTypeExist.dropDownTypeId,
            dropdownValue: value,
        }));

        
        const dropdownValueData = await dropdown.bulkCreate(dataToCreate);

        res.status(201).json({
            success: true,
            message: "Dropdown values created successfully",
            dropdownValueData,
        });
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const updateDropdown = catchAsyncError(async(req ,res ,next) => {
    try {
    const { dropdownId, dropdownValue } = req.body;

    if (!dropdownId || !dropdownValue) {
        return next(new errorhandler("Both 'dropdownId' and 'dropdownValue' are required!", 400));
    }

    const dropdownData = await dropdown.findOne({
        where: {
            dropdownId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const dropdownValueExist = await dropdown.findOne({
        where: {
            dropdownId: dropdownData.dropdownId,
            dropdownValue,
        },
    });

    if (dropdownValueExist) {
        return next(new errorhandler("Dropdown value already exists!", 400));
    }

    dropdownData.dropdownValue = dropdownValue;

    await dropdownData.save();

    res.status(200).json({
        success: true,
        message: "Dropdown data updated successfully",
        dropdownData,
    });

        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

export const deleteDropdown = catchAsyncError(async(req ,res ,next) => {
    try {
    const { dropdownId } = req.body;

    if (!dropdownId) {
        return next(new errorhandler("dropdownId is required!", 400));
    }

    const dropdownData = await dropdown.findOne({
        where: {
            dropdownId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    await dropdownData.destroy();

    res.status(200).json({
        success: true,
        message: "Dropdown data deleted successfully",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

export const updateDropdownType = catchAsyncError(async(req ,res ,next) => {
    try {
    const { dropdownTypeId, dropdownType } = req.body;

    if (!dropdownTypeId || !dropdownType) {
        return next(new errorhandler("Both 'dropdownTypeId' and 'dropdownType' are required!", 400));
    }

    const dropdownTypeData = await dropDownType.findOne({
        where: {
            dropdownTypeId,
        },
    });

    if (!dropdownTypeData) {
        return next(new errorhandler("Dropdown type data not found!", 404));
    }

    const dropdownTypeExist = await dropDownType.findOne({
        where: {
            dropdownType,
        },
    });

    if (dropdownTypeExist) {
        return next(new errorhandler("Dropdown type already exists!", 400));
    }

    dropdownTypeData.dropdownType = dropdownType;

    await dropdownTypeData.save();

    res.status(200).json({
        success: true,
        message: "Dropdown type data updated successfully",
        dropdownTypeData,
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

export const deleteDropdownType = catchAsyncError(async(req ,res ,next) => {
    try {
    const { dropdownType } = req.body;

    if (!dropdownType) {
        return next(new errorhandler("dropdownType is required!", 400));
    }

    const dropdownTypeData = await dropDownType.findOne({
        where: {
            dropdownType,
        },
    });

    if (!dropdownTypeData) {
        return next(new errorhandler("Dropdown type data not found!", 404));
    }

    await dropdownTypeData.destroy();

    res.status(200).json({
        success: true,
        message: "Dropdown type data deleted successfully",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

   
export const IncomeDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Income";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId, 
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            dropdown:dropdown.dropdownId,
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });


    

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
})

export const fatherOccupationDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "FatherOccupation";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
})

export const  motherOccupationDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "MotherOccupation";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const gotrasDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Gotra";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
});


export const religionDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Religion";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
});

export const communityDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Community";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    // Append static "Not Relevant" option at the end
    data.push({ id: null, value: "Not Relevant" });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
});


export const motherToungueDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "MotherToungue";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
});

export const heightDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Height";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
})

export const qualificationDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Qualification";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
})

export const occupationDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Occupation";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

});

export const smokingHabbitDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "SmokingHabbit";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
});

export const drinkingHabbitDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "DrinkingHabbit";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
});

export const dietDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Diet";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
});

export const complexionDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Complexion";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
});


export const ethnicsDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Ethnicity";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };

    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

});

export const maritalStatusDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "MaritalStatus";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

});

export const citizenshipDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Citizenship";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
});

export const  australianVisaStatusDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "AustralianVisaStatus";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }

})


export const casteDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "Caste";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {
            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    } 
    
});

export const bodyTypeDropdown = catchAsyncError(async(req ,res ,next) => {
    try {

        const dropdownType = "BodyType";

        const dropdownTypeExist = await dropDownType.findOne({ where: { dropdownType } });

        if (!dropdownTypeExist) {

            return next(new errorhandler(`Dropdown type '${dropdownType}' does not exist!`, 400));
        }



    const dropdownData = await dropdown.findAll({
        where: {
           dropDownTypeId: dropdownTypeExist.dropDownTypeId,
        },
    });

    if (!dropdownData) {
        return next(new errorhandler("Dropdown data not found!", 404));
    }

    const data = dropdownData.map((dropdown) => {
        return {
            id: dropdown.id,
            value: dropdown.dropdownValue,
        };
    });

    res.status(200).json({
        success: true,
        data: data,
        message: "Dropdown data fetched successfully!",
    });
        
    } catch (error) {
        return next(new errorhandler(error.message, 500));
    }
    
});



export const fetchAllDropdowns = catchAsyncError(async(req ,res ,next) => {

    try {

        const dropdownTypes = await dropDownType.findAll();

        if (!dropdownTypes) {
            return next(new errorhandler("Dropdown types not found!", 404));
        }

        const data = dropdownTypes.map((dropdownType) => {
            return {
                dropdownType: dropdownType.dropdownType,
              
            };
        });


        res.status(200).json({
            success: true,
            data: data,
            message: "Dropdown data fetched successfully!",
        });


        

        



    }


    catch (error) {
        return next(new errorhandler(error.message, 500));
    }

})
