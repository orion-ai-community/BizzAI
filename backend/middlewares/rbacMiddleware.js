/**
 * Role-Based Access Control (RBAC) Middleware
 * Prevents non-owners from performing destructive actions
 */

/**
 * Permission definitions by role
 */
const PERMISSIONS = {
    owner: [
        "delete:invoice",
        "delete:customer",
        "delete:item",
        "delete:return",
        "delete:salesorder",
        "delete:payment",
        "update:user_role",
        "delete:user",
        "view:audit_logs",
        "manage:settings",
    ],
    admin: [
        "create:invoice",
        "update:invoice",
        "create:customer",
        "update:customer",
        "create:item",
        "update:item",
        "view:reports",
    ],
};

/**
 * Check if user has required permission
 * @param {Object} user - User object with role
 * @param {string} permission - Permission string (e.g., "delete:invoice")
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (user, permission) => {
    if (!user || !user.role) return false;

    const userPermissions = PERMISSIONS[user.role] || [];
    return userPermissions.includes(permission);
};

/**
 * Middleware to require specific permission
 * Usage: router.delete('/api/invoices/:id', protect, requirePermission('delete:invoice'), deleteInvoice);
 * 
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
export const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!hasPermission(req.user, permission)) {
            return res.status(403).json({
                message: "Insufficient permissions",
                required: permission,
                userRole: req.user.role,
            });
        }

        next();
    };
};

/**
 * Middleware to require owner role
 * Usage: router.delete('/api/users/:id', protect, requireOwner, deleteUser);
 */
export const requireOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "owner") {
        return res.status(403).json({
            message: "Owner access required",
            userRole: req.user.role,
        });
    }

    next();
};

/**
 * Middleware to require admin or owner role
 * Usage: router.post('/api/items', protect, requireAdminOrOwner, createItem);
 */
export const requireAdminOrOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== "owner" && req.user.role !== "admin") {
        return res.status(403).json({
            message: "Admin or Owner access required",
            userRole: req.user.role,
        });
    }

    next();
};

export default {
    hasPermission,
    requirePermission,
    requireOwner,
    requireAdminOrOwner,
    PERMISSIONS,
};
