const Cart = require("../models/cart");
const Device = require("../models/device");
const Order = require("../models/order");
const OrderItem = require("../models/orderItem");

// GET /payments - Show checkout page with cart items
exports.getCheckoutPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.redirect("/login?redirectTo=/payments");
    }

    // Load this user's cart items and include the Device model
    const cartItems = await Cart.findAll({
      where: { userId },
      include: Device,
    });

    // Render the payments.ejs view (checkout page), supplying cartItems
    res.render("payments", { cartItems });
  } catch (err) {
    console.error("Checkout page error:", err);
    res.status(500).send("Error loading checkout page");
  }
};

// POST /payments/new - Process checkout and create order
exports.processCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect("/login");

    // Get all cart items for the user
    const cartItems = await Cart.findAll({
      where: { userId },
      include: Device,
    });
    if (!cartItems.length) return res.redirect("/cart");

    // Create a new order
    const order = await Order.create({ userId });

    // Create order items for each cart item
    for (const item of cartItems) {
      await OrderItem.create({
        orderId: order.id,
        deviceId: item.deviceId,
        quantity: item.quantity,
        price: item.Device.price,
      });
    }

    // Clear the cart
    await Cart.destroy({ where: { userId } });

    // Redirect to order details page
    res.redirect(`/orders/view/${order.id}`);
  } catch (err) {
    console.error("Checkout processing error:", err);
    req.flash("error", "Checkout failed. Please try again.");
    res.redirect("/payments");
  }
};
