'use client';

import { useCallback, useRef, useState } from 'react';

type Props = {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
};

export function PersonnelPullToRefresh({ onRefresh, children }: Props) {
  const startY = useRef(0);
  const pulling = useRef(false);
  const [offset, setOffset] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || refreshing) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) setOffset(Math.min(delta * 0.45, 72));
    },
    [refreshing]
  );

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (offset >= 56 && !refreshing) {
      setRefreshing(true);
      setOffset(48);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setOffset(0);
      }
    } else {
      setOffset(0);
    }
  }, [offset, onRefresh, refreshing]);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={() => void onTouchEnd()}
    >
      <div
        className="flex justify-center overflow-hidden transition-[height] duration-200 text-xs text-slate-500"
        style={{ height: offset > 0 ? offset : 0 }}
        aria-hidden={offset === 0}
      >
        {refreshing ? 'Yenileniyor…' : offset >= 56 ? 'Bırakın' : offset > 12 ? 'Yenilemek için çekin' : ''}
      </div>
      {children}
    </div>
  );
}
