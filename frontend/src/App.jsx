import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API = 'http://127.0.0.1:8000/api';
const LAST_INCIDENT_KEY = 'sentinelforge:lastIncidentId';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || `Request failed (${response.status})`
    );
  }

  return data;
}

function rememberIncident(incident) {
  const id = incident?.id || incident?.incident_id;
  if (id) window.localStorage.setItem(LAST_INCIDENT_KEY, String(id));
}

function getIncidentId(incident) {
  return incident?.id || incident?.incident_id || '';
}

function getStatus(incident) {
  const status = String(
    incident?.status ||
    incident?.verification_status ||
    incident?.approval_status ||
    'created'
  ).toLowerCase();

  if (status.includes('verif') || status.includes('pass')) return 'Verified';
  if (status.includes('approv')) return 'Approved';
  if (status.includes('patch')) return 'Patch proposed';
  if (status.includes('investig')) return 'Investigated';
  if (status.includes('fail')) return 'Failed';
  return 'In progress';
}

function formatDate(value) {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function Icon({ name, size = 18 }) {
  const paths = {
    grid: <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>,
    bug: <>
      <path d="M8 8h8a3 3 0 0 1 3 3v5a7 7 0 0 1-14 0v-5a3 3 0 0 1 3-3Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2M3 12h4m10 0h4M3 18h4m10 0h4M9 3 7 1m8 2 2-2M12 11v8" />
    </>,
    scan: <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="M4 12h16M12 4v16" />
    </>,
    report: <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8m-8 4h8" />
    </>,
    settings: <>
      <circle cx="12" cy="12" r="3" />
      <path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.7 1l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.7-1l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-2l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.7-1l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.7 1l1.7-.6 1.4 2.4a7 7 0 0 1 0 2Z" />
    </>,
    search: <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>,
    shield: <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>,
    code: <>
      <path d="m8 8-4 4 4 4m8-8 4 4-4 4m-3-11-2 14" />
    </>,
    check: <path d="m5 12 4 4L19 6" />,
    arrow: <>
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </>,
    plus: <path d="M12 5v14M5 12h14" />,
    spark: <>
      <path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" />
      <path d="m19 14 1.1 2.2L22 17l-1.9.8L19 20l-.9-2.2L16 17l2.1-.8L19 14Z" />
    </>,
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.spark}
    </svg>
  );
}

function StatCard({ icon, label, value, detail, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-top">
        <span className="stat-icon"><Icon name={icon} size={20} /></span>
        <span className="stat-label">{label}</span>
        <span className="stat-spark">⌁</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </article>
  );
}

function Stage({ number, title, description, status, active }) {
  return (
    <div className={`stage ${active ? 'stage-active' : ''}`}>
      <div className="stage-marker">
        {status === 'done' ? <Icon name="check" size={15} /> : number}
      </div>
      <div className="stage-copy">
        <strong>{title}</strong>
        <span>{description}</span>
      </div>
      <span className={`stage-status ${status}`}>
        {status === 'done'
          ? 'Complete'
          : status === 'active'
            ? 'In progress'
            : 'Pending'}
      </span>
    </div>
  );
}

function IncidentHistory({
  incidents,
  loading,
  error,
  onRefresh,
  onOpen,
  onCreate,
  busy,
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredIncidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return incidents.filter((item) => {
      const id = getIncidentId(item);
      const title = item.title || item.scenario_id || 'Untitled incident';
      const status = getStatus(item);

      const matchesSearch =
        !query ||
        String(id).toLowerCase().includes(query) ||
        String(title).toLowerCase().includes(query) ||
        String(item.scenario_id || '').toLowerCase().includes(query);

      const matchesFilter = filter === 'All' || status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [incidents, search, filter]);

  return (
    <section className="panel history-panel">
      <div className="panel-heading">
        <div>
          <div className="panel-kicker">INCIDENT MANAGEMENT</div>
          <h2>Incident history</h2>
          <p>Review previous failures, diagnoses, and repair verification results.</p>
        </div>
        <button className="secondary-button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh history'}
        </button>
      </div>

      <div className="history-toolbar">
        <label className="history-search">
          <Icon name="search" size={17} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search incident ID, title, or scenario"
            aria-label="Search incidents"
          />
        </label>

        <label className="history-filter">
          <span>Status</span>
          <select value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option>All</option>
            <option>Verified</option>
            <option>Approved</option>
            <option>Patch proposed</option>
            <option>Investigated</option>
            <option>Failed</option>
            <option>In progress</option>
          </select>
        </label>
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="history-summary">
        <span>{filteredIncidents.length} incident{filteredIncidents.length === 1 ? '' : 's'}</span>
        <span>{incidents.filter((item) => getStatus(item) === 'Verified').length} verified</span>
      </div>

      {loading && incidents.length === 0 ? (
        <div className="history-empty">
          <p>Loading saved incidents…</p>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="history-empty">
          <div className="empty-icon"><Icon name="bug" size={24} /></div>
          <h3>{incidents.length ? 'No matching incidents' : 'No incidents yet'}</h3>
          <p>
            {incidents.length
              ? 'Try a different search or status filter.'
              : 'Create your first incident and its saved record will appear here.'}
          </p>
          {!incidents.length && (
            <button className="primary-button" onClick={onCreate} disabled={busy}>
              <Icon name="plus" size={16} /> Create incident
            </button>
          )}
        </div>
      ) : (
        <div className="history-table-wrap">
          <table className="history-table">
            <thead>
              <tr>
                <th>Incident</th>
                <th>Scenario</th>
                <th>Created</th>
                <th>Status</th>
                <th>Baseline</th>
                <th>Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((item) => {
                const id = getIncidentId(item);
                const verified =
                  String(item.status || '').toLowerCase() === 'verified' ||
                  String(item.verification_status || '').toLowerCase().includes('pass');

                return (
                  <tr key={id || `${item.scenario_id}-${item.created_at}`}>
                    <td>
                      <strong className="history-id">#{String(id).slice(0, 8) || '—'}</strong>
                      <span className="history-title">{item.title || 'Untitled incident'}</span>
                    </td>
                    <td>{item.scenario_id || '—'}</td>
                    <td>{formatDate(item.created_at)}</td>
                    <td>
                      <span className={`history-status ${verified ? 'status-verified' : ''}`}>
                        <span />{getStatus(item)}
                      </span>
                    </td>
                    <td>{item.baseline_passed === false ? 'Failed as expected' : item.baseline_passed === true ? 'Passed' : 'Captured'}</td>
                    <td>{verified ? 'Passed' : item.verification_status || 'Not verified'}</td>
                    <td>
                      <button
                        className="history-open-button"
                        onClick={() => onOpen(id)}
                        disabled={!id || busy}
                      >
                        Open <Icon name="arrow" size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="history-footnote">
        Incident records are loaded from the local backend. The prototype currently supports
        the included fixture scenario only.
      </p>
    </section>
  );
}

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [scenarioId, setScenarioId] = useState('login-regression');
  const [incident, setIncident] = useState(null);
  const [incidentHistory, setIncidentHistory] = useState([]);
  const [busy, setBusy] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [backendOnline, setBackendOnline] = useState(false);
  const [healthChecking, setHealthChecking] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  async function refreshHistory(showLoading = true) {
    if (showLoading) setHistoryLoading(true);
    setHistoryError('');

    try {
      const data = await request('/incidents?limit=200');
      const list = Array.isArray(data) ? data : data.incidents || data.items || [];

      list.sort((a, b) => {
        const timeA = Date.parse(a.created_at || '') || 0;
        const timeB = Date.parse(b.created_at || '') || 0;
        return timeB - timeA;
      });

      setIncidentHistory(list);
      setBackendOnline(true);
      return list;
    } catch (error) {
      setHistoryError(error.message);
      throw error;
    } finally {
      if (showLoading) setHistoryLoading(false);
    }
  }

  async function openIncident(id) {
    if (!id) return;

    setBusy(true);
    setNotice({ type: '', text: '' });

    try {
      const fullIncident = await request(`/incidents/${encodeURIComponent(id)}`);
      setIncident(fullIncident);
      rememberIncident(fullIncident);
      setActiveNav('Dashboard');
      setNotice({
        type: 'success',
        text: `Incident ${id} loaded. Review its evidence and repair status below.`,
      });

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setNotice({ type: 'error', text: `Could not open incident: ${error.message}` });
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreWorkspace() {
      try {
        const [scenarioData, historyData] = await Promise.all([
          request('/scenarios'),
          request('/incidents?limit=200'),
        ]);

        if (cancelled) return;

        const list = Array.isArray(scenarioData)
          ? scenarioData
          : scenarioData.scenarios || scenarioData.items || [];

        setScenarios(list);

        if (list[0]?.id || list[0]?.scenario_id) {
          setScenarioId(list[0].id || list[0].scenario_id);
        }

        const history = Array.isArray(historyData)
          ? historyData
          : historyData.incidents || historyData.items || [];

        history.sort((a, b) => {
          const timeA = Date.parse(a.created_at || '') || 0;
          const timeB = Date.parse(b.created_at || '') || 0;
          return timeB - timeA;
        });

        setIncidentHistory(history);
        setBackendOnline(true);

        const newest = history[0];
        const savedId = window.localStorage.getItem(LAST_INCIDENT_KEY);
        const idToLoad = getIncidentId(newest) || savedId;

        if (idToLoad) {
          const fullIncident = await request(
            `/incidents/${encodeURIComponent(idToLoad)}`
          );

          if (cancelled) return;

          setIncident(fullIncident);
          rememberIncident(fullIncident);
        } else {
          setIncident(null);
        }
      } catch (error) {
        if (cancelled) return;

        setBackendOnline(false);
        setNotice({
          type: 'error',
          text: `${error.message}. Check that the backend is running at 127.0.0.1:8000.`,
        });
      }
    }

    restoreWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  const incidentId = getIncidentId(incident);

  const baseline =
    incident?.baseline_output ||
    incident?.baseline_result ||
    incident?.baseline ||
    incident?.baseline_test_result ||
    null;

  const investigation =
    incident?.diagnosis ||
    incident?.investigation ||
    incident?.analysis ||
    null;

  const patch = incident?.proposed_patch || incident?.patch || null;

  const verification =
    incident?.verification_output ||
    incident?.verification ||
    incident?.verification_result ||
    null;

  const approval = incident?.approval_status || incident?.approval || '';

  const baselineText =
    typeof baseline === 'string'
      ? baseline
      : baseline?.output || baseline?.summary || baseline?.message || '';

  const investigationText =
    typeof investigation === 'string'
      ? investigation
      : investigation?.summary ||
        investigation?.diagnosis ||
        investigation?.root_cause ||
        investigation?.message ||
        '';

  const patchText =
    typeof patch === 'string'
      ? patch
      : patch?.diff || patch?.patch || patch?.description || patch?.summary || '';

  const verificationText =
    typeof verification === 'string'
      ? verification
      : verification?.output || verification?.summary || verification?.message || '';

  const approvalValue = String(approval).trim().toLowerCase();
  const isApproved = approvalValue === 'approved' || approvalValue === 'true';

  const isVerified =
    String(incident?.status || '').toLowerCase() === 'verified' ||
    String(incident?.verification_status || '').toLowerCase().includes('pass') ||
    String(verification?.status || '').toLowerCase().includes('pass');

  const stage = useMemo(() => {
    if (!incident) return 0;
    if (!investigation) return 1;
    if (!patch) return 2;
    if (!isApproved) return 3;
    if (!isVerified) return 4;
    return 5;
  }, [incident, investigation, patch, isApproved, isVerified]);

  async function runAction(action, successMessage) {
    if (!incidentId) return;

    setBusy(true);
    setNotice({ type: '', text: '' });

    try {
      await request(`/incidents/${encodeURIComponent(incidentId)}/${action}`, {
        method: 'POST',
        body: '{}',
      });

      const refreshed = await request(
        `/incidents/${encodeURIComponent(incidentId)}`
      );

      setIncident(refreshed);
      rememberIncident(refreshed);
      setNotice({ type: 'success', text: successMessage });

      try {
        await refreshHistory(false);
      } catch {
        // Keep the successful workflow result visible if history refresh fails.
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function checkBackendHealth() {
    setHealthChecking(true);
    try {
      await request('/health');
      setBackendOnline(true);
      setNotice({ type: 'success', text: 'Backend health check passed. The local API is responding.' });
    } catch (error) {
      setBackendOnline(false);
      setNotice({ type: 'error', text: `Backend health check failed: ${error.message}` });
    } finally {
      setHealthChecking(false);
    }
  }

  async function createIncident() {
    setBusy(true);
    setNotice({ type: '', text: '' });

    try {
      const created = await request('/incidents', {
        method: 'POST',
        body: JSON.stringify({ scenario_id: scenarioId }),
      });

      const id = getIncidentId(created);
      const full = id
        ? await request(`/incidents/${encodeURIComponent(id)}`)
        : created;

      setIncident(full);
      setBackendOnline(true);
      rememberIncident(full);
      setActiveNav('Dashboard');
      setNotice({
        type: 'success',
        text: `Incident ${getIncidentId(full) || id} created. Baseline reproduction is ready for investigation.`,
      });

      try {
        await refreshHistory(false);
      } catch {
        // The created incident remains available even if history refresh fails.
      }
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
  }

  function exportIncidentReport(item = incident) {
    if (!item) {
      setNotice({ type: 'error', text: 'Open an incident before exporting its report.' });
      return;
    }

    const reportId = getIncidentId(item) || 'unknown';
    const itemBaseline = item.baseline_output || item.baseline_result || item.baseline || item.baseline_test_result || '';
    const itemInvestigation = item.diagnosis || item.investigation || item.analysis || '';
    const itemPatch = item.proposed_patch || item.patch || '';
    const itemVerification = item.verification_output || item.verification || item.verification_result || '';
    const asText = (value) => {
      if (typeof value === 'string') return value;
      if (!value) return 'Not recorded';
      return value.output || value.summary || value.message || value.diagnosis || value.root_cause || value.diff || value.patch || value.description || JSON.stringify(value, null, 2);
    };

    const report = [
      'SENTINELFORGE — INCIDENT REPAIR REPORT',
      '======================================',
      `Incident ID: ${reportId}`,
      `Scenario: ${item.scenario_id || 'Not recorded'}`,
      `Created: ${formatDate(item.created_at)}`,
      `Status: ${getStatus(item)}`,
      `Approval: ${item.approval_status || item.approval || 'Not recorded'}`,
      `Verification status: ${item.verification_status || item.status || 'Not recorded'}`,
      '',
      '1. BASELINE FAILURE',
      '-------------------',
      asText(itemBaseline),
      '',
      '2. INVESTIGATION FINDINGS',
      '-------------------------',
      asText(itemInvestigation),
      '',
      '3. PROPOSED PATCH',
      '-----------------',
      asText(itemPatch),
      '',
      '4. HUMAN REVIEW',
      '---------------',
      `Approval recorded: ${String(item.approval_status || item.approval || 'Not recorded')}`,
      '',
      '5. POST-PATCH VERIFICATION',
      '--------------------------',
      asText(itemVerification),
      '',
      'Prototype note: SentinelForge currently runs against its included fixture scenario. This report reflects data recorded by the local prototype.',
    ].join('\n');

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sentinelforge-incident-${String(reportId).slice(0, 8)}-report.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const navigation = [
    ['Dashboard', 'grid'],
    ['Incidents', 'bug'],
    ['Scan', 'scan'],
    ['Reports', 'report'],
    ['Settings', 'settings'],
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><span /><span /><span /></div>
          <div>
            <div className="brand-name">SentinelForge</div>
            <div className="brand-tagline">Detect <i /> Analyze <i /> Fix</div>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>

        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map(([label, icon]) => (
            <button
              key={label}
              className={`nav-item ${activeNav === label ? 'selected' : ''}`}
              onClick={() => {
                setActiveNav(label);
                setNotice({ type: '', text: '' });

                if (label === 'Incidents' || label === 'Scan' || label === 'Reports') {
                  refreshHistory().catch(() => {});
                } else if (label === 'Settings') {
                  setNotice({ type: 'info', text: 'Settings shows the current local environment and repair safety policy.' });
                } else if (label === 'Dashboard') {
                  // Keep the current incident loaded on the dashboard.
                }
              }}
            >
              <Icon name={icon} />
              <span>{label}</span>
              {activeNav === label && <span className="nav-chevron">›</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-card">
            <span className={`online-dot ${backendOnline ? '' : 'offline'}`} />
            <div>
              <strong>{backendOnline ? 'Backend connected' : 'Connecting to backend'}</strong>
              <span>
                {backendOnline ? 'API responding on port 8000' : 'Waiting for API response'}
              </span>
            </div>
            <span className="pulse-line">⌁</span>
          </div>

          <div className="sidebar-version">
            SENTINELFORGE
            <span>v0.1.0 · Prototype</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span><b>/</b><strong>{activeNav}</strong>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Icon name="search" size={16} />
              <span>Search incidents, evidence...</span>
              <kbd>Ctrl K</kbd>
            </div>

            <div className="environment">
              <span /> LOCAL ENVIRONMENT <span className="env-chevron">⌄</span>
            </div>

            <button className="avatar" title="SentinelForge workspace">SF</button>
          </div>
        </header>

        {activeNav === 'Incidents' ? (
          <div className="page-content">
            <section className="hero compact-hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="eyebrow-line" />
                  ENGINEERING INTELLIGENCE
                  <span className="eyebrow-pill">INCIDENTS</span>
                </div>
                <h1>Every failure.<br /><span>One evidence trail.</span></h1>
                <p>
                  Browse saved incidents, inspect their repair status, and reopen
                  any investigation to review its evidence.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => {
                      setActiveNav('Dashboard');
                      createIncident();
                    }}
                    disabled={busy}
                  >
                    <Icon name="plus" size={17} /> Create new incident
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              </div>
            </section>

            <div className="history-stats">
              <StatCard
                icon="bug"
                label="Saved incidents"
                value={incidentHistory.length}
                detail="Stored in the local backend"
                tone="blue"
              />
              <StatCard
                icon="shield"
                label="Verified repairs"
                value={incidentHistory.filter((item) => getStatus(item) === 'Verified').length}
                detail="Verification status recorded"
                tone="cyan"
              />
              <StatCard
                icon="code"
                label="Awaiting verification"
                value={incidentHistory.filter((item) => getStatus(item) !== 'Verified').length}
                detail="May need more workflow steps"
                tone="violet"
              />
            </div>

            <IncidentHistory
              incidents={incidentHistory}
              loading={historyLoading}
              error={historyError}
              onRefresh={() => refreshHistory()}
              onOpen={openIncident}
              onCreate={() => {
                setActiveNav('Dashboard');
                createIncident();
              }}
              busy={busy}
            />
          </div>
        ) : activeNav === 'Scan' ? (
          <div className="page-content">
            <section className="hero compact-hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="eyebrow-line" />
                  ENGINEERING INTELLIGENCE
                  <span className="eyebrow-pill">SCAN WORKSPACE</span>
                </div>
                <h1>Find the failure.<br /><span>Start with evidence.</span></h1>
                <p>
                  Run the available SentinelForge fixture scenario to create a recorded incident.
                  The current prototype scans its included test fixture, not arbitrary repositories.
                </p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={createIncident} disabled={busy || scenarios.length === 0}>
                    <Icon name="scan" size={17} /> {busy ? 'Creating incident…' : 'Run scan and create incident'}
                    <Icon name="arrow" size={16} />
                  </button>
                  <button className="secondary-button" onClick={() => refreshHistory()} disabled={historyLoading}>
                    {historyLoading ? 'Refreshing…' : 'Refresh scan history'}
                  </button>
                </div>
              </div>
            </section>

            {notice.text && (
              <div className={`notice ${notice.type || ''}`} role="status">{notice.text}</div>
            )}
            {historyError && <div className="notice error">{historyError}</div>}

            <section className="panel history-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-kicker">AVAILABLE TARGETS</div>
                  <h2>Fixture scenarios</h2>
                  <p>Select a scenario that the backend reports as available.</p>
                </div>
              </div>
              {scenarios.length === 0 ? (
                <div className="history-empty">
                  <h3>No scenarios loaded</h3>
                  <p>Check that the backend is running, then refresh the page.</p>
                </div>
              ) : (
                <div className="scenario-grid">
                  {scenarios.map((scenario) => {
                    const id = scenario.id || scenario.scenario_id;
                    const selected = id === scenarioId;
                    return (
                      <button
                        type="button"
                        key={id || scenario.name}
                        className={`scenario-card ${selected ? 'selected' : ''}`}
                        onClick={() => setScenarioId(id)}
                        aria-pressed={selected}
                      >
                        <span className="scenario-card-icon"><Icon name="bug" size={20} /></span>
                        <strong>{scenario.name || scenario.title || id || 'Fixture scenario'}</strong>
                        <span>{scenario.description || 'Included reproducible test fixture'}</span>
                        <small>{selected ? 'SELECTED' : 'SELECT SCENARIO'}</small>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="panel history-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-kicker">RECENT ACTIVITY</div>
                  <h2>Recent scan incidents</h2>
                </div>
                <button className="secondary-button" onClick={() => setActiveNav('Incidents')}>View all incidents</button>
              </div>
              {incidentHistory.length === 0 ? (
                <div className="history-empty"><p>No scan incidents recorded yet.</p></div>
              ) : (
                <div className="history-table-wrap">
                  <table className="history-table">
                    <thead><tr><th>Incident</th><th>Scenario</th><th>Created</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {incidentHistory.slice(0, 5).map((item) => {
                        const id = getIncidentId(item);
                        return (
                          <tr key={id}>
                            <td><strong className="history-id">#{String(id).slice(0, 8)}</strong></td>
                            <td>{item.scenario_id || '—'}</td>
                            <td>{formatDate(item.created_at)}</td>
                            <td><span className={`history-status ${getStatus(item) === 'Verified' ? 'status-verified' : ''}`}><span />{getStatus(item)}</span></td>
                            <td><button className="history-open-button" onClick={() => openIncident(id)} disabled={!id || busy}>Open <Icon name="arrow" size={14} /></button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        ) : activeNav === 'Settings' ? (
          <div className="page-content">
            <section className="hero compact-hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="eyebrow-line" />
                  WORKSPACE CONFIGURATION
                  <span className="eyebrow-pill">SETTINGS</span>
                </div>
                <h1>Know your environment.<br /><span>Control every repair.</span></h1>
                <p>Review the active local API connection and the safety boundaries of this prototype.</p>
                <div className="hero-actions">
                  <button className="primary-button" onClick={checkBackendHealth} disabled={healthChecking}>
                    <Icon name="settings" size={17} /> {healthChecking ? 'Checking connection…' : 'Check backend health'}
                  </button>
                  <button className="secondary-button" onClick={() => refreshHistory()} disabled={historyLoading}>
                    {historyLoading ? 'Refreshing…' : 'Refresh incident data'}
                  </button>
                </div>
              </div>
            </section>

            {notice.text && <div className={`notice ${notice.type || ''}`} role="status">{notice.text}</div>}

            <div className="history-stats">
              <StatCard icon="settings" label="Environment" value="Local" detail="Development prototype" tone="blue" />
              <StatCard icon="shield" label="Human approval" value="Required" detail="Approval is a workflow stage" tone="cyan" />
              <StatCard icon="bug" label="Fixture scope" value="Limited" detail="Included test fixture only" tone="violet" />
            </div>

            <section className="panel history-panel">
              <div className="panel-heading"><div><div className="panel-kicker">CONNECTION</div><h2>Backend API</h2><p>Configured endpoint used by the frontend.</p></div></div>
              <div className="settings-list">
                <div className="settings-row"><span>API endpoint</span><strong>{API}</strong></div>
                <div className="settings-row"><span>Connection status</span><strong className={backendOnline ? 'settings-good' : 'settings-bad'}>{backendOnline ? 'Connected' : 'Not confirmed'}</strong></div>
                <div className="settings-row"><span>Saved incidents loaded</span><strong>{incidentHistory.length}</strong></div>
              </div>
            </section>

            <section className="panel history-panel">
              <div className="panel-heading"><div><div className="panel-kicker">REPAIR GOVERNANCE</div><h2>Safety policy and limitations</h2></div></div>
              <div className="policy-list">
                <div><Icon name="shield" size={20} /><div><strong>Human approval before applying the patch</strong><p>The workflow records approval as an explicit stage before verification.</p></div></div>
                <div><Icon name="code" size={20} /><div><strong>Fixture-scoped execution</strong><p>The prototype operates on its included buggy-app fixture. Do not point it at arbitrary or production repositories.</p></div></div>
                <div><Icon name="check" size={20} /><div><strong>Verification evidence</strong><p>Post-patch test output is recorded so the repair can be reviewed against the baseline failure.</p></div></div>
                <div><Icon name="settings" size={20} /><div><strong>Not a hardened sandbox</strong><p>This prototype is not a security boundary and should not execute untrusted code.</p></div></div>
              </div>
            </section>
          </div>
        ) : activeNav === 'Reports' ? (
          <div className="page-content">
            <section className="hero compact-hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="eyebrow-line" />
                  ENGINEERING INTELLIGENCE
                  <span className="eyebrow-pill">REPORTS</span>
                </div>
                <h1>Evidence in.<br /><span>Proof on record.</span></h1>
                <p>
                  Review recorded incident evidence and export a shareable repair report.
                  Reports are generated from saved local incident data.
                </p>
                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() => exportIncidentReport(incident)}
                    disabled={!incident}
                  >
                    <Icon name="report" size={17} /> Export current incident report
                    <Icon name="arrow" size={16} />
                  </button>
                  <button className="secondary-button" onClick={() => refreshHistory()} disabled={historyLoading}>
                    {historyLoading ? 'Refreshing…' : 'Refresh reports'}
                  </button>
                </div>
              </div>
            </section>

            <div className="history-stats">
              <StatCard
                icon="report"
                label="Available reports"
                value={incidentHistory.length}
                detail="One report per saved incident"
                tone="blue"
              />
              <StatCard
                icon="shield"
                label="Verified repairs"
                value={incidentHistory.filter((item) => getStatus(item) === 'Verified').length}
                detail="Verification status recorded"
                tone="cyan"
              />
              <StatCard
                icon="bug"
                label="Needs review"
                value={incidentHistory.filter((item) => getStatus(item) !== 'Verified').length}
                detail="Not yet marked verified"
                tone="violet"
              />
            </div>

            {historyError && <div className="notice error">{historyError}</div>}

            <section className="panel history-panel">
              <div className="panel-heading">
                <div>
                  <div className="panel-kicker">SAVED EVIDENCE</div>
                  <h2>Incident repair reports</h2>
                  <p>Select an incident to load its evidence into the dashboard, or export a report directly.</p>
                </div>
              </div>

              {historyLoading && incidentHistory.length === 0 ? (
                <div className="history-empty"><p>Loading saved incidents…</p></div>
              ) : incidentHistory.length === 0 ? (
                <div className="history-empty">
                  <div className="empty-icon"><Icon name="report" size={24} /></div>
                  <h3>No reports available yet</h3>
                  <p>Create an incident and run the repair workflow. Its recorded evidence will appear here.</p>
                  <button className="primary-button" onClick={() => { setActiveNav('Dashboard'); }} >
                    <Icon name="arrow" size={16} /> Go to dashboard
                  </button>
                </div>
              ) : (
                <div className="history-table-wrap">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Incident</th>
                        <th>Scenario</th>
                        <th>Created</th>
                        <th>Status</th>
                        <th>Baseline</th>
                        <th>Verification</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {incidentHistory.map((item) => {
                        const id = getIncidentId(item);
                        const verified = getStatus(item) === 'Verified';
                        return (
                          <tr key={id || `${item.scenario_id}-${item.created_at}`}>
                            <td>
                              <strong className="history-id">#{String(id).slice(0, 8) || '—'}</strong>
                              <span className="history-title">{item.title || 'Incident repair report'}</span>
                            </td>
                            <td>{item.scenario_id || '—'}</td>
                            <td>{formatDate(item.created_at)}</td>
                            <td>
                              <span className={`history-status ${verified ? 'status-verified' : ''}`}>
                                <span />{getStatus(item)}
                              </span>
                            </td>
                            <td>{item.baseline_passed === false ? 'Failure reproduced' : item.baseline_passed === true ? 'Passed' : 'Captured'}</td>
                            <td>{verified ? 'Passed' : item.verification_status || 'Not verified'}</td>
                            <td>
                              <div className="report-actions">
                                <button
                                  className="history-open-button"
                                  onClick={() => openIncident(id)}
                                  disabled={!id || busy}
                                >
                                  Open <Icon name="arrow" size={14} />
                                </button>
                                <button
                                  className="history-open-button"
                                  onClick={() => exportIncidentReport(item)}
                                  disabled={!id}
                                >
                                  Export .txt
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="history-footnote">
                Exported reports contain the evidence fields stored by the prototype. Missing fields are labelled as not recorded; reports do not invent findings.
              </p>
            </section>
          </div>
        ) : activeNav !== 'Dashboard' ? (
          <div className="page-content">
            <section className="panel planned-panel">
              <div className="panel-kicker">SENTINELFORGE WORKSPACE</div>
              <div className="empty-icon"><Icon name={navigation.find(([label]) => label === activeNav)?.[1] || 'spark'} size={25} /></div>
              <h2>{activeNav}</h2>
              <p>
                This section is planned for a future prototype iteration.
                The working incident workflow and saved incident history are available now.
              </p>
              <button className="primary-button" onClick={() => setActiveNav('Dashboard')}>
                <Icon name="arrow" size={16} /> Return to dashboard
              </button>
            </section>
          </div>
        ) : (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="eyebrow-line" />
                  ENGINEERING INTELLIGENCE
                  <span className="eyebrow-pill">EARLY ACCESS</span>
                </div>

                <h1>Fix the failure.<br /><span>Prove the repair.</span></h1>

                <p>
                  Investigate software failures with evidence, review a minimal patch,
                  and verify the fix with reproducible tests.
                </p>

                <div className="hero-points">
                  <span><Icon name="scan" size={15} /> Evidence-first</span>
                  <span><Icon name="code" size={15} /> Minimal patches</span>
                  <span><Icon name="shield" size={15} /> Human-approved</span>
                </div>

                <div className="hero-actions">
                  <button
                    className="primary-button"
                    onClick={() =>
                      document.getElementById('incident-workspace')?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                    }
                  >
                    <Icon name="plus" size={17} />
                    Open repair workspace
                    <Icon name="arrow" size={16} />
                  </button>

                  <span className="hero-caption">
                    <span className="live-dot" />
                    Reproducible repair workflow
                  </span>
                </div>
              </div>

              <div className="hero-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <div className="orbit orbit-three" />
                <div className="orbit-core">
                  <div className="crystal">
                    <span /><span /><span /><span />
                  </div>
                </div>
                <div className="art-label art-label-top"><span /> TRACE / 001</div>
                <div className="art-label art-label-bottom">EVIDENCE → REPAIR</div>
                <div className="art-cross cross-one">+</div>
                <div className="art-cross cross-two">+</div>
                <div className="art-scanline" />
              </div>

              <div className="hero-side-note">
                REPAIR<br />WITH PROOF<span>—</span>NOT GUESSWORK
              </div>
            </section>

            <section className="stats-grid" aria-label="Incident status summary">
              <StatCard
                icon="bug"
                label="Current incident"
                value={incidentId ? `#${String(incidentId).slice(0, 8)}` : '—'}
                detail={incident ? 'Active repair session' : 'No incident selected'}
                tone="blue"
              />
              <StatCard
                icon="scan"
                label="Baseline result"
                value={
                  baselineText
                    ? (baselineText.match(/\d+ failed/i)?.[0] || 'Captured')
                    : 'Awaiting'
                }
                detail={baselineText ? 'Failure reproduced' : 'Create an incident to begin'}
                tone="violet"
              />
              <StatCard
                icon="code"
                label="Patch review"
                value={patch ? (isApproved ? 'Approved' : 'Proposed') : 'Pending'}
                detail={
                  patch
                    ? (isApproved ? 'Human approval recorded' : 'Review required before verify')
                    : 'No patch proposed yet'
                }
                tone="cyan"
              />
              <StatCard
                icon="shield"
                label="Verification"
                value={isVerified ? 'Passed' : 'Not run'}
                detail={isVerified ? 'Post-patch tests passed' : 'Tests run after approval'}
                tone="pink"
              />
            </section>

            {notice.text && (
              <div className={`notice ${notice.type}`} role="status">
                <span>
                  {notice.type === 'error' ? '!' : notice.type === 'success' ? '✓' : 'i'}
                </span>
                {notice.text}
                <button
                  onClick={() => setNotice({ type: '', text: '' })}
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
            )}

            <section className="workspace-grid" id="incident-workspace">
              <div className="panel workflow-panel">
                <div className="panel-heading">
                  <div>
                    <div className="panel-kicker">REPAIR WORKSPACE</div>
                    <h2>Start an investigation</h2>
                    <p>Reproduce a known failure, then work through the evidence-led repair flow.</p>
                  </div>
                  <span className="ai-tag"><Icon name="spark" size={13} /> ENGINE</span>
                </div>

                <label className="field-label" htmlFor="scenario">Test scenario</label>

                <div className="select-wrap">
                  <select
                    id="scenario"
                    value={scenarioId}
                    onChange={(event) => setScenarioId(event.target.value)}
                    disabled={busy}
                  >
                    {scenarios.length ? (
                      scenarios.map((item) => (
                        <option
                          key={item.id || item.scenario_id}
                          value={item.id || item.scenario_id}
                        >
                          {item.name || item.title || item.id || item.scenario_id}
                        </option>
                      ))
                    ) : (
                      <option value="login-regression">Login regression · fixture scenario</option>
                    )}
                  </select>
                  <span>⌄</span>
                </div>

                <button
                  className="primary-button full-button"
                  onClick={createIncident}
                  disabled={busy || !scenarioId}
                >
                  <Icon name="spark" size={16} />
                  {busy ? 'Working…' : incident ? 'Create another incident' : 'Create incident & reproduce'}
                  <Icon name="arrow" size={16} />
                </button>

                <div className="workflow-divider" />

                <div className="section-row">
                  <h3>Repair sequence</h3>
                  <span>{stage === 5 ? '5 / 5 COMPLETE' : `${stage} / 5 COMPLETE`}</span>
                </div>

                <div className="stage-list">
                  <Stage number="01" title="Detect & reproduce" description="Capture the failing baseline test" status={stage >= 1 ? 'done' : incident ? 'active' : 'pending'} active={stage === 0} />
                  <Stage number="02" title="Investigate evidence" description="Trace the failure to its cause" status={stage >= 2 ? 'done' : stage === 1 ? 'active' : 'pending'} active={stage === 1} />
                  <Stage number="03" title="Propose a patch" description="Review the minimal code change" status={stage >= 3 ? 'done' : stage === 2 ? 'active' : 'pending'} active={stage === 2} />
                  <Stage number="04" title="Human approval" description="Approve before patch verification" status={stage >= 4 ? 'done' : stage === 3 ? 'active' : 'pending'} active={stage === 3} />
                  <Stage number="05" title="Verify the repair" description="Rerun tests and record the result" status={stage >= 5 ? 'done' : stage === 4 ? 'active' : 'pending'} active={stage === 4} />
                </div>
              </div>

              <div className="panel evidence-panel">
                <div className="panel-heading">
                  <div>
                    <div className="panel-kicker">LIVE INCIDENT VIEW</div>
                    <h2>Incident evidence</h2>
                    <p>Every proposed repair should be backed by reproducible results.</p>
                  </div>
                  <span className={`status-pill ${isVerified ? 'passed' : incident ? 'active' : ''}`}>
                    <span />
                    {isVerified ? 'VERIFIED' : incident ? 'IN SESSION' : 'NO INCIDENT'}
                  </span>
                </div>

                {!incident ? (
                  <div className="empty-state">
                    <div className="empty-icon"><Icon name="shield" size={25} /></div>
                    <h3>Your evidence trail starts here</h3>
                    <p>Create an incident to view its baseline test output, investigation findings, proposed patch, approval state, and verification result.</p>
                    <button className="secondary-button" onClick={createIncident} disabled={busy}>
                      <Icon name="plus" size={15} /> Create first incident
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="incident-title-row">
                      <div>
                        <span className="micro-label">INCIDENT ID</span>
                        <strong>{incidentId || 'Active incident'}</strong>
                      </div>
                      <span className={`severity-tag ${isVerified ? 'severity-ok' : 'severity-warn'}`}>
                        {isVerified ? 'REPAIRED' : 'UNDER REVIEW'}
                      </span>
                    </div>

                    <div className="evidence-block">
                      <div className="evidence-heading">
                        <span className="evidence-icon"><Icon name="scan" size={16} /></span>
                        <div><strong>01 / Baseline reproduction</strong><span>Original test run</span></div>
                        <span className={`mini-state ${baselineText ? 'captured' : ''}`}>{baselineText ? 'CAPTURED' : 'PENDING'}</span>
                      </div>
                      {baselineText ? (
                        <pre className="terminal-output"><span className="terminal-prompt">$</span> pytest · baseline{'\n'}{baselineText}</pre>
                      ) : <p className="muted-note">Baseline output is not available for this incident yet.</p>}
                    </div>

                    <div className="evidence-block">
                      <div className="evidence-heading">
                        <span className="evidence-icon violet-icon"><Icon name="spark" size={16} /></span>
                        <div><strong>02 / Root-cause findings</strong><span>Investigation summary</span></div>
                        <span className={`mini-state ${investigationText ? 'captured' : ''}`}>{investigationText ? 'FOUND' : 'PENDING'}</span>
                      </div>
                      {investigationText ? (
                        <div className="finding-box">{investigationText}</div>
                      ) : (
                        <>
                          <p className="muted-note">Run the investigation to collect the diagnosis.</p>
                          <button className="action-button" disabled={busy} onClick={() => runAction('investigate', 'Investigation completed.')}>Investigate evidence <Icon name="arrow" size={15} /></button>
                        </>
                      )}
                    </div>

                    <div className="evidence-block">
                      <div className="evidence-heading">
                        <span className="evidence-icon blue-icon"><Icon name="code" size={16} /></span>
                        <div><strong>03 / Proposed repair</strong><span>Patch for human review</span></div>
                        <span className={`mini-state ${patchText ? 'captured' : ''}`}>{patchText ? 'PROPOSED' : 'PENDING'}</span>
                      </div>
                      {patchText ? (
                        <pre className="patch-output">{patchText}</pre>
                      ) : (
                        <>
                          <p className="muted-note">Generate a proposed patch after investigating.</p>
                          <button className="action-button" disabled={busy || !investigationText} onClick={() => runAction('propose-patch', 'Patch proposal generated for review.')}>Propose patch <Icon name="arrow" size={15} /></button>
                        </>
                      )}

                      {patchText && !isApproved && (
                        <button className="primary-button full-button approve-button" disabled={busy} onClick={() => runAction('approve-patch', 'Patch approval recorded. You can now verify the repair.')}>
                          <Icon name="check" size={16} /> {busy ? 'Working…' : 'Approve proposed patch'}
                        </button>
                      )}

                      {isApproved && !isVerified && (
                        <button className="primary-button full-button" disabled={busy} onClick={() => runAction('verify', 'Verification finished. Review the test output.')}>
                          <Icon name="shield" size={16} /> {busy ? 'Verifying…' : 'Run verification tests'} <Icon name="arrow" size={16} />
                        </button>
                      )}

                      {isApproved && (
                        <div className="finding-box approval-box">
                          <Icon name="check" size={16} />
                          <span><strong>04 / Human approval</strong><br />Human approval recorded</span>
                        </div>
                      )}
                    </div>

                    <div className="evidence-block">
                      <div className="evidence-heading">
                        <span className="evidence-icon cyan-icon"><Icon name="check" size={16} /></span>
                        <div><strong>05 / Verification result</strong><span>Post-patch test run</span></div>
                        <span className={`mini-state ${isVerified ? 'captured' : ''}`}>{isVerified ? 'PASSED' : verificationText ? 'RESULT' : 'PENDING'}</span>
                      </div>
                      {verificationText ? (
                        <pre className="terminal-output success-output"><span className="terminal-prompt">$</span> pytest · verification{'\n'}{verificationText}</pre>
                      ) : (
                        <p className="muted-note">{isApproved ? 'Run verification tests to display the post-patch result.' : 'Verification results will appear here after the patch is approved and tested.'}</p>
                      )}
                    </div>
                  </>
                )}

                <div className="panel-footnote">
                  <Icon name="shield" size={14} />
                  <span>
                    {isVerified
                      ? 'Verification passed. The recorded result is shown above. Prototype runs are limited to the included fixture scenario.'
                      : isApproved
                        ? 'Human approval is recorded. Run verification to confirm the repair. Prototype runs are limited to the included fixture scenario.'
                        : patch
                          ? 'The patch is proposed for review. Human approval is required before verification. Prototype runs are limited to the included fixture scenario.'
                          : 'Human approval is required before verification. Prototype runs are limited to the included fixture scenario.'}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        <footer className="page-footer">
          <div><span className="footer-mark">◆</span> SENTINELFORGE <span className="footer-version">BUILD 0.1.0</span></div>
          <span>Evidence over guesswork. Repairs with proof.</span>
        </footer>
      </main>
    </div>
  );
}