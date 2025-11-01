# Update Subscription Fee and Add 30-Day Auto-Lock Feature

## Backend Changes

- [x] Update User Model (`backend/models/User.js`):

  - Add `isLocked: Boolean` (default: false)

- [x] Update Auth Routes (`backend/routes/auth.js`):

  - Implement 30-day auto-lock logic on login
  - Check if user hasn't paid and 30+ days since last login
  - Set isLocked = true and logout user if expired
  - Return appropriate error message for locked users

- [x] Update Admin Routes (`backend/routes/admin.js`):
  - When confirming payment, set isLocked = false automatically

## Frontend Changes

- [x] Update AdminPage Component (`frontend/src/components/AdminPage.js`):

  - Change all "700" references to "999"
  - Update payment notice message to mention 999
  - Update M-Pesa instructions to show 999 amount
  - Update WhatsApp message to mention 999

- [x] Update LoginPage (`frontend/src/pages/LoginPage.js`):
  - Handle locked user error message
  - Show "trial expired" message for locked accounts

## Testing

- [ ] Test 30-day auto-lock functionality
- [ ] Test payment confirmation unlocks account
- [ ] Test updated 999 fee displays correctly
- [ ] Test locked user login behavior
