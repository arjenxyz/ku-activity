import { redirect } from 'next/navigation';

export default function AdminPaymentsIndexPage() {
  redirect('/admin/payments/reviews');
}
