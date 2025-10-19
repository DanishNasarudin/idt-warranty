# App Version Check System

A production-ready system for detecting and notifying users about new application versions, ensuring users are always running the latest code.

## 🌟 Features

- **Automatic Version Detection**: Detects new deployments automatically
- **Smart Polling**: Only checks when user is active on the page (respects page visibility)
- **SSE Integration**: Optionally uses existing SSE infrastructure for instant notifications
- **User-Friendly Modal**: Non-intrusive notification with reload option
- **Resource Efficient**: Minimizes checks for users who navigate away
- **Build-Time Versioning**: Uses build timestamp as unique version identifier
- **Database Persistence**: Stores version info in database for reliability

## 🎯 Why This Approach?

| Feature               | Description                     | Benefit                          |
| --------------------- | ------------------------------- | -------------------------------- |
| **Build Timestamp**   | Uses build time as version ID   | Unique per deployment, automatic |
| **Polling + SSE**     | Hybrid approach                 | Reliable with SSE optimization   |
| **Page Visibility**   | Pauses when user is away        | Saves resources                  |
| **Session Tracking**  | Tracks how long user is on page | Optimizes check frequency        |
| **Dismissible Modal** | User can dismiss with reminder  | Non-intrusive UX                 |

## 📊 Performance

### Resource Usage

- **Polling Interval**: 5 minutes (configurable)
- **Network**: ~200 bytes per check
- **Memory**: Negligible (~few KB)
- **CPU**: Minimal (only during check)

### Efficiency Features

- Pauses checks when page is hidden
- Remembers dismissed versions
- Re-prompts after 10 minutes if user doesn't reload
- Leverages existing SSE connection when available

## 🏗️ Architecture

```
┌─────────────┐     Poll/SSE      ┌─────────────┐
│   Client    │◄─────────────────►│   Version   │
│  (Browser)  │   Version Check    │     API     │
└─────────────┘                    └─────────────┘
      │                                    │
      │ Detect Change                      │ Build Time
      ▼                                    ▼
┌─────────────┐                    ┌─────────────┐
│   Modal     │                    │   package   │
│  Component  │                    │    .json    │
└─────────────┘                    └─────────────┘
                                           │
                                           ▼
                                   ┌─────────────┐
                                   │   Database  │
                                   │ (AppVersion)│
                                   └─────────────┘
```

## 📁 Implementation Files

### Core Files

```
lib/
├── utils/
│   └── app-version.ts              # Version utilities
├── hooks/
│   └── use-version-check.ts        # Version check hook
├── providers/
│   └── version-check-provider.tsx  # Root provider
├── scripts/
│   └── update-version.ts           # Version update script
└── types/
    └── realtime.ts                 # SSE types (updated)

app/
└── api/
    └── version/
        └── route.ts                # Version API endpoint

components/
└── custom/
    └── version-update-modal.tsx    # Update notification modal

prisma/
└── schema.prisma                   # AppVersion model
```

## 🚀 How It Works

### 1. Build Time Version Generation

When the app is built:

- `BUILD_TIMESTAMP` is set to current time
- Version is stored in `package.json`
- Optional: Git commit hash is captured

```typescript
// Automatic during build
BUILD_TIMESTAMP = "2025-10-19T07:22:26.000Z";
```

### 2. Version API

Endpoint: `GET /api/version`

Response:

```json
{
  "version": "0.1.0",
  "buildTimestamp": "2025-10-19T07:22:26.000Z",
  "commitHash": "abc123",
  "timestamp": "2025-10-19T07:30:00.000Z"
}
```

### 3. Client-Side Checking

The `useVersionCheck` hook:

- Polls `/api/version` every 5 minutes
- Compares current build timestamp with server's
- Triggers callback when different version detected
- Pauses when page is hidden

### 4. User Notification

When new version detected:

- Modal appears with friendly message
- User can reload immediately or dismiss
- If dismissed, reminds again after 10 minutes
- Hard reload ensures all resources are fresh

## 📖 Usage

### Basic Setup (Already Configured)

The version check is automatically enabled for all users via the `VersionCheckProvider` in `lib/providers.tsx`.

### Custom Configuration

```typescript
import { useVersionCheck } from "@/lib/hooks/use-version-check";

function MyComponent() {
  const { currentVersion, hasUpdate, checkVersion } = useVersionCheck({
    pollInterval: 300000, // 5 minutes
    enabled: true,
    onVersionUpdate: (newVersion) => {
      console.log("New version available:", newVersion);
    },
  });

  return (
    <div>
      Current: {currentVersion?.version}
      {hasUpdate && <span>Update available!</span>}
    </div>
  );
}
```

### Manual Version Update (Deployment)

After deploying:

```bash
# Automatically run after build
npm run build

# Or manually trigger
npm run update-version
```

This will:

1. Set the current build as active in database
2. Deactivate previous versions
3. Make new version available to clients

## 🔧 Configuration

### Environment Variables

```env
# Optional: Set during build for consistent timestamp
NEXT_PUBLIC_BUILD_TIMESTAMP="2025-10-19T07:22:26.000Z"

# Optional: Git commit hash
NEXT_PUBLIC_COMMIT_HASH="abc123def456"
```

### Polling Interval

Default: 5 minutes

Adjust in `lib/providers/version-check-provider.tsx`:

```typescript
const { currentVersion, hasUpdate } = useVersionCheck({
  pollInterval: 180000, // 3 minutes
  // ...
});
```

### Reminder Interval

Default: 10 minutes after dismissal

Adjust in `lib/providers/version-check-provider.tsx`:

```typescript
setTimeout(() => {
  setShowModal(true);
}, 300000); // 5 minutes
```

## 🎨 Customization

### Modal Appearance

Edit `components/custom/version-update-modal.tsx`:

```typescript
<AlertDialogTitle>🎉 New Features Available!</AlertDialogTitle>
```

### Check Conditions

Modify `lib/hooks/use-version-check.ts` to add custom logic:

```typescript
// Example: Only check during business hours
const shouldCheck = () => {
  const hour = new Date().getHours();
  return hour >= 9 && hour <= 17;
};
```

## 🧪 Testing

### Test Version Update

1. **Change version** in `package.json`:

   ```json
   "version": "0.2.0"
   ```

2. **Update build timestamp** (simulate new deployment):

   ```bash
   BUILD_TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")" npm run update-version
   ```

3. **Wait for polling** or trigger check:
   ```typescript
   const { checkVersion } = useVersionCheck();
   checkVersion(); // Manual trigger
   ```

### Test Modal

In browser console:

```javascript
// Simulate version update
window.dispatchEvent(new CustomEvent("app-version-updated"));
```

## 🚨 Troubleshooting

### Modal Doesn't Appear

1. Check browser console for version check logs
2. Verify `/api/version` returns correct data
3. Ensure page is visible (not in background tab)
4. Check if version was already dismissed

### Version Not Updating

1. Run `npm run update-version` after deployment
2. Verify database has new AppVersion record
3. Check `isActive` flag is set correctly
4. Clear browser cache if needed

### Polling Too Frequent/Infrequent

Adjust `pollInterval` in provider:

```typescript
pollInterval: 300000, // milliseconds
```

## 📝 Best Practices

1. **Always run update-version after deployment**

   - Include in CI/CD pipeline
   - Or use `postbuild` script (already configured)

2. **Set BUILD_TIMESTAMP in CI/CD**

   ```bash
   export NEXT_PUBLIC_BUILD_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
   ```

3. **Monitor version checks in production**

   - Check server logs for version API calls
   - Monitor database for AppVersion records

4. **Test before deploying**
   - Verify modal appears on version change
   - Ensure reload works correctly
   - Check dismissal behavior

## 🔮 Future Enhancements

Potential improvements:

- [ ] **Release Notes**: Show what's new in the modal
- [ ] **Forced Updates**: For critical security fixes
- [ ] **Gradual Rollout**: Notify users in phases
- [ ] **Update History**: Track user update patterns
- [ ] **Admin Dashboard**: View connected users and versions
- [ ] **Broadcast SSE Event**: Real-time push on deployment
- [ ] **Service Worker**: Background sync and offline support

## 📚 Related Documentation

- [REALTIME.md](./REALTIME.md) - SSE infrastructure
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall app architecture
- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration

## 🤝 Contributing

When modifying this feature:

1. Update this documentation
2. Test with different polling intervals
3. Verify modal UX is user-friendly
4. Check performance impact
5. Update tests if needed

---

**Version Check System v1.0** - Built with ❤️ for seamless updates
