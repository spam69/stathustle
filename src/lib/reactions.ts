
import { ThumbsUp, Heart, SmilePlus, Sparkles, Frown, Angry, type LucideIcon } from 'lucide-react';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';

export interface ReactionDefinition {
  type: ReactionType;
  label: string;
  Icon: LucideIcon;
  colorClass: string; // Tailwind color class for the icon/text when active
}

export const REACTION_DEFINITIONS: ReactionDefinition[] = [
  { type: 'like', label: 'Like', Icon: ThumbsUp, colorClass: 'text-blue-500' },
  { type: 'love', label: 'Love', Icon: Heart, colorClass: 'text-red-500' },
  { type: 'haha', label: 'Haha', Icon: SmilePlus, colorClass: 'text-yellow-500' },
  { type: 'wow', label: 'Wow', Icon: Sparkles, colorClass: 'text-purple-500' }, // Using Sparkles for Wow, could be changed
  { type: 'sad', label: 'Sad', Icon: Frown, colorClass: 'text-gray-500' },
  { type: 'angry', label: 'Angry', Icon: Angry, colorClass: 'text-orange-600' },
];

// Helper to get a specific reaction definition
export const getReactionDefinition = (type: ReactionType): ReactionDefinition | undefined => {
  return REACTION_DEFINITIONS.find(def => def.type === type);
};
