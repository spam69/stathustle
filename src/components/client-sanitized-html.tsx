
'use client';

import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { linkifyMentionsInHtmlString } from '@/lib/text-processing';

interface ClientSanitizedHtmlProps {
  htmlContent: string;
  className?: string;
}

const ClientSanitizedHtml = ({ htmlContent, className }: ClientSanitizedHtmlProps) => {
  const [sanitizedAndLinkedHtml, setSanitizedAndLinkedHtml] = useState('');

  useEffect(() => {
    // First, convert @mentions to links within the HTML string
    const contentWithLinkedMentions = linkifyMentionsInHtmlString(htmlContent);
    
    // Then, sanitize the entire HTML string
    if (typeof window !== 'undefined') {
      setSanitizedAndLinkedHtml(DOMPurify.sanitize(contentWithLinkedMentions, { USE_PROFILES: { html: true } }));
    } else {
      // Basic script tag removal for SSR, though DOMPurify on client is primary
      setSanitizedAndLinkedHtml(contentWithLinkedMentions.replace(/<script.*?>.*?<\/script>/gi, ''));
    }
  }, [htmlContent]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitizedAndLinkedHtml }} />;
};

export default ClientSanitizedHtml;
