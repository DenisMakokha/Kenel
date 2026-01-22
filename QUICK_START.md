# ⚡ Kenels Bureau LMS - Quick Start Checklist

**Get up and running in 15 minutes!**

---

## ✅ Pre-Flight Checklist

Before you begin, ensure you have:

- [ ] Node.js 20+ installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] Docker installed (optional but recommended)
- [ ] Git installed
- [ ] Code editor (VS Code recommended)

---

## 🚀 5-Step Quick Start

### Step 1: Navigate to Project (30 seconds)

```bash
cd C:\Users\DenisMakokha\CascadeProjects\kenels-lms
```

### Step 2: Install Backend Dependencies (2 minutes)

```bash
cd backend
pnpm install
```

**Expected Output**: 
```
Progress: resolved XXX, reused XXX, downloaded 0, added XXX
Done in Xs
```

### Step 3: Start Database (1 minute)

```bash
# Still in backend directory
docker-compose up -d
```

**Expected Output**:
```
Creating kenels-lms-db ... done
Creating kenels-lms-redis ... done
```

**Verify**:
```bash
docker ps
```

You should see `kenels-lms-db` and `kenels-lms-redis` running.

### Step 4: Setup Database (2 minutes)

```bash
# Copy environment file
cp .env.example .env

# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed database (when seed file is created)
# pnpm prisma:seed
```

**Expected Output**:
```
✔ Generated Prisma Client
✔ Migrations applied successfully
```

### Step 5: Install Frontend Dependencies (2 minutes)

```bash
# Open new terminal
cd C:\Users\DenisMakokha\CascadeProjects\kenels-lms\frontend
pnpm install
```

---

## 🎯 Start Development Servers

### Terminal 1: Backend

```bash
cd backend
pnpm dev
```

**Expected Output**:
```
[Nest] Application successfully started
[Nest] Listening on http://localhost:3000
```

✅ **Backend Running**: http://localhost:3000  
✅ **API Docs**: http://localhost:3000/api/docs

### Terminal 2: Frontend

```bash
cd frontend
pnpm dev
```

**Expected Output**:
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

✅ **Frontend Running**: http://localhost:5173

---

## 🔍 Verify Everything Works

### 1. Check Backend Health

Open browser: http://localhost:3000

You should see a response (or 404 if no root route - that's OK!)

### 2. Check API Documentation

Open browser: http://localhost:3000/api/docs

You should see Swagger UI (when endpoints are created)

### 3. Check Frontend

Open browser: http://localhost:5173

You should see the React app loading

### 4. Check Database

```bash
cd backend
pnpm prisma:studio
```

Opens Prisma Studio at http://localhost:5555

You should see all 20 tables created

---

## 🎨 Verify Design System

### Check Tailwind

1. Open `frontend/src/index.css`
2. Verify CSS variables are defined
3. Check brand colors are set

### Check Logos

1. Navigate to `frontend/src/assets/logos/`
2. Verify `Light.svg` and `Dark.svg` exist

---

## 📝 Next Steps After Quick Start

### 1. Review Documentation (15 minutes)

Read in this order:
1. [README.md](./README.md) - Project overview
2. [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Current status
3. [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - What's next

### 2. Explore Database Schema (10 minutes)

```bash
cd backend
pnpm prisma:studio
```

Browse through the tables and understand relationships

### 3. Review Project Structure (10 minutes)

```bash
# View backend structure
cd backend
tree src /F

# View frontend structure
cd frontend
tree src /F
```

### 4. Start Phase 1 Development

Follow [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) Phase 1 tasks

---

## 🐛 Troubleshooting

### Issue: Port 3000 already in use

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

Or change port in `backend/.env`:
```env
PORT=3001
```

### Issue: Database connection failed

**Solution**:
```bash
# Check if Docker is running
docker ps

# Restart containers
cd backend
docker-compose down
docker-compose up -d
```

### Issue: Prisma Client not found

**Solution**:
```bash
cd backend
pnpm prisma:generate
```

### Issue: pnpm not found

**Solution**:
```bash
npm install -g pnpm
```

### Issue: Docker not installed

**Alternative**: Install PostgreSQL locally
1. Download from https://www.postgresql.org/download/
2. Install and start service
3. Create database: `CREATE DATABASE kenels_lms;`
4. Update `DATABASE_URL` in `.env`

---

## 📊 Success Checklist

After completing quick start, you should have:

- [x] Backend running on port 3000
- [x] Frontend running on port 5173
- [x] PostgreSQL database running
- [x] 20 database tables created
- [x] Prisma Studio accessible
- [x] No console errors
- [x] All dependencies installed

---

## 🎓 Learning Resources

### Essential Reading
1. **NestJS**: https://docs.nestjs.com/first-steps
2. **Prisma**: https://www.prisma.io/docs/getting-started
3. **React**: https://react.dev/learn
4. **Tailwind**: https://tailwindcss.com/docs/installation

### Project Documentation
1. [PROJECT_MASTER_PLAN.md](./PROJECT_MASTER_PLAN.md) - Complete blueprint
2. [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup
3. [docs/KENELS_LMS_ENGINEERING_RULES.md](./docs/KENELS_LMS_ENGINEERING_RULES.md) - Coding standards

---

## 🚦 Development Workflow

### Daily Routine

**Morning** (5 minutes):
```bash
# Terminal 1: Start database
cd backend
docker-compose up -d

# Terminal 2: Start backend
pnpm dev

# Terminal 3: Start frontend
cd frontend
pnpm dev
```

**During Development**:
- Make changes
- See hot reload in action
- Test in browser
- Commit frequently

**End of Day**:
```bash
# Stop servers (Ctrl+C in each terminal)
# Stop database (optional)
cd backend
docker-compose down
```

---

## 📞 Get Help

### Documentation
- **Setup Issues**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Development Questions**: See [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
- **Architecture**: See [PROJECT_MASTER_PLAN.md](./PROJECT_MASTER_PLAN.md)

### Common Commands

```bash
# Backend
cd backend
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm test             # Run tests
pnpm prisma:studio    # Open database GUI
pnpm prisma:migrate   # Run migrations

# Frontend
cd frontend
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build
```

---

## 🎉 You're Ready!

**Congratulations!** Your development environment is set up and ready.

### What's Next?

1. **Phase 1**: Build Authentication Module
   - See [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) Phase 1
   - Estimated time: 1 week
   - Start with backend Auth module

2. **Explore the Codebase**
   - Review Prisma schema
   - Check configuration files
   - Understand project structure

3. **Start Coding**
   - Follow coding standards in [docs/KENELS_LMS_ENGINEERING_RULES.md](./docs/KENELS_LMS_ENGINEERING_RULES.md)
   - Write tests as you go
   - Commit frequently with clear messages

---

## 💡 Pro Tips

1. **Keep terminals organized**
   - Terminal 1: Backend
   - Terminal 2: Frontend
   - Terminal 3: Database operations

2. **Use Prisma Studio**
   - Great for viewing data
   - Helpful for debugging
   - Run: `pnpm prisma:studio`

3. **Hot Reload**
   - Both backend and frontend auto-reload
   - Save file and see changes instantly

4. **Git Workflow**
   ```bash
   git checkout -b feature/auth-module
   # Make changes
   git add .
   git commit -m "feat: implement JWT authentication"
   git push
   ```

5. **VS Code Extensions**
   - Prisma
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - GitLens

---

**Time to Start**: ~15 minutes  
**Status**: ✅ Ready to Code  
**Next**: Phase 1 - Authentication Module

---

*Happy Coding! 🚀*
