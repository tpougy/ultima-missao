/**
 * Frontend-only password gates. Not real security (the passwords ship in the
 * client bundle) — just enough to keep bots/curious strangers out, per
 * QUICKSTART.md. Unlocked state persists in localStorage so people don't
 * have to re-enter the password every visit across a multi-day trip.
 */

function isUnlocked(storageKey: string): boolean {
  return localStorage.getItem(storageKey) === "true";
}

function unlock(storageKey: string): void {
  localStorage.setItem(storageKey, "true");
}

export const APP_GATE_KEY = "um_app_unlocked";
export const ADMIN_GATE_KEY = "um_admin_unlocked";

export function isAppUnlocked(): boolean {
  return isUnlocked(APP_GATE_KEY);
}

export function tryUnlockApp(password: string): boolean {
  if (password === import.meta.env.VITE_APP_PASSWORD) {
    unlock(APP_GATE_KEY);
    return true;
  }
  return false;
}

export function isAdminUnlocked(): boolean {
  return isUnlocked(ADMIN_GATE_KEY);
}

export function tryUnlockAdmin(password: string): boolean {
  if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
    unlock(ADMIN_GATE_KEY);
    return true;
  }
  return false;
}
