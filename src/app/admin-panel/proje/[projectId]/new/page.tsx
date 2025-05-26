'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabaseClient';
import dayjs from 'dayjs';
import { FiArrowLeft, FiUserPlus } from 'react-icons/fi';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  daily_wage: '',
  position: '',
  hire_date: dayjs().format('YYYY-MM-DD'),
  password_code: '',
};

export default function NewEmployeePage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId?: string };
  const [form, setForm] = useState({ ...initialForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value ?? '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!form.name || !form.daily_wage || !form.position || !form.password_code) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }
    if (!projectId) {
      setError('Hatalı proje ID, sayfayı doğru adresle açtığınızdan emin olun.');
      return;
    }

    setLoading(true);

    const { data, error: insertError } = await supabase
      .from('employees')
      .insert([{
        name: form.name,
        email: form.email,
        phone: form.phone,
        daily_wage: Number(form.daily_wage),
        position: form.position,
        hire_date: form.hire_date,
        project_id: projectId,
        password_code: form.password_code,
      }]);

    setLoading(false);

    if (insertError) {
      setError('Kayıt sırasında bir hata oluştu: ' + insertError.message);
      return;
    }

    setSuccess(true);
    setForm({ ...initialForm });
    setTimeout(() => {
      router.push(`/admin-panel/proje/${projectId}`);
    }, 1200);
  };

  // Eğer projectId yoksa, formu gösterme
  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-lg shadow">
          Proje ID bulunamadı. Lütfen sayfayı doğru adresle açın.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 md:p-8">
      <div className="w-full max-w-xl bg-white rounded-xl shadow p-6 mt-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-4"
        >
          <FiArrowLeft /> Geri
        </button>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <FiUserPlus /> Yeni Personel Ekle
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Ad Soyad *</label>
            <input
              type="text"
              name="name"
              value={form.name || ''}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">E-posta</label>
            <input
              type="email"
              name="email"
              value={form.email || ''}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Telefon</label>
            <input
              type="tel"
              name="phone"
              value={form.phone || ''}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Günlük Maaş (₺) *</label>
            <input
              type="number"
              name="daily_wage"
              value={form.daily_wage || ''}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
              min={0}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Pozisyon *</label>
            <input
              type="text"
              name="position"
              value={form.position || ''}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">İşe Giriş Tarihi</label>
            <input
              type="date"
              name="hire_date"
              value={form.hire_date || ''}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-1">Şifre *</label>
            <input
              type="text"
              name="password_code"
              value={form.password_code || ''}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full"
              required
            />
            <span className="text-xs text-gray-500">Personel bu şifre ile kendi paneline giriş yapabilir.</span>
          </div>
          {error && (
            <div className="text-red-600 bg-red-50 px-3 py-2 rounded">{error}</div>
          )}
          {success && (
            <div className="text-green-600 bg-green-50 px-3 py-2 rounded">Personel başarıyla eklendi!</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </form>
      </div>
    </div>
  );
}