const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");

// GET /devices/new - Display form to add a new device (staff only)
router.get("/devices/new", deviceController.getAddDeviceForm);

// POST /devices/new - Handle form submission to add a new device (staff only)
router.post("/devices/new", deviceController.postAddDevice);

// GET /devices - Display a list of all devices (with search, filter, and sort support)
router.get("/devices", deviceController.getAllDevices);

// GET /devices/:id - View details for a single device by ID
router.get("/devices/:id", deviceController.viewDeviceDetails);

// GET /devices/edit/:id - Display edit form for an existing device (staff only)
router.get("/devices/edit/:id", deviceController.getEditDeviceForm);

// POST /devices/edit/:id - Handle update submission for an existing device (staff only)
router.post("/devices/edit/:id", deviceController.updateDevice);

// POST /devices/delete/:id - Delete a device by ID (staff only)
router.post("/devices/delete/:id", deviceController.deleteDevice);

module.exports = router;
