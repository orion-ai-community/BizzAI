import mongoose from "mongoose";
import Estimate from "../models/Estimate.js";
import Item from "../models/Item.js";
import Customer from "../models/Customer.js";
import { info, error } from "../utils/logger.js";

/**
 * @desc Create a new estimate
 * @route POST /api/estimates
 * @access Private
 * 
 * CRITICAL: This does NOT affect inventory stock
 */
export const createEstimate = async (req, res) => {
    try {
        const { customerId, items, discount = 0, notes = '', validUntil } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items in estimate" });
        }

        // Calculate totals
        let subtotal = 0;
        for (const it of items) {
            subtotal += it.quantity * it.price;
        }
        const totalAmount = subtotal - discount;

        // Verify all items exist (read-only check, NO stock deduction)
        for (const it of items) {
            if (it.itemId && mongoose.Types.ObjectId.isValid(it.itemId)) {
                const item = await Item.findOne({ _id: it.itemId, addedBy: req.user._id });
                if (!item) {
                    return res.status(400).json({
                        message: `Item not found or unauthorized: ${it.itemId}`
                    });
                }
            }
        }

        // Verify customer belongs to current user if provided
        if (customerId) {
            if (!mongoose.Types.ObjectId.isValid(customerId)) {
                return res.status(400).json({ message: "Invalid customer ID format" });
            }

            const customer = await Customer.findOne({
                _id: customerId,
                owner: req.user._id
            });
            if (!customer) {
                return res.status(400).json({
                    message: "Customer not found or unauthorized"
                });
            }
        }

        // Generate unique estimate number
        const lastEstimate = await Estimate.findOne()
            .sort({ createdAt: -1 })
            .select('estimateNo');

        let estimateNumber = 1;
        if (lastEstimate && lastEstimate.estimateNo) {
            const match = lastEstimate.estimateNo.match(/EST-(\d+)/);
            if (match) {
                estimateNumber = parseInt(match[1]) + 1;
            }
        }

        const estimateNo = `EST-${String(estimateNumber).padStart(5, "0")}`;

        // Create estimate (NO inventory changes)
        const estimate = await Estimate.create({
            estimateNo,
            customer: customerId || null,
            items,
            subtotal,
            discount,
            totalAmount,
            notes,
            validUntil: validUntil || null,
            status: 'draft'
        });

        const populatedEstimate = await Estimate.findById(estimate._id)
            .populate("customer", "name phone email");

        info(`Estimate created: ${estimateNo}`);

        res.status(201).json({
            message: "Estimate created successfully",
            estimate: populatedEstimate
        });
    } catch (err) {
        error(`Estimate creation failed: ${err.message}`);
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get all estimates
 * @route GET /api/estimates
 * @access Private
 */
export const getAllEstimates = async (req, res) => {
    try {
        const estimates = await Estimate.find()
            .populate("customer", "name phone")
            .sort({ createdAt: -1 });

        res.status(200).json(estimates);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Get single estimate by ID
 * @route GET /api/estimates/:id
 * @access Private
 */
export const getEstimateById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid estimate ID format" });
        }

        const estimate = await Estimate.findById(req.params.id)
            .populate("customer");

        if (!estimate) {
            return res.status(404).json({ message: "Estimate not found" });
        }

        res.status(200).json(estimate);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Update estimate
 * @route PUT /api/estimates/:id
 * @access Private
 */
export const updateEstimate = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid estimate ID format" });
        }

        const estimate = await Estimate.findById(req.params.id);

        if (!estimate) {
            return res.status(404).json({ message: "Estimate not found" });
        }

        // Update fields
        const { items, discount, notes, status, validUntil } = req.body;

        if (items) {
            estimate.items = items;
            estimate.subtotal = items.reduce((sum, it) => sum + it.total, 0);
        }
        if (discount !== undefined) estimate.discount = discount;
        if (notes !== undefined) estimate.notes = notes;
        if (status) estimate.status = status;
        if (validUntil) estimate.validUntil = validUntil;

        estimate.totalAmount = estimate.subtotal - estimate.discount;

        await estimate.save();

        const updatedEstimate = await Estimate.findById(estimate._id)
            .populate("customer");

        res.status(200).json({
            message: "Estimate updated successfully",
            estimate: updatedEstimate
        });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};

/**
 * @desc Delete estimate
 * @route DELETE /api/estimates/:id
 * @access Private
 */
export const deleteEstimate = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: "Invalid estimate ID format" });
        }

        const estimate = await Estimate.findById(req.params.id);

        if (!estimate) {
            return res.status(404).json({ message: "Estimate not found" });
        }

        await estimate.deleteOne();

        res.status(200).json({ message: "Estimate deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
};
