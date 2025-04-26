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

- Register / Login / Logout
- Browse available IoT devices
- Place, cancel, and view orders
- Track and view payment history

### 🧑‍💻 Staff Features

- Add new devices to inventory
- Stock management
- Role-based access control (staff vs customer)

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
git clone thisurl
cd iotbay-mvp
```

### 📦 2. Install Dependencies

```bash
npm install
```

### 3. Run the APP

```bash
node app.js
```

Then go to

```
http://localhost:3000
```

### For Max/ Linux

### ⚡ Quick Setup (Linux/macOS/WSL)

```bash
chmod +x setup.sh

./setup.sh

```
