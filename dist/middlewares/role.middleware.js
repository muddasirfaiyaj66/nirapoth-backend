"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roleMiddleware = void 0;
const roleMiddleware = (allowedRoles) => {
    return (req, res, next) => {
        try {
            const userRole = req.user?.role;
            if (!userRole) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required",
                });
            }
            if (!allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. Insufficient permissions.",
                });
            }
            next();
        }
        catch (error) {
            console.error("Role middleware error:", error);
            res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    };
};
exports.roleMiddleware = roleMiddleware;
