import { useState, useRef } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecorderProps {
  onRecorded: (blob: Blob) => void;
  disabled?: boolean;
}

const VoiceRecorder = ({ onRecorded, disabled }: VoiceRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Pick a supported mime type
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        onRecorded(blob);
        stream.getTracks().forEach((t) => t.stop());
        setDuration(0);
      };

      // Use timeslice to collect data every 250ms for reliability
      mediaRecorder.start(250);
      setRecording(true);
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (err) {
      console.error("Microphone access denied", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (recording) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium animate-pulse">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          {formatTime(duration)}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={stopRecording}
          className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10"
        >
          <Square className="h-4 w-4 fill-current" />
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
