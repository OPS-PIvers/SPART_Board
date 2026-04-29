/**
 * Shared utilities for quiz-to-scoreboard integration.
 * Used by QuizResults (one-time send) and live scoreboard sync.
 */

import {
  QuizResponse,
  QuizQuestion,
  ClassRoster,
  ScoreboardTeam,
  QuizSession,
  QuizLeaderboardEntry,
} from '@/types';
import { gradeAnswer } from '@/hooks/useQuizSession';
import { SCOREBOARD_COLORS } from '@/config/scoreboard';
import type { StudentName } from '@/hooks/useAssignmentPseudonyms';
import {
  resolveResponseDisplayName,
  responseColorIndex,
  responseTeamId,
} from './resolveDisplayName';

type QuizScoringSession =
  | Pick<QuizSession, 'speedBonusEnabled' | 'streakBonusEnabled'>
  | null
  | undefined;

/**
 * Compute the streak multiplier for the i-th answer in a sequence.
 * Returns 1x for streak<2, 1.5x for streak==2, 2x for streak>=3.
 */
function streakMultiplier(consecutiveCorrect: number): number {
  if (consecutiveCorrect >= 3) return 2;
  if (consecutiveCorrect === 2) return 1.5;
  return 1;
}

/**
 * Compute the raw points a student earned, optionally including
 * speed bonus and streak multiplier when the session has them enabled.
 */
export function getEarnedPoints(
  r: QuizResponse,
  questions: QuizQuestion[],
  session?: QuizScoringSession
): number {
  const speedEnabled = session?.speedBonusEnabled ?? false;
  const streakEnabled = session?.streakBonusEnabled ?? false;

  // Precompute question lookup map for O(1) access
  const qMap = new Map(questions.map((q) => [q.id, q]));

  // Sort answers by answeredAt to compute streaks in chronological order
  const sortedAnswers = [...r.answers].sort(
    (a, b) => (a.answeredAt ?? 0) - (b.answeredAt ?? 0)
  );

  let totalPoints = 0;
  let streak = 0;

  for (const ans of sortedAnswers) {
    const q = qMap.get(ans.questionId);
    if (!q) continue;

    const basePts = q.points ?? 1;
    const isCorrect = gradeAnswer(q, ans.answer);

    if (!isCorrect) {
      streak = 0;
      continue;
    }

    streak++;

    let pts = basePts;

    // Speed bonus: up to 50% extra for fast answers (clamp untrusted client data)
    if (speedEnabled && q.timeLimit > 0 && ans.speedBonus) {
      const clamped = Math.min(50, Math.max(0, ans.speedBonus));
      pts *= 1 + clamped / 100;
    }

    // Streak multiplier
    if (streakEnabled) {
      pts *= streakMultiplier(streak);
    }

    totalPoints += pts;
  }

  return Math.round(totalPoints);
}

/**
 * Returns true when the session has speed bonus or streak multiplier enabled,
 * meaning scores can exceed 100% and should be shown as raw points instead.
 */
export function isGamificationActive(session?: QuizScoringSession): boolean {
  return (
    (session?.speedBonusEnabled ?? false) ||
    (session?.streakBonusEnabled ?? false)
  );
}

/**
 * Compute a student's percentage score using per-question point values.
 */
export function getResponseScore(
  r: QuizResponse,
  questions: QuizQuestion[],
  session?: QuizScoringSession
): number {
  const maxPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0);
  if (maxPoints === 0) return 0;
  return Math.round((getEarnedPoints(r, questions, session) / maxPoints) * 100);
}

/**
 * Returns the score value appropriate for display:
 * - When gamification is active: raw earned points (avoids confusing >100% values)
 * - When gamification is off: percentage score (0-100)
 */
export function getDisplayScore(
  r: QuizResponse,
  questions: QuizQuestion[],
  session?: QuizScoringSession
): number {
  if (isGamificationActive(session)) {
    return getEarnedPoints(r, questions, session);
  }
  return getResponseScore(r, questions, session);
}

/**
 * Returns the suffix for displayed scores: "pts" when gamification is active,
 * "%" otherwise.
 */
export function getScoreSuffix(session?: QuizScoringSession): string {
  return isGamificationActive(session) ? ' pts' : '%';
}

/**
 * Composite-key separator used by `buildPinToNameMap` /
 * `buildPinToExportNameMap`. Map keys are `${classPeriod}${PIN_KEY_SEP}${pin}`
 * so that the same PIN in two different rosters resolves to two different
 * students. The separator is U+0001 (Start of Heading), which can't appear in
 * a roster name or a PIN — both are user-typed strings, but no editable text
 * field accepts control characters.
 */
const PIN_KEY_SEP = '';

function makePinKey(classPeriod: string, pin: string): string {
  return `${classPeriod}${PIN_KEY_SEP}${pin}`;
}

/**
 * Look up the roster name for a `(classPeriod, pin)` pair.
 *
 * Tries the period-scoped key first (correct path). Falls back to a suffix
 * scan over the whole map when `classPeriod` is missing — preserves legacy
 * behavior for SSO joiners and any older response docs that predate
 * per-period scoping. Returns `undefined` when nothing matches.
 *
 * Both zero-padded (`"01"`) and stripped (`"1"`) forms are accepted.
 */
export function resolvePinName(
  map: Record<string, string>,
  classPeriod: string | null | undefined,
  pin: string | null | undefined
): string | undefined {
  if (!pin) return undefined;
  const stripped = pin.replace(/^0+/, '');
  const variants = stripped && stripped !== pin ? [pin, stripped] : [pin];

  if (classPeriod) {
    for (const v of variants) {
      const hit = map[makePinKey(classPeriod, v)];
      if (hit) return hit;
    }
  }

  // No-classPeriod / no-match fallback. Scan composite keys for a matching
  // PIN suffix (legacy SSO + pre-period-scoping responses).
  for (const v of variants) {
    const suffix = `${PIN_KEY_SEP}${v}`;
    for (const k in map) {
      if (k.endsWith(suffix)) return map[k];
    }
  }

  // Final fallback: maps built by hand (e.g., older callers, tests) may key
  // directly on the bare PIN with no period prefix. Honor those too.
  for (const v of variants) {
    const hit = map[v];
    if (hit) return hit;
  }

  return undefined;
}

/**
 * Build a (classPeriod, PIN) → student full-name lookup from matching
 * rosters. Accepts an array of period names to support multi-class
 * assignments. Keys are composite (see `PIN_KEY_SEP`); always look up via
 * `resolvePinName`, never index the map directly.
 */
export function buildPinToNameMap(
  rosters: ClassRoster[],
  periodNames?: string[]
): Record<string, string> {
  const map: Record<string, string> = {};
  if (!periodNames || periodNames.length === 0) return map;
  for (const pName of periodNames) {
    const roster = rosters.find((r) => r.name === pName);
    if (!roster?.students) continue;
    for (const s of roster.students) {
      if (s.pin && (s.firstName || s.lastName)) {
        const name = [s.firstName, s.lastName].filter(Boolean).join(' ');
        map[makePinKey(pName, s.pin)] = name;
        const stripped = s.pin.replace(/^0+/, '');
        if (stripped && stripped !== s.pin) {
          map[makePinKey(pName, stripped)] = name;
        }
      }
    }
  }
  return map;
}

/**
 * Build a (classPeriod, PIN) → student name lookup formatted for spreadsheet
 * export: "Last, First" when both names exist, just first or last name alone
 * otherwise. Keys are composite (see `PIN_KEY_SEP`); always look up via
 * `resolvePinName`.
 */
export function buildPinToExportNameMap(
  rosters: ClassRoster[],
  periodNames?: string[]
): Record<string, string> {
  const map: Record<string, string> = {};
  if (!periodNames || periodNames.length === 0) return map;
  for (const pName of periodNames) {
    const roster = rosters.find((r) => r.name === pName);
    if (!roster?.students) continue;
    for (const s of roster.students) {
      if (s.pin && (s.firstName || s.lastName)) {
        const name =
          s.lastName && s.firstName
            ? `${s.lastName}, ${s.firstName}`
            : s.lastName || s.firstName;
        map[makePinKey(pName, s.pin)] = name;
        const stripped = s.pin.replace(/^0+/, '');
        if (stripped && stripped !== s.pin) {
          map[makePinKey(pName, stripped)] = name;
        }
      }
    }
  }
  return map;
}

/**
 * Build scoreboard teams from quiz responses.
 *
 * `byStudentUid` (optional) supplies ClassLink names for SSO `studentRole`
 * joiners that have no `pin`. When omitted, SSO rows fall back to the
 * generic `Student` label (see `resolveResponseDisplayName`). For pin-mode
 * scoreboards SSO rows render their resolved name regardless of mode,
 * because the literal `PIN undefined` is never useful.
 */
export function buildScoreboardTeams(
  completedResponses: QuizResponse[],
  questions: QuizQuestion[],
  mode: 'pin' | 'name',
  pinToName: Record<string, string>,
  session?: QuizSession | null,
  byStudentUid?: Map<string, StudentName>
): ScoreboardTeam[] {
  return completedResponses
    .map((r) => ({
      response: r,
      score: getDisplayScore(r, questions, session),
    }))
    .sort((a, b) => b.score - a.score)
    .map(({ response, score }) => {
      const resolvedName = resolveResponseDisplayName(
        response,
        pinToName,
        byStudentUid
      );
      const pinModeName = response.pin ? `PIN ${response.pin}` : resolvedName;
      return {
        id: responseTeamId(response),
        name: mode === 'name' ? resolvedName : pinModeName,
        score,
        color:
          SCOREBOARD_COLORS[
            responseColorIndex(response, SCOREBOARD_COLORS.length)
          ],
      };
    });
}

/**
 * Build ranked leaderboard entries for student-facing live leaderboard views.
 *
 * Mirrors `buildScoreboardTeams` for SSO support: `byStudentUid` resolves
 * names for `studentRole` joiners. The leaderboard's `pin` field stays
 * optional in the entry type — students see `name` (or `Student` fallback).
 */
export function buildLiveLeaderboard(
  responses: QuizResponse[],
  questions: QuizQuestion[],
  session: QuizScoringSession,
  pinToName: Record<string, string>,
  byStudentUid?: Map<string, StudentName>
): QuizLeaderboardEntry[] {
  return responses
    .filter((response) => response.status !== 'joined')
    .map((response) => ({
      // `pin` is set only for anonymous joiners; SSO joiners use `studentUid`
      // for self-identification on the student-side leaderboard view.
      ...(response.pin ? { pin: response.pin } : {}),
      studentUid: response.studentUid,
      name: resolveResponseDisplayName(response, pinToName, byStudentUid),
      score: getDisplayScore(response, questions, session),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}
