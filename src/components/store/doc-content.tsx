import { Fragment } from "react";

/**
 * Tiny, safe markdown subset for doc pages: #/##/### headings, ``` code blocks,
 * "- " lists, `inline code`, **bold** and paragraphs. Rendered as React nodes,
 * never as raw HTML, so admin-written content can't inject markup.
 */
export function DocContent({ source }: { source: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) code.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={blocks.length} className="my-5 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-4 font-mono text-sm leading-relaxed text-white/90">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const text = inline(heading[2]);
      const id = heading[2].toLowerCase().replace(/[^a-z0-9]+/g, "-");
      blocks.push(
        level === 1 ? (
          <h2 key={blocks.length} id={id} className="mt-10 mb-4 scroll-mt-24 text-3xl font-bold">{text}</h2>
        ) : level === 2 ? (
          <h3 key={blocks.length} id={id} className="mt-8 mb-3 scroll-mt-24 text-2xl font-bold">{text}</h3>
        ) : (
          <h4 key={blocks.length} id={id} className="mt-6 mb-2 scroll-mt-24 text-lg font-semibold">{text}</h4>
        ),
      );
      i++;
      continue;
    }

    if (/^\s*-\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*-\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*-\s+/, ""));
      blocks.push(
        <ul key={blocks.length} className="my-4 list-disc space-y-1.5 pl-6 text-white/80 marker:text-brand-soft">
          {items.map((item, k) => (
            <li key={k}>{inline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#{1,3}\s|```|\s*-\s)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(
      <p key={blocks.length} className="my-4 leading-relaxed text-white/80">
        {inline(para.join(" "))}
      </p>,
    );
  }

  return <div>{blocks}</div>;
}

function inline(text: string) {
  // Split on `code` and **bold** tokens, keep everything else as text
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em] text-brand-soft">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
