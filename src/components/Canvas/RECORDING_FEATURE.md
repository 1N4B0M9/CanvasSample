# Audio Recording Feature - Implementation Guide

## Overview

The Canvas system now includes an **Audio Recording** feature that allows authenticated users to record audio and upload it to Firebase Storage.

---

## Feature Summary

### What's New:
1. **Recording Button** in the toolbar (microphone icon)
2. **RecordingPanel** component with full recording UI
3. **Authentication Check** - Recording is disabled when user is not logged in
4. **Firebase Storage Upload** - Recordings are uploaded to user-specific folders
5. **Security Protections**:
   - ✅ 5-minute maximum recording duration
   - ✅ 10MB maximum file size
   - ✅ Auto-stop when limit reached
   - ✅ File size validation before upload
   - ✅ Firebase Storage security rules (see FIREBASE_STORAGE_RULES.md)

---

## Files Modified/Created

### 1. **NEW: RecordingPanel.jsx**
**Location**: `/src/components/Canvas/Components/Elements/ToolBar/Panels/RecordingPanel.jsx`

**Purpose**: Complete audio recording UI with Firebase Storage upload

**Features**:
- ✅ Start/Stop recording controls
- ✅ Real-time recording timer (MM:SS format)
- ✅ Visual recording indicator (red pulsing dot)
- ✅ Maximum duration display (shows "Max: 05:00")
- ✅ Authentication check (shows warning if not logged in)
- ✅ Upload to Firebase Storage
- ✅ Success/Error feedback
- ✅ Discard and re-record option
- ✅ Auto-close after successful upload
- ✅ **Auto-stop at 5-minute limit**
- ✅ **File size validation (10MB max)**

**Key Functions**:
- `startRecording()` - Requests microphone access and starts recording (RecordingPanel.jsx:43-103)
- `stopRecording()` - Stops recording and creates audio blob (RecordingPanel.jsx:106-117)
- `uploadToFirebase()` - Uploads audio to Firebase Storage (RecordingPanel.jsx:120-165)
- `discardRecording()` - Clears current recording (RecordingPanel.jsx:168-173)
- `formatTime()` - Formats seconds to MM:SS display (RecordingPanel.jsx:36-40)

**Code Quality**:
- ✅ PropTypes validation added (RecordingPanel.jsx:314-316)
- ✅ All ESLint warnings fixed
- ✅ Button types explicitly defined
- ✅ Self-closing JSX tags
- ✅ HTML entities properly escaped (&quot;)

**Storage Structure**:
```
canvas-recordings/
  └── {userId}/
      └── {timestamp}.webm
```

Example: `canvas-recordings/abc123/2025-10-31T12-30-45.webm`

---

### 2. **MODIFIED: ToolBar.jsx**
**Location**: `/src/components/Canvas/Components/Elements/ToolBar/ToolBar.jsx`

**Changes Made**:

#### Imports Added (Lines 2-4, 16-17):
```javascript
import PropTypes from 'prop-types';
import { IoMic } from 'react-icons/io5';
import { ref, uploadBytes, getStorage } from 'firebase/storage';
import RecordingPanel from './Panels/RecordingPanel';
import { useAuth } from '../../../../../firebase/AuthContext';
```

**Import Order Fixed**: External packages (firebase/storage) before internal modules (AuthContext) to comply with ESLint rules

#### Authentication Hook Added (Line 33):
```javascript
const { currentUser } = useAuth();
```

#### Recording Tool Added to BaseToolRegistry (Lines 92-98):
```javascript
{
  Icon: IoMic,
  label: 'Recording',
  action: 'panel',
  panelType: 'recording',
  disabled: !currentUser,  // Disabled when not logged in
},
```

#### Toolbar Rendering Updated to Handle Disabled State (Lines 145-147):
```javascript
const { Icon, label, disabled } = tool;
const isActive = activePanel === tool.panelType;
const isDisabled = disabled === true;
```

#### Disabled Button Styling (Lines 152-156):
```javascript
className={`group relative rounded-md p-2 transition-colors duration-150 ${
  isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : `cursor-pointer ${isActive ? 'bg-blue-200 hover:bg-blue-300' : 'hover:bg-blue-100'}`
}`}
```

#### Recording Panel Rendering (Line 226):
```javascript
{activePanel === 'recording' && <RecordingPanel onClose={closePanel} />}
```

---

## User Flow

### When User is NOT Logged In:
1. Recording button appears **grayed out** (50% opacity)
2. Tooltip shows: "Recording (Login required)"
3. Clicking the button does nothing
4. If somehow panel opens, shows warning: "Please log in to use the recording feature"

### When User IS Logged In:
1. Click the **Recording** button (microphone icon) in toolbar
2. RecordingPanel opens
3. Click **"Start Recording"** to begin
4. Recording timer starts (00:00, 00:01, 00:02...)
5. Red pulsing dot indicates active recording
6. Click **"Stop Recording"** when done
7. Two options appear:
   - **"Done - Upload Recording"** - Uploads to Firebase Storage
   - **"Discard & Record Again"** - Clears recording and allows re-recording
8. After upload, success message appears
9. Panel auto-closes after 2 seconds

---

## Technical Details

### Audio Recording API:
- Uses **MediaRecorder API** (browser built-in)
- Requests microphone permission via `navigator.mediaDevices.getUserMedia()`
- Records audio in **WebM format**
- Creates a `Blob` from audio chunks

### Firebase Storage:
- Initialized using `getStorage()` from `firebase/storage`
- Uses `uploadBytes()` to upload audio blob
- **Note**: `getDownloadURL()` is NOT used (removed for security)
  - With minimal Firebase rules (write-only), getting download URL would fail
  - Upload succeeds and file is stored successfully
  - Download URL only needed when implementing playback feature
- Storage path: `canvas-recordings/{userId}/{timestamp}.webm`

### File Naming:
- Format: ISO timestamp with special characters replaced
- Example: `2025-10-31T12-30-45-123Z.webm`
- Ensures unique filenames for each recording

### Error Handling:
- Microphone access denied → Shows error message
- Upload failure → Shows error with details (RecordingPanel.jsx:160-163)
- No user authenticated → Shows warning banner (RecordingPanel.jsx:191-194)
- File too large → Upload blocked with size error (RecordingPanel.jsx:127-130)
- Max duration reached → Auto-stop with error message (RecordingPanel.jsx:83-95)
- All errors are logged to console for debugging

### Timer Implementation:
- Fixed timer update issue (RecordingPanel.jsx:25-33)
  - useEffect cleanup with empty dependency array `[]`
  - Prevents re-running cleanup on every state change
  - Timer interval updates state correctly every second
- Variable shadowing fix (RecordingPanel.jsx:66)
  - Renamed `audioBlob` to `recordedBlob` in event listener
  - Prevents ESLint `no-shadow` warning

---

## Dependencies

### Existing (Already Installed):
- ✅ `firebase` (v9.23.0) - Already in package.json
- ✅ `react-icons` - Already in use for icons
- ✅ Browser MediaRecorder API - Built into modern browsers

### Firebase Storage Setup Required:
Make sure Firebase Storage is enabled in your Firebase Console:
1. Go to Firebase Console → Storage
2. Enable Storage if not already enabled
3. **IMPORTANT**: Set up security rules to prevent abuse (see FIREBASE_STORAGE_RULES.md for complete rules)

**Quick Setup** - Basic security rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /canvas-recordings/{userId}/{fileName} {
      allow write: if request.auth != null
                   && request.auth.uid == userId
                   && request.resource.size <= 10 * 1024 * 1024  // 10MB max
                   && request.resource.contentType.matches('audio/.*');  // Audio only
      allow read: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

📄 **See FIREBASE_STORAGE_RULES.md for complete security rules with detailed validation**

---

## Browser Compatibility

### Supported Browsers:
- ✅ Chrome 76+
- ✅ Firefox 69+
- ✅ Safari 14.1+
- ✅ Edge 79+

### Required Browser Features:
- MediaRecorder API
- getUserMedia API
- Blob API
- Promise support

---

## Testing the Feature

### Test Case 1: Not Logged In
1. Visit the canvas without logging in
2. Verify Recording button is grayed out
3. Hover to see "Login required" tooltip
4. Click button → Nothing should happen

### Test Case 2: Logged In - Basic Recording
1. Log in to the application
2. Click Recording button → Panel opens
3. Click "Start Recording" → Timer starts
4. Speak into microphone for 5 seconds
5. Click "Stop Recording" → Recording stops
6. Click "Done - Upload Recording" → Upload completes
7. Verify success message appears
8. Panel closes automatically

### Test Case 3: Discard Recording
1. Start a recording
2. Stop the recording
3. Click "Discard & Record Again"
4. Start a new recording
5. Complete the upload

### Test Case 4: Microphone Permission Denied
1. Block microphone permission in browser
2. Try to start recording
3. Verify error message appears

### Test Case 5: Firebase Console Verification
1. Complete a recording upload
2. Go to Firebase Console → Storage
3. Navigate to `canvas-recordings/{your-uid}/`
4. Verify the .webm file exists
5. Download and play to verify audio

---

## Future Enhancements

Potential improvements for the recording feature:

1. **Audio Playback**: Allow users to preview recording before upload
2. **Recording List**: Show all user's recordings in a list
3. **Delete Recordings**: Allow users to delete old recordings
4. **Audio Visualization**: Show waveform during recording
5. **Format Options**: Support MP3, WAV, etc.
6. **Max Duration**: Set maximum recording length (e.g., 5 minutes)
7. **File Size Limit**: Warn if recording is too large
8. **Metadata**: Save recording title, date, canvas ID with the file
9. **Download**: Allow downloading recordings locally
10. **Attach to Canvas**: Link recordings to specific canvas elements

---

## Troubleshooting

### Issue: Recording button not visible
**Solution**: Check if ToolBar component is properly importing and rendering the RecordingPanel

### Issue: Microphone not working
**Solution**:
- Check browser permissions
- Ensure HTTPS (microphone requires secure context)
- Check browser compatibility

### Issue: Upload failing
**Solution**:
- Verify Firebase Storage is enabled
- Check storage security rules
- Verify user is authenticated
- Check console for error details

### Issue: Recording stays disabled even when logged in
**Solution**:
- Check if `currentUser` is properly loaded from AuthContext
- Verify AuthContext is wrapping the Canvas component
- Check browser console for authentication errors

### Issue: Permission error but file uploads successfully
**Description**: Error message "Firebase Storage: User does not have permission to access..." appears, but the file is saved successfully in Firebase Storage.

**Root Cause**: Code attempted to call `getDownloadURL()` after upload, which requires read permission. With minimal Firebase rules (write-only), this fails even though the upload succeeded.

**Solution**: This issue has been fixed. The code no longer calls `getDownloadURL()` after upload (RecordingPanel.jsx:147-151). If you see this error, ensure you're using the latest version of RecordingPanel.jsx without the `getDownloadURL()` call.

---

## Code References

### Recording Button in Toolbar:
- ToolBar.jsx:92-98 (BaseToolRegistry entry)
- ToolBar.jsx:145-166 (Button rendering with disabled state)

### Recording Panel Component:
- RecordingPanel.jsx:1-319 (Complete component)

### Firebase Upload Logic:
- RecordingPanel.jsx:120-165 (uploadToFirebase function)

### Authentication Check:
- ToolBar.jsx:33 (useAuth hook)
- ToolBar.jsx:97 (disabled: !currentUser)
- RecordingPanel.jsx:5 (useAuth import)
- RecordingPanel.jsx:8 (currentUser usage)

### Timer and Cleanup:
- RecordingPanel.jsx:25-33 (useEffect cleanup on unmount)
- RecordingPanel.jsx:79-98 (Timer interval with auto-stop)
- RecordingPanel.jsx:36-40 (formatTime function)

### ESLint Fixes:
- RecordingPanel.jsx:2 (PropTypes import)
- RecordingPanel.jsx:314-316 (PropTypes validation)
- RecordingPanel.jsx:66 (Variable shadowing fix - recordedBlob)
- RecordingPanel.jsx:180-290 (Button type attributes)
- RecordingPanel.jsx:303-305 (Escaped HTML entities)

---

## Security Features

### Client-Side Protection (RecordingPanel.jsx):
1. **5-Minute Duration Limit** (RecordingPanel.jsx:21)
   - `MAX_RECORDING_DURATION = 300` seconds
   - Auto-stops recording when limit is reached
   - Shows warning: "Recording auto-stopped: Maximum duration of 5 minutes reached"

2. **10MB File Size Limit** (RecordingPanel.jsx:22)
   - `MAX_FILE_SIZE = 10 * 1024 * 1024` bytes
   - Validates before upload
   - Shows error with actual file size if exceeded

3. **Authentication Required** (RecordingPanel.jsx:121)
   - Recording button disabled when not logged in
   - Upload function checks for currentUser (line 121)
   - Warning displayed in panel if user not authenticated (RecordingPanel.jsx:191-194)

### Server-Side Protection (Firebase Storage Rules):
4. **User Isolation**
   - Users can only access their own recordings
   - Path enforced: `canvas-recordings/{userId}/`

5. **File Type Validation**
   - Only audio files allowed (audio/webm, audio/wav, etc.)
   - Validated by Firebase Storage rules

6. **Size Validation at Storage Level**
   - Firebase rules enforce 10MB limit server-side
   - Double protection with client-side check

📄 **See FIREBASE_STORAGE_RULES.md for complete security implementation details**

---

## Summary

The Audio Recording feature is now fully integrated into the Canvas system with:
- ✅ User authentication requirement
- ✅ Disabled state for non-logged-in users
- ✅ Full recording UI with timer and controls
- ✅ Firebase Storage upload with user-specific folders
- ✅ Error handling and user feedback
- ✅ Clean, modern UI matching the existing design
- ✅ **Comprehensive security protections against abuse**
- ✅ **5-minute duration limit with auto-stop**
- ✅ **10MB file size validation**
- ✅ **Firebase Storage security rules**

The feature is production-ready with proper security measures to prevent abuse!
