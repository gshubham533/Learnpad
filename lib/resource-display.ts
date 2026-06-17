export function humanizeResourceName(filename: string): string {
  const dot = filename.lastIndexOf(".");
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isEditableResourceMime(mime: string): boolean {
  return (
    mime.startsWith("text/") ||
    mime === "application/json" ||
    mime === "application/markdown"
  );
}
