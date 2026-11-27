import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { useTheme } from './context/ThemeContext.jsx';

const pages = ['Dashboard', 'User Management', 'Role Management', 'Reports', 'Settings', 'My Profile'];
function Shell() {
  const { theme, toggleTheme } = useTheme();
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">A</span><span>Access<span className="brand-light">Desk</span></span></div>
      <div className="nav-label">WORKSPACE</div><nav>{pages.map((page, i) => <Link className={`nav-item ${i === 0 ? 'selected' : ''}`} to={i === 0 ? '/' : `/${page.toLowerCase().replaceAll(' ', '-')}`} key={page}><span className="nav-icon">{['◫', '♙', '⚙', '▤', '☷', '○'][i]}</span>{page}</Link>)}</nav>
      <div className="sidebar-footer"><div className="avatar">AD</div><div><strong>Workspace</strong><small>Role management</small></div></div>
    </aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <b>Dashboard</b></div><div className="top-actions"><button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☀'}</button><div className="user-chip"><div className="avatar small">AD</div><span>Administrator</span><span className="chevron">⌄</span></div></div></header>
      <Routes><Route path="/" element={<Dashboard />} /><Route path="*" element={<PagePlaceholder />} /></Routes>
    </main>
  </div>;
}
function Dashboard() {
  return <div className="content"><div className="page-heading"><div><div className="eyebrow">OVERVIEW</div><h1>Dashboard</h1><p>Here’s what’s happening across your workspace today.</p></div><button className="primary-button">＋ <span>Invite user</span></button></div>
    <div className="stat-grid">{[['Total users', '—', 'Across all roles', '♙'], ['Active users', '—', 'Currently enabled', '●'], ['Inactive users', '—', 'Access suspended', '◌'], ['Total roles', '—', 'Permission groups', '⚙']].map(([label, value, note, icon]) => <section className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-note">{note}</div></section>)}</div>
    <div className="panel-grid"><section className="panel activity"><div className="panel-heading"><div><h2>Recent activity</h2><p>Latest changes in your workspace</p></div><button className="text-button">View all <span>→</span></button></div><div className="empty-state"><div className="empty-icon">◷</div><strong>Activity will appear here</strong><span>Once users and roles are managed, you’ll see updates in this space.</span></div></section><section className="panel roles-panel"><div className="panel-heading"><div><h2>Roles overview</h2><p>Users by assigned role</p></div><Link className="text-button" to="/role-management">Manage roles →</Link></div><div className="role-list">{[['Admin', 'ADM', 'var(--purple)'], ['Manager', 'MGR', 'var(--blue)'], ['Employee', 'EMP', 'var(--green)']].map(([name, code, color]) => <div className="role-row" key={name}><span className="role-badge" style={{ color, background: `color-mix(in srgb, ${color} 11%, transparent)` }}>{code}</span><span className="role-name">{name}</span><span className="role-count">— users</span><span className="row-arrow">›</span></div>)}</div><div className="role-footer"><span>Permissions are configurable</span><span>↗</span></div></section></div>
  </div>;
}
function PagePlaceholder() { return <div className="content"><div className="page-heading"><div><div className="eyebrow">WORKSPACE</div><h1>Module setup</h1><p>This page will be wired to role-based access and its API.</p></div></div></div>; }
export default function App() { return <Routes><Route path="/login" element={<Login />} /><Route path="/*" element={<Shell />} /></Routes>; }
function Login() { const { theme, toggleTheme } = useTheme(); return <main className="login-page"><button className="icon-button login-theme" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'light' ? '☾' : '☀'}</button><div className="login-card"><div className="brand login-brand"><span className="brand-mark">A</span><span>Access<span className="brand-light">Desk</span></span></div><h1>Welcome back</h1><p>Sign in to continue to your workspace.</p><form onSubmit={(e) => e.preventDefault()}><label>Email address<input type="email" placeholder="you@company.com" autoComplete="username" /></label><label>Password<input type="password" placeholder="Enter your password" autoComplete="current-password" /></label><button className="primary-button login-submit">Sign in <span>→</span></button></form><div className="login-caption">Secure access to your organization</div></div><div className="login-copyright">© 2026 AccessDesk <span>·</span> Role-based access management</div></main>; }
