import { createAdminClient } from '@/utils/supabase/admin';

function appBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

export async function sendPersonnelContractsEmail(params: {
  email: string;
  fullName: string;
  registrationRequestId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(
      '[contract-email] RESEND_API_KEY veya EMAIL_FROM tanımlı değil; e-posta atlanıyor.'
    );
    return { sent: false as const };
  }

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('personnel_contract_acceptances')
    .select(
      `
      access_token,
      personnel_contracts (title, slug)
    `
    )
    .eq('registration_request_id', params.registrationRequestId);

  if (!rows?.length) return { sent: false as const };

  const base = appBaseUrl();
  const links = rows
    .flatMap((row) => {
      const joined = row.personnel_contracts as
        | { title: string; slug: string }
        | { title: string; slug: string }[]
        | null;
      const contract = Array.isArray(joined) ? joined[0] : joined;
      if (!contract) return [];
      const url = `${base}/sozlesme/${contract.slug}?t=${row.access_token}`;
      return [`<li><a href="${url}">${contract.title}</a> — görüntüle / yazdır</li>`];
    })
    .join('');

  const html = `
    <p>Merhaba ${params.fullName},</p>
    <p>Personel başvurunuz kapsamında onayladığınız sözleşmeler aşağıdadır. Bu bağlantıları saklayın; istediğiniz zaman açıp indirebilirsiniz.</p>
    <ul>${links}</ul>
    <p>Onay sonrası personel paneline giriş yaptığınızda <strong>Ayarlar → Sözleşmelerim</strong> bölümünden de erişebilirsiniz.</p>
    <p style="color:#64748b;font-size:12px">Bu e-posta otomatik gönderilmiştir.</p>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: params.email,
      subject: 'Onayladığınız personel sözleşmeleri — ArjenDev',
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('[contract-email] Resend hatası:', text);
    return { sent: false as const };
  }

  return { sent: true as const };
}
