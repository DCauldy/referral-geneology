"use client";

import { useState } from "react";
import { useReferralChain } from "@/lib/hooks/use-referrals";
import { Avatar } from "@/components/catalyst/avatar";
import { cn } from "@/lib/utils/cn";
import { getInitials, getFullName } from "@/lib/utils/format";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  UserIcon,
} from "@heroicons/react/20/solid";

interface ReferralChainViewProps {
  contactId: string;
  contactName?: string;
}

export function ReferralChainView({
  contactId,
  contactName,
}: ReferralChainViewProps) {
  const [direction, setDirection] = useState<"upstream" | "downstream">(
    "downstream"
  );

  const { chain, isLoading } = useReferralChain(contactId, direction);

  return (
    <div className="space-y-4">
      {/* Direction tabs */}
      <div className="flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
        <button
          onClick={() => setDirection("upstream")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            direction === "upstream"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          )}
        >
          <ArrowUpIcon className="h-4 w-4" />
          Upstream
        </button>
        <button
          onClick={() => setDirection("downstream")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            direction === "downstream"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          )}
        >
          <ArrowDownIcon className="h-4 w-4" />
          Downstream
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {direction === "upstream"
          ? "People who referred contacts leading to this person"
          : "People this contact has referred, directly or indirectly"}
      </p>

      {/* Chain visualization */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700"
                style={{ marginLeft: `${i * 24}px` }}
              />
              <div className="h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
          ))}
        </div>
      ) : chain.length === 0 ? (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
          <UserIcon className="mx-auto h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {direction === "upstream"
              ? "No upstream referral chain found"
              : "No downstream referrals found"}
          </p>
        </div>
      ) : (
        <div className="relative space-y-0">
          {/* Current contact marker (shown at the top for upstream, or as context) */}
          {direction === "upstream" && chain.length > 0 && (
            <>
              {/* The chain nodes */}
              {chain.map((node, index) => (
                <ChainNode
                  key={node.contact_id}
                  node={node}
                  index={index}
                  isCurrentContact={node.contact_id === contactId}
                  isLast={index === chain.length - 1}
                  direction={direction}
                />
              ))}
            </>
          )}

          {direction === "downstream" && (
            <>
              {/* Show the root contact at the top */}
              <div className="flex items-center gap-3 pb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 ring-2 ring-primary-500 dark:bg-primary-900/40 dark:text-primary-300 dark:ring-primary-400">
                  {contactName
                    ? contactName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {contactName || "Current Contact"}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400">
                    Root
                  </p>
                </div>
              </div>

              {/* Chain nodes */}
              {chain.map((node, index) => (
                <ChainNode
                  key={node.contact_id}
                  node={node}
                  index={index}
                  isCurrentContact={node.contact_id === contactId}
                  isLast={index === chain.length - 1}
                  direction={direction}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Chain stats */}
      {chain.length > 0 && (
        <div className="flex items-center gap-4 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Chain depth
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {Math.max(...chain.map((n) => n.depth))}
            </p>
          </div>
          <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700" />
          <div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              People in chain
            </p>
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {chain.length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ChainNode({
  node,
  index,
  isCurrentContact,
  isLast,
  direction,
}: {
  node: {
    contact_id: string;
    first_name: string;
    last_name: string | null;
    depth: number;
    path: string[];
  };
  index: number;
  isCurrentContact: boolean;
  isLast: boolean;
  direction: "upstream" | "downstream";
}) {
  const indentPx = node.depth * 24;
  const name = getFullName(node.first_name, node.last_name ?? undefined);
  const initials = getInitials(
    node.first_name,
    node.last_name ?? undefined
  );

  return (
    <div className="relative">
      {/* Connector line */}
      {!isLast && (
        <div
          className="absolute top-8 h-full w-px bg-zinc-200 dark:bg-zinc-700"
          style={{ left: `${indentPx + 16}px` }}
        />
      )}

      {/* Arrow connector from parent */}
      {index > 0 && (
        <div
          className="flex items-center py-1"
          style={{ paddingLeft: `${indentPx + 12}px` }}
        >
          <svg
            className="h-4 w-4 text-zinc-300 dark:text-zinc-600"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M8 2v8m0 0l-3-3m3 3l3-3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      <div
        className="flex items-center gap-3 py-1"
        style={{ paddingLeft: `${indentPx}px` }}
      >
        <Avatar
          initials={initials}
          size="xs"
          className={cn(
            isCurrentContact &&
              "ring-2 ring-primary-500 dark:ring-primary-400"
          )}
        />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm",
              isCurrentContact
                ? "font-semibold text-primary-700 dark:text-primary-300"
                : "font-medium text-zinc-900 dark:text-zinc-100"
            )}
          >
            {name}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Depth {node.depth}
            {isCurrentContact && " (current)"}
          </p>
        </div>
      </div>
    </div>
  );
}
