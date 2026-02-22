import { Check, CheckCheck, FileText, Download, Play, Pause } from "lucide-react";
import { useState, useRef } from "react";
import ChatAvatar from "./ChatAvatar";

interface MessageBubbleProps {
  message: any;
  isMe: boolean;
  showDate: boolean;
  isConsecutive: boolean;
  recipientProfile?: any;
}

const ReadReceipt = ({ read }: { read: boolean }) => {
  if (read) return <CheckCheck className="h-3 w-3 text-info inline-block" />;
  return <Check className="h-3 w-3 text-muted-foreground/40 inline-block" />;
};

const AudioPlayer = ({ url }: { url: string }) => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (s: number) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2 min-w-[180px]">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          if (audioRef.current) setProgress(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) setDuration(audioRef.current.duration);
        }}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
      />
      <button
        onClick={toggle}
        className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 hover:bg-primary/30 transition-colors"
      >
        {playing ? <Pause className="h-3.5 w-3.5 text-primary" /> : <Play className="h-3.5 w-3.5 text-primary ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: duration ? `${(progress / duration) * 100}%` : "0%" }}
          />
        </div>
        <span className="text-[9px] text-muted-foreground font-mono mt-0.5 block">
          {playing ? formatTime(progress) : formatTime(duration)}
        </span>
      </div>
    </div>
  );
};

const AttachmentContent = ({ message, isMe }: { message: any; isMe: boolean }) => {
  if (!message.attachment_url) return null;
  const type = message.attachment_type || "";

  if (type === "voice") {
    return <AudioPlayer url={message.attachment_url} />;
  }

  if (type.startsWith("image") || type === "image") {
    return (
      <a href={message.attachment_url} target="_blank" rel="noopener noreferrer">
        <img
          src={message.attachment_url}
          alt={message.attachment_name || "Image"}
          className="max-w-[240px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />
      </a>
    );
  }

  return (
    <a
      href={message.attachment_url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isMe ? "bg-primary-foreground/10" : "bg-secondary/60"} hover:opacity-80 transition-opacity`}
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="text-xs truncate max-w-[160px]">{message.attachment_name || "File"}</span>
      <Download className="h-3.5 w-3.5 shrink-0 opacity-50" />
    </a>
  );
};

// Detect URLs and make them clickable
const LinkifiedText = ({ text, isMe }: { text: string; isMe: boolean }) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return (
    <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
      {parts.map((part, i) =>
        urlRegex.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className={`underline underline-offset-2 ${isMe ? "text-primary-foreground/80 hover:text-primary-foreground" : "text-primary hover:text-primary/80"} transition-colors`}
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
};

const MessageBubble = ({ message, isMe, showDate, isConsecutive, recipientProfile }: MessageBubbleProps) => {
  return (
    <div>
      {showDate && (
        <div className="flex items-center justify-center py-3">
          <div className="px-3 py-1 rounded-full bg-secondary/60 backdrop-blur-sm text-[10px] text-muted-foreground font-medium">
            {new Date(message.created_at).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>
      )}
      <div className={`flex ${isMe ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-0.5" : "mt-2.5"}`}>
        {!isMe && !isConsecutive && recipientProfile && (
          <div className="mr-1.5 mt-auto mb-1">
            <ChatAvatar url={recipientProfile.avatar_url} name={recipientProfile.display_name} size="sm" />
          </div>
        )}
        {!isMe && isConsecutive && <div className="w-[34px] mr-1.5 shrink-0" />}
        <div className={`max-w-[80%] sm:max-w-[70%]`}>
          <div
            className={`px-3 py-2 text-[13px] leading-relaxed ${
              isMe
                ? "bg-primary text-primary-foreground rounded-2xl rounded-br-sm"
                : "bg-card border border-border/30 text-foreground rounded-2xl rounded-bl-sm"
            }`}
            style={{ overflowWrap: "anywhere", wordBreak: "break-word" }}
          >
            <AttachmentContent message={message} isMe={isMe} />
            {message.body && <LinkifiedText text={message.body} isMe={isMe} />}
            <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
              <span className={`text-[9px] font-mono ${isMe ? "text-primary-foreground/40" : "text-muted-foreground/40"}`}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
              {isMe && <ReadReceipt read={message.read} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
