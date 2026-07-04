import { NextResponse } from 'next/server';
import { requireDeveloperUser } from '@/lib/developer-auth';
import { createClient } from '@/utils/supabase/server';
import { apiErrorMessage } from '@/lib/project-queries';
import strings from '@json/src/app/api/developer/codes/[codeId]/route.json';

type Ctx = { params: Promise<{ codeId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const user = await requireDeveloperUser();
    const { codeId } = await ctx.params;
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('revoke_verification_code', {
      p_developer_id: user.id,
      p_code_id: codeId,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: strings.kodBulunamadıVeyaZatenKullanılmış }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const { status, message } = apiErrorMessage(err);
    return NextResponse.json({ error: message }, { status });
  }
}
