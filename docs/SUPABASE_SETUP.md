# Supabase Setup Guide

Complete guide to setting up your Supabase project for VentureBot.

## 📋 Overview

VentureBot uses Supabase for:
- User authentication and profiles
- Conversation history storage
- Memory persistence across sessions
- Project and idea tracking
- Real-time updates (future)

## 🚀 Quick Setup Steps

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in project details:
   - **Name**: VentureBot (or your choice)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for MVP
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to initialize

### Step 2: Get Your API Credentials

1. In your Supabase project dashboard, click **"Settings"** (gear icon)
2. Click **"API"** in the sidebar
3. Copy these values to your `.env` file:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" to see it)

Your `.env` should look like:
```bash
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Run Database Schema

1. In Supabase dashboard, click **"SQL Editor"** in the sidebar
2. Click **"New query"**
3. Copy the ENTIRE contents of `src/database/schema.sql`
4. Paste into the SQL editor
5. Click **"Run"** (or press Cmd/Ctrl + Enter)
6. Wait for "Success. No rows returned" message

**That's it!** Your database is now set up with all tables and relationships.

## 📊 What Gets Created

The schema creates these tables:

### Core Tables
- **users** - User profiles and authentication data
- **sessions** - Conversation sessions
- **messages** - Chat message history
- **memory_store** - Persistent memory for agents (key-value store)

### Journey Tracking
- **pain_points** - User's identified problems
- **ideas** - Generated business ideas
- **validations** - Market validation results
- **products** - Launched products

### Features
- **milestones** - User achievements and progress
- **shared_chats** - Public conversation sharing

## 🔐 Security Setup (Row Level Security)

The schema includes RLS policies that:
- Users can only see their own data
- Service role can access all data (for backend operations)
- Memory is isolated per session
- Shared chats are publicly readable

These are automatically created when you run the schema!

## ✅ Verify Setup

### Check Tables Created

1. In Supabase, click **"Table Editor"**
2. You should see these tables:
   - users
   - sessions
   - messages
   - memory_store
   - pain_points
   - ideas
   - validations
   - products
   - milestones
   - shared_chats

### Test Database Connection

Run this from your project:

```bash
# Start your server
npm run dev

# In another terminal, test the health endpoint
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T...",
  "services": {
    "database": "connected",
    "ai": "connected"
  }
}
```

## 🔧 Troubleshooting

### "relation does not exist" error
**Solution:** You didn't run the schema.sql file. Go back to Step 3.

### "invalid API key" error
**Solution:** Check your `.env` file has the correct keys from Supabase dashboard.

### "Failed to connect to database"
**Solution:**
1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
2. Check your Supabase project is active (not paused)
3. Ensure you copied the full URL including `https://`

### Tables missing or wrong structure
**Solution:**
1. Go to SQL Editor in Supabase
2. Run: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;`
3. Re-run the entire schema.sql file

## 📱 Optional: Enable Real-time (Future Feature)

For real-time updates (Phase 3 of PRD):

1. In Supabase, go to **"Database"** → **"Replication"**
2. Enable replication for these tables:
   - messages
   - sessions
   - memory_store
3. Click **"Save"**

This allows real-time updates when new messages arrive!

## 💾 Database Backup

Supabase automatically backs up your database, but you can also:

1. Go to **"Database"** → **"Backups"**
2. Click **"Manual backup"** to create a snapshot
3. Enable **"Point-in-Time Recovery"** (paid plans only)

## 🔑 Authentication Setup (Optional for MVP)

For production, you may want to enable authentication providers:

1. Go to **"Authentication"** → **"Providers"**
2. Enable providers you want:
   - Email (enabled by default)
   - Google OAuth
   - GitHub OAuth
3. Configure callback URLs

For MVP, we're using simple JWT auth, so this is optional.

## 📊 Monitoring

### View Your Data

1. Click **"Table Editor"**
2. Select any table to view/edit data
3. Use filters to find specific records

### Check API Logs

1. Click **"Logs"** in sidebar
2. Select **"API"** to see all database queries
3. Useful for debugging issues

### Monitor Usage

1. Go to **"Settings"** → **"Usage"**
2. Check:
   - Database size
   - API requests
   - Bandwidth
   - Active connections

Free tier limits:
- 500 MB database
- 50,000 monthly active users
- 2 GB bandwidth
- 500 MB file storage

## 🚀 Next Steps After Setup

1. ✅ Verify all tables created
2. ✅ Test database connection
3. ✅ Update `.env` with credentials
4. ✅ Start your backend: `npm run dev`
5. ✅ Test API endpoints
6. ✅ Create your first user and conversation!

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Editor Tutorial](https://supabase.com/docs/guides/database/sql-editor)

---

**Quick Checklist:**
- [ ] Created Supabase project
- [ ] Copied API credentials to `.env`
- [ ] Ran `schema.sql` in SQL Editor
- [ ] Verified tables created
- [ ] Tested database connection
- [ ] Ready to start building! 🎉
