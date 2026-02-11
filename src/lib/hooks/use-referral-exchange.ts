"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReferralExchange } from "@/types/database";

interface UseReferralExchangeOptions {
  direction: "sent" | "received";
  status?: string;
  page?: number;
  pageSize?: number;
}

export function useReferralExchange(options: UseReferralExchangeOptions) {
  const { direction, status, page = 0, pageSize = 25 } = options;
  const [exchanges, setExchanges] = useState<ReferralExchange[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExchanges = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        direction,
        page: String(page),
        pageSize: String(pageSize),
      });
      if (status) params.set("status", status);

      const res = await fetch(`/api/referrals/exchange?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch exchanges");
        return;
      }

      setExchanges(data.exchanges || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch exchanges"
      );
    } finally {
      setIsLoading(false);
    }
  }, [direction, status, page, pageSize]);

  useEffect(() => {
    fetchExchanges();
  }, [fetchExchanges]);

  return { exchanges, totalCount, isLoading, error, refresh: fetchExchanges };
}

export function useExchangeActions() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sendExchange = useCallback(
    async (payload: {
      receiver_email: string;
      contact_snapshot: {
        first_name: string;
        last_name?: string | null;
        company_name?: string | null;
        email?: string | null;
        phone?: string | null;
        industry?: string | null;
      };
      context_note?: string;
      source_contact_id?: string;
    }) => {
      setIsSubmitting(true);
      try {
        const res = await fetch("/api/referrals/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send exchange");
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const acceptExchange = useCallback(async (exchangeId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/referrals/exchange/${exchangeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept exchange");
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const declineExchange = useCallback(async (exchangeId: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/referrals/exchange/${exchangeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to decline exchange");
      return data;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const updateReceiverStatus = useCallback(
    async (
      exchangeId: string,
      receiver_status: string,
      receiver_status_visible: boolean
    ) => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/referrals/exchange/${exchangeId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update_status",
            receiver_status,
            receiver_status_visible,
          }),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to update exchange status");
        return data;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    sendExchange,
    acceptExchange,
    declineExchange,
    updateReceiverStatus,
    isSubmitting,
  };
}
