const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the SQLite database.");
});

db.serialize(() => {
  db.run(
    `
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_method TEXT NOT NULL,
      card_number TEXT NOT NULL, 
      expiry_date TEXT NOT NULL,
      cvv TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT NOT NULL,
      order_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `,
    (err) => {
      if (err) {
        console.error("Error creating payments table:", err.message);
      } else {
        console.log("Payments table created or already exists.");
      }
    }
  );
});

module.exports = {
  create: (data, callback) => {
    const {
      payment_method,
      card_number,
      expiry_date,
      cvv,
      amount,
      payment_date,
      order_id,
      user_id,
    } = data;
    const sql =
      "INSERT INTO payments (payment_method, card_number, expiry_date, cvv, amount, payment_date, order_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
    db.run(
      sql,
      [
        payment_method,
        card_number,
        expiry_date,
        cvv,
        amount,
        payment_date,
        order_id,
        user_id,
      ],
      function (err) {
        callback(err, { id: this.lastID });
      }
    );
  },

  findByOrderId: (order_id, callback) => {
    const sql = "SELECT * FROM payments WHERE order_id = ?";
    db.get(sql, [order_id], callback);
  },

  findByPaymentIdAndUserId: (id, userId, callback) => {
    const sql = "SELECT * FROM payments WHERE id = ? AND user_id = ?";
    db.get(sql, [id, userId], callback);
  },

  findAllByUserId: (user_id, callback) => {
    const sql =
      "SELECT * FROM payments WHERE user_id = ? ORDER BY payment_date DESC";
    db.all(sql, [user_id], callback);
  },

  findByIdAndUserId: (id, user_id, callback) => {
    const sql = "SELECT * FROM payments WHERE id = ? AND user_id = ?";
    db.get(sql, [id, user_id], callback);
  },

  searchByPaymentIdAndDateForUser: (user_id, payment_id, date, callback) => {
    let sql = "SELECT * FROM payments WHERE user_id = ?";
    const params = [user_id];

    if (payment_id) {
      sql += " AND id = ?";
      params.push(payment_id);
    }
    // Ensure date is treated as a string and used with LIKE for partial matching if necessary
    if (date) {
      // Assuming date is in YYYY-MM-DD format. Adjust if your date format is different.
      sql += " AND DATE(payment_date) = DATE(?)";
      params.push(date);
    }
    sql += " ORDER BY payment_date DESC";
    db.all(sql, params, callback);
  },

  updateByIdAndUserId: (id, userId, data, callback) => {
    const {
      payment_method,
      card_number,
      expiry_date,
      cvv,
      amount,
      payment_date,
    } = data;
    const sql =
      "UPDATE payments SET payment_method = ?, card_number = ?, expiry_date = ?, cvv = ?, amount = ?, payment_date = ? WHERE id = ? AND user_id = ?";
    db.run(
      sql,
      [
        payment_method,
        card_number,
        expiry_date,
        cvv,
        amount,
        payment_date,
        id,
        userId,
      ],
      function (err) {
        callback(err, { changes: this.changes });
      }
    );
  },

  deleteByIdAndUserId: (id, userId, callback) => {
    const sql = "DELETE FROM payments WHERE id = ? AND user_id = ?";
    db.run(sql, [id, userId], function (err) {
      callback(err, { changes: this.changes });
    });
  },
};
