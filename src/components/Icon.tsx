// Stroke icons used by the bottom nav and the push prompt (24×24, currentColor).
export const ICON_PATHS = {
  pool: 'M2 17c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M2 21c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5M8 14V5a2 2 0 0 1 4 0M16 14V5a2 2 0 0 0-4 0M8 9h8',
  gym: 'M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6',
  light: 'M12 21V5M12 5h6v3M8 21h8M16 11l2-3 2 3',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0',
  bellOff: 'M6 8a6 6 0 0 1 9.5-4.9M18 8c0 7 3 9 3 9H9M6 8c0 3.5-.8 5.8-1.7 7.2M10 21a2 2 0 0 0 4 0M3 3l18 18',
  report: 'M8 3h8l3 3v15H5V3h3M9 12h6M9 16h6M9 8h3',
  settings:
    'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  install: 'M8 2h8a2.5 2.5 0 0 1 2.5 2.5v15A2.5 2.5 0 0 1 16 22H8a2.5 2.5 0 0 1-2.5-2.5v-15A2.5 2.5 0 0 1 8 2M12 7v7M9 11l3 3 3-3M10.5 18.5h3',
} as const

export type IconName = keyof typeof ICON_PATHS

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
