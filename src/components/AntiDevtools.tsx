"use client";

import { useEffect } from "react";

export function AntiDevtools() {
  useEffect(() => {
    // 1. Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Disable DevTools inspection keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 key
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + Shift + I/J/C (DevTools inspect & console)
      if (
        isModifier &&
        e.shiftKey &&
        ["I", "i", "J", "j", "C", "c"].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + U (View source)
      if (isModifier && ["U", "u"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl/Cmd + S (Save source)
      if (isModifier && ["S", "s"].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // 3. DevTools open detection & anti-debugging trap
    let detectorTimer: NodeJS.Timeout | null = null;
    if (typeof window !== "undefined") {
      // Mute console output in production to prevent leaking runtime models or state
      if (process.env.NODE_ENV === "production") {
        const noop = () => {};
        try {
          console.log = noop;
          console.info = noop;
          console.warn = noop;
          console.table = noop;
        } catch {}
      }

      // Telegram WebApp / embedded iframes operate with different inner/outer window geometry.
      // Skip the anti-debugger trap when embedded in Telegram or iframes to avoid freezing the UI.
      const isEmbedded = window.self !== window.top || Boolean((window as any).Telegram?.WebApp);

      if (!isEmbedded) {
        detectorTimer = setInterval(() => {
          const threshold = 160;
          const widthDiff = window.outerWidth - window.innerWidth > threshold;
          const heightDiff = window.outerHeight - window.innerHeight > threshold;
          if (widthDiff || heightDiff) {
            try {
              Function("debugger")();
            } catch {}
          }
        }, 1000);
      }
    }

    document.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown, true);
      if (detectorTimer) clearInterval(detectorTimer);
    };
  }, []);

  return null;
}
