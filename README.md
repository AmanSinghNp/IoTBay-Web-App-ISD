# 📦 IoTBay Web App – ISD Assignment 2

## 📘 Project Description

This project is developed as part of the **41025 Introduction to Software Development** subject at UTS.  
**IoTBay** is a web application designed to simulate an online IoT device store. It supports user registration, login, device browsing, order tracking, payment management, and administrative functions like managing stock and product listings.

The system follows the **MVC (Model–View–Controller)** design pattern and is built using:

- **Node.js + Express** for backend logic and routing
- **EJS (Embedded JavaScript Templates)** for rendering dynamic frontend views
- **Sequelize ORM + SQLite** for managing the database
- **Tailwind CSS** for modern UI styling
- **Jest** for testing

---

## 🛠️ Features Implemented

### 🧑 User Features

- Register, Login, Logout with access logging
- Browse devices (search, filter, sort)
- Inline device detail view
- Place and cancel orders
- View order history and order details
- View and manage payments
- Track shipment status

### 🧑‍💻 Staff Features

- Add new devices
- Edit or delete devices
- View all products with admin controls
- Role-based access control
- Access to user management
- View system access logs

---

## 🧱 Tech Stack

| Layer          | Technology              |
| -------------- | ----------------------- |
| View           | HTML, EJS, Tailwind CSS |
| Controller     | Express.js              |
| Model          | Sequelize ORM           |
| Database       | SQLite                  |
| Authentication | express-session         |
| Testing        | Jest                    |
| Deployment     | Localhost (for now)     |

---

## 🚀 How to Run Locally

### ✅ Prerequisites

- Node.js and npm installed (recommended: Node v18+)
- Git installed

### 📦 1. Clone the Repository

```bash
git clone https://github.com/AmanSinghNp/IoTBay-Web-App-ISD
cd IoTBay-Web-App-ISD
```

### 📦 2. Install Dependencies

```bash
npm install
```

### 3. Run the Application

First, seed the database:

```bash
node seed.js
```

Then start the application:

```bash
node app.js
```

The application will be available at:

```
http://localhost:3000
```

## 📁 Project Structure

```
IoTBay-Web-App-ISD/
├── app.js                 # Application entry point
├── config/               # Configuration files
├── controllers/         # Route handlers
├── docs/               # Project documentation
├── middleware/         # Express middleware
├── models/            # Sequelize models
├── public/           # Static assets (CSS, JS, images)
├── routes/          # Express route definitions
├── tests/          # Jest test files
└── views/         # EJS templates
    ├── pages/    # Page templates
    └── partials/ # Reusable template parts
```

## 🔐 Test Accounts

The application includes pre-seeded users for testing. All accounts use the same password for testing purposes:

**Default Password for all accounts**: `Password123!`

### Admin User

- **Email**: admin@iotbay.com
- **Role**: Admin
- Full system access

### Staff User

- **Email**: staff1@iotbay.com
- **Role**: Staff
- Can manage products and view user data

### Customer User

- **Email**: john@example.com
- **Role**: Customer
- Can browse products, place orders, and manage payments

## 🧪 Testing

The project uses Jest for testing. To run tests:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

## 📝 API Documentation

### Authentication Endpoints

- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- POST `/api/auth/logout` - User logout

### Device Endpoints

- GET `/api/devices` - List all devices
- POST `/api/devices` - Create new device (Staff only)
- PUT `/api/devices/:id` - Update device (Staff only)
- DELETE `/api/devices/:id` - Delete device (Staff only)

### Order Endpoints

- GET `/api/orders` - List user orders
- POST `/api/orders` - Create new order
- GET `/api/orders/:id` - Get order details
- PUT `/api/orders/:id/cancel` - Cancel order

### Payment Endpoints

- GET `/api/payments` - List user payments
- POST `/api/payments` - Process payment
- GET `/api/payments/:id` - Get payment details

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is part of a university assignment and is not licensed for public use.

---

## 🎓 Team Members

- Aman Singh (25104201) - Feature 01: Online User Access Management (Team Lead)
- Xiao Luo (24671707) - Feature 02: IoT Device Catalogue Management
- Vinix Collen (25115294) - Feature 03: Order Management
- Liana Ayoub (25253612) - Feature 04: Payment Management
- Tuyet Anh Nguyen (24625788) - Feature 05: Shipment Management
- Hyun Woo Cho (13562107) - Feature 06: User Management

Tutorial: Workshop 2, Friday 10:00-13:00  
Tutor: Md Sarwar Kamal
