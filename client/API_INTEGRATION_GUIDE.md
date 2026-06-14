# Frontend API Integration Guide

## Architecture Overview

This frontend uses **Redux Toolkit** for state management and **Axios** for API communication. All API calls are centralized in Redux slices with async thunks.

### File Structure

```
client/
├── lib/
│   ├── api.js                    # Axios instance with interceptors
│   ├── store.js                  # Redux store configuration
│   ├── hooks/
│   │   └── useAuth.js            # Custom auth hook
│   └── slices/
│       ├── authSlice.js          # Authentication state
│       ├── userSlice.js          # User profile & progress
│       ├── contentSlice.js       # Practice content (questions, mock tests)
│       ├── submissionSlice.js    # Submissions & feedback
│       └── subscriptionSlice.js  # Payment & subscription
├── components/
│   ├── ProtectedRoute.js         # Route protection wrapper
│   ├── Toast.js                  # Error/success notifications
│   └── layout/
│       ├── Navbar.js             # Updated with logout
│       └── ...
└── app/
    ├── providers.js              # Redux provider wrapper
    ├── layout.js                 # Updated with providers
    ├── login/page.js             # Wired to auth slice
    ├── dashboard/page.js         # Fetches profile & progress
    └── practice/*/page.js        # Wired to content & submission slices
```

## Key Features

### 1. Authentication Flow

**Login/Register** (`authSlice.js`):
- Handles user registration and login
- Stores tokens in cookies with secure flags
- Automatically refreshes expired tokens via interceptor
- Tokens are automatically included in all API requests

```javascript
// Usage in components
import { useAuth } from "@/lib/hooks/useAuth";

function MyComponent() {
  const { user, isAuthenticated, login, logout, error, loading } = useAuth();

  const handleLogin = async () => {
    await login(email, password);
  };
}
```

### 2. Axios Instance with Interceptors (`api.js`)

**Request Interceptor**:
- Automatically adds `Authorization: Bearer <token>` header to all requests
- Uses token from cookies

**Response Interceptor**:
- Catches 401 responses (token expired)
- Attempts to refresh token automatically
- If refresh fails, redirects to login

### 3. Redux Slices

#### `authSlice.js` - Authentication
- `loginUser()` - Login
- `registerUser()` - Register
- `verifyEmail()` - Verify email
- `refreshAccessToken()` - Refresh access token
- `requestPasswordReset()` - Request password reset
- `resetPassword()` - Reset password
- `logout()` - Clear tokens and state

#### `userSlice.js` - User Profile
- `fetchUserProfile()` - Get profile
- `updateUserProfile()` - Update profile
- `fetchUserProgress()` - Get progress data

#### `contentSlice.js` - Practice Content
- `fetchPracticeQuestions()` - Get practice questions with pagination
- `fetchQuestion()` - Get specific question
- `fetchMockTests()` - Get mock tests
- `fetchMockTest()` - Get specific mock test

#### `submissionSlice.js` - Submissions
- `createSubmission()` - Submit practice attempt
- `uploadAudio()` - Upload speaking audio
- `fetchSubmission()` - Get submission with feedback
- `autosaveDraft()` - Auto-save writing draft
- `requestExpertReview()` - Request expert review
- `rateFeedback()` - Rate AI feedback

#### `subscriptionSlice.js` - Payments
- `createSubscriptionOrder()` - Create Razorpay subscription
- `fetchSubscriptionStatus()` - Get current subscription state
- `cancelSubscription()` - Cancel subscription

## Protected Routes

Use `ProtectedRoute` wrapper to protect pages:

```javascript
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

## Error Handling

Toast component for error/success notifications:

```javascript
import { useToast } from "@/components/Toast";

function MyComponent() {
  const { showError, showSuccess } = useToast();

  const handleAction = async () => {
    try {
      // action
      showSuccess("Action successful!");
    } catch (error) {
      showError(error.message);
    }
  };
}
```

## Environment Variables

Create `.env.local` in the client directory:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

For production, update to your deployed backend URL.

## Token Management

- **Access Token**: Stored in `accessToken` cookie (expires in 15 minutes)
- **Refresh Token**: Stored in `refreshToken` cookie (expires in 7 days)
- **Auto Refresh**: Happens automatically when access token expires
- **Logout**: Clears both cookies and Redux state

## API Response Format

All backend responses follow this format:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {}
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": []
}
```

## Debugging

To check Redux state in browser console:

```javascript
// In any component
import store from "@/lib/store";
console.log(store.getState());
```

## Performance Tips

1. **Avoid unnecessary re-renders**: Use selectors carefully
2. **Memoize**: Use `useCallback` and `useMemo` for expensive operations
3. **Lazy Loading**: Only fetch data when needed in useEffect
4. **Pagination**: Use limit/page params when fetching lists

## Next Steps

1. Test login/register flow
2. Verify protected routes redirect unauthenticated users
3. Test token refresh on 401 responses
4. Expand route-specific flows for full mock-test section sequencing
5. Add more error boundaries and loading states
6. Test with actual backend API

