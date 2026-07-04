'use client';

import strings from '@json/src/app/admin-panel/maas-politikasi/page.json';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertBanner } from '@/components/project/AlertBanner';
import { WagePolicyForm, emptyWagePolicy } from '@/components/project/WagePolicyForm';
import { normalizeWagePolicy, type WagePolicy } from '@/types/wage-policy';

export default function CompanyWagePolicyPage() {
  const [policy, setPolicy] = useState<WagePolicy>(emptyWagePolicy());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/wage-policy')
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error || strings.loadFailed);
        return res.json();
      })
      .then((d) => {
        if (d.policy) setPolicy(normalizeWagePolicy(d.policy));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/admin/wage-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy }),
      });
      if (!res.ok) throw new Error((await res.json()).error || strings.saveFailed);
      const d = await res.json();
      setPolicy(normalizeWagePolicy(d.policy));
      setSuccess(strings.saveSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <p className="mb-6 text-sm">
        <Link href="/admin-panel" className="text-indigo-600 hover:text-indigo-700">
          {strings.backToProjects}
        </Link>
      </p>

      <WagePolicyForm
        value={policy}
        onChange={setPolicy}
        onSubmit={handleSubmit}
        loading={loading}
        saving={saving}
        title={strings.title}
        subtitle={strings.subtitle}
      />
    </div>
  );
}
