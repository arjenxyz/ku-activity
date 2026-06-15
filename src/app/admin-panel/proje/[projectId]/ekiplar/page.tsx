'use client';

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
      setError(e instanceof Error ? e.message : 'Yüklenemedi');
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
      setSuccess('Ekip oluşturuldu. Blok ve iş atayın, personel ekleyin.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kayıt başarısız');
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
      setSuccess('Ekip güncellendi.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Güncellenemedi');
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
      setError(err instanceof Error ? err.message : 'Personel eklenemedi');
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
      setError(err instanceof Error ? err.message : 'Çıkarılamadı');
    } finally {
      setSaving(false);
    }
  };

  const assignedEmployeeIds = new Set(teams.flatMap((t) => t.members.map((m) => m.employee_id)));

  return (
    <div className="space-y-5 pb-8">
      <ProjectPageHeader
        title="Ekipler"
        description="İşçileri ekiplere ayırın, aktif bloğa ve güncel işe atayın. Onaylı yevmiye otomatik işlenir."
      />

      {teamsWithoutBlock.length > 0 && (
        <AlertBanner
          type="error"
          message={`${teamsWithoutBlock.length} ekibin blok ataması yok: ${teamsWithoutBlock.map((t) => t.name).join(', ')}. Yevmiye girişi engellenir.`}
        />
      )}

      {error && <AlertBanner type="error" message={error} />}
      {success && <AlertBanner type="success" message={success} />}

      <div className={`${cardClass} p-5`}>
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Yeni ekip</h2>
        <form onSubmit={handleCreateTeam} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className={labelClass}>Ekip adı</label>
            <input
              className={inputClass}
              placeholder="Örn. Çatı ekibi"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={btnPrimary} disabled={saving}>
            Ekle
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-3">
          Önce{' '}
          <Link href={`/admin-panel/proje/${projectId}/bloklar`} className="text-emerald-700 hover:underline">
            blok
          </Link>{' '}
          oluşturun, sonra ekibe atayın.
        </p>
      </div>

      {loading ? (
        <div className={`${cardClass} p-10 text-center text-sm text-slate-500`}>Yükleniyor…</div>
      ) : teams.length === 0 ? (
        <div className={`${cardClass} p-10 text-center text-slate-600`}>Henüz ekip yok.</div>
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
                      Blok atanmadı
                    </span>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Aktif blok</label>
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
                      <option value="">Seçin…</option>
                      {activeBlocks.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Güncel iş (otomatik yevmiye)</label>
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
                      <option value="">Seçin…</option>
                      {blockJobs.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <p className={labelClass}>Üyeler ({team.members.length})</p>
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
                            Çıkar
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
                          ? 'Eklenecek personel yok'
                          : 'Personel ekle…'}
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
