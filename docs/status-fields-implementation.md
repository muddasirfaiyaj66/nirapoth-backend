# Status Fields and Driver Restrictions - Implementation Guide

This document explains the newly implemented status fields and driver restriction system in the Nirapoth backend.

## New Fields Added

### 1. User Model Status Fields

- **`isDeleted`**: Boolean field for soft deletion of users

  - Default: `false`
  - When `true`, the user is considered deleted but data is preserved
  - Prevents login and access to the system

- **`isBlocked`**: Boolean field for blocking users
  - Default: `false`
  - When `true`, the user is temporarily blocked from system access
  - Can be reversed by admin users

### 2. Vehicle Model Status Fields

- **`isDeleted`**: Boolean field for soft deletion of vehicles
  - Default: `false`
  - When `true`, the vehicle is considered deleted but data is preserved

### 3. DriverGem Model Enhancement

- **`isRestricted`**: Boolean field for driver restrictions
  - Default: `false`
  - When `true`, the driver is restricted from certain actions
  - **Business Rule**: Must be `true` when driver gems <= 0

## Business Logic Constraints

### Driver Gem Constraint

```
If driver_gems.amount <= 0 then driver_gems.isRestricted must be true
```

This constraint is enforced at the application level through:

- `DriverGemService` class methods
- Automatic restriction when gems fall to 0 or below
- Manual override prevention (admins cannot unrestrict drivers with 0 gems)

## New Services

### DriverGemService

Located: `src/services/driverGem.service.ts`

#### Methods:

- **`updateDriverGems(driverId, amount)`**: Sets gem amount and auto-manages restriction
- **`decreaseGems(driverId, amount)`**: Decreases gems, auto-restricts if needed
- **`increaseGems(driverId, amount)`**: Increases gems, auto-unrestricts if appropriate
- **`getDriverGems(driverId)`**: Retrieves gem info with driver details
- **`setRestrictionStatus(driverId, isRestricted)`**: Manual restriction (with constraint enforcement)

### StatusUtils

Located: `src/utils/status.utils.ts`

#### Methods:

- **`softDeleteUser(userId)`**: Marks user as deleted
- **`softDeleteVehicle(vehicleId)`**: Marks vehicle as deleted
- **`blockUser(userId, blocked)`**: Blocks/unblocks user
- **`getActiveUsers()`**: Gets non-deleted, non-blocked users
- **`getActiveVehicles()`**: Gets non-deleted vehicles
- **`enforceDriverGemConstraints()`**: Fixes constraint violations across all drivers
- **`validateDriverGemConstraint(amount, isRestricted)`**: Validates constraint compliance

## New Controllers

### AdminController

Located: `src/controllers/admin.controller.ts`

Admin-only endpoints for managing user status and driver restrictions:

#### User Management:

- **POST** `/api/admin/users/block` - Block/unblock users
- **POST** `/api/admin/users/soft-delete` - Soft delete users

#### Driver Gem Management:

- **POST** `/api/admin/drivers/gems/manage` - Increase/decrease/set driver gems
- **POST** `/api/admin/drivers/restriction` - Set driver restriction status
- **GET** `/api/admin/drivers/:driverId/gems` - Get driver gem info

#### System Maintenance:

- **POST** `/api/admin/system/enforce-constraints` - Fix constraint violations

## Authentication Updates

### Login Security Enhancements

The login process now includes additional checks:

1. **Deleted Account Check**: Users with `isDeleted: true` cannot login
2. **Blocked Account Check**: Users with `isBlocked: true` cannot login
3. **Email Verification**: Existing check maintained

Example login flow:

```typescript
// Check if user is deleted
if (user.isDeleted) {
  return res.status(403).json({
    message: "Account has been deactivated",
  });
}

// Check if user is blocked
if (user.isBlocked) {
  return res.status(403).json({
    message: "Account has been blocked. Please contact support",
  });
}
```

## API Usage Examples

### Block a User

```bash
POST /api/admin/users/block
{
  "userId": "user-uuid",
  "blocked": true,
  "reason": "Violation of terms"
}
```

### Soft Delete a User

```bash
POST /api/admin/users/soft-delete
{
  "userId": "user-uuid",
  "reason": "Account deletion requested"
}
```

### Manage Driver Gems

```bash
POST /api/admin/drivers/gems/manage
{
  "driverId": "driver-uuid",
  "action": "decrease", // "increase", "decrease", or "set"
  "amount": 10
}
```

### Set Driver Restriction

```bash
POST /api/admin/drivers/restriction
{
  "driverId": "driver-uuid",
  "isRestricted": false
}
```

**Note**: If driver gems <= 0, restriction will remain `true` regardless of request.

## Database Migration

The changes have been applied through Prisma migration:

- Migration name: `init_with_status_fields`
- Adds `isDeleted`, `isBlocked`, and `isRestricted` fields
- Preserves existing data with default values

## Middleware Updates

### New Admin Authorization

- **`adminOnly`** middleware in `src/middlewares/security.middleware.ts`
- Ensures only users with `ADMIN` role can access admin endpoints
- Must be used after `authenticateToken` middleware

### AuthRequest Type Enhancement

Updated to include:

```typescript
interface AuthRequest extends Request {
  user?: User;
  userId?: string;
  userRole?: UserRole; // New field
}
```

## Constraint Enforcement

### Automatic Enforcement

- All `DriverGemService` methods automatically enforce constraints
- Gem decreases automatically trigger restrictions when needed
- Manual restriction changes respect the business rule

### Manual Enforcement

Admins can run system-wide constraint enforcement:

```bash
POST /api/admin/system/enforce-constraints
```

This finds and fixes any constraint violations across all drivers.

### Validation

The `StatusUtils.validateDriverGemConstraint()` method can be used to validate constraint compliance before database operations.

## Security Considerations

1. **Soft Deletion**: Preserves data integrity while preventing access
2. **Role-Based Access**: Admin functions require ADMIN role
3. **Constraint Enforcement**: Business rules cannot be bypassed
4. **Audit Trail**: All status changes should be logged (recommended enhancement)

## Best Practices

1. **Always use service methods** instead of direct Prisma calls for driver gems
2. **Check user status** in authentication-required endpoints
3. **Use soft deletion** instead of hard deletion for data preservation
4. **Run constraint enforcement** periodically as a maintenance task
5. **Log status changes** for audit purposes (recommended enhancement)

## Future Enhancements

Recommended additions:

1. **Audit Log**: Track all status changes with timestamps and admin IDs
2. **Bulk Operations**: Block/unblock multiple users simultaneously
3. **Scheduled Tasks**: Automatic constraint enforcement via cron jobs
4. **Email Notifications**: Notify users when their status changes
5. **Dashboard**: Admin interface for user and driver management
