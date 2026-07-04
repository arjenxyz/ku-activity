'use client';


import { formatString } from '@/lib/strings/format';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ProjectPageHeader } from '@/components/project/ProjectPageHeader';
import { AlertBanner } from '@/components/project/AlertBanner';
import { cardClass, inputClass, labelClass, btnPrimary } from '@/components/project/ui';
import { useProjectEmployees } from '@/hooks/useProjectEmployees';
import {
  addTeamMember,
  createProjectTeam,
  fetchProjectBlocks,
  fetchProjectJobs,
  fetchProjectTeams,
  removeTeamMember,
  updateProjectTeam,
} from '@/lib/project-api';
import type { ProjectBlock } from '@/types/project-block';
import type { TeamWithMembers } from '@/types/project-block';

export default function EkiplerPage() {

  const strings = useRegistryStrings('app/admin-panel/proje/[projectId]/ekiplar/page');
  const { projectId } = useParams() as { projectId: string };
  const { employees } = useProjectEmployees(projectId);
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [blocks, setBlocks] = useState<ProjectBlock[]>([]);
  const [jobs, setJobs] = useState<Array<{ id: string; name: string; block_id?: string | null }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [saving, setSaving] = useState(false);

  const activeBlocks = useMemo(() => blocks.filter((b) => b.status === 'active'), [blocks]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamsData, blocksData, jobsData] = await Promise.all([
        fetchProjectTeams(projectId),
        fetchProjectBlocks(projectId),
        fetchProjectJobs(projectId),
      ]);
      setTeams(teamsData);
      setBlocks(blocksData);
      setJobs(jobsData as Array<{ id: string; name: string; block_id?: string | null }>);
    } catch (e) {
      setError(e instanceof Error ? e.message : strings.loadFailed);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const teamsWithoutBlock = teams.filter((t) => !t.block_id);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setSaving(true);
    try {
      const { teams: next } = await createProjectTeam(projectId, { name: teamName.trim() });
      setTeams(next);
      setTeamName('');
      setSuccess(strings.successTeamCreated);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.saveFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleTeamUpdate = async (
    teamId: string,
    patch: { blockId?: string | null; currentJobId?: string | null }
  ) => {
    setSaving(true);
    try {
      const { teams: next } = await updateProjectTeam(projectId, teamId, patch);
      setTeams(next);
      setSuccess(strings.successTeamUpdated);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.updateFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleAddMember = async (teamId: string, employeeId: string) => {
    if (!employeeId) return;
    setSaving(true);
    try {
      const { teams: next } = await addTeamMember(projectId, teamId, employeeId);
      setTeams(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.addMemberFailed);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    setSaving(true);
    try {
      const { teams: next } = await removeTeamMember(projectId, teamId, memberId);
      setTeams(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : strings.removeMemberFailed);
    } finally {
      setSaving(false);
    }
  };

  const assignedEmployeeIds = new Set(teams.flatMap((t) => t.members.map((m) => m.employee_id)));

  return (
    <div className="space-y-5 pb-8">
      <ProjectPageHeader title={strings.pageTitle} description={strings.pageDescription} />

      {teamsWithoutBlock.length > 0 && (
        <AlertBanner
          type="error"
          message={formatString(strings.teamsWithoutBlockAlert, {
            count: teamsWithoutBlock.length,
            teamNames: teamsWithoutBlock.map((t) => t.name).join(', '),
          })}
        />
      )}

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <div className={`${cardClass} p-5`}>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">{strings.sectionNewTeam}</h2>
        <form onSubmit={handleCreateTeam} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={labelClass}>{strings.labelTeamName}</label>
            <input
              className={inputClass}
              placeholder={strings.placeholderTeamName}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={btnPrimary} disabled={saving}>
            {strings.addButton}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-3">
          {strings.hintCreateBlockPrefix}{' '}
          <Link href={`/admin-panel/proje/${projectId}/bloklar`} className="text-emerald-700 hover:underline">
            {strings.hintBlockLink}
          </Link>{' '}
          {strings.hintCreateBlockSuffix}
        </p>
      </div>

      {loading ? (
        <div className={`${cardClass} p-10 text-center text-sm text-slate-500`}>{strings.loading}</div>
      ) : teams.length === 0 ? (
        <div className={`${cardClass} p-10 text-center text-slate-600`}>{strings.emptyTeams}</div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const blockJobs = team.block_id
              ? jobs.filter((j) => j.block_id === team.block_id || !j.block_id)
              : jobs;
            const availableEmployees = employees.filter((e) => !assignedEmployeeIds.has(e.id));

            return (
              <div key={team.id} className={`${cardClass} p-5 space-y-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">{team.name}</h3>
                  {!team.block_id && (
                    <span className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800 font-medium">
                      {strings.noBlockBadge}
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>{strings.labelActiveBlock}</label>
                    <select
                      className={inputClass}
                      value={team.block_id ?? ''}
                      disabled={saving}
                      onChange={(e) =>
                        handleTeamUpdate(team.id, {
                          blockId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">{strings.selectPlaceholder}</option>
                      {activeBlocks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{strings.labelCurrentJob}</label>
                    <select
                      className={inputClass}
                      value={team.current_job_id ?? ''}
                      disabled={saving}
                      onChange={(e) =>
                        handleTeamUpdate(team.id, {
                          currentJobId: e.target.value || null,
                        })
                      }
                    >
                      <option value="">{strings.selectPlaceholder}</option>
                      {blockJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className={labelClass}>
                    {formatString(strings.membersLabel, { count: team.members.length })}
                  </p>
                  {team.members.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {team.members.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2"
                        >
                          <span>{m.name}</span>
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:underline"
                            disabled={saving}
                            onClick={() => handleRemoveMember(team.id, m.id)}
                          >
                            {strings.removeMember}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex gap-2 mt-2">
                    <select
                      className={`${inputClass} flex-1`}
                      defaultValue=""
                      disabled={saving || availableEmployees.length === 0}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) {
                          handleAddMember(team.id, id);
                          e.target.value = '';
                        }
                      }}
                    >
                      <option value="">
                        {availableEmployees.length === 0
                          ? strings.noAvailableEmployees
                          : strings.addEmployeePlaceholder}
                      </option>
                      {availableEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
