import { Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
    title: string;
    text: string;
    url: string;
    className?: string;
    variant?: "ghost" | "outline" | "default" | "secondary";
    size?: "default" | "sm" | "lg" | "icon";
}

export function ShareButton({
    title,
    text,
    url,
    className,
    variant = "ghost",
    size = "icon",
}: ShareButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent parent clicks (like navigation)

        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url,
                });
            } catch (err) {
                // User cancelled or share failed, fallback to copy if needed
                console.log("Share cancelled or failed:", err);
            }
        } else {
            // Fallback to clipboard
            try {
                await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error("Failed to copy:", err);
            }
        }
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant={variant}
                        size={size}
                        className={cn("rounded-full transition-colors", className)}
                        onClick={handleShare}
                    >
                        {copied ? (
                            <Check className="h-4 w-4 text-green-500" />
                        ) : (
                            <Share2 className="h-4 w-4" />
                        )}
                        <span className="sr-only">Share</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{copied ? "Copied!" : "Share Product"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
