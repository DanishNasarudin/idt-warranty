# Scalability Tests

## Overview

This directory contains tests focused on system performance, scalability, and reliability under load.

## Test Categories

### 1. Load Tests (`/load`)

Tests that simulate high concurrent user activity:

- Concurrent CRUD operations
- SSE connection management
- Race condition testing
- Bulk operations

### 2. Performance Tests (`/performance`)

Tests that measure system performance:

- Database query optimization
- API response times
- Memory usage
- Connection pooling

### 3. Utilities (`/utils`)

Helper functions and test utilities:

- Data factories for bulk generation
- Test database setup
- Performance measurement helpers

## Running Tests

```bash
# Run all tests
npm test

# Run load tests only
npm test -- load

# Run performance tests only
npm test -- performance

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- crud-load.test.ts
```

## Success Criteria

| Metric                    | Target                   |
| ------------------------- | ------------------------ |
| Concurrent Users          | 100+ without degradation |
| API Response Time (P95)   | <500ms                   |
| Database Query Time (P95) | <300ms                   |
| SSE Message Delivery      | <100ms                   |
| Cases Supported           | 50,000+                  |
| Memory per User           | <5MB                     |

## Environment Setup

Tests require:

- PostgreSQL database (test instance)
- Node.js 18+
- Environment variables in `.env.test`

See `/lib/tests/setup.ts` for test configuration.
