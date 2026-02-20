I'd like to create a screen recording widget.

Based on the architecture of the School Boards codebase, creating a "record screen" feature is **highly feasible** and fits naturally into the existing stack.

I already have the foundational patterns in place for media access (used in the Webcam and Sound widgets) and file generation/storage (used in your Screenshot feature).

Here is an architectural breakdown of how we can implement this feature within the current codebase:

### 1. The Core Technology: Web APIs

To capture the screen, you would use the native browser API `navigator.mediaDevices.getDisplayMedia()` to capture the video/audio stream, and `MediaRecorder` to encode that stream into a video blob (typically `.webm` or `.mp4`).

### 2. Implementation Plan

**A. Create a `useScreenRecord` Hook**
Just as you have `hooks/useScreenshot.ts` to abstract the `html-to-image` logic, you should create a `hooks/useScreenRecord.ts` hook. This hook would manage the `MediaRecorder` lifecycle (start, stop, pause) and yield a video Blob when recording finishes.

```typescript
// Proposed hooks/useScreenRecord.ts
import { useState, useRef, useCallback } from 'react';

export const useScreenRecord = (
  options = { onSuccess: (blob: Blob) => {} }
) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        options.onSuccess?.(blob);
        chunksRef.current = [];
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop()); // Clean up
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Screen recording failed', err);
    }
  }, [options]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  return { isRecording, startRecording, stopRecording };
};
```

**B. Update Firebase Storage Hook**
Currently, `hooks/useStorage.ts` contains `uploadScreenshot`. You would add an `uploadRecording` function to handle the video Blob.

```typescript
// Inside hooks/useStorage.ts
const uploadRecording = async (userId: string, blob: Blob): Promise<string> => {
  const timestamp = Date.now();
  const storageRef = ref(
    storage,
    `users/${userId}/recordings/${timestamp}.webm`
  );
  const snapshot = await uploadBytes(storageRef, blob);
  return getDownloadURL(snapshot.ref);
};
```

**C. Update Firebase Security Rules**
Because you enforce strict read/write rules in `storage.rules`, you will need to add a matching path for the new recordings:

```javascript
// In storage.rules
match /users/{userId}/recordings/{allPaths=**} {
  allow read, write: if request.auth != null && request.auth.uid == userId;
}

```

**D. UI Integration**
You have two great places to put the trigger for this:

1. **Global Dock Toolbar:** Add a "Record" icon next to the other global tools in `components/layout/Dock.tsx`. This would record the whole dashboard.
2. **Widget Headers:** You currently conditionally render a Screenshot button (Camera icon) in `components/common/DraggableWindow.tsx` (skipping blacklisted widgets like the Webcam). You could add a "Record Widget" button right next to it, using the Element bounds to crop the screen recording (though cropping a native `getDisplayMedia` stream requires drawing the video to a `<canvas>` first and recording the canvas stream).

### 3. Challenges to Consider

While highly feasible, keep these considerations in mind:

- **File Size limits:** Video blobs get large very quickly. If teachers record 30-minute lessons, you could easily hit 500MB+ files. You will want to implement file size limits or stream the data in chunks to your server, though Firebase Storage's `uploadBytes` can handle moderately large blobs directly from the browser.
- **Mobile Support:** The `getDisplayMedia` API is widely supported on Desktop browsers (Chrome, Edge, Safari, Firefox), but is **not supported on mobile browsers** (iOS Safari, Android Chrome). If teachers use iPads to manage their boards, this feature will be unavailable to them.
- **Performance:** Encoding video on the fly uses CPU. While running interactive widgets (like the Bouncing Dice or Drawing board), older laptops might experience frame drops.

REQUIREMENT:
All videos are saved to the user's Google Drive.
