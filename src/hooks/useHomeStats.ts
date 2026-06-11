'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

export type HomeStats = {
  activeUsers: number;
  uptime: number;
  totalEmployees: number;
  processingTime: number;
};

const DEFAULT_STATS: HomeStats = {
  activeUsers: 0,
  uptime: 99.9,
  totalEmployees: 0,
  processingTime: 0.3,
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export function useHomeStats() {
  const [stats, setStats] = useState<HomeStats>(DEFAULT_STATS);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const fetchRealStats = async () => {
      try {
        const { data: homeStats } = await supabase.rpc('get_home_stats');
        if (homeStats && typeof homeStats === 'object') {
          const hs = homeStats as { totalEmployees?: number; activeSessions?: number };
          setStats((prev) => ({
            ...prev,
            totalEmployees: hs.totalEmployees ?? 0,
            activeUsers: hs.activeSessions ?? 0,
          }));
        }

        const { data: uptimeData } = await supabase
          .from('system_uptime')
          .select('status')
          .gte('checked_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        const { data: processingData } = await supabase
          .from('payroll_processing')
          .select('processing_time')
          .eq('status', 'success')
          .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

        if (uptimeData && uptimeData.length > 0) {
          const upCount = uptimeData.filter((r) => r.status === 'up').length;
          setStats((prev) => ({
            ...prev,
            uptime: parseFloat(((upCount / uptimeData.length) * 100).toFixed(1)),
          }));
        }

        if (processingData && processingData.length > 0) {
          const totalTime = processingData.reduce(
            (sum: number, r: { processing_time: number }) => sum + r.processing_time,
            0
          );
          setStats((prev) => ({
            ...prev,
            processingTime: parseFloat((totalTime / processingData.length).toFixed(1)),
          }));
        }
      } catch (error) {
        console.error('Veri çekme hatası:', error);
      }
    };

    fetchRealStats();
  }, []);

  return stats;
}
