import { useEffect, useRef } from "react";
import type { Session } from "../model/session";
import { scheduleRateLimitsAutoRefresh } from "../../providers/model/rateLimitsCache";
import type { RateLimitProvider } from "../../providers/model/rateLimits";

function isRateLimitHarness(harness: string): harness is RateLimitProvider {
  return (
    harness === "claude" ||
    harness === "codex" ||
    harness === "opencode" ||
    harness === "devin"
  );
}

/**
 * Automatically triggers a debounced rate-limit refresh whenever an agent turn
 * finishes (i.e. a session transitions from busy to not busy). Clustered
 * turns for the same provider and account share a single refresh request.
 */
export function useTurnRateLimitsRefresh(
  sessions: Session[],
  busySessionIds: ReadonlySet<string>,
): void {
  const previousBusyRef = useRef(busySessionIds);

  useEffect(() => {
    const previous = previousBusyRef.current;
    if (previous !== busySessionIds) {
      for (const id of previous) {
        if (!busySessionIds.has(id)) {
          const session = sessions.find((s) => s.id === id);
          if (session && isRateLimitHarness(session.harness)) {
            scheduleRateLimitsAutoRefresh(
              session.harness,
              session.providerAccountId ?? "default",
            );
          }
        }
      }
      previousBusyRef.current = busySessionIds;
    }
  }, [busySessionIds, sessions]);
}
