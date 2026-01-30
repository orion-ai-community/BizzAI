import mongoose from "mongoose";

const expenseCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: '',
        },
        monthlyBudget: {
            type: Number,
            min: [0, "Monthly budget cannot be negative"],
            default: null,
        },
        yearlyBudget: {
            type: Number,
            min: [0, "Yearly budget cannot be negative"],
            default: null,
        },
        color: {
            type: String,
            default: '#6366f1', // Indigo color
            trim: true,
        },
        icon: {
            type: String,
            default: '💰',
            trim: true,
        },
        isSystem: {
            type: Boolean,
            default: false,
            index: true,
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Compound unique index: category name must be unique per user
expenseCategorySchema.index({ name: 1, userId: 1 }, { unique: true });

// Index for active categories
expenseCategorySchema.index({ userId: 1, isActive: 1 });

// Virtual for budget utilization (calculated at runtime)
expenseCategorySchema.virtual('budgetUtilization').get(function () {
    // This will be populated by the controller when needed
    return null;
});

// Static method to get default categories
expenseCategorySchema.statics.getDefaultCategories = function () {
    return [
        { name: 'Rent', icon: '🏠', color: '#ef4444', description: 'Office or shop rent expenses' },
        { name: 'Utilities', icon: '⚡', color: '#f59e0b', description: 'Electricity, water, internet bills' },
        { name: 'Salaries', icon: '💼', color: '#10b981', description: 'Employee salaries and wages' },
        { name: 'Transportation', icon: '🚗', color: '#3b82f6', description: 'Vehicle fuel, maintenance, travel' },
        { name: 'Marketing', icon: '📢', color: '#8b5cf6', description: 'Advertising and promotion costs' },
        { name: 'Office Supplies', icon: '📎', color: '#ec4899', description: 'Stationery and office materials' },
        { name: 'Maintenance', icon: '🔧', color: '#14b8a6', description: 'Repairs and maintenance' },
        { name: 'Insurance', icon: '🛡️', color: '#f97316', description: 'Insurance premiums' },
        { name: 'Professional Fees', icon: '⚖️', color: '#6366f1', description: 'Legal, accounting, consulting fees' },
        { name: 'Miscellaneous', icon: '📦', color: '#64748b', description: 'Other expenses' },
    ];
};

// Static method to seed default categories for a user
expenseCategorySchema.statics.seedDefaultCategories = async function (userId) {
    const defaultCategories = this.getDefaultCategories();

    const categoriesToCreate = defaultCategories.map(cat => ({
        ...cat,
        userId,
        isSystem: true,
        isActive: true,
    }));

    try {
        // Use insertMany with ordered: false to continue on duplicate key errors
        await this.insertMany(categoriesToCreate, { ordered: false });
    } catch (error) {
        // Ignore duplicate key errors (categories already exist)
        if (error.code !== 11000) {
            throw error;
        }
    }
};

// Prevent deletion of system categories
expenseCategorySchema.pre('deleteOne', { document: true, query: false }, function (next) {
    if (this.isSystem) {
        return next(new Error('Cannot delete system category'));
    }
    next();
});

// Prevent deletion of system categories (for findOneAndDelete)
expenseCategorySchema.pre('findOneAndDelete', async function (next) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc && doc.isSystem) {
        return next(new Error('Cannot delete system category'));
    }
    next();
});

const ExpenseCategory = mongoose.model("ExpenseCategory", expenseCategorySchema);
export default ExpenseCategory;
