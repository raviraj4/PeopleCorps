const paths = {
  brand: <><path d="M12 3.6c2.6 0 4.7 2.1 4.7 4.7S14.6 13 12 13s-4.7-2.1-4.7-4.7S9.4 3.6 12 3.6Z" /><path d="M3.8 20.4c.8-3.1 3.9-5.2 8.2-5.2s7.4 2.1 8.2 5.2" /><path d="M4.2 8.4a3.1 3.1 0 0 0 0 6.1M19.8 8.4a3.1 3.1 0 0 1 0 6.1" /></>,
  dashboard: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.6" /><rect x="13.5" y="3.5" width="7" height="4" rx="1.4" /><rect x="13.5" y="10.5" width="7" height="10" rx="1.6" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.6" /></>,
  users: <><path d="M16 20v-1.5a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4V20" /><circle cx="10" cy="7.5" r="3.5" /><path d="M16 4.2a3.5 3.5 0 0 1 0 6.7M20 20v-1.5a4 4 0 0 0-2.8-3.8" /></>,
  roles: <><path d="M12 3 19 6v5.2c0 4.5-2.8 7.8-7 9.8-4.2-2-7-5.3-7-9.8V6l7-3Z" /><path d="m9 12 2 2 4-4" /></>,
  reports: <><path d="M4 19.5h16" /><path d="M6.5 16V10M12 16V5M17.5 16v-3.5" /><circle cx="6.5" cy="8" r="1" /><circle cx="12" cy="3.5" r="1" /><circle cx="17.5" cy="10.5" r="1" /></>,
  diversity: <><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5V12h8.5M12 12l-6 6M12 12l6 6" /></>,
  settings: <><path d="M4 6h7M15 6h5M4 12h3M11 12h9M4 18h9M17 18h3" /><circle cx="13" cy="6" r="2" /><circle cx="9" cy="12" r="2" /><circle cx="15" cy="18" r="2" /></>,
  profile: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  moon: <path d="M19.4 15.5A8 8 0 0 1 8.5 4.6 8.5 8.5 0 1 0 19.4 15.5Z" />,
  sun: <><circle cx="12" cy="12" r="3.6" /><path d="M12 2.5v2M12 19.5v2M4.7 4.7l1.4 1.4m11.8 11.8 1.4 1.4M2.5 12h2m15 0h2M4.7 19.3l1.4-1.4M17.9 6.1l1.4-1.4" /></>,
  people: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15 15a4.2 4.2 0 0 1 5.5 4" /></>,
  active: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.2 2.3 2.3 4.8-5" /></>,
  inactive: <><circle cx="12" cy="12" r="8.5" /><path d="m9 9 6 6m0-6-6 6" /></>,
  group: <><path d="M4 6.5h16M4 12h10M4 17.5h7" /><circle cx="18" cy="15.5" r="3" /><path d="M18 14v3m-1.5-1.5h3" /></>,
  add: <><path d="M12 5v14M5 12h14" /></>,
  search: <><circle cx="10.8" cy="10.8" r="6.3" /><path d="m15.5 15.5 4.2 4.2" /></>,
  edit: <><path d="m14 5 5 5M4 20l4.3-.8L19 8.5a2.1 2.1 0 0 0-3-3L5.3 16.2 4 20Z" /></>,
  trash: <><path d="M4.5 7h15M10 11v5m4-5v5M6.5 7l.8 13h9.4l.8-13M9 7V4.5h6V7" /></>,
  close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  arrow: <><path d="M4 12h15M13 6l6 6-6 6" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.8 9A7 7 0 0 1 18 6.5L20 12M4 12l2 5.5A7 7 0 0 0 18.2 15" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>
};

export default function Icon({ name, size = 18, className = '' }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.dashboard}</svg>;
}
