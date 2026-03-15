import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface JsonViewerProps {
  data: any;
  className?: string;
  maxHeight?: string;
}

export default function JsonViewer({ data, className, maxHeight = "400px" }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const formatted = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic syntax highlighting
  const highlighted = formatted
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"([^"]+)":/g, '<span class="text-primary">"$1"</span>:')
    .replace(/: "(.*?)"/g, ': <span class="text-emerald-500">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="text-amber-500">$1</span>')
    .replace(/: (true|false)/g, ': <span class="text-sky-500">$1</span>')
    .replace(/: (null)/g, ': <span class="text-muted-foreground">$1</span>');

  return (
    <div className={cn("relative rounded-lg border border-border bg-muted/30", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-7 w-7 z-10"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
      <pre
        className="p-4 overflow-auto text-xs font-mono leading-relaxed"
        style={{ maxHeight }}
      >
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}
