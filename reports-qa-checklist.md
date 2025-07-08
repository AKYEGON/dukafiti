# Reports Page Refactoring QA Checklist

## ✅ Summary Cards & Timeframe Functionality

### Summary Timeframe Dropdown
- [ ] Dropdown displays with options: "Today", "This Week", "This Month"
- [ ] Dropdown has green (#00AA00) border styling
- [ ] Changing dropdown selection triggers API call to `/api/reports/summary?period=`
- [ ] Loading spinner appears in cards while fetching data
- [ ] Cards update with new data after dropdown change

### Summary Cards Display
- [ ] Four cards displayed in responsive grid: Total Sales, Cash Sales, Mobile Money, Credit Sales
- [ ] Cards have black backgrounds with white text
- [ ] Numbers display in green (#00AA00) color
- [ ] Currency formatted as "KES X,XXX.XX"
- [ ] Cards show loading spinners during data fetch
- [ ] Error states display when API fails
- [ ] Cards scale on hover (hover:scale-105 effect)

## ✅ Graph Timeframe Functionality

### Graph Timeframe Selector
- [ ] Dropdown displays above chart with options: "Daily", "Weekly", "Monthly"
- [ ] Dropdown has green border styling
- [ ] Changing dropdown triggers API call to `/api/reports/trend?period=`
- [ ] Chart shows loading spinner while fetching data

### Chart Data Display
- [ ] **Daily view**: Shows 24 hourly points (00:00 to 23:00)
- [ ] **Weekly view**: Shows 7 daily points (Sun, Mon, Tue, Wed, Thu, Fri, Sat)
- [ ] **Monthly view**: Shows 30 daily points (day numbers 1-30)
- [ ] Chart re-renders correctly on period change
- [ ] Axes labels update appropriately for each view
- [ ] Line color is green (#00AA00)
- [ ] Tooltips show "KES X" format
- [ ] No data state displays "No data for this period"

## ✅ Backend API Endpoints

### Summary Endpoint (`/api/reports/summary`)
- [ ] Accepts `period` query parameter (today, weekly, monthly)
- [ ] Returns JSON with: `totalSales`, `cashSales`, `mobileMoneySales`, `creditSales`
- [ ] Values are formatted as strings with 2 decimal places
- [ ] Correctly filters orders by date range for each period
- [ ] Handles completed orders for cash/mobile money sales
- [ ] Handles pending orders for credit sales

### Trend Endpoint (`/api/reports/trend`)
- [ ] Accepts `period` query parameter (daily, weekly, monthly)
- [ ] Returns array of `{ label, value }` objects
- [ ] **Daily**: 24 objects with hourly labels (00:00, 01:00, etc.)
- [ ] **Weekly**: 7 objects with day labels (Sun, Mon, etc.)
- [ ] **Monthly**: 30 objects with day number labels (1, 2, 3, etc.)
- [ ] Values are numeric (not strings)
- [ ] Only includes completed orders in calculations

## ✅ UI/UX Details

### Sticky Header
- [ ] Header with dropdowns sticks to top of page
- [ ] Header has white/dark background with bottom border
- [ ] Dropdowns are properly aligned and responsive
- [ ] Export button positioned correctly in header

### Loading States
- [ ] Summary cards show spinners during data fetch
- [ ] Chart shows centered spinner during data fetch
- [ ] Dropdowns remain functional during loading
- [ ] Loading states don't interfere with user interaction

### Error Handling
- [ ] Summary cards show "Error loading" when API fails
- [ ] Chart shows "No data for this period" when API fails or returns empty data
- [ ] Toast notifications appear for export failures
- [ ] Retry functionality works for failed requests

### Responsive Design
- [ ] Cards display properly on mobile (1 column)
- [ ] Chart remains readable on mobile devices
- [ ] Dropdowns stack vertically on small screens
- [ ] All text remains readable at mobile sizes

## ✅ CSV Export Functionality

### Export Integration
- [ ] Summary export button works with new unified data
- [ ] Export includes all four summary metrics
- [ ] Top items export remains functional
- [ ] Orders export includes comprehensive order details
- [ ] WhatsApp/Email sharing works for all exports

## ✅ Styling Verification

### Color Scheme
- [ ] Green accents (#00AA00) used consistently for:
  - Dropdown borders
  - Summary card numbers
  - Chart line color
  - Export buttons
- [ ] Black backgrounds for cards maintained
- [ ] White text for readability
- [ ] Proper contrast ratios for accessibility

### Animations & Interactions
- [ ] Card hover effects (scale-105) work smoothly
- [ ] Dropdown animations function properly
- [ ] Loading spinners rotate correctly
- [ ] Button hover states provide visual feedback

## ✅ Data Integrity Checks

### Date Range Calculations
- [ ] "Today" includes current day from 00:00 to 23:59
- [ ] "This Week" includes last 7 days from current date
- [ ] "This Month" includes last 30 days from current date
- [ ] Timezone handling works correctly for user's location

### Data Accuracy
- [ ] Summary totals match individual payment method totals
- [ ] Trend data points sum correctly for time periods
- [ ] Orders are properly filtered by status for different calculations
- [ ] Currency formatting is consistent throughout

## ✅ Performance Checks

### API Response Times
- [ ] Summary endpoint responds within 1 second
- [ ] Trend endpoint responds within 1 second
- [ ] Chart re-renders smoothly without lag
- [ ] Multiple dropdown changes don't cause API request pile-up

### Caching Behavior
- [ ] React Query caching works properly for different periods
- [ ] Cache invalidation occurs when needed
- [ ] Stale data doesn't display after period changes

## ✅ Cross-Browser Compatibility

### Modern Browsers
- [ ] Chrome: All functionality works
- [ ] Firefox: All functionality works  
- [ ] Safari: All functionality works
- [ ] Edge: All functionality works

### Mobile Browsers
- [ ] Mobile Chrome: Touch interactions work
- [ ] Mobile Safari: Dropdowns function properly
- [ ] Mobile Firefox: Responsive design displays correctly

---

## Test Completion Status

**Date Tested**: ___________  
**Tested By**: ___________  
**Environment**: ___________  

**Overall Status**: 
- [ ] All tests pass - Ready for deployment
- [ ] Some issues found - Needs fixes
- [ ] Major issues found - Requires rework

**Notes**:
_________________________________
_________________________________
_________________________________