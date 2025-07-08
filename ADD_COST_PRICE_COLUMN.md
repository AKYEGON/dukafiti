# Add cost_price Column to Products Table

## Quick Setup Instructions

To enable full profit tracking with the Add Stock feature, please add the `cost_price` column to your Supabase products table:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **Table Editor** → **products**
3. Click **"Add Column"**
4. Configure the new column:
   - **Name**: `cost_price`
   - **Type**: `numeric`
   - **Default value**: `0`
   - **Is nullable**: `false` (unchecked)
   - **Is unique**: `false` (unchecked)
5. Click **Save**

### Option 2: Using SQL Editor

1. Go to **SQL Editor** in your Supabase dashboard
2. Run this SQL command:

```sql
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC NOT NULL DEFAULT 0 
CHECK (cost_price >= 0);
```

3. Click **Run**

### Option 3: Set Default Values for Existing Products

After adding the column, you can set default cost prices for existing products (60% of selling price):

```sql
UPDATE products 
SET cost_price = ROUND(price * 0.6, 2) 
WHERE cost_price = 0 OR cost_price IS NULL;
```

## Verification

After adding the column, the Add Stock feature will:
- ✅ Update product quantities
- ✅ Store buying prices for profit calculations
- ✅ Enable future profit tracking and margin analysis

The feature currently works for quantity updates and will automatically support profit tracking once the column is added.