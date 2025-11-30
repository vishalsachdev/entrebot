# Starting the App Locally

## ✅ Quick Start (Recommended)

**Open TWO terminal windows** and run:

### Terminal 1 - Backend Server
```bash
cd /Users/vishal/Desktop/entrebot
npm run dev
```

You should see:
```
🚀 Starting VentureBot Backend...
✅ Server running on port 3000
```

### Terminal 2 - Frontend Server
```bash
cd /Users/vishal/Desktop/entrebot/frontend
npm run dev
```

You should see:
```
  VITE v7.1.12  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

## 🌐 Access the App

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api/health

## 🛑 Stop the Servers

Press `Ctrl+C` in each terminal window.

## 🔧 Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Check if Servers are Running

```bash
# Check backend
curl http://localhost:3000/api/health

# Check frontend (should return HTML)
curl http://localhost:5173
```

### View Logs

If you used the startup script:
```bash
# Backend logs
tail -f /tmp/entrebot-backend.log

# Frontend logs
tail -f /tmp/entrebot-frontend.log
```

