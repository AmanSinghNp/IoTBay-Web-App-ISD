const express = require("express");
const router = express.Router();
const shipmentController = require("../controllers/shipmentController");
const { isLoggedIn } = require("../middleware/authMiddleware");

// View all shipments for customer (with search)
router.get("/shipments", isLoggedIn, shipmentController.viewShipments);

// Show create shipment form
router.get(
  "/shipments/create",
  isLoggedIn,
  shipmentController.getCreateShipment
);

// Create new shipment
router.post("/shipments/create", isLoggedIn, shipmentController.createShipment);

// View shipment details
router.get(
  "/shipments/:id/details",
  isLoggedIn,
  shipmentController.getShipmentDetails
);

// Show edit shipment form
router.get(
  "/shipments/:id/edit",
  isLoggedIn,
  shipmentController.getEditShipment
);

// Update shipment
router.post(
  "/shipments/:id/edit",
  isLoggedIn,
  shipmentController.updateShipment
);

// Delete shipment
router.post(
  "/shipments/:id/delete",
  isLoggedIn,
  shipmentController.deleteShipment
);

// Finalize shipment
router.post(
  "/shipments/:id/finalize",
  isLoggedIn,
  shipmentController.finalizeShipment
);

// Legacy routes for backward compatibility
router.get("/shipment/view", (req, res) => res.redirect("/shipments"));
router.get("/shipment/create", (req, res) => res.redirect("/shipments/create"));

module.exports = router;
