/**
 * Phase 1 stub — CrewLedger JSON string registry removed.
 * Rebuild via scripts/generate-strings-registry.mjs when new product strings exist.
 */

import type { Locale } from './locale';

export type StringRegistryKey = string;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Strings = Record<string, any>;

const EMPTY: Strings = {};

export function getRegistryStrings(key: StringRegistryKey, locale?: Locale): Strings {
  void key;
  void locale;
  return EMPTY;
}

export function hasRegistryKey(key: StringRegistryKey): boolean {
  void key;
  return false;
}
