'use client';

import strings from '@json/src/app/admin-panel/arjen/avans/page.json';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { formatString } from '@/lib/strings/format';
import { FiUser, FiCalendar, FiDollarSign, FiEdit2, FiCheckCircle, FiAlertCircle, FiRepeat } from 'react-icons/fi';

dayjs.extend(utc);
dayjs.extend(timezone);

export default function DeductionForm() {
  const [employees, setEmployees] = useState<{id: string, name: string}[]>([]);
  const [form, setForm] = useState({
    employee_id: '',
    date: dayjs().tz('Europe/Istanbul').format('YYYY-MM-DD'),
    type: 'advance',
    amount: '',
    description: '',
  });
  const [message, setMessage] = useState<{type: 'success' | 'error'; text: string} | null>(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from('employees').select('id, name');
      if (error) {
        setMessage({ type: 'error', text: formatString(strings.employeesLoadFailed, { message: error.message }) });
        setEmployees([]);
      } else {
        setEmployees(data || []);
      }
    };
    fetchEmployees();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.employee_id || !form.date || !form.type || !form.amount) {
      setMessage({type: 'error', text: strings.requiredFields});
      return;
    }
    if (isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setMessage({type: 'error', text: strings.invalidAmount});
      return;
    }

    const { error } = await supabase.from('deductions').insert([{
      employee_id: form.employee_id,
      date: form.date,
      type: form.type,
      amount: Number(form.amount),
      description: form.description,
    }]);

    if (error) {
      setMessage({ type: 'error', text: formatString(strings.saveError, { message: error.message }) });
    } else {
      setMessage({type: 'success', text: strings.saveSuccess});
      setForm({
        employee_id: '',
        date: dayjs().tz('Europe/Istanbul').format('YYYY-MM-DD'),
        type: 'advance',
        amount: '',
        description: '',
      });
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-xl shadow-lg mt-8">
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <FiRepeat className="text-indigo-600" /> {strings.title}
      </h2>
      <p className="text-gray-500 mb-5">{strings.subtitle}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 font-medium mb-1 flex items-center gap-1">
            <FiUser /> {strings.employeeLabel} <span className="text-red-500">*</span>
          </label>
          <select
            name="employee_id"
            value={form.employee_id}
            onChange={handleChange}
            className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300"
            required
          >
            <option value="">{strings.selectEmployee}</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-1 flex items-center gap-1">
              <FiCalendar /> {strings.dateLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-1 flex items-center gap-1">
              <FiDollarSign /> {strings.amountLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0.01}
              step="0.01"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300"
              placeholder={strings.amountPlaceholder}
              required
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-1 flex items-center gap-1">
              <FiRepeat /> {strings.typeLabel} <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300"
              required
            >
              <option value="advance">{strings.typeAdvance}</option>
              <option value="subcontractor_cut">{strings.typeSubcontractorCut}</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-1 flex items-center gap-1">
              <FiEdit2 /> {strings.descriptionLabel}
            </label>
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="border rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-indigo-300"
              placeholder={strings.descriptionPlaceholder}
              maxLength={100}
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors text-lg flex items-center justify-center gap-2"
        >
          <FiCheckCircle /> {strings.saveButton}
        </button>
        {message && (
          <div
            className={`mt-2 flex items-center gap-2 px-3 py-2 rounded text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
}
