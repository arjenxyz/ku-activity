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

/** Stages that teach the menu itself — show only mock nav. */
const NAV_ONLY_STAGES: GuideStageId[] = ['welcome', 'menu', 'event-nav'];

function ContentBody({
  stage,
  highlight,
  pulse,
}: {
  stage: GuideStageId;
  highlight?: GuideHighlight;
  pulse?: boolean;
}) {
  switch (stage) {
    case 'events':
      return <MockEventsList highlight={highlight} pulse={pulse} />;
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
    default:
      return null;
  }
}

export function GuideStage({ stage, navMode, highlight, pulse }: Props) {
  if (stage === 'done') {
    return null;
  }

  const focusNav =
    NAV_ONLY_STAGES.includes(stage) || Boolean(highlight?.startsWith('nav-'));

  if (focusNav) {
    return (
      <div key={`${stage}-nav-${highlight ?? ''}-${navMode}`}>
        <MockSideNav mode={navMode} highlight={highlight} pulse={pulse} />
      </div>
    );
  }

  return (
    <div
      key={`${stage}-body-${highlight ?? ''}`}
      className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4"
    >
      <ContentBody stage={stage} highlight={highlight} pulse={pulse} />
    </div>
  );
}
