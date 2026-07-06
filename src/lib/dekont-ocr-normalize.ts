/** OCR çıktısındaki yaygın hataları düzelt — parse öncesi uygulanır */

export function normalizeOcrText(text: string): string {
  let out = text
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[₺]/g, '')
    .replace(/[|]/g, '1');

  // "5.000 00" veya "5.000.00" → Türkçe ondalık
  out = out.replace(
    /(\d{1,3}(?:[.\s]\d{3})+|\d+)\s*[.,]\s*(\d{2})\b/g,
    (_, intPart: string, dec: string) => {
      const clean = intPart.replace(/[\s.]/g, '');
      const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return `${formatted},${dec}`;
    }
  );

  // IBAN: TR00 0000 ... boşlukları koru ama O→0
  out = out.replace(/\bTR([0-9OIl\s]{24,30})\b/gi, (match) =>
    match.replace(/[O]/g, '0').replace(/[lI]/g, '1')
  );

  // Tutar satırlarında harf-sayı karışıklığı
  out = out.replace(
    /(tutar|tutari|miktar|amount|transfer|havale|eft|fast|odenen|ödenen|gonderilen|gönderilen)[^\n]{0,40}(\d[\d.\s,]*\d)/gi,
    (line) => line.replace(/(\d)[Oo](\d)/g, '$10$2').replace(/(\d)[lI](\d)/g, '$11$2')
  );

  return out;
}
