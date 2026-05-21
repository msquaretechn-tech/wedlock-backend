import { DataTypes } from 'sequelize';
import connectDB from '../Utils/db.js';



const sequelize = connectDB();

const Feature = sequelize.define('Feature', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
    },
    featureId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    status : {
        type: DataTypes.STRING,
        allowNull: false,
        enum: ["Active", "Inactive"],
        defaultValue: "Active"
    
    }
}, {
    timestamps: true
});

await sequelize.sync({ force: false });

export default Feature;
        
