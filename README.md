# 📦 IoTBay Web App – ISD Assignment 2

## 📘 Project Description

This project is developed as part of the **41025 Introduction to Software Development** subject at UTS.  
**IoTBay** is a web application designed to simulate an online IoT device store. It supports user registration, login, device browsing, order tracking, payment management, and administrative functions like managing stock and product listings.

The system follows the **MVC (Model–View–Controller)** design pattern and is built using:

- **Node.js + Express** for backend logic and routing
- **EJS (Embedded JavaScript Templates)** for rendering dynamic frontend views
- **Sequelize ORM + SQLite** for managing the database
- **Tailwind CSS** for modern UI styling

---

## 🛠️ Features Implemented

### 🧑 User Features

- Register, Login, Logout
- Browse devices (search, filter, sort)
- Inline device detail view
- Place and cancel orders
- View order history and order details
- View and manage payments

### 🧑‍💻 Staff Features

- Add new devices
- Edit or delete devices
- View all products with admin controls
- Role-based access control

---

## 🧱 Tech Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| View           | HTML, EJS, Tailwind CSS |
| Controller     | Express.js              |
| Model          | Sequelize ORM           |
| Database       | SQLite                  |
| Authentication | express-session         |
| Deployment     | Localhost (for now)     |

---

## 🚀 How to Run Locally

### ✅ Prerequisites

- Node.js and npm installed (recommended: Node v18+)
- Git installed

---

### 📦 1. Clone the Repository

```bash
git clone https://github.com/AmanSinghNp/IoTBay-Web-App-ISD
cd IoTBay-Web-App-ISD
```

### 📦 2. Install Dependencies

```bash
npm install
```

### 3. Run the APP

```bash
node seed.js
node app.js
```

Then go to

```
http://localhost:3000
```

## 📁 Folder Structure

/controllers # Route handlers
/models # Sequelize models
/routes # Express route definitions
/views # EJS templates (pages, partials)
/public # Static assets (CSS, JS, etc)

---

## 🔐 Login Instructions

The application includes two pre-seeded users for testing:

### Staff User

- **Email**: admin@example.com
- **Password**: 123456
- **Role**: Staff
- Can add, edit, and delete devices

### Customer User

- **Email**: john@example.com
- **Password**: 123456
- **Role**: Customer
- Can browse products, place orders, and view payments

You can log in using the `/login` page on the site.

To create more users, register from the `/register` page. New accounts are customer role by default.

## 🧪 Testing

### Running Tests

The application includes automated tests for key features. To run all tests:

```bash
npm test
```

To run specific tests:

```bash
# Run access log basic tests
npm run test:access

# Run access log flow tests
npm run test:access-flow
```

### Test Structure

Tests are organized in the `/tests` directory:

- `access-log.test.js`: Tests basic access log functionality
- `access-log-flow.test.js`: Tests the complete access log user flow
