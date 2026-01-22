# 🏦 KENELS BUREAU LMS - MASTER PROJECT PLAN
**Loan Management System - Complete Implementation Blueprint**  
*Generated: November 2024*

---

## 📋 PROJECT OVERVIEW

### Mission
Build a professional, secure, and scalable Loan Management System with a modern minimalistic UI (Notion/Stripe style) handling the complete loan lifecycle from application to repayment.

### Tech Stack
- **Backend**: NestJS (TypeScript) + Prisma ORM
- **Frontend**: React 18+ (Vite + TypeScript)
- **Database**: PostgreSQL
- **UI**: Tailwind CSS + Shadcn/UI
- **Auth**: Passport.js + JWT
- **State Management**: TanStack Query + Zustand
- **Forms**: React Hook Form + Zod

---

## 🎯 CORE FEATURES

### 1. Authentication & Authorization
- JWT-based authentication (Access + Refresh tokens)
- Role-Based Access Control (RBAC)
- Roles: Admin, Credit Officer, Finance Officer, Client
- Password hashing with Argon2
- Session management

### 2. Client Management
- Complete client profiles (Bio, Employer, Referees, Next of Kin)
- Document management
- Client history tracking
- KYC status management

### 3. Loan Products
- Flexible product configuration
- Product versioning system
- JSONB-based rule parameters
- Interest rates, penalties, grace periods
- Min/Max amounts and terms

### 4. Loan Applications
- Multi-step application wizard
- State machine workflow: Draft → Submitted → Under Review → Approved/Rejected
- Document upload and verification
- Progress tracking
- PDF generation for application summaries

### 5. Credit Scoring & Maker-Checker
- Manual scorecard entry
- Credit assessment workflow
- Maker-Checker approval process
- Comprehensive audit logging

### 6. Loan Disbursement & Management
- Loan creation from approved applications
- Schedule generation (Flat/Declining balance)
- Amortization calculations
- Loan status tracking

### 7. Repayment Management
- Manual repayment posting
- Automatic allocation (Principal → Interest → Fees → Penalties)
- Repayment history
- Receipt generation

### 8. Schedule Engine
- Automated schedule generation
- Multiple calculation methods
- Installment tracking
- Overdue detection

### 9. Reporting & Analytics
- Portfolio overview
- Aging analysis (DPD buckets)
- Disbursement reports
- Repayment reports
- PAR (Portfolio at Risk) calculations
- Export to CSV/Excel

### 10. Customer Portal
- Client-specific dashboard
- Loan status tracking
- Repayment history
- Statement downloads
- Self-service application

---

## 🗄️ DATABASE ARCHITECTURE

### UUID Strategy
All primary keys use UUID v4 for:
- Security (non-sequential)
- Distributed system compatibility
- Merge safety across environments

### Migration Strategy
- **Local Development**: Auto-migrations with Prisma
- **Production**: Manual migration review and approval
- All migrations are reversible
- Backup before every production migration

### Key Tables

#### Users & Auth
- `users` - System users with roles
- `refresh_tokens` - JWT refresh token management

#### Clients
- `clients` - Core client information
- `client_next_of_kin` - Emergency contacts
- `client_referees` - References
- `client_documents` - Document storage

#### Products
- `loan_products` - Product definitions
- `loan_product_versions` - Versioned product rules

#### Applications
- `loan_applications` - Application records
- `application_documents` - Application attachments
- `credit_scores` - Credit assessment data

#### Loans
- `loans` - Active loans
- `loan_schedules` - Installment schedules
- `loan_documents` - Loan-related documents

#### Repayments
- `repayments` - Payment records
- `repayment_allocations` - Payment distribution

#### Audit
- `audit_logs` - Complete audit trail

---

## 🏗️ BACKEND ARCHITECTURE

### Module Structure
```
src/
├── auth/                    # Authentication & Authorization
│   ├── strategies/          # JWT, Local strategies
│   ├── guards/              # Auth guards, RBAC
│   ├── decorators/          # @Roles(), @CurrentUser()
│   └── dto/                 # Login, Register DTOs
├── clients/                 # Client Management
│   ├── entities/
│   ├── dto/
│   └── services/
├── loan-products/           # Product Configuration
│   ├── entities/
│   ├── dto/
│   └── services/
├── applications/            # Loan Applications
│   ├── entities/
│   ├── dto/
│   ├── services/
│   └── workflows/           # State machine
├── loans/                   # Loan Management
│   ├── entities/
│   ├── dto/
│   ├── services/
│   └── engines/             # Schedule engine
├── repayments/              # Repayment Processing
│   ├── entities/
│   ├── dto/
│   ├── services/
│   └── allocators/          # Payment allocation logic
├── documents/               # Document Management
│   ├── services/
│   ├── storage/             # Local/S3 abstraction
│   └── validators/          # File validation, virus scan
├── scoring/                 # Credit Scoring
│   ├── entities/
│   ├── dto/
│   └── services/
├── reports/                 # Analytics & Reporting
│   ├── services/
│   └── generators/          # PDF, Excel generators
├── audit/                   # Audit Logging
│   ├── entities/
│   └── services/
├── common/                  # Shared utilities
│   ├── filters/             # Exception filters
│   ├── interceptors/        # Logging, transform
│   ├── pipes/               # Validation pipes
│   └── decorators/
└── prisma/                  # Database
    ├── schema.prisma
    ├── migrations/
    └── seed.ts
```

### Key Services

#### Schedule Engine
- Calculates amortization schedules
- Supports flat and declining balance methods
- Handles grace periods
- Generates installment breakdown

#### Repayment Allocator
- Applies payments to oldest due first
- Allocates: Penalties → Fees → Interest → Principal
- Updates schedule items
- Maintains audit trail

#### State Machine (Applications)
- Enforces valid state transitions
- Triggers events on state changes
- Maintains history

---

## 🎨 FRONTEND ARCHITECTURE

### Project Structure
```
src/
├── app/                     # App shell & routing
│   ├── layouts/             # Admin, Portal layouts
│   └── routes/              # Route definitions
├── features/                # Feature modules
│   ├── auth/
│   ├── dashboard/
│   ├── clients/
│   ├── applications/
│   ├── loans/
│   ├── repayments/
│   ├── products/
│   ├── reports/
│   └── portal/              # Customer portal
├── components/              # Shared components
│   ├── ui/                  # Shadcn components
│   ├── forms/               # Form components
│   ├── tables/              # Data tables
│   ├── charts/              # Chart components
│   └── layouts/             # Layout components
├── lib/                     # Utilities
│   ├── api/                 # API client
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Helper functions
│   └── validations/         # Zod schemas
├── stores/                  # Zustand stores
│   ├── auth.store.ts
│   ├── theme.store.ts
│   └── ui.store.ts
└── assets/                  # Static assets
    ├── logos/
    └── icons/
```

### Design System Implementation

#### Color Palette
```typescript
// Light Mode
primary: '#05a54e'      // Kenels Green
primaryDark: '#0D3B27'  // Deep Green
background: '#F9FAFB'   // App background
surface: '#FFFFFF'      // Cards
border: 'rgba(15, 23, 42, 0.08)'
textPrimary: '#1F2937'
textSecondary: '#4B5563'

// Status Colors
success: '#16A34A'
warning: '#F59E0B'
danger: '#EF4444'
info: '#3B82F6'

// Dark Mode
background: '#0E131A'
surface: '#111827'
surfaceElevated: '#1F2937'
border: 'rgba(15, 23, 42, 0.6)'
```

#### Typography
- **Headings**: Playfair Display / Lora (500-600)
- **Body**: Inter / DM Sans (14-16px, 400-500)
- **Numbers**: Tabular nums, monospace

#### Spacing
- Base unit: 4px
- Common: 4, 8, 12, 16, 24, 32px
- Card padding: 16-24px
- Page gutters: 24-32px

---

## 🔐 SECURITY IMPLEMENTATION

### Authentication Flow
1. User submits credentials
2. Backend validates and returns access token (15min) + refresh token (7d)
3. Access token stored in memory
4. Refresh token in httpOnly cookie
5. Auto-refresh before expiry

### Authorization
- Guards on all protected routes
- Role-based decorators: `@Roles('admin', 'credit_officer')`
- Resource-level permissions
- Audit all sensitive actions

### Data Protection
- PII fields encrypted at rest (ID numbers, phone numbers)
- Passwords hashed with Argon2
- Secure file uploads with validation
- Virus scanning hooks (ClamAV integration ready)
- Signed URLs for document access

### API Security
- Rate limiting (Throttler)
- CORS configuration
- Helmet for security headers
- Input validation on all endpoints
- SQL injection prevention (Prisma ORM)

---

## 📊 REPORTING SYSTEM

### Portfolio Dashboard
- Total outstanding
- Active loans count
- Disbursed this month
- Overdue amount
- Trend indicators

### Aging Analysis
- DPD buckets: Current, 1-7, 8-30, 31-60, 61-90, >90
- Amount and count per bucket
- PAR calculations
- Visual charts

### Disbursement Reports
- By product
- By officer
- By date range
- Export capabilities

### Repayment Reports
- Collection efficiency
- Payment methods
- Officer performance
- Export capabilities

---

## 🧪 TESTING STRATEGY

### Backend Tests
- **Unit Tests**: Services, utilities, calculators
- **Integration Tests**: API endpoints, database operations
- **E2E Tests**: Complete workflows (application → approval → disbursement → repayment)

### Critical Test Cases
- Loan schedule generation accuracy
- Repayment allocation correctness
- State machine transitions
- Permission enforcement
- Financial calculations (interest, penalties)

### Frontend Tests
- Component unit tests (Vitest)
- Form validation tests
- Integration tests for critical flows
- Accessibility tests

---

## 🚀 DEPLOYMENT STRATEGY

### Environments
1. **Local Development**
   - Docker Compose for PostgreSQL
   - Hot reload enabled
   - Seed data for testing

2. **Staging**
   - Mirrors production
   - Synthetic data
   - Full integration testing

3. **Production**
   - Managed PostgreSQL
   - CDN for frontend
   - Automated backups
   - Monitoring and alerts

### CI/CD Pipeline
1. Code push to Git
2. Linting and type checking
3. Unit tests
4. Integration tests
5. Build artifacts
6. Deploy to staging
7. Manual approval for production
8. Deploy to production
9. Health checks
10. Rollback capability

---

## 📅 IMPLEMENTATION PHASES

### Phase 1: Foundation (Weeks 1-2)
- [x] Project structure
- [ ] Database schema
- [ ] Auth module
- [ ] Basic CRUD for users
- [ ] Frontend shell
- [ ] Login/Register UI

### Phase 2: Core Modules (Weeks 3-5)
- [ ] Client management
- [ ] Loan products
- [ ] Document management
- [ ] Basic dashboards

### Phase 3: Loan Lifecycle (Weeks 6-8)
- [ ] Application workflow
- [ ] Credit scoring
- [ ] Maker-checker
- [ ] Schedule engine
- [ ] Loan creation

### Phase 4: Repayments (Weeks 9-10)
- [ ] Repayment posting
- [ ] Allocation engine
- [ ] Schedule updates
- [ ] Receipt generation

### Phase 5: Reporting (Weeks 11-12)
- [ ] Portfolio reports
- [ ] Aging analysis
- [ ] Export functionality
- [ ] Charts and visualizations

### Phase 6: Customer Portal (Weeks 13-14)
- [ ] Portal authentication
- [ ] Client dashboard
- [ ] Loan viewing
- [ ] Statement downloads

### Phase 7: Polish & Launch (Weeks 15-16)
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] User training
- [ ] Production deployment

---

## 🔧 DEVELOPMENT SETUP

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- pnpm (package manager)
- Git

### Local Setup
```bash
# Clone repository
git clone <repo-url>
cd kenels-lms

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env

# Start PostgreSQL (Docker)
docker-compose up -d

# Run migrations
pnpm prisma:migrate

# Seed database
pnpm prisma:seed

# Start backend
cd backend
pnpm dev

# Start frontend (new terminal)
cd frontend
pnpm dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/kenels_lms"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="your-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# App
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"

# File Storage
STORAGE_TYPE="local" # or "s3"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760 # 10MB

# Optional: S3
AWS_REGION=""
AWS_BUCKET=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
```

---

## 📖 API DOCUMENTATION

### Base URL
- Development: `http://localhost:3000/api/v1`
- Production: `https://api.kenelsbureau.com/api/v1`

### Authentication
All protected endpoints require Bearer token:
```
Authorization: Bearer <access_token>
```

### Standard Response Format
```json
{
  "status": "success",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

## 🎯 SUCCESS METRICS

### Technical Metrics
- API response time < 200ms (p95)
- Frontend load time < 2s
- Test coverage > 80%
- Zero critical security vulnerabilities

### Business Metrics
- Loan processing time < 24 hours
- System uptime > 99.5%
- User satisfaction > 4.5/5
- Zero data loss incidents

---

## 📝 DOCUMENTATION DELIVERABLES

1. **Technical Documentation**
   - API documentation (Swagger)
   - Database schema documentation
   - Architecture decision records (ADRs)
   - Deployment guides

2. **User Documentation**
   - Admin user manual
   - Officer workflows
   - Customer portal guide
   - FAQ

3. **Developer Documentation**
   - Setup guide
   - Contributing guidelines
   - Code style guide
   - Testing guide

---

## 🚨 RISK MITIGATION

### Technical Risks
- **Database performance**: Implement indexing strategy, query optimization
- **Data loss**: Automated backups, point-in-time recovery
- **Security breaches**: Regular audits, penetration testing
- **Scalability**: Horizontal scaling plan, caching strategy

### Business Risks
- **Regulatory compliance**: Legal review, data protection compliance
- **User adoption**: Training programs, intuitive UX
- **Data migration**: Comprehensive migration plan, rollback strategy

---

## ✅ ACCEPTANCE CRITERIA

### Before Production Launch
- [ ] All critical features implemented and tested
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] User training completed
- [ ] Backup and recovery tested
- [ ] Monitoring and alerting configured
- [ ] Legal and compliance review passed
- [ ] Disaster recovery plan documented
- [ ] Support processes established

---

## 📞 SUPPORT & MAINTENANCE

### Support Tiers
1. **Critical**: System down, data loss (Response: 1 hour)
2. **High**: Major feature broken (Response: 4 hours)
3. **Medium**: Minor issues (Response: 24 hours)
4. **Low**: Enhancement requests (Response: 1 week)

### Maintenance Windows
- Weekly: Sunday 2:00 AM - 4:00 AM EAT
- Monthly: First Sunday 2:00 AM - 6:00 AM EAT

---

## 🎓 TRAINING PLAN

### Admin Training (2 days)
- System overview
- User management
- Product configuration
- Report generation

### Officer Training (3 days)
- Client management
- Application processing
- Credit assessment
- Repayment posting

### Customer Portal (1 hour)
- Self-service features
- Loan tracking
- Statement downloads

---

**Project Status**: Planning Complete ✅  
**Next Step**: Initialize project structure and begin Phase 1 implementation

---

*This document is the single source of truth for the Kenels Bureau LMS project.*
