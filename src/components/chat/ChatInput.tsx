import { useState, useRef } from "react";
import { Send, Paperclip, X, Loader2, Image as ImageIcon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import VoiceRecorder from "./VoiceRecorder";

interface ChatInputProps {
  onSend: (body: string, attachment?: { url: string; type: string; name: string }) => void;
  onTyping: () => void;
  sending: boolean;
  userId: string;
}

const ChatInput = ({ onSend, onTyping, sending, userId }: ChatInputProps) => {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<{ file: File; url: string; type: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const uploadFile = async (file: File): Promise<{ url: string; type: string; name: string } | null> => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      const type = file.type.startsWith("image/") ? "image" : "file";
      return { url: urlData.publicUrl, type, name: file.name };
    } catch (err) {
      console.error("Upload failed:", err);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const uploadVoice = async (blob: Blob) => {
    setUploading(true);
    try {
      console.log("[ChatInput] uploading voice blob, size:", blob.size, "type:", blob.type);
      // Determine extension from mime type
      let ext = "webm";
      if (blob.type.includes("mp4") || blob.type.includes("aac")) ext = "mp4";
      else if (blob.type.includes("ogg")) ext = "ogg";

      const path = `${userId}/${Date.now()}-voice.${ext}`;
      const { error } = await supabase.storage.from("chat-attachments").upload(path, blob, {
        contentType: blob.type || "audio/webm",
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      console.log("[ChatInput] voice uploaded:", urlData.publicUrl);
      onSend("", { url: urlData.publicUrl, type: "voice", name: "Voice note" });
    } catch (err) {
      console.error("[ChatInput] Voice upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      alert("File too large. Max 25MB.");
      return;
    }
    const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    setPreview({ file, url: previewUrl, type: file.type.startsWith("image/") ? "image" : "file" });
  };

  const clearPreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async () => {
    if (uploading || sending) return;
    if (!text.trim() && !preview) return;

    let attachment: { url: string; type: string; name: string } | undefined;
    if (preview) {
      const result = await uploadFile(preview.file);
      if (result) attachment = result;
      clearPreview();
    }

    onSend(text.trim(), attachment);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
    setText(el.value);
    onTyping();
  };

  return (
    <div className="shrink-0 bg-background border-t border-border/30">
      {/* File preview */}
      {preview && (
        <div className="px-3 pt-2 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 text-xs">
            {preview.type === "image" ? (
              <>
                <img src={preview.url} alt="" className="h-8 w-8 rounded object-cover" />
                <span className="truncate max-w-[120px]">{preview.file.name}</span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-[120px]">{preview.file.name}</span>
              </>
            )}
            <button onClick={clearPreview} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-1.5 p-2 sm:p-3">
        {/* Attachment button */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.zip,.xlsx,.csv"
          onChange={handleFileSelect}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-9 w-9 p-0 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 shrink-0"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Text input */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="w-full resize-none bg-secondary/30 border border-border/30 rounded-2xl px-4 py-2 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-colors"
            style={{ maxHeight: "120px", overflowWrap: "anywhere" }}
          />
        </div>

        {/* Voice recorder or Send */}
        {!text.trim() && !preview ? (
          <VoiceRecorder onRecorded={uploadVoice} disabled={uploading} />
        ) : (
          <Button
            onClick={handleSend}
            disabled={sending || uploading}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full h-9 w-9 p-0 shrink-0 transition-all"
          >
            {sending || uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChatInput;
