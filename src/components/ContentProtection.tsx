'use client';

import { useEffect } from 'react';

const ALLOW_SELECTOR =
  'input, textarea, select, [contenteditable="true"], .allow-select, .allow-context-menu';

/**
 * Metin seçimi / uzun basma menüsü / görsel sürükleyip indirme koruması.
 * Form alanları ve `.allow-select` / `.allow-context-menu` istisna.
 */
export function ContentProtection() {
  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(ALLOW_SELECTOR)) return;
      event.preventDefault();
    };

    const onDragStart = (event: DragEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(ALLOW_SELECTOR)) return;
      if (
        target instanceof HTMLImageElement ||
        target.closest('img, picture, svg, video, canvas')
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('dragstart', onDragStart);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('dragstart', onDragStart);
    };
  }, []);

  return null;
}
