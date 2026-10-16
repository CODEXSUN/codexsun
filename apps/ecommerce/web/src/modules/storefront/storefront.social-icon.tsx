export function StorefrontSocialIcon({ label }: { label: string }) {
  const name = label.toLowerCase();
  const common = { "aria-hidden": true, viewBox: "0 0 24 24" } as const;

  if (name === "facebook") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M14.2 8.2V6.7c0-.7.5-.9 1-.9h2.6V2.1L14.6 2C11.4 2 9.8 3.9 9.8 6.4v1.8H7v4.2h2.8V22h4.4v-9.6h3.3l.5-4.2h-3.8Z" />
      </svg>
    );
  }
  if (name === "instagram") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "youtube") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M21.6 7.1a3 3 0 0 0-2.1-2.2C17.6 4.4 12 4.4 12 4.4s-5.6 0-7.5.5a3 3 0 0 0-2.1 2.2A31 31 0 0 0 2 12a31 31 0 0 0 .4 4.9 3 3 0 0 0 2.1 2.2c1.9.5 7.5.5 7.5.5s5.6 0 7.5-.5a3 3 0 0 0 2.1-2.2A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.9ZM10 15.4V8.6l5.8 3.4-5.8 3.4Z" />
      </svg>
    );
  }
  if (name === "whatsapp") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M12 2a9.7 9.7 0 0 0-8.4 14.5L2.2 22l5.6-1.5A9.8 9.8 0 1 0 12 2Zm0 17.6c-1.4 0-2.8-.4-4-1.1l-.3-.2-3.3.9.9-3.2-.2-.3A7.7 7.7 0 1 1 12 19.6Zm4.2-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-1.4-.7-2.3-1.3-3.2-2.9-.2-.3.2-.3.6-1.1.1-.2 0-.4 0-.5l-.7-1.7c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2.1 3.2 5.1 4.5 1.9.8 2.7.9 3.7.8.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.8-.4Z" />
      </svg>
    );
  }
  if (name === "threads") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2">
        <path d="M18.2 8.2C17.4 4.8 15.1 3 12 3 7.6 3 5 6.2 5 12s2.7 9 7.2 9c3.7 0 6.2-2.1 6.2-5.2 0-2.8-2.2-4.5-5.5-4.5-2.8 0-4.5 1.2-4.5 3.2 0 1.7 1.4 2.8 3.2 2.8 2.8 0 4.6-2 4.6-5.1 0-2.8-1.5-4.7-4-4.7-1.5 0-2.7.7-3.4 1.8" />
      </svg>
    );
  }
  if (name === "linkedin") {
    return (
      <svg {...common} fill="currentColor">
        <path d="M5.3 7.8H1.7V22h3.6V7.8ZM3.5 2A2.1 2.1 0 1 0 3.5 6.2 2.1 2.1 0 0 0 3.5 2ZM22 13.8c0-4.3-2.3-6.3-5.4-6.3-2.5 0-3.6 1.4-4.2 2.3v-2h-3.6V22h3.6v-7c0-1.8.3-3.6 2.6-3.6 2.2 0 2.3 2.1 2.3 3.8V22H22v-8.2Z" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor">
      <path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.2l7.3-8.4L2.8 2h6.5l4.4 5.9L18.9 2Zm-1.1 17.9h1.7L8.3 4H6.5l11.3 15.9Z" />
    </svg>
  );
}
