const FILE_REF_PATTERN = /state\/(?:product|resources)\/[\w./_-]+/g;

export function extractFileRefs(text: string): string[] {
  if (!text) return [];
  const seen = new Set<string>();
  for (const match of text.matchAll(FILE_REF_PATTERN)) {
    let path = match[0];
    path = path.replace(/[.,;:!?)]+$/, "");
    seen.add(path);
  }
  return [...seen];
}

export function linkifyFileRefs(content: string): string {
  if (!content) return content;
  return content.replace(FILE_REF_PATTERN, (path) => {
    const trimmed = path.replace(/[.,;:!?)]+$/, "");
    return `[${trimmed}](file://${trimmed})`;
  });
}
