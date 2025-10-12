# Database Schema Design - Nirapoth (নিরাপদ পথ)

## Overview

The Nirapoth database schema is designed to support a comprehensive vehicle management and safety platform for Bangladesh. It includes modules for user management, vehicle registration, traffic violations, emergency services, and public safety monitoring.

## Current Implemented Schema

### Core Enums

#### UserRole

```prisma
enum UserRole {
  ADMIN        // System administrators
  POLICE       // Police officers
  DRIVER       // Licensed drivers
  FIRE_SERVICE // Fire service personnel
  CITIZEN      // General citizens
}
```

#### ComplaintType

```prisma
enum ComplaintType {
  TRAFFIC        // Traffic-related complaints
  INFRASTRUCTURE // Infrastructure issues
}
```

### Core Models

#### User Management

```prisma
model User {
  id           String          @id @default(uuid())
  name         String
  phone        String
  email        String          @unique
  password     String
  role         UserRole        @default(CITIZEN)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime?       @updatedAt

  // Relations
  stationId    String?
  station      PoliceStation?  @relation(fields: [stationId], references: [id])
  vehiclesOwned  Vehicle[]     @relation("OwnerVehicles")
  vehiclesDriven Vehicle[]     @relation("DriverVehicles")
  payments       Payment[]
  driverGem      DriverGem?

  @@map("users")
}
```

**Key Features:**

- Multi-role user system (Admin, Police, Driver, Fire Service, Citizen)
- Association with police stations for officers
- Separate tracking of owned vs driven vehicles
- Integrated payment history
- Driver reward system (DriverGem)

#### Vehicle Management

```prisma
model Vehicle {
  id           String      @id @default(uuid())
  type         String
  plateNo      String      @unique
  ownerId      String
  owner        User        @relation("OwnerVehicles", fields: [ownerId], references: [id])
  driverId     String?
  driver       User?       @relation("DriverVehicles", fields: [driverId], references: [id])
  registeredAt DateTime    @default(now())
  violations   Violation[]

  @@map("vehicles")
}
```

**Features:**

- Unique plate number identification
- Separate owner and driver tracking
- Complete violation history
- Registration timestamp tracking

#### Traffic Rules & Violations

```prisma
model Rule {
  id          String      @id @default(uuid())
  code        String      @unique
  description String
  penalty     Int?
  violations  Violation[]

  @@map("rules")
}

model Violation {
  id          String   @id @default(uuid())
  ruleId      String
  rule        Rule     @relation(fields: [ruleId], references: [id])
  vehicleId   String
  vehicle     Vehicle  @relation(fields: [vehicleId], references: [id])
  latitude    Float?
  longitude   Float?
  description String?
  status      String
  createdAt   DateTime @default(now())
  fine        Fine?

  @@map("violations")
}
```

**Features:**

- Standardized rule codes and descriptions
- GPS location tracking for violations
- Flexible penalty system
- Status tracking for violation resolution

#### Emergency Services

```prisma
model PoliceStation {
  id        String   @id @default(uuid())
  name      String
  address   String?
  latitude  Float?
  longitude Float?
  cameras   Camera[]
  users     User[]

  @@map("police_stations")
}

model FireService {
  id        String   @id @default(uuid())
  name      String
  latitude  Float?
  longitude Float?
  cameras   Camera[]

  @@map("fire_services")
}
```

**Features:**

- GPS coordinates for emergency response
- Camera network integration
- User assignment to stations

#### Monitoring & Surveillance

```prisma
model Camera {
  id           String         @id @default(uuid())
  latitude     Float?
  longitude    Float?
  streamUrl    String
  installedAt  DateTime
  status       String
  stationId    String?
  station      PoliceStation? @relation(fields: [stationId], references: [id])
  fireServiceId String?
  fireService   FireService?  @relation(fields: [fireServiceId], references: [id])

  @@map("cameras")
}
```

**Features:**

- Real-time video streaming capabilities
- GPS location tracking
- Assignment to police or fire services
- Installation and status tracking

#### Payment & Financial Management

```prisma
model Fine {
  id          String    @id @default(uuid())
  violationId String    @unique
  violation   Violation @relation(fields: [violationId], references: [id])
  amount      Int
  status      Boolean   @default(false) // paid/unpaid
  issuedAt    DateTime  @default(now())
  payments    Payment[]

  @@map("fines")
}

model Payment {
  id          String   @id @default(uuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  fineId      String
  fine        Fine     @relation(fields: [fineId], references: [id])
  amount      Int
  paidAt      DateTime
  paidThrough String
  createdAt   DateTime @default(now())

  @@map("payments")
}
```

**Features:**

- Automatic fine generation from violations
- Multiple payment method support
- Payment history tracking
- Outstanding fine management

#### Incident & Complaint Management

```prisma
model Incident {
  id          String   @id @default(uuid())
  title       String
  description String?
  latitude    Float?
  longitude   Float?
  reportedBy  String?
  createdAt   DateTime @default(now())

  @@map("incidents")
}

model Complaint {
  id           String        @id @default(uuid())
  type         ComplaintType
  title        String
  description  String?
  latitude     Float?
  longitude    Float?
  complainerId String?
  createdAt    DateTime      @default(now())

  @@map("complaints")
}
```

**Features:**

- GPS-based incident reporting
- Categorized complaint system
- Anonymous reporting support
- Timestamp tracking for response times

#### Driver Reward System

```prisma
model DriverGem {
  driverId String @id
  driver   User   @relation(fields: [driverId], references: [id])
  amount   Int    @default(0)

  @@map("driver_gems")
}
```

**Features:**

- Reward system for good driving behavior
- Accumulated points tracking
- Integration with user profiles

enum UserStatus {
ACTIVE
SUSPENDED
BLOCKED
PENDING_VERIFICATION
}

````

### Vehicle Management
```prisma
model Vehicle {
  id                 String        @id @default(cuid())
  registrationNumber String        @unique
  chassisNumber      String        @unique
  engineNumber       String        @unique
  make               String
  model              String
  year               Int
  color              String?
  fuelType          FuelType      @default(PETROL)
  vehicleClass      VehicleClass
  ownershipType     OwnershipType @default(PERSONAL)
  status            VehicleStatus @default(ACTIVE)

  // Owner information
  ownerId           String
  owner             User          @relation(fields: [ownerId], references: [id])

  // Documents and compliance
  registrationDate  DateTime
  expiryDate        DateTime
  fitnessValidUntil DateTime?
  taxTokenValidUntil DateTime?

  // Relations
  insurancePolicies InsurancePolicy[]
  trackingData      VehicleTracking[]
  emergencies       Emergency[]
  inspections       VehicleInspection[]

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@map("vehicles")
}

enum FuelType {
  PETROL
  DIESEL
  CNG
  ELECTRIC
  HYBRID
}

enum VehicleClass {
  MOTORCYCLE
  CAR
  JEEP
  MICROBUS
  BUS
  TRUCK
  AMBULANCE
  FIRE_SERVICE
}

enum OwnershipType {
  PERSONAL
  COMMERCIAL
  GOVERNMENT
  RENTAL
}

enum VehicleStatus {
  ACTIVE
  SUSPENDED
  STOLEN
  SCRAPPED
  EXPORTED
}
````

### Driver Management

```prisma
model Driver {
  id            String        @id @default(cuid())
  licenseNumber String        @unique
  userId        String
  user          User          @relation(fields: [userId], references: [id])

  licenseClass  LicenseClass
  issueDate     DateTime
  expiryDate    DateTime
  issuingOffice String

  status        LicenseStatus @default(ACTIVE)
  restrictions  String[]      // Array of restriction codes

  // Medical and training
  medicalCertValidUntil DateTime?
  trainingCompleted     Boolean   @default(false)

  // Relations
  emergencies   Emergency[]
  violations    TrafficViolation[]

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("drivers")
}

enum LicenseClass {
  LEARNER
  NON_PROFESSIONAL
  PROFESSIONAL
  INTERNATIONAL
}

enum LicenseStatus {
  ACTIVE
  SUSPENDED
  REVOKED
  EXPIRED
  RENEWAL_PENDING
}
```

### Insurance Management

```prisma
model InsurancePolicy {
  id            String          @id @default(cuid())
  policyNumber  String          @unique
  vehicleId     String
  vehicle       Vehicle         @relation(fields: [vehicleId], references: [id])

  provider      String
  policyType    InsuranceType
  coverageAmount Decimal
  premium       Decimal

  startDate     DateTime
  endDate       DateTime
  status        PolicyStatus    @default(ACTIVE)

  // Relations
  claims        InsuranceClaim[]

  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  @@map("insurance_policies")
}

model InsuranceClaim {
  id            String        @id @default(cuid())
  claimNumber   String        @unique
  policyId      String
  policy        InsurancePolicy @relation(fields: [policyId], references: [id])

  incidentDate  DateTime
  claimAmount   Decimal
  approvedAmount Decimal?
  description   String

  status        ClaimStatus   @default(PENDING)
  documents     String[]      // Array of document URLs

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  @@map("insurance_claims")
}

enum InsuranceType {
  COMPREHENSIVE
  THIRD_PARTY
  COLLISION
  FIRE_THEFT
}

enum PolicyStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  SUSPENDED
}

enum ClaimStatus {
  PENDING
  INVESTIGATING
  APPROVED
  REJECTED
  SETTLED
}
```

### Emergency Management

```prisma
model Emergency {
  id          String        @id @default(cuid())
  reporterId  String
  reporter    User          @relation(fields: [reporterId], references: [id])

  type        EmergencyType
  severity    Severity      @default(MEDIUM)
  description String

  // Location
  latitude    Decimal
  longitude   Decimal
  address     String?

  // Optional relations
  vehicleId   String?
  vehicle     Vehicle?      @relation(fields: [vehicleId], references: [id])
  driverId    String?
  driver      Driver?       @relation(fields: [driverId], references: [id])

  status      EmergencyStatus @default(REPORTED)
  assignedTo  String?       // Emergency responder ID

  // Response tracking
  responseTime DateTime?
  resolvedAt   DateTime?

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@map("emergencies")
}

enum EmergencyType {
  ACCIDENT
  BREAKDOWN
  MEDICAL
  FIRE
  THEFT
  TRAFFIC_JAM
  ROAD_HAZARD
}

enum Severity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum EmergencyStatus {
  REPORTED
  DISPATCHED
  IN_PROGRESS
  RESOLVED
  CANCELLED
}
```

### Location and Tracking

```prisma
model VehicleTracking {
  id        String   @id @default(cuid())
  vehicleId String
  vehicle   Vehicle  @relation(fields: [vehicleId], references: [id])

  latitude  Decimal
  longitude Decimal
  speed     Decimal?
  heading   Decimal?

  timestamp DateTime @default(now())

  @@map("vehicle_tracking")
  @@index([vehicleId, timestamp])
}

model Location {
  id        String   @id @default(cuid())
  name      String
  type      LocationType
  latitude  Decimal
  longitude Decimal
  address   String

  // Service information
  contactNumber String?
  operatingHours String?
  services      String[]

  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("locations")
}

enum LocationType {
  HOSPITAL
  POLICE_STATION
  FIRE_STATION
  MECHANIC
  GAS_STATION
  PARKING
  TOLL_PLAZA
}
```

### Notifications

```prisma
model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])

  title     String
  message   String
  type      NotificationType
  priority  NotificationPriority @default(NORMAL)

  isRead    Boolean          @default(false)
  readAt    DateTime?

  // Optional metadata
  entityId  String?          // Related entity ID (vehicle, emergency, etc.)
  entityType String?         // Related entity type

  createdAt DateTime         @default(now())

  @@map("notifications")
  @@index([userId, isRead])
}

enum NotificationType {
  EMERGENCY_ALERT
  LICENSE_EXPIRY
  VEHICLE_REGISTRATION_EXPIRY
  INSURANCE_EXPIRY
  TRAFFIC_VIOLATION
  SYSTEM_MAINTENANCE
  GENERAL
}

enum NotificationPriority {
  LOW
  NORMAL
  HIGH
  URGENT
}
```

### Traffic Management

```prisma
model TrafficViolation {
  id            String    @id @default(cuid())
  violationCode String
  driverId      String
  driver        Driver    @relation(fields: [driverId], references: [id])

  vehicleId     String?
  location      String
  description   String
  fineAmount    Decimal

  violationDate DateTime
  status        ViolationStatus @default(PENDING)
  paidAt        DateTime?

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("traffic_violations")
}

enum ViolationStatus {
  PENDING
  PAID
  CONTESTED
  DISMISSED
}
```

## Database Relationships

### One-to-Many Relationships

- **User → Vehicle (Owner)**: One user can own multiple vehicles
- **User → Vehicle (Driver)**: One user can drive multiple vehicles
- **User → Payment**: One user can have multiple payments
- **PoliceStation → User**: One station can have multiple officers
- **PoliceStation → Camera**: One station can monitor multiple cameras
- **FireService → Camera**: One fire service can have multiple cameras
- **Vehicle → Violation**: One vehicle can have multiple violations
- **Rule → Violation**: One rule can be violated multiple times
- **Violation → Fine**: Each violation generates one fine
- **Fine → Payment**: One fine can have multiple payment attempts

### One-to-One Relationships

- **Violation ↔ Fine**: Each violation has exactly one fine
- **User ↔ DriverGem**: Each user has one driver gem record

### Optional Relationships

- **User → PoliceStation**: Only police officers are assigned to stations
- **Vehicle → User (Driver)**: Vehicles may not have assigned drivers
- **Camera → PoliceStation/FireService**: Cameras can be unassigned

## Database Indexes

### Primary Indexes

- All models use UUID primary keys with `@id @default(uuid())`

### Unique Indexes

- `User.email` (unique constraint)
- `Vehicle.plateNo` (unique plate numbers)
- `Rule.code` (unique rule codes)
- `Fine.violationId` (one fine per violation)

### Recommended Performance Indexes

```sql
-- User lookups
CREATE INDEX idx_user_role ON users(role);
CREATE INDEX idx_user_station ON users(station_id);

-- Vehicle queries
CREATE INDEX idx_vehicle_owner ON vehicles(owner_id);
CREATE INDEX idx_vehicle_driver ON vehicles(driver_id);
CREATE INDEX idx_vehicle_type ON vehicles(type);

-- Violation tracking
CREATE INDEX idx_violation_vehicle ON violations(vehicle_id);
CREATE INDEX idx_violation_rule ON violations(rule_id);
CREATE INDEX idx_violation_status ON violations(status);
CREATE INDEX idx_violation_created ON violations(created_at);

-- Geographic queries
CREATE INDEX idx_violation_location ON violations(latitude, longitude);
CREATE INDEX idx_camera_location ON cameras(latitude, longitude);
CREATE INDEX idx_incident_location ON incidents(latitude, longitude);

-- Payment tracking
CREATE INDEX idx_payment_user ON payments(user_id);
CREATE INDEX idx_payment_fine ON payments(fine_id);
CREATE INDEX idx_payment_date ON payments(paid_at);

-- Fine management
CREATE INDEX idx_fine_status ON fines(status);
CREATE INDEX idx_fine_issued ON fines(issued_at);
```

## Data Validation Rules

### Business Logic Constraints

1. **User Role Validation**:

   - Only POLICE users can be assigned to PoliceStation
   - Only users with DRIVER role can be assigned as vehicle drivers

2. **Vehicle Management**:

   - Plate numbers must be unique across all vehicles
   - Owner and driver must be different users (if driver is assigned)

3. **Violation Processing**:

   - Each violation must reference a valid rule and vehicle
   - Fines are automatically generated for violations
   - Payment amounts cannot exceed fine amounts

4. **Geographic Data**:
   - Latitude must be between -90 and 90
   - Longitude must be between -180 and 180

### Data Integrity Checks

```sql
-- Ensure positive amounts
ALTER TABLE fines ADD CONSTRAINT check_fine_amount
  CHECK (amount > 0);

ALTER TABLE payments ADD CONSTRAINT check_payment_amount
  CHECK (amount > 0);

-- Ensure valid coordinates
ALTER TABLE violations ADD CONSTRAINT check_violation_coords
  CHECK (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180);

-- Ensure driver gems are non-negative
ALTER TABLE driver_gems ADD CONSTRAINT check_gem_amount
  CHECK (amount >= 0);
```

## Migration Strategy

### Phase 1: Core Infrastructure (Implemented)

- ✅ User management with roles
- ✅ Police stations and fire services
- ✅ Basic vehicle registration
- ✅ Rule and violation framework

### Phase 2: Enhanced Features (Next)

- 🔄 Camera network integration
- 🔄 Real-time incident reporting
- 🔄 Advanced payment processing
- 🔄 Driver reward system implementation

### Phase 3: Advanced Analytics (Future)

- 📋 Traffic pattern analysis
- 📋 Violation trend reporting
- 📋 Emergency response optimization
- 📋 Performance dashboards

## Security Considerations

### Data Protection

- **Password Hashing**: User passwords should be hashed using bcrypt
- **PII Encryption**: Consider encrypting sensitive personal data
- **Audit Logging**: Track all data modifications with timestamps

### Access Control

- **Role-Based Access**: Implement proper role-based access control
- **Data Isolation**: Ensure users can only access relevant data
- **API Rate Limiting**: Prevent abuse of database queries

### Compliance

- **Data Retention**: Implement policies for data lifecycle management
- **Privacy Rights**: Support data export and deletion requests
- **Regulatory Compliance**: Ensure compliance with local data protection laws
