const Address = require("../models/address");
const { Op } = require("sequelize");

// Validation helper functions
const validateLabel = (label) => {
  if (!label || !label.trim())
    return { valid: false, message: "Address label is required." };
  if (label.trim().length < 2)
    return {
      valid: false,
      message: "Address label must be at least 2 characters long.",
    };
  if (label.trim().length > 50)
    return {
      valid: false,
      message: "Address label must be less than 50 characters.",
    };
  return { valid: true };
};

const validateStreet = (street) => {
  if (!street || !street.trim())
    return { valid: false, message: "Street address is required." };
  if (street.trim().length < 5)
    return {
      valid: false,
      message: "Street address must be at least 5 characters long.",
    };
  if (street.trim().length > 200)
    return {
      valid: false,
      message: "Street address must be less than 200 characters.",
    };
  return { valid: true };
};

const validateCity = (city) => {
  if (!city || !city.trim())
    return { valid: false, message: "City is required." };
  if (city.trim().length < 2)
    return {
      valid: false,
      message: "City must be at least 2 characters long.",
    };
  if (city.trim().length > 100)
    return { valid: false, message: "City must be less than 100 characters." };
  // Check for valid city name (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(city.trim())) {
    return {
      valid: false,
      message:
        "City name can only contain letters, spaces, hyphens, and apostrophes.",
    };
  }
  return { valid: true };
};

const validatePostcode = (postcode) => {
  if (!postcode || !postcode.trim())
    return { valid: false, message: "Postcode is required." };
  const cleanPostcode = postcode.trim().replace(/\s/g, "");
  if (cleanPostcode.length < 3)
    return {
      valid: false,
      message: "Postcode must be at least 3 characters long.",
    };
  if (cleanPostcode.length > 10)
    return {
      valid: false,
      message: "Postcode must be less than 10 characters.",
    };
  // Basic postcode validation (alphanumeric)
  if (!/^[a-zA-Z0-9]+$/.test(cleanPostcode)) {
    return {
      valid: false,
      message: "Postcode can only contain letters and numbers.",
    };
  }
  return { valid: true };
};

const validateCountry = (country) => {
  if (!country || !country.trim())
    return { valid: false, message: "Country is required." };
  if (country.trim().length < 2)
    return {
      valid: false,
      message: "Country must be at least 2 characters long.",
    };
  if (country.trim().length > 100)
    return {
      valid: false,
      message: "Country must be less than 100 characters.",
    };
  // Check for valid country name (letters, spaces, hyphens)
  if (!/^[a-zA-Z\s\-]+$/.test(country.trim())) {
    return {
      valid: false,
      message: "Country name can only contain letters, spaces, and hyphens.",
    };
  }
  return { valid: true };
};

// Get all addresses for the current user
exports.getUserAddresses = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const addresses = await Address.findAll({
      where: { userId: req.session.userId },
      order: [["createdAt", "DESC"]],
    });

    res.render("delivery", {
      addresses,
      successMessage: req.session.successMessage || null,
      errorMessage: req.session.errorMessage || null,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).send("Failed to load addresses.");
  } finally {
    req.session.successMessage = null;
    req.session.errorMessage = null;
  }
};

// Show add address form
exports.getAddAddressForm = (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  res.render("address_add", {
    errors: null,
    formData: {},
  });
};

// Create new address
exports.createAddress = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const { label, street, city, postcode, country } = req.body;

  // Comprehensive server-side validation
  const errors = [];

  // Label validation
  const labelValidation = validateLabel(label);
  if (!labelValidation.valid) {
    errors.push(labelValidation.message);
  }

  // Street validation
  const streetValidation = validateStreet(street);
  if (!streetValidation.valid) {
    errors.push(streetValidation.message);
  }

  // City validation
  const cityValidation = validateCity(city);
  if (!cityValidation.valid) {
    errors.push(cityValidation.message);
  }

  // Postcode validation
  const postcodeValidation = validatePostcode(postcode);
  if (!postcodeValidation.valid) {
    errors.push(postcodeValidation.message);
  }

  // Country validation
  const countryValidation = validateCountry(country);
  if (!countryValidation.valid) {
    errors.push(countryValidation.message);
  }

  if (errors.length > 0) {
    return res.render("address_add", {
      errors: errors,
      formData: { label, street, city, postcode, country },
    });
  }

  try {
    // Check if user already has an address with the same label
    const existingAddress = await Address.findOne({
      where: {
        userId: req.session.userId,
        label: label.trim(),
      },
    });

    if (existingAddress) {
      return res.render("address_add", {
        errors: ["You already have an address with this label."],
        formData: { label, street, city, postcode, country },
      });
    }

    await Address.create({
      userId: req.session.userId,
      label: label.trim(),
      street: street.trim(),
      city: city.trim(),
      postcode: postcode.trim().replace(/\s/g, ""), // Remove spaces from postcode
      country: country.trim(),
    });

    req.session.successMessage = "Address added successfully!";
    res.redirect("/delivery");
  } catch (error) {
    console.error("Error creating address:", error);
    res.render("address_add", {
      errors: ["Failed to add address. Please try again."],
      formData: { label, street, city, postcode, country },
    });
  }
};

// Show edit address form
exports.getEditAddressForm = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const address = await Address.findOne({
      where: {
        id: req.params.id,
        userId: req.session.userId, // Ensure user owns the address
      },
    });

    if (!address) {
      req.session.errorMessage = "Address not found or unauthorized access.";
      return res.redirect("/delivery");
    }

    res.render("address_edit", {
      address,
      errors: null,
    });
  } catch (error) {
    console.error("Error loading address:", error);
    req.session.errorMessage = "Failed to load address.";
    res.redirect("/delivery");
  }
};

// Update address
exports.updateAddress = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  const { label, street, city, postcode, country } = req.body;
  const addressId = req.params.id;

  // Comprehensive server-side validation
  const errors = [];

  // Label validation
  const labelValidation = validateLabel(label);
  if (!labelValidation.valid) {
    errors.push(labelValidation.message);
  }

  // Street validation
  const streetValidation = validateStreet(street);
  if (!streetValidation.valid) {
    errors.push(streetValidation.message);
  }

  // City validation
  const cityValidation = validateCity(city);
  if (!cityValidation.valid) {
    errors.push(cityValidation.message);
  }

  // Postcode validation
  const postcodeValidation = validatePostcode(postcode);
  if (!postcodeValidation.valid) {
    errors.push(postcodeValidation.message);
  }

  // Country validation
  const countryValidation = validateCountry(country);
  if (!countryValidation.valid) {
    errors.push(countryValidation.message);
  }

  try {
    const address = await Address.findOne({
      where: {
        id: addressId,
        userId: req.session.userId,
      },
    });

    if (!address) {
      req.session.errorMessage = "Address not found or unauthorized access.";
      return res.redirect("/delivery");
    }

    if (errors.length > 0) {
      return res.render("address_edit", {
        address: {
          ...address.dataValues,
          label,
          street,
          city,
          postcode,
          country,
        },
        errors: errors,
      });
    }

    // Check if user already has another address with the same label
    const existingAddress = await Address.findOne({
      where: {
        userId: req.session.userId,
        label: label.trim(),
        id: { [Op.ne]: addressId }, // Exclude current address
      },
    });

    if (existingAddress) {
      return res.render("address_edit", {
        address: {
          ...address.dataValues,
          label,
          street,
          city,
          postcode,
          country,
        },
        errors: ["You already have another address with this label."],
      });
    }

    await address.update({
      label: label.trim(),
      street: street.trim(),
      city: city.trim(),
      postcode: postcode.trim().replace(/\s/g, ""), // Remove spaces from postcode
      country: country.trim(),
    });

    req.session.successMessage = "Address updated successfully!";
    res.redirect("/delivery");
  } catch (error) {
    console.error("Error updating address:", error);
    try {
      const address = await Address.findByPk(addressId);
      return res.render("address_edit", {
        address: {
          ...address.dataValues,
          label,
          street,
          city,
          postcode,
          country,
        },
        errors: ["Failed to update address. Please try again."],
      });
    } catch (loadErr) {
      console.error("Error loading address after update failure:", loadErr);
      req.session.errorMessage = "Failed to update address.";
      res.redirect("/delivery");
    }
  }
};

// Delete address
exports.deleteAddress = async (req, res) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }

  try {
    const address = await Address.findOne({
      where: {
        id: req.params.id,
        userId: req.session.userId,
      },
    });

    if (!address) {
      req.session.errorMessage = "Address not found or unauthorized access.";
      return res.redirect("/delivery");
    }

    await address.destroy();
    req.session.successMessage = "Address deleted successfully!";
    res.redirect("/delivery");
  } catch (error) {
    console.error("Error deleting address:", error);
    req.session.errorMessage = "Failed to delete address.";
    res.redirect("/delivery");
  }
};
