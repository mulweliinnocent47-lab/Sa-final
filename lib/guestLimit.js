// Guests get a few free AI messages, then must sign in.
// Stored in localStorage, so this is a UX gate, not a security boundary -
// enforce it inside the PROAI-PROCTICE edge function too (see notes).
export const GUEST_AI_LIMIT = 3;
const KEY = "studyhub_guest_ai_count";

export function getGuestAiCount() {
  try {
    return Number(localStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}

export function guestLimitReached() {
  return getGuestAiCount() >= GUEST_AI_LIMIT;
}

export function recordGuestAiUse() {
  try {
    localStorage.setItem(KEY, String(getGuestAiCount() + 1));
  } catch {
    // storage blocked (private mode) - nothing to record
  }
}
