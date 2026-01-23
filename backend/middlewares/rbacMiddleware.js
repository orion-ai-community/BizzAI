/**
 * ENTERPRISE AUTHORIZATION: Permission-Based Policy Layer
 * 
 * Centralized authorization with read/write/delete separation
 * NO BUSINESS LOGIC CHANGES - Only adds authorization guards
 */

/**
 * Permission definitions by role (EXPANDED for enterprise)
 */
const PERMISSIONS = {
    owner: [
        // Read permissions
        "read:invoice",
        "read:customer",
        "read:item",
        "read:return",
        "read:salesorder",
        "read:payment",
        "read:reports",
        "read:audit_logs",
        "read:settings",

        // Write permissions
        "write:invoice",
        "write:customer",
        "write:item",
        "write:return",
        "write:salesorder",
        "write:payment",
        "write:settings",

        // Delete permissions
        "delete:invoice",
        "delete:customer",
        "delete:item",
        "delete:return",
        "delete:salesorder",
        "delete:payment",
        "delete:user",

        // Management permissions
        "manage:users",
        "manage:roles",
        "export:data",
    ],
    staff: [
        // Read permissions only
        "read:invoice",
        "read:customer",
        "read:item",
        "read:salesorder",

        // Limited write permissions
        "write:invoice",
        "write:customer",

        // NO delete permissions
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
 * Check if user has ANY of the required permissions
 * @param {Object} user - User object
 * @param {Array<string>} permissions - Array of permission strings
 * @returns {boolean} True if user has at least one permission
 */
export const hasAnyPermission = (user, permissions) => {
    if (!user || !user.role) return false;
    return permissions.some(perm => hasPermission(user, perm));
};

/**
 * Check if user has ALL required permissions
 * @param {Object} user - User object
 * @param {Array<string>} permissions - Array of permission strings
 * @returns {boolean} True if user has all permissions
 */
export const hasAllPermissions = (user, permissions) => {
    if (!user || !user.role) return false;
    return permissions.every(perm => hasPermission(user, perm));
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
 * Middleware to require ANY of the permissions
 * @param {Array<string>} permissions - Array of permission strings
 * @returns {Function} Express middleware
 */
export const requireAnyPermission = (permissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        if (!hasAnyPermission(req.user, permissions)) {
            return res.status(403).json({
                message: "Insufficient permissions",
                required: `Any of: ${permissions.join(', ')}`,
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
 * Authorization guard for resource ownership
 * Ensures user can only access their own resources
 * 
 * @param {string} resourceField - Field name containing owner ID (e.g., 'createdBy', 'owner')
 * @returns {Function} Express middleware
 */
export const requireResourceOwnership = (resourceField = 'createdBy') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // Owner can access all resources
        if (req.user.role === 'owner') {
            return next();
        }

        // For non-owners, resource must belong to them
        // This check happens in controller after fetching resource
        req.resourceOwnershipField = resourceField;
        next();
    };
};

export default {
    PERMISSIONS,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    requirePermission,
    requireAnyPermission,
    requireOwner,
    requireResourceOwnership,
};
