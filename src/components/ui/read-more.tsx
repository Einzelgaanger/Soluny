import { useState } from "react";
import { cn } from "@/lib/utils";

const DEFAULT_CHARS = 280;

interface ReadMoreProps {
  text: string;
  maxChars?: number;
  className?: string;
  buttonClassName?: string;
}

export function ReadMore({ text, maxChars = DEFAULT_CHARS, className, buttonClassName }: ReadMoreProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncate = text.length > maxChars;
  const displayText = needsTruncate && !expanded ? `${text.slice(0, maxChars).trim()}...` : text;

  return (
    <span className={cn("block", className)}>
      <span className="whitespace-pre-wrap">{displayText}</span>
      {needsTruncate && (
        <>
          {" "}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "text-primary font-semibold hover:underline focus:outline-none focus:underline",
              buttonClassName
            )}
          >
            {expanded ? "Read less" : "Read more"}
          </button>
        </>
      )}
    </span>
  );
}
