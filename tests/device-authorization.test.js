// IoT Device Authorization Testing Script
const sequelize = require("../config/database");
const User = require("../models/user");
const Device = require("../models/device");
const bcrypt = require("bcrypt");

// Mock Express request and response objects
function createMockReq(user = null) {
  return {
    session: {
      userId: user ? user.id : null,
      userRole: user ? user.role : null,
    },
    body: {},
    params: {},
  };
}

function createMockRes() {
  const res = {
    status: function (code) {
      this.statusCode = code;
      return this;
    },
    send: function (message) {
      this.message = message;
      return this;
    },
    redirect: function (path) {
      this.redirectPath = path;
      return this;
    },
    render: function (view, data) {
      this.renderedView = view;
      this.renderedData = data;
      return this;
    },
    statusCode: 200,
    message: null,
    redirectPath: null,
    renderedView: null,
    renderedData: null,
  };
  return res;
}

async function testDeviceAuthorization() {
  try {
    console.log("🔒 Starting IoT Device Authorization Test");
    console.log("----------------------------------------");

    // Import controller
    const deviceController = require("../controllers/deviceController");

    // 1. Find or create test users (one staff, one customer)
    console.log("🔍 Finding test users...");

    let staffUser = await User.findOne({ where: { role: "staff" } });
    let customerUser = await User.findOne({ where: { role: "customer" } });

    if (!staffUser || !customerUser) {
      console.error(
        "❌ Test users not found! Creating temporary test users..."
      );

      if (!staffUser) {
        const hashedPassword = await bcrypt.hash("testpassword", 10);
        staffUser = await User.create({
          fullName: "Test Staff",
          email: "test.staff@example.com",
          password: hashedPassword,
          role: "staff",
        });
        console.log("✅ Created temporary staff user");
      }

      if (!customerUser) {
        const hashedPassword = await bcrypt.hash("testpassword", 10);
        customerUser = await User.create({
          fullName: "Test Customer",
          email: "test.customer@example.com",
          password: hashedPassword,
          role: "customer",
        });
        console.log("✅ Created temporary customer user");
      }
    }

    console.log(`✅ Staff user: ${staffUser.fullName}`);
    console.log(`✅ Customer user: ${customerUser.fullName}`);

    // Test device object
    const testDevice = {
      name: "Test Smart Light",
      brand: "IoTech",
      catalog: "Lighting",
      price: 49.99,
      stock: 100,
      description: "Smart lighting for your home",
    };

    // 2. Test Create Device Authorization
    console.log("\n🔍 Testing device creation authorization...");

    // Test with customer (should be denied)
    const customerReq = createMockReq(customerUser);
    customerReq.body = testDevice;
    const customerRes = createMockRes();

    await deviceController.postAddDevice(customerReq, customerRes);

    if (customerRes.statusCode !== 403) {
      console.error("❌ Test failed: Customer was not denied device creation!");
      console.error(`   Status code: ${customerRes.statusCode}, expected 403`);
      process.exit(1);
    }

    console.log("✅ Customer correctly denied device creation access");

    // Test with staff (should be allowed)
    const staffReq = createMockReq(staffUser);
    staffReq.body = testDevice;
    const staffRes = createMockRes();

    try {
      // Create a test device first to have something to edit/delete
      const device = await Device.create(testDevice);

      // 3. Test Edit Device Authorization
      console.log("\n🔍 Testing device edit authorization...");

      // Test with customer (should be denied)
      const editCustomerReq = createMockReq(customerUser);
      editCustomerReq.params = { id: device.id };
      editCustomerReq.body = { ...testDevice, price: 59.99 };
      const editCustomerRes = createMockRes();

      await deviceController.updateDevice(editCustomerReq, editCustomerRes);

      if (editCustomerRes.statusCode !== 403) {
        console.error("❌ Test failed: Customer was not denied device edit!");
        console.error(
          `   Status code: ${editCustomerRes.statusCode}, expected 403`
        );
        process.exit(1);
      }

      console.log("✅ Customer correctly denied device edit access");

      // Test with staff (should be allowed)
      const editStaffReq = createMockReq(staffUser);
      editStaffReq.params = { id: device.id };
      editStaffReq.body = { ...testDevice, price: 59.99 };
      const editStaffRes = createMockRes();

      // This should pass without error
      await deviceController.updateDevice(editStaffReq, editStaffRes);

      if (editStaffRes.redirectPath !== "/devices") {
        console.error(
          "❌ Test failed: Staff device edit didn't redirect properly!"
        );
        process.exit(1);
      }

      console.log("✅ Staff correctly allowed device edit access");

      // 4. Test Delete Device Authorization
      console.log("\n🔍 Testing device deletion authorization...");

      // Test with customer (should be denied)
      const deleteCustomerReq = createMockReq(customerUser);
      deleteCustomerReq.params = { id: device.id };
      const deleteCustomerRes = createMockRes();

      await deviceController.deleteDevice(deleteCustomerReq, deleteCustomerRes);

      if (deleteCustomerRes.statusCode !== 403) {
        console.error(
          "❌ Test failed: Customer was not denied device deletion!"
        );
        console.error(
          `   Status code: ${deleteCustomerRes.statusCode}, expected 403`
        );
        process.exit(1);
      }

      console.log("✅ Customer correctly denied device deletion access");

      // Test with staff (should be allowed)
      const deleteStaffReq = createMockReq(staffUser);
      deleteStaffReq.params = { id: device.id };
      const deleteStaffRes = createMockRes();

      // This should pass without error
      await deviceController.deleteDevice(deleteStaffReq, deleteStaffRes);

      if (deleteStaffRes.redirectPath !== "/devices") {
        console.error(
          "❌ Test failed: Staff device deletion didn't redirect properly!"
        );
        process.exit(1);
      }

      console.log("✅ Staff correctly allowed device deletion access");

      // 5. Test Device Listing (should be available for all roles)
      console.log("\n🔍 Testing device listing for both roles...");

      // For customer
      const listCustomerReq = createMockReq(customerUser);
      const listCustomerRes = createMockRes();

      await deviceController.getAllDevices(listCustomerReq, listCustomerRes);

      if (
        !listCustomerRes.renderedView ||
        listCustomerRes.renderedView !== "devices"
      ) {
        console.error("❌ Test failed: Customer couldn't view device listing!");
        process.exit(1);
      }

      console.log("✅ Customer correctly allowed device listing access");

      // For staff
      const listStaffReq = createMockReq(staffUser);
      const listStaffRes = createMockRes();

      await deviceController.getAllDevices(listStaffReq, listStaffRes);

      if (
        !listStaffRes.renderedView ||
        listStaffRes.renderedView !== "devices"
      ) {
        console.error("❌ Test failed: Staff couldn't view device listing!");
        process.exit(1);
      }

      console.log("✅ Staff correctly allowed device listing access");
    } catch (error) {
      console.error("❌ Error during authorization test:", error);
      process.exit(1);
    } finally {
      // Clean up test devices
      await Device.destroy({
        where: { name: testDevice.name, brand: testDevice.brand },
      });
    }

    console.log("\n----------------------------------------");
    console.log("🎉 IoT Device Authorization test passed!");
  } catch (error) {
    console.error("❌ Test failed with error:", error);
  } finally {
    // Clean up temporary test users if created for this test

    // Close database connection
    await sequelize.close();
  }
}

// Run the test
testDeviceAuthorization();
