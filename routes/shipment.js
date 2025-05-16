const express = require("express");
const router = express.Router();
const Shipment = require("../models/shipment");
const Order = require("../models/order");
const Address = require("../models/address");

// Show create form with user addresses
router.get("/shipment/create", async (req, res) => {
  try {
    const addresses = await Address.findAll({ where: { userId: req.session.userId } });
    res.render("shipment_create", { addresses });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load addresses.");
  }
});

// Submit new shipment
router.post("/shipment/create", async (req, res) => {
  const { orderId, method, shipmentDate, addressId } = req.body;
  try {
    await Shipment.create({ orderId, method, shipmentDate, addressId });
    res.redirect("/shipment/view");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create shipment.");
  }
});

// View shipments (with optional search)
router.get("/shipment/view", async (req, res) => {
  const { shipmentId, shipmentDate } = req.query;
  const where = {};
  if (shipmentId) where.id = shipmentId;
  if (shipmentDate) where.shipmentDate = shipmentDate;

  try {
    const shipments = await Shipment.findAll({
      where,
      include: [Address, Order],
    });
    res.render("shipment_view", { shipments });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to fetch shipments.");
  }
});

// Show edit form
router.get("/shipment/edit/:id", async (req, res) => {
  try {
    const shipment = await Shipment.findByPk(req.params.id);
    const addresses = await Address.findAll({ where: { userId: req.session.userId } });

    if (!shipment || shipment.finalised) {
      return res.status(403).send("Cannot edit this shipment.");
    }

    res.render("shipment_edit", { shipment, addresses });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load shipment.");
  }
});

// Submit edit
router.post("/shipment/edit/:id", async (req, res) => {
  const { method, shipmentDate, addressId } = req.body;
  try {
    const shipment = await Shipment.findByPk(req.params.id);
    if (!shipment || shipment.finalised) {
      return res.status(403).send("Cannot update this shipment.");
    }

    await shipment.update({ method, shipmentDate, addressId });
    res.redirect("/shipment/view");
  } catch (err) {
    console.error(err);
    res.status(500).send("Update failed.");
  }
});

// Delete shipment
router.post("/shipment/delete/:id", async (req, res) => {
  try {
    const shipment = await Shipment.findByPk(req.params.id);
    if (!shipment || shipment.finalised) {
      return res.status(403).send("Cannot delete this shipment.");
    }

    await shipment.destroy();
    res.redirect("/shipment/view");
  } catch (err) {
    console.error(err);
    res.status(500).send("Delete failed.");
  }
});

module.exports = router;
