# cPanel Deployment Guide - SSE Configuration

This guide covers deploying the IDT Warranty application on cPanel with Phusion Passenger, specifically addressing Server-Sent Events (SSE) configuration.

## Issue: SSE Connection Stalling

### Problem

SSE connections get stuck at "Connecting..." in production due to Apache/Passenger buffering responses.

### Root Causes

1. **Apache mod_proxy buffering** - Apache buffers SSE responses by default
2. **Reverse proxy buffering** - Proxy layers buffer before sending to client
3. **Passenger connection handling** - May close connections it thinks are idle
4. **Delayed heartbeats** - 30-second initial heartbeat interval too long

## Solutions Implemented

### 1. Server-Side Fixes (Already Applied)

**File: `app/api/sse/warranty-updates/route.ts`**

✅ **Immediate Heartbeat**: Sends heartbeat immediately after connection to prevent buffering
✅ **Enhanced Headers**:

- `Content-Type: text/event-stream; charset=utf-8`
- `Transfer-Encoding: chunked` (critical for Apache)
- `Cache-Control: no-cache, no-store, must-revalidate, no-transform`
- `X-Content-Type-Options: nosniff`

### 2. Client-Side Fixes (Already Applied)

**File: `lib/hooks/use-realtime-updates.ts`**

✅ **Connection Timeout Detection**: Automatically detects stalled connections after 15 seconds
✅ **Automatic Reconnection**: Reconnects with exponential backoff
✅ **Connection Health Monitoring**: Clears timeout on each message received

## cPanel Configuration Required

### Option A: .htaccess Configuration (Recommended)

Create or update `.htaccess` in your app root:

```apache
# Disable buffering for SSE endpoints
<IfModule mod_proxy.h>
    # Disable buffering for SSE routes
    <LocationMatch "^/api/sse/">
        ProxyPass http://localhost:YOUR_PORT/ retry=0
        ProxyPassReverse http://localhost:YOUR_PORT/

        # Critical: Disable buffering
        SetEnv proxy-nokeepalive 1
        SetEnv proxy-sendcl 0
        SetEnv proxy-interim-response no

        # Prevent Apache from buffering
        SetEnv no-gzip 1
    </LocationMatch>
</IfModule>

# Alternative: If using mod_headers
<IfModule mod_headers.h>
    <LocationMatch "^/api/sse/">
        Header set X-Accel-Buffering "no"
        Header set Cache-Control "no-cache, no-store, must-revalidate"
        Header set Connection "keep-alive"
    </LocationMatch>
</IfModule>
```

### Option B: Passenger Configuration

Add to `passenger_wsgi.py` or Node.js startup configuration:

```python
# For Passenger
import os
os.environ['PASSENGER_BUFFER_RESPONSE'] = 'off'
```

### Option C: Apache Configuration (Server Admin Required)

Ask your hosting provider or add to Apache config:

```apache
<VirtualHost *:443>
    # Your existing config...

    # Disable buffering for SSE
    <Location /api/sse/>
        ProxyPass http://localhost:YOUR_PORT/api/sse/ retry=0
        ProxyPassReverse http://localhost:YOUR_PORT/api/sse/

        # Disable buffering
        SetEnv proxy-sendcl Off
        SetEnv proxy-interim-response Off
        SetEnv no-gzip 1
    </Location>
</VirtualHost>
```

## Passenger-Specific Settings

### 1. Update `passenger.json` (if exists)

```json
{
  "app_type": "node",
  "startup_file": "app.js",
  "node": "latest",
  "environment_variables": {
    "NODE_ENV": "production"
  },
  "max_pool_size": 4,
  "min_instances": 1,
  "max_request_queue_size": 100,
  "force_max_concurrent_requests_per_process": -1
}
```

### 2. Environment Variables

Ensure these are set in cPanel:

```bash
NODE_ENV=production
PASSENGER_APP_ENV=production
# Disable response buffering
PASSENGER_BUFFER_RESPONSE=off
```

## Testing the Fix

### 1. Check SSE Connection

Open browser DevTools → Network tab:

1. Look for `/api/sse/warranty-updates?branchId=X`
2. Should show **Type: eventsource**
3. Status should be **200** with **(pending)** or stream icon
4. Check "Messages" tab - should see immediate heartbeat within 1 second

### 2. Monitor Logs

```bash
# In your app logs, you should see:
[SSE] Connection established: user_xxx (branch: 1)
[SSE] Connection opened
[SSE] Heartbeat sent
```

### 3. Test Connection Stability

1. Open app in browser
2. Connection indicator should show "Real-time updates active" within 2-3 seconds
3. Leave page open for 5 minutes
4. Indicator should remain green
5. Make a change - other users should see updates immediately

## Troubleshooting

### Still Seeing "Connecting..."?

**Symptom**: Connection stuck, no messages received

**Solutions**:

1. ✅ Check Apache/Passenger is not buffering (see .htaccess above)
2. ✅ Verify EventSource endpoint is accessible: `curl https://yourdomain.com/api/sse/warranty-updates?branchId=1`
3. ✅ Check cPanel error logs for Node.js errors
4. ✅ Ensure Passenger is running: `passenger-status`
5. ✅ Verify port is correct in Passenger config

### Connection Drops After 30-60 Seconds

**Symptom**: Connected initially, then disconnects

**Solutions**:

1. ✅ Check Passenger `passenger_pool_idle_time` setting (increase if needed)
2. ✅ Verify heartbeat is being sent (check network tab)
3. ✅ Check Apache KeepAlive settings:
   ```apache
   KeepAlive On
   KeepAliveTimeout 120
   MaxKeepAliveRequests 100
   ```

### High Memory Usage

**Symptom**: Node.js process consuming too much memory

**Solutions**:

1. ✅ Limit max SSE connections (add to route handler):
   ```typescript
   if (sseManager.getConnectionCount() > 100) {
     return new Response("Too many connections", { status: 503 });
   }
   ```
2. ✅ Adjust Passenger pool size in `passenger.json`
3. ✅ Monitor with: `passenger-memory-stats`

## Performance Optimization

### 1. Enable HTTP/2

HTTP/2 handles SSE connections more efficiently:

```apache
# In Apache config
Protocols h2 h2c http/1.1
```

### 2. Adjust Passenger Pool Size

Based on your server resources:

```json
{
  "max_pool_size": 2, // Reduce if low memory
  "min_instances": 1
}
```

### 3. Connection Limits

Add to SSE route if needed:

```typescript
// Before creating stream
const maxConnections = 50; // Adjust based on server capacity
if (sseManager.getConnectionCount() >= maxConnections) {
  return new Response("Server at capacity", { status: 503 });
}
```

## Monitoring

### Check Active SSE Connections

Add an admin endpoint:

```typescript
// app/api/admin/sse-status/route.ts
export async function GET() {
  return NextResponse.json({
    connections: sseManager.getConnectionCount(),
    locks: sseManager.getLockCount(),
  });
}
```

### Monitor Passenger Status

```bash
passenger-status
passenger-memory-stats
```

## Additional Resources

- [Passenger Configuration Reference](https://www.phusionpassenger.com/docs/references/config_reference/nodejs/)
- [Apache SSE Configuration](https://httpd.apache.org/docs/2.4/mod/mod_proxy.html)
- [Server-Sent Events Specification](https://html.spec.whatwg.org/multipage/server-sent-events.html)

## Quick Reference

| Issue                      | Fix                                                  |
| -------------------------- | ---------------------------------------------------- |
| Stuck at "Connecting..."   | Add .htaccess rules, enable immediate heartbeat      |
| Connection drops after 60s | Increase KeepAliveTimeout, check Passenger idle time |
| High memory                | Reduce Passenger pool size, add connection limits    |
| Slow updates               | Check network buffering, verify heartbeat interval   |
| 503 errors                 | Increase max_pool_size, add connection queuing       |

---

**Last Updated**: October 19, 2025
**Status**: Production Ready ✅
