# Progressive Profiling Flash Screen

## Overview

The Progressive Profiling Flash Screen is a mobile-first feature that collects essential seller/service provider information through a series of guided steps. It appears automatically for new sellers on mobile devices and uses Redux for state management with Twilio integration for phone verification.

## Features

✅ **Phone Verification** - Collect and verify phone numbers via SMS OTP
✅ **OTP Validation** - 6-digit code verification with Twilio
✅ **Username Availability Check** - Real-time username validation
✅ **Sector & Service Selection** - Pick sectors and services offered
✅ **Progressive Steps** - Guided onboarding experience
✅ **Mobile-First** - Optimized for native and web mobile devices
✅ **Dark Mode Support** - Full dark theme compatibility
✅ **Persistence** - Redux persist for resuming incomplete flows

## Architecture

### Redux Slice Structure (`progressiveProfilingSlice.ts`)

The slice manages:
- **Step tracking** - Current step, completed steps
- **Phone verification** - Phone number, verification status, errors
- **OTP flow** - OTP code, attempts, expiry time, resend functionality
- **Username** - Username, availability status, validation
- **Sectors & Services** - Selected sectors and their services
- **Overall state** - Loading, errors, completion status

### Components

#### 1. **ProgressiveProfilingFlash** (Main orchestrator)
   - Manages the overall flow
   - Routes between different step components
   - Handles transitions and completion

#### 2. **PhoneVerification**
   - Phone number input with formatting
   - Auto-formatted display (e.g., +91 XXXXX XXXXX)
   - Validation before sending OTP
   - Optional skip for later

#### 3. **OTPVerification**
   - 6-digit OTP input with real-time feedback
   - Auto-expiring timer (5 minutes)
   - Resend functionality
   - Attempt tracking (max 3 attempts)
   - Visual status indicators

#### 4. **UsernameCheck**
   - Username input with real-time availability check
   - Requirements validation:
     - 3-30 characters
     - Letters, numbers, underscore only
     - Must be available
   - Visual feedback (green check, red X, loading)

#### 5. **SectorSelection**
   - Browse all sectors from config
   - Expandable service lists per sector
   - Multi-select functionality
   - Selection summary
   - Minimum selection requirement (1 sector, 1 service)

### Services

#### VerificationService (`verificationService.ts`)
```typescript
- sendOTP(phoneNumber)          // Send OTP via Twilio
- verifyOTP(phoneNumber, code)  // Verify OTP code
- resendOTP(phoneNumber)        // Resend OTP
- normalizePhoneNumber()        // Format phone numbers
- formatPhoneForDisplay()       // User-friendly display
- isValidPhoneNumber()          // Validation
- getOTPExpiryTime()           // Get expiry duration
```

### Hook

#### useProgressiveProfiling
```typescript
// Check if profiling is required and not completed
const isProfilingRequired = boolean;

// Methods
checkProfilingRequired(isRequired)  // Set requirement
reset()                             // Reset all state
markComplete()                      // Mark as complete

// State access
currentStep, completedSteps, phoneNumber, username, selectedSectors, etc.
```

## Integration

### 1. **Redux Store** (`store/index.ts`)
```typescript
import progressiveProfilingReducer from './slices/progressiveProfilingSlice';

// Added to rootReducer with persist config
profiling: persistReducer(profilingPersistConfig, progressiveProfilingReducer)
```

### 2. **Protected Route Wrapper** (`ProtectedRoute.tsx`)
```typescript
const { isProfilingRequired, profilingComplete } = useProgressiveProfiling();

// Shows flash screen if required and not complete
if (isProfilingRequired && !profilingComplete) {
  return <ProgressiveProfilingFlash />;
}
```

### 3. **Automatic Display Logic**
- ✅ Only on mobile/native platforms (via `usePlatform()`)
- ✅ Only for seller/service provider role
- ✅ Only on first login (when not completed)
- ✅ Can be skipped and resumed later

## Flow Diagram

```
┌─────────────────────────┐
│  New Seller Login       │
│  (Mobile Device)        │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Profiling Required Check           │
│  - Mobile? ✓                        │
│  - Seller Role? ✓                  │
│  - Not Completed? ✓                │
└────────────┬────────────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  STEP 1: Phone Verification  │
│  - Enter phone number        │
│  - Validate format           │
│  - Send OTP                  │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  STEP 2: OTP Verification    │
│  - Enter 6-digit code        │
│  - Verify with backend       │
│  - Handle retries            │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  STEP 3: Username Selection  │
│  - Choose unique username    │
│  - Real-time availability    │
│  - Validation rules          │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  STEP 4: Sector/Services     │
│  - Select sectors            │
│  - Select services per sector│
│  - Save to backend           │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│  ✓ Profiling Complete        │
│  - Flash closes              │
│  - Access dashboard granted  │
└──────────────────────────────┘
```

## Backend API Requirements

### Endpoints Required

#### 1. **POST /api/verification/send-otp**
```json
// Request
{
  "phoneNumber": "+91XXXXXXXXXX"
}

// Response
{
  "success": true,
  "message": "OTP sent successfully"
}
```

#### 2. **POST /api/verification/verify-otp**
```json
// Request
{
  "phoneNumber": "+91XXXXXXXXXX",
  "otpCode": "123456"
}

// Response
{
  "verified": true,
  "token": "verification_token_optional"
}
```

#### 3. **GET /api/users/check-username**
```json
// Request Query Params
?username=john_doe

// Response
{
  "available": true,
  "message": "Username available"
}
```

#### 4. **POST /api/users/sectors**
```json
// Request
{
  "userId": "user_id",
  "sectors": ["Technology", "Electrician"],
  "services": {
    "Technology": ["Web Development", "IT Consultation"],
    "Electrician": ["Wiring Installation"]
  }
}

// Response
{
  "success": true,
  "message": "Sectors and services saved"
}
```

## Styling & Theming

All components support:
- ✅ Light mode (default)
- ✅ Dark mode (dark:* Tailwind classes)
- ✅ Mobile responsiveness
- ✅ Touch-friendly inputs
- ✅ Loading states
- ✅ Error states
- ✅ Success feedback

### Key Colors
- **Primary**: Rose-600 (#e11d48)
- **Success**: Green-500 (#22c55e)
- **Error**: Red-500 (#ef4444)
- **Info**: Blue-600 (#2563eb)

## Configuration

### Redux Persist Config
```typescript
const profilingPersistConfig = {
  key: 'profiling',
  version: 1,
  storage,
  whitelist: [
    'currentStep',
    'completedSteps',
    'phoneNumber',
    'username',
    'selectedSectors',
    'selectedServices',
    'profilingComplete'
  ]
};
```

### OTP Expiry
Default: 5 minutes (300 seconds)
Can be configured in `VerificationService.getOTPExpiryTime()`

### Maximum Attempts
Default: 3 OTP verification attempts
Can be configured in `progressiveProfilingSlice.ts` initialState

## Usage Examples

### 1. Check if profiling is required
```typescript
const { isProfilingRequired } = useProgressiveProfiling();

if (isProfilingRequired) {
  // Show flash or alert
}
```

### 2. Reset profiling (for testing/debugging)
```typescript
const { reset } = useProgressiveProfiling();

const handleReset = () => {
  reset();
  // User can start profiling again
};
```

### 3. Access profiling state
```typescript
const {
  currentStep,
  phoneNumber,
  username,
  selectedSectors,
  selectedServices,
  profilingComplete
} = useProgressiveProfiling();

console.log(`User on step: ${currentStep}`);
console.log(`Selected sectors: ${selectedSectors.join(', ')}`);
```

## Future Enhancements

1. **Document Upload** - Upload business license, ID proofs
2. **Payment Info** - Bank account details for payouts
3. **Availability Schedule** - Set working hours and days
4. **Pricing Tiers** - Define service pricing and packages
5. **Service Customization** - Upload photos, descriptions, ratings
6. **Email Verification** - Optional email verification step
7. **Address Verification** - Service location details
8. **Multi-language** - Localize the entire flow
9. **Skip Profiling** - Complete it later from dashboard
10. **Edit Profile** - Update profiling info after initial setup

## Troubleshooting

### Common Issues

#### 1. Flash not showing on mobile
- ✓ Check if `usePlatform()` is detecting native platform correctly
- ✓ Verify user role is 'seller'
- ✓ Ensure profiling is not already marked complete

#### 2. OTP not being sent
- ✓ Verify Twilio credentials in backend
- ✓ Check phone number format validation
- ✓ Ensure API endpoint is accessible
- ✓ Check network connectivity

#### 3. Username check slow
- ✓ Debounce is set to 500ms, increase if needed
- ✓ Check backend query performance
- ✓ Verify database indexes on username field

#### 4. Form validation not working
- ✓ Check regex patterns in UsernameCheck component
- ✓ Verify minimum selection requirements
- ✓ Ensure Redux state is updating correctly

## Testing

### Unit Test Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import PhoneVerification from './PhoneVerification';

test('renders phone input', () => {
  render(<PhoneVerification onPhoneSent={() => {}} />);
  expect(screen.getByPlaceholderText(/phone/i)).toBeInTheDocument();
});

test('validates phone number before sending', () => {
  const mockOnSent = jest.fn();
  render(<PhoneVerification onPhoneSent={mockOnSent} />);
  
  const input = screen.getByPlaceholderText(/phone/i);
  fireEvent.change(input, { target: { value: '123' } });
  fireEvent.click(screen.getByText(/send/i));
  
  expect(mockOnSent).not.toHaveBeenCalled();
});
```

## Notes

- Phone numbers are normalized to +91 format for Indian numbers
- OTP codes are 6 digits
- Usernames support letters, numbers, and underscores only
- All API calls use the existing `api` instance from ApiService
- Redux persist ensures users can resume if interrupted
- Mobile detection uses Capacitor platform detection
- Dark mode fully supported with Tailwind dark: classes
