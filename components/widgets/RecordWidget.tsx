import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  StopCircle,
  Play,
  Pause,
  Download,
  Trash2,
  Pencil,
  Check,
  X,
  Loader2,
  Music,
  CloudOff,
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  query,
  orderBy,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../context/useAuth';
import { useDashboard } from '../../context/useDashboard';
import { useGoogleDrive } from '../../hooks/useGoogleDrive';
import { WidgetData, AudioRecordingItem } from '../../types';
import { WidgetLayout } from './WidgetLayout';
import { ScaledEmptyState } from '../common/ScaledEmptyState';

// ---- helpers ----------------------------------------------------------------

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildDefaultName(): string {
  const d = new Date();
  return `Recording ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// ---- waveform canvas during recording --------------------------------------

const WaveformBar: React.FC<{ heights: number[] }> = ({ heights }) => (
  <div
    className="flex items-end justify-center"
    style={{ gap: '3px', height: '48px' }}
  >
    {heights.map((h, i) => (
      <div
        key={i}
        className="rounded-full bg-rose-500"
        style={{
          width: '4px',
          height: `${Math.max(4, h)}px`,
          transition: 'height 80ms ease',
        }}
      />
    ))}
  </div>
);

// ---- recording row ----------------------------------------------------------

interface RecordingRowProps {
  item: AudioRecordingItem;
  onDelete: (item: AudioRecordingItem) => void;
  onRename: (id: string, name: string) => void;
  driveService: ReturnType<typeof useGoogleDrive>['driveService'];
}

const RecordingRow: React.FC<RecordingRowProps> = ({
  item,
  onDelete,
  onRename,
  driveService,
}) => {
  const [playing, setPlaying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const [downloading, setDownloading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAudio = useCallback(async () => {
    if (!driveService) return null;
    if (audioUrl) return audioUrl;
    setLoadingAudio(true);
    try {
      const blob = await driveService.downloadFile(item.driveFileId);
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      return url;
    } finally {
      setLoadingAudio(false);
    }
  }, [driveService, item.driveFileId, audioUrl]);

  const handlePlayPause = async () => {
    if (!audioRef.current) {
      const url = await fetchAudio();
      if (!url) return;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      void audioRef.current.play();
      setPlaying(true);
    }
  };

  const handleDownload = async () => {
    if (!driveService) return;
    setDownloading(true);
    try {
      const url = await fetchAudio();
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      const ext = item.mimeType.includes('mp4') ? 'mp4' : 'webm';
      a.download = `${item.name}.${ext}`;
      a.click();
    } finally {
      setDownloading(false);
    }
  };

  const handleSaveRename = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== item.name) {
      onRename(item.id, trimmed);
    }
    setEditing(false);
  };

  const handleCancelRename = () => {
    setEditName(item.name);
    setEditing(false);
  };

  return (
    <div
      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all flex flex-col"
      style={{ padding: 'min(10px, 2.5cqmin)', gap: 'min(8px, 2cqmin)' }}
    >
      {/* Top row: icon + name/edit + actions */}
      <div className="flex items-center" style={{ gap: 'min(10px, 2.5cqmin)' }}>
        {/* Icon */}
        <div
          className="bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center shrink-0 border border-rose-100"
          style={{ width: 'min(38px, 9cqmin)', height: 'min(38px, 9cqmin)' }}
        >
          <Music
            style={{
              width: 'min(18px, 4.5cqmin)',
              height: 'min(18px, 4.5cqmin)',
            }}
          />
        </div>

        {/* Name / rename input */}
        <div className="flex-1 min-w-0">
          {editing ? (
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveRename();
                if (e.key === 'Escape') handleCancelRename();
              }}
              className="w-full bg-slate-50 border border-rose-300 rounded px-2 py-1 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-rose-400"
              style={{ fontSize: 'min(12px, 3cqmin)' }}
            />
          ) : (
            <h4
              className="text-slate-700 font-bold truncate"
              style={{ fontSize: 'min(13px, 3.5cqmin)' }}
            >
              {item.name}
            </h4>
          )}
          <div
            className="text-slate-400 font-mono"
            style={{ fontSize: 'min(10px, 2.5cqmin)' }}
          >
            {formatDuration(item.duration)} &middot; {formatBytes(item.size)}{' '}
            &middot; {formatDate(item.createdAt)}
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="flex items-center shrink-0"
          style={{ gap: 'min(4px, 1cqmin)' }}
        >
          {editing ? (
            <>
              <button
                onClick={handleSaveRename}
                className="text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                style={{ padding: 'min(6px, 1.5cqmin)' }}
                title="Save name"
              >
                <Check
                  style={{
                    width: 'min(14px, 3.5cqmin)',
                    height: 'min(14px, 3.5cqmin)',
                  }}
                />
              </button>
              <button
                onClick={handleCancelRename}
                className="text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                style={{ padding: 'min(6px, 1.5cqmin)' }}
                title="Cancel"
              >
                <X
                  style={{
                    width: 'min(14px, 3.5cqmin)',
                    height: 'min(14px, 3.5cqmin)',
                  }}
                />
              </button>
            </>
          ) : (
            <>
              {/* Play / Pause */}
              <button
                onClick={handlePlayPause}
                disabled={loadingAudio || !driveService}
                className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center justify-center"
                style={{ padding: 'min(6px, 1.5cqmin)' }}
                title={playing ? 'Pause' : 'Play'}
              >
                {loadingAudio ? (
                  <Loader2
                    className="animate-spin"
                    style={{
                      width: 'min(14px, 3.5cqmin)',
                      height: 'min(14px, 3.5cqmin)',
                    }}
                  />
                ) : playing ? (
                  <Pause
                    style={{
                      width: 'min(14px, 3.5cqmin)',
                      height: 'min(14px, 3.5cqmin)',
                    }}
                  />
                ) : (
                  <Play
                    style={{
                      width: 'min(14px, 3.5cqmin)',
                      height: 'min(14px, 3.5cqmin)',
                    }}
                  />
                )}
              </button>

              {/* Rename */}
              <button
                onClick={() => {
                  setEditName(item.name);
                  setEditing(true);
                }}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                style={{ padding: 'min(6px, 1.5cqmin)' }}
                title="Rename"
              >
                <Pencil
                  style={{
                    width: 'min(14px, 3.5cqmin)',
                    height: 'min(14px, 3.5cqmin)',
                  }}
                />
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                disabled={downloading || !driveService}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 disabled:opacity-50 rounded-lg transition-colors"
                style={{ padding: 'min(6px, 1.5cqmin)' }}
                title="Download"
              >
                {downloading ? (
                  <Loader2
                    className="animate-spin"
                    style={{
                      width: 'min(14px, 3.5cqmin)',
                      height: 'min(14px, 3.5cqmin)',
                    }}
                  />
                ) : (
                  <Download
                    style={{
                      width: 'min(14px, 3.5cqmin)',
                      height: 'min(14px, 3.5cqmin)',
                    }}
                  />
                )}
              </button>

              {/* Delete */}
              <button
                onClick={() => onDelete(item)}
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                style={{ padding: 'min(6px, 1.5cqmin)' }}
                title="Delete recording"
              >
                <Trash2
                  style={{
                    width: 'min(14px, 3.5cqmin)',
                    height: 'min(14px, 3.5cqmin)',
                  }}
                />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- main widget ------------------------------------------------------------

export const RecordWidget: React.FC<{ widget: WidgetData }> = ({
  widget: _widget,
}) => {
  const { addToast } = useDashboard();
  const { user } = useAuth();
  const { driveService, isConnected } = useGoogleDrive();

  const [recordings, setRecordings] = useState<AudioRecordingItem[]>([]);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [waveHeights, setWaveHeights] = useState<number[]>(Array(20).fill(4));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Firestore real-time sync
  useEffect(() => {
    if (!user) return;
    const ref = collection(db, 'users', user.uid, 'audioRecordings');
    const q = query(ref, orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as AudioRecordingItem
      );
      setRecordings(items);
    });
    return () => unsub();
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const stopAll = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    analyserRef.current = null;
  };

  const animateWaveform = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArr = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArr);

    const barCount = 20;
    const step = Math.floor(dataArr.length / barCount);
    const newHeights = Array.from({ length: barCount }, (_, i) => {
      const val = dataArr[i * step] ?? 0;
      return Math.max(4, Math.round((val / 255) * 48));
    });
    setWaveHeights(newHeights);
    animFrameRef.current = requestAnimationFrame(animateWaveform);
  }, []);

  const handleStartRecording = async () => {
    if (!isConnected) {
      addToast('Sign in with Google to enable recording to Drive', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup analyser for waveform
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Choose best supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.start(100); // collect chunks every 100ms
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);

      animFrameRef.current = requestAnimationFrame(animateWaveform);
    } catch {
      addToast('Microphone access denied', 'error');
    }
  };

  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current || !user || !driveService) return;

    const recorder = mediaRecorderRef.current;
    const duration = recordingSeconds;

    setIsRecording(false);
    stopAll();
    setWaveHeights(Array(20).fill(4));
    setUploading(true);

    // Collect final data
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });

    const mimeType = recorder.mimeType;
    const blob = new Blob(chunksRef.current, { type: mimeType });
    const name = buildDefaultName();
    const ext = mimeType.includes('mp4') ? 'm4a' : 'webm';
    const fileName = `${name}.${ext}`;

    try {
      const driveFile = await driveService.uploadFile(
        blob,
        fileName,
        'Recordings'
      );

      // Save metadata to Firestore
      const recordingsRef = collection(
        db,
        'users',
        user.uid,
        'audioRecordings'
      );
      await addDoc(recordingsRef, {
        name,
        driveFileId: driveFile.id,
        duration,
        size: blob.size,
        mimeType,
        createdAt: Date.now(),
      } satisfies Omit<AudioRecordingItem, 'id'>);

      addToast(`"${name}" saved to Google Drive`, 'success');
    } catch (err) {
      console.error('Upload failed', err);
      addToast('Failed to save recording to Drive', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (item: AudioRecordingItem) => {
    if (!user || !driveService) return;
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'audioRecordings', item.id));
      // Best-effort delete from Drive
      try {
        await driveService.deleteFile(item.driveFileId);
      } catch {
        // Non-fatal — file may already be gone from Drive
      }
      addToast('Recording deleted', 'info');
    } catch {
      addToast('Failed to delete recording', 'error');
    }
  };

  const handleRename = async (id: string, newName: string) => {
    if (!user) return;
    const { updateDoc: fsUpdateDoc } = await import('firebase/firestore');
    try {
      await fsUpdateDoc(doc(db, 'users', user.uid, 'audioRecordings', id), {
        name: newName,
      });
    } catch {
      addToast('Failed to rename recording', 'error');
    }
  };

  // ---- render ----------------------------------------------------------------

  return (
    <WidgetLayout
      padding="p-0"
      contentClassName="flex-1 min-h-0 flex flex-col overflow-hidden"
      header={
        <div
          className="shrink-0 flex items-center justify-between bg-white border-b border-slate-100"
          style={{ padding: 'min(14px, 3cqmin) min(16px, 3.5cqmin)' }}
        >
          <div>
            <h2
              className="font-black text-slate-800 tracking-tight uppercase"
              style={{ fontSize: 'min(16px, 4cqmin)' }}
            >
              Audio Recordings
            </h2>
            <p
              className="text-slate-400 font-bold uppercase tracking-wider"
              style={{
                fontSize: 'min(9px, 2.5cqmin)',
                marginTop: 'min(2px, 0.5cqmin)',
              }}
            >
              {recordings.length} recording{recordings.length !== 1 ? 's' : ''}
              {!isConnected && ' · Sign in with Google to record'}
            </p>
          </div>

          {/* Record / Stop button */}
          {isRecording ? (
            <button
              onClick={handleStopRecording}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black uppercase tracking-wider shadow transition-all active:scale-95 flex items-center animate-pulse"
              style={{
                padding: 'min(8px, 2cqmin) min(14px, 3cqmin)',
                gap: 'min(6px, 1.5cqmin)',
                fontSize: 'min(10px, 2.5cqmin)',
              }}
            >
              <StopCircle
                style={{
                  width: 'min(14px, 3.5cqmin)',
                  height: 'min(14px, 3.5cqmin)',
                }}
              />
              Stop
            </button>
          ) : uploading ? (
            <button
              disabled
              className="bg-rose-300 text-white rounded-xl font-black uppercase tracking-wider flex items-center"
              style={{
                padding: 'min(8px, 2cqmin) min(14px, 3cqmin)',
                gap: 'min(6px, 1.5cqmin)',
                fontSize: 'min(10px, 2.5cqmin)',
              }}
            >
              <Loader2
                className="animate-spin"
                style={{
                  width: 'min(14px, 3.5cqmin)',
                  height: 'min(14px, 3.5cqmin)',
                }}
              />
              Saving…
            </button>
          ) : (
            <button
              onClick={handleStartRecording}
              disabled={!isConnected}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black uppercase tracking-wider shadow transition-all active:scale-95 flex items-center"
              style={{
                padding: 'min(8px, 2cqmin) min(14px, 3cqmin)',
                gap: 'min(6px, 1.5cqmin)',
                fontSize: 'min(10px, 2.5cqmin)',
              }}
              title={
                isConnected
                  ? 'Start recording'
                  : 'Sign in with Google to record'
              }
            >
              <Mic
                style={{
                  width: 'min(14px, 3.5cqmin)',
                  height: 'min(14px, 3.5cqmin)',
                }}
              />
              Record
            </button>
          )}
        </div>
      }
      content={
        <div
          className="flex-1 w-full h-full overflow-y-auto custom-scrollbar flex flex-col"
          style={{ padding: 'min(12px, 3cqmin)', gap: 'min(8px, 2cqmin)' }}
        >
          {/* Active recording panel */}
          {isRecording && (
            <div
              className="bg-rose-50 border border-rose-200 rounded-xl flex flex-col items-center justify-center"
              style={{ padding: 'min(20px, 5cqmin)', gap: 'min(12px, 3cqmin)' }}
            >
              <WaveformBar heights={waveHeights} />
              <div
                className="font-black text-rose-600 font-mono tracking-widest"
                style={{ fontSize: 'min(28px, 7cqmin)' }}
              >
                {formatDuration(recordingSeconds)}
              </div>
              <div
                className="text-rose-400 font-bold uppercase tracking-wider"
                style={{ fontSize: 'min(10px, 2.5cqmin)' }}
              >
                Recording…
              </div>
            </div>
          )}

          {/* No Google Drive connection */}
          {!isConnected && !isRecording && (
            <div
              className="bg-amber-50 border border-amber-200 rounded-xl flex items-center"
              style={{
                padding: 'min(12px, 3cqmin)',
                gap: 'min(10px, 2.5cqmin)',
              }}
            >
              <CloudOff
                className="text-amber-500 shrink-0"
                style={{
                  width: 'min(20px, 5cqmin)',
                  height: 'min(20px, 5cqmin)',
                }}
              />
              <p
                className="text-amber-700 font-bold"
                style={{ fontSize: 'min(11px, 3cqmin)' }}
              >
                Sign in with Google to record and save audio to your Drive.
              </p>
            </div>
          )}

          {/* Recordings list or empty state */}
          {recordings.length === 0 && !isRecording ? (
            <ScaledEmptyState
              icon={Mic}
              title="No recordings yet"
              subtitle="Hit Record to capture audio. Recordings save to Google Drive."
            />
          ) : (
            recordings.map((item) => (
              <RecordingRow
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onRename={handleRename}
                driveService={driveService}
              />
            ))
          )}
        </div>
      }
      footer={
        <div
          className="shrink-0 text-center font-black text-slate-400 uppercase tracking-widest border-t border-slate-100"
          style={{
            padding: 'min(8px, 2cqmin)',
            fontSize: 'min(9px, 2.5cqmin)',
          }}
        >
          Recordings saved to Google Drive · Play, download, or rename below
        </div>
      }
    />
  );
};

// ---- settings panel ---------------------------------------------------------

export const RecordSettings: React.FC<{ widget: WidgetData }> = () => {
  return (
    <div className="p-4 space-y-4">
      <p className="text-xs font-black uppercase tracking-widest text-slate-500">
        About this widget
      </p>
      <p className="text-sm text-slate-700 font-medium">
        Audio Recordings saves your recordings directly to your Google Drive
        under <strong>SPART Board / Recordings</strong>. All metadata is stored
        in your cloud account and persists across sessions.
      </p>
      <p className="text-xs text-slate-400 font-bold">
        Recordings are stored per user and are not shared with other teachers.
      </p>
    </div>
  );
};
