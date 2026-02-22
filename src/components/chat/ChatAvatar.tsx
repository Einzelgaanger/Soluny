interface ChatAvatarProps {
  url?: string | null;
  name?: string;
  online?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12", xl: "h-16 w-16" };
const dotSizes = { sm: "h-2 w-2", md: "h-2.5 w-2.5", lg: "h-3 w-3", xl: "h-3.5 w-3.5" };

const ChatAvatar = ({ url, name, online, size = "md" }: ChatAvatarProps) => (
  <div className="relative shrink-0">
    <div className={`${sizes[size]} rounded-full bg-secondary overflow-hidden`}>
      {url ? (
        <img src={url} alt="" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-sm font-bold text-muted-foreground">
          {(name || "?")[0].toUpperCase()}
        </div>
      )}
    </div>
    {online && (
      <div className={`absolute -bottom-0.5 -right-0.5 ${dotSizes[size]} rounded-full border-2 border-background online-dot`} />
    )}
  </div>
);

export default ChatAvatar;
