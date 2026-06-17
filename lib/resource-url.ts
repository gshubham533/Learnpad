export function resourceUrl(path: string, options?: { edit?: boolean }): string {
  const params = new URLSearchParams({ path });
  if (options?.edit) params.set("edit", "1");
  return `/resources?${params.toString()}`;
}

export function resourceEditUrl(path: string): string {
  return resourceUrl(path, { edit: true });
}
