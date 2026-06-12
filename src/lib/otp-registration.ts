import { createAdminClient } from '@/utils/supabase/admin';
import type { ContractAcceptanceInput } from '@/lib/contract-service';
import { recordContractAcceptances } from '@/lib/contract-service';
import { moveDraftPhotoToRegistration } from '@/lib/registration-photo';
import {
  submitRegistrationApplication,
  type RegistrationApplyInput,
} from '@/lib/registration-service';

export type OtpRegistrationDraft = RegistrationApplyInput & {
  contractAcceptances: ContractAcceptanceInput[];
};

export type OtpSubmissionResult = {
  verificationCode: string;
  approvalUrl: string;
  reused?: boolean;
};

export async function submitRegistrationFromOtpDraft(params: {
  challengeId: string;
  draft: OtpRegistrationDraft;
  draftPhotoPath: string | null;
  userAgent?: string | null;
}): Promise<OtpSubmissionResult> {
  const admin = createAdminClient();

  const { data: challenge, error: lockError } = await admin
    .from('contract_otp_challenges')
    .update({ submitted_at: new Date().toISOString() })
    .eq('id', params.challengeId)
    .is('submitted_at', null)
    .is('consumed_at', null)
    .select('id')
    .maybeSingle();

  if (lockError || !challenge) {
    throw new Error('Bu başvuru zaten gönderildi veya süresi doldu.');
  }

  try {
    const result = await submitRegistrationApplication({
      firstName: params.draft.firstName,
      lastName: params.draft.lastName,
      email: params.draft.email,
      phone: params.draft.phone,
      tcKimlik: params.draft.tcKimlik,
      birthDate: params.draft.birthDate,
      iban: params.draft.iban,
      pin: params.draft.pin,
    });

    await recordContractAcceptances({
      registrationRequestId: result.id,
      email: params.draft.email,
      firstName: params.draft.firstName,
      lastName: params.draft.lastName,
      acceptances: params.draft.contractAcceptances,
      userAgent: params.userAgent,
    });

    if (params.draftPhotoPath) {
      await moveDraftPhotoToRegistration(params.draftPhotoPath, result.id);
    }

    await admin
      .from('contract_otp_challenges')
      .update({ consumed_at: new Date().toISOString() })
      .eq('id', params.challengeId);

    return {
      verificationCode: result.verificationCode,
      approvalUrl: result.approvalUrl,
      reused: result.reused,
    };
  } catch (err) {
    await admin
      .from('contract_otp_challenges')
      .update({ submitted_at: null })
      .eq('id', params.challengeId);
    throw err;
  }
}
