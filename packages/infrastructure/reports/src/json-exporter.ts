export function exportJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}
