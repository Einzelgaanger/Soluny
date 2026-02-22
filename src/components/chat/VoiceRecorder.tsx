import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

/**
 * Picks the best supported audio MIME type for recording.
 * Prefers mp4 (universally playable) over webm.
 */
const getSupportedMimeType = (): string => {
  const types = [
    "audio/mp4",
    "audio/aac",
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
  ];
  for (const t of types) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch {
      // ignore
    }
  }
  return ""; // let browser pick default
};

const VoiceRecorder = ({ onRecorded, disabled }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      console.log("[VoiceRecorder] Using mimeType:", mimeType || "(browser default)");

      const options: MediaRecorderOptions = {};
      if (mimeType) options.mimeType = mimeType;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        console.log("[VoiceRecorder] chunk received, size:", e.data.size);
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        console.log("[VoiceRecorder] stopped, chunks:", chunksRef.current.length);
        const actualType = mediaRecorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualType });
        console.log("[VoiceRecorder] final blob size:", blob.size, "type:", blob.type);

        if (blob.size > 0) {
          onRecorded(blob);
        } else {
          console.error("[VoiceRecorder] Empty recording blob!");
        }

        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setDuration(0);
      };

      mediaRecorder.onerror = (e) => {
        console.error("[VoiceRecorder] MediaRecorder error:", e);
      };

      // Start without timeslice first — some browsers handle it better
      mediaRecorder.start();
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("[VoiceRecorder] Microphone access denied:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (recording) {
    return (
      <div className="flex items-center gap-2 bg-destructive/5 border border-destructive/20 rounded-full px-2 py-1">
        <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse shrink-0" />
        <div className="flex items-center gap-[2px] h-5">
          {[4, 7, 3, 8, 5, 10, 6, 4, 7, 9, 5, 3].map((h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full bg-destructive/60"
              style={{
                height: `${h * 1.5}px`,
                animation: `pulse ${0.4 + (i % 3) * 0.2}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
        <span className="text-xs font-mono text-destructive font-medium tabular-nums min-w-[32px]">
          {formatTime(duration)}
        </span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={stopRecording}
          className="h-7 w-7 p-0 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shrink-0"
        >
          <Square className="h-3 w-3 fill-current" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={startRecording}
      disabled={disabled}
      className="h-9 w-9 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60"
    >
      <Mic className="h-4 w-4" />
    </Button>
  );
};

export default VoiceRecorder;
