# Network Error Troubleshooting - "Failed to fetch"

## Error Summary
Multiple API calls are failing with "TypeError: Failed to fetch":
- `/api/v1/game/attempts/{id}/answer` - During trivia gameplay
- `/api/v1/game/settings` - Game configuration
- `/api/v1/notifications/unread-count` - Notifications
- (Likely affecting ALL backend API calls)

## Root Cause
**"Failed to fetch"** is a browser error that occurs when:
1. Backend server is unreachable (down, crashed, or not started)
2. Network connectivity problem (firewall, DNS, routing)
3. CORS policy blocking requests (though this usually gives different error)
4. Server timeout (not responding within request timeout limit)

## Backend Configuration
**API Base URL**: `http://3.211.19.155/nollywin/core`
- Host: AWS EC2 instance at IP 3.211.19.155
- Path: `/nollywin/core`

## Diagnostic Steps

### Step 1: Check if backend server is reachable

Open Command Prompt or PowerShell and run:

```powershell
# Ping the server
ping 3.211.19.155

# Try to reach the server via HTTP
curl http://3.211.19.155/nollywin/core/api/v1/game/settings
```

**Expected Result (if server is UP)**:
- Ping: Replies from 3.211.19.155
- Curl: JSON response or 401 Unauthorized (means server is up but needs auth)

**If Server is DOWN**:
- Ping: Request timed out or Destination host unreachable
- Curl: Could not connect to host

### Step 2: Check backend server status

Contact the backend team or AWS admin to verify:
- Is the EC2 instance running? (Check AWS Console → EC2 → Instances)
- Is the NollyWin backend service running? (Check `systemctl status nollywin` or equivalent)
- Any recent deployments or restarts?
- Any error logs on the server?

### Step 3: Check browser Network tab

1. Open DevTools → Network tab
2. Try to trigger an API call (e.g., navigate to Dashboard)
3. Look for requests to `3.211.19.155`
4. Click on a failed request
5. Check the error details:

**Possible errors**:
- `net::ERR_CONNECTION_REFUSED` - Server not accepting connections (down or port closed)
- `net::ERR_CONNECTION_TIMED_OUT` - Server not responding (firewall or server overloaded)
- `net::ERR_NAME_NOT_RESOLVED` - DNS issue (unlikely with IP address)
- `CORS error` - CORS policy blocking request (server needs to add CORS headers)

### Step 4: Test with different tool

Try accessing the API directly in your browser:

```
http://3.211.19.155/nollywin/core/api/v1/game/settings
```

**Expected Result (if server is UP)**:
- Some response (even if error like 401 Unauthorized means server is reachable)

**If Server is DOWN**:
- Browser shows "This site can't be reached" or "ERR_CONNECTION_REFUSED"

## Common Causes & Solutions

### Cause 1: Backend Server Stopped/Crashed
**Symptoms**: All API calls fail, ping times out or fails
**Solution**: 
- SSH into EC2 instance: `ssh user@3.211.19.155`
- Check service status: `systemctl status nollywin-backend` (or equivalent)
- Restart service: `systemctl restart nollywin-backend`
- Check logs: `journalctl -u nollywin-backend -f`

### Cause 2: EC2 Instance Stopped
**Symptoms**: Cannot ping or reach the server at all
**Solution**:
- Go to AWS Console → EC2 → Instances
- Find the instance with IP 3.211.19.155
- If stopped, click "Start instance"
- Wait for status to become "Running"
- Check that Public IP is still 3.211.19.155 (may change on restart)

### Cause 3: Firewall/Security Group Blocking Traffic
**Symptoms**: Can ping but HTTP requests fail
**Solution**:
- AWS Console → EC2 → Security Groups
- Find security group attached to the instance
- Verify inbound rules allow:
  - HTTP (port 80) from 0.0.0.0/0
  - Or specific port if backend runs on different port (e.g., 8080)
- Add rule if missing

### Cause 4: Server Overloaded/Hung
**Symptoms**: Server responds slowly or times out
**Solution**:
- SSH into server
- Check resource usage: `top` or `htop`
- Check if backend process is hung: `ps aux | grep java` (or node/python)
- Restart backend service
- Check logs for errors

### Cause 5: Wrong IP or URL
**Symptoms**: Consistent failures, never worked
**Solution**:
- Verify IP address hasn't changed (check with backend team)
- Update `.env.local` if IP changed
- Restart Next.js dev server after changing `.env.local`

## Quick Fix Checklist

- [ ] Ping the server: `ping 3.211.19.155`
- [ ] Check EC2 instance status in AWS Console
- [ ] Verify backend service is running on the server
- [ ] Check security group inbound rules (port 80/443)
- [ ] Look at backend server logs for errors
- [ ] Try accessing API URL directly in browser
- [ ] Verify no recent infrastructure changes (IP change, server migration)

## Temporary Workaround (If Backend is Down)

If the backend is temporarily unavailable and you need to continue frontend development:

1. **Mock the API responses** in the frontend
2. **Use a local backend instance** if available
3. **Switch to a staging/dev environment** if one exists

To use a different backend URL:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080/nollywin/core  # Local backend
# OR
NEXT_PUBLIC_API_URL=https://staging.nollywin.com/core    # Staging environment
```

Then restart the Next.js dev server:
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Not a Code Bug

**Important**: This is NOT a bug in the frontend code. The errors are coming from the browser's inability to reach the backend server. The frontend code is working correctly - it's properly attempting to make API calls and correctly handling the network errors.

**The issue is infrastructure/backend**, not frontend code.

## Contact Backend Team

Provide them with:
- **Error**: "Failed to fetch" on all API endpoints
- **Backend URL**: http://3.211.19.155/nollywin/core
- **When it started**: [timestamp]
- **Affected endpoints**: ALL (`/api/v1/*`)
- **Diagnostic results**: [results from Step 1-4 above]

## Status Monitoring

Consider setting up:
1. Server health check endpoint (e.g., `/health` or `/api/v1/status`)
2. Uptime monitoring service (Pingdom, UptimeRobot, AWS CloudWatch)
3. Slack/email alerts when backend goes down
4. Auto-restart on crash (systemd, PM2, Docker restart policy)
