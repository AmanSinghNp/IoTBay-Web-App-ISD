const express = require("express");
const router = express.Router();
const Address = require("../models/address");

// ADD Address
router.post("/address/add", async (req, res) => {
  const { userId, label, street, city, postcode, country } = req.body;

  try {
    await Address.create({ userId, label, street, city, postcode, country });
    res.redirect("/delivery");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to add address.");
  }
});

// DELETE Address
router.post("/address/delete/:id", async (req, res) => {
  try {
    await Address.destroy({ where: { id: req.params.id } });
    res.redirect("/delivery");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete address.");
  }
});

// EDIT FORM
router.get("/address/edit/:id", async (req, res) => {
  try {
    const address = await Address.findByPk(req.params.id);
    if (!address) return res.status(404).send("Address not found.");
    res.render("address_edit", { address });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load address.");
  }
});

// SUBMIT EDIT
router.post("/address/edit/:id", async (req, res) => {
  const { label, street, city, postcode, country } = req.body;

  try {
    const address = await Address.findByPk(req.params.id);
    if (!address) return res.status(404).send("Address not found.");

    await address.update({ label, street, city, postcode, country });
    res.redirect("/delivery");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update address.");
  }
});

module.exports = router;
