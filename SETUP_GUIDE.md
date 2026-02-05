# 🚀 Kenels Bureau LMS - Complete Setup Guide

This guide will walk you through setting up the Kenels Bureau Loan Management System from scratch.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)
8. [Next Steps](#next-steps)

---

## Prerequisites

### Required Software

1. **Node.js** (v20 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **pnpm** (Package Manager)
   ```bash
   npm install -g pnpm
   ```
   - Verify: `pnpm --version`

3. **PostgreSQL** (v15 or higher)
   - Option A: Install locally from [postgresql.org](https://www.postgresql.org/download/)
   - Option B: Use Docker (recommended for development)

4. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify: `git --version`

5. **Docker** (Optional but recommended)
   - Download from [docker.com](https://www.docker.com/)
   - Verify: `docker --version`

### Recommended Tools

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Prisma
  - Tailwind CSS IntelliSense
- **Postman** or **Insomnia** for API testing
- **TablePlus** or **pgAdmin** for database management

---

## Initial Setup

### 1. Clone or Navigate to Project

```bash
cd C:\Users\DenisMakokha\CascadeProjects\kenels-lms
```

### 2. Project Structure Verification

Ensure you have the following structure:
```
kenels-lms/
├── backend/
├── frontend/
├── docs/
├── README.md
└── PROJECT_MASTER_PLAN.md
```

---

## Backend Setup

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages including:
- NestJS framework
- Prisma ORM
- Passport.js for authentication
- And all other dependencies

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/kenels_lms?schema=public"

# JWT Secrets (CHANGE THESE IN PRODUCTION!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
REFRESH_TOKEN_SECRET="your-super-secret-refresh-token-key-change-this"

# Application
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"

# File Storage
STORAGE_TYPE="local"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
```

### 4. Start PostgreSQL Database

#### Option A: Using Docker (Recommended)

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify containers are running
docker ps
```

#### Option B: Local PostgreSQL

If you installed PostgreSQL locally:
1. Start PostgreSQL service
2. Create database:
```sql
CREATE DATABASE kenels_lms;
```

### 5. Run Database Migrations

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run migrations to create tables
pnpm prisma:migrate

# Seed database with initial data
pnpm prisma:seed
```

### 6. Verify Database Setup

```bash
# Open Prisma Studio to view database
pnpm prisma:studio
```

This will open a browser at `http://localhost:5555` where you can view your database tables.

---

## Frontend Setup

### 1. Navigate to Frontend Directory

```bash
# From project root
cd frontend
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install:
- React 18
- Vite
- Tailwind CSS
- Shadcn/UI components
- TanStack Query
- And all other dependencies

### 3. Copy Logos

Copy the logo files from your documentation folder:

```bash
# Create assets directory
mkdir -p src/assets/logos

# Copy logos (adjust path as needed)
cp C:\Users\DenisMakokha\Documents\Loan-System\Light.svg src/assets/logos/
cp C:\Users\DenisMakokha\Documents\Loan-System\Dark.svg src/assets/logos/
```

### 4. Verify Configuration

Check that `vite.config.ts` has the correct proxy settings:

```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

---

## Running the Application

### 1. Start Backend Server

```bash
# From backend directory
cd backend
pnpm dev
```

You should see:
```
[Nest] Application successfully started
[Nest] Listening on http://localhost:3000
```

**API Documentation**: http://localhost:3000/api/docs

### 2. Start Frontend Server

Open a **new terminal** window:

```bash
# From frontend directory
cd frontend
pnpm dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 3. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/api/docs
- **Prisma Studio**: http://localhost:5555 (run `pnpm prisma:studio`)

---

## Database Setup

### Understanding the Schema

The database uses UUID primary keys for all tables. Key modules include:

1. **Users & Authentication**
   - `users` - System users
   - `refresh_tokens` - JWT refresh tokens

2. **Clients**
   - `clients` - Client profiles
   - `client_next_of_kin` - Emergency contacts
   - `client_referees` - References
   - `client_documents` - Uploaded documents

3. **Loan Products**
   - `loan_products` - Product definitions
   - `loan_product_versions` - Versioned product rules

4. **Applications**
   - `loan_applications` - Application records
   - `application_documents` - Application attachments
   - `credit_scores` - Credit assessments

5. **Loans**
   - `loans` - Active loans
   - `loan_schedules` - Installment schedules
   - `loan_documents` - Loan documents

6. **Repayments**
   - `repayments` - Payment records
   - `repayment_allocations` - Payment distribution

7. **Audit**
   - `audit_logs` - Complete audit trail

### Seeding Sample Data

The seed script will create:
- Admin user (admin@example.com / <SET_DURING_SEEDING>)
- Sample clients
- Loan products
- Sample applications

```bash
cd backend
pnpm prisma:seed
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Port 3000 is already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env
PORT=3001
```

#### 2. Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
- Verify PostgreSQL is running: `docker ps` or check local service
- Check DATABASE_URL in `.env`
- Ensure database exists: `CREATE DATABASE kenels_lms;`

#### 3. Prisma Client Not Generated

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
cd backend
pnpm prisma:generate
```

#### 4. Migration Failed

**Error**: `Migration failed to apply`

**Solution**:
```bash
# Reset database (DEVELOPMENT ONLY)
pnpm prisma:reset

# Or manually fix and rerun
pnpm prisma:migrate
```

#### 5. Frontend Build Errors

**Error**: `Module not found` or TypeScript errors

**Solution**:
```bash
cd frontend
rm -rf node_modules
pnpm install
```

#### 6. CORS Errors

**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
- Check FRONTEND_URL in backend `.env`
- Verify CORS configuration in backend `main.ts`

---

## Next Steps

### 1. Explore the Application

- Login with seeded admin credentials
- Navigate through different modules
- Test creating clients, products, applications

### 2. Review Documentation

- Read [PROJECT_MASTER_PLAN.md](./PROJECT_MASTER_PLAN.md)
- Study the database schema in `backend/prisma/schema.prisma`
- Review API documentation at http://localhost:3000/api/docs

### 3. Start Development

#### Backend Development
- Create new modules in `backend/src/`
- Follow NestJS module structure
- Write tests for new features
- Update Prisma schema as needed

#### Frontend Development
- Create components in `frontend/src/components/`
- Build feature modules in `frontend/src/features/`
- Follow the design system guidelines
- Use Shadcn/UI components

### 4. Testing

```bash
# Backend tests
cd backend
pnpm test

# Frontend tests
cd frontend
pnpm test
```

### 5. Code Quality

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm type-check
```

---

## Development Workflow

### Daily Development

1. **Start Services**
```bash
# Terminal 1: Database
cd backend
docker-compose up -d

# Terminal 2: Backend
pnpm dev

# Terminal 3: Frontend
cd frontend
pnpm dev
```

2. **Make Changes**
- Edit code in your IDE
- Changes auto-reload (hot reload enabled)

3. **Test Changes**
- Backend: http://localhost:3000
- Frontend: http://localhost:5173
- API Docs: http://localhost:3000/api/docs

4. **Commit Changes**
```bash
git add .
git commit -m "feat: description of changes"
git push
```

### Database Changes

1. **Modify Schema**
```bash
# Edit backend/prisma/schema.prisma
```

2. **Create Migration**
```bash
pnpm prisma:migrate
# Enter migration name when prompted
```

3. **Generate Client**
```bash
pnpm prisma:generate
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update environment variables for production
- [ ] Change JWT secrets to strong random values
- [ ] Configure production database
- [ ] Set up SSL certificates
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Run security audit
- [ ] Test all critical flows

### Build Commands

```bash
# Backend
cd backend
pnpm build
pnpm start:prod

# Frontend
cd frontend
pnpm build
# Deploy dist/ folder to CDN or static hosting
```

---

## Getting Help

### Resources

- **Documentation**: See `docs/` folder
- **API Reference**: http://localhost:3000/api/docs
- **Database Schema**: `backend/prisma/schema.prisma`
- **Project Plan**: `PROJECT_MASTER_PLAN.md`

### Common Commands Reference

```bash
# Backend
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm prisma:studio    # Open database GUI

# Frontend
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build
pnpm lint             # Lint code

# Database
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run migrations
pnpm prisma:seed      # Seed database
pnpm prisma:studio    # Open Prisma Studio
```

---

## Success Indicators

You've successfully set up the project when:

✅ Backend server runs without errors on port 3000  
✅ Frontend loads successfully on port 5173  
✅ API documentation is accessible  
✅ Database tables are created  
✅ You can login with seeded admin credentials  
✅ No console errors in browser or terminal  

---

**Congratulations! You're ready to start developing the Kenels Bureau LMS! 🎉**

For detailed implementation guidance, refer to the [PROJECT_MASTER_PLAN.md](./PROJECT_MASTER_PLAN.md).
