# User Authentication and Email Access Setup

This document explains the Firebase Functions that automatically create user documents in Firestore when users authenticate via Google (or other providers).

## Overview

When a user logs in with Google for the first time, a Firebase Function (`createUserDocument`) automatically:
1. Creates a user document in the `users` collection
2. Sets the `emailAccess` field based on email domain or specific email addresses
3. Assigns appropriate roles (admin/user)

## Functions

### 1. `createUserDocument` (Auth Trigger)
- **Trigger**: Fires when a new user is created via Firebase Auth
- **Purpose**: Automatically creates a user document in Firestore
- **Key Features**:
  - Checks if user email belongs to allowed domains (`relocato.de`, `umzugsapp.de`)
  - Grants email access to specific emails
  - Assigns admin role to users with email access
  - Logs errors in the `errors` collection

### 2. `updateUserEmailAccess` (Callable Function)
- **Purpose**: Allows admins to grant/revoke email access
- **Usage**: 
  ```javascript
  const functions = firebase.functions();
  const updateAccess = functions.httpsCallable('updateUserEmailAccess');
  
  await updateAccess({
    userId: 'user-uid-here',
    emailAccess: true  // or false to revoke
  });
  ```

### 3. `createUserDocumentManually` (Callable Function)
- **Purpose**: Creates user documents for existing authenticated users
- **Use Case**: Migration or when users signed up before the auth trigger was deployed
- **Usage**:
  ```javascript
  const functions = firebase.functions();
  const createDoc = functions.httpsCallable('createUserDocumentManually');
  
  await createDoc(); // No parameters needed, uses current user
  ```

### 4. `listUsers` (Callable Function)
- **Purpose**: Lists all users with optional filters (admin only)
- **Usage**:
  ```javascript
  const functions = firebase.functions();
  const listUsers = functions.httpsCallable('listUsers');
  
  const result = await listUsers({
    filters: {
      emailAccess: true,  // optional
      role: 'admin',      // optional
      isActive: true      // optional
    }
  });
  ```

## User Document Structure

```javascript
{
  uid: "firebase-auth-uid",
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",
  emailAccess: true/false,
  role: "admin" | "user",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLogin: Timestamp,
  authProvider: "google.com",
  isActive: true
}
```

## Configuration

### Allowed Email Domains
Edit in `index.js` or `userManagement.js`:
```javascript
const allowedDomains = ['relocato.de', 'umzugsapp.de'];
```

### Specific Allowed Emails
Edit in `index.js` or `userManagement.js`:
```javascript
const allowedEmails = ['admin@example.com', 'test@example.com'];
```

## Deployment

Deploy these functions using:
```bash
firebase deploy --only functions:createUserDocument,functions:updateUserEmailAccess,functions:createUserDocumentManually,functions:listUsers
```

Or deploy all functions:
```bash
firebase deploy --only functions
```

## Security Rules

Make sure your Firestore security rules allow:
1. Users to read their own document
2. Only admins to read/write other user documents
3. The functions to create/update user documents

Example rules:
```javascript
match /users/{userId} {
  allow read: if request.auth != null && 
    (request.auth.uid == userId || 
     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
  
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## Testing

1. Sign in with a Google account
2. Check Firestore to see if user document was created
3. Verify `emailAccess` field is set correctly based on email domain
4. Test manual functions using the Firebase SDK in your app

## Troubleshooting

- Check the `errors` collection for any user creation errors
- Verify Firebase Admin SDK is initialized properly
- Ensure the functions are deployed to the correct region (europe-west1)
- Check function logs: `firebase functions:log`