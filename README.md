# 📦 IoTBay Web App – ISD Assignment 2

## 📘 Project Description

This project is developed as part of the **41025 Introduction to Software Development** subject at UTS.  
**IoTBay** is a web application designed to simulate an online IoT device store. It supports user registration, login, device browsing, order tracking, payment management, shipment tracking, and comprehensive administrative functions including user management and access logging.

The system follows the **MVC (Model–View–Controller)** design pattern and is built using:

- **Node.js + Express** for backend logic and routing
- **EJS (Embedded JavaScript Templates)** for rendering dynamic frontend views
- **Sequelize ORM + SQLite** for managing the database
- **Tailwind CSS** for modern UI styling
- **bcrypt** for secure password hashing
- **express-session** for session management

---

## 🛠️ Features Implemented

### 👤 Customer Features

- **Account Management**
  - User registration and login/logout
  - Profile management and settings
  - Access log viewing (personal activity history)
- **Shopping Experience**
  - Browse devices with search, filter, and sort functionality
  - Inline device detail view with product information
  - Shopping cart functionality
  - Place and cancel orders
  - View order history and detailed order information
- **Payment & Shipping**
  - Payment management and history
  - Shipment tracking and delivery status
  - Multiple address management

### 🧑‍💼 Staff (Administrative) Features

- **Device Management**
  - Add new devices to the catalog
  - Edit existing device information
  - Delete devices from inventory
  - View all products with administrative controls
- **User Management System**
  - Create and manage user accounts (both customer and staff)
  - Search and filter users by name, email, or phone
  - Update user details, roles, and permissions
  - Activate/deactivate user accounts
  - Delete user accounts (with restrictions)
  - View comprehensive user statistics and analytics
- **System Administration**
  - Access to all customer features
  - Role-based access control enforcement
  - System monitoring and user activity oversight

### 🔐 Security Features

- **Authentication & Authorization**
  - Secure password hashing with bcrypt
  - Session-based authentication
  - Role-based access control (Customer vs Staff)
  - Protected routes and middleware
- **Access Logging**
  - Comprehensive user activity tracking
  - Login/logout time recording
  - Session management and monitoring
  - Personal access log viewing for users

---

## 🧱 Tech Stack

| Layer          | Technology                                       |
| -------------- | ------------------------------------------------ |
| Frontend       | HTML5, EJS Templates, Tailwind CSS, Font Awesome |
| Backend        | Node.js, Express.js                              |
| Database       | SQLite with Sequelize ORM                        |
| Authentication | express-session, bcrypt                          |
| Testing        | Jest, Supertest                                  |
| Development    | Nodemon (optional)                               |

---

## 🚀 How to Run Locally

### ✅ Prerequisites

- **Node.js** (v16 or higher recommended)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

---

### 📦 Installation Steps

#### 1. Clone the Repository

```bash
git clone https://github.com/AmanSinghNp/IoTBay-Web-App-ISD
cd IoTBay-Web-App-ISD
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Initialize Database and Seed Data

```bash
npm run seed
```

This command will:

- Create the SQLite database
- Set up all required tables
- Insert sample devices, users, orders, and other test data

#### 4. Start the Application

```bash
npm start
```

Or for development with auto-restart:

```bash
node app.js
```

#### 5. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

---

## 📁 Project Structure

```
IoTBay-Web-App-ISD/
├── config/
│   └── database.js          # Database configuration
├── controllers/             # Route handlers and business logic
│   ├── adminUserController.js
│   ├── authController.js
│   ├── deviceController.js
│   └── ...
├── middleware/              # Custom middleware functions
│   └── authMiddleware.js    # Authentication & authorization
├── models/                  # Sequelize database models
│   ├── user.js
│   ├── device.js
│   ├── order.js
│   └── ...
├── routes/                  # Express route definitions
│   ├── auth.js
│   ├── devices.js
│   ├── adminUsers.js
│   └── ...
├── views/                   # EJS templates
│   ├── admin/
│   │   └── users/          # User management views
│   ├── partials/           # Reusable template components
│   └── ...
├── public/                  # Static assets
│   └── images/             # Product images
├── tests/                   # Test suites
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── acceptance/         # Acceptance tests
├── app.js                   # Main application file
├── seed.js                  # Database seeding script
└── package.json            # Project dependencies and scripts
```

---

## 🔐 User Roles & Login Instructions

The application includes two distinct user roles with different permissions:

### 🧑‍💼 Staff Users (Administrative Access)

**System Administrator Account:**

- **Email**: `admin@iotbay.com`
- **Password**: `admin123`
- **Role**: Staff (System Administrator)

**Staff Manager Account:**

- **Email**: `staff@iotbay.com`
- **Password**: `staff123`
- **Role**: Staff (Manager)

**Staff Permissions:**

- **Full User Management System Access**
  - Create new users (both customer and staff accounts)
  - View, search, and filter all user records
  - Update user details, roles, and permissions
  - Activate/deactivate user accounts
  - Delete user accounts (cannot delete own account)
  - Access user analytics and statistics
- **Device Management**
  - Add, edit, and delete devices from the catalog
  - Manage product inventory and information
- **System Access**
  - Access to all customer features
  - Administrative dashboard with management tools
  - System monitoring capabilities

### 👤 Customer Users (Standard Access)

**Pre-seeded Customer Accounts:**

**Customer 1:**

- **Email**: `john@example.com`
- **Password**: `123456`
- **Role**: Customer

**Customer 2:**

- **Email**: `jane@example.com`
- **Password**: `123456`
- **Role**: Customer

**Customer Permissions:**

- Browse and search device catalog
- Place and manage orders
- View order history and tracking
- Manage payment methods and history
- Track shipments and deliveries
- View personal access logs
- Update profile information

### 🆕 Creating Additional Users

**For Staff Users:**

- Navigate to `/admin/users` after logging in as staff
- Click "Create New User"
- Fill in user details and select appropriate role
- Staff can create both customer and staff accounts

**For Public Registration:**

- Visit `/register` to create a new customer account
- All public registrations default to customer role
- Staff role assignment requires existing staff user

---

## 🧪 Testing

The application includes comprehensive test suites covering different aspects of functionality:

### Running All Tests

```bash
npm test
```

### Running Specific Test Suites

```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# Access log tests
npm run test:access
npm run test:access-flow
```

### Test Coverage

- **Unit Tests**: Individual component testing
- **Integration Tests**: Feature integration testing including user management
- **Acceptance Tests**: End-to-end user workflow testing
- **Access Log Tests**: Authentication and logging functionality

---

## 🔧 Available Scripts

| Script            | Command                    | Description                            |
| ----------------- | -------------------------- | -------------------------------------- |
| Start Application | `npm start`                | Run the application in production mode |
| Seed Database     | `npm run seed`             | Initialize database with sample data   |
| Run All Tests     | `npm test`                 | Execute complete test suite            |
| Unit Tests        | `npm run test:unit`        | Run unit tests only                    |
| Integration Tests | `npm run test:integration` | Run integration tests only             |
| Access Log Tests  | `npm run test:access`      | Test access logging functionality      |

---

## 🌟 Key Features Highlights

### User Management System

- **Comprehensive Admin Panel**: Full CRUD operations for user accounts
- **Advanced Search & Filtering**: Find users by name, email, phone, or role
- **Role Management**: Seamless switching between customer and staff roles
- **Account Status Control**: Activate/deactivate accounts with immediate effect
- **Security Measures**: Prevent self-deletion and unauthorized access

### Access Logging System

- **Session Tracking**: Complete login/logout time recording
- **Personal Activity Logs**: Users can view their own access history
- **Security Monitoring**: Track user activity for security purposes
- **Automatic Cleanup**: Proper session management and logout handling

### Device Management

- **Inventory Control**: Add, edit, and remove devices from catalog
- **Rich Product Information**: Detailed descriptions, pricing, and images
- **Category Organization**: Organized by brand and catalog categories
- **Stock Management**: Track inventory levels and availability

### Order & Payment System

- **Order Lifecycle**: Complete order management from placement to completion
- **Payment Integration**: Secure payment processing and history
- **Shipment Tracking**: Real-time delivery status and tracking
- **Address Management**: Multiple shipping addresses per user

---

## 🔒 Security Considerations

- **Password Security**: All passwords are hashed using bcrypt with salt rounds
- **Session Management**: Secure session handling with proper cleanup
- **Role-Based Access**: Strict enforcement of user permissions
- **Input Validation**: Server-side validation for all user inputs
- **SQL Injection Protection**: Sequelize ORM provides built-in protection
- **Access Logging**: Comprehensive activity tracking for security monitoring

---

## 🚀 Future Enhancements

- Email notifications for account creation and updates
- Advanced reporting and analytics dashboard
- Bulk user operations and CSV import/export
- Enhanced search capabilities with advanced filters
- Real-time notifications and alerts
- API endpoints for mobile application integration

---

## 📞 Support

For technical support or questions about this project, please refer to the course materials or contact the development team through the appropriate academic channels.
