/**
 * Database Seed Script
 * 
 * Creates sample data for local development and testing.
 * Run with: npm run seed
 * 
 * Demo Account:
 * Email: demo@bizzai.com
 * Password: Demo@123
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import models
import User from "../models/User.js";
import Customer from "../models/Customer.js";
import Item from "../models/Item.js";
import Supplier from "../models/Supplier.js";
import BankAccount from "../models/BankAccount.js";
import Invoice from "../models/Invoice.js";
import Counter from "../models/Counter.js";

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
};

// Demo user data
const demoUser = {
    name: "Demo Shop Owner",
    email: "demo@bizzai.com",
    password: "Demo@123",
    shopName: "Demo Grocery Store",
    gstNumber: "27AAAAA7777A7A8",
    shopAddress: "123 Main Street, Mumbai, Maharashtra 400001",
    phone: "9876543210",
    role: "owner",
};

// Sample customers
const sampleCustomers = [
    { name: "Rajesh Kumar", phone: "9876543211", email: "rajesh.kumar@email.com", address: "45 MG Road, Mumbai", dues: 150 },
    { name: "Priya Sharma", phone: "9876543212", email: "priya.sharma@email.com", address: "78 Park Street, Pune", dues: 0 },
    { name: "Amit Patel", phone: "9876543213", email: "amit.patel@email.com", address: "12 Gandhi Nagar, Ahmedabad", dues: 500 },
    { name: "Sunita Devi", phone: "9876543214", email: "sunita.devi@email.com", address: "34 Lake View, Bangalore", dues: 0 },
    { name: "Vikram Singh", phone: "9876543215", email: "vikram.singh@email.com", address: "56 Civil Lines, Delhi", dues: 250 },
];

// Sample inventory items
const sampleItems = [
    // Grains & Pulses
    { name: "Basmati Rice (1kg)", sku: "GRN001", category: "Grains", costPrice: 85, sellingPrice: 110, stockQty: 50, unit: "kg" },
    { name: "Toor Dal (1kg)", sku: "GRN002", category: "Pulses", costPrice: 120, sellingPrice: 150, stockQty: 40, unit: "kg" },
    { name: "Wheat Flour (5kg)", sku: "GRN003", category: "Grains", costPrice: 180, sellingPrice: 220, stockQty: 30, unit: "pcs" },
    { name: "Moong Dal (1kg)", sku: "GRN004", category: "Pulses", costPrice: 100, sellingPrice: 130, stockQty: 35, unit: "kg" },

    // Dairy
    { name: "Amul Butter (500g)", sku: "DRY001", category: "Dairy", costPrice: 240, sellingPrice: 280, stockQty: 25, unit: "pcs" },
    { name: "Milk (1L)", sku: "DRY002", category: "Dairy", costPrice: 52, sellingPrice: 60, stockQty: 100, unit: "litre" },
    { name: "Paneer (200g)", sku: "DRY003", category: "Dairy", costPrice: 70, sellingPrice: 90, stockQty: 20, unit: "pcs" },
    { name: "Curd (400g)", sku: "DRY004", category: "Dairy", costPrice: 35, sellingPrice: 45, stockQty: 40, unit: "pcs" },

    // Beverages
    { name: "Tata Tea Gold (500g)", sku: "BEV001", category: "Beverages", costPrice: 180, sellingPrice: 220, stockQty: 45, unit: "pcs" },
    { name: "Nescafe Coffee (200g)", sku: "BEV002", category: "Beverages", costPrice: 320, sellingPrice: 380, stockQty: 30, unit: "pcs" },
    { name: "Coca Cola (2L)", sku: "BEV003", category: "Beverages", costPrice: 75, sellingPrice: 95, stockQty: 60, unit: "pcs" },
    { name: "Bisleri Water (1L)", sku: "BEV004", category: "Beverages", costPrice: 15, sellingPrice: 20, stockQty: 200, unit: "pcs" },

    // Snacks
    { name: "Lays Chips (52g)", sku: "SNK001", category: "Snacks", costPrice: 18, sellingPrice: 20, stockQty: 100, unit: "pcs" },
    { name: "Parle-G Biscuits (800g)", sku: "SNK002", category: "Snacks", costPrice: 70, sellingPrice: 85, stockQty: 50, unit: "pcs" },
    { name: "Haldiram Namkeen (400g)", sku: "SNK003", category: "Snacks", costPrice: 90, sellingPrice: 110, stockQty: 35, unit: "pcs" },
    { name: "Hide & Seek (120g)", sku: "SNK004", category: "Snacks", costPrice: 25, sellingPrice: 35, stockQty: 80, unit: "pcs" },

    // Cooking Essentials
    { name: "Sunflower Oil (1L)", sku: "OIL001", category: "Cooking", costPrice: 140, sellingPrice: 170, stockQty: 40, unit: "litre" },
    { name: "Salt (1kg)", sku: "ESS001", category: "Essentials", costPrice: 18, sellingPrice: 25, stockQty: 100, unit: "kg" },
    { name: "Sugar (1kg)", sku: "ESS002", category: "Essentials", costPrice: 42, sellingPrice: 50, stockQty: 60, unit: "kg" },
    { name: "Red Chilli Powder (100g)", sku: "SPC001", category: "Spices", costPrice: 30, sellingPrice: 40, stockQty: 70, unit: "pcs" },
];

// Sample suppliers
const sampleSuppliers = [
    {
        supplierId: "SUP001",
        businessName: "Mumbai Wholesale Traders",
        contactPersonName: "Ramesh Gupta",
        contactNo: "9811111111",
        email: "sales@mumbaitraders.com",
        physicalAddress: "Wholesale Market, Crawford, Mumbai 400001",
        gstNo: "27BBBBB8888B8B8",
        supplierType: "wholesaler",
        openingBalance: 5000,
        balanceType: "payable",
        creditPeriod: 30,
        status: "active",
    },
    {
        supplierId: "SUP002",
        businessName: "Fresh Dairy Supplies",
        contactPersonName: "Suresh Patel",
        contactNo: "9822222222",
        email: "orders@freshdairy.com",
        physicalAddress: "Dairy Complex, Andheri, Mumbai 400053",
        gstNo: "27CCCCC9999C9C9",
        supplierType: "distributor",
        openingBalance: 0,
        balanceType: "payable",
        creditPeriod: 15,
        status: "active",
    },
    {
        supplierId: "SUP003",
        businessName: "National Beverages Ltd",
        contactPersonName: "Anil Kumar",
        contactNo: "9833333333",
        email: "contact@nationalbev.com",
        physicalAddress: "Industrial Area, Thane 400601",
        gstNo: "27DDDDD0000D0D0",
        supplierType: "manufacturer",
        openingBalance: 2500,
        balanceType: "receivable",
        creditPeriod: 45,
        status: "active",
    },
];

// Sample bank account
const sampleBankAccount = {
    bankName: "HDFC Bank",
    accountNumber: "50100123456789",
    accountType: "Current",
    branch: "Andheri West",
    ifsc: "HDFC0001234",
    openingBalance: 50000,
    currentBalance: 50000,
    status: "active",
};

// Clear existing data for demo user
const clearData = async (userId) => {
    console.log("\n🧹 Clearing existing demo data...");

    await Invoice.deleteMany({ createdBy: userId });
    await Item.deleteMany({ addedBy: userId });
    await Customer.deleteMany({ owner: userId });
    await Supplier.deleteMany({ owner: userId });
    await BankAccount.deleteMany({ userId: userId });
    await Counter.deleteMany({ userId: userId });

    console.log("   ✓ Cleared invoices, items, customers, suppliers, bank accounts, counters");
};

// Create demo user
const createDemoUser = async () => {
    console.log("\n👤 Creating demo user...");

    // Check if user exists
    let user = await User.findOne({ email: demoUser.email });

    if (user) {
        console.log("   ℹ Demo user already exists, using existing account");
        return user;
    }

    // Create new user
    user = await User.create(demoUser);
    console.log(`   ✓ Created demo user: ${user.email}`);

    return user;
};

// Create customers
const createCustomers = async (ownerId) => {
    console.log("\n👥 Creating sample customers...");

    const customers = [];
    for (const customerData of sampleCustomers) {
        const customer = await Customer.create({
            ...customerData,
            owner: ownerId,
        });
        customers.push(customer);
    }

    console.log(`   ✓ Created ${customers.length} customers`);
    return customers;
};

// Create inventory items
const createItems = async (userId) => {
    console.log("\n📦 Creating sample inventory items...");

    const items = [];
    for (const itemData of sampleItems) {
        const item = await Item.create({
            ...itemData,
            addedBy: userId,
        });
        items.push(item);
    }

    console.log(`   ✓ Created ${items.length} inventory items`);
    return items;
};

// Create suppliers
const createSuppliers = async (ownerId) => {
    console.log("\n🏭 Creating sample suppliers...");

    const suppliers = [];
    for (const supplierData of sampleSuppliers) {
        const supplier = await Supplier.create({
            ...supplierData,
            owner: ownerId,
        });
        suppliers.push(supplier);
    }

    console.log(`   ✓ Created ${suppliers.length} suppliers`);
    return suppliers;
};

// Create bank account
const createBankAccount = async (userId) => {
    console.log("\n🏦 Creating sample bank account...");

    const account = await BankAccount.create({
        ...sampleBankAccount,
        userId: userId,
    });

    console.log(`   ✓ Created bank account: ${account.bankName}`);
    return account;
};

// Create sample invoices
const createInvoices = async (userId, customers, items) => {
    console.log("\n🧾 Creating sample invoices...");

    // Initialize counter for invoices
    await Counter.findOneAndUpdate(
        { name: "invoice", userId: userId },
        { seq: 0 },
        { upsert: true }
    );

    const invoices = [];
    const paymentStatuses = ["paid", "paid", "paid", "unpaid", "partial"];
    const paymentMethods = ["cash", "upi", "card", "cash", "cash"];

    for (let i = 0; i < 5; i++) {
        // Get next invoice number
        const counter = await Counter.findOneAndUpdate(
            { name: "invoice", userId: userId },
            { $inc: { seq: 1 } },
            { new: true }
        );

        const invoiceNo = `INV-${String(counter.seq).padStart(5, "0")}`;

        // Select 2-4 random items for the invoice
        const numItems = Math.floor(Math.random() * 3) + 2;
        const selectedItems = [];
        const usedIndices = new Set();

        while (selectedItems.length < numItems) {
            const randomIndex = Math.floor(Math.random() * items.length);
            if (!usedIndices.has(randomIndex)) {
                usedIndices.add(randomIndex);
                const item = items[randomIndex];
                const quantity = Math.floor(Math.random() * 3) + 1;
                selectedItems.push({
                    item: item._id,
                    quantity: quantity,
                    price: item.sellingPrice,
                    tax: 0,
                    discount: 0,
                    total: item.sellingPrice * quantity,
                });
            }
        }

        const subtotal = selectedItems.reduce((sum, item) => sum + item.total, 0);
        const discount = i === 2 ? 50 : 0; // Add discount to one invoice
        const totalAmount = subtotal - discount;

        let paidAmount = 0;
        if (paymentStatuses[i] === "paid") {
            paidAmount = totalAmount;
        } else if (paymentStatuses[i] === "partial") {
            paidAmount = Math.floor(totalAmount * 0.6);
        }

        const invoice = await Invoice.create({
            invoiceNo: invoiceNo,
            customer: customers[i]._id,
            items: selectedItems,
            subtotal: subtotal,
            tax: 0,
            discount: discount,
            totalAmount: totalAmount,
            paidAmount: paidAmount,
            paymentStatus: paymentStatuses[i],
            paymentMethod: paymentMethods[i],
            createdBy: userId,
        });

        invoices.push(invoice);
    }

    console.log(`   ✓ Created ${invoices.length} sample invoices`);
    return invoices;
};

// Main seed function
const seedDatabase = async () => {
    console.log("╔════════════════════════════════════════╗");
    console.log("║     BizzAI Database Seed Script        ║");
    console.log("╚════════════════════════════════════════╝");

    try {
        // Connect to database
        await connectDB();

        // Create or get demo user
        const user = await createDemoUser();

        // Clear existing data for this user
        await clearData(user._id);

        // Create all sample data
        const customers = await createCustomers(user._id);
        const items = await createItems(user._id);
        await createSuppliers(user._id);
        await createBankAccount(user._id);
        await createInvoices(user._id, customers, items);

        console.log("\n╔════════════════════════════════════════╗");
        console.log("║     ✅ Database seeded successfully!   ║");
        console.log("╠════════════════════════════════════════╣");
        console.log("║  Demo Login Credentials:               ║");
        console.log("║  📧 Email: demo@bizzai.com             ║");
        console.log("║  🔐 Password: Demo@123                 ║");
        console.log("╚════════════════════════════════════════╝");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Seed failed:", error.message);
        console.error(error.stack);
        process.exit(1);
    }
};

// Run the seed
seedDatabase();
