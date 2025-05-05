const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");

const UserAccessLog = sequelize.define("UserAccessLog", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  loginTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  logoutTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

// Relationships
User.hasMany(UserAccessLog, { foreignKey: "userId" });
UserAccessLog.belongsTo(User, { foreignKey: "userId" });

module.exports = UserAccessLog;
