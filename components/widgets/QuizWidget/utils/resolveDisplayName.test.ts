import { describe, it, expect } from 'vitest';

import {
  resolveResponseDisplayName,
  UNKNOWN_STUDENT_LABEL,
} from './resolveDisplayName';
import { buildPinToNameMap } from './quizScoreboard';
import {
  formatStudentName,
  type StudentName,
} from '@/hooks/useAssignmentPseudonyms';
import type { ClassRoster, QuizResponse } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeRoster(
  name: string,
  students: { firstName: string; lastName: string; pin: string }[]
): ClassRoster {
  return {
    id: `roster-${name}`,
    name,
    driveFileId: null,
    studentCount: students.length,
    createdAt: Date.now(),
    students: students.map((s) => ({
      id: `student-${s.pin}`,
      ...s,
    })),
  };
}

function makeResponse(overrides: Partial<QuizResponse> = {}): QuizResponse {
  return {
    studentUid: 'uid-default',
    pin: '01',
    joinedAt: Date.now(),
    status: 'completed',
    answers: [],
    score: null,
    submittedAt: Date.now(),
    ...overrides,
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('resolveResponseDisplayName', () => {
  it('returns the formatted ClassLink name for SSO students and ignores PIN', () => {
    const ssoStudent: StudentName = {
      givenName: 'Ada',
      familyName: 'Lovelace',
    };
    const byStudentUid = new Map<string, StudentName>([
      ['sso-uid-1', ssoStudent],
    ]);
    // The roster name at PIN '01' must NOT win — SSO is tier 1.
    const pinToName = buildPinToNameMap(
      [
        makeRoster('Period 1', [
          { firstName: 'Wrong', lastName: 'Person', pin: '01' },
        ]),
      ],
      ['Period 1']
    );
    const response = makeResponse({
      studentUid: 'sso-uid-1',
      pin: '01',
      classPeriod: 'Period 1',
    });

    expect(resolveResponseDisplayName(response, pinToName, byStudentUid)).toBe(
      formatStudentName(ssoStudent)
    );
  });

  it('resolves a pin-mode response by composite (classPeriod, pin) without cross-resolving rosters', () => {
    // Two rosters, same PIN '01' in each. The period-scoped lookup must
    // disambiguate so each Period's PIN 01 resolves to the right student.
    const rosters = [
      makeRoster('Period 1', [
        { firstName: 'Alice', lastName: 'Smith', pin: '01' },
      ]),
      makeRoster('Period 2', [
        { firstName: 'Bob', lastName: 'Jones', pin: '01' },
      ]),
    ];
    const pinToName = buildPinToNameMap(rosters, ['Period 1', 'Period 2']);

    const period1Response = makeResponse({
      studentUid: 'anon-1',
      pin: '01',
      classPeriod: 'Period 1',
    });
    const period2Response = makeResponse({
      studentUid: 'anon-2',
      pin: '01',
      classPeriod: 'Period 2',
    });

    expect(
      resolveResponseDisplayName(period1Response, pinToName, new Map())
    ).toBe('Alice Smith');
    expect(
      resolveResponseDisplayName(period2Response, pinToName, new Map())
    ).toBe('Bob Jones');
  });

  it('falls through resolvePinName legacy suffix scan when classPeriod is missing', () => {
    // Pre-period-scoping responses have no classPeriod. The legacy tier
    // returns the first matching roster's name so those rows still display.
    const pinToName = buildPinToNameMap(
      [
        makeRoster('Period 1', [
          { firstName: 'Alice', lastName: 'Smith', pin: '01' },
        ]),
      ],
      ['Period 1']
    );
    const response = makeResponse({
      studentUid: 'anon-legacy',
      pin: '01',
      classPeriod: undefined,
    });

    expect(resolveResponseDisplayName(response, pinToName, new Map())).toBe(
      'Alice Smith'
    );
  });

  it('returns the literal "PIN <n>" fallback when the PIN does not match any roster', () => {
    const pinToName = buildPinToNameMap(
      [
        makeRoster('Period 1', [
          { firstName: 'Alice', lastName: 'Smith', pin: '01' },
        ]),
      ],
      ['Period 1']
    );
    const response = makeResponse({
      studentUid: 'anon-mystery',
      pin: '99',
      classPeriod: 'Period 1',
    });

    expect(resolveResponseDisplayName(response, pinToName, new Map())).toBe(
      'PIN 99'
    );
  });

  it('returns UNKNOWN_STUDENT_LABEL when no SSO name resolves and the response has no pin', () => {
    const pinToName = buildPinToNameMap(
      [
        makeRoster('Period 1', [
          { firstName: 'Alice', lastName: 'Smith', pin: '01' },
        ]),
      ],
      ['Period 1']
    );
    const response = makeResponse({
      studentUid: 'sso-uid-unsynced',
      pin: undefined,
    });

    expect(resolveResponseDisplayName(response, pinToName, new Map())).toBe(
      UNKNOWN_STUDENT_LABEL
    );
  });
});
