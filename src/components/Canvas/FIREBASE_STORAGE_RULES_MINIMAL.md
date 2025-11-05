# Firebase Storage Rules - MINIMAL VERSION (No Read Access)

## Recommended Rules for Current Implementation

Since your app currently **only uploads** recordings but **does not read/download** them, you can use more restrictive rules:

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {

    // Canvas Recordings - WRITE ONLY (Upload only, no read access from app)
    match /canvas-recordings/{userId}/{fileName} {

      // Allow authenticated users to WRITE to their own folder only
      // Users CANNOT read back their recordings (not needed yet)
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && validateRecording();

      // IMPORTANT: Read is NOT allowed through the app
      // You (the admin) can still access files via Firebase Console
      allow read: if false;

      // Validation function for recordings
      function validateRecording() {
        // Check file size (max 10MB)
        let maxSize = 10 * 1024 * 1024;

        // Check file type (only audio files)
        let allowedTypes = ['audio/webm', 'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/mp4', 'audio/ogg'];

        // Check filename format (must end with .webm, .wav, .mp3, .mp4, or .ogg)
        let validExtensions = fileName.matches('.*\\.(webm|wav|mp3|mp4|ogg)$');

        return request.resource.size <= maxSize
               && request.resource.contentType in allowedTypes
               && validExtensions;
      }
    }

    // Deny all other access by default
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Why This is More Secure

### 1. **Write-Only Access**
```javascript
allow read: if false;  // No one can read through the app
```
- Users can upload but cannot download
- Prevents users from accessing files programmatically
- You can still access files as admin via Firebase Console

### 2. **Future-Proof**
When you add a feature to list/play recordings, you can easily update to:
```javascript
allow read: if request.auth != null && request.auth.uid == userId;
```

---

## Comparison

| Feature | FULL RULES | MINIMAL RULES (Current) |
|---------|-----------|------------------------|
| Upload recordings | ✅ Allowed | ✅ Allowed |
| Download recordings | ✅ Allowed (if you build the feature) | ❌ Blocked |
| User isolation | ✅ Yes | ✅ Yes |
| File validation | ✅ Yes | ✅ Yes |
| Admin access (Console) | ✅ Yes | ✅ Yes |
| **Security** | Good | **Better** (more restrictive) |

---

## Which Should You Use?

### Use **MINIMAL RULES** (this file) if:
- ✅ You're launching now without playback feature
- ✅ You want maximum security
- ✅ You'll add read access later when needed

### Use **FULL RULES** (FIREBASE_STORAGE_RULES.md) if:
- ✅ You're planning to add playback feature soon
- ✅ You want to test download URLs now
- ✅ You want to avoid updating rules later

---

## Vulnerabilities Addressed

### ❌ Without Any Rules:
```javascript
// BAD - Default rules (NEVER use in production!)
allow read, write: if request.auth != null;
```
**Problems**:
- Any logged-in user can access ANY file
- User A can download User B's recordings
- No file size limits
- No file type validation
- Expensive storage abuse possible

### ✅ With Minimal Rules:
```javascript
allow write: if request.auth != null && request.auth.uid == userId && validateRecording();
allow read: if false;
```
**Protection**:
- ✅ Users isolated to their own folders
- ✅ File size limited to 10MB
- ✅ Only audio files accepted
- ✅ No read access from app (extra security)
- ✅ Admin can still access via Console

---

## How to Apply

### Step 1: Go to Firebase Console
1. Open https://console.firebase.google.com/
2. Select your project
3. Click "Storage" → "Rules"

### Step 2: Copy Minimal Rules
Copy the rules from the top of this file

### Step 3: Publish
Click "Publish" button

---

## When to Update to Full Rules

Add read access when you implement:
1. **Playback feature** - Listen to recordings in the app
2. **Recording list** - Show user's recordings
3. **Download feature** - Download recordings locally
4. **Sharing feature** - Share recordings with others

**Update read rule to**:
```javascript
allow read: if request.auth != null && request.auth.uid == userId;
```

---

## Admin Access (Always Available)

Even with `allow read: if false`, you as the admin can:
- ✅ View all files in Firebase Console
- ✅ Download any recording
- ✅ Delete any recording
- ✅ See file metadata (size, upload date, etc.)

Go to: Firebase Console → Storage → Files → canvas-recordings

---

## Testing

### Test Upload (Should Work):
```javascript
// User uploads their own recording
const storageRef = ref(storage, `canvas-recordings/${currentUser.uid}/test.webm`);
await uploadBytes(storageRef, audioBlob);
// ✅ SUCCESS
```

### Test Read from App (Should Fail):
```javascript
// User tries to download their own recording
const storageRef = ref(storage, `canvas-recordings/${currentUser.uid}/test.webm`);
await getDownloadURL(storageRef);
// ❌ FAILURE: Permission denied (as intended)
```

### Test Admin Access (Should Work):
1. Go to Firebase Console → Storage
2. Navigate to canvas-recordings/{userId}/
3. Click on a file
4. Click "Download"
// ✅ SUCCESS (admin access works)

---

## Summary

**For your current implementation (upload only, no playback):**

✅ **Use MINIMAL RULES** from this file
- More secure (write-only)
- No unnecessary read permissions
- Prevents potential security issues
- Easy to update later when needed

**Current Status**:
- Users can upload ✅
- Users cannot download ❌ (good - not needed yet)
- You can access everything via Console ✅
- Fully secured against abuse ✅

**Recommendation**: Apply these minimal rules NOW, then update to full rules when you add playback/download features.
