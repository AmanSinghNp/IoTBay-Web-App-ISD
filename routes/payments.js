const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.get("/payments", paymentController.getMyPayments);
router.get("/payments/new", paymentController.getNewPaymentForm);
router.post("/payments/new", paymentController.postNewPayment);

// NEW ROUTES
router.get("/payments/edit/:id", paymentController.getEditPaymentForm);
router.post("/payments/edit/:id", paymentController.postEditPayment);
router.post("/payments/delete/:id", paymentController.deletePayment);

module.exports = router;
