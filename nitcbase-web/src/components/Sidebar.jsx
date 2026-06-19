import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">DB</div>
          <div className="sidebar-logo-text">
            <h1>NITCbase</h1>
            <p>Database Console</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav" id="sidebar-nav">
        <div className="nav-section-label">General</div>

        <NavLink to="/" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} end>
          <span className="nav-icon">⌨️</span>
          <span>Terminal</span>
        </NavLink>

        <div className="nav-section-label">DDL Operations</div>

        <NavLink to="/tables" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">📋</span>
          <span>Tables</span>
        </NavLink>

        <NavLink to="/index" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">🔗</span>
          <span>Indexes</span>
        </NavLink>

        <div className="nav-section-label">DML Operations</div>

        <NavLink to="/insert" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">➕</span>
          <span>Insert</span>
        </NavLink>

        <NavLink to="/query" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">🔍</span>
          <span>Query</span>
        </NavLink>

        <NavLink to="/join" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <span className="nav-icon">🔀</span>
          <span>Join</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-info">
          <span className="status-dot"></span>
          <span>NITCbase v1.0 — Ready</span>
        </div>
      </div>
    </aside>
  );
}
