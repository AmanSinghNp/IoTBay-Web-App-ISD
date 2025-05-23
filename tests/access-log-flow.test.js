// Access Log Full Flow Testing Script
const sequelize = require("../config/database");
const User = require("../models/user");
const UserAccessLog = require("../models/userAccessLog");
const bcrypt = require("bcrypt");

async function testAccessLogFlow() {
  try {
    console.log("\n🔄 TESTING ACCESS LOG FLOW");
    console.log("=============================");

    // 1. Create a test user if it doesn't exist
    console.log("\n📝 Step 1: Setting up test user");
    let testUser = await User.findOne({
      where: { email: "testuser@example.com" },
    });

    if (!testUser) {
      console.log("Creating new test user...");
      const hashedPassword = await bcrypt.hash("testpassword", 10);
      testUser = await User.create({
        fullName: "Test User",
        email: "testuser@example.com",
        password: hashedPassword,
        role: "customer",
      });
      console.log("✅ Created new test user");
    } else {
      console.log("✅ Using existing test user");
    }

    // 2. Clean up existing logs for this test user to start fresh
    console.log("\n🧹 Step 2: Cleaning existing logs");
    const deletedCount = await UserAccessLog.destroy({
      where: { userId: testUser.id },
    });
    console.log(
      `✅ Deleted ${deletedCount} previous log entries for test user`
    );

    // 3. Simulate login sessions with different timeframes
    console.log("\n🔑 Step 3: Creating test log entries");

    // Create log for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayLogin = new Date(yesterday);
    yesterdayLogin.setHours(9, 30, 0);

    const yesterdayLogout = new Date(yesterday);
    yesterdayLogout.setHours(10, 45, 0);

    await UserAccessLog.create({
      userId: testUser.id,
      loginTime: yesterdayLogin,
      logoutTime: yesterdayLogout,
    });

    // Create log for this morning
    const today = new Date();
    const morningLogin = new Date(today);
    morningLogin.setHours(8, 15, 0);

    const morningLogout = new Date(today);
    morningLogout.setHours(8, 45, 0);

    await UserAccessLog.create({
      userId: testUser.id,
      loginTime: morningLogin,
      logoutTime: morningLogout,
    });

    // Create current "active" session
    const currentLogin = new Date();
    await UserAccessLog.create({
      userId: testUser.id,
      loginTime: currentLogin,
      logoutTime: null, // Active session
    });

    console.log("✅ Created 3 test log entries:");
    console.log(
      `  - Yesterday's session: ${yesterdayLogin.toLocaleTimeString()} - ${yesterdayLogout.toLocaleTimeString()}`
    );
    console.log(
      `  - Today's morning session: ${morningLogin.toLocaleTimeString()} - ${morningLogout.toLocaleTimeString()}`
    );
    console.log(
      `  - Current active session: ${currentLogin.toLocaleTimeString()} - Active`
    );

    // 4. Verify logs can be retrieved and displayed
    console.log("\n🔍 Step 4: Verifying log retrieval");

    // Get all logs for the user
    const allLogs = await UserAccessLog.findAll({
      where: { userId: testUser.id },
      order: [["loginTime", "DESC"]],
    });

    console.log(`✅ Retrieved ${allLogs.length} logs for test user`);

    if (allLogs.length !== 3) {
      throw new Error(`Expected 3 logs but found ${allLogs.length}`);
    }

    // 5. View logs as would be displayed on the frontend
    console.log("\n📊 Step 5: Simulating access log view");
    console.log("\nACCESS LOGS TABLE");
    console.log("-------------------------------------------");
    console.log("| LOGIN TIME          | LOGOUT TIME         | DURATION     |");
    console.log("-------------------------------------------");

    for (const log of allLogs) {
      const loginTime = new Date(log.loginTime).toLocaleString();
      const logoutTime = log.logoutTime
        ? new Date(log.logoutTime).toLocaleString()
        : "Active Session";
      let duration = "Currently Active";

      if (log.logoutTime) {
        const durationMs = new Date(log.logoutTime) - new Date(log.loginTime);
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        duration = `${minutes} min ${seconds} sec`;
      }

      console.log(
        `| ${loginTime.padEnd(19)} | ${logoutTime.padEnd(
          19
        )} | ${duration.padEnd(11)} |`
      );
    }

    console.log("-------------------------------------------");

    // 6. Simulate logout for the active session
    console.log("\n🚪 Step 6: Simulating logout for active session");

    const activeLog = allLogs.find((log) => !log.logoutTime);
    if (activeLog) {
      await activeLog.update({ logoutTime: new Date() });
      console.log("✅ Logged out active session");
    } else {
      console.log("❌ No active session found");
    }

    // 7. Final check - all sessions should be closed
    const openSessions = await UserAccessLog.count({
      where: {
        userId: testUser.id,
        logoutTime: null,
      },
    });

    console.log(`\nRemaining open sessions: ${openSessions}`);
    console.log(
      openSessions === 0
        ? "✅ All sessions properly closed"
        : "❌ Some sessions still open"
    );

    console.log("\n=============================");
    console.log("🎉 ACCESS LOG FLOW TEST COMPLETED SUCCESSFULLY!");
  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
  } finally {
    await sequelize.close();
  }
}

// Run the test
testAccessLogFlow();
