
import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API = 'http://127.0.0.1:8000/api';

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.detail || data.message || `Request failed (${response.status})`
    );
  }

  return data;
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

export default function App() {
  const [scenarios, setScenarios] = useState([]);
  const [scenarioId, setScenarioId] = useState('login-regression');
  const [incident, setIncident] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });
  const [backendOnline, setBackendOnline] = useState(false);
  const [activeNav, setActiveNav] = useState('Dashboard');

  useEffect(() => {
    let cancelled = false;

    async function restoreWorkspace() {
      try {
        const data = await request('/scenarios');
        if (cancelled) return;

        const list = Array.isArray(data)
          ? data
          : data.scenarios || data.items || [];

        setScenarios(list);

        if (list[0]?.id || list[0]?.scenario_id) {
          setScenarioId(list[0].id || list[0].scenario_id);
        }

        setBackendOnline(true);

        // Restore the last incident after a page refresh.
        const savedIncidentId = window.localStorage.getItem('sentinelforge:lastIncidentId');
        if (savedIncidentId) {
          try {
            const savedIncident = await request(`/incidents/${encodeURIComponent(savedIncidentId)}`);
            if (cancelled) return;
            setIncident(savedIncident);
            setNotice({
              type: 'success',
              text: `Restored incident ${savedIncident.id || savedIncidentId}. Your evidence trail is loaded.`,
            });
          } catch (restoreError) {
            if (cancelled) return;
            // Remove stale IDs, but keep the application usable.
            if (restoreError.message.includes('404')) {
              window.localStorage.removeItem('sentinelforge:lastIncidentId');
              setNotice({
                type: 'info',
                text: 'The previously selected incident is no longer available in the backend. Create a new incident to begin.',
              });
            } else {
              setNotice({
                type: 'error',
                text: `Could not restore the previous incident: ${restoreError.message}`,
              });
            }
          }
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

  const incidentId = incident?.id || incident?.incident_id;

  // FIX: Read the actual field names returned by the FastAPI backend.
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

  const patch =
    incident?.proposed_patch ||
    incident?.patch ||
    null;

  const verification =
    incident?.verification_output ||
    incident?.verification ||
    incident?.verification_result ||
    null;

  const approval =
    incident?.approval_status ||
    incident?.approval ||
    '';

  const baselineText =
    typeof baseline === 'string'
      ? baseline
      : baseline?.output ||
        baseline?.summary ||
        baseline?.message ||
        '';

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
      : patch?.diff ||
        patch?.patch ||
        patch?.description ||
        patch?.summary ||
        '';

  const verificationText =
    typeof verification === 'string'
      ? verification
      : verification?.output ||
        verification?.summary ||
        verification?.message ||
        '';

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
      await request(`/incidents/${incidentId}/${action}`, {
        method: 'POST',
        body: '{}',
      });

      // Fetch the complete incident so all evidence fields are refreshed.
      const refreshed = await request(`/incidents/${incidentId}`);
      setIncident(refreshed);
      window.localStorage.setItem('sentinelforge:lastIncidentId', String(refreshed.id || incidentId));

      setNotice({ type: 'success', text: successMessage });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
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

      const id = created.id || created.incident_id;
      const full = id ? await request(`/incidents/${id}`) : created;

      setIncident(full);
      setBackendOnline(true);
      if (full?.id || full?.incident_id) {
        window.localStorage.setItem(
          'sentinelforge:lastIncidentId',
          String(full.id || full.incident_id)
        );
      }

      setNotice({
        type: 'success',
        text: 'Incident created. Baseline reproduction is ready for investigation.',
      });
    } catch (error) {
      setNotice({ type: 'error', text: error.message });
    } finally {
      setBusy(false);
    }
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

                if (label !== 'Dashboard') {
                  setNotice({
                    type: 'info',
                    text: `${label} is a visual navigation placeholder in this prototype. The working incident workflow is on Dashboard.`,
                  });
                } else {
                  setNotice({ type: '', text: '' });
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
              <kbd>⌘ K</kbd>
            </div>

            <div className="environment">
              <span /> LOCAL ENVIRONMENT <span className="env-chevron">⌄</span>
            </div>

            <button className="avatar" title="SentinelForge workspace">SF</button>
          </div>
        </header>

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
              {notice.type === 'error'
                ? '!'
                : notice.type === 'success'
                  ? '✓'
                  : 'i'}
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
                  <option value="login-regression">
                    Login regression · fixture scenario
                  </option>
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
              {busy
                ? 'Working…'
                : incident
                  ? 'Create another incident'
                  : 'Create incident & reproduce'}
              <Icon name="arrow" size={16} />
            </button>

            <div className="workflow-divider" />

            <div className="section-row">
              <h3>Repair sequence</h3>
              <span>{stage === 5 ? '5 / 5 COMPLETE' : `${stage} / 5 COMPLETE`}</span>
            </div>

            <div className="stage-list">
              <Stage
                number="01"
                title="Detect & reproduce"
                description="Capture the failing baseline test"
                status={stage >= 1 ? 'done' : incident ? 'active' : 'pending'}
                active={stage === 0}
              />
              <Stage
                number="02"
                title="Investigate evidence"
                description="Trace the failure to its cause"
                status={stage >= 2 ? 'done' : stage === 1 ? 'active' : 'pending'}
                active={stage === 1}
              />
              <Stage
                number="03"
                title="Propose a patch"
                description="Review the minimal code change"
                status={stage >= 3 ? 'done' : stage === 2 ? 'active' : 'pending'}
                active={stage === 2}
              />
              <Stage
                number="04"
                title="Human approval"
                description="Approve before patch verification"
                status={stage >= 4 ? 'done' : stage === 3 ? 'active' : 'pending'}
                active={stage === 3}
              />
              <Stage
                number="05"
                title="Verify the repair"
                description="Rerun tests and record the result"
                status={stage >= 5 ? 'done' : stage === 4 ? 'active' : 'pending'}
                active={stage === 4}
              />
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
                <p>
                  Create an incident to view its baseline test output, investigation
                  findings, proposed patch, approval state, and verification result.
                </p>
                <button
                  className="secondary-button"
                  onClick={createIncident}
                  disabled={busy}
                >
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
                    <div>
                      <strong>01 / Baseline reproduction</strong>
                      <span>Original test run</span>
                    </div>
                    <span className={`mini-state ${baselineText ? 'captured' : ''}`}>
                      {baselineText ? 'CAPTURED' : 'PENDING'}
                    </span>
                  </div>

                  {baselineText ? (
                    <pre className="terminal-output">
                      <span className="terminal-prompt">$</span> pytest · baseline
                      {'\n'}{baselineText}
                    </pre>
                  ) : (
                    <p className="muted-note">
                      Baseline output is not available for this incident yet.
                    </p>
                  )}
                </div>

                <div className="evidence-block">
                  <div className="evidence-heading">
                    <span className="evidence-icon violet-icon"><Icon name="spark" size={16} /></span>
                    <div>
                      <strong>02 / Root-cause findings</strong>
                      <span>Investigation summary</span>
                    </div>
                    <span className={`mini-state ${investigationText ? 'captured' : ''}`}>
                      {investigationText ? 'FOUND' : 'PENDING'}
                    </span>
                  </div>

                  {investigationText ? (
                    <div className="finding-box">{investigationText}</div>
                  ) : (
                    <>
                      <p className="muted-note">Run the investigation to collect the diagnosis.</p>
                      <button
                        className="action-button"
                        disabled={busy}
                        onClick={() => runAction('investigate', 'Investigation completed.')}
                      >
                        Investigate evidence <Icon name="arrow" size={15} />
                      </button>
                    </>
                  )}
                </div>

                <div className="evidence-block">
                  <div className="evidence-heading">
                    <span className="evidence-icon blue-icon"><Icon name="code" size={16} /></span>
                    <div>
                      <strong>03 / Proposed repair</strong>
                      <span>Patch for human review</span>
                    </div>
                    <span className={`mini-state ${patchText ? 'captured' : ''}`}>
                      {patchText ? 'PROPOSED' : 'PENDING'}
                    </span>
                  </div>

                  {patchText ? (
                    <pre className="patch-output">{patchText}</pre>
                  ) : (
                    <>
                      <p className="muted-note">Generate a proposed patch after investigating.</p>
                      <button
                        className="action-button"
                        disabled={busy || !investigationText}
                        onClick={() => runAction('propose-patch', 'Patch proposal generated for review.')}
                      >
                        Propose patch <Icon name="arrow" size={15} />
                      </button>
                    </>
                  )}

                  {patchText && !isApproved && (
                    <button
                      className="primary-button full-button approve-button"
                      disabled={busy}
                      onClick={() => runAction(
                        'approve-patch',
                        'Patch approval recorded. You can now verify the repair.'
                      )}
                    >
                      <Icon name="check" size={16} />
                      {busy ? 'Working…' : 'Approve proposed patch'}
                    </button>
                  )}

                  {isApproved && !isVerified && (
                    <button
                      className="primary-button full-button"
                      disabled={busy}
                      onClick={() => runAction(
                        'verify',
                        'Verification finished. Review the test output.'
                      )}
                    >
                      <Icon name="shield" size={16} />
                      {busy ? 'Verifying…' : 'Run verification tests'}
                      <Icon name="arrow" size={16} />
                    </button>
                  )}

                  {isApproved && (
                    <div className="finding-box approval-box">
                      <Icon name="check" size={16} />
                      <span>
                        <strong>04 / Human approval</strong>
                        <br />
                        Human approval recorded
                      </span>
                    </div>
                  )}
                </div>

                <div className="evidence-block">
                  <div className="evidence-heading">
                    <span className="evidence-icon cyan-icon"><Icon name="check" size={16} /></span>
                    <div>
                      <strong>05 / Verification result</strong>
                      <span>Post-patch test run</span>
                    </div>
                    <span className={`mini-state ${isVerified ? 'captured' : ''}`}>
                      {isVerified ? 'PASSED' : verificationText ? 'RESULT' : 'PENDING'}
                    </span>
                  </div>

                  {verificationText ? (
                    <pre className="terminal-output success-output">
                      <span className="terminal-prompt">$</span> pytest · verification
                      {'\n'}{verificationText}
                    </pre>
                  ) : (
                    <p className="muted-note">
                      {isApproved
                        ? 'Run verification tests to display the post-patch result.'
                        : 'Verification results will appear here after the patch is approved and tested.'}
                    </p>
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

        <footer className="page-footer">
          <div>
            <span className="footer-mark">◆</span> SENTINELFORGE
            <span className="footer-version">BUILD 0.1.0</span>
          </div>
          <span>Evidence over guesswork. Repairs with proof.</span>
        </footer>
      </main>
    </div>
  );
}
