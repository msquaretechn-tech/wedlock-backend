import { DataTypes } from 'sequelize';
import connectDB from '../../Utils/db.js';

import bcrypt from 'bcryptjs';
const sequelize = connectDB();
const Admin = sequelize.define('Admin', {
    adminId: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'admin',
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'active',
    }
});


Admin.beforeCreate(async (admin) => {
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(admin.password, salt);
});


Admin.prototype.validPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
};


const syncDB = async () => {
    try {
        await sequelize.sync({ alter: true }); // Use `alter: true` to avoid data loss
        console.log('Database synced successfully'); 
    } catch (error) {
        console.error('Error syncing database:', error);
    }
};


syncDB();
export default Admin;

