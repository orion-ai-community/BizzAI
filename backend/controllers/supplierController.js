import mongoose from "mongoose";
import Supplier from "../models/Supplier.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Add new supplier
 * @route POST /api/suppliers
 */
export const addSupplier = async (req, res) => {
  try {
    const { businessName, contactPersonName, contactNo, email, physicalAddress, gstNo, supplierType, openingBalance, balanceType, creditPeriod, status } = req.body;

    if (!businessName || !contactPersonName || !contactNo || !email || !physicalAddress || !gstNo || !supplierType || !status) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    // Check for duplicate contactNo within this owner's suppliers
    const existingContact = await Supplier.findOne({ 
      contactNo, 
      owner: req.user._id 
    });
    
    if (existingContact) {
      return res.status(400).json({ message: "Contact number already exists in your supplier list" });
    }

    // Check for duplicate email within this owner's suppliers
    const existingEmail = await Supplier.findOne({ 
      email, 
      owner: req.user._id 
    });
    
    if (existingEmail) {
      return res.status(400).json({ message: "Email already exists in your supplier list" });
    }

    // Auto-generate supplierId
    const lastSupplier = await Supplier.findOne({ owner: req.user._id }).sort({ supplierId: -1 });
    let nextId = 1;
    if (lastSupplier && lastSupplier.supplierId) {
      const lastNum = parseInt(lastSupplier.supplierId.split('-')[1]);
      nextId = lastNum + 1;
    }
    const supplierId = `SUP-${nextId.toString().padStart(5, '0')}`;

    // Create supplier with owner reference
    const supplier = await Supplier.create({ 
      supplierId,
      businessName,
      contactPersonName,
      contactNo,
      email,
      physicalAddress,
      gstNo,
      supplierType,
      openingBalance: openingBalance || 0,
      balanceType: balanceType || "payable",
      creditPeriod: creditPeriod || 0,
      status,
      owner: req.user._id
    });
    
    info(`New supplier added by ${req.user.name}: ${businessName} (${supplierId})`);
    res.status(201).json(supplier);
  } catch (err) {
    error(`Add Supplier Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Update supplier
 * @route PUT /api/suppliers/:id
 */
export const updateSupplier = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid supplier ID format" });
    }

    // First check if supplier belongs to this owner
    const supplier = await Supplier.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });
    
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found or unauthorized" });
    }

    // Check for duplicate contactNo if contactNo is being updated
    if (req.body.contactNo && req.body.contactNo !== supplier.contactNo) {
      const existingContact = await Supplier.findOne({ 
        contactNo: req.body.contactNo, 
        owner: req.user._id,
        _id: { $ne: req.params.id }
      });
      
      if (existingContact) {
        return res.status(400).json({ message: "Contact number already exists" });
      }
    }

    // Check for duplicate email if email is being updated
    if (req.body.email && req.body.email !== supplier.email) {
      const existingEmail = await Supplier.findOne({ 
        email: req.body.email, 
        owner: req.user._id,
        _id: { $ne: req.params.id }
      });
      
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    const updated = await Supplier.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );

    info(`Supplier updated by ${req.user.name}: ${updated.businessName} (${updated.supplierId})`);
    res.status(200).json(updated);
  } catch (err) {
    error(`Update Supplier Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get all suppliers (only for current owner)
 * @route GET /api/suppliers
 */
export const getAllSuppliers = async (req, res) => {
  try {
    // Only get suppliers that belong to current user
    const suppliers = await Supplier.find({ owner: req.user._id }).sort({ businessName: 1 });
    res.status(200).json(suppliers);
  } catch (err) {
    error(`Get All Suppliers Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get single supplier
 * @route GET /api/suppliers/:id
 */
export const getSupplierById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid supplier ID format" });
    }

    // Only get supplier if it belongs to current user
    const supplier = await Supplier.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });
    
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found or unauthorized" });
    }
    
    res.status(200).json(supplier);
  } catch (err) {
    error(`Get Supplier By Id Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Delete supplier
 * @route DELETE /api/suppliers/:id
 */
export const deleteSupplier = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid supplier ID format" });
    }

    // First check if supplier belongs to this owner
    const supplier = await Supplier.findOne({ 
      _id: req.params.id, 
      owner: req.user._id 
    });
    
    if (!supplier) {
      return res.status(404).json({ message: "Supplier not found or unauthorized" });
    }

    await Supplier.findByIdAndDelete(req.params.id);
    info(`Supplier deleted by ${req.user.name}: ${supplier.businessName}`);
    res.status(200).json({ message: "Supplier deleted" });
  } catch (err) {
    error(`Delete Supplier Error: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};