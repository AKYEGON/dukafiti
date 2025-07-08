# DukaFiti Database Setup Instructions

## 🚀 Quick Setup Guide

### 1. Database Schema Setup
Since automatic SQL execution requires admin privileges, please manually run the database setup:

1. **Open your Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to the "SQL Editor" tab

2. **Run the Database Setup**
   - Copy the entire content from `database-setup.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute all statements

3. **Verify Setup**
   - Check that tables are created: `products`, `customers`, `sales`, `sale_items`, `notifications`, `settings`
   - Confirm RLS (Row Level Security) is enabled on all tables
   - Verify policies are created for multi-tenant isolation

### 2. Authentication Setup
- The app uses Supabase Auth with email/password
- Users are automatically isolated by their `auth.uid()`
- Each user sees only their own data

### 3. Test the Application
1. **Register a New Account**
   - Open the app
   - Use the sign-up form with email/password
   - Verify your email if required

2. **Test Multi-Tenant Isolation**
   - Add some products as User A
   - Log out and register as User B
   - Confirm User B cannot see User A's products

3. **Test Real-Time Features**
   - Open the app in two browser tabs (same user)
   - Add a product in Tab 1
   - Verify it appears instantly in Tab 2

## 🔐 Security Features

- **Row Level Security (RLS)**: Each user sees only their own data
- **Multi-Tenant Architecture**: Complete store isolation using `store_id = auth.uid()`
- **Real-Time Updates**: Live synchronization across all CRUD operations

## 📊 Core Features Ready

- **Dashboard**: Business metrics and recent activity
- **Inventory**: Product management with real-time updates
- **Sales**: POS interface with cart and payment options
- **Customers**: Customer management with credit tracking
- **Reports**: Business analytics and data export
- **Settings**: Store configuration and preferences

## 🛠️ Troubleshooting

**Issue**: Tables not created
- **Solution**: Manually run `database-setup.sql` in Supabase SQL Editor

**Issue**: Authentication not working
- **Solution**: Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly

**Issue**: No data visible
- **Solution**: Make sure RLS policies are created and you're logged in

**Issue**: Real-time not working
- **Solution**: Verify Supabase real-time is enabled in your project settings

## 🎯 Next Steps

1. Complete the database setup using the SQL Editor
2. Test authentication and multi-tenant isolation
3. Start adding your business data
4. Customize the app for your specific needs

The app is now ready for production use with complete multi-tenant isolation and real-time updates!