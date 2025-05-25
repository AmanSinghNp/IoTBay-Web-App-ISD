const Shipment = require("../models/shipment");
const Order = require("../models/order");
const Address = require("../models/address");
const { logShipmentCreated } = require("./orderLogger");

/**
 * Automatically create a shipment for an order after payment confirmation
 * @param {number} orderId - The order ID
 * @param {number} userId - The user ID
 * @param {object} req - Express request object
 * @returns {Promise<object>} - Created shipment or null if failed
 */
const autoCreateShipment = async (orderId, userId, req = null) => {
  try {
    // Check if shipment already exists
    const existingShipment = await Shipment.findOne({
      where: { orderId: orderId },
    });

    if (existingShipment) {
      console.log(`📦 Shipment already exists for Order #${orderId}`);
      return existingShipment;
    }

    // Get the order to verify it exists and belongs to the user
    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: userId,
        status: "Placed",
      },
    });

    if (!order) {
      console.log(
        `❌ Order #${orderId} not found or not eligible for shipment`
      );
      return null;
    }

    // Get user's primary address (first address or create a default one)
    let address = await Address.findOne({
      where: { userId: userId },
      order: [["createdAt", "ASC"]], // Get the oldest/first address
    });

    if (!address) {
      // Create a default address if none exists
      address = await Address.create({
        userId: userId,
        label: "Default Shipping Address",
        street: "Address to be updated",
        city: "City",
        postcode: "0000",
        country: "Australia",
      });
      console.log(`📍 Created default address for User #${userId}`);
    }

    // Calculate shipment date (next business day)
    const shipmentDate = new Date();
    shipmentDate.setDate(shipmentDate.getDate() + 1);

    // Skip weekends
    if (shipmentDate.getDay() === 0) {
      // Sunday
      shipmentDate.setDate(shipmentDate.getDate() + 1);
    } else if (shipmentDate.getDay() === 6) {
      // Saturday
      shipmentDate.setDate(shipmentDate.getDate() + 2);
    }

    // Create the shipment
    const shipment = await Shipment.create({
      orderId: orderId,
      method: "standard", // Default to standard shipping
      shipmentDate: shipmentDate.toISOString().split("T")[0], // YYYY-MM-DD format
      addressId: address.id,
      finalised: false,
    });

    // Log the shipment creation
    await logShipmentCreated(
      orderId,
      userId,
      {
        shipmentId: shipment.id,
        method: "standard",
        shipmentDate: shipment.shipmentDate,
        addressId: address.id,
        autoCreated: true,
      },
      req
    );

    console.log(
      `📦 Auto-created shipment #${shipment.id} for Order #${orderId}`
    );
    return shipment;
  } catch (error) {
    console.error(
      `❌ Failed to auto-create shipment for Order #${orderId}:`,
      error
    );
    return null;
  }
};

/**
 * Update order status to "Confirmed" after payment and shipment creation
 * @param {number} orderId - The order ID
 * @returns {Promise<boolean>} - Success status
 */
const confirmOrder = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId);
    if (order && order.status === "Placed") {
      await order.update({ status: "Confirmed" });
      console.log(`✅ Order #${orderId} status updated to Confirmed`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Failed to confirm Order #${orderId}:`, error);
    return false;
  }
};

/**
 * Complete payment processing workflow:
 * 1. Log payment confirmation
 * 2. Auto-create shipment
 * 3. Update order status
 * @param {number} orderId - The order ID
 * @param {number} userId - The user ID
 * @param {object} paymentDetails - Payment details for logging
 * @param {object} req - Express request object
 */
const completePaymentWorkflow = async (
  orderId,
  userId,
  paymentDetails,
  req = null
) => {
  try {
    console.log(`🔄 Starting payment workflow for Order #${orderId}`);

    // Step 1: Auto-create shipment
    const shipment = await autoCreateShipment(orderId, userId, req);

    // Step 2: Confirm the order
    const orderConfirmed = await confirmOrder(orderId);

    console.log(`✅ Payment workflow completed for Order #${orderId}`);

    return {
      success: true,
      shipment: shipment,
      orderConfirmed: orderConfirmed,
    };
  } catch (error) {
    console.error(`❌ Payment workflow failed for Order #${orderId}:`, error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  autoCreateShipment,
  confirmOrder,
  completePaymentWorkflow,
};
