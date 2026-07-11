export async function streamCsv(
  rows: Record<string, unknown>[],
  headers: string[],
  write: (chunk: string) => void,
): Promise<void> {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(headers.join(',') + '\n'));
      for (const row of rows) {
        const line = headers.map((h) => JSON.stringify(row[h] ?? '')).join(',');
        controller.enqueue(encoder.encode(line + '\n'));
      }
      controller.close();
    },
  });
  const reader = stream.getReader();
  let done = false;
  while (!done) {
    const result = await reader.read();
    done = result.done;
    if (result.value) {
      write(new TextDecoder().decode(result.value));
    }
  }
}
