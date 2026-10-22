import React from 'react';

function Svg({ children, className = 'w-5 h-5', strokeWidth = 1.8, ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconUser = (p) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></Svg>
);

export const IconBuilding = (p) => (
  <Svg {...p}><path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16" /><path d="M15 9h3a2 2 0 0 1 2 2v10" /><path d="M2 21h20" /><path d="M8 7h3M8 11h3M8 15h3" /></Svg>
);

export const IconTarget = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Svg>
);

export const IconRobot = (p) => (
  <Svg {...p}><rect x="4" y="8" width="16" height="11" rx="3" /><path d="M12 4v4" /><circle cx="12" cy="3" r="1" /><path d="M9 13h.01M15 13h.01" /><path d="M9.5 16.5h5" /><path d="M2 12v3M22 12v3" /></Svg>
);

export const IconAccessibility = (p) => (
  <Svg {...p}><circle cx="12" cy="4" r="1.6" /><path d="M5 8.5c2.2.8 4.5 1.2 7 1.2s4.8-.4 7-1.2" /><path d="M12 9.7V15" /><path d="M12 15l-3 6M12 15l3 6" /><path d="M12 15H9.5" /></Svg>
);

export const IconBriefcase = (p) => (
  <Svg {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></Svg>
);

export const IconClock = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
);

export const IconMapPin = (p) => (
  <Svg {...p}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" /></Svg>
);

export const IconWallet = (p) => (
  <Svg {...p}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M16 12h.01" /><path d="M3 9h18" /><path d="M6 6V5a1 1 0 0 1 1-1h8" /></Svg>
);

export const IconMail = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
);

export const IconInbox = (p) => (
  <Svg {...p}><path d="M3 13h4l2 3h6l2-3h4" /><path d="M5 5h14l2 8v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4l2-8Z" /></Svg>
);

export const IconUsers = (p) => (
  <Svg {...p}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><path d="M16 5.5a3 3 0 0 1 0 5.8" /><path d="M18 14.5c2 .8 3 2.7 3 5" /></Svg>
);

export const IconSearch = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
);

export const IconCheck = (p) => (
  <Svg {...p}><path d="m4.5 12.5 5 5 10-11" /></Svg>
);

export const IconAlert = (p) => (
  <Svg {...p}><path d="M12 3 2.8 19.2A1 1 0 0 0 3.7 20.7h16.6a1 1 0 0 0 .9-1.5L12 3Z" /><path d="M12 9v5" /><path d="M12 17.5h.01" /></Svg>
);

export const IconInfo = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></Svg>
);

export const IconArrowRight = (p) => (
  <Svg {...p}><path d="M4 12h16" /><path d="m14 6 6 6-6 6" /></Svg>
);

export const IconArrowLeft = (p) => (
  <Svg {...p}><path d="M20 12H4" /><path d="m10 18-6-6 6-6" /></Svg>
);

export const IconSpeaker = (p) => (
  <Svg {...p}><path d="M11 5 6.5 9H3v6h3.5L11 19V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></Svg>
);

export const IconMic = (p) => (
  <Svg {...p}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" /><path d="M12 18v3" /><path d="M9 21h6" /></Svg>
);

export const IconContrast = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 3v18a9 9 0 0 0 0-18Z" fill="currentColor" stroke="none" /></Svg>
);

export const IconPause = (p) => (
  <Svg {...p}><rect x="7" y="5" width="3.5" height="14" rx="1" /><rect x="13.5" y="5" width="3.5" height="14" rx="1" /></Svg>
);

export const IconClipboard = (p) => (
  <Svg {...p}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M9 10h6M9 14h6M9 18h3" /></Svg>
);

export const IconPlus = (p) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
);

export const IconDocument = (p) => (
  <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h4" /></Svg>
);

export const IconSparkles = (p) => (
  <Svg {...p}><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3Z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z" /></Svg>
);

export const IconShield = (p) => (
  <Svg {...p}><path d="M12 3 5 6v6c0 4.5 3 7.6 7 9 4-1.4 7-4.5 7-9V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
);

export const IconBookOpen = (p) => (
  <Svg {...p}><path d="M12 6c-1.8-1.5-4-2.2-7-2.2v14c3 0 5.2.7 7 2.2 1.8-1.5 4-2.2 7-2.2v-14c-3 0-5.2.7-7 2.2Z" /><path d="M12 6v14" /></Svg>
);

export const IconCalendar = (p) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></Svg>
);

export const IconStar = (p) => (
  <Svg {...p}><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" /></Svg>
);

export const IconLock = (p) => (
  <Svg {...p}><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /><path d="M12 14v3" /></Svg>
);

export const IconBell = (p) => (
  <Svg {...p}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 20a2 2 0 0 0 4 0" /></Svg>
);

export const IconEdit = (p) => (
  <Svg {...p}><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="m14 7 3 3" /></Svg>
);

export const IconX = (p) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
);

export const IconBadgeCheck = (p) => (
  <Svg {...p}><path d="m12 3 2.2 1.6 2.7-.2 1 2.5 2.3 1.4-.7 2.6.7 2.6-2.3 1.4-1 2.5-2.7-.2L12 21l-2.2-1.6-2.7.2-1-2.5-2.3-1.4.7-2.6-.7-2.6 2.3-1.4 1-2.5 2.7.2L12 3Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
