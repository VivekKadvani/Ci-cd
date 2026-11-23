import { useState, useEffect, useMemo } from 'react';

/* ============================================================
   1. DESIGN TOKENS (injected once via <style>)
   ============================================================ */
const GlobalStyles = () => (
    <style>{`
    :root {
      --bg: #0f1117;
      --surface: #171a23;
      --surface-2: #1e222e;
      --border: #262a36;
      --text: #e6e8ee;
      --muted: #8b90a0;
      --primary: #6366f1;
      --primary-soft: rgba(99,102,241,0.12);
      --success: #22c55e;
      --success-soft: rgba(34,197,94,0.12);
      --info: #38bdf8;
      --info-soft: rgba(56,189,248,0.12);
      --warning: #f59e0b;
      --warning-soft: rgba(245,158,11,0.12);
      --danger: #ef4444;
      --danger-soft: rgba(239,68,68,0.12);
      --radius-sm: 8px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --shadow: 0 4px 24px rgba(0,0,0,0.35);
      --font: 'Inter', system-ui, -apple-system, sans-serif;
    }
    [data-theme="light"] {
      --bg: #f5f6fa;
      --surface: #ffffff;
      --surface-2: #f0f2f7;
      --border: #e3e6ee;
      --text: #16181f;
      --muted: #5f6470;
      --shadow: 0 4px 24px rgba(20,20,40,0.08);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
      transition: background 0.25s ease, color 0.25s ease;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `}</style>
);

/* ============================================================
   2. SHARED STYLE OBJECTS (keeps JSX clean, avoids repetition)
   ============================================================ */
const styles = {
    container: {
        maxWidth: 960,
        margin: '0 auto',
        padding: '24px 16px',
        minHeight: '100vh',
    },
    pill: (color, bg) => ({
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: 999,
        fontSize: '0.72rem',
        fontWeight: 600,
        letterSpacing: '0.03em',
        color,
        background: bg,
    }),
    card: {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow)',
    },
    sectionTitle: {
        fontSize: '0.78rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--muted)',
        marginBottom: 16,
    },
    iconBtn: {
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        width: 40,
        height: 40,
        cursor: 'pointer',
        fontSize: '1.1rem',
        color: 'var(--text)',
        transition: 'border-color 0.2s, transform 0.2s',
    },
};

/* ============================================================
   3. DATA
   ============================================================ */
const PIPELINE_STAGES = [
    {
        id: 'install',
        label: 'Install',
        icon: '📦',
        status: 'passed',
        duration: '18s',
    },
    {
        id: 'build',
        label: 'Build',
        icon: '🔨',
        status: 'passed',
        duration: '42s',
    },
    {
        id: 'test',
        label: 'Test',
        icon: '🧪',
        status: 'passed',
        duration: '26s',
    },
    {
        id: 'deploy',
        label: 'Deploy',
        icon: '🚀',
        status: 'live',
        duration: '12s',
    },
];

const STEPS = [
    {
        title: 'Trigger',
        description: 'A push to main wakes the runner. No manual action.',
        icon: '⚡',
    },
    {
        title: 'Continuous Integration',
        description:
            'Dependencies install, tests run, and the production bundle builds. Any failure halts the pipeline.',
        icon: '🔁',
    },
    {
        title: 'Continuous Deployment',
        description:
            'The verified artifact is published to production — automated, reproducible, and safe.',
        icon: '🌍',
    },
];

const RUN_HISTORY = [
    {
        id: 128,
        branch: 'main',
        commit: 'feat: add dashboard UI',
        status: 'success',
        time: '2 min ago',
    },
    {
        id: 127,
        branch: 'main',
        commit: 'fix: pipeline config',
        status: 'success',
        time: '1 hr ago',
    },
    {
        id: 126,
        branch: 'feature',
        commit: 'wip: pipeline cards',
        status: 'failed',
        time: '3 hr ago',
    },
    {
        id: 125,
        branch: 'main',
        commit: 'chore: init project',
        status: 'success',
        time: '1 day ago',
    },
];

/* ============================================================
   4. UI PRIMITIVES
   ============================================================ */
function StatusBadge({ status }) {
    const map = {
        passed: {
            label: 'Passed',
            color: 'var(--success)',
            bg: 'var(--success-soft)',
        },
        live: { label: 'Live', color: 'var(--info)', bg: 'var(--info-soft)' },
        pending: {
            label: 'Pending',
            color: 'var(--warning)',
            bg: 'var(--warning-soft)',
        },
        success: {
            label: 'Success',
            color: 'var(--success)',
            bg: 'var(--success-soft)',
        },
        failed: {
            label: 'Failed',
            color: 'var(--danger)',
            bg: 'var(--danger-soft)',
        },
    };
    const cfg = map[status] || map.pending;
    return <span style={styles.pill(cfg.color, cfg.bg)}>{cfg.label}</span>;
}

function ThemeToggle({ theme, onToggle }) {
    return (
        <button
            onClick={onToggle}
            aria-label="Toggle theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={styles.iconBtn}
            onMouseEnter={(e) =>
                (e.currentTarget.style.transform = 'scale(1.05)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
            {theme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
}

/* ============================================================
   5. FEATURE COMPONENTS
   ============================================================ */
function Header({ theme, onToggleTheme }) {
    return (
        <header style={{ marginBottom: 32 }}>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                }}
            >
                <span
                    style={styles.pill('var(--primary)', 'var(--primary-soft)')}
                >
                    ● CI/CD Dashboard
                </span>
                <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 12 }}>
                <h1
                    style={{
                        fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                        fontWeight: 700,
                        marginBottom: 12,
                    }}
                >
                    My First CI/CD Project
                </h1>
                <p
                    style={{
                        color: 'var(--muted)',
                        maxWidth: 560,
                        margin: '0 auto',
                        lineHeight: 1.6,
                    }}
                >
                    From local commit to automated deployment — live status,
                    zero manual steps.
                </p>
            </div>
        </header>
    );
}

function PipelineCard({ icon, label, status, duration, delay }) {
    const isLive = status === 'live';
    return (
        <div
            style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                textAlign: 'center',
                transition: 'transform 0.2s, border-color 0.2s',
                animation: `slideUp 0.4s ease ${delay}ms backwards`,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border)';
            }}
        >
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{icon}</div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>
                {label}
            </h3>
            <div
                style={{
                    fontSize: '0.78rem',
                    color: 'var(--muted)',
                    marginBottom: 12,
                }}
            >
                {duration}
            </div>
            {isLive ? (
                <span
                    style={{
                        ...styles.pill('var(--info)', 'var(--info-soft)'),
                        animation: 'pulse 1.8s ease-in-out infinite',
                    }}
                >
                    ● Live
                </span>
            ) : (
                <StatusBadge status={status} />
            )}
        </div>
    );
}

function PipelineFlow({ stages }) {
    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16,
            }}
        >
            {stages.map((stage, i) => (
                <PipelineCard key={stage.id} {...stage} delay={i * 80} />
            ))}
        </div>
    );
}

function StepCard({ index, title, description, icon }) {
    return (
        <div
            style={{
                display: 'flex',
                gap: 16,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: 20,
                transition: 'border-color 0.2s',
                animation: `slideUp 0.4s ease ${index * 80}ms backwards`,
            }}
            onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = 'var(--primary)')
            }
            onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = 'var(--border)')
            }
        >
            <div
                style={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    background: 'var(--primary-soft)',
                    color: 'var(--primary)',
                    borderRadius: 'var(--radius-sm)',
                }}
            >
                {icon}
            </div>
            <div>
                <div
                    style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        marginBottom: 6,
                    }}
                >
                    <span
                        style={{
                            fontSize: '0.72rem',
                            color: 'var(--primary)',
                            fontWeight: 600,
                        }}
                    >
                        STEP {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 style={{ fontSize: '1rem' }}>{title}</h3>
                </div>
                <p
                    style={{
                        color: 'var(--muted)',
                        fontSize: '0.92rem',
                        lineHeight: 1.6,
                    }}
                >
                    {description}
                </p>
            </div>
        </div>
    );
}

function HowItWorks({ steps }) {
    return (
        <section style={{ marginTop: 48 }}>
            <h2 style={styles.sectionTitle}>How It Works</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {steps.map((step, i) => (
                    <StepCard key={step.title} index={i} {...step} />
                ))}
            </div>
        </section>
    );
}

function RunHistory({ runs }) {
    return (
        <section style={{ marginTop: 48 }}>
            <h2 style={styles.sectionTitle}>Recent Runs</h2>
            <div style={{ ...styles.card, padding: 0, overflow: 'hidden' }}>
                {runs.map((run, i) => (
                    <div
                        key={run.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '16px 20px',
                            borderBottom:
                                i < runs.length - 1
                                    ? '1px solid var(--border)'
                                    : 'none',
                            transition: 'background 0.2s',
                            flexWrap: 'wrap',
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.background =
                                'var(--surface-2)')
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                        }
                    >
                        <span
                            style={{
                                color: 'var(--muted)',
                                fontSize: '0.85rem',
                                width: 60,
                            }}
                        >
                            #{run.id}
                        </span>
                        <code
                            style={{
                                fontSize: '0.78rem',
                                background: 'var(--surface-2)',
                                padding: '2px 8px',
                                borderRadius: 6,
                                color: 'var(--primary)',
                            }}
                        >
                            {run.branch}
                        </code>
                        <span
                            style={{
                                flex: 1,
                                minWidth: 180,
                                fontSize: '0.9rem',
                            }}
                        >
                            {run.commit}
                        </span>
                        <span
                            style={{
                                color: 'var(--muted)',
                                fontSize: '0.8rem',
                            }}
                        >
                            {run.time}
                        </span>
                        <StatusBadge status={run.status} />
                    </div>
                ))}
            </div>
        </section>
    );
}

function StatsBar({ stages }) {
    const stats = useMemo(() => {
        const passed = stages.filter(
            (s) => s.status === 'passed' || s.status === 'live',
        ).length;
        const total = stages.length;
        const percent = Math.round((passed / total) * 100);
        return { passed, total, percent };
    }, [stages]);

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12,
                marginBottom: 24,
            }}
        >
            {[
                {
                    label: 'Pipeline',
                    value: `${stats.passed}/${stats.total} passed`,
                    accent: 'var(--success)',
                },
                {
                    label: 'Health',
                    value: `${stats.percent}%`,
                    accent: 'var(--primary)',
                },
                { label: 'Trigger', value: 'on: push', accent: 'var(--info)' },
            ].map((s) => (
                <div
                    key={s.label}
                    style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        padding: 16,
                    }}
                >
                    <div
                        style={{
                            fontSize: '0.72rem',
                            color: 'var(--muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                        }}
                    >
                        {s.label}
                    </div>
                    <div
                        style={{
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            marginTop: 4,
                            color: s.accent,
                        }}
                    >
                        {s.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ============================================================
   6. ROOT APP
   ============================================================ */
export default function App() {
    const [theme, setTheme] = useState(() => {
        if (typeof window === 'undefined') return 'dark';
        return localStorage.getItem('cicd-theme') || 'dark';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('cicd-theme', theme);
    }, [theme]);

    const toggleTheme = () =>
        setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

    return (
        <>
            <GlobalStyles />
            <main style={styles.container}>
                <Header theme={theme} onToggleTheme={toggleTheme} />

                <StatsBar stages={PIPELINE_STAGES} />

                <section style={styles.card}>
                    <h2 style={styles.sectionTitle}>Pipeline Status</h2>
                    <PipelineFlow stages={PIPELINE_STAGES} />
                </section>

                <HowItWorks steps={STEPS} />
                <RunHistory runs={RUN_HISTORY} />

                <footer
                    style={{
                        textAlign: 'center',
                        color: 'var(--muted)',
                        fontSize: '0.85rem',
                        padding: '40px 0 8px',
                    }}
                >
                    ✅ Learning automated deployment — one push at a time.
                </footer>
            </main>
        </>
    );
}
