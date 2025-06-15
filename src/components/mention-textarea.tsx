import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Identity } from '@/types';

interface MentionTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
}

interface Profile extends User, Identity {
  id: string;
  username: string;
  displayName?: string;
  profilePictureUrl?: string;
  isIdentity?: boolean;
}

export const MentionTextarea = React.forwardRef<HTMLTextAreaElement, MentionTextareaProps>(
  ({ value, onChange, className, placeholder, maxLength, disabled, ...props }, ref) => {
    const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<Profile[]>([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStart, setMentionStart] = useState<number | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch all users/identities once
    useEffect(() => {
      setLoadingProfiles(true);
      fetch('/api/users')
        .then(res => res.json())
        .then(data => setAllProfiles(data))
        .catch(() => setAllProfiles([]))
        .finally(() => setLoadingProfiles(false));
    }, []);

    // Handle input change and mention detection
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const cursor = e.target.selectionStart;
      const text = e.target.value;
      onChange(text);

      // Find the last @ before the cursor
      const upToCursor = text.slice(0, cursor);
      const match = /(^|\s|\()@(\w{1,30})?$/.exec(upToCursor);
      if (match) {
        setMentionStart(cursor - (match[2]?.length ?? 0) - 1);
        setMentionQuery(match[2] ?? '');
        setShowSuggestions(true);
        setActiveIndex(0);
      } else {
        setShowSuggestions(false);
        setMentionQuery('');
        setMentionStart(null);
      }
    };

    // Filter suggestions
    useEffect(() => {
      if (showSuggestions && mentionQuery.length >= 1) {
        const q = mentionQuery.toLowerCase();
        setSuggestions(
          allProfiles.filter(
            p => p.username.toLowerCase().startsWith(q) || (p.displayName && p.displayName.toLowerCase().startsWith(q))
          ).slice(0, 6)
        );
      } else {
        setSuggestions([]);
      }
    }, [mentionQuery, showSuggestions, allProfiles]);

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showSuggestions || suggestions.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(i => (i + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Enter') {
        if (mentionStart !== null) {
          e.preventDefault();
          selectSuggestion(activeIndex);
        }
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
    };

    // Insert mention
    const selectSuggestion = (index: number) => {
      if (mentionStart === null) return;
      const profile = suggestions[index];
      if (!profile) return;
      const before = value.slice(0, mentionStart);
      const after = value.slice((textareaRef.current?.selectionStart ?? value.length));
      const mentionText = `@${profile.username} `;
      const newValue = before + mentionText + after;
      onChange(newValue);
      setShowSuggestions(false);
      setMentionQuery('');
      setMentionStart(null);
      setTimeout(() => {
        // Move cursor after inserted mention
        if (textareaRef.current) {
          const pos = before.length + mentionText.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(pos, pos);
        }
      }, 0);
    };

    // Click outside to close suggestions
    useEffect(() => {
      const handleClick = (e: MouseEvent) => {
        if (!containerRef.current?.contains(e.target as Node)) {
          setShowSuggestions(false);
        }
      };
      if (showSuggestions) {
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
      }
    }, [showSuggestions]);

    return (
      <div className="relative w-full" ref={containerRef}>
        <textarea
          ref={el => {
            textareaRef.current = el;
            if (typeof ref === 'function') ref(el);
            else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
          }}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className={cn('w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm', className)}
          placeholder={placeholder}
          maxLength={maxLength}
          disabled={disabled}
          {...props}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 left-0 mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-56 overflow-y-auto">
            {suggestions.map((profile, i) => (
              <button
                key={profile.id}
                type="button"
                className={cn(
                  'flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent/60',
                  i === activeIndex ? 'bg-accent/80' : ''
                )}
                onMouseDown={e => { e.preventDefault(); selectSuggestion(i); }}
              >
                <Avatar className="h-7 w-7 border">
                  <AvatarImage src={profile.profilePictureUrl} alt={profile.displayName || profile.username} />
                  <AvatarFallback className="text-xs">{(profile.displayName || profile.username)[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden">
                  <span className="font-medium text-sm truncate">{profile.displayName || profile.username}</span>
                  <span className="text-xs text-muted-foreground truncate">@{profile.username}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);
MentionTextarea.displayName = 'MentionTextarea';

export default MentionTextarea; 