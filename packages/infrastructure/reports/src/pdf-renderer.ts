export async function renderPdf(html: string): Promise<Uint8Array> {
  try {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      return new Uint8Array(pdf);
    } finally {
      await browser.close();
    }
  } catch {
    return new Uint8Array(Buffer.from(`<html><body><pre>${html}</pre></body></html>`));
  }
}
