# IDT Warranty System Documentation

Welcome to the IDT Warranty Management System documentation. This guide will help you navigate the documentation based on your needs.

## 🚀 Getting Started

**New to the project? Start here:**

1. **[Quick Start Guide](./QUICK_START.md)** - Get the system running in 5 minutes
2. **[Architecture Overview](./ARCHITECTURE.md)** - Understand the system design
3. **[Database Setup](./DATABASE_SETUP.md)** - Configure your database

## 📖 Core Documentation

### System Architecture

- **[Architecture](./ARCHITECTURE.md)** - Complete system architecture, patterns, and principles
- **[Next.js 15 Conventions](./NEXT15_CONVENTIONS.md)** - Coding patterns and best practices

### Features

- **[Real-Time Collaboration](./REALTIME.md)** - SSE implementation, field locking, live updates
- **[Case Transfer System](./FEATURES_CASE_TRANSFER.md)** - Transfer cases between branches
- **[Version Check System](./FEATURES_VERSION_CHECK.md)** - Automatic version update detection
- **[Settings Management](./SETTINGS_DOCUMENTATION.md)** - Branch and staff configuration
- **[Warranty History](./WARRANTY_HISTORY_FEATURE.md)** - Audit trail and history tracking

### Configuration

- **[Email Configuration](./EMAIL_CONFIGURATION.md)** - SMTP setup for sending PDFs
- **[Database Setup](./DATABASE_SETUP.md)** - Schema, migrations, and seeding

## 🎯 By User Role

### For Developers

1. Start with [ARCHITECTURE.md](./ARCHITECTURE.md)
2. Review [NEXT15_CONVENTIONS.md](./NEXT15_CONVENTIONS.md)
3. Check [REALTIME.md](./REALTIME.md) for collaboration features
4. See [TEST_CASES.md](./TEST_CASES.md) for testing strategy

### For DevOps/Deployment

1. Start with [QUICK_START.md](./QUICK_START.md)
2. Review [DATABASE_SETUP.md](./DATABASE_SETUP.md)
3. Check [EMAIL_CONFIGURATION.md](./EMAIL_CONFIGURATION.md)
4. See [CPANEL_DEPLOYMENT.md](./CPANEL_DEPLOYMENT.md) for production deployment

### For Project Managers

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) - System overview section
2. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Feature list
3. Review feature-specific docs for details

## 🔍 Feature Reference

### Core Table Features

- Click-to-edit cells
- Dropdown selections
- Expandable row details
- Auto-save functionality
- Search and filtering
- Multi-column sorting
- Pagination
- **Documentation:** See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

### Real-Time Collaboration

- Live updates via SSE
- Field locking
- Optimistic updates
- Auto-reconnection
- **Documentation:** See [REALTIME.md](./REALTIME.md)

### Case Transfer

- Transfer cases between branches
- Transfer history tracking
- Transfer statistics
- **Documentation:** See [FEATURES_CASE_TRANSFER.md](./FEATURES_CASE_TRANSFER.md)

### Version Management

- Automatic version detection
- User notifications
- Build-time versioning
- **Documentation:** See [FEATURES_VERSION_CHECK.md](./FEATURES_VERSION_CHECK.md)

## 📚 Implementation Details

### Performance & Testing

- **[Test Cases](./TEST_CASES.md)** - Scalability and performance testing
- **[Scalability Tests Summary](./SCALABILITY_TESTS_SUMMARY.md)** - Load testing results
- **[Warranty Table Performance](./WARRANTY_TABLE_PERFORMANCE_OPTIMIZATION.md)** - Optimization guide

### Technical Features

- **[Service Number Auto-Generation](./SERVICE_NUMBER_AUTO_GENERATION.md)** - Automatic service numbering
- **[Multi-Sort Implementation](./MULTI_SORT_IMPLEMENTATION.md)** - Multi-column sorting

## 🗂️ Legacy/Reference

The following documents are kept for historical reference:

- `CASE_TRANSFER_IMPLEMENTATION.md` - Merged into FEATURES_CASE_TRANSFER.md
- `CASE_TRANSFER_QUICK_REFERENCE.md` - Merged into FEATURES_CASE_TRANSFER.md
- `VERSION_CHECK_IMPLEMENTATION_SUMMARY.md` - Merged into FEATURES_VERSION_CHECK.md
- `VERSION_CHECK_QUICK_REFERENCE.md` - Merged into FEATURES_VERSION_CHECK.md
- `EMAIL_FEATURE_IMPLEMENTATION.md` - Merged into EMAIL_CONFIGURATION.md

## 🆘 Troubleshooting

- **Database Issues:** See [DATABASE_SETUP.md](./DATABASE_SETUP.md)
- **Email Not Sending:** See [EMAIL_CONFIGURATION.md](./EMAIL_CONFIGURATION.md)
- **Real-Time Updates Not Working:** See [REALTIME.md](./REALTIME.md)
- **Version Check Not Showing:** See [FEATURES_VERSION_CHECK.md](./FEATURES_VERSION_CHECK.md)

## 🔗 Quick Links

- [GitHub Repository](https://github.com/DanishNasarudin/idt-warranty)
- [Issue Tracker](https://github.com/DanishNasarudin/idt-warranty/issues)
- [Main README](../README.md)

---

**Last Updated:** October 2025
**Documentation Version:** 2.0
