import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api, hasPermission } from './api.js';
import { useAuth } from './context/AuthContext.jsx';
import { useTheme } from './context/ThemeContext.jsx';

const navigation = [
  { label: 'Dashboard', path: '/', module: 'dashboard', icon: 'D' },
  { label: 'User Management', path: '/user-management', module: 'users', icon: 'U' },
  { label: 'Role Management', path: '/role-management', module: 'roles', icon: 'R' },
  { label: 'Reports', path: '/reports', module: 'reports', icon: 'P' },
  { label: 'Settings', path: '/settings', module: 'settings', icon: 'S' },
  { label: 'My Profile', path: '/my-profile', module: 'profile', icon: 'M' }
];

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="loading-screen">Loading PeopleCorps...</div>;
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
  const location = useLocation();
  const navigate = useNavigate();
  const current = navigation.find((item) => item.path === location.pathname) || navigation[0];
  const visibleLinks = navigation.filter((item) => hasPermission(user, item.module, 'view'));
  async function signOut() { await logout(); navigate('/login', { replace: true }); }
  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" to="/"><span className="brand-mark">P</span><span>People<span className="brand-light">Corps</span></span></Link>
      <div className="nav-label">WORKSPACE</div>
      <nav>{visibleLinks.map((item) => <Link className={`nav-item ${current.path === item.path ? 'selected' : ''}`} to={item.path} key={item.path}><span className="nav-icon">{item.icon}</span>{item.label}</Link>)}</nav>
      <button className="sidebar-footer account-button" onClick={() => navigate('/my-profile')}><div className="avatar">{initials(user?.name)}</div><div><strong>{user?.name}</strong><small>{user?.role?.name || 'Member'}</small></div><span className="chevron">...</span></button>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">PeopleCorps <span>/</span> <b>{current.label}</b></div><div className="top-actions"><button className="icon-button" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'light' ? 'Dark' : 'Light'}</button><button className="text-button" onClick={signOut}>Sign out</button></div></header>
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
  useEffect(() => {
    api('/dashboard').then((summary) => setStats(summary.data)).catch((e) => setError(e.message));
  }, []);
  const cards = [['Total users', stats?.totalUsers, 'Across all roles', 'U'], ['Active users', stats?.activeUsers, 'Currently enabled', 'A'], ['Inactive users', stats?.inactiveUsers, 'Access suspended', 'I'], ['Total roles', stats?.totalRoles, 'Permission groups', 'R']];
  return <div className="content">
    <PageHeading eyebrow="OVERVIEW" title="Dashboard" description="A snapshot of people and access across your workspace." action={hasPermission(user, 'users', 'view') && <Link className="primary-button" to="/user-management">Manage users</Link>} />
    {error && <Notice tone="error">{error}</Notice>}
    <div className="stat-grid">{cards.map(([label, value, note, icon]) => <section className="stat-card" key={label}><div className="stat-top"><span>{label}</span><span className="stat-icon">{icon}</span></div><div className="stat-value">{value ?? '--'}</div><div className="stat-note">{note}</div></section>)}</div>
    <div className="panel-grid"><section className="panel"><div className="panel-heading"><div><h2>Workspace access</h2><p>Default role groups</p></div>{hasPermission(user, 'roles', 'view') && <Link className="text-button" to="/role-management">Manage roles</Link>}</div><div className="role-list">{(stats?.roles || []).map((role) => <div className="role-row" key={role.id}><span className="role-badge">{initials(role.name)}</span><span className="role-name">{role.name}</span><span className="role-count">{role.userCount} users</span></div>)}</div></section><section className="panel"><div className="panel-heading"><div><h2>Getting started</h2><p>Manage your PeopleCorps workspace</p></div></div><div className="quick-links">{hasPermission(user, 'users', 'view') && <Link to="/user-management">Add or update people <span>→</span></Link>}{hasPermission(user, 'roles', 'view') && <Link to="/role-management">Review module permissions <span>→</span></Link>}{hasPermission(user, 'reports', 'view') && <Link to="/reports">View user reports <span>→</span></Link>}</div></section></div>
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
  const canCreate = hasPermission(currentUser, 'users', 'create');
  const canEdit = hasPermission(currentUser, 'users', 'edit');
  const canDelete = hasPermission(currentUser, 'users', 'delete');
  const load = useCallback(() => {
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (activeFilter) params.set('active', activeFilter);
    api(`/users?${params}`).then((response) => { setUsers(response.data); setPagination(response.pagination); setError(''); }).catch((e) => setError(e.message));
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
    <PageHeading title="User management" description="Search, filter, and manage workspace accounts." action={canCreate && <button className="primary-button" onClick={() => setEditing({})}>+ Add user</button>} />
    {error && <Notice tone="error">{error}</Notice>}
    <section className="panel data-panel">
      <form className="filter-bar" onSubmit={submitSearch}><input aria-label="Search users" placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} /><button className="secondary-button">Search</button><select aria-label="Filter by role" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}><option value="">All roles</option>{roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</select><select aria-label="Filter by status" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}><option value="">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></select></form>
      <div className="table-wrap"><table><thead><tr><th>PERSON</th><th>ROLE</th><th>STATUS</th><th>ADDED</th><th>ACTIONS</th></tr></thead><tbody>{users.map((person) => <tr key={person._id}><td><div className="person-cell"><div className="avatar">{initials(person.name)}</div><div><strong>{person.name}</strong><small>{person.email}</small></div></div></td><td>{person.role?.name || 'Unassigned'}</td><td><span className={`status-pill ${person.isActive ? 'active' : 'inactive'}`}>{person.isActive ? 'Active' : 'Inactive'}</span></td><td>{new Date(person.createdAt).toLocaleDateString()}</td><td><div className="row-actions">{canEdit && <button className="small-button" onClick={() => setEditing(person)}>Edit</button>}{canDelete && <button className="small-button danger" onClick={() => removeUser(person)}>Delete</button>}</div></td></tr>)}{users.length === 0 && <tr><td colSpan="5" className="empty-cell">No users match those filters.</td></tr>}</tbody></table></div>
      <div className="pagination"><span>Showing {pagination.total ? (page - 1) * 10 + 1 : 0}-{Math.min(page * 10, pagination.total)} of {pagination.total} users</span><div><button className="secondary-button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button><span>Page {page} of {Math.max(pagination.totalPages, 1)}</span><button className="secondary-button" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button></div></div>
    </section>
    {editing && <Modal title={editing._id ? 'Edit user' : 'Add user'} onClose={() => setEditing(null)}><form className="form-grid" onSubmit={saveUser}><label>Full name<input name="name" required defaultValue={editing.name || ''} /></label><label>Email address<input name="email" type="email" required defaultValue={editing.email || ''} /></label><label>{editing._id ? 'New password (optional)' : 'Temporary password'}<input name="password" type="password" minLength="8" required={!editing._id} autoComplete="new-password" /></label><label>Role<select name="role" required defaultValue={editing.role?._id || ''}><option value="" disabled>Select a role</option>{roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</select></label><label>Phone<input name="phone" defaultValue={editing.phone || ''} /></label><label className="check-label"><input name="isActive" type="checkbox" defaultChecked={editing.isActive ?? true} /> Active account</label><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button">Save user</button></div></form></Modal>}
  </div>;
}

function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const canCreate = hasPermission(user, 'roles', 'create');
  const canEdit = hasPermission(user, 'roles', 'edit');
  const canDelete = hasPermission(user, 'roles', 'delete');
  const load = useCallback(() => api('/roles').then((r) => setRoles(r.data)).catch((e) => setError(e.message)), []);
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
  return <div className="content"><PageHeading title="Role management" description="Configure what each role can view and change." action={canCreate && <button className="primary-button" onClick={() => setEditing({ permissions: {} })}>+ Create role</button>} />
    {error && <Notice tone="error">{error}</Notice>}
    <div className="role-cards">{roles.map((role) => <section className="panel role-card" key={role._id}><div className="panel-heading"><div><span className="role-badge">{initials(role.name)}</span><h2>{role.name}</h2><p>{role.description || 'Custom workspace role'}</p></div><div className="role-card-actions">{canEdit && <button className="small-button" onClick={() => setEditing(role)}>Edit</button>}{canDelete && <button className="small-button danger" onClick={() => deleteRole(role)}>Delete</button>}</div></div><p className="role-members">{role.userCount || 0} assigned users</p><div className="permission-summary">{modules.filter((item) => role.permissions?.[item.key]?.view || role.permissions?.get?.(item.key)?.view).map((item) => <span key={item.key}>{item.label}</span>)}</div></section>)}</div>
    {editing && <Modal title={editing._id ? `Edit ${editing.name}` : 'Create role'} onClose={() => setEditing(null)} wide><form onSubmit={saveRole} className="role-form"><label>Role name<input name="name" required defaultValue={editing.name || ''} /></label><label>Description<input name="description" defaultValue={editing.description || ''} /></label><div className="permission-table"><div className="permission-row permission-head"><span>MODULE</span>{actions.map((action) => <span key={action.key}>{action.label}</span>)}</div>{modules.map((module) => <div className="permission-row" key={module.key}><strong>{module.label}</strong>{actions.map((action) => <label className="permission-check" key={action.key}><input name={`${module.key}.${action.key}`} type="checkbox" defaultChecked={editing.permissions?.[module.key]?.[action.key] ?? editing.permissions?.get?.(module.key)?.[action.key] ?? false} /><span className="sr-only">{module.label} {action.label}</span></label>)}</div>)}</div><div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button">Save permissions</button></div></form></Modal>}
  </div>;
}

const modules = [{ key: 'dashboard', label: 'Dashboard' }, { key: 'users', label: 'User Management' }, { key: 'roles', label: 'Role Management' }, { key: 'reports', label: 'Reports' }, { key: 'settings', label: 'Settings' }, { key: 'profile', label: 'My Profile' }];
const actions = [{ key: 'view', label: 'View' }, { key: 'create', label: 'Create' }, { key: 'edit', label: 'Edit' }, { key: 'delete', label: 'Delete' }];

function ReportsPage() {
  const [roles, setRoles] = useState([]);
  const [filter, setFilter] = useState('');
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { api('/roles/options').then((r) => setRoles(r.data)).catch((e) => setError(e.message)); }, []);
  useEffect(() => { api(`/reports${filter ? `?role=${filter}` : ''}`).then((r) => { setRows(r.data); setError(''); }).catch((e) => setError(e.message)); }, [filter]);
  return <div className="content"><PageHeading title="Reports" description="User counts by role and account status." />{error && <Notice tone="error">{error}</Notice>}<section className="panel data-panel"><div className="filter-bar"><label className="inline-label">Filter by role <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">All roles</option>{roles.map((role) => <option key={role._id} value={role._id}>{role.name}</option>)}</select></label></div><div className="table-wrap"><table><thead><tr><th>ROLE</th><th>TOTAL USERS</th><th>ACTIVE</th><th>INACTIVE</th></tr></thead><tbody>{rows.map((row) => <tr key={row.roleId}><td><strong>{row.roleName}</strong></td><td>{row.totalUsers}</td><td>{row.activeUsers}</td><td>{row.inactiveUsers}</td></tr>)}{!rows.length && <tr><td colSpan="4" className="empty-cell">No report data yet.</td></tr>}</tbody></table></div></section></div>;
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
  return <main className="login-page"><button className="icon-button login-theme" onClick={toggleTheme} aria-label="Toggle theme">{theme === 'light' ? 'Dark' : 'Light'}</button><div className="login-card"><div className="brand login-brand"><span className="brand-mark">P</span><span>People<span className="brand-light">Corps</span></span></div><h1>Welcome back</h1><p>Sign in to manage your workspace.</p>{error && <Notice tone="error">{error}</Notice>}<form onSubmit={submit}><label>Email address<input name="email" type="email" placeholder="you@company.com" autoComplete="username" required /></label><label>Password<input name="password" type="password" placeholder="Enter your password" autoComplete="current-password" required /></label><button className="primary-button login-submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button></form><div className="login-caption">Secure access to PeopleCorps</div></div><div className="login-copyright">PeopleCorps · Role based access management</div></main>;
}

function Modal({ title, onClose, children, wide = false }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}><div className="modal-title"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close">×</button></div>{children}</section></div>;
}
function Notice({ children, tone = 'success' }) { return <div className={`notice ${tone}`}>{children}</div>; }
function AccessDenied() { return <div className="content"><PageHeading title="Access restricted" description="Your role does not have permission to view this page." /></div>; }
function initials(value = '') { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('') || 'U'; }
