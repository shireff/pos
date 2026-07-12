/**
 * Code-page 864 (IBM864 / Arabic) mapping used to render Arabic product names
 * on ESC/POS thermal printers. ESC/POS printers expose Arabic glyphs only after
 * a code-page switch (ESC t 32); the byte stream must then carry CP864 code
 * points, not UTF-16 code units. This module converts Arabic Unicode text into
 * the CP864 byte sequence the printer expects.
 *
 * The mapping below covers the Arabic letter block (U+0621–U+064A), the tatweel,
 * and the Arabic-Indic digits (U+0660–U+0669). ASCII passes through unchanged.
 */

export const CP864: Record<number, number> = {
  0x061f: 0x80, // ؟
  0x0621: 0x81, // ء
  0x0622: 0x82, // آ
  0x0623: 0x83, // أ
  0x0624: 0x84, // ؤ
  0x0625: 0x85, // إ
  0x0626: 0x86, // ئ
  0x0627: 0x87, // ا
  0x0628: 0x88, // ب
  0x0629: 0x89, // ة
  0x062a: 0x8a, // ت
  0x062b: 0x8b, // ث
  0x062c: 0x8c, // ج
  0x062d: 0x8d, // ح
  0x062e: 0x8e, // خ
  0x062f: 0x8f, // د
  0x0630: 0x90, // ذ
  0x0631: 0x91, // ر
  0x0632: 0x92, // ز
  0x0633: 0x93, // س
  0x0634: 0x94, // ش
  0x0635: 0x95, // ص
  0x0636: 0x96, // ض
  0x0637: 0x97, // ط
  0x0638: 0x98, // ظ
  0x0639: 0x99, // ع
  0x063a: 0x9a, // غ
  0x0640: 0x9b, // ـ  (tatweel)
  0x0641: 0x9c, // ف
  0x0642: 0x9d, // ق
  0x0643: 0x9e, // ك
  0x0644: 0x9f, // ل
  0x0645: 0xa0, // م
  0x0646: 0xa1, // ن
  0x0647: 0xa2, // ه
  0x0648: 0xa3, // و
  0x0649: 0xa4, // ى
  0x064a: 0xa5, // ي
  0x064b: 0xc0, // ً
  0x064c: 0xc1, // ٰ? 
  0x064d: 0xc2, // ٱ? 
  0x064e: 0xc3, // َ
  0x064f: 0xc4, // ُ
  0x0650: 0xc5, // ِ
  0x0651: 0xc6, // ّ
  0x0652: 0xc7, // ْ
};

/** Arabic-Indic digit code points (U+0660–U+0669) → CP864 0xB0–0xB9. */
export function toArabicIndic(value: number | string): string {
  return String(value)
    .split('')
    .map((ch) => {
      const d = ch.charCodeAt(0) - 48; // '0'..'9'
      return d >= 0 && d <= 9 ? String.fromCharCode(0x0660 + d) : ch;
    })
    .join('');
}

/** Converts Arabic Unicode text into CP864 code bytes for an ESC/POS stream. */
export function toCp864Bytes(text: string): number[] {
  const out: number[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0x3f;
    if (cp >= 0x20 && cp <= 0x7e) {
      out.push(cp);
    } else if (CP864[cp] !== undefined) {
      out.push(CP864[cp]);
    } else if (cp >= 0x0660 && cp <= 0x0669) {
      out.push(0xb0 + (cp - 0x0660));
    } else {
      out.push(0x3f); // '?' fallback for unmapped glyphs
    }
  }
  return out;
}
