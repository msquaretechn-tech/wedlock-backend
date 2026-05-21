


// models/Admin/AdminApiLog.model.js
import { DataTypes } from 'sequelize';
import connectDB from '../../Utils/db.js';

const sequelize = connectDB();

const AdminApiLog = sequelize.define('AdminApiLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  admin_id: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  method: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  endpoint: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status_code: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  response_time_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
});

const syncLogDB = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('AdminApiLog table synced successfully');
  } catch (error) {
    console.error('Failed to sync AdminApiLog table:', error);
  }
};

syncLogDB();
export default AdminApiLog;
