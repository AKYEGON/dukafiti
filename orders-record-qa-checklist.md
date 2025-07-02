# Orders Record Enhancement QA Checklist

## ✅ Backend API Enhancement

### Orders Endpoint (`/api/reports/orders`)
- [ ] API response includes `totalAmount` for each order
- [ ] API response includes `items[]` array with: `productName`, `qty`, `price`
- [ ] `totalAmount` is formatted as string with 2 decimal places
- [ ] `price` in items array is formatted as string with 2 decimal places
- [ ] Database joins order headers with order line items correctly
- [ ] Order items are properly mapped and grouped by order ID

### Data Structure Verification
```javascript
// Expected response format:
{
  orders: [
    {
      orderId: 123,
      date: "2025-07-02",
      customerName: "John Doe",
      totalAmount: "1234.56",
      status: "completed",
      items: [
        { productName: "Sukari", qty: 2, price: "120.00" },
        { productName: "Maize", qty: 1, price: "80.00" }
      ]
    }
  ]
}
```
- [ ] Structure matches expected format exactly
- [ ] All required fields are present and correctly typed

## ✅ Frontend Desktop Table Implementation

### Table Structure
- [ ] Table displays with proper headers: Order, Customer, Date, Amount (KES), Products, Status
- [ ] Amount column is right-aligned (`text-right`)
- [ ] Products column shows up to 3 items in format "Name xQty"
- [ ] Items are comma-separated (e.g., "Sukari x2, Maize x1")
- [ ] Shows "+N more" when order has more than 3 items
- [ ] Table cells use proper padding (`px-4 py-3`)

### Styling Verification
- [ ] Table has dark theme styling (`bg-gray-800`, `border-gray-700`)
- [ ] Header row has darker background (`bg-gray-700`)
- [ ] Text colors: headers (`text-gray-300`), content (`text-white`, `text-gray-300`)
- [ ] Hover effect on table rows (`hover:bg-gray-750`)
- [ ] Table is hidden on mobile (`hidden md:block`)

### Amount Display
- [ ] Amount shows proper currency formatting with comma separators
- [ ] Green text (`text-green-400`) for completed orders
- [ ] Yellow text (`text-yellow-400`) for pending orders
- [ ] Numbers formatted using `toLocaleString('en-KE')` with 2 decimal places

### Products Column
- [ ] Shows maximum 3 items per order
- [ ] Format: "ProductName xQuantity" (e.g., "Sukari x2")
- [ ] Items separated by commas and spaces
- [ ] "+N more" appended when items > 3
- [ ] Column has max width and truncates with tooltip (`max-w-xs truncate title`)

## ✅ Frontend Mobile Cards Implementation

### Card Structure
- [ ] Cards visible only on mobile (`md:hidden`)
- [ ] Each card has proper styling (`p-4 mb-2 bg-gray-800 rounded border border-gray-700`)
- [ ] Header shows Order # and status badge in justified layout
- [ ] Content shows Customer, Date, Amount, Items in vertical stack

### Mobile Card Content
- [ ] Customer line: "Customer: [Name]"
- [ ] Date line: "Date: [YYYY-MM-DD]"
- [ ] Amount line: "Amount: KES [formatted amount]"
- [ ] Items line: "Items: [truncated item list]"
- [ ] Reference line (if present): "Ref: [reference]"

### Mobile Amount Display
- [ ] Amount shows bold styling (`font-bold`)
- [ ] Green text (`text-green-400`) for completed orders
- [ ] Yellow text (`text-yellow-400`) for pending orders
- [ ] Proper KES formatting with comma separators

### Mobile Items Display
- [ ] Items text truncated after 50 characters with ellipsis
- [ ] Shows up to 3 items with "+N more" format
- [ ] Proper text color (`text-gray-300`)

## ✅ Data Handling & State Management

### React Query Integration
- [ ] Fetch request uses existing `/api/reports/orders` endpoint
- [ ] Query handles `period`, `q` (search), and pagination parameters
- [ ] Response correctly parsed and mapped to UI components
- [ ] Loading states work properly during data fetch
- [ ] Error states display appropriate messages

### Items Processing Logic
- [ ] Frontend correctly slices items array to first 3 items
- [ ] Remaining count calculation works: `order.items.length - 3`
- [ ] Items text formatting: `${item.productName} x${item.qty}`
- [ ] Comma separation between items works correctly
- [ ] "+N more" only shows when remainingCount > 0

## ✅ Styling & Layout Verification

### Color Scheme Compliance
- [ ] Green text (`text-green-400`) used for completed order amounts
- [ ] Yellow text (`text-yellow-400`) used for pending order amounts
- [ ] Status badges maintain existing color scheme
- [ ] Dark theme compatibility maintained throughout

### Responsive Design
- [ ] Desktop table appears on `md` screens and larger
- [ ] Mobile cards appear on screens smaller than `md`
- [ ] No layout breaks when switching between breakpoints
- [ ] Table scrolls horizontally if content overflows
- [ ] Mobile cards stack properly in vertical layout

### Typography & Spacing
- [ ] Table text uses appropriate sizes (`text-sm`)
- [ ] Proper line height and spacing between elements
- [ ] No text overlap or cramped layouts
- [ ] Consistent padding and margins throughout

## ✅ Edge Cases & Error Handling

### Data Edge Cases
- [ ] Orders with no items display gracefully
- [ ] Orders with single item don't show "+0 more"
- [ ] Very long product names truncate properly
- [ ] Large quantities display correctly
- [ ] Zero amounts display as "0.00"

### Layout Edge Cases
- [ ] Table handles very long customer names
- [ ] Mobile cards work with long product lists
- [ ] Status badges don't break layout
- [ ] Empty states display when no orders found

### Performance Considerations
- [ ] Large order lists render smoothly
- [ ] Item processing doesn't cause lag
- [ ] Table scrolling performance is acceptable
- [ ] Mobile card rendering is smooth

## ✅ Integration Testing

### Full Workflow Test
- [ ] Create test order with multiple items
- [ ] Verify order appears in Reports → Orders Record
- [ ] Check desktop table shows all columns correctly
- [ ] Switch to mobile view and verify card layout
- [ ] Test search and filtering with new layout
- [ ] Verify pagination works with new structure

### Cross-Browser Compatibility
- [ ] Chrome: Table and cards render correctly
- [ ] Firefox: Responsive layout works
- [ ] Safari: Mobile cards display properly
- [ ] Edge: All styling appears correctly

---

## Test Completion Status

**Date Tested**: ___________  
**Tested By**: ___________  
**Environment**: ___________  

**Overall Status**: 
- [ ] All tests pass - Ready for deployment
- [ ] Some issues found - Needs fixes  
- [ ] Major issues found - Requires rework

**Issues Found**:
_________________________________
_________________________________

**Notes**:
_________________________________
_________________________________