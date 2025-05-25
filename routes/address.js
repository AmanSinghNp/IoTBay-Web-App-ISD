const express = require("express");
const router = express.Router();
const addressController = require("../controllers/addressController");

// GET all addresses (delivery page)
router.get("/delivery", addressController.getUserAddresses);

// GET add address form
router.get("/address/add", addressController.getAddAddressForm);

// POST add new address
router.post("/address/add", addressController.createAddress);

// GET edit address form
router.get("/address/edit/:id", addressController.getEditAddressForm);

// POST update address
router.post("/address/edit/:id", addressController.updateAddress);

// POST delete address
router.post("/address/delete/:id", addressController.deleteAddress);

module.exports = router;
