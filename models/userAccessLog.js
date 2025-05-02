const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./user");

const UserAccessLog = sequelize.define("UserAccessLog", {
  loginTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
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
