# Reviewer Workflow + Submission Pipeline Instructions

## Firebase Auth + Firestore + Firebase Storage + GitHub Pages

## Goal

Build the submission and reviewer workflow for the contributed words in the Thanjavur Marathi contribution app.

The frontend is hosted on GitHub Pages.

The backend and database are fully on Firebase:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage

The app already requires login through Firebase Auth before the user can access the app.

The app must support **dual-role users**:
- a user can contribute content
- the same user can also have reviewer access
- role assignment must be controlled from Firestore, not hardcoded in the frontend

---

# Role-Based Access Requirement

## Roles
Use Firestore-driven roles so the interface can change without redeploying code.

Supported roles:
- `contributor`
- `reviewer`
- `admin`

## Dual-role behavior
A user may be:
- contributor only
- reviewer only
- both contributor and reviewer

To support this, store roles as a list or permissions object in Firestore.

### Recommended fields in `users`
- `uid`
- `email`
- `displayName`
- `roles`
- `isActive`
- `createdAt`
- `updatedAt`

### Recommended `roles` format
Use an array so one user can have both roles.

Example:
```json
{
  "uid": "abc123",
  "email": "reviewer@example.com",
  "displayName": "Reviewer Name",
  "roles": ["contributor", "reviewer"],
  "isActive": true
}