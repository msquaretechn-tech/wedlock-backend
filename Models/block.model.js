// models/Block.model.js
import { DataTypes } from 'sequelize'
import connectDB from '../Utils/db.js'

const sequelize = connectDB()

const Block = sequelize.define('Block', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  blockerUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  blockedUserId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'blocks'
})

export default Block