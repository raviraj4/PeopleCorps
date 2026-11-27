import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api, hasPermission } from './api.js';
import { useAuth } from './context/AuthContext.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import Icon from './components/Icon.jsx';

const navigation = [
  { label: 'Dashboard', path: '/', module: 'dashboard', icon: 'dashboard' },
  { label: 'User Management', path: '/user-management', module: 'users', icon: 'users' },
  { label: 'Role Management', path: '/role-management', module: 'roles', icon: 'roles' },
  { label: 'Reports', path: '/reports', module: 'reports', icon: 'reports' },
  { label: 'Diversity', path: '/diversity', module: 'reports', icon: 'diversity' },
  { label: 'Settings', path: '/settings', module: 'settings', icon: 'settings' },
  { label: 'My Profile', path: '/my-profile', module: 'profile', icon: 'profile' }
];

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-screen"><CircleLoader label="Loading your workspace" /></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />;
}

function ModuleRoute({ module, children }) {
  const { user } = useAuth();
  return hasPermission(user, module, 'view') ? children : <AccessDenied />;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<ProtectedRoute />}>
      <Route element={<Shell />}>
        <Route index element={<ModuleRoute module="dashboard"><Dashboard /></ModuleRoute>} />
        <Route path="user-management" element={<ModuleRoute module="users"><UsersPage /></ModuleRoute>} />
        <Route path="role-management" element={<ModuleRoute module="roles"><RolesPage /></ModuleRoute>} />
        <Route path="reports" element={<ModuleRoute module="reports"><ReportsPage /></ModuleRoute>} />
        <Route path="diversity" element={<ModuleRoute module="reports"><DiversityPage /></ModuleRoute>} />
        <Route path="settings" element={<ModuleRoute module="settings"><SettingsPage /></ModuleRoute>} />
        <Route path="my-profile" element={<ModuleRoute module="profile"><ProfilePage /></ModuleRoute>} />
        <Route path="*" element={<AccessDenied />} />
      </Route>
    </Route>
  </Routes>;
}

function Shell() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const current = navigation.find((item) => item.path === location.pathname) || navigation[0];
  const visibleLinks = navigation.filter((item) => hasPermission(user, item.module, 'view'));
  async function signOut() { await logout(); navigate('/login', { replace: true }); }
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
      <Link className="brand" to="/" onClick={() => setMobileNavOpen(false)}><span className="brand-mark"><Icon name="brand" size={20} /></span><span>People<span className="brand-light">Corps</span></span></Link>
      <div className="nav-label">WORKSPACE</div>
      <nav>{visibleLinks.map((item) => <Link className={`nav-item ${current.path === item.path ? 'selected' : ''}`} to={item.path} key={item.path} onClick={() => setMobileNavOpen(false)}><Icon className="nav-icon" name={item.icon} size={18} />{item.label}</Link>)}</nav>
      <button className="sidebar-footer account-button" onClick={() => { setMobileNavOpen(false); navigate('/my-profile'); }}><div className="avatar">{initials(user?.name)}</div><div><strong>{user?.name}</strong><small>{user?.role?.name || 'Member'}</small></div><Icon className="account-chevron" name="arrow" size={15} /></button>
    </aside>
    <button className={`mobile-nav-backdrop ${mobileNavOpen ? 'visible' : ''}`} aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} tabIndex={mobileNavOpen ? 0 : -1} />
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu-button" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><Icon name="menu" size={19} /></button><div className="breadcrumb">PeopleCorps <span>/</span> <b>{current.label}</b></div><div className="top-actions"><button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} /><span>{theme === 'light' ? 'Dark' : 'Light'}</span></button><button className="text-button" onClick={signOut}>Sign out</button></div></header>
      <Outlet />
    </main>
  </div>;
}

function PageHeading({ eyebrow = 'WORKSPACE', title, description, action }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}

function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api('/dashboard').then((summary) => setStats(summary.data)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  const cards = [['Total users', stats?.totalUsers, 'Across all roles', 'people'], ['Active users', stats?.activeUsers, 'Currently enabled', 'active'], ['Inactive users', stats?.inactiveUsers, 'Access suspended', 'inactive'], ['Total roles', stats?.totalRoles, 'Permission groups', 'roles']];
  return <div className="content">
    <PageHeading eyebrow="OVERVIEW" title="Dashboard" description="A snapshot of people and access across your workspace." action={hasPermission(user, 'users', 'view') && <Link className="primary-button" to="/user-management">Manage users</Link>} />
    {error && <Notice tone="error">{error}</Notice>}
    <div className="stat-grid">{cards.map(([label, value, note, icon]) => <section className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon name={icon} size={17} /></span></div><div className="stat-value">{loading ? <CircleLoader label={`Loading ${label.toLowerCase()}`} compact /> : error ? 'Unavailable' : value ?? '0'}</div><div className="stat-note">{note}</div></section>)}</div>
    <div className="panel-grid"><section className="panel"><div className="panel-heading"><div><h2>Workspace access</h2><p>Default role groups</p></div>{hasPermission(user, 'roles', 'view') && <Link className="text-button" to="/role-management">Manage roles</Link>}</div><div className="role-list">{loading ? <CircleLoader label="Loading roles" /> : (stats?.roles || []).map((role) => <div className="role-row" key={role.id}><span className="role-badge"><Icon name="roles" size={16} /></span><span className="role-name">{role.name}</span><span className="role-count">{role.userCount} users</span></div>)}{!loading && !error && !stats?.roles?.length && <div className="empty-cell">No roles yet.</div>}</div></section><section className="panel"><div className="panel-heading"><div><h2>Getting started</h2><p>Manage your PeopleCorps workspace</p></div></div><div className="quick-links">{hasPermission(user, 'users', 'view') && <Link to="/user-management">Add or update people <Icon name="arrow" size={15} /></Link>}{hasPermission(user, 'roles', 'view') && <Link to="/role-management">Review module permissions <Icon name="arrow" size={15} /></Link>}{hasPermission(user, 'reports', 'view') && <Link to="/diversity">Explore workforce diversity <Icon name="arrow" size={15} /></Link>}</div></section></div>
  </div>;
}

function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const canCreate = hasPermission(currentUser, 'users', 'create');
  const canEdit = hasPermission(currentUser, 'users', 'edit');
  const canDelete = hasPermission(currentUser, 'users', 'delete');
  const load = useCallback(async () => {
    setLoading(true);
    setLoadFailed(false);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (activeFilter) params.set('active', activeFilter);
    try {
      const response = await api(`/users?${params}`);
      setUsers(response.data); setPagination(response.pagination); setError('');
    } catch (e) { setError(e.message); setLoadFailed(true); }
    finally { setLoading(false); }
  }, [page, search, roleFilter, activeFilter]);
  useEffect(() => { api('/roles/options').then((response) => setRoles(response.data)).catch((e) => setError(e.message)); }, []);
  useEffect(() => { load(); }, [load]);
  function submitSearch(event) { event.preventDefault(); setPage(1); setSearch(query.trim()); }
  async function removeUser(target) {
    if (!window.confirm(`Delete ${target.name}? This cannot be undone.`)) return;
    try { await api(`/users/${target._id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  }
  async function saveUser(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    body.isActive = form.get('isActive') === 'on';
    if (!body.password) delete body.password;
    try {
      await api(editing?._id ? `/users/${editing._id}` : '/users', { method: editing?._id ? 'PATCH' : 'POST', body });
      setEditing(null); load();
    } catch (e) { setError(e.message); }
  }
  return <div className="content">
    <PageHeading title="User management" description="Search, filter, and manage workspace accounts." action={canCreate && <button className="primary-button icon-action" onClick={() => setEditing({})}><Icon name="add" size={16} />Add user</button>} />
    {error && <Notice tone="error">{error}</Notice>}
    <section className="panel data-panel">
      <form className="filter-bar" onSubmit={submitSearch}><input aria-label="Search users" placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="secondary-button">Search</button><select aria-label="Filter by role" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}><option value="">All roles</option>{roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</select><select aria-label="Filter by status" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select></form>
      <div className="table-wrap"><table><thead><tr><th>USER ID</th><th>PERSON</th><th>GENDER</th><th>ROLE</th><th>STATUS</th><th>ADDED</th><th>ACTIONS</th></tr></thead><tbody>{!loading && !loadFailed && users.map((person) => <tr key={person._id}><td><code className="user-id" title={person._id}>{person._id}</code></td><td><div className="person-cell"><div className="avatar">{initials(person.name)}</div><div><strong>{person.name}</strong><small>{person.email}</small></div></div></td><td>{genderLabel(person.gender)}</td><td>{person.role?.name || 'Unassigned'}</td><td><span className={`status-pill ${person.isActive ? 'active' : 'inactive'}`}>{person.isActive ? 'Active' : 'Inactive'}</span></td><td>{new Date(person.createdAt).toLocaleDateString()}</td><td><div className="row-actions">{canEdit && <button className="small-button" onClick={() => setEditing(person)}><Icon name="edit" size={14} />Edit</button>}{canDelete && <button className="small-button danger" onClick={() => removeUser(person)}><Icon name="trash" size={14} />Delete</button>}</div></td></tr>)}{loading && <tr><td colSpan="7"><CircleLoader label="Loading users" /></td></tr>}{!loading && loadFailed && <tr><td colSpan="7" className="empty-cell">Could not load users. Check your connection and try again.</td></tr>}{!loading && !loadFailed && users.length === 0 && <tr><td colSpan="7" className="empty-cell">No users match those filters.</td></tr>}</tbody></table></div>
      <div className="pagination">{loading ? <CircleLoader label="Loading user count" compact /> : loadFailed ? <span>Unable to load user count</span> : <span>Showing {pagination.total ? (page - 1) * 10 + 1 : 0}-{Math.min(page * 10, pagination.total)} of {pagination.total} users</span>}<div><button className="secondary-button" disabled={loading || page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button><span>Page {page} of {Math.max(pagination.totalPages, 1)}</span><button className="secondary-button" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
    </section>
    {editing && <Modal title={editing._id ? 'Edit user' : 'Add user'} onClose={() => setEditing(null)}><form className="form-grid" onSubmit={saveUser}><label>Full name<input name="name" required defaultValue={editing.name || ''} /></label><label>Email address<input name="email" type="email" required defaultValue={editing.email || ''} /></label><label>{editing._id ? 'New password (optional)' : 'Temporary password'}<input name="password" type="password" minLength="8" required={!editing._id} autoComplete="new-password" /></label><label>Role<select name="role" required defaultValue={editing.role?._id || ''}><option value="" disabled>Select a role</option>{roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</select></label><label>Gender<select name="gender" defaultValue={editing.gender || ''}><option value="">Not provided</option><option value="woman">Woman</option><option value="man">Man</option><option value="non_binary">Non-binary</option><option value="another_identity">Another identity</option><option value="prefer_not_to_say">Prefer not to say</option></select></label><label>Phone<input name="phone" defaultValue={editing.phone || ''} /></label><label className="check-label"><input name="isActive" type="checkbox" defaultChecked={editing.isActive ?? true} /> Active account</label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button">Save user</button></div></form></Modal>}
  </div>;
}

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const canCreate = hasPermission(user, 'roles', 'create');
  const canEdit = hasPermission(user, 'roles', 'edit');
  const canDelete = hasPermission(user, 'roles', 'delete');
  const load = useCallback(async () => {
    setLoading(true);
    try { const response = await api('/roles'); setRoles(response.data); setError(''); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  async function saveRole(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const permissions = Object.fromEntries(modules.map((module) => [module.key, Object.fromEntries(actions.map((action) => [`${action.key}`, form.get(`${module.key}.${action.key}`) === 'on']))]));
    const body = { name: form.get('name'), description: form.get('description'), permissions };
    try { await api(editing?._id ? `/roles/${editing._id}` : '/roles', { method: editing?._id ? 'PATCH' : 'POST', body }); setEditing(null); load(); }
    catch (e) { setError(e.message); }
  }
  async function deleteRole(role) {
    if (!window.confirm(`Delete the ${role.name} role?`)) return;
    try { await api(`/roles/${role._id}`, { method: 'DELETE' }); load(); } catch (e) { setError(e.message); }
  }
  return <div className="content"><PageHeading title="Role management" description="Configure what each role can view and change." action={canCreate && <button className="primary-button icon-action" onClick={() => setEditing({ permissions: {} })}><Icon name="add" size={16} />Create role</button>} />
    {error && <Notice tone="error">{error}</Notice>}
    {loading ? <section className="panel role-loading"><CircleLoader label="Loading roles" /></section> : roles.length ? <div className="role-cards">{roles.map((role) => <section className="panel role-card" key={role._id}><div className="panel-heading"><div><span className="role-badge"><Icon name="roles" size={17} /></span><h2>{role.name}</h2><p>{role.description || 'Custom workspace role'}</p></div><div className="role-card-actions">{canEdit && <button className="small-button" onClick={() => setEditing(role)}><Icon name="edit" size={14} />Edit</button>}{canDelete && <button className="small-button danger" onClick={() => deleteRole(role)}><Icon name="trash" size={14} />Delete</button>}</div></div><p className="role-members">{role.userCount || 0} assigned users</p><div className="permission-summary">{modules.filter((item) => role.permissions?.[item.key]?.view || role.permissions?.get?.(item.key)?.view).map((item) => <span key={item.key}>{item.label}</span>)}</div></section>)}</div> : !error && <section className="panel role-loading"><div className="empty-cell">No roles have been created yet.</div></section>}
    {editing && <Modal title={editing._id ? `Edit ${editing.name}` : 'Create role'} onClose={() => setEditing(null)} wide><form onSubmit={saveRole} className="role-form"><label>Role name<input name="name" required defaultValue={editing.name || ''} /></label><label>Description<input name="description" defaultValue={editing.description || ''} /></label><div className="permission-table"><div className="permission-row permission-head"><span>MODULE</span>{actions.map((action) => <span key={action.key}>{action.label}</span>)}</div>{modules.map((module) => <div className="permission-row" key={module.key}><strong>{module.label}</strong>{actions.map((action) => <label className="permission-check" key={action.key}><input name={`${module.key}.${action.key}`} type="checkbox" defaultChecked={editing.permissions?.[module.key]?.[action.key] ?? editing.permissions?.get?.(module.key)?.[action.key] ?? false} /><span className="sr-only">{module.label} {action.label}</span></label>)}</div>)}</div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button">Save permissions</button></div></form></Modal>}
  </div>;
}

const modules = [{ key: 'dashboard', label: 'Dashboard' }, { key: 'users', label: 'User Management' }, { key: 'roles', label: 'Role Management' }, { key: 'reports', label: 'Reports' }, { key: 'settings', label: 'Settings' }, { key: 'profile', label: 'My Profile' }];
const actions = [{ key: 'view', label: 'View' }, { key: 'create', label: 'Create' }, { key: 'edit', label: 'Edit' }, { key: 'delete', label: 'Delete' }];

function ReportsPage() {
  const [roles, setRoles] = useState([]);
  const [filter, setFilter] = useState('');
  const [report, setReport] = useState({ users: [], roleSummary: [], diversity: [], totalUsers: 0, generatedAt: null });
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/roles/options').then((r) => setRoles(r.data)).catch((e) => setError(e.message)); }, []);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api(`/reports/export${filter ? `?role=${filter}` : ''}`);
      setReport(response.data);
      setError('');
      return response.data;
    } catch (e) { setError(e.message); return null; }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { load(); }, [load]);
  async function downloadPdf() {
    setExporting(true);
    const latest = await load();
    setExporting(false);
    if (latest) window.setTimeout(() => {
      const previousTitle = document.title;
      document.title = 'PeopleCorps - Workforce and Diversity Report';
      window.addEventListener('afterprint', () => { document.title = previousTitle; }, { once: true });
      window.print();
    }, 150);
  }
  const totalActive = report.roleSummary.reduce((sum, row) => sum + row.activeUsers, 0);
  const totalInactive = report.roleSummary.reduce((sum, row) => sum + row.inactiveUsers, 0);
  return <div className="content report-content">
    <div className="no-print"><PageHeading title="Reports" description="User records, role totals, and current diversity data." action={<button className="primary-button icon-action" onClick={downloadPdf} disabled={exporting || loading}><Icon name="reports" size={16} />{exporting ? 'Preparing PDF...' : 'Download PDF'}</button>} />{error && <Notice tone="error">{error}</Notice>}<div className="filter-bar report-filter"><label className="inline-label">Filter report by role <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All roles</option>{roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</select></label><span>PDF export includes the records shown in this report.</span></div></div>
    {loading ? <section className="panel report-loading"><CircleLoader label="Loading report" /></section> : !error && <div className="report-print-area">
      <div className="print-report-heading"><div className="report-brand"><Icon name="brand" size={21} /><span>PeopleCorps</span></div><div><h1>People and diversity report</h1><p>Generated {report.generatedAt ? new Date(report.generatedAt).toLocaleString() : new Date().toLocaleString()}{filter ? ` · ${report.roleSummary[0]?.roleName || 'Selected role'}` : ' · All roles'}</p></div></div>
      <div className="report-kpis"><div><Icon name="people" size={17} /><span><strong>{report.totalUsers}</strong><small>Total users</small></span></div><div><Icon name="active" size={17} /><span><strong>{totalActive}</strong><small>Active</small></span></div><div><Icon name="inactive" size={17} /><span><strong>{totalInactive}</strong><small>Inactive</small></span></div><div><Icon name="diversity" size={17} /><span><strong>{report.diversity.reduce((sum, item) => sum + item.count, 0)}</strong><small>Gender records</small></span></div></div>
      <div className="report-panels"><section className="panel report-block"><div className="panel-heading"><div><h2>Users by role</h2><p>Active and inactive account totals</p></div></div><div className="table-wrap"><table><thead><tr><th>ROLE</th><th>TOTAL</th><th>ACTIVE</th><th>INACTIVE</th></tr></thead><tbody>{report.roleSummary.map((row) => <tr key={row.roleId}><td><strong>{row.roleName}</strong></td><td>{row.totalUsers}</td><td>{row.activeUsers}</td><td>{row.inactiveUsers}</td></tr>)}{!report.roleSummary.length && <tr><td colSpan="4" className="empty-cell">No users in this role.</td></tr>}</tbody></table></div></section>
        <section className="panel report-block report-diversity"><div className="panel-heading"><div><h2>Gender diversity</h2><p>{report.totalUsers} user records in this report</p></div></div><div className="report-chart-row">{report.diversity.length ? <PieChart categories={report.diversity} total={report.diversity.reduce((sum, item) => sum + item.count, 0)} /> : <div className="report-empty-chart">No gender data yet</div>}<div className="diversity-legend">{report.diversity.map((item) => <div className="legend-row" key={item.key}><span className="legend-swatch" style={{ background: diversityColors[item.key] || '#9aa3b2' }} /><span className="legend-label">{item.label}</span><strong>{item.count}</strong><span className="legend-percent">{item.percentage}%</span></div>)}</div></div></section></div>
      <section className="panel report-block report-user-list"><div className="panel-heading"><div><h2>User directory</h2><p>{report.users.length} records with database IDs</p></div></div><div className="table-wrap"><table><thead><tr><th>USER ID</th><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>GENDER</th><th>STATUS</th><th>ADDED</th></tr></thead><tbody>{report.users.map((person) => <tr key={person._id}><td><code className="user-id">{person._id}</code></td><td><strong>{person.name}</strong></td><td>{person.email}</td><td>{person.role?.name || 'Unassigned'}</td><td>{genderLabel(person.gender)}</td><td>{person.isActive ? 'Active' : 'Inactive'}</td><td>{person.createdAt ? new Date(person.createdAt).toLocaleDateString() : '-'}</td></tr>)}{!report.users.length && <tr><td colSpan="7" className="empty-cell">No user records yet.</td></tr>}</tbody></table></div></section>
      <div className="report-disclaimer">Gender information is optional. “Not provided” indicates a user has no recorded gender selection.</div>
    </div>}
  </div>;
}

const diversityColors = { woman: '#725ce5', man: '#3b8bd4', non_binary: '#20a581', another_identity: '#d9914b', prefer_not_to_say: '#d36f89', not_provided: '#9aa3b2' };

function DiversityPage() {
  const [report, setReport] = useState({ total: 0, categories: [], updatedAt: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const load = useCallback((showLoader = false) => {
    if (showLoader) setLoading(true);
    api('/reports/diversity').then((response) => { setReport(response.data); setError(''); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load(true);
    const refresh = () => load(false);
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refresh); };
  }, [load]);
  return <div className="content">
    <PageHeading eyebrow="PEOPLE INSIGHTS" title="Diversity" description="A live overview of the gender information recorded for your workforce." action={<button className="secondary-button icon-action" onClick={() => load(true)} disabled={loading}>{loading ? <span className="loading-ring" /> : <Icon name="refresh" size={15} />}{loading ? 'Updating...' : 'Refresh'}</button>} />
    {error && <Notice tone="error">{error}</Notice>}
    <section className="panel diversity-panel">
      <div className="diversity-heading"><div><span className="insight-kicker"><Icon name="diversity" size={15} /> WORKFORCE SNAPSHOT</span><h2>Gender distribution</h2><p>Based on the latest user records. Updates automatically as user profiles change.</p></div><div className="total-people"><Icon name="people" size={18} /><span><strong>{report.total}</strong><small>people in report</small></span></div></div>
      {loading ? <CircleLoader label="Loading diversity data" /> : error ? <div className="chart-empty"><strong>Could not load diversity data</strong><p>Check your connection and try again.</p></div> : report.total ? <div className="diversity-content"><PieChart categories={report.categories} total={report.total} /><div className="diversity-legend">{report.categories.map((category) => <div className="legend-row" key={category.key}><span className="legend-swatch" style={{ background: diversityColors[category.key] || '#9aa3b2' }} /><span className="legend-label">{category.label}</span><strong>{category.count}</strong><span className="legend-percent">{category.percentage}%</span></div>)}</div></div> : <div className="chart-empty"><span className="chart-empty-icon"><Icon name="diversity" size={22} /></span><strong>No user data yet</strong><p>As users are added, their optional gender information will appear here.</p></div>}
      <div className="diversity-footer"><span>Gender data is optional and includes “Not provided” records.</span><span>{report.updatedAt ? `Updated ${new Date(report.updatedAt).toLocaleTimeString()}` : 'Waiting for data'}</span></div>
    </section>
  </div>;
}

function PieChart({ categories, total }) {
  const segments = categories.filter((item) => item.count > 0);
  if (segments.length === 1) return <div className="pie-wrap"><svg className="pie-chart" viewBox="0 0 220 220" role="img" aria-label={`${segments[0].label}: ${segments[0].count} of ${total} people`}><circle cx="110" cy="110" r="96" fill={diversityColors[segments[0].key] || '#9aa3b2'} /></svg></div>;
  let angle = -90;
  const paths = segments.map((segment) => {
    const sweep = (segment.count / total) * 360;
    const start = polar(110, 110, 96, angle);
    const end = polar(110, 110, 96, angle + sweep);
    const path = `M 110 110 L ${start.x} ${start.y} A 96 96 0 ${sweep > 180 ? 1 : 0} 1 ${end.x} ${end.y} Z`;
    angle += sweep;
    return <path key={segment.key} d={path} fill={diversityColors[segment.key] || '#9aa3b2'} stroke="var(--surface)" strokeWidth="2"><title>{segment.label}: {segment.count} ({segment.percentage}%)</title></path>;
  });
  return <div className="pie-wrap"><svg className="pie-chart" viewBox="0 0 220 220" role="img" aria-label={`Gender distribution across ${total} people`}>{paths}</svg></div>;
}

function polar(cx, cy, radius, angle) {
  const radians = (angle * Math.PI) / 180;
  return { x: Number((cx + radius * Math.cos(radians)).toFixed(3)), y: Number((cy + radius * Math.sin(radians)).toFixed(3)) };
}

function SettingsPage() {
  const [organizationName, setOrganizationName] = useState('PeopleCorps');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const canEdit = hasPermission(user, 'settings', 'edit');
  useEffect(() => { api('/settings').then((r) => setOrganizationName(r.data.organizationName)).catch((e) => setError(e.message)); }, []);
  async function save(event) { event.preventDefault(); try { const result = await api('/settings', { method: 'PATCH', body: { organizationName } }); setOrganizationName(result.data.organizationName); setMessage('Settings saved.'); setError(''); } catch (e) { setError(e.message); } }
  return <div className="content"><PageHeading title="Settings" description="Basic workspace preferences." />{error && <Notice tone="error">{error}</Notice>}{message && <Notice>{message}</Notice>}<section className="panel settings-panel"><form className="form-grid" onSubmit={save}><label>Organization name<input value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} disabled={!canEdit} required /></label><p className="helper-text">This name is used to identify your workspace.</p>{canEdit && <button className="primary-button">Save settings</button>}</form></section></div>;
}

function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function save(event) { event.preventDefault(); const form = new FormData(event.currentTarget); const body = Object.fromEntries(form.entries()); if (!body.newPassword) { delete body.newPassword; delete body.currentPassword; } try { const response = await api('/profile', { method: 'PATCH', body }); updateUser(response.data); setMessage('Profile updated.'); setError(''); event.currentTarget.reset(); } catch (e) { setError(e.message); } }
  return <div className="content"><PageHeading title="My profile" description="Update your personal details and password." />{error && <Notice tone="error">{error}</Notice>}{message && <Notice>{message}</Notice>}<section className="panel settings-panel"><form className="form-grid" onSubmit={save}><label>Full name<input name="name" required defaultValue={user.name} /></label><label>Email address<input name="email" type="email" required defaultValue={user.email} /></label><label>Phone<input name="phone" defaultValue={user.phone || ''} /></label><div className="profile-role">Current role <strong>{user.role?.name}</strong></div><div className="section-divider"><strong>Change password</strong><span>Leave blank to keep your current password.</span></div><label>Current password<input name="currentPassword" type="password" autoComplete="current-password" /></label><label>New password<input name="newPassword" type="password" minLength="8" autoComplete="new-password" /></label><button className="primary-button">Save profile</button></form></section></div>;
}

function Login() {
  const { login, user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!loading && user) navigate('/', { replace: true }); }, [loading, user, navigate]);
  async function submit(event) { event.preventDefault(); setBusy(true); setError(''); const form = new FormData(event.currentTarget); try { await login(form.get('email'), form.get('password')); navigate(location.state?.from?.pathname || '/', { replace: true }); } catch (e) { setError(e.message); } finally { setBusy(false); } }
  return <main className="login-page"><button className="theme-toggle login-theme" onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}><Icon name={theme === 'light' ? 'moon' : 'sun'} size={16} /><span>{theme === 'light' ? 'Dark' : 'Light'}</span></button><div className="login-card"><div className="brand login-brand"><span className="brand-mark"><Icon name="brand" size={20} /></span><span>People<span className="brand-light">Corps</span></span></div><h1>Welcome back</h1><p>Sign in to manage your workspace.</p>{error && <Notice tone="error">{error}</Notice>}<form onSubmit={submit}><label>Email address<input name="email" type="email" placeholder="you@company.com" autoComplete="username" required /></label><label>Password<input name="password" type="password" placeholder="Enter your password" autoComplete="current-password" required /></label><button className="primary-button login-submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button></form><div className="login-caption">Secure access to PeopleCorps</div></div><div className="login-copyright">PeopleCorps · Role based access management</div></main>;
}

function Modal({ title, onClose, children, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-title"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>{children}</section></div>;
}
function Notice({ children, tone = 'success' }) { return <div className={`notice ${tone}`}>{children}</div>; }
function CircleLoader({ label = 'Loading', compact = false }) {
  return <div className={`loading-state ${compact ? 'compact' : ''}`} role="status" aria-live="polite"><span className="loading-ring" aria-hidden="true" /><span>{label}</span></div>;
}
function AccessDenied() { return <div className="content"><PageHeading title="Access restricted" description="Your role does not have permission to view this page." /></div>; }
function initials(value = '') { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U'; }
function genderLabel(gender) {
  return ({ woman: 'Woman', man: 'Man', non_binary: 'Non-binary', another_identity: 'Another identity', prefer_not_to_say: 'Prefer not to say' })[gender] || 'Not provided';
}
