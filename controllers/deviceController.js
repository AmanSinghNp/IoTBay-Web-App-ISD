const { Op } = require("sequelize");
const Device = require("../models/device");

// Validation helper functions
const validateDeviceName = (name) => {
  if (!name || !name.trim())
    return { valid: false, message: "Device name is required." };
  if (name.trim().length < 2)
    return {
      valid: false,
      message: "Device name must be at least 2 characters long.",
    };
  if (name.trim().length > 100)
    return {
      valid: false,
      message: "Device name must be less than 100 characters.",
    };
  return { valid: true };
};

const validateBrand = (brand) => {
  if (!brand || !brand.trim())
    return { valid: false, message: "Brand is required." };
  if (brand.trim().length < 2)
    return {
      valid: false,
      message: "Brand must be at least 2 characters long.",
    };
  if (brand.trim().length > 50)
    return { valid: false, message: "Brand must be less than 50 characters." };
  return { valid: true };
};

const validateCatalog = (catalog) => {
  if (!catalog || !catalog.trim())
    return { valid: false, message: "Catalog is required." };
  if (catalog.trim().length > 50)
    return {
      valid: false,
      message: "Catalog must be less than 50 characters.",
    };
  return { valid: true };
};

const validatePrice = (price) => {
  if (!price && price !== 0)
    return { valid: false, message: "Price is required." };

  const numPrice = parseFloat(price);
  if (isNaN(numPrice))
    return { valid: false, message: "Price must be a valid number." };
  if (numPrice < 0)
    return { valid: false, message: "Price cannot be negative." };
  if (numPrice > 999999.99)
    return { valid: false, message: "Price is too large." };

  // Check for reasonable decimal places (max 2)
  const decimalPlaces = (price.toString().split(".")[1] || "").length;
  if (decimalPlaces > 2)
    return {
      valid: false,
      message: "Price can have at most 2 decimal places.",
    };

  return { valid: true };
};

const validateStock = (stock) => {
  if (!stock && stock !== 0)
    return { valid: false, message: "Stock is required." };

  const numStock = parseInt(stock);
  if (isNaN(numStock))
    return { valid: false, message: "Stock must be a valid number." };
  if (numStock < 0)
    return { valid: false, message: "Stock cannot be negative." };
  if (numStock > 999999)
    return { valid: false, message: "Stock quantity is too large." };
  if (!Number.isInteger(parseFloat(stock)))
    return { valid: false, message: "Stock must be a whole number." };

  return { valid: true };
};

const validateDescription = (description) => {
  if (description && description.length > 1000) {
    return {
      valid: false,
      message: "Description must be less than 1000 characters.",
    };
  }
  return { valid: true };
};

const validateImageUrl = (imageUrl) => {
  if (!imageUrl) return { valid: true }; // Image URL is optional

  // Basic URL validation
  try {
    new URL(imageUrl);
  } catch {
    return { valid: false, message: "Please enter a valid image URL." };
  }

  // Check for common image extensions
  const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  const hasValidExtension = imageExtensions.some((ext) =>
    imageUrl.toLowerCase().includes(ext)
  );

  if (!hasValidExtension) {
    return {
      valid: false,
      message:
        "Image URL should point to a valid image file (jpg, png, gif, etc.).",
    };
  }

  return { valid: true };
};

// Show all devices (browse page)
exports.getAllDevices = async (req, res) => {
  const { search, catalog, sort } = req.query;

  const where = {};
  const order = [];

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } },
    ];
  }

  if (catalog && catalog !== "All") {
    where.catalog = catalog;
  }

  if (sort === "price-asc") {
    order.push(["price", "ASC"]);
  } else if (sort === "price-desc") {
    order.push(["price", "DESC"]);
  } else if (sort === "stock-desc") {
    order.push(["stock", "DESC"]);
  } else if (sort === "brand-asc") {
    order.push(["brand", "ASC"], ["name", "ASC"]);
  } else {
    order.push(["name", "ASC"]);
  }

  try {
    const devices = await Device.findAll({ where, order });

    const catalogs = await Device.findAll({
      attributes: ["catalog"],
      group: ["catalog"],
    });

    const catalogOptions = catalogs.map((device) => device.catalog);

    res.render("devices", {
      devices,
      userRole: req.session.userRole,
      filters: { search, catalog, sort },
      catalogOptions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch filtered devices.");
  }
};

// Show form to add a new device (staff only)
exports.getAddDeviceForm = (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  res.render("devices_form");
};

// Handle new device form submission (staff only)
exports.postAddDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const { name, brand, catalog, price, stock, description, imageUrl } =
    req.body;

  // Comprehensive server-side validation
  const errors = [];

  // Name validation
  const nameValidation = validateDeviceName(name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.message);
  }

  // Brand validation
  const brandValidation = validateBrand(brand);
  if (!brandValidation.valid) {
    errors.push(brandValidation.message);
  }

  // Catalog validation
  const catalogValidation = validateCatalog(catalog);
  if (!catalogValidation.valid) {
    errors.push(catalogValidation.message);
  }

  // Price validation
  const priceValidation = validatePrice(price);
  if (!priceValidation.valid) {
    errors.push(priceValidation.message);
  }

  // Stock validation
  const stockValidation = validateStock(stock);
  if (!stockValidation.valid) {
    errors.push(stockValidation.message);
  }

  // Description validation
  const descriptionValidation = validateDescription(description);
  if (!descriptionValidation.valid) {
    errors.push(descriptionValidation.message);
  }

  // Image URL validation
  const imageUrlValidation = validateImageUrl(imageUrl);
  if (!imageUrlValidation.valid) {
    errors.push(imageUrlValidation.message);
  }

  if (errors.length > 0) {
    return res.render("devices_form", {
      errors: errors,
      formData: { name, brand, catalog, price, stock, description, imageUrl },
    });
  }

  try {
    // Check if device with same name and brand already exists
    const existingDevice = await Device.findOne({
      where: {
        name: name.trim(),
        brand: brand.trim(),
      },
    });

    if (existingDevice) {
      return res.render("devices_form", {
        errors: ["A device with this name and brand already exists."],
        formData: { name, brand, catalog, price, stock, description, imageUrl },
      });
    }

    await Device.create({
      name: name.trim(),
      brand: brand.trim(),
      catalog: catalog.trim(),
      price: parseFloat(price),
      stock: parseInt(stock),
      description: description ? description.trim() : null,
      imageUrl: imageUrl ? imageUrl.trim() : null,
    });

    res.redirect("/devices?success=Device created successfully");
  } catch (err) {
    console.error("Error creating device:", err);
    res.render("devices_form", {
      errors: ["Failed to create device. Please try again."],
      formData: { name, brand, catalog, price, stock, description, imageUrl },
    });
  }
};

// View a single device by ID
exports.viewDeviceDetails = async (req, res) => {
  const deviceId = req.params.id;

  try {
    const device = await Device.findByPk(deviceId);

    if (!device) {
      return res.status(404).render("404", { message: "Device not found" });
    }

    res.render("device_details", { device });
  } catch (err) {
    console.error("Failed to fetch device:", err);
    res.status(500).send("Failed to load device details.");
  }
};

// Get the edit form
exports.getEditDeviceForm = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const deviceId = req.params.id;

  try {
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).send("Device not found.");
    }

    res.render("edit_device", { device });
  } catch (err) {
    console.error("Error loading edit form:", err);
    res.status(500).send("Failed to load device for editing.");
  }
};

// Handle the update
exports.updateDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const deviceId = req.params.id;
  const { name, brand, catalog, price, stock, description, imageUrl } =
    req.body;

  // Comprehensive server-side validation
  const errors = [];

  // Name validation
  const nameValidation = validateDeviceName(name);
  if (!nameValidation.valid) {
    errors.push(nameValidation.message);
  }

  // Brand validation
  const brandValidation = validateBrand(brand);
  if (!brandValidation.valid) {
    errors.push(brandValidation.message);
  }

  // Catalog validation
  const catalogValidation = validateCatalog(catalog);
  if (!catalogValidation.valid) {
    errors.push(catalogValidation.message);
  }

  // Price validation
  const priceValidation = validatePrice(price);
  if (!priceValidation.valid) {
    errors.push(priceValidation.message);
  }

  // Stock validation
  const stockValidation = validateStock(stock);
  if (!stockValidation.valid) {
    errors.push(stockValidation.message);
  }

  // Description validation
  const descriptionValidation = validateDescription(description);
  if (!descriptionValidation.valid) {
    errors.push(descriptionValidation.message);
  }

  // Image URL validation
  const imageUrlValidation = validateImageUrl(imageUrl);
  if (!imageUrlValidation.valid) {
    errors.push(imageUrlValidation.message);
  }

  if (errors.length > 0) {
    try {
      const device = await Device.findByPk(deviceId);
      return res.render("edit_device", {
        device: {
          ...device.dataValues,
          name,
          brand,
          catalog,
          price,
          stock,
          description,
          imageUrl,
        },
        errors: errors,
      });
    } catch (err) {
      console.error("Error loading device for validation:", err);
      return res.status(500).send("Failed to load device for editing.");
    }
  }

  try {
    const device = await Device.findByPk(deviceId);
    if (!device) return res.status(404).send("Device not found.");

    // Check if another device with same name and brand already exists (excluding current device)
    const existingDevice = await Device.findOne({
      where: {
        name: name.trim(),
        brand: brand.trim(),
        id: { [Op.ne]: deviceId },
      },
    });

    if (existingDevice) {
      return res.render("edit_device", {
        device: {
          ...device.dataValues,
          name,
          brand,
          catalog,
          price,
          stock,
          description,
          imageUrl,
        },
        errors: ["A device with this name and brand already exists."],
      });
    }

    await device.update({
      name: name.trim(),
      brand: brand.trim(),
      catalog: catalog.trim(),
      price: parseFloat(price),
      stock: parseInt(stock),
      description: description ? description.trim() : null,
      imageUrl: imageUrl ? imageUrl.trim() : null,
    });

    res.redirect("/devices?success=Device updated successfully");
  } catch (err) {
    console.error("Update failed:", err);
    try {
      const device = await Device.findByPk(deviceId);
      return res.render("edit_device", {
        device: {
          ...device.dataValues,
          name,
          brand,
          catalog,
          price,
          stock,
          description,
          imageUrl,
        },
        errors: ["Failed to update device. Please try again."],
      });
    } catch (loadErr) {
      console.error("Error loading device after update failure:", loadErr);
      return res.status(500).send("Failed to update device.");
    }
  }
};

// Delete devices
exports.deleteDevice = async (req, res) => {
  if (!req.session.userId || req.session.userRole !== "staff") {
    return res.status(403).send("Access denied.");
  }

  const deviceId = req.params.id;

  try {
    const device = await Device.findByPk(deviceId);
    if (!device) {
      return res.status(404).send("Device not found.");
    }

    await device.destroy();
    res.redirect("/devices");
  } catch (err) {
    console.error("Failed to delete device:", err);
    res.status(500).send("Error deleting device.");
  }
};
