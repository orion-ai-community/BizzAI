import mongoose from "mongoose";
import Bill from "../models/Bill.js";
import { error } from "../utils/logger.js";

// Generate bill number: BILL-YYYYMMDD-XXX
const generateBillNo = async (userId) => {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `BILL-${dateStr}`;

  // Find last bill number for today
  const lastBill = await Bill.findOne({
    billNo: new RegExp(`^${prefix}`),
    createdBy: userId
  }).sort({ billNo: -1 });

  let sequence = 1;
  if (lastBill) {
    const lastSequence = parseInt(lastBill.billNo.split('-')[2]);
    sequence = lastSequence + 1;
  }

  return `${prefix}-${sequence.toString().padStart(3, '0')}`;
};

/**
 * @desc Get all bills (only for current owner)
 * @route GET /api/bills
 */
export const getAllBills = async (req, res) => {
  try {
    const bills = await Bill.find({ createdBy: req.user._id })
      .populate("supplier", "businessName")
      .sort({ createdAt: -1 });
    res.status(200).json(bills);
  } catch (err) {
    error(`Get all bills failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Create new bill
 * @route POST /api/bills
 */
export const createBill = async (req, res) => {
  try {
    const { date, supplier, amount, dueDate, status, description } = req.body;

    if (!date || !supplier || !amount) {
      return res.status(400).json({ message: "Date, supplier, and amount are required" });
    }

    // Generate bill number
    const billNo = await generateBillNo(req.user._id);

    const bill = await Bill.create({
      billNo,
      date,
      supplier,
      amount,
      dueDate,
      status: status || 'unpaid',
      description,
      createdBy: req.user._id
    });

    // Populate supplier info for response
    await bill.populate("supplier", "businessName");

    res.status(201).json(bill);
  } catch (err) {
    error(`Create bill failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Get single bill
 * @route GET /api/bills/:id
 */
export const getBillById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bill ID format" });
    }

    const bill = await Bill.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    }).populate("supplier");

    if (!bill) {
      return res.status(404).json({ message: "Bill not found or unauthorized" });
    }

    res.status(200).json(bill);
  } catch (err) {
    error(`Get bill by ID failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Update bill
 * @route PUT /api/bills/:id
 */
export const updateBill = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bill ID format" });
    }

    // First check if bill belongs to this user
    const bill = await Bill.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found or unauthorized" });
    }

    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("supplier", "businessName");

    res.status(200).json(updatedBill);
  } catch (err) {
    error(`Update bill failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

/**
 * @desc Delete bill
 * @route DELETE /api/bills/:id
 */
export const deleteBill = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid bill ID format" });
    }

    const bill = await Bill.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!bill) {
      return res.status(404).json({ message: "Bill not found or unauthorized" });
    }

    await bill.deleteOne();
    res.status(200).json({ message: "Bill deleted" });
  } catch (err) {
    error(`Delete bill failed: ${err.message}`);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};