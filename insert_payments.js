// insert_payments.js - Script to manually insert payment records
const Payment = require("./models/payment");

// Sample payment data
const samplePayments = [
  {
    payment_method: "Credit Card",
    card_number: "4111-1111-1111-1111",
    expiry_date: "12/26",
    cvv: "123",
    amount: 299.99,
    payment_date: "2025-05-20",
    order_id: 1,
    user_id: 2,
  },
  {
    payment_method: "Debit Card",
    card_number: "5555-5555-5555-4444",
    expiry_date: "03/27",
    cvv: "456",
    amount: 149.5,
    payment_date: "2025-05-15",
    order_id: 2,
    user_id: 2,
  },
  {
    payment_method: "PayPal",
    card_number: "3782-8224-6310-005",
    expiry_date: "09/28",
    cvv: "789",
    amount: 599.0,
    payment_date: "2025-05-10",
    order_id: 3,
    user_id: 2,
  },
  {
    payment_method: "Credit Card",
    card_number: "4111-1111-1111-1111",
    expiry_date: "12/26",
    cvv: "321",
    amount: 89.99,
    payment_date: "2025-05-05",
    order_id: 4,
    user_id: 2,
  },
  {
    payment_method: "Debit Card",
    card_number: "5555-5555-5555-4444",
    expiry_date: "05/29",
    cvv: "654",
    amount: 1299.99,
    payment_date: "2025-04-30",
    order_id: 5,
    user_id: 2,
  },
];

// Insert payments one by one
let inserted = 0;
let total = samplePayments.length;

console.log(`Inserting ${total} payment records...`);

samplePayments.forEach((payment, index) => {
  Payment.create(payment, (err, result) => {
    if (err) {
      console.error(`Error inserting payment ${index + 1}:`, err);
    } else {
      console.log(`✅ Payment ${index + 1} inserted with ID: ${result.id}`);
    }

    inserted++;
    if (inserted === total) {
      console.log(`\n✅ All ${total} payment records inserted successfully!`);
      console.log(
        "You can now test the payment history at http://localhost:3000/payments/history"
      );
      process.exit(0);
    }
  });
});
