import { NextResponse } from 'next/server';
import { requireAdminUser } from '@/lib/admin-auth';
import { getRegistrationForAdmin } from '@/lib/registration-service';
import { normalizeVerificationCode } from '@/lib/registration-codes';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/admin/registrations/lookup/route.json';

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const kod = new URL(request.url).searchParams.get('kod');
    if (!kod) {
      return NextResponse.json({ error: strings.kodGerekli }, { status: 400 });
    }

    const registration = await getRegistrationForAdmin(normalizeVerificationCode(kod));
    if (!registration) {
      return NextResponse.json({ error: strings.başvuruBulunamadı }, { status: 404 });
    }

    return NextResponse.json({ registration });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
