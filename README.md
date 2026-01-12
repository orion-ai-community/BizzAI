# 🧾 BizzAI - Smart Billing & Inventory Management System

A modern, full-stack Point of Sale (POS) and inventory management system designed for retail businesses, grocery stores, and small to medium enterprises. Built with the MERN stack (MongoDB, Express.js, React, Node.js) and featuring a beautiful, responsive UI with TailwindCSS.

## ✨ Features

### 🔐 Authentication & Authorization

- Secure user registration and login with JWT authentication
- Role-based access control (Owner, Admin)
- Protected routes and API endpoints
- Password encryption with bcrypt

### 📦 Inventory Management

- Add, edit, and delete inventory items
- Track stock quantities in real-time
- Low stock alerts and notifications
- SKU and category management
- Cost price and selling price tracking
- Multiple unit types (kg, litre, pcs, etc.)
- Profit margin calculations

### 👥 Customer Management

- Comprehensive customer database
- Customer profile with contact details
- Transaction history tracking
- Due/credit management
- Customer-specific analytics
- Search and filter capabilities

### 💰 Point of Sale (POS)

- Intuitive, fast checkout interface
- Barcode/SKU scanning support
- Multiple payment methods (Cash, UPI, Card, Credit)
- Discount application
- Real-time inventory updates
- Invoice generation with PDF export
- Print-ready invoice format

### 💸 Return Management
- Process sales returns with ease
- **Refund Methods**:
    - **Customer Credit**: Automatically updates customer dues/balance
    - **Cash**: Logged as cash-out transaction
    - **Bank Transfer**: Logged against specific bank account
    - **UPI**: Instant bank-to-bank transfer via UPI ID
    - **Original Payment**: Reverses the original transaction method
- Partial or Full returns support
- Inventory auto-adjustment options

### 📊 Reports & Analytics

- Sales reports with date range filtering
- Revenue and profit tracking
- Top-selling products analysis
- Customer purchase patterns
- Interactive charts and visualizations (Recharts)
- Export capabilities

### 📄 Invoice Management

- Automatic invoice number generation
- Detailed invoice view
- Payment status tracking (Paid, Unpaid, Partial)
- Invoice history
- PDF generation for printing/sharing
- Email invoice capability

## 🛠️ Tech Stack

### Frontend

- **React 19** - UI library
- **Vite** - Build tool and dev server
- **Redux Toolkit** - State management
- **React Router v7** - Client-side routing
- **TailwindCSS v4** - Utility-first CSS framework
- **Recharts** - Data visualization
- **Axios** - HTTP client

### Backend

- **Node.js** - Runtime environment
- **Express.js v5** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **PDFKit** - PDF generation
- **Nodemailer** - Email functionality
- **Morgan** - HTTP request logger
- **CORS** - Cross-origin resource sharing

### Infrastructure & DevOps

- **Docker** - Containerization
- **GitHub Actions** - CI/CD Pipeline
- **Nginx** - Production Web Server (Frontend)

### Testing

- **Jest** - Backend Testing Framework
- **Supertest** - API Integration Testing
- **Vitest** - Frontend Switcher
- **React Testing Library** - Component Testing

## 📁 Project Structure

```
BizzAI/
├── backend/
│   ├── config/
│   │   └── db.js                 # Database connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── customerController.js # Customer operations
│   │   ├── inventoryController.js# Inventory operations
│   │   ├── posController.js      # POS/Invoice operations
│   │   └── reportController.js   # Analytics & reports
│   ├── middlewares/
│   │   └── authMiddleware.js     # JWT verification
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Item.js               # Inventory item schema
│   │   ├── Customer.js           # Customer schema
│   │   ├── Invoice.js            # Invoice schema
│   │   ├── Transaction.js        # Transaction schema
│   │   └── Notification.js       # Notification schema
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── customerRoutes.js     # Customer endpoints
│   │   ├── inventoryRoutes.js    # Inventory endpoints
│   │   ├── posRoutes.js          # POS endpoints
│   │   └── reportRoutes.js       # Report endpoints
│   ├── utils/                    # Helper functions
│   ├── invoices/                 # Generated PDF invoices
│   ├── .env                      # Environment variables
│   ├── server.js                 # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx        # Main layout wrapper
    │   │   └── Sidebar.jsx       # Navigation sidebar
    │   ├── pages/
    │   │   ├── Login.jsx         # Login page
    │   │   ├── Register.jsx      # Registration page
    │   │   ├── Dashboard.jsx     # Analytics dashboard
    │   │   ├── POS.jsx           # Point of Sale interface
    │   │   ├── Inventory.jsx     # Inventory list
    │   │   ├── AddItem.jsx       # Add new item
    │   │   ├── EditItem.jsx      # Edit item
    │   │   ├── Customers.jsx     # Customer list
    │   │   ├── AddCustomer.jsx   # Add new customer
    │   │   ├── EditCustomer.jsx  # Edit customer
    │   │   ├── CustomerDetail.jsx# Customer details
    │   │   ├── Invoice.jsx       # Invoice list
    │   │   ├── InvoiceDetail.jsx # Invoice details
    │   │   └── Reports.jsx       # Reports & analytics
    │   ├── redux/
    │   │   ├── store.js          # Redux store
    │   │   └── slices/
    │   │       ├── authSlice.js  # Auth state
    │   │       ├── inventorySlice.js
    │   │       ├── customerSlice.js
    │   │       ├── posSlice.js
    │   │       └── reportsSlice.js
    │   ├── services/
    │   │   └── api.js            # API configuration
    │   ├── App.jsx               # Main app component
    │   ├── main.jsx              # Entry point
    │   └── index.css             # Global styles
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v6 or higher) - Local or Atlas
- **npm** or **yarn**

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/orion-ai-community/BizzAI.git
cd BizzAI
```

#### 2. Backend Setup

```bash
cd backend
# Install dependencies
npm install
# Create .env file
cp .env.example .env
```

#### 3. Frontend Setup

```bash
cd ../frontend
# Install dependencies
npm install
# Create .env file
cp .env.example .env
```

### 🐳 Running with Docker (Recommended)

1. Ensure you have Docker and Docker Compose installed.
2. Build and start the containers:

```bash
docker-compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:80
- **Backend**: http://localhost:5000

### Running the Application

#### Development Mode

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

Backend will run on `http://localhost:5000`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

#### Production Build

**Backend:**

```bash
cd backend
npm start
```

**Frontend:**

```bash
cd frontend
npm run build
npm run preview
```

## 🧪 Testing

We use **Jest** for backend testing and **Vitest** for frontend testing.

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Description       | Auth Required |
| ------ | -------------------- | ----------------- | ------------- |
| POST   | `/api/auth/register` | Register new user | No            |
| POST   | `/api/auth/login`    | Login user        | No            |
| GET    | `/api/auth/profile`  | Get user profile  | Yes           |

### Inventory

| Method | Endpoint                   | Description         | Auth Required |
| ------ | -------------------------- | ------------------- | ------------- |
| POST   | `/api/inventory`           | Add new item        | Yes           |
| GET    | `/api/inventory`           | Get all items       | Yes           |
| GET    | `/api/inventory/low-stock` | Get low stock items | Yes           |
| GET    | `/api/inventory/:id`       | Get single item     | Yes           |
| PUT    | `/api/inventory/:id`       | Update item         | Yes           |
| DELETE | `/api/inventory/:id`       | Delete item         | Yes           |

### Customers

| Method | Endpoint                          | Description               | Auth Required |
| ------ | --------------------------------- | ------------------------- | ------------- |
| POST   | `/api/customers`                  | Add new customer          | Yes           |
| GET    | `/api/customers`                  | Get all customers         | Yes           |
| GET    | `/api/customers/:id`              | Get customer details      | Yes           |
| PUT    | `/api/customers/:id`              | Update customer           | Yes           |
| DELETE | `/api/customers/:id`              | Delete customer           | Yes           |
| GET    | `/api/customers/:id/transactions` | Get customer transactions | Yes           |

### POS / Invoices

| Method | Endpoint               | Description         | Auth Required |
| ------ | ---------------------- | ------------------- | ------------- |
| POST   | `/api/pos/invoice`     | Create new invoice  | Yes           |
| GET    | `/api/pos/invoices`    | Get all invoices    | Yes           |
| GET    | `/api/pos/invoice/:id` | Get invoice details | Yes           |
| DELETE | `/api/pos/invoice/:id` | Delete invoice      | Yes           |

### Reports

| Method | Endpoint               | Description           | Auth Required |
| ------ | ---------------------- | --------------------- | ------------- |
| GET    | `/api/reports/sales`   | Get sales reports     | Yes           |
| GET    | `/api/reports/revenue` | Get revenue analytics | Yes           |

## 🎨 Key Features Explained

### Dashboard

- Real-time business metrics
- Sales overview with charts
- Low stock alerts
- Recent transactions
- Quick action buttons

### POS System

- Fast product search and selection
- Cart management with quantity adjustments
- Multiple payment method support
- Automatic inventory deduction
- Instant invoice generation
- Customer selection for credit tracking

### Inventory Management

- Bulk import/export capabilities
- Category-wise organization
- Stock level monitoring
- Profit margin tracking
- Search and filter options

### Customer Management

- Complete customer profiles
- Purchase history
- Outstanding dues tracking
- Contact management
- Customer analytics

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- CORS configuration
- Input validation and sanitization
- MongoDB injection prevention
- XSS protection

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the Apache License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Orion-AI-Community - Initial work

## 🙏 Acknowledgments

- React team for the amazing library
- MongoDB for the flexible database
- TailwindCSS for the utility-first CSS framework
- All contributors who help improve this project

## 📞 Support

For support, email shingadekartik1@gmail.com or open an issue in the repository.

## 🗺️ Roadmap

- [ ] Multi-store support
- [ ] Barcode scanner integration
- [ ] Mobile app (React Native)
- [ ] Advanced analytics with ML predictions
- [ ] Supplier management
- [ ] Purchase order management
- [ ] Employee management with attendance
- [ ] WhatsApp integration for invoices
- [ ] Multi-currency support
- [ ] Tax calculation (GST/VAT)

---

**Made with ❤️ for small businesses**
