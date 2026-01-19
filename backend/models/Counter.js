import mongoose from "mongoose";

/**
 * Counter model for atomic sequence generation
 * Used for invoice numbers, order numbers, etc.
 */
const counterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        seq: {
            type: Number,
            default: 0,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

// Compound unique index to ensure one counter per user per type
counterSchema.index({ name: 1, userId: 1 }, { unique: true });

/**
 * Get next sequence number atomically
 * @param {String} counterName - Name of the counter (e.g., 'invoice', 'order')
 * @param {ObjectId} userId - User ID for multi-tenant isolation
 * @param {Object} session - MongoDB session for transaction support
 * @returns {Number} Next sequence number
 */
counterSchema.statics.getNextSequence = async function (counterName, userId, session = null) {
    const options = session ? { session, new: true, upsert: true } : { new: true, upsert: true };

    const counter = await this.findOneAndUpdate(
        { name: counterName, userId },
        { $inc: { seq: 1 } },
        options
    );

    return counter.seq;
};

const Counter = mongoose.model("Counter", counterSchema);
export default Counter;
