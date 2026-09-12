// @ts-nocheck
/**
 * Sign-out sequencing logic, extracted for testability.
 * 
 * Handles the different sign-out flows for live preview vs deployed environments.
 */

/**
 * Run pre-sign-in sign-out to clear any existing session.
 * Bounded timeout so the sign-in popup doesn't hang.
 */
export async function runPreSignInSignOut({
  livePreview,
  hasBearer,
  requestSignOut,
  clearToken,
}) {
  if (livePreview) {
    // Preview: local token is the only session state, clear it immediately
    if (hasBearer) {
      clearToken();
      // Still attempt server sign-out but don't wait long
      try {
        await Promise.race([
          requestSignOut(),
          new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500)),
        ]);
      } catch {
        // Timeout or error is fine — the token clear is what matters
      }
    }
  } else {
    // Deployed: session is an HttpOnly cookie only the server can clear
    // No timeout — if this hangs, the popup hangs, which is better than
    // starting OAuth with the old session still active
    try {
      await requestSignOut();
    } catch {
      // Sign-out failed but continue anyway — better to attempt the new sign-in
    }
  }
}

/**
 * Run full sign-out and redirect.
 * Rejects if deployed and server sign-out fails (session is still active).
 */
export async function runSignOut({
  livePreview,
  hasBearer,
  requestSignOut,
  clearToken,
  redirect,
}) {
  if (livePreview) {
    // Preview: local token clear is sufficient
    if (hasBearer) clearToken();
    try {
      await Promise.race([
        requestSignOut(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1500)),
      ]);
    } catch {
      // Timeout or error is fine — token is cleared
    }
    redirect();
  } else {
    // Deployed: must wait for server confirmation
    await requestSignOut(); // Rejects on error
    redirect();
  }
}
