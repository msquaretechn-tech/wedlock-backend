import { DataTypes } from 'sequelize';



import connectDB from '../../Utils/db.js';
import User from '../user.js';

const sequelize = connectDB();

const SuspendedUser = sequelize.define('SuspendedUser', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'userId',
    },
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  suspendedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  unsuspendAt: {
    type: DataTypes.DATE,
    allowNull: true, // null means indefinite
  },
});



export default SuspendedUser;
