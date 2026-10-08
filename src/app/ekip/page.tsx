import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { APP_NAME } from '@/lib/brand';
import { memberInitials, TEAM_MEMBERS } from '@/lib/team';
import { cardClass } from '@/components/ui/styles';

export default function TeamPage() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10">
      <div className={`mx-auto max-w-lg ${cardClass} p-6 sm:p-8`}>
        <Link href="/" className="mb-6 flex items-center gap-2">
          <BrandMark size="sm" />
          <span className="text-sm font-bold text-[#0E1548]">{APP_NAME}</span>
        </Link>
        <h1 className="text-xl font-bold text-[#0E1548]">Ekip</h1>
        {TEAM_MEMBERS.length > 0 ? (
          <ul className="mt-6 divide-y divide-slate-100">
            {TEAM_MEMBERS.map((member) => (
              <li key={member.name} className="flex gap-3 py-4 first:pt-0 last:pb-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0E1548] text-sm font-semibold text-white">
                  {memberInitials(member.name)}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#0E1548]">{member.name}</span>
                  <span className="mt-0.5 block text-xs font-medium text-[#2D6AF6]">{member.role}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">{member.about}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
