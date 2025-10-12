# 🚗 Nirapoth - নিরাপথ

<div align="center">

![Nirapoth Logo](./assets/logo.png)

**A comprehensive vehicle management and safety platform for Bangladesh**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

</div>

---

## 📖 Overview

**Nirapoth (নিরাপথ)** is a comprehensive vehicle management and safety platform designed specifically for the Bangladeshi market. The system provides solutions for vehicle registration, licensing, insurance management, emergency services, and public safety features.

### 🎯 Core Objectives

- **Vehicle Management**: Complete lifecycle management of vehicles from registration to disposal
- **Public Safety**: Emergency response system and safety monitoring
- **License Management**: Digital driver's license and vehicle registration
- **Insurance Integration**: Seamless insurance claim and policy management
- **Real-time Tracking**: GPS-based vehicle tracking and monitoring
- **Emergency Services**: Quick access to emergency services and accident reporting

---

## 🏗️ Project Structure

```
nirapoth-backend/
├── 📁 src/                          # Source code directory
│   ├── 📁 config/                   # Configuration files
│   ├── 📁 controllers/              # Request handlers and business logic
│   ├── 📁 middlewares/              # Express middleware functions
│   ├── 📁 routes/                   # API route definitions
│   ├── 📁 services/                 # Business logic and external API integrations
│   ├── 📁 types/                    # TypeScript type definitions
│   ├── 📁 utils/                    # Utility functions and helpers
│   └── 📄 index.ts                  # Application entry point
├── 📁 prisma/                       # Database schema and migrations
│   ├── 📁 migrations/               # Database migration files
│   └── 📄 schema.prisma             # Prisma database schema
├── 📁 scripts/                      # Setup and utility scripts
│   ├── 📄 setup-db.sh               # Database setup script (Linux/macOS)
│   └── 📄 setup-db.bat              # Database setup script (Windows)
├── 📁 docs/                         # Documentation files
│   ├── 📄 database-setup.md         # Detailed database setup guide
│   ├── 📄 database-schema.md        # Database schema documentation
│   ├── 📄 er-diagram.md             # Entity Relationship Diagram
│   └── 📄 api-documentation.md      # API endpoints documentation
├── 📁 assets/                       # Static assets (logos, images)
├── 📄 .env                          # Environment variables
├── 📄 .env.example                  # Environment variables template
├── 📄 .gitignore                    # Git ignore rules
├── 📄 package.json                  # Project dependencies and scripts
├── 📄 pnpm-lock.yaml               # Package lock file
├── 📄 tsconfig.json                # TypeScript configuration
└── 📄 README.md                     # Project documentation
```

---

## 🛠️ Technology Stack

### Backend Technologies

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Package Manager**: pnpm

### Development Tools

- **Process Manager**: tsx (for development)
- **Type Checking**: TypeScript
- **Code Quality**: ESLint, Prettier (to be configured)
- **Testing**: Jest (to be implemented)

---

## 🚀 Getting Started

### Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **pnpm** (Package manager)
- **Git**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd nirapoth-backend
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up PostgreSQL database**

   ```sql
   -- Connect to PostgreSQL as superuser and create database
   CREATE DATABASE nirapoth_db;
   CREATE USER nirapoth_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE nirapoth_db TO nirapoth_user;
   ```

   > 📋 **Quick Setup**: Use the automated setup script:
   >
   > - **Windows**: `scripts\setup-db.bat`
   > - **Linux/macOS**: `bash scripts/setup-db.sh`
   >
   > 📖 **Detailed Guide**: [docs/database-setup.md](./docs/database-setup.md)

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env file with your PostgreSQL connection details
   # DATABASE_URL="postgresql://nirapoth_user:your_password@localhost:5432/nirapoth_db"
   ```

5. **Initialize the database**

   ```bash
   pnpm run prisma:migrate
   pnpm run prisma:generate
   ```

6. **Start the development server**
   ```bash
   pnpm run dev
   ```

The server will start on `http://localhost:3000`

### 📝 Available Scripts

| Script                     | Description                              |
| -------------------------- | ---------------------------------------- |
| `pnpm run dev`             | Start development server with hot reload |
| `pnpm run build`           | Build the project for production         |
| `pnpm run start`           | Start production server                  |
| `pnpm run prisma:generate` | Generate Prisma client                   |
| `pnpm run prisma:migrate`  | Run database migrations                  |
| `pnpm run prisma:studio`   | Open Prisma Studio (Database GUI)        |
| `pnpm test`                | Run test suite                           |

---

## 📊 Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    %% User Management
    User {
        string id PK
        string name
        string phone
        string email UK
        string password
        UserRole role
        datetime createdAt
        datetime updatedAt
        string stationId FK
    }

    %% Emergency Services
    PoliceStation {
        string id PK
        string name
        string address
        float latitude
        float longitude
    }

    FireService {
        string id PK
        string name
        float latitude
        float longitude
    }

    %% Monitoring
    Camera {
        string id PK
        float latitude
        float longitude
        string streamUrl
        datetime installedAt
        string status
        string stationId FK
        string fireServiceId FK
    }

    %% Vehicle Management
    Vehicle {
        string id PK
        string type
        string plateNo UK
        string ownerId FK
        string driverId FK
        datetime registeredAt
    }

    %% Traffic Rules & Violations
    Rule {
        string id PK
        string code UK
        string description
        int penalty
    }

    Violation {
        string id PK
        string ruleId FK
        string vehicleId FK
        float latitude
        float longitude
        string description
        string status
        datetime createdAt
    }

    %% Financial Management
    Fine {
        string id PK
        string violationId FK
        int amount
        boolean status
        datetime issuedAt
    }

    Payment {
        string id PK
        string userId FK
        string fineId FK
        int amount
        datetime paidAt
        string paidThrough
        datetime createdAt
    }

    %% Incident Management
    Incident {
        string id PK
        string title
        string description
        float latitude
        float longitude
        string reportedBy
        datetime createdAt
    }

    Complaint {
        string id PK
        ComplaintType type
        string title
        string description
        float latitude
        float longitude
        string complainerId
        datetime createdAt
    }

    %% Driver Rewards
    DriverGem {
        string driverId PK,FK
        int amount
    }

    %% Relationships
    User ||--o{ Vehicle : "owns (ownerId)"
    User ||--o{ Vehicle : "drives (driverId)"
    User ||--o{ Payment : "makes"
    User ||--o| DriverGem : "has"
    User }o--|| PoliceStation : "assigned to"

    PoliceStation ||--o{ Camera : "monitors"
    FireService ||--o{ Camera : "monitors"

    Vehicle ||--o{ Violation : "commits"
    Rule ||--o{ Violation : "defines"
    Violation ||--|| Fine : "generates"
    Fine ||--o{ Payment : "receives"

    %% Enums
    UserRole {
        ADMIN
        POLICE
        DRIVER
        FIRE_SERVICE
        CITIZEN
    }

    ComplaintType {
        TRAFFIC
        INFRASTRUCTURE
    }
```

> 📋 **Detailed ER Diagram**: For a comprehensive view with relationship explanations, constraints, and architectural details, see [docs/er-diagram.md](./docs/er-diagram.md)

### Database Architecture Overview

```mermaid
graph TB
    subgraph "User Management"
        U[User] --> PS[PoliceStation]
        U --> DG[DriverGem]
    end

    subgraph "Vehicle System"
        U --> V[Vehicle - Owner]
        U -.-> V2[Vehicle - Driver]
        V --> VL[Violation]
        R[Rule] --> VL
    end

    subgraph "Financial System"
        VL --> F[Fine]
        F --> P[Payment]
        U --> P
    end

    subgraph "Emergency Services"
        PS --> C[Camera]
        FS[FireService] --> C
    end

    subgraph "Incident Management"
        I[Incident]
        CM[Complaint]
    end

    style U fill:#e1f5fe
    style V fill:#f3e5f5
    style VL fill:#ffebee
    style F fill:#fff3e0
    style PS fill:#e8f5e8
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
  // Relations with vehicles, payments, etc.
}

enum UserRole {
  ADMIN
  POLICE
  DRIVER
  FIRE_SERVICE
  CITIZEN
}
```

#### Vehicle & Traffic Management

```prisma
model Vehicle {
  id           String      @id @default(uuid())
  type         String
  plateNo      String      @unique
  ownerId      String
  driverId     String?
  registeredAt DateTime    @default(now())
  violations   Violation[]
}

model Violation {
  id          String   @id @default(uuid())
  ruleId      String
  vehicleId   String
  latitude    Float?
  longitude   Float?
  description String?
  status      String
  createdAt   DateTime @default(now())
}
```

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
}

model FireService {
  id        String   @id @default(uuid())
  name      String
  latitude  Float?
  longitude Float?
  cameras   Camera[]
}
```

#### Monitoring & Safety

```prisma
model Camera {
  id           String         @id @default(uuid())
  latitude     Float?
  longitude    Float?
  streamUrl    String
  installedAt  DateTime
  status       String
}

model Incident {
  id          String   @id @default(uuid())
  title       String
  description String?
  latitude    Float?
  longitude   Float?
  reportedBy  String?
  createdAt   DateTime @default(now())
}
```

### Key Features

- **🚔 Law Enforcement**: Police stations, violations, fines, and payments
- **🚒 Emergency Services**: Fire services with location tracking
- **📹 Monitoring**: Camera network for traffic surveillance
- **🚗 Vehicle Management**: Complete vehicle registration and tracking
- **💎 Driver Rewards**: Gem system for good driving behavior
- **📊 Incident Reporting**: Comprehensive incident and complaint system
- **💰 Payment Processing**: Fine payments and transaction tracking

---

## 🔌 API Endpoints

### Current Endpoints

#### Health Check

```http
GET /
```

**Response**: Server status and welcome message

#### User Management

```http
GET /users
```

**Response**: List of all users

```http
POST /users
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "User Name"
}
```

**Response**: Created user object

### Planned API Structure

```
/api/v1/
├── /auth/           # Authentication endpoints
├── /users/          # User management
├── /vehicles/       # Vehicle operations
├── /drivers/        # Driver management
├── /insurance/      # Insurance services
├── /emergency/      # Emergency services
├── /tracking/       # GPS tracking
└── /notifications/  # Notification system
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/nirapoth_db"

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration (to be implemented)
JWT_SECRET=your-secret-key
JWT_EXPIRE_TIME=24h

# External Services (to be configured)
SMS_API_KEY=your-sms-api-key
EMAIL_SERVICE_KEY=your-email-service-key
MAPS_API_KEY=your-maps-api-key
```

### TypeScript Configuration

The project uses modern TypeScript configuration with:

- **Target**: ES2022
- **Module**: ESNext
- **Module Resolution**: Bundler
- **Strict Mode**: Enabled
- **ES Module Interop**: Enabled

---

## 🔒 Security Features

### Planned Security Implementations

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control (RBAC)
- **Data Validation**: Input validation and sanitization
- **Rate Limiting**: API rate limiting
- **CORS**: Cross-origin resource sharing configuration
- **Encryption**: Sensitive data encryption
- **Audit Logging**: Comprehensive audit trails

---

## 🚀 Deployment

### Development

```bash
pnpm run dev
```

### Production Build

```bash
# Build the application
pnpm run build

# Run production migrations
pnpm run prisma:migrate:prod

# Start production server
pnpm run start
```

### Production Database Setup

For production deployment, ensure:

1. **PostgreSQL Server**: Set up a managed PostgreSQL instance
2. **Connection Pooling**: Configure connection pooling for better performance
3. **SSL**: Enable SSL connections for security
4. **Backup**: Set up automated database backups
5. **Monitoring**: Configure database monitoring and alerts

Example production DATABASE_URL:

```bash
DATABASE_URL="postgresql://username:password@prod-server:5432/nirapoth_production?sslmode=require&connection_limit=20"
```

### Docker (Planned)

```dockerfile
# Dockerfile configuration to be implemented
# Will include PostgreSQL connection setup
```

---

## 🧪 Testing

### Test Structure (To be implemented)

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data and fixtures
```

### Running Tests

```bash
pnpm test           # Run all tests
pnpm test:unit      # Run unit tests
pnpm test:e2e       # Run e2e tests
pnpm test:watch     # Run tests in watch mode
```

---

## 📚 Documentation

### API Documentation

- **Swagger/OpenAPI**: `/api/docs` (to be implemented)
- **Postman Collection**: Available in `/docs` folder

### Database Documentation

- **Prisma Studio**: Run `pnpm run prisma:studio` to explore database
- **ERD**: Entity Relationship Diagram in `/docs/database-schema.md`

---

## 🤝 Contributing

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Code Standards

- **TypeScript**: Use strict TypeScript
- **Naming**: Use camelCase for variables and functions, PascalCase for classes
- **Comments**: Write meaningful comments for complex logic
- **Testing**: Write tests for new features
- **Documentation**: Update documentation for API changes

---

## 📋 Roadmap

### Phase 1: Foundation (Current)

- ✅ Basic Express.js setup
- ✅ Prisma ORM integration
- ✅ TypeScript configuration
- ⏳ Authentication system
- ⏳ Basic API structure

### Phase 2: Core Features

- ⏳ Vehicle registration system
- ⏳ Driver management
- ⏳ Insurance integration
- ⏳ GPS tracking implementation

### Phase 3: Advanced Features

- ⏳ Emergency services
- ⏳ Real-time notifications
- ⏳ Mobile app integration
- ⏳ Analytics dashboard

### Phase 4: Production

- ⏳ Performance optimization
- ⏳ Security hardening
- ⏳ Monitoring and logging
- ⏳ Production deployment

---

## 📄 License

This project is licensed under the **ISC License**. See the [LICENSE](LICENSE) file for details.

---

## 👥 Team

**Development Team**

- Lead Developer: Muddasir Faiyaj

---

## 📞 Support

For support and questions:

- **Email**: support@nirapoth.com
- **Documentation**: [Project Wiki](wiki-url)
- **Issues**: [GitHub Issues](issues-url)

---

## 🙏 Acknowledgments

- **Bangladesh Road Transport Authority (BRTA)** for regulatory insights
- **Open Source Community** for amazing tools and libraries
- **Contributors** who help improve this project

---

<div align="center">

**Made with ❤️ for safer roads in Bangladesh**

[🌟 Star this project](repository-url) • [🐛 Report Bug](issues-url) • [💡 Request Feature](issues-url)

</div>
