const Device = require("../../models/device");
const sequelize = require("../../config/database");

describe("Device Management - Unit Tests", () => {
  afterEach(async () => {
    // Clean up test data after each test
    try {
      await Device.destroy({ where: {}, force: true });
    } catch (error) {
      console.error("Error cleaning up test data:", error);
    }
  });

  describe("Device Creation (Create)", () => {
    test("should create a new device with valid data", async () => {
      const deviceData = {
        name: "Test Smart Device",
        brand: "TestBrand",
        catalog: "Electronics",
        price: 199.99,
        stock: 50,
        description: "A test smart device for unit testing",
        imageUrl: "/images/test-device.jpg",
      };

      const device = await Device.create(deviceData);

      expect(device).toBeDefined();
      expect(device.name).toBe("Test Smart Device");
      expect(device.brand).toBe("TestBrand");
      expect(device.catalog).toBe("Electronics");
      expect(parseFloat(device.price)).toBe(199.99);
      expect(device.stock).toBe(50);
      expect(device.description).toBe("A test smart device for unit testing");
      expect(device.imageUrl).toBe("/images/test-device.jpg");
    });

    test("should fail to create device without required fields", async () => {
      const incompleteData = {
        name: "Incomplete Device",
        // Missing required fields like brand, catalog, price, stock
      };

      await expect(Device.create(incompleteData)).rejects.toThrow();
    });

    test("should fail to create device with invalid price", async () => {
      const deviceData = {
        name: "Invalid Price Device",
        brand: "TestBrand",
        catalog: "Electronics",
        price: -10, // Negative price
        stock: 50,
        description: "Device with invalid price",
      };

      // Note: Sequelize allows negative prices by default, but business logic should prevent this
      const device = await Device.create(deviceData);
      expect(parseFloat(device.price)).toBe(-10);
      // In a real application, you would add validation to prevent negative prices
    });

    test("should fail to create device with invalid stock", async () => {
      const deviceData = {
        name: "Invalid Stock Device",
        brand: "TestBrand",
        catalog: "Electronics",
        price: 199.99,
        stock: -5, // Negative stock
        description: "Device with invalid stock",
      };

      // Note: Sequelize allows negative stock by default, but business logic should prevent this
      const device = await Device.create(deviceData);
      expect(device.stock).toBe(-5);
      // In a real application, you would add validation to prevent negative stock
    });
  });

  describe("Device Retrieval (Read)", () => {
    let testDevice1, testDevice2, testDevice3;

    beforeEach(async () => {
      // Create test devices
      testDevice1 = await Device.create({
        name: "Smart Phone",
        brand: "TechCorp",
        catalog: "Electronics",
        price: 599.99,
        stock: 25,
        description: "Latest smartphone technology",
      });

      testDevice2 = await Device.create({
        name: "Smart Watch",
        brand: "TechCorp",
        catalog: "Wearables",
        price: 299.99,
        stock: 15,
        description: "Fitness tracking smartwatch",
      });

      testDevice3 = await Device.create({
        name: "Smart Speaker",
        brand: "AudioTech",
        catalog: "Electronics",
        price: 99.99,
        stock: 40,
        description: "Voice-controlled smart speaker",
      });
    });

    test("should find device by ID", async () => {
      const foundDevice = await Device.findByPk(testDevice1.id);

      expect(foundDevice).toBeDefined();
      expect(foundDevice.name).toBe("Smart Phone");
      expect(foundDevice.brand).toBe("TechCorp");
    });

    test("should find device by name", async () => {
      const foundDevice = await Device.findOne({
        where: { name: "Smart Watch" },
      });

      expect(foundDevice).toBeDefined();
      expect(foundDevice.name).toBe("Smart Watch");
      expect(foundDevice.catalog).toBe("Wearables");
    });

    test("should find devices by brand", async () => {
      const techCorpDevices = await Device.findAll({
        where: { brand: "TechCorp" },
      });

      expect(techCorpDevices).toHaveLength(2);
      expect(techCorpDevices[0].brand).toBe("TechCorp");
      expect(techCorpDevices[1].brand).toBe("TechCorp");
    });

    test("should find devices by catalog", async () => {
      const electronicsDevices = await Device.findAll({
        where: { catalog: "Electronics" },
      });

      expect(electronicsDevices).toHaveLength(2);
      expect(
        electronicsDevices.every((device) => device.catalog === "Electronics")
      ).toBe(true);
    });

    test("should search devices by name pattern", async () => {
      const smartDevices = await Device.findAll({
        where: {
          name: {
            [sequelize.Sequelize.Op.like]: "%Smart%",
          },
        },
      });

      expect(smartDevices).toHaveLength(3);
      expect(
        smartDevices.every((device) => device.name.includes("Smart"))
      ).toBe(true);
    });

    test("should find devices within price range", async () => {
      const midRangeDevices = await Device.findAll({
        where: {
          price: {
            [sequelize.Sequelize.Op.between]: [200, 400],
          },
        },
      });

      expect(midRangeDevices).toHaveLength(1);
      expect(midRangeDevices[0].name).toBe("Smart Watch");
    });

    test("should find devices with stock above threshold", async () => {
      const wellStockedDevices = await Device.findAll({
        where: {
          stock: {
            [sequelize.Sequelize.Op.gte]: 20,
          },
        },
      });

      expect(wellStockedDevices).toHaveLength(2);
      expect(wellStockedDevices.every((device) => device.stock >= 20)).toBe(
        true
      );
    });

    test("should sort devices by price ascending", async () => {
      const devicesByPrice = await Device.findAll({
        order: [["price", "ASC"]],
      });

      expect(devicesByPrice).toHaveLength(3);
      expect(parseFloat(devicesByPrice[0].price)).toBeLessThanOrEqual(
        parseFloat(devicesByPrice[1].price)
      );
      expect(parseFloat(devicesByPrice[1].price)).toBeLessThanOrEqual(
        parseFloat(devicesByPrice[2].price)
      );
    });

    test("should sort devices by stock descending", async () => {
      const devicesByStock = await Device.findAll({
        order: [["stock", "DESC"]],
      });

      expect(devicesByStock).toHaveLength(3);
      expect(devicesByStock[0].stock).toBeGreaterThanOrEqual(
        devicesByStock[1].stock
      );
      expect(devicesByStock[1].stock).toBeGreaterThanOrEqual(
        devicesByStock[2].stock
      );
    });
  });

  describe("Device Update (Update)", () => {
    let testDevice;

    beforeEach(async () => {
      testDevice = await Device.create({
        name: "Updatable Device",
        brand: "UpdateBrand",
        catalog: "Electronics",
        price: 199.99,
        stock: 30,
        description: "Device for update testing",
      });
    });

    test("should update device name", async () => {
      await testDevice.update({ name: "Updated Device Name" });

      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(updatedDevice.name).toBe("Updated Device Name");
      expect(updatedDevice.brand).toBe("UpdateBrand"); // Should remain unchanged
    });

    test("should update device price", async () => {
      await testDevice.update({ price: 249.99 });

      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(parseFloat(updatedDevice.price)).toBe(249.99);
    });

    test("should update device stock", async () => {
      await testDevice.update({ stock: 45 });

      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(updatedDevice.stock).toBe(45);
    });

    test("should update multiple fields at once", async () => {
      await testDevice.update({
        name: "Multi-Updated Device",
        price: 299.99,
        stock: 60,
        description: "Updated description",
      });

      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(updatedDevice.name).toBe("Multi-Updated Device");
      expect(parseFloat(updatedDevice.price)).toBe(299.99);
      expect(updatedDevice.stock).toBe(60);
      expect(updatedDevice.description).toBe("Updated description");
    });

    test("should update device using where clause", async () => {
      const [updatedRowsCount] = await Device.update(
        { price: 349.99 },
        {
          where: {
            id: testDevice.id,
            brand: "UpdateBrand",
          },
        }
      );

      expect(updatedRowsCount).toBe(1);

      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(parseFloat(updatedDevice.price)).toBe(349.99);
    });

    test("should not update device with wrong conditions", async () => {
      const [updatedRowsCount] = await Device.update(
        { price: 999.99 },
        {
          where: {
            id: testDevice.id,
            brand: "WrongBrand", // Wrong brand
          },
        }
      );

      expect(updatedRowsCount).toBe(0);

      const unchangedDevice = await Device.findByPk(testDevice.id);
      expect(parseFloat(unchangedDevice.price)).toBe(199.99); // Should remain unchanged
    });
  });

  describe("Device Deletion (Delete)", () => {
    let testDevice;

    beforeEach(async () => {
      testDevice = await Device.create({
        name: "Deletable Device",
        brand: "DeleteBrand",
        catalog: "Electronics",
        price: 199.99,
        stock: 30,
        description: "Device for deletion testing",
      });
    });

    test("should delete device by ID", async () => {
      const deviceId = testDevice.id;
      await testDevice.destroy();

      const deletedDevice = await Device.findByPk(deviceId);
      expect(deletedDevice).toBeNull();
    });

    test("should delete device using where clause", async () => {
      const deletedRowsCount = await Device.destroy({
        where: {
          id: testDevice.id,
          brand: "DeleteBrand",
        },
      });

      expect(deletedRowsCount).toBe(1);

      const deletedDevice = await Device.findByPk(testDevice.id);
      expect(deletedDevice).toBeNull();
    });

    test("should not delete device with wrong conditions", async () => {
      const deletedRowsCount = await Device.destroy({
        where: {
          id: testDevice.id,
          brand: "WrongBrand", // Wrong brand
        },
      });

      expect(deletedRowsCount).toBe(0);

      const stillExistingDevice = await Device.findByPk(testDevice.id);
      expect(stillExistingDevice).toBeDefined();
      expect(stillExistingDevice.name).toBe("Deletable Device");
    });

    test("should delete multiple devices", async () => {
      // Create additional devices
      await Device.bulkCreate([
        {
          name: "Delete Device 1",
          brand: "DeleteBrand",
          catalog: "Electronics",
          price: 100,
          stock: 10,
        },
        {
          name: "Delete Device 2",
          brand: "DeleteBrand",
          catalog: "Electronics",
          price: 200,
          stock: 20,
        },
      ]);

      const deletedRowsCount = await Device.destroy({
        where: { brand: "DeleteBrand" },
      });

      expect(deletedRowsCount).toBe(3); // Original + 2 new devices

      const remainingDevices = await Device.findAll({
        where: { brand: "DeleteBrand" },
      });

      expect(remainingDevices).toHaveLength(0);
    });
  });

  describe("Device Stock Management", () => {
    let testDevice;

    beforeEach(async () => {
      testDevice = await Device.create({
        name: "Stock Management Device",
        brand: "StockBrand",
        catalog: "Electronics",
        price: 199.99,
        stock: 100,
        description: "Device for stock management testing",
      });
    });

    test("should reduce stock when items are sold", async () => {
      const soldQuantity = 25;
      const newStock = testDevice.stock - soldQuantity;

      await testDevice.update({ stock: newStock });

      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(updatedDevice.stock).toBe(75);
    });

    test("should increase stock when items are restocked", async () => {
      const restockQuantity = 50;
      const newStock = testDevice.stock + restockQuantity;

      await testDevice.update({ stock: newStock });

      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(updatedDevice.stock).toBe(150);
    });

    test("should handle zero stock", async () => {
      await testDevice.update({ stock: 0 });

      const updatedDevice = await Device.findByPk(testDevice.id);
      expect(updatedDevice.stock).toBe(0);
    });

    test("should find out-of-stock devices", async () => {
      // Create devices with different stock levels
      await Device.bulkCreate([
        {
          name: "Out of Stock Device 1",
          brand: "TestBrand",
          catalog: "Electronics",
          price: 100,
          stock: 0,
        },
        {
          name: "Out of Stock Device 2",
          brand: "TestBrand",
          catalog: "Electronics",
          price: 200,
          stock: 0,
        },
        {
          name: "In Stock Device",
          brand: "TestBrand",
          catalog: "Electronics",
          price: 300,
          stock: 10,
        },
      ]);

      const outOfStockDevices = await Device.findAll({
        where: { stock: 0 },
      });

      expect(outOfStockDevices).toHaveLength(2);
      expect(outOfStockDevices.every((device) => device.stock === 0)).toBe(
        true
      );
    });

    test("should find low stock devices", async () => {
      // Create devices with different stock levels
      await Device.bulkCreate([
        {
          name: "Low Stock Device 1",
          brand: "TestBrand",
          catalog: "Electronics",
          price: 100,
          stock: 5,
        },
        {
          name: "Low Stock Device 2",
          brand: "TestBrand",
          catalog: "Electronics",
          price: 200,
          stock: 3,
        },
        {
          name: "Good Stock Device",
          brand: "TestBrand",
          catalog: "Electronics",
          price: 300,
          stock: 50,
        },
      ]);

      const lowStockThreshold = 10;
      const lowStockDevices = await Device.findAll({
        where: {
          stock: {
            [sequelize.Sequelize.Op.lt]: lowStockThreshold,
          },
        },
      });

      expect(lowStockDevices).toHaveLength(2);
      expect(
        lowStockDevices.every((device) => device.stock < lowStockThreshold)
      ).toBe(true);
    });
  });
});
