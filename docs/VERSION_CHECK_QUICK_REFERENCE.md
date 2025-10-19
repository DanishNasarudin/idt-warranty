# Version Check Quick Reference

## For Developers

### After Each Deployment

```bash
# The version is automatically updated during build via postbuild script
npm run build

# Or manually trigger version update
npm run update-version
```

### Test Version Update Locally

```bash
# 1. Build the app
npm run build

# 2. In another terminal, start the app
npm run start

# 3. Change version in package.json (e.g., "0.1.0" -> "0.2.0")

# 4. Update version in database
npm run update-version

# 5. Wait 5 minutes or trigger check manually via browser console:
# Open browser console and run:
# window.location.reload()
```

### Environment Variables

```env
# Optional: Set during build for consistent versioning
NEXT_PUBLIC_BUILD_TIMESTAMP="2025-10-19T07:22:26.000Z"
NEXT_PUBLIC_COMMIT_HASH="abc123"
```

## For CI/CD Pipeline

### Example GitHub Actions

```yaml
- name: Set Build Timestamp
  run: echo "NEXT_PUBLIC_BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")" >> $GITHUB_ENV

- name: Set Commit Hash
  run: echo "NEXT_PUBLIC_COMMIT_HASH=${{ github.sha }}" >> $GITHUB_ENV

- name: Build Application
  run: npm run build

- name: Update Version in Database
  run: npm run update-version
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## For Users

### What Happens

1. User is working in the app
2. New version is deployed
3. After 5 minutes, a modal appears
4. User can:
   - **Reload Now**: Instantly get new version
   - **Remind Later**: Modal reappears after 10 minutes

### Why This Is Good

- ✅ Never miss important updates
- ✅ No disruption to current work
- ✅ Can choose when to reload
- ✅ Automatic detection

## Configuration Cheat Sheet

| Setting        | Location                     | Default | Purpose               |
| -------------- | ---------------------------- | ------- | --------------------- |
| Poll Interval  | `version-check-provider.tsx` | 5 min   | How often to check    |
| Reminder Delay | `version-check-provider.tsx` | 10 min  | Delay after dismissal |
| SSE Enabled    | `use-version-check.ts`       | true    | Use SSE for updates   |

## API Endpoints

### Get Current Version

```bash
GET /api/version

Response:
{
  "version": "0.1.0",
  "buildTimestamp": "2025-10-19T07:22:26.000Z",
  "commitHash": "abc123",
  "timestamp": "2025-10-19T07:30:00.000Z"
}
```

## Database Schema

```sql
-- AppVersion table
CREATE TABLE AppVersion (
  id INT PRIMARY KEY AUTO_INCREMENT,
  version VARCHAR(32),
  buildTimestamp VARCHAR(64) UNIQUE,
  commitHash VARCHAR(64),
  isActive BOOLEAN DEFAULT false,
  deployedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3)
);
```

## Troubleshooting

| Issue                  | Solution                                                           |
| ---------------------- | ------------------------------------------------------------------ |
| Modal not showing      | Check browser console, verify API returns different buildTimestamp |
| Version not updating   | Run `npm run update-version` after deployment                      |
| Too many checks        | Increase `pollInterval` in provider                                |
| Modal shows repeatedly | Version was dismissed, will re-prompt after 10 min                 |

## Files to Review

- `lib/hooks/use-version-check.ts` - Core logic
- `lib/providers/version-check-provider.tsx` - UI integration
- `components/custom/version-update-modal.tsx` - Modal component
- `app/api/version/route.ts` - API endpoint
- `lib/scripts/update-version.ts` - Version update script

## Common Commands

```bash
# Check current version in database
npx prisma studio
# Navigate to AppVersion table

# Force version check (via console)
# In browser console:
fetch('/api/version').then(r => r.json()).then(console.log)

# Reset all versions
npx prisma migrate reset
npm run update-version
```

---

For detailed documentation, see [VERSION_CHECK.md](./VERSION_CHECK.md)
