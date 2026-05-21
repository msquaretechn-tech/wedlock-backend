import { DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import connectDB from '../Utils/db.js';
dotenv.config();


const sequelize = connectDB();


const Recommendation = sequelize.define('Recommendation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: true
    },
    uid : {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userStatus: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },

    fcmToken: {
        type: DataTypes.STRING,
        allowNull: true
    },

    userId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true
    },

    usertype: {
        type: DataTypes.STRING,
        allowNull: true
    },

    qualification: {
        type: DataTypes.STRING,
        allowNull: true
    },
    currentWorkingStatus: {
        type: DataTypes.STRING,
        allowNull: true
    },
    occupation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    income: {
        type: DataTypes.STRING,
        allowNull: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: true
    },

    displayName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        min: 10,
        max: 10
    },
    maritalStatus: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    numberOfChildren: {
        type: DataTypes.STRING,
        allowNull: true
    },

    aboutYourSelf: {
        type: DataTypes.STRING,
        allowNull: true
    },
    caste: {
        type: DataTypes.STRING,
        allowNull: true
    },
    community: {
        type: DataTypes.STRING,
        allowNull: true
    },
    subCommunity: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Not Specified"
    },
    dateOfBirth: {
        type: DataTypes.STRING,
        allowNull: true
    },
    timeOfBirth: {
        type: DataTypes.STRING,
        allowNull: true
    },
    religion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    placeOfBirth: {
        type: DataTypes.STRING,
        allowNull: true
    },
    motherTongue: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gotra: {
        type: DataTypes.STRING,
        allowNull: true
    },
    height: {
        type: DataTypes.STRING,
        allowNull: true
    },
    weight: {
        type: DataTypes.STRING,
        allowNull: true
    },
    bodyType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    language: {
        type: DataTypes.STRING,
        allowNull: true
    },
    smokingHabbit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    drinkingHabbit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    diet: {
        type: DataTypes.STRING,
        allowNull: true
    },
    complexion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fatherOccupation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    motherOccupation: {
        type: DataTypes.STRING,
        allowNull: true
    },
    siblings: {
        type: DataTypes.STRING,
        allowNull: true
    },

    numberOfSiblings: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Not Specified"

    },
    livingWithFamily: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Not Specified"

    },
    citizenShip: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    },
    state: {
        type: DataTypes.STRING,
        allowNull: true
    },
    austrailanVisaStatus: {
        type: DataTypes.STRING,
        allowNull: true
    },
    currentLocation: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Not Specified"
    },
    cityOfResidence: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    nationality: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Not Specified"

    },
    residencyVisaStatus: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "Not Specified"
    },
    gender:
    {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lookingFor: {
        type: DataTypes.STRING,
        allowNull: true,

    },
    weddingGoals: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    age: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    lookingPartnerAge: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    livingInAustralia: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    horoscopeMatch: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    castReligionMatterOrNot: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    interest_and_hobbies: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: true,
    },    
    image: {
        type: DataTypes.JSON,
        allowNull: true
    },


}, {
    timestamps: true,

});
export default Recommendation