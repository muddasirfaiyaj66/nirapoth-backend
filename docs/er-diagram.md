# Nirapoth Database Entity Relationship Diagram

## Full Schema Overview

```mermaid
erDiagram
    %% ================================
    %% USER MANAGEMENT SYSTEM
    %% ================================
    User {
        string id PK "UUID Primary Key"
        string name "Full Name"
        string phone "Phone Number"
        string email UK "Email Address (Unique)"
        string password "Hashed Password"
        UserRole role "User Role (Default: CITIZEN)"
        datetime createdAt "Account Creation Time"
        datetime updatedAt "Last Update Time"
        string stationId FK "Police Station ID (Optional)"
    }

    %% ================================
    %% EMERGENCY SERVICES
    %% ================================
    PoliceStation {
        string id PK "UUID Primary Key"
        string name "Station Name"
        string address "Station Address"
        float latitude "GPS Latitude"
        float longitude "GPS Longitude"
    }

    FireService {
        string id PK "UUID Primary Key"
        string name "Fire Service Name"
        float latitude "GPS Latitude"
        float longitude "GPS Longitude"
    }

    %% ================================
    %% MONITORING & SURVEILLANCE
    %% ================================
    Camera {
        string id PK "UUID Primary Key"
        float latitude "Camera GPS Latitude"
        float longitude "Camera GPS Longitude"
        string streamUrl "Live Stream URL"
        datetime installedAt "Installation Date"
        string status "Operational Status"
        string stationId FK "Police Station ID (Optional)"
        string fireServiceId FK "Fire Service ID (Optional)"
    }

    %% ================================
    %% VEHICLE MANAGEMENT
    %% ================================
    Vehicle {
        string id PK "UUID Primary Key"
        string type "Vehicle Type"
        string plateNo UK "License Plate (Unique)"
        string ownerId FK "Vehicle Owner ID"
        string driverId FK "Current Driver ID (Optional)"
        datetime registeredAt "Registration Date"
    }

    %% ================================
    %% TRAFFIC RULES & VIOLATIONS
    %% ================================
    Rule {
        string id PK "UUID Primary Key"
        string code UK "Rule Code (Unique)"
        string description "Rule Description"
        int penalty "Penalty Amount (Optional)"
    }

    Violation {
        string id PK "UUID Primary Key"
        string ruleId FK "Traffic Rule ID"
        string vehicleId FK "Vehicle ID"
        float latitude "Violation Location Latitude"
        float longitude "Violation Location Longitude"
        string description "Violation Description"
        string status "Violation Status"
        datetime createdAt "Violation Date/Time"
    }

    %% ================================
    %% FINANCIAL MANAGEMENT
    %% ================================
    Fine {
        string id PK "UUID Primary Key"
        string violationId FK "Violation ID (Unique)"
        int amount "Fine Amount"
        boolean status "Payment Status (false=unpaid)"
        datetime issuedAt "Fine Issue Date"
    }

    Payment {
        string id PK "UUID Primary Key"
        string userId FK "Payer User ID"
        string fineId FK "Fine ID"
        int amount "Payment Amount"
        datetime paidAt "Payment Date/Time"
        string paidThrough "Payment Method"
        datetime createdAt "Payment Record Creation"
    }

    %% ================================
    %% INCIDENT MANAGEMENT
    %% ================================
    Incident {
        string id PK "UUID Primary Key"
        string title "Incident Title"
        string description "Incident Description"
        float latitude "Incident Location Latitude"
        float longitude "Incident Location Longitude"
        string reportedBy "Reporter ID (Optional)"
        datetime createdAt "Report Date/Time"
    }

    Complaint {
        string id PK "UUID Primary Key"
        ComplaintType type "Complaint Category"
        string title "Complaint Title"
        string description "Complaint Description"
        float latitude "Complaint Location Latitude"
        float longitude "Complaint Location Longitude"
        string complainerId "Complainer ID (Optional)"
        datetime createdAt "Complaint Date/Time"
    }

    %% ================================
    %% GAMIFICATION & REWARDS
    %% ================================
    DriverGem {
        string driverId PK,FK "Driver User ID"
        int amount "Accumulated Gems"
    }

    %% ================================
    %% RELATIONSHIPS
    %% ================================

    %% User Relationships
    User ||--o{ Vehicle : "owns (ownerId)"
    User ||--o{ Vehicle : "drives (driverId)"
    User ||--o{ Payment : "makes payments"
    User ||--|| DriverGem : "has reward points"
    User }o--|| PoliceStation : "assigned to (if police)"

    %% Emergency Service Relationships
    PoliceStation ||--o{ Camera : "monitors via cameras"
    FireService ||--o{ Camera : "monitors via cameras"
    PoliceStation ||--o{ User : "has officers"

    %% Traffic Management Relationships
    Vehicle ||--o{ Violation : "commits violations"
    Rule ||--o{ Violation : "defines violation type"
    Violation ||--|| Fine : "generates fine"
    Fine ||--o{ Payment : "receives payments"

    %% ================================
    %% ENUMERATIONS
    %% ================================
    UserRole {
        ADMIN "System Administrator"
        POLICE "Police Officer"
        DRIVER "Licensed Driver"
        FIRE_SERVICE "Fire Service Personnel"
        CITIZEN "General Citizen"
    }

    ComplaintType {
        TRAFFIC "Traffic Related Issues"
        INFRASTRUCTURE "Road Infrastructure Issues"
    }
```

## Key Relationships Explained

### 1. User-Centric Design

- **Users** are at the center of the system with role-based access
- Can **own** multiple vehicles (1:N relationship)
- Can **drive** multiple vehicles (separate from ownership)
- Police officers are **assigned** to specific stations

### 2. Vehicle Management

- Each **Vehicle** has one owner but may have multiple drivers over time
- **Violations** are linked to both vehicles and traffic rules
- Automatic **Fine** generation for each violation

### 3. Emergency Services Network

- **Police Stations** and **Fire Services** manage camera networks
- GPS coordinates enable location-based emergency response
- Officers are assigned to specific stations

### 4. Financial Flow

- **Violations** → **Fines** → **Payments** (linear flow)
- Users can make multiple payments for single fines (partial payments)
- Complete audit trail for all financial transactions

### 5. Incident Reporting

- Anonymous incident and complaint reporting
- GPS-tagged for location awareness
- Categorized complaint system for better management

### 6. Gamification

- **DriverGem** system rewards good driving behavior
- One-to-one relationship with user accounts
- Accumulated points for incentivization

## Database Constraints

### Primary Keys

- All entities use UUID primary keys for better scalability
- UUIDs prevent ID conflicts in distributed systems

### Unique Constraints

- **Email addresses** must be unique across all users
- **Vehicle plate numbers** must be unique
- **Traffic rule codes** must be unique
- **One fine per violation** (unique constraint on violationId)

### Foreign Key Constraints

- All relationships enforced at database level
- Cascade delete policies for data integrity
- Optional relationships allow for flexible data models

### Data Validation

- GPS coordinates validated for realistic ranges
- Positive amounts for fines and payments
- Enum constraints for user roles and complaint types
