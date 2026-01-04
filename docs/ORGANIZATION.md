# 📁 Documentation Organization

This document explains how the documentation is organized in the `docs/` folder.

## 📂 Folder Structure

```
docs/
├── README.md                 # Main documentation index
├── ORGANIZATION.md           # This file
├── forecasting.md            # Forecasting system docs
│
├── deployment/              # Deployment & production guides
│   ├── VERCEL_DEPLOYMENT_GUIDE.md
│   ├── EXTERNAL_CRON_SETUP.md
│   ├── HOBBY_PLAN_ALERT_SETUP.md
│   └── ...
│
├── setup/                   # Setup & configuration guides
│   ├── LOCAL_SETUP_GUIDE.md
│   ├── QUICK_START.md
│   ├── ENV_SETUP.md
│   └── ...
│
├── features/                # Feature documentation
│   ├── WARMUP_JOBS_IMPLEMENTATION.md
│   ├── CACHE_LAYER_IMPLEMENTATION.md
│   └── ...
│
├── troubleshooting/         # Troubleshooting guides
│   ├── AUTHENTICATION_TROUBLESHOOTING.md
│   ├── TROUBLESHOOT_LOGIN.md
│   └── ...
│
├── development/            # Development guides
│   ├── TESTING_GUIDE.md
│   ├── SEEDING.md
│   └── ...
│
├── architecture/           # Architecture & design docs
│   ├── COMPREHENSIVE_PROJECT_REVIEW.md
│   ├── COMPETITIVE_ANALYSIS.md
│   └── ...
│
├── guides/                 # Step-by-step guides
│   ├── QUICK_LAUNCH_STEPS.md
│   ├── FINAL_LAUNCH_CHECKLIST.md
│   └── ...
│
├── api/                    # API documentation
│   ├── API_COST_ANALYSIS.md
│   └── ...
│
└── archive/                # Older/less relevant docs
    └── (various files)
```

## 🎯 Category Guidelines

### deployment/
- Production deployment guides
- Vercel/cloud platform specific docs
- Production readiness checklists
- Cron job configuration
- Environment setup for production

### setup/
- Local development setup
- Initial configuration
- Service integrations (OAuth, email, etc.)
- Admin panel setup
- Authentication setup

### features/
- Feature implementation details
- How features work
- Feature-specific guides
- Implementation summaries

### troubleshooting/
- Common issues and solutions
- Error debugging guides
- Migration problems
- Authentication issues
- Service integration problems

### development/
- Testing procedures
- Database management
- Build and compilation
- Development workflows
- Branch management

### architecture/
- System design
- Project reviews
- Competitive analysis
- Strategic planning
- Business strategy

### guides/
- Step-by-step tutorials
- Launch checklists
- Integration guides
- How-to guides

### api/
- API documentation
- API cost analysis
- API optimization
- API status reports

### archive/
- Older documentation
- Historical records
- Less frequently accessed docs
- Deprecated guides

## 📝 Naming Conventions

- Use `UPPER_SNAKE_CASE.md` for file names
- Be descriptive and specific
- Include the main topic in the filename
- Examples:
  - `VERCEL_DEPLOYMENT_GUIDE.md` ✅
  - `QUICK_START.md` ✅
  - `TROUBLESHOOT_LOGIN.md` ✅

## 🔄 Maintenance

When adding new documentation:

1. **Choose the right category** - Place files in the most appropriate folder
2. **Update the index** - Add a link in `docs/README.md`
3. **Follow naming conventions** - Use UPPER_SNAKE_CASE
4. **Keep it organized** - Don't create too many subfolders
5. **Archive old docs** - Move outdated docs to `archive/`

## 🔍 Finding Documentation

- **New to the project?** → Start with `setup/QUICK_START.md`
- **Deploying?** → Check `deployment/VERCEL_DEPLOYMENT_GUIDE.md`
- **Having issues?** → Browse `troubleshooting/`
- **Understanding features?** → Check `features/`
- **Development tasks?** → See `development/`

---

**Last Updated**: January 2025

