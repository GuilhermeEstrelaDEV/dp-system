import type { NavigationIcon as NavigationIconName } from './navigation';

interface NavigationIconProps {
  readonly name: NavigationIconName;
}

const iconPaths: Record<NavigationIconName, string> = {
  dashboard: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
  administration: 'M4 21V7l8-4 8 4v14M9 21v-6h6v6M8 9h.01M16 9h.01',
  structure: 'M12 3v6m0 0H6m6 0h6M6 9v6m12-6v6M3 21h6v-6H3v6Zm12 0h6v-6h-6v6Z',
  people: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m17-9a4 4 0 1 0 0-8m-7 7a4 4 0 1 0 0-8',
  admissions: 'M4 4h16v16H4V4Zm4 4h8m-8 4h5m4 0h.01M8 16h8',
  movements: 'M7 7h11l-3-3m3 3-3 3M17 17H6l3 3m-3-3 3-3',
  time: 'M12 8v4l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  benefits:
    'M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7m16 0V8a2 2 0 0 0-2-2h-3.5a2.5 2.5 0 0 0-5 0H6a2 2 0 0 0-2 2v4m16 0H4m8-6v6',
  payroll: 'M6 3h9l3 3v15H6V3Zm3 8h6m-6 4h6m-6-8h2',
  termination: 'M5 3v18m0-9h14m-4-4 4 4-4 4',
  documents: 'M6 3h9l3 3v15H6V3Zm3 9h6m-6 4h6m-6-8h2',
  reports: 'M4 20V10m5 10V4m5 16v-7m5 7V7',
};

export function NavigationIcon({ name }: NavigationIconProps) {
  return (
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24">
      <path
        d={iconPaths[name]}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
