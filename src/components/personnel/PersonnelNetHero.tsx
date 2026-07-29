'use client';

import { FiArrowRight, FiBriefcase, FiCreditCard, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import { useRegistryStrings } from '@/lib/i18n/useRegistryStrings';
import { formatMoney } from '@/lib/format';
import { EmployeeAvatar } from '@/components/employee/EmployeeAvatar';
import { PersonnelMonthChip } from '@/components/personnel/PersonnelMonthChip';

type Props = {
  fullName?: string;
  position?: string;
  photoUrl?: string | null;
  net: number;
  gross: number;
  totalAdvance?: number;
  totalDeduct?: number;
  month: string;
  onMonthChange: (month: string) => void;
  onOpenFinance?: () => void;
  /** Landing mockup gibi dar çerçevelerde viewport `sm:` stillerini bastırır */
  forceMobile?: boolean;
};

export function PersonnelNetHero({
  fullName,
  position,
  photoUrl,
  net,
  gross,
  totalAdvance = 0,
  totalDeduct = 0,
  month,
  onMonthChange,
  onOpenFinance,
  forceMobile = false,
}: Props) {
  const strings = useRegistryStrings('components/personnel/PersonnelNetHero');
  const displayName = fullName ?? strings.defaultName;
  const netTone = forceMobile
    ? net < 0
      ? 'text-red-300'
      : 'text-emerald-300'
    : net < 0
      ? 'text-red-300 sm:text-red-600 dark:sm:text-red-400'
      : 'text-emerald-300 sm:text-emerald-600 dark:sm:text-emerald-400';

  return (
    <section
      aria-label={strings.sectionAriaLabel}
      className={
        forceMobile
          ? 'relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E1548] via-[#152060] to-indigo-950 text-white shadow-xl shadow-[#0E1548]/25 ring-1 ring-white/10'
          : 'relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-[#0E1548] via-[#152060] to-indigo-950 text-white shadow-xl shadow-[#0E1548]/25 ring-1 ring-white/10 sm:rounded-3xl sm:border sm:border-slate-200 sm:bg-none sm:bg-white sm:text-slate-900 sm:shadow-sm sm:ring-0 dark:sm:border-slate-700 dark:sm:bg-slate-900 dark:sm:text-white'
      }
    >
      <div
        className={
          forceMobile
            ? 'pointer-events-none absolute inset-0 opacity-30'
            : 'pointer-events-none absolute inset-0 opacity-30 sm:hidden'
        }
        style={{
          backgroundImage:
            'radial-gradient(circle at 90% 10%, rgba(96,165,250,0.45) 0%, transparent 42%), radial-gradient(circle at 10% 90%, rgba(129,140,248,0.3) 0%, transparent 40%)',
        }}
      />
      <div
        className={
          forceMobile
            ? 'pointer-events-none absolute inset-0 opacity-[0.06]'
            : 'pointer-events-none absolute inset-0 opacity-[0.06] sm:hidden'
        }
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div
        className={
          forceMobile
            ? 'pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl'
            : 'pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-400/15 blur-3xl sm:hidden'
        }
      />

      <div className={forceMobile ? 'relative px-4 py-4' : 'relative px-4 py-4 sm:px-5 sm:py-4'}>
        <div className={forceMobile ? 'flex items-center gap-3.5' : 'flex items-center gap-3.5 sm:gap-3'}>
          <div className="relative shrink-0">
            <div
              className={
                forceMobile
                  ? 'absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-white/30 via-white/10 to-transparent blur-[1px]'
                  : 'absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-white/30 via-white/10 to-transparent blur-[1px] sm:hidden'
              }
              aria-hidden
            />
            <EmployeeAvatar
              name={displayName}
              photoUrl={photoUrl}
              size="lg"
              className={
                forceMobile
                  ? 'relative !rounded-2xl h-[4.25rem] w-[4.25rem] ring-2 ring-white/30 shadow-lg shadow-black/25'
                  : 'relative !rounded-2xl h-[4.25rem] w-[4.25rem] ring-2 ring-white/30 shadow-lg shadow-black/25 sm:h-[3.5rem] sm:w-[3.5rem] sm:ring-1 sm:ring-slate-200 sm:shadow-none dark:sm:ring-slate-700'
              }
            />
          </div>

          <div className="min-w-0 flex-1">
            <h1
              className={
                forceMobile
                  ? 'text-xl font-bold leading-tight tracking-tight break-words text-white'
                  : 'text-xl font-bold leading-tight tracking-tight break-words text-white sm:text-[1.4rem] sm:text-slate-900 dark:sm:text-white'
              }
            >
              {displayName}
            </h1>
            {position ? (
              <p
                className={
                  forceMobile
                    ? 'mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm text-blue-100/90'
                    : 'mt-1.5 inline-flex max-w-full items-center gap-1.5 text-sm text-blue-100/90 sm:text-slate-500 dark:sm:text-slate-400'
                }
              >
                <FiBriefcase className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                <span className="truncate">{position}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={
            forceMobile
              ? 'my-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent'
              : 'my-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent sm:my-3 sm:bg-none sm:bg-slate-200 dark:sm:bg-slate-700'
          }
          aria-hidden
        />

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={
                forceMobile
                  ? 'text-xs font-medium text-slate-400'
                  : 'text-xs font-medium text-slate-400 sm:text-slate-500 dark:sm:text-slate-400'
              }
            >
              {strings.estimatedNet}
            </p>
            <p className={`mt-2 text-3xl font-bold tabular-nums tracking-tight ${netTone}`}>
              {formatMoney(net)}
            </p>
          </div>
          <PersonnelMonthChip month={month} onChange={onMonthChange} tone="onDark" />
        </div>

        <div
          className={
            forceMobile
              ? 'my-4 h-px bg-gradient-to-r from-emerald-400/70 via-blue-400/50 to-transparent'
              : 'my-4 h-px bg-gradient-to-r from-emerald-400/70 via-blue-400/50 to-transparent sm:my-3 sm:bg-none sm:bg-slate-200 dark:sm:bg-slate-700'
          }
          aria-hidden
        />

        <div className={forceMobile ? 'grid grid-cols-3 gap-2' : 'grid grid-cols-3 gap-2 sm:gap-3'}>
          <div
            className={
              forceMobile
                ? 'rounded-xl border border-white/10 bg-white/8 px-3 py-2.5'
                : 'rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 sm:border-slate-200 sm:bg-slate-50 dark:sm:border-slate-700 dark:sm:bg-slate-800/70'
            }
          >
            <p
              className={
                forceMobile
                  ? 'flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400'
                  : 'flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-slate-500 dark:sm:text-slate-400'
              }
            >
              <FiTrendingUp
                className={
                  forceMobile
                    ? 'h-3 w-3 text-emerald-400'
                    : 'h-3 w-3 text-emerald-400 sm:text-emerald-600 dark:sm:text-emerald-400'
                }
                aria-hidden
              />
              {strings.gross}
            </p>
            <p
              className={
                forceMobile
                  ? 'mt-1 text-sm font-semibold tabular-nums text-white'
                  : 'mt-1 text-sm font-semibold tabular-nums text-white sm:text-slate-900 dark:sm:text-white'
              }
            >
              {formatMoney(gross)}
            </p>
          </div>
          <div
            className={
              forceMobile
                ? 'rounded-xl border border-white/10 bg-white/8 px-3 py-2.5'
                : 'rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 sm:border-slate-200 sm:bg-slate-50 dark:sm:border-slate-700 dark:sm:bg-slate-800/70'
            }
          >
            <p
              className={
                forceMobile
                  ? 'flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400'
                  : 'flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-slate-500 dark:sm:text-slate-400'
              }
            >
              <FiTrendingDown
                className={
                  forceMobile
                    ? 'h-3 w-3 text-amber-400'
                    : 'h-3 w-3 text-amber-400 sm:text-amber-600 dark:sm:text-amber-400'
                }
                aria-hidden
              />
              {strings.deduction}
            </p>
            <p
              className={
                forceMobile
                  ? 'mt-1 text-sm font-semibold tabular-nums text-white'
                  : 'mt-1 text-sm font-semibold tabular-nums text-white sm:text-slate-900 dark:sm:text-white'
              }
            >
              {formatMoney(totalDeduct)}
            </p>
          </div>
          <div
            className={
              forceMobile
                ? 'rounded-xl border border-white/10 bg-white/8 px-3 py-2.5'
                : 'rounded-xl border border-white/10 bg-white/8 px-3 py-2.5 sm:border-slate-200 sm:bg-slate-50 dark:sm:border-slate-700 dark:sm:bg-slate-800/70'
            }
          >
            <p
              className={
                forceMobile
                  ? 'flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400'
                  : 'flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 sm:text-slate-500 dark:sm:text-slate-400'
              }
            >
              <FiCreditCard
                className={
                  forceMobile
                    ? 'h-3 w-3 text-indigo-300'
                    : 'h-3 w-3 text-indigo-300 sm:text-indigo-600 dark:sm:text-indigo-400'
                }
                aria-hidden
              />
              {strings.advance}
            </p>
            <p
              className={
                forceMobile
                  ? 'mt-1 text-sm font-semibold tabular-nums text-white'
                  : 'mt-1 text-sm font-semibold tabular-nums text-white sm:text-slate-900 dark:sm:text-white'
              }
            >
              {formatMoney(totalAdvance)}
            </p>
          </div>
        </div>

        {onOpenFinance ? (
          <button
            type="button"
            onClick={onOpenFinance}
            className={
              forceMobile
                ? 'mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-200 transition-colors hover:text-white'
                : 'mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-200 transition-colors hover:text-white sm:text-[#0E1548] sm:hover:text-[#1d2f89] dark:sm:text-blue-300 dark:sm:hover:text-blue-200'
            }
          >
            {strings.financeDetail}
            <FiArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </section>
  );
}
