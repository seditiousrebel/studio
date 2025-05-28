
"use client";

import React from 'react';

interface MarkdownRendererProps {
  content?: string | null;
  className?: string;
}

// Basic and safe markdown to HTML conversion
function simpleMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown;

  // Escape HTML characters to prevent XSS if any slip through, though we are transforming.
  // This is a basic measure. For user-supplied content, a robust sanitizer is needed.
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*|\_\_(.*?)\_\_/g, '<strong>$1$2</strong>');
  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*|\_(.*?)\_/g, '<em>$1$2</em>');

  // Unordered lists: Convert lines starting with *, -, +
  // This needs to be handled carefully to group list items
  html = html.replace(/^([*+-])\s+(.+)/gm, (match, char, itemContent) => {
    return `<li>${itemContent.trim()}</li>`;
  });
  // Wrap consecutive <li> items in <ul>
  html = html.replace(/(<li>.*?<\/li>\s*)+/g, (match) => {
    return `<ul>${match.trim()}</ul>`;
  });


  // Paragraphs and line breaks
  // Treat double line breaks as paragraph separators
  // Treat single line breaks within paragraphs as <br />
  html = html
    .split(/\n\s*\n/) // Split by one or more empty lines to define paragraphs
    .map(paragraph => {
      if (paragraph.trim() === '') return '';
      // If paragraph is already a list, don't wrap it in <p>
      if (paragraph.trim().startsWith('<ul>') && paragraph.trim().endsWith('</ul>')) {
        return paragraph.trim();
      }
      // Convert single line breaks within a paragraph to <br />
      return '<p>' + paragraph.replace(/\n/g, '<br />').trim() + '</p>';
    })
    .join('');
  
  // Clean up any <p> tags accidentally wrapping <ul>
  html = html.replace(/<p>\s*<ul>/g, '<ul>').replace(/<\/ul>\s*<\/p>/g, '</ul>');

  return html;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  if (!content) {
    return null;
  }

  const processedHtml = simpleMarkdownToHtml(content);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: processedHtml }}
    />
  );
}
