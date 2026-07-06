/** OCR çıktısındaki yaygın hataları düzelt — parse öncesi uygulanır */

export function normalizeOcrText(text: string): string {
  let out = text
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[₺]/g, '')
    .replace(/[|]/g, '1');

  // Yanlış ondalık: 12.375.00 veya 12.375 00 → 12.375,00 (Türkçe binlik noktaya dokunma!)
  const fixWrongDecimal = (intPart: string, dec: string) => {
    const clean = intPart.replace(/\./g, '');
    const formatted = clean.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted},${dec}`;
  };

  out = out.replace(/(\d{1,3}(?:\.\d{3})+)\.(\d{2})\b/g, (_, intPart, dec) =>
    fixWrongDecimal(intPart, dec)
  );
  out = out.replace(/(\d{1,3}(?:\.\d{3})+)\s+(\d{2})\b/g, (_, intPart, dec) =>
    fixWrongDecimal(intPart, dec)
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

  // Satır kırılımı: "12\n.375,00" → "12.375,00"
  out = out.replace(/(\d{1,3})\s*\n\s*\.(\d{3},\d{2})/g, '$1.$2');

  // Satır kırılımı: "12\n375,00" → "12.375,00"
  out = out.replace(/(\d{1,3})\s*\n\s*(\d{3},\d{2})/g, '$1.$2');

  // Boşluklu binlik: "12 375,00" → "12.375,00"
  out = out.replace(/\b(\d{1,3})\s+(\d{3},\d{2})\b/g, '$1.$2');

  // OCR binlik virgülü: "12,375,00" → "12.375,00"
  out = out.replace(/\b(\d{1,3}),(\d{3}),(\d{2})\b/g, '$1.$2,$3');

  // ABD binlik formatı: "12,375.00" → "12.375,00" (Halkbank OCR sık verir)
  out = out.replace(/\b(\d{1,3}(?:,\d{3})+)\.(\d{2})\b/g, (_, intPart, dec) => {
    const digits = intPart.replace(/,/g, '');
    const formatted = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formatted},${dec}`;
  });

  // Rakam etrafındaki gereksiz boşluk: "12 . 375 , 00" → "12.375,00"
  out = out.replace(/(\d)\s+([.,])\s*(\d)/g, '$1$2$3');

  return out;
}
