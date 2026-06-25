# Firebase Backend Setup — Reviewer Pipeline

Follow these steps **in order** after the UI is deployed.

---

## Step 1 — Go to Firebase Console

Open [https://console.firebase.google.com](https://console.firebase.google.com) and select your existing project (the one your `VITE_FIREBASE_PROJECT_ID` points to).

---

## Step 2 — Enable Cloud Firestore

1. In the left sidebar, click **Build → Firestore Database**.
2. Click **Create database**.
3. Choose **Production mode** (you will set rules in Step 4).
4. Choose the closest region (e.g. `asia-south1` for India).
5. Click **Enable**.

---

## Step 3 — Create the Collections

You need two collections: `users` and `contributions`.

### 3a — Create `users` collection

This is created automatically the first time a user logs in (the app writes the doc). But you can seed your own reviewer account manually:

1. In Firestore, click **Start collection**.
2. Collection ID: `users`
3. Document ID: paste your Firebase UID (find it in **Authentication → Users → copy UID**).
4. Add these fields:

| Field | Type | Value |
|---|---|---|
| `uid` | string | *(your UID)* |
| `email` | string | *(your email)* |
| `displayName` | string | *(your name)* |
| `roles` | array | `["contributor", "reviewer"]` |
| `isActive` | boolean | `true` |
| `createdAt` | timestamp | *(now)* |
| `updatedAt` | timestamp | *(now)* |

> **To add other reviewers later:** Find their UID in Authentication → Users, open their doc in `users/{uid}`, and edit the `roles` array to include `"reviewer"`.

### 3b — `contributions` collection

This is created automatically when the first contributor submits a contribution.  
The document structure the app expects:

| Field | Type | Description |
|---|---|---|
| `uid` | string | Contributor's Firebase UID |
| `contributorEmail` | string | Contributor's email |
| `contributorName` | string | Contributor's display name |
| `promptId` | string | ID of the English prompt shown |
| `promptEnglish` | string | The English text they translated |
| `promptType` | string | `"word"` or `"sentence"` |
| `category` | string | e.g. `"food"`, `"emotions"` |
| `translation` | string | Their Thanjavur Marathi translation |
| `confidence` | string | `"confident"`, `"partially-sure"`, `"not-sure"` |
| `audioUrl` | string? | Audio source URL (Firebase Storage URL or base64 Data URL on Spark) |
| `status` | string | `"pending"` (initial), `"approved"`, `"rejected"` |
| `reviewerUid` | string? | UID of reviewer who acted |
| `reviewerComment` | string? | Rejection reason |
| `reviewedAt` | timestamp? | When reviewed |
| `submittedAt` | timestamp | When submitted |

---

## Step 4 — Set Firestore Security Rules

In Firestore Console → **Rules** tab, replace the default rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection: users can read/create their own doc; reviewers and admins can read all
    match /users/{uid} {
      allow read: if request.auth != null && (
        request.auth.uid == uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['reviewer', 'admin'])
      );
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null && (
        request.auth.uid == uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['admin'])
      );
    }

    // Contributions: authenticated users can read (needed for prompt cap checks);
    // contributors create their own; reviewers/admins update review fields.
    match /contributions/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.uid == request.auth.uid
        && request.resource.data.status == 'pending';
      allow update: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles.hasAny(['reviewer', 'admin'])
        && request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['status', 'reviewerUid', 'reviewerComment', 'reviewedAt']);
    }

  }
}
```

Click **Publish**.

---

## Step 5 — Create Firestore Indexes

The reviewer query uses a **composite index** on `contributions`:

| Collection | Fields to index | Query scope |
|---|---|---|
| `contributions` | `status` (Ascending), `submittedAt` (Descending) | Collection |

**How to create it:**
1. Go to Firestore → **Indexes** → **Composite** tab.
2. Click **Add index**.
3. Collection ID: `contributions`
4. Add field: `status` — Ascending
5. Add field: `submittedAt` — Descending
6. Query scope: Collection
7. Click **Create**.

> Alternatively, just open the app with a reviewer account and click the **Review** tab. Firestore will show an error in the browser console with a direct link to create the required index. Click that link.

---

## Step 6 — Voice Recording Options (Spark vs Blaze)

If Firebase shows "To use Storage, upgrade your project's pricing plan", you are on the Spark plan.

Use one of these options:

### Option A (No upgrade, Spark-safe): Store short audio directly in Firestore

- Keep clips short (recommended: 3 to 8 seconds).
- Convert the recorded Blob to a Data URL string (base64) in the browser.
- Save that string in the contribution document as `audioUrl`.

Why this works:
- Your reviewer UI already uses `<audio src={audioUrl}>`.
- A Data URL can be played the same way as a normal HTTPS URL.
- No Firebase Storage setup required.

Important limit:
- Firestore document size max is 1 MiB.
- Base64 increases size by about 33%, so keep recordings very short.

### Option B (Recommended for longer recordings): Upgrade to Blaze and use Firebase Storage

If you upgrade later, then enable Storage and use the rules below.

1. In the left sidebar, click **Build → Storage**.
2. Click **Get started**.
3. Choose **Production mode**.
4. Select the same region as Firestore.
5. Click **Done**.

Storage rules:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /audio/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('audio/.*');
    }
  }
}
```

---

## Step 7 — Wire up ContributorPage to Firestore

`ContributorPage` now writes to Firestore and enforces a hard cap of **3 submissions per prompt**.

Cap behavior:
- Prompts with 3 or more submissions are hidden from the contributor queue.
- Submit uses a Firestore transaction to re-check the count and block race conditions.
- If another user fills the 3rd slot first, the current submit is rejected for that prompt and the UI moves to another prompt.

Transaction pattern used in `ContributorPage.tsx`:

```ts
import {
  collection,
  doc,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

await runTransaction(db, async (transaction) => {
  const existingForPrompt = query(
    collection(db, 'contributions'),
    where('promptId', '==', currentPrompt.id)
  );
  const existingSnapshot = await transaction.get(existingForPrompt);
  if (existingSnapshot.size >= 3) {
    throw new Error('prompt-cap-reached');
  }

  const newContributionRef = doc(collection(db, 'contributions'));
  transaction.set(newContributionRef, {
    uid: user.uid,
    contributorEmail: user.email ?? '',
    contributorName: user.displayName ?? '',
    promptId: currentPrompt.id,
    promptEnglish: currentPrompt.english,
    promptType: currentPrompt.type,
    category: currentPrompt.category,
    translation: `${romanized.trim()} | ${devanagari.trim()}`,
    confidence: selectedConfidence,
    audioUrl: audioDataUrl,
    status: 'pending',
    reviewerUid: null,
    reviewerComment: null,
    reviewedAt: null,
    submittedAt: serverTimestamp(),
  });
});
```

If you are on Spark and cannot use Storage, use this helper and save Data URL in `audioUrl`:

```ts
async function blobToDataUrl(blob: Blob): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Example before addDoc:
const audioDataUrl = audioBlob ? await blobToDataUrl(audioBlob) : null;
```

Then in your Firestore write payload:

```ts
audioUrl: audioDataUrl,
```

If you move to Blaze later, replace `audioDataUrl` with a Firebase Storage download URL.

---

## Step 8 — Assign Reviewer Role to a User

1. Go to Firestore → `users` collection.
2. Find the document where `email` matches the person you want to promote.
3. Edit the `roles` field (array) → add `"reviewer"`.
4. Save.

The user will see the **Review** tab on their next login (or after refresh).

---

## Step 9 — Test End-to-End

1. Log in as a **contributor** → submit a test contribution via the Contribute tab.
2. Log in as a **reviewer** → open the Review tab → you should see the pending submission.
3. Approve or reject it.
4. Verify the document in Firestore shows the updated `status`, `reviewerUid`, and `reviewedAt`.

---

## Optional: Promote yourself to Admin

In `users/{your-uid}`, set `roles` to `["contributor", "reviewer", "admin"]`.  
Admin users can see all tabs and will be able to update other users' roles in future admin tooling.