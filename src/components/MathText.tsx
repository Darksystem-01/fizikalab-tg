"use client";

import React, { useMemo } from "react";
import katex from "katex";

function renderKatex(tex: string, display: boolean): string {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode: display,
      throwOnError: false,
    });
  } catch {
    return tex;
  }
}

export function MathText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const renderedContent = useMemo(() => {
    if (!text) return "";

    // 1. Process explicit $$...$$ (display math) and $...$ (inline math)
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$)/g;
    let hasDelimiters = false;

    let res = text.replace(regex, (match) => {
      hasDelimiters = true;
      if (match.startsWith("$$") && match.endsWith("$$")) {
        return renderKatex(match.slice(2, -2), true);
      }
      return renderKatex(match.slice(1, -1), false);
    });

    if (hasDelimiters) {
      return res;
    }

    // 2. If no $ delimiters exist, detect embedded LaTeX commands (e.g. \alpha, \frac, \sum, a_\tau)
    // Matches expressions starting with backslash or containing subscript/superscript equation
    const inlineMathRegex = /(\\([a-zA-Z]+)(?:\{[^}]*\}|\^\{[^}]*\}|_[a-zA-Z0-9]+|\^[a-zA-Z0-9]+|[^\s,;?!()]*)*(?:\s*=\s*[^,;?!()\s]+)?|[a-zA-Z]_[a-zA-Z0-9]+)/g;

    res = text.replace(inlineMathRegex, (match) => {
      return renderKatex(match, false);
    });

    return res;
  }, [text]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}
