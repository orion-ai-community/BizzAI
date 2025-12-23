import mongoose from "mongoose";
import DueAdjustment from "../models/DueAdjustment.js";
import Customer from "../models/Customer.js";
import Transaction from "../models/Transaction.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Create a new due adjustment
 * @route POST /api/due/adjust
 */
export const createDueAdjustment = async (req, res) => {
    try {
        const { customerId, adjustmentAmount, adjustmentMethod, notes = "" } = req.body;

        // Validate input
        if (!customerId || !adjustmentAmount || !adjustmentMethod) {
            return res.status(400).json({
                message: "Customer ID, adjustment amount, and adjustment method are required",
            });
        }

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ message: "Invalid customer ID format" });
        }

        // Validate adjustment amount
        if (adjustmentAmount <= 0) {
            return res.status(400).json({
                message: "Adjustment amount must be greater than zero",
            });
        }

        // Validate adjustment method
        const validMethods = ["cash", "bank", "credit", "original_payment"];
        if (!validMethods.includes(adjustmentMethod)) {
            return res.status(400).json({
                message: "Invalid adjustment method",
            });
        }

        // Fetch customer and verify ownership
        const customer = await Customer.findOne({
            _id: customerId,
            owner: req.user._id,
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found or unauthorized",
            });
        }

        // Validate adjustment amount doesn't exceed outstanding due
        if (adjustmentAmount > customer.dues) {
            return res.status(400).json({
                message: `Adjustment amount (₹${adjustmentAmount}) cannot exceed outstanding due (₹${customer.dues})`,
            });
        }

        // Calculate updated due
        const previousDue = customer.dues;
        const updatedDue = previousDue - adjustmentAmount;

        // Ensure no negative balance
        if (updatedDue < 0) {
            return res.status(400).json({
                message: "Adjustment would result in negative balance",
            });
        }

        // Create due adjustment record
        const dueAdjustment = await DueAdjustment.create({
            customer: customerId,
            relatedInvoice: null,
            adjustmentAmount,
            adjustmentMethod,
            previousDue,
            updatedDue,
            notes,
            createdBy: req.user._id,
        });

        // Update customer dues
        await Customer.findByIdAndUpdate(customerId, {
            $inc: { dues: -adjustmentAmount },
        });

        // Create transaction record
        await Transaction.create({
            type: "due_adjustment",
            customer: customerId,
            dueAdjustment: dueAdjustment._id,
            amount: adjustmentAmount,
            paymentMethod: adjustmentMethod,
            description: `Due adjustment of ₹${adjustmentAmount} via ${adjustmentMethod}${notes ? ` - ${notes}` : ""}`,
        });

        info(
            `Due adjustment created by ${req.user.name}: ₹${adjustmentAmount} for customer ${customer.name}`
        );

        // Populate and return the created adjustment
        const populatedAdjustment = await DueAdjustment.findById(dueAdjustment._id)
            .populate("customer", "name phone email dues")
            .populate("createdBy", "name email");

        res.status(201).json({
            message: "Due adjustment created successfully",
            adjustment: populatedAdjustment,
        });
    } catch (err) {
        error(`Create Due Adjustment Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get all due adjustments (only for current owner)
 * @route GET /api/due/adjustments
 */
export const getDueAdjustments = async (req, res) => {
    try {
        const adjustments = await DueAdjustment.find({ createdBy: req.user._id })
            .populate("customer", "name phone email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json(adjustments);
    } catch (err) {
        error(`Get All Due Adjustments Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get due adjustments for a specific customer
 * @route GET /api/due/customer/:customerId/adjustments
 */
export const getCustomerDueAdjustments = async (req, res) => {
    try {
        const { customerId } = req.params;

        // Validate ObjectId format
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.status(400).json({ message: "Invalid customer ID format" });
        }

        // Verify customer belongs to current user
        const customer = await Customer.findOne({
            _id: customerId,
            owner: req.user._id,
        });

        if (!customer) {
            return res.status(404).json({
                message: "Customer not found or unauthorized",
            });
        }

        const adjustments = await DueAdjustment.find({
            customer: customerId,
            createdBy: req.user._id,
        })
            .populate("customer", "name phone email")
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.status(200).json({
            customer: { name: customer.name, phone: customer.phone },
            adjustments,
        });
    } catch (err) {
        error(`Get Customer Due Adjustments Error: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

// Legacy functions from dueRoutes.js (keeping for backward compatibility)
export const addDue = async (req, res) => {
    res.status(501).json({ message: "Not implemented - use createDueAdjustment instead" });
};

export const getAllDues = async (req, res) => {
    res.status(501).json({ message: "Not implemented - use getDueAdjustments instead" });
};

export const getCustomerDues = async (req, res) => {
    res.status(501).json({ message: "Not implemented - use getCustomerDueAdjustments instead" });
};

export const updateDue = async (req, res) => {
    res.status(501).json({ message: "Not implemented" });
};

export const clearDue = async (req, res) => {
    res.status(501).json({ message: "Not implemented" });
};
