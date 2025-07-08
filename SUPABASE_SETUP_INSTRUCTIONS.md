# Supabase Database Setup Instructions

## Step-by-Step Setup Process

### 1. Access Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in to your account
3. Navigate to your DukaFiti project: `kwdzbssuovwemthmiuht`

### 2. Open SQL Editor
1. In your Supabase project dashboard, click on **"SQL Editor"** in the left sidebar
2. Click **"New Query"** to create a new SQL script

### 3. Run the Database Setup Script
1. Copy the entire contents of `database-setup-complete.sql`
2. Paste it into the SQL Editor
3. Click **"Run"** to execute the script

### 4. Verify the Setup
After running the script, you should see:
- ✅ All tables created successfully
- ✅ RLS policies enabled
- ✅ Sample data inserted
- ✅ Indexes and triggers created

### 5. Enable Realtime (Optional but Recommended)
1. Go to **Database** → **Replication** in the Supabase dashboard
2. Enable realtime for these tables:
   - `products`
   - `customers` 
   - `sales`
   - `notifications`
   - `settings`

### 6. Test the Connection
1. Go back to your DukaFiti application
2. Visit the `/test` route
3. You should see:
   - ✅ Database connection successful
   - Empty data arrays (initially)
   - Ability to create test products and customers

## What This Setup Provides

### Multi-Tenant Architecture
- Each user (store owner) only sees their own data
- Automatic `store_id` assignment based on authenticated user
- Row Level Security prevents data leaks between stores

### Complete Schema
- **Products**: Inventory management with pricing and stock
- **Customers**: Customer information and credit tracking
- **Sales**: Transaction records with payment status
- **Sale Items**: Detailed line items for each sale
- **Notifications**: Alert system for the application
- **Settings**: Store configuration and preferences

### Security Features
- Row Level Security (RLS) enabled on all tables
- Automatic user isolation via `store_id`
- Proper foreign key relationships
- Input validation via CHECK constraints

### Performance Optimizations
- Strategic indexes on frequently queried columns
- Automatic timestamp updates via triggers
- Optimized queries for multi-tenant access patterns

## Troubleshooting

### If the script fails:
1. Check that you're signed in to the correct Supabase project
2. Ensure you have sufficient permissions (project owner/admin)
3. Try running the script in smaller sections if there are errors

### If authentication issues occur:
1. Verify your environment variables are correct:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Check that users can authenticate properly

### If data doesn't appear:
1. Ensure RLS policies are properly created
2. Verify the authenticated user has the correct `store_id`
3. Check browser console for any API errors

## Next Steps

After completing this setup:
1. Test creating data via the `/test` page
2. Verify real-time updates work correctly
3. Ready to proceed with Phase 3: Inventory Page implementation

The database is now fully configured for multi-tenant operation with proper security and performance optimizations.