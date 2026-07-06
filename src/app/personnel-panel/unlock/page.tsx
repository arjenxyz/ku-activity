import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/utils/supabase/admin';
import { getPersonnelSession } from '@/lib/personnel-auth';
import { PERSONNEL_COOKIE } from '@/lib/personnel-cookie';
import { isPersonnelUnlocked } from '@/lib/personnel-unlock-server';
import { PersonnelUnlockLayout } from '@/components/personnel/PersonnelUnlockLayout';
import { UnlockFormClient } from './UnlockFormClient';

export default async function PersonnelUnlockPage() {
  const session = await getPersonnelSession();
  if (!session) {
    redirect('/personnel-panel/login');
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(PERSONNEL_COOKIE)?.value;
  if (await isPersonnelUnlocked(token)) {
    redirect('/personnel-panel');
  }

  const admin = createAdminClient();
  const { data: employee } = await admin
    .from('employees')
    .select('name')
    .eq('id', session.employeeId)
    .maybeSingle();

  const fullName = employee?.name?.trim() ?? '';
  const firstName = fullName.split(/\s+/)[0] ?? '';

  return (
    <PersonnelUnlockLayout>
      <Suspense>
        <UnlockFormClient fullName={fullName} firstName={firstName} />
      </Suspense>
    </PersonnelUnlockLayout>
  );
}
