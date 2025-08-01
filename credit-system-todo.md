
# Credit System Redesign - Todo List

## Overview
Implement a dual-pool credit system:
- **Free Messages Pool**: Resets daily (5-10 messages)
- **Paid Credits Pool**: Persistent until used
- **User Display**: Single total number (freeMessagesLeft + paidCredits)

## Database Schema Updates

### 1. Update User Model
- [ ] Add `freeMessagesLeft` field (number, default: 50 for new users)
- [ ] Add `paidCredits` field (number, default: 0)
- [ ] Add `lastFreeReset` field (timestamp for daily reset tracking)
- [ ] Add `hasEverPurchased` field (boolean, default: false)
- [ ] Keep existing `credits` field for backward compatibility during migration

### 2. Migration Strategy
- [ ] Create migration script to update existing users
- [ ] Move current `credits` to `paidCredits` for existing users
- [ ] Set appropriate `freeMessagesLeft` based on user status

## API Endpoint Updates

### 3. User Profile API (`/api/user/profile`)
- [ ] Update response to calculate total: `freeMessagesLeft + paidCredits`
- [ ] Still return single `credits` field for frontend compatibility
- [ ] Add internal tracking fields for admin/debugging

### 4. Message Deduction API (`/api/user/deduct-message`)
- [ ] Update logic to deduct from `freeMessagesLeft` first
- [ ] Then deduct from `paidCredits` if free messages exhausted
- [ ] Update total calculation after deduction

### 5. Daily Reset System
- [ ] Create daily reset cron job/scheduled function
- [ ] Check `lastFreeReset` timestamp
- [ ] Reset `freeMessagesLeft` to appropriate amount:
  - New users (never purchased): 50 messages one-time, then 5-10 daily
  - Users who have purchased: 5-10 daily
- [ ] Update `lastFreeReset` timestamp

### 6. Purchase Completion API (`/api/credits/complete`)
- [ ] Update to add credits to `paidCredits` field
- [ ] Set `hasEverPurchased` to true on first purchase
- [ ] Maintain existing PayPal integration

## Business Logic Implementation

### 7. Welcome Bonus System
- [ ] New users get 50 messages as `freeMessagesLeft`
- [ ] After exhausted, daily reset gives 5-10 messages
- [ ] Track user registration date for proper flow

### 8. Daily Reset Logic
- [ ] Implement daily reset function (runs at midnight or configurable time)
- [ ] Reset amount based on user status:
  - Never purchased: 5-10 messages daily
  - Has purchased: 5-10 messages daily (loyalty bonus)
- [ ] Ensure reset doesn't exceed daily limit

### 9. Purchase Flow Updates
- [ ] Maintain existing PayPal checkout process
- [ ] Update credit addition to use `paidCredits` pool
- [ ] Preserve daily free message resets after purchase

## Frontend Updates (Optional - Current UI Can Stay)

### 10. Display Logic
- [ ] Keep existing credit display (single number)
- [ ] Internal calculation: `freeMessagesLeft + paidCredits`
- [ ] No need to show separate pools to users

### 11. Admin Dashboard (Future)
- [ ] Add admin view to see separate pools
- [ ] Monitor daily reset functionality
- [ ] Track user engagement with new system

## Configuration & Constants

### 12. System Constants
- [ ] Define `WELCOME_BONUS` = 50
- [ ] Define `DAILY_FREE_MESSAGES` = 5 (or 10)
- [ ] Define `RESET_HOUR` = 0 (midnight UTC)
- [ ] Make these configurable via environment variables

## Testing & Validation

### 13. Test Scenarios
- [ ] Test new user registration flow
- [ ] Test daily reset functionality
- [ ] Test purchase flow with new credit pools
- [ ] Test message deduction priority (free first, then paid)
- [ ] Test edge cases (exactly 0 credits, etc.)

### 14. Data Validation
- [ ] Ensure no negative credit values
- [ ] Validate daily reset doesn't run multiple times
- [ ] Check total calculation accuracy

## Deployment Strategy

### 15. Rollout Plan
- [ ] Deploy database schema updates
- [ ] Run migration for existing users
- [ ] Deploy API endpoint updates
- [ ] Deploy daily reset system
- [ ] Monitor system for 24-48 hours
- [ ] Verify user behavior and engagement

## Key Benefits of This System
- ✅ Encourages purchases (small daily free amount)
- ✅ Retains users (always some free messages available)
- ✅ Simple user experience (single credit number)
- ✅ Flexible business model (adjustable daily amounts)
- ✅ Loyalty reward (paying customers keep daily bonus)

## Notes
- Keep existing PayPal integration unchanged
- Maintain backward compatibility during transition
- Monitor user behavior after implementation
- Adjust daily free message amount based on engagement data
