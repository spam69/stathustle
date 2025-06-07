
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { REACTION_DEFINITIONS, getReactionDefinition, type ReactionType } from "@/lib/reactions";
import type { ReactionEntry } from "@/types";
import { cn } from "@/lib/utils";
import { ThumbsUp } from "lucide-react"; // Default icon

interface ReactionButtonProps {
  reactions: ReactionEntry[] | undefined;
  onReact: (reactionType: ReactionType | null) => void;
  currentUserId: string | undefined;
  isSubmitting: boolean;
  buttonSize?: "default" | "sm" | "lg" | "icon" | "xs";
  popoverSide?: "top" | "bottom" | "left" | "right";
}

interface ReactionSummary {
  type: ReactionType;
  Icon: React.ElementType;
  count: number;
  colorClass: string;
}

export default function ReactionButton({
  reactions = [],
  onReact,
  currentUserId,
  isSubmitting,
  buttonSize = "sm",
  popoverSide = "top",
}: ReactionButtonProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  const currentUserReactionEntry = reactions.find(r => r.userId === currentUserId);
  const currentUserReactionType = currentUserReactionEntry?.reactionType;
  const currentUserReactionDef = currentUserReactionType ? getReactionDefinition(currentUserReactionType) : null;

  const handleReactionSelect = (reactionType: ReactionType) => {
    if (currentUserReactionType === reactionType) {
      onReact(null); // Unreact if clicking the same reaction
    } else {
      onReact(reactionType);
    }
    setIsPopoverOpen(false);
  };

  const reactionCounts = React.useMemo(() => {
    const counts: Record<ReactionType, number> = {
      like: 0, love: 0, haha: 0, wow: 0, sad: 0, angry: 0,
    };
    reactions.forEach(r => {
      if (counts[r.reactionType] !== undefined) {
        counts[r.reactionType]++;
      }
    });
    return counts;
  }, [reactions]);

  const topReactions: ReactionSummary[] = React.useMemo(() => {
    return Object.entries(reactionCounts)
      .filter(([, count]) => count > 0)
      .sort(([, aCount], [, bCount]) => bCount - aCount)
      .slice(0, 3) // Show top 3 reaction icons
      .map(([type, count]) => {
        const def = getReactionDefinition(type as ReactionType);
        return {
          type: type as ReactionType,
          Icon: def!.Icon,
          count,
          colorClass: def!.colorClass,
        };
      });
  }, [reactionCounts]);

  const TriggerButtonIcon = currentUserReactionDef ? currentUserReactionDef.Icon : ThumbsUp;
  const triggerButtonColorClass = currentUserReactionDef ? currentUserReactionDef.colorClass : "text-muted-foreground";

  return (
    <div className="flex flex-col items-start">
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size={buttonSize}
            onClick={() => setIsPopoverOpen(true)}
            disabled={isSubmitting || !currentUserId}
            className={cn(
              "hover:bg-accent/50",
               currentUserReactionDef ? `${currentUserReactionDef.colorClass} hover:${currentUserReactionDef.colorClass}/90 font-semibold` : "text-muted-foreground",
               buttonSize === 'xs' ? "p-1 h-auto" : ""
            )}
          >
            <TriggerButtonIcon className={cn("mr-1.5", buttonSize === 'xs' ? "h-3.5 w-3.5" : "h-4 w-4")} />
            {buttonSize !== 'xs'}
          </Button>
        </PopoverTrigger>
        <PopoverContent side={popoverSide} className="w-auto p-1 rounded-full shadow-xl bg-background border border-border" sideOffset={5}>
          <div className="flex gap-0.5">
            {REACTION_DEFINITIONS.map(def => (
              <Button
                key={def.type}
                variant="ghost"
                size="icon"
                className={cn(
                  "rounded-full h-9 w-9 hover:scale-125 transition-transform",
                  def.colorClass,
                  currentUserReactionType === def.type ? `bg-accent ring-2 ring-offset-1 ring-primary` : "hover:bg-accent/50"
                )}
                onClick={() => handleReactionSelect(def.type)}
                title={def.label}
              >
                <def.Icon className="h-5 w-5" />
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
