"use client";

import { useEffect, useState } from "react";

interface ImpersonationState {
  isImpersonating: boolean;
  impersonatedUserId: string | null;
  orgName: string | null;
  originalOrgId: string | null;
}

const defaultState: ImpersonationState = {
  isImpersonating: false,
  impersonatedUserId: null,
  orgName: null,
  originalOrgId: null,
};

export function useImpersonation(): ImpersonationState {
  const [state, setState] = useState<ImpersonationState>(defaultState);

  useEffect(() => {
    const stored = localStorage.getItem("impersonating_org");
    if (!stored) {
      setState(defaultState);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setState({
        isImpersonating: true,
        impersonatedUserId: parsed.userId ?? null,
        orgName: parsed.orgName ?? null,
        originalOrgId: parsed.originalOrgId ?? null,
      });
    } catch {
      setState(defaultState);
    }
  }, []);

  return state;
}
