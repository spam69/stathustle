
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Smile } from "lucide-react";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  triggerButtonSize?: "default" | "sm" | "lg" | "icon" | "xs";
  triggerButtonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  popoverSide?: "top" | "bottom" | "left" | "right";
}

const EMOJIS: string[] = [
  // Smileys & People
  "😀", "😂", "😊", "🥰", "🤔", "😎", "😢", "🥳", "🤩", "🙏", 
  "👍", "👎", "❤️", "💔", "🔥", "🎉", "💯", "👀", "👋", "👏",
  // Animals & Nature
  "🐶", "🐱", "🌍", "🌱", "☀️", "🌙", "🌟",
  // Food & Drink
  "🍕", "🍔", "☕️", "🍺", "🥂",
  // Activities
  "⚽️", "🏀", "🏈", "⚾️", "🎮", "🎤", 
  // Objects
  "💻", "📱", "💡", "💸", "🔑", "🎁",
  // Symbols
  "✔️", "❌", "❓", "❗️", "➕", "➖", "➡️", "⬆️", "⬇️", "⬅️",
  // Travel & Places
  "✈️", "🚗", "🏠",
];


export default function EmojiPicker({ 
  onEmojiSelect, 
  triggerButtonSize = "icon", 
  triggerButtonVariant = "ghost",
  popoverSide = "top"
}: EmojiPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={triggerButtonVariant} size={triggerButtonSize} aria-label="Add emoji" title="Add emoji">
          <Smile className={triggerButtonSize === "xs" ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2 bg-popover border shadow-md rounded-lg" side={popoverSide} sideOffset={5}>
        <div className="grid grid-cols-7 gap-1"> {/* Adjusted to 7 columns for better fit */}
          {EMOJIS.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              className="text-xl p-0 w-8 h-8 rounded-md hover:bg-accent transition-colors" // Smaller buttons
              onClick={() => onEmojiSelect(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
