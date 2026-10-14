'use client';

import { useState, useEffect } from 'react';

/**
 * LiveClock — Client-side date display that updates once on mount.
 * Avoids the server-side new Date() prerendering issue.
 */
export default function LiveClock() {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString('en-GB', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  if (!dateStr) return null;

  return (
    <span className="text-xs text-zinc-500 hidden sm:inline">
      {dateStr}
    </span>
  );
}
