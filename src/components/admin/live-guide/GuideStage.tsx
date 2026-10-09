'use client';

import type { GuideHighlight, GuideNavMode, GuideStageId } from '@/lib/admin/live-guide/types';
import { MockAudit } from './mocks/MockAudit';
import { MockCashAccept } from './mocks/MockCashAccept';
import { MockCheckIn } from './mocks/MockCheckIn';
import { MockCustody } from './mocks/MockCustody';
import { MockEventEdit } from './mocks/MockEventEdit';
import { MockEventsList } from './mocks/MockEventsList';
import { MockEventWorkspace } from './mocks/MockEventWorkspace';
import { MockParticipants } from './mocks/MockParticipants';
import { MockPaymentReviews } from './mocks/MockPaymentReviews';
import { MockReports } from './mocks/MockReports';
import { MockSettings } from './mocks/MockSettings';
import { MockSideNav } from './mocks/MockSideNav';
import { MockTeam } from './mocks/MockTeam';

type Props = {
  stage: GuideStageId;
  navMode: GuideNavMode;
  highlight?: GuideHighlight;
  pulse?: boolean;
};

function StageBody({
  stage,
  highlight,
  pulse,
}: {
  stage: GuideStageId;
  highlight?: GuideHighlight;
  pulse?: boolean;
}) {
  switch (stage) {
    case 'welcome':
    case 'menu':
      return (
        <p className="text-xs leading-relaxed text-slate-500">
          Soldaki menüyü izle — bir sonraki adımda Etkinlikler listesi açılacak.
        </p>
      );
    case 'events':
      return <MockEventsList highlight={highlight} pulse={pulse} />;
    case 'event-nav':
      return (
        <p className="text-xs leading-relaxed text-slate-500">
          Menü etkinlik moduna geçti. Soldaki öğeler artık Abana 2027’ye özel.
        </p>
      );
    case 'workspace':
      return <MockEventWorkspace highlight={highlight} pulse={pulse} />;
    case 'participants':
      return <MockParticipants highlight={highlight} pulse={pulse} />;
    case 'reviews':
      return <MockPaymentReviews highlight={highlight} pulse={pulse} />;
    case 'cash':
      return <MockCashAccept highlight={highlight} pulse={pulse} />;
    case 'custody':
      return <MockCustody highlight={highlight} pulse={pulse} />;
    case 'checkin':
      return <MockCheckIn highlight={highlight} pulse={pulse} />;
    case 'reports':
      return <MockReports highlight={highlight} pulse={pulse} />;
    case 'edit':
      return <MockEventEdit highlight={highlight} pulse={pulse} />;
    case 'team':
      return <MockTeam highlight={highlight} pulse={pulse} />;
    case 'audit':
      return <MockAudit highlight={highlight} pulse={pulse} />;
    case 'settings':
      return <MockSettings highlight={highlight} pulse={pulse} />;
    case 'done':
      return (
        <p className="text-xs leading-relaxed text-slate-500">
          Taklit bitti. Bitir’e basınca gerçek Etkinlikler’e geçebilirsin.
        </p>
      );
    default:
      return null;
  }
}

export function GuideStage({ stage, navMode, highlight, pulse }: Props) {
  return (
    <div
      key={`${stage}-${highlight ?? ''}`}
      className="grid gap-3 sm:grid-cols-[minmax(0,11rem)_1fr] lg:grid-cols-[13rem_1fr]"
    >
      <MockSideNav mode={navMode} highlight={highlight} pulse={pulse} />
      <div className="min-h-[200px] rounded-2xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
        <StageBody stage={stage} highlight={highlight} pulse={pulse} />
      </div>
    </div>
  );
}
