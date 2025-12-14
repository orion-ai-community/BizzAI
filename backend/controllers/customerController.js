import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Add new customer
 * @route POST /api/customers
 */
export const addCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ message: "Name and phone are required" });
    }

    // Check for duplicate phone within this owner's customers
    const existingPhone = await Customer.findOne({ 
      phone, 
      owner: req.user._id 
    });
    
    if (existingPhone) {
      return res.status(400).json({ message: "Phone number already exists in your customer list" });
    }

    // Check for duplicate email within this owner's customers (if email provided)
    if (email) {
      const existingEmail = await Customer.findOne({ 
        email, 
        owner: req.user._id 
      });
      
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists in your customer list" });
      }
    }

    // Create customer with owner reference
    const customer = await Customer.create({ 
      name, 
      phone, 
      email, 
      address,
      owner: req.user._id // Link to current user
    });
    
    info(`New customer added by ${req.user.name}: ${name} (${email || "no email"})`);
    res.status(201).json(customer);
  } catch (err) {
    error(`Add Customer Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Update customer
 * @route PUT /api/customers/:id
 */
export const updateCustomer = async (req, res) => {
  try {
    // First check if customer belongs to this owner
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found or unauthorized" });
    }

    // Check for duplicate phone if phone is being updated
    if (req.body.phone && req.body.phone !== customer.phone) {
      const existingPhone = await Customer.findOne({ 
        phone: req.body.phone, 
        owner: req.user._id,
        _id: { $ne: req.params.id } // Exclude current customer
      });
      
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already exists" });
      }
    }

    // Check for duplicate email if email is being updated
    if (req.body.email && req.body.email !== customer.email) {
      const existingEmail = await Customer.findOne({ 
        email: req.body.email, 
        owner: req.user._id,
        _id: { $ne: req.params.id }
      });
      
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const updated = await Customer.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );

    info(`Customer updated by ${req.user.name}: ${updated.name} (${updated.email || "no email"})`);
    res.status(200).json(updated);
  } catch (err) {
    error(`Update Customer Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get all customers (only for current owner)
 * @route GET /api/customers
 */
export const getAllCustomers = async (req, res) => {
  try {
    // Only get customers that belong to current user
    const customers = await Customer.find({ owner: req.user._id }).sort({ name: 1 });
    res.status(200).json(customers);
  } catch (err) {
    error(`Get All Customers Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get single customer
 * @route GET /api/customers/:id
 */
export const getCustomerById = async (req, res) => {
  try {
    // Only get customer if it belongs to current user
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found or unauthorized" });
    }
    
    res.status(200).json(customer);
  } catch (err) {
    error(`Get Customer By Id Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Delete customer
 * @route DELETE /api/customers/:id
 */
export const deleteCustomer = async (req, res) => {
  try {
    // First check if customer belongs to this owner
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found or unauthorized" });
    }

    await Customer.findByIdAndDelete(req.params.id);
    info(`Customer deleted by ${req.user.name}: ${customer.name}`);
    res.status(200).json({ message: "Customer deleted" });
  } catch (err) {
    error(`Delete Customer Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get transaction history for a customer
 * @route GET /api/customers/:id/transactions
 */
export const getCustomerTransactions = async (req, res) => {
  try {
    // First check if customer belongs to this owner
    const customer = await Customer.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });
    
    if (!customer) {
      return res.status(404).json({ message: "Customer not found or unauthorized" });
    }

    const transactions = await Transaction.find({
      customer: req.params.id,
    })
      .sort({ createdAt: -1 })
      .populate("invoice", "invoiceNo totalAmount paymentStatus");

    res.status(200).json({
      customer: { name: customer.name, phone: customer.phone },
      transactions: transactions.length ? transactions : [],
    });
  } catch (err) {
    error(`Get Customer Transactions Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};