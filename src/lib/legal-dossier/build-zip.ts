import JSZip from 'jszip';
import type { DossierFile } from './types';

export async function buildDossierZip(files: DossierFile[]): Promise<Buffer> {
  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.path, file.content);
  }
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
