# Bug Fix: Expense Ordering (BUG-001)

## Summary

Fixed the issue where newly added expenses were not appearing at the top of the expense list. Expenses are now correctly ordered by their expense date (descending) instead of the creation timestamp.


## Root Cause

The backend API was returning expenses ordered by `created_at` (when the record was created in the database) instead of by the `date` field (the actual expense date that users specify).

### Problematic Behavior

```ruby
# Backend was ordering by created_at
expenses = Expense.includes(:category).order(created_at: :desc)
```

This caused expenses to be sorted by when they were added to the system, not by their actual expense date. For example:
- If a user added an expense dated January 1st on January 15th, it would appear at the top (newly created)
- If a user added an expense dated January 15th on January 16th, it would appear below the January 1st expense (created later but has a later date)

## Fix Applied (Frontend-Only)

Added client-side sorting in the frontend to order expenses by their `date` field after fetching from the API.

**File modified:** `frontend/src/pages/HistoryPage.tsx`

**Change:** In the `fetchExpenses` function, sort the data by date descending before setting state:

```typescript
const fetchExpenses = async () => {
  try {
    setLoading(true);
    let data = await getExpenses(selectedYear, selectedMonth);
    // Sort by date descending (most recent first)
    data = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setExpenses(data);
  } catch (error) {
    console.error("Error fetching expenses:", error);
  } finally {
    setLoading(false);
  }
};
```

## Why Frontend-Only Approach

1. **No backend changes required** - The backend API remains unchanged
2. **More flexible** - Easy to add different sorting options later (e.g., sort by amount, category)
3. **Faster for small datasets** - Sorting happens instantly in the browser

## Files Modified

- `frontend/src/pages/HistoryPage.tsx` (lines 52-56)

## Expected Behavior After Fix

- Expenses are now displayed with the most recent expense dates at the top
- When a new expense is added, it will appear at the correct position based on its expense date
- Expenses with the same date will maintain their relative order

## Testing

To verify the fix:
1. Add a new expense with today's date
2. Verify it appears at the top of the expense list
3. Add an expense with an earlier date
4. Verify it appears below expenses with later dates