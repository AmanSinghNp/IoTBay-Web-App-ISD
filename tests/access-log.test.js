// Access Log Testing Script
const sequelize = require("../config/database");
const User = require("../models/user");
const UserAccessLog = require("../models/userAccessLog");
const bcrypt = require("bcrypt");

async function testAccessLogs() {
  try {
    console.log("📊 Starting Access Log Functionality Test");
    console.log("----------------------------------------");

    // 1. Find a test user (using the seeded admin user)
    console.log("🔍 Finding test user...");
    const testUser = await User.findOne({
      where: { email: "admin@example.com" },
    });

    if (!testUser) {
      console.error("❌ Test failed: Test user not found!");
      process.exit(1);
    }

    console.log(`✅ Test user found: ${testUser.fullName} (${testUser.email})`);

    // 2. Count existing logs for this user
    const initialLogCount = await UserAccessLog.count({
      where: { userId: testUser.id },
    });
    console.log(`ℹ️ Initial access log count: ${initialLogCount}`);

    // 3. Simulate login by creating a new access log
    console.log("🔑 Simulating user login...");
    const loginTime = new Date();
    const newLog = await UserAccessLog.create({
      userId: testUser.id,
      loginTime: loginTime,
    });

    console.log(`✅ Login recorded with log ID: ${newLog.id}`);

    // 4. Verify log was created
    const midTestLogCount = await UserAccessLog.count({
      where: { userId: testUser.id },
    });

    if (midTestLogCount !== initialLogCount + 1) {
      console.error("❌ Test failed: New access log entry was not created!");
      process.exit(1);
    }

    console.log("✅ Login log creation verified");

    // 5. Simulate logout after 2 seconds
    console.log("⏳ Waiting 2 seconds before simulating logout...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 6. Update log with logout time
    console.log("🚪 Simulating user logout...");
    const logoutTime = new Date();
    await newLog.update({ logoutTime: logoutTime });

    // 7. Verify logout time was recorded
    const updatedLog = await UserAccessLog.findByPk(newLog.id);

    if (!updatedLog.logoutTime) {
      console.error("❌ Test failed: Logout time was not recorded!");
      process.exit(1);
    }

    // Calculate session duration
    const duration = updatedLog.logoutTime - updatedLog.loginTime;
    const seconds = Math.floor(duration / 1000);

    console.log(`✅ Logout recorded successfully`);
    console.log(`ℹ️ Session duration: ${seconds} seconds`);

    // 8. Final verification - confirm log entry is retrievable
    const allLogs = await UserAccessLog.findAll({
      where: { userId: testUser.id },
      order: [["loginTime", "DESC"]],
    });

    console.log(`ℹ️ Total access logs for user: ${allLogs.length}`);
    console.log("✅ Most recent log entry:");
    console.log(`   Login time: ${allLogs[0].loginTime}`);
    console.log(`   Logout time: ${allLogs[0].logoutTime}`);

    console.log("----------------------------------------");
    console.log("🎉 Access log functionality test passed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    // Close database connection
    await sequelize.close();
  }
}

// Run the test
testAccessLogs();
