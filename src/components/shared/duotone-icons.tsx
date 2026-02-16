/**
 * Duotone achievement icons following brand identity:
 *   Stroke: 1.8px, primary-600 (#284a2e)
 *   Fill:   primary-100 (#e0e9df)
 *   Accent: primary-500 (#2f5435)
 */

const D = {
  fill: "#e0e9df",
  stroke: "#284a2e",
  accent: "#2f5435",
};

export const DUOTONE_ICONS: Record<string, React.ReactElement> = {
  UserPlusIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="8" r="3.5" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <path d="M3.5 21v-.5a6.5 6.5 0 0113 0v.5" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="20" y1="8" x2="20" y2="14" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="17" y1="11" x2="23" y2="11" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
  BuildingOffice2Icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="1.5" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <circle cx="9" cy="8" r="1" fill={D.accent} />
      <circle cx="15" cy="8" r="1" fill={D.accent} />
      <circle cx="9" cy="12" r="1" fill={D.accent} />
      <circle cx="15" cy="12" r="1" fill={D.accent} />
      <rect x="10" y="16" width="4" height="5" rx="0.5" fill={D.accent} />
    </svg>
  ),
  CurrencyDollarIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <line x1="12" y1="6" x2="12" y2="18" stroke={D.accent} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.5 9.5c0-1.1 1.1-2 2.5-2s2.5.9 2.5 2-1.1 1.5-2.5 2-2.5.9-2.5 2 1.1 2 2.5 2 2.5-.9 2.5-2" stroke={D.stroke} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  ArrowsRightLeftIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="5" width="20" height="14" rx="2" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <path d="M7 9l-3 3 3 3" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M17 9l3 3-3 3" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="4" y1="12" x2="20" y2="12" stroke={D.accent} strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    </svg>
  ),
  SparklesIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="19" cy="5" r="1.5" fill={D.accent} />
      <circle cx="5" cy="19" r="1" fill={D.accent} />
    </svg>
  ),
  UsersIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="8" r="3.5" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <path d="M2 21v-.5a7 7 0 0114 0v.5" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="17" cy="7" r="2.5" fill={D.fill} stroke={D.stroke} strokeWidth="1.5" />
      <path d="M22 21v-.5a5 5 0 00-5-4.5" stroke={D.stroke} strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  CheckCircleIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <path d="M8 12.5l2.5 2.5 5-5" stroke={D.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  ChartBarIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <rect x="6" y="13" width="3" height="5" rx="0.5" fill={D.accent} />
      <rect x="10.5" y="9" width="3" height="9" rx="0.5" fill={D.accent} />
      <rect x="15" y="11" width="3" height="7" rx="0.5" fill={D.accent} />
    </svg>
  ),
  ArrowUpTrayIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="10" rx="2" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <path d="M12 16V5" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 8.5L12 5l3.5 3.5" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  ArrowDownTrayIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="11" width="18" height="10" rx="2" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <path d="M12 3v11" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8.5 10.5L12 14l3.5-3.5" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  ShieldCheckIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 3l8 4v5c0 5.5-3.8 9.7-8 11-4.2-1.3-8-5.5-8-11V7l8-4z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M9 12.5l2 2 4-4" stroke={D.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  DocumentTextIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="2" width="14" height="20" rx="1.5" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <line x1="8" y1="7" x2="16" y2="7" stroke={D.accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="11" x2="16" y2="11" stroke={D.accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="15" x2="13" y2="15" stroke={D.accent} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  BoltIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  TrophyIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M8 3h8v8a4 4 0 01-8 0V3z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <path d="M8 5H5.5a1 1 0 00-1 1v1a3 3 0 003 3H8" stroke={D.stroke} strokeWidth="1.5" fill="none" />
      <path d="M16 5h2.5a1 1 0 011 1v1a3 3 0 01-3 3H16" stroke={D.stroke} strokeWidth="1.5" fill="none" />
      <line x1="12" y1="15" x2="12" y2="18" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="8" y="18" width="8" height="2.5" rx="1" fill={D.accent} stroke={D.stroke} strokeWidth="1.2" />
    </svg>
  ),
  FireIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2c0 4-6 6-6 12a6 6 0 0012 0c0-6-6-8-6-12z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M12 22a3 3 0 003-3c0-3-3-4-3-6 0 2-3 3-3 6a3 3 0 003 3z" fill={D.accent} opacity="0.3" />
    </svg>
  ),
  StarIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  LockClosedIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="10" rx="2" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 018 0v3" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="16" r="1.5" fill={D.accent} />
    </svg>
  ),
  ArrowTrendingUpIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="3" width="20" height="18" rx="2" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <polyline points="5 16 9 11 13 14 19 7" stroke={D.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="15 7 19 7 19 11" stroke={D.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  PaperAirplaneIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3.5 3.5l17 8.5-17 8.5V14l11-2-11-2V3.5z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="8" y1="12" x2="14.5" y2="12" stroke={D.accent} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  InboxIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M3 14h4.5l2 3h5l2-3H21v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M3 14V5a2 2 0 012-2h14a2 2 0 012 2v9" stroke={D.stroke} strokeWidth="1.8" fill="none" />
      <line x1="9" y1="8" x2="15" y2="8" stroke={D.accent} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="11" x2="13" y2="11" stroke={D.accent} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  MapPinIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" fill={D.accent} />
    </svg>
  ),
  CalendarIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="5" width="18" height="16" rx="2" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <line x1="3" y1="10" x2="21" y2="10" stroke={D.stroke} strokeWidth="1.5" />
      <line x1="8" y1="3" x2="8" y2="7" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="7" stroke={D.stroke} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="8" cy="14" r="1" fill={D.accent} />
      <circle cx="12" cy="14" r="1" fill={D.accent} />
      <circle cx="16" cy="14" r="1" fill={D.accent} />
      <circle cx="8" cy="18" r="1" fill={D.accent} />
      <circle cx="12" cy="18" r="1" fill={D.accent} />
    </svg>
  ),
  HeartIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  ),
  TagIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M2 4.5A1.5 1.5 0 013.5 3h7.09a1.5 1.5 0 011.06.44l8.91 8.91a1.5 1.5 0 010 2.12l-7.09 7.09a1.5 1.5 0 01-2.12 0L2.44 12.65A1.5 1.5 0 012 11.59V4.5z" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="7" cy="8" r="1.5" fill={D.accent} />
    </svg>
  ),
  GlobeAltIcon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill={D.fill} stroke={D.stroke} strokeWidth="1.8" />
      <ellipse cx="12" cy="12" rx="4" ry="9" stroke={D.stroke} strokeWidth="1.2" fill="none" />
      <line x1="3" y1="12" x2="21" y2="12" stroke={D.accent} strokeWidth="1.2" />
      <path d="M4.5 7.5h15" stroke={D.accent} strokeWidth="0.8" opacity="0.6" />
      <path d="M4.5 16.5h15" stroke={D.accent} strokeWidth="0.8" opacity="0.6" />
    </svg>
  ),
};
