// Unit tests for Device model validation and behavior

const { DataTypes } = require("sequelize");
const sequelize = require("../../config/database");
const Device = require("../../models/device");

describe("Device Model", () => {
  // Set up test database
  beforeAll(async () => {
    // Connect to test database and sync model
    await sequelize.sync({ force: true });
  });

  // Clear database before each test
  beforeEach(async () => {
    // Clear database before each test
    await Device.destroy({ where: {} });
  });

  // Test creating a device with all valid fields
  it("should create a valid device", async () => {
    const validDevice = {
      name: "iPhone 14 Pro",
      brand: "Apple",
      catalog: "Electronics",
      price: 1199.0,
      stock: 50,
      description: "Latest iPhone model",
      imageUrl: "/images/iphone14pro.jpg",
    };

    const device = await Device.create(validDevice);
    expect(device.name).toBe(validDevice.name);
    expect(device.brand).toBe(validDevice.brand);
    expect(device.catalog).toBe(validDevice.catalog);
    expect(device.price).toBe(validDevice.price);
    expect(device.stock).toBe(validDevice.stock);
    expect(device.description).toBe(validDevice.description);
    expect(device.imageUrl).toBe(validDevice.imageUrl);
  });

  // Test validation of required fields
  it("should not create a device without required fields", async () => {
    const invalidDevice = {
      description: "Missing required fields",
    };

    await expect(Device.create(invalidDevice)).rejects.toThrow();
  });

  // Test default catalog value
  it("should create a device with default catalog value", async () => {
    const deviceWithoutCatalog = {
      name: "Test Device",
      brand: "Test Brand",
      price: 99.99,
      stock: 10,
    };

    const device = await Device.create(deviceWithoutCatalog);
    expect(device.catalog).toBe("uncategorized");
  });

  // Test default stock value
  it("should create a device with default stock value", async () => {
    const deviceWithoutStock = {
      name: "Test Device",
      brand: "Test Brand",
      price: 99.99,
      catalog: "Electronics",
    };

    const device = await Device.create(deviceWithoutStock);
    expect(device.stock).toBe(0);
  });

  // Test updating stock quantity
  it("should update device stock", async () => {
    const device = await Device.create({
      name: "Test Device",
      brand: "Test Brand",
      price: 99.99,
      stock: 10,
      catalog: "Electronics",
    });

    const newStock = 20;
    await device.update({ stock: newStock });
    expect(device.stock).toBe(newStock);
  });

  // Test validation of negative stock
  it("should not create a device with negative stock", async () => {
    const deviceWithNegativeStock = {
      name: "Test Device",
      brand: "Test Brand",
      price: 99.99,
      stock: -1,
      catalog: "Electronics",
    };

    await expect(Device.create(deviceWithNegativeStock)).rejects.toThrow();
  });

  // Test validation of negative price
  it("should not create a device with negative price", async () => {
    const deviceWithNegativePrice = {
      name: "Test Device",
      brand: "Test Brand",
      price: -99.99,
      stock: 10,
      catalog: "Electronics",
    };

    await expect(Device.create(deviceWithNegativePrice)).rejects.toThrow();
  });
});
