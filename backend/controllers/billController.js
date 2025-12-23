import mongoose from "mongoose";
import Bill from "../models/Bill.js";
import CashbankTransaction from "../models/CashbankTransaction.js";
import BankAccount from "../models/BankAccount.js";
import { error, info } from "../utils/logger.js";

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
  if (lastBill && lastBill.billNo) {
    const parts = lastBill.billNo.split('-');
    if (parts.length >= 3) {
      const lastSequence = parseInt(parts[2]);
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1;
      }
    }
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
    const {
      date,
      supplier,
      amount: amountRaw,
      dueDate,
      status,
      description,
      paymentMethod = 'cash',
      paidAmount: paidAmountRaw = 0,
      bankAccount
    } = req.body;

    const paidAmount = Number(paidAmountRaw);
    const amount = Number(amountRaw);

    if (!date || !supplier || !amount) {
      return res.status(400).json({
        message: "Date, supplier, and amount are required"
      });
    }

    // Validate supplier ObjectId
    if (!mongoose.Types.ObjectId.isValid(supplier)) {
      return res.status(400).json({ message: "Invalid supplier ID format" });
    }

    // Validate bankAccount ObjectId if provided
    if (bankAccount && !mongoose.Types.ObjectId.isValid(bankAccount)) {
      return res.status(400).json({ message: "Invalid bank account ID format" });
    }

    // Calculate payment status
    let paymentStatus = 'unpaid';
    if (paidAmount >= amount) {
      paymentStatus = 'paid';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    }

    // Validate bank payment
    if (paymentMethod === 'bank_transfer' && paidAmount > 0) {
      if (!bankAccount) {
        return res.status(400).json({
          message: 'Bank account is required for bank transfer'
        });
      }

      const bankAcc = await BankAccount.findOne({
        _id: bankAccount,
        userId: req.user._id
      });

      if (!bankAcc) {
        return res.status(400).json({ message: 'Bank account not found' });
      }

      if (bankAcc.currentBalance < paidAmount) {
        return res.status(400).json({
          message: `Insufficient balance. Available: ₹${bankAcc.currentBalance}`
        });
      }
    }

    // Generate bill number
    const billNo = await generateBillNo(req.user._id);

    // Create bill
    const bill = new Bill({
      billNo,
      date,
      supplier,
      amount,
      dueDate: dueDate || undefined,
      status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
      description,
      paymentMethod,
      paidAmount,
      bankAccount: (bankAccount && mongoose.Types.ObjectId.isValid(bankAccount)) ? bankAccount : undefined,
      paymentStatus,
      createdBy: req.user._id
    });

    await bill.save();

    // Handle bank payment
    if (paymentMethod === 'bank_transfer' && paidAmount > 0) {
      // Create cashbank transaction (money OUT)
      const cashbankTxn = await CashbankTransaction.create({
        type: 'out',
        amount: paidAmount,
        fromAccount: bankAccount,
        toAccount: 'purchase', // Indicates payment for purchase
        description: `Payment for bill ${billNo}`,
        date: new Date(),
        userId: req.user._id,
      });

      // Update bank balance (deduct)
      await BankAccount.updateOne(
        { _id: bankAccount, userId: req.user._id },
        {
          $inc: { currentBalance: -paidAmount },
          $push: { transactions: cashbankTxn._id }
        }
      );

      info(`Bank payment for bill ${billNo}: -₹${paidAmount} from account ${bankAccount}`);
    }

    // Return bill with populated supplier
    const result = await Bill.findById(bill._id).populate("supplier", "businessName");

    res.status(201).json(result);
  } catch (err) {
    error(`Create bill failed: ${err.stack || err.message}`);
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

    // Sanitize bankAccount if provided as empty string
    if (req.body.bankAccount === "") {
      req.body.bankAccount = undefined;
    }

    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("supplier", "businessName");

    res.status(200).json(updatedBill);
  } catch (err) {
    error(`Update bill failed: ${err.stack || err.message}`);
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

/**
 * @desc Update bill payment (for marking unpaid bills as paid)
 * @route PUT /api/bills/:id/payment
 */
export const updateBillPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, bankAccount } = req.body;
    const paidAmount = Number(req.body.paidAmount);

    if (isNaN(paidAmount) || paidAmount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount required' });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid bill ID format" });
    }

    const bill = await Bill.findOne({ _id: id, createdBy: req.user._id });
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    const newPaidAmount = bill.paidAmount + paidAmount;

    if (newPaidAmount > bill.amount) {
      return res.status(400).json({
        message: `Payment amount exceeds bill total. Remaining: ₹${bill.amount - bill.paidAmount}`
      });
    }

    // Determine new payment status
    let paymentStatus = 'unpaid';
    let billStatus = 'unpaid';

    if (newPaidAmount >= bill.amount) {
      paymentStatus = 'paid';
      billStatus = 'paid';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
      billStatus = 'unpaid';
    }

    // Handle bank payment
    if (paymentMethod === 'bank_transfer') {
      if (!bankAccount) {
        return res.status(400).json({
          message: 'Bank account is required for bank transfer'
        });
      }

      const bankAcc = await BankAccount.findOne({
        _id: bankAccount,
        userId: req.user._id
      });

      if (!bankAcc) {
        return res.status(400).json({ message: 'Bank account not found' });
      }

      if (bankAcc.currentBalance < paidAmount) {
        return res.status(400).json({
          message: `Insufficient balance. Available: ₹${bankAcc.currentBalance}`
        });
      }

      // Create transaction (money OUT)
      const cashbankTxn = await CashbankTransaction.create({
        type: 'out',
        amount: paidAmount,
        fromAccount: bankAccount,
        toAccount: 'purchase',
        description: `Payment for bill ${bill.billNo}`,
        date: new Date(),
        userId: req.user._id,
      });

      // Update bank balance
      await BankAccount.updateOne(
        { _id: bankAccount, userId: req.user._id },
        {
          $inc: { currentBalance: -paidAmount },
          $push: { transactions: cashbankTxn._id }
        }
      );

      info(`Bank payment for bill ${bill.billNo}: -₹${paidAmount}`);
    }

    // Update bill
    bill.paidAmount = newPaidAmount;
    bill.paymentStatus = paymentStatus;
    bill.status = billStatus;
    bill.paymentMethod = paymentMethod;
    if (bankAccount && mongoose.Types.ObjectId.isValid(bankAccount)) {
      bill.bankAccount = bankAccount;
    } else {
      bill.bankAccount = undefined;
    }
    await bill.save();

    await bill.populate("supplier", "businessName");

    res.status(200).json({
      message: 'Payment recorded successfully',
      bill
    });
  } catch (err) {
    error(`Update bill payment failed: ${err.message}`);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};