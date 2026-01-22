# 🏦 Kenels Bureau - Loan Management System

> **Redesigning Finance** - A modern, secure, and scalable loan management platform

<!-- Deployment: 2024-12-22 -->

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue.svg)

---

## 📖 Overview

Kenels Bureau LMS is a comprehensive loan management system designed for modern financial institutions. Built with enterprise-grade security, scalability, and user experience in mind.

### Key Features

- ✅ **Complete Loan Lifecycle Management** - From application to closure
- 🔐 **Enterprise Security** - JWT authentication, RBAC, PII encryption
- 📊 **Advanced Reporting** - Portfolio analytics, aging analysis, PAR calculations
- 🎨 **Modern UI/UX** - Notion/Stripe-inspired design system
- 📱 **Customer Portal** - Self-service loan tracking and applications
- 🔄 **Maker-Checker Workflow** - Dual approval for sensitive operations
- 📈 **Credit Scoring** - Manual assessment with audit trails
- 💰 **Flexible Repayment** - Multiple channels with automatic allocation

---

## 🏗️ Architecture

### Tech Stack

#### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Authentication**: Passport.js + JWT
- **API Documentation**: Swagger/OpenAPI

#### Frontend
- **Framework**: React 18+ (Vite)
- **UI Library**: Shadcn/UI + Tailwind CSS
- **State Management**: TanStack Query + Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Project Structure

```
kenels-lms/
├── backend/                 # NestJS API
│   ├── prisma/             # Database schema & migrations
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── clients/        # Client management
│   │   ├── loan-products/  # Product configuration
│   │   ├── applications/   # Loan applications
│   │   ├── loans/          # Loan management
│   │   ├── repayments/     # Repayment processing
│   │   ├── documents/      # Document management
│   │   ├── scoring/        # Credit scoring
│   │   ├── reports/        # Analytics & reporting
│   │   └── common/         # Shared utilities
│   └── test/               # Tests
├── frontend/               # React application
│   ├── src/
│   │   ├── app/           # App shell & routing
│   │   ├── features/      # Feature modules
│   │   ├── components/    # Shared components
│   │   ├── lib/           # Utilities & API client
│   │   └── stores/        # State management
│   └── public/            # Static assets
└── docs/                  # Documentation
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- pnpm (recommended) or npm
- Docker (optional, for local database)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd kenels-lms
```

2. **Setup Backend**
```bash
cd backend

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Start PostgreSQL (using Docker)
docker-compose up -d

# Run database migrations
pnpm prisma:migrate

# Seed database with sample data
pnpm prisma:seed

# Start development server
pnpm dev
```

Backend will be available at `http://localhost:3000`  
API Documentation at `http://localhost:3000/api/docs`

3. **Setup Frontend**
```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Frontend will be available at `http://localhost:5173`

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kenels_lms"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Application
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"

# File Storage
STORAGE_TYPE="local"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

See `.env.example` for complete configuration options.

---

## 📚 Documentation

### Core Documentation
- [Master Project Plan](./PROJECT_MASTER_PLAN.md) - Complete implementation blueprint
- [Database Schema](./backend/prisma/schema.prisma) - Full database structure
- [API Guidelines](./docs/KENELS_API_GUIDELINES.md) - API standards
- [Engineering Rules](./docs/KENELS_LMS_ENGINEERING_RULES.md) - Development standards

### Design Documentation
- [UX Guidelines](./docs/KENELS_UX_GUIDELINES.md) - Design system
- [Component Library](./docs/KENELS_COMPONENT_LIBRARY.md) - UI components
- [Sitemap](./docs/KENELS_SITEMAP_FRONTEND.md) - Frontend structure

### Technical Documentation
- [Domain Model](./docs/KENELS_DOMAIN_MODEL.md) - Business logic
- [Flowcharts](./docs/KENELS_FLOWCHARTS.md) - Process flows
- [Engineering Checklist](./docs/KENELS_ENGINEERING_CHECKLIST.md) - Quality gates

---

## 🧪 Testing

### Backend Tests
```bash
cd backend

# Unit tests
pnpm test

# E2E tests
pnpm test:e2e

# Test coverage
pnpm test:cov
```

### Frontend Tests
```bash
cd frontend

# Run tests
pnpm test

# Test coverage
pnpm test:cov
```

---

## 🏗️ Database Management

### Prisma Commands
```bash
# Generate Prisma Client
pnpm prisma:generate

# Create migration
pnpm prisma:migrate

# Apply migrations (production)
pnpm prisma:migrate:prod

# Open Prisma Studio
pnpm prisma:studio

# Reset database (development only)
pnpm prisma:reset
```

---

## 🔐 Security

### Authentication Flow
1. User logs in with credentials
2. Backend validates and returns:
   - Access token (15min, stored in memory)
   - Refresh token (7d, httpOnly cookie)
3. Frontend auto-refreshes tokens before expiry
4. All protected routes require valid JWT

### Authorization
- **Role-Based Access Control (RBAC)**
- Roles: Admin, Credit Officer, Finance Officer, Client
- Guards on all protected endpoints
- Resource-level permissions

### Data Protection
- PII fields encrypted at rest
- Passwords hashed with Argon2
- File upload validation & virus scanning
- Audit logging for all sensitive operations

---

## 📊 Key Modules

### 1. Client Management
- Complete client profiles
- KYC verification workflow
- Document management
- Client history tracking

### 2. Loan Products
- Flexible product configuration
- Version control for product rules
- Interest rate management
- Fee and penalty configuration

### 3. Loan Applications
- Multi-step application wizard
- State machine workflow
- Document upload and verification
- Credit assessment integration

### 4. Credit Scoring
- Manual scorecard entry
- Maker-checker approval
- Score history tracking
- Audit trail

### 5. Loan Management
- Schedule generation (Flat/Declining)
- Amortization calculations
- Status tracking
- Document management

### 6. Repayment Processing
- Multiple payment channels
- Automatic allocation logic
- Receipt generation
- Maker-checker for reversals

### 7. Reporting & Analytics
- Portfolio overview
- Aging analysis (DPD buckets)
- PAR calculations
- Export to CSV/Excel

### 8. Customer Portal
- Self-service dashboard
- Loan status tracking
- Repayment history
- Statement downloads

---

## 🚢 Deployment

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Security audit completed

### Build Commands
```bash
# Backend
cd backend
pnpm build
pnpm start:prod

# Frontend
cd frontend
pnpm build
# Serve dist/ folder with nginx or similar
```

---

## 🤝 Contributing

### Development Workflow
1. Create feature branch from `main`
2. Make changes following coding standards
3. Write/update tests
4. Update documentation
5. Submit pull request
6. Pass CI/CD checks
7. Code review approval
8. Merge to main

### Coding Standards
- TypeScript strict mode
- ESLint + Prettier configured
- No `any` types without justification
- Comprehensive error handling
- Meaningful commit messages

---

## 📞 Support

### Issue Reporting
- **Critical**: System down, data loss (1 hour response)
- **High**: Major feature broken (4 hours response)
- **Medium**: Minor issues (24 hours response)
- **Low**: Enhancement requests (1 week response)

### Contact
- Email: support@kenelsbureau.com
- Documentation: [docs.kenelsbureau.com](https://docs.kenelsbureau.com)

---

## 📄 License

Proprietary - © 2024 Kenels Bureau. All rights reserved.

---

## 🎯 Roadmap

### Phase 1: Foundation ✅
- [x] Project structure
- [x] Database schema
- [ ] Authentication module
- [ ] Basic CRUD operations

### Phase 2: Core Modules (In Progress)
- [ ] Client management
- [ ] Loan products
- [ ] Application workflow
- [ ] Document management

### Phase 3: Loan Lifecycle
- [ ] Credit scoring
- [ ] Loan creation
- [ ] Schedule engine
- [ ] Disbursement

### Phase 4: Repayments
- [ ] Repayment posting
- [ ] Allocation engine
- [ ] Receipt generation

### Phase 5: Reporting
- [ ] Portfolio analytics
- [ ] Aging reports
- [ ] Export functionality

### Phase 6: Customer Portal
- [ ] Portal authentication
- [ ] Client dashboard
- [ ] Self-service features

---

## 🙏 Acknowledgments

Built with modern best practices and inspired by:
- Stripe's API design
- Notion's UX principles
- Microsoft Fluent design system

---

**Kenels Bureau** - *Redesigning Finance*
