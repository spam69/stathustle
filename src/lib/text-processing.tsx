
'use client';

import Link from 'next/link';
import React from 'react';

// Regex to find @mentions.
// Looks for @ followed by word characters (letters, numbers, underscore), hyphens, or periods.
// Ensures it's preceded by a space, start of line, or non-word character to avoid matching in emails.
const MENTION_REGEX = /(^|\s|(?<!\w))(@([\w.-]+))/g;

export function parseMentions(text: string | undefined | null): (string | JSX.Element)[] {
  if (!text) return [];

  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = MENTION_REGEX.exec(text)) !== null) {
    const prefix = match[1] || ''; // Space, start of string, or non-word character
    const fullMention = match[2]; // e.g., @username
    const username = match[3]; // e.g., username
    // Adjust startIndex to account for the prefix that MENTION_REGEX might capture (like a space)
    const mentionStartIndexInMatch = match[0].indexOf(fullMention);
    const startIndex = match.index + mentionStartIndexInMatch;

    // Add text before the mention
    if (startIndex > lastIndex) {
      parts.push(text.substring(lastIndex, startIndex));
    }

    // Add the mention as a Link
    parts.push(
      <Link
        key={`${username}-${startIndex}`}
        href={`/profile/${username}`}
        className="text-primary hover:underline font-medium"
        onClick={(e) => e.stopPropagation()} // Prevent card click-through if mention is in a card
      >
        {fullMention}
      </Link>
    );

    lastIndex = startIndex + fullMention.length;
  }

  // Add any remaining text after the last mention
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  // If no mentions were found, return the original text in an array
  if (parts.length === 0 && text.length > 0) {
    return [text];
  }

  return parts;
}

// For blog content or post content which might be HTML and uses DOMPurify
export function linkifyMentionsInHtmlString(htmlString: string | undefined | null): string {
  if (!htmlString) return '';
  // This regex replacement should be safe as it only creates simple <a> tags.
  // DOMPurify will then sanitize these along with the rest of the HTML.
  return htmlString.replace(MENTION_REGEX, (matchedStr, prefix, mentionWithAt, username) => {
    // prefix ensures we re-insert the space or character that was before the @
    return `${prefix}<a href="/profile/${username}" class="text-primary hover:underline font-medium">${mentionWithAt}</a>`;
  });
}
