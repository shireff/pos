export async function renderPdf(html: string): Promise<Uint8Array> {
  return new Uint8Array(Buffer.from(`<html><body><pre>${html}</pre></body></html>`));
}
