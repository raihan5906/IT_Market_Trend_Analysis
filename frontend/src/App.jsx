import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  BarChart3, Network, BrainCircuit, TrendingUp, LineChart as ForecastIcon,
  Building2, Search, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2, X, Plus,
  Globe, RefreshCw
} from 'lucide-react';

const API = 'http://localhost:8000/api';

const DEFAULT_SKILL_OPTIONS = [
  'Python', 'SQL', 'Machine Learning', 'Scikit-Learn', 'Deep Learning',
  'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'Apache Spark',
  'AWS', 'Microsoft Azure', 'Google Cloud Platform', 'Docker', 'Kubernetes',
  'CI/CD', 'Git', 'Linux/Bash', 'React', 'Node.js', 'REST API',
  'Power BI', 'Tableau', 'Excel', 'Selenium', 'Postman', 'Network Security'
];

const ROLE_LEAKAGE_TERMS = [
  'software developer', 'software engineer', 'data scientist', 'data analyst',
  'business analyst', 'machine learning engineer', 'ml engineer', 'data engineer',
  'cloud & devops engineer', 'devops engineer', 'qa & test engineer',
  'test engineer', 'cybersecurity analyst'
];

function stripRoleLeakage(text) {
  let cleaned = String(text || '');
  ROLE_LEAKAGE_TERMS.forEach((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), '');
  });
  return cleaned.replace(/\s{2,}/g, ' ').trim();
}

function getCompanyYearlyRows(comp) {
  if (Array.isArray(comp?.yearly) && comp.yearly.length > 0) {
    return comp.yearly;
  }
  const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
  const periodStr = String(comp?.hiring_period || '');
  const match = periodStr.match(/(\d{4}).*?(\d{4})/);
  const startYr = match ? Number(match[1]) : 2022;
  const endYr = match ? Number(match[2]) : startYr;
  const active = years.filter(y => y >= startYr && y <= endYr);
  const buckets = active.length > 0 ? active : [2022];
  const total = Number(comp?.posting_count || 0);
  const base = Math.floor(total / buckets.length);
  const rem = total % buckets.length;

  let prev = null;
  return years.map((yr) => {
    const idx = buckets.indexOf(yr);
    const postings = idx >= 0 ? base + (idx < rem ? 1 : 0) : 0;
    const yoy_pct = prev == null
      ? null
      : prev > 0
        ? Number((((postings - prev) / prev) * 100).toFixed(2))
        : postings > 0 ? 100.0 : null;
    prev = postings;
    return { year: yr, postings, yoy_pct };
  });
}

function SearchableSelect({ label, options, value, onChange, placeholder = 'Type to search...' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const safeOptions = Array.isArray(options) ? options : [];
  const filtered = useMemo(
    () => safeOptions.filter(opt => opt.toLowerCase().includes(query.toLowerCase())),
    [safeOptions, query]
  );

  return (
    <div className="relative w-full max-w-md">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={open ? query : (value || '')}
          onFocus={() => { setOpen(true); setQuery(''); }}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {open && (
        <ul className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg text-sm">
          {filtered.length === 0 ? (
            <li className="px-4 py-2 text-slate-400">No matches found</li>
          ) : (
            filtered.map(opt => (
              <li
                key={opt}
                onMouseDown={() => { onChange(opt); setOpen(false); setQuery(''); }}
                className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 ${
                  opt === value ? 'bg-indigo-100 font-semibold text-indigo-700' : 'text-slate-700'
                }`}
              >
                {opt}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

function MultiOptionSearch({ label, options, selectedOptions, onToggleOption, onClearAll, placeholder = 'Search multiple options...' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const safeOptions = Array.isArray(options) ? options : [];
  const filtered = useMemo(
    () => safeOptions.filter(opt => opt.toLowerCase().includes(query.toLowerCase())),
    [safeOptions, query]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</label>
        {selectedOptions.length > 0 && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold text-indigo-600 hover:underline"
          >
            Clear ({selectedOptions.length})
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {open && (
          <ul className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg text-sm">
            {filtered.length === 0 ? (
              <li className="px-4 py-2 text-slate-400">No matching options</li>
            ) : (
              filtered.map(opt => {
                const active = selectedOptions.includes(opt);
                return (
                  <li
                    key={opt}
                    onMouseDown={() => onToggleOption(opt)}
                    className={`px-4 py-2 cursor-pointer flex items-center justify-between hover:bg-indigo-50 ${
                      active ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    <span>{opt}</span>
                    <span className="text-xs font-bold">{active ? 'Selected' : '+ Add'}</span>
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedOptions.map(opt => (
            <span
              key={opt}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800"
            >
              {opt}
              <button
                type="button"
                onClick={() => onToggleOption(opt)}
                className="hover:text-indigo-950"
                aria-label={`Remove ${opt}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState('demand');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API Data States
  const [m1, setM1] = useState(null);
  const [m2, setM2] = useState(null);
  const [m3Meta, setM3Meta] = useState(null);
  const [m4, setM4] = useState(null);
  const [m5, setM5] = useState(null);
  const [addon, setAddon] = useState(null);

  // Page 1 States
  const [skillViewMode, setSkillViewMode] = useState('single');
  const [selectedSkill1, setSelectedSkill1] = useState('Python');
  const [granularity, setGranularity] = useState('yearly');
  const [top10Year, setTop10Year] = useState('All Years');
  const [allSkillsFilter, setAllSkillsFilter] = useState('');

  // Page 2 States
  const [selectedRole2, setSelectedRole2] = useState('All Roles');
  const [selectedSkill2, setSelectedSkill2] = useState('Python');

  // Page 3 States
  const [clsMode, setClsMode] = useState('desc_to_role');
  const [jdInput, setJdInput] = useState(
    'Proficient in Python, SQL, Machine Learning, Scikit-Learn, and statistical modeling to build predictive pipelines.'
  );
  const [selectedSearchSkills, setSelectedSearchSkills] = useState(['Python', 'SQL']);
  const [leakageWarning, setLeakageWarning] = useState(false);
  const [selectedClassifier, setSelectedClassifier] = useState('Logistic Regression');
  const [predictionRes, setPredictionRes] = useState(null);
  const [selectedRole3, setSelectedRole3] = useState('Data Scientist');

  // Page 4 States
  const [trendMode, setTrendMode] = useState('skill');
  const [selectedTrendSkill, setSelectedTrendSkill] = useState('Python');
  const [selectedTrendRole, setSelectedTrendRole] = useState('Data Scientist');
  const [verifiedTrend, setVerifiedTrend] = useState(null);
  const [verifyingTrend, setVerifyingTrend] = useState(false);

  // Page 5 States
  const [selectedForecastTarget, setSelectedForecastTarget] = useState('Overall IT Posting Volume (Consistent Portal)');

  // Page 6 States
  const [selectedCompanyRole, setSelectedCompanyRole] = useState('Data Scientist');
  const [companySearch, setCompanySearch] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/skill-demand`).then(r => r.json()),
      fetch(`${API}/apriori`).then(r => r.json()),
      fetch(`${API}/classification/meta`).then(r => r.json()),
      fetch(`${API}/trends`).then(r => r.json()),
      fetch(`${API}/forecast`).then(r => r.json()),
      fetch(`${API}/companies`).then(r => r.json()),
    ])
      .then(([d1, d2, d3, d4, d5, d6]) => {
        setM1(d1);
        setM2(d2);
        setM3Meta(d3);
        setM4(d4);
        setM5(d5);
        setAddon(d6);
        setLoading(false);
      })
      .catch(() => {
        setError('Cannot reach FastAPI backend on http://localhost:8000. Start uvicorn first.');
        setLoading(false);
      });
  }, []);

  const activeTrendTarget = trendMode === 'skill' ? selectedTrendSkill : selectedTrendRole;

  useEffect(() => {
    if (loading || error || activePage !== 'trends' || !m4 || !activeTrendTarget) return;

    let cancelled = false;
    setVerifyingTrend(true);
    setVerifiedTrend(null);

    const params = new URLSearchParams({
      kind: trendMode,
      name: activeTrendTarget,
    });

    fetch(`${API}/trends/verify?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setVerifiedTrend(data);
          setVerifyingTrend(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setVerifiedTrend(null);
          setVerifyingTrend(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loading, error, activePage, m4, trendMode, activeTrendTarget]);

  useEffect(() => {
    if (!selectedCompany) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedCompany(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCompany]);

  const skillPool = useMemo(() => {
    if (Array.isArray(m1?.skills) && m1.skills.length > 0) return m1.skills;
    return DEFAULT_SKILL_OPTIONS;
  }, [m1]);

  const overallSkillSummary = useMemo(() => {
    if (!m1?.series || typeof m1.series !== 'object') {
      return {
        periodSeries: [],
        skillRows: [],
        totalMentions: 0,
        trackedSkillsCount: 0,
        topSkillOverall: null,
      };
    }

    const skillNames = Object.keys(m1.series);
    const periodMap = new Map();
    const perSkillStats = [];

    skillNames.forEach((sk) => {
      const pts = Array.isArray(m1.series[sk]?.[granularity]) ? m1.series[sk][granularity] : [];
      let totalCount = 0;
      let peakCount = -1;
      let peakPeriod = '—';
      let latestShare = 0;

      pts.forEach((p, idx) => {
        const cnt = Number(p.count || 0);
        const pct = Number(p.demand_pct || 0);
        const periodKey = String(p.period);

        totalCount += cnt;
        if (cnt > peakCount) {
          peakCount = cnt;
          peakPeriod = periodKey;
        }
        if (idx === pts.length - 1) {
          latestShare = pct;
        }

        const existing = periodMap.get(periodKey) || {
          period: periodKey,
          total_mentions: 0,
          pct_sum: 0,
          skill_entries: 0,
          top_skill: '',
          top_skill_count: -1,
        };
        existing.total_mentions += cnt;
        existing.pct_sum += pct;
        existing.skill_entries += 1;
        if (cnt > existing.top_skill_count) {
          existing.top_skill_count = cnt;
          existing.top_skill = sk;
        }
        periodMap.set(periodKey, existing);
      });

      perSkillStats.push({
        skill: sk,
        total_mentions: totalCount,
        latest_demand_pct: Number(latestShare.toFixed(2)),
        peak_period: peakPeriod,
        peak_count: Math.max(peakCount, 0),
      });
    });

    perSkillStats.sort((a, b) => b.total_mentions - a.total_mentions);

    const periodSeries = Array.from(periodMap.values()).map((p) => ({
      period: p.period,
      total_mentions: p.total_mentions,
      avg_demand_pct: p.skill_entries > 0 ? Number((p.pct_sum / p.skill_entries).toFixed(2)) : 0,
      top_skill: p.top_skill || '—',
      top_skill_count: Math.max(p.top_skill_count, 0),
    }));

    const totalMentions = perSkillStats.reduce((acc, s) => acc + s.total_mentions, 0);

    return {
      periodSeries,
      skillRows: perSkillStats,
      totalMentions,
      trackedSkillsCount: perSkillStats.length,
      topSkillOverall: perSkillStats[0] || null,
    };
  }, [m1, granularity]);

  const handleToggleSearchSkill = (skill) => {
    setSelectedSearchSkills(prev => {
      const exists = prev.includes(skill);
      return exists ? prev.filter(s => s !== skill) : [...prev, skill];
    });
  };

  const handleAppendSelectedSkillsToInput = () => {
    if (selectedSearchSkills.length === 0) return;
    const base = stripRoleLeakage(jdInput);
    const missing = selectedSearchSkills.filter(sk => !base.toLowerCase().includes(sk.toLowerCase()));
    const combined = missing.length > 0 ? `${base} ${missing.join(', ')}`.trim() : base;
    setJdInput(combined);
    setLeakageWarning(false);
  };

  const handleJdChange = (val) => {
    const hasRoleTerm = ROLE_LEAKAGE_TERMS.some(term =>
      new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(val)
    );
    setLeakageWarning(hasRoleTerm);
    setJdInput(val);
  };

  const handlePredict = async () => {
    const sanitizedText = stripRoleLeakage(jdInput);
    const skillsPart = selectedSearchSkills.join(', ');
    const payloadText = [sanitizedText, skillsPart].filter(Boolean).join('. ');

    const res = await fetch(`${API}/classification/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: payloadText,
        skills: selectedSearchSkills,
        model_name: selectedClassifier,
      }),
    });
    setPredictionRes(await res.json());
  };

  const navItems = [
    { id: 'demand', label: '1. Skill Demand', icon: BarChart3 },
    { id: 'apriori', label: '2. Apriori Rules', icon: Network },
    { id: 'classify', label: '3. Role Classification', icon: BrainCircuit },
    { id: 'trends', label: '4. Temporal Trends', icon: TrendingUp },
    { id: 'forecast', label: '5. 2026 Forecasting', icon: ForecastIcon },
    { id: 'companies', label: '6. Hiring Companies', icon: Building2 },
  ];

  const selectedCompanyYearly = useMemo(
    () => (selectedCompany ? getCompanyYearlyRows(selectedCompany) : []),
    [selectedCompany]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Indian IT Labour Market Intelligence System</h1>
            <p className="text-xs text-slate-400">Role-Based Skill Demand, Apriori Mining, Classification & 2026 Forecasting</p>
          </div>
          <nav className="flex flex-wrap gap-1.5">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActivePage(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                  activePage === id ? 'bg-indigo-600 text-white shadow' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {loading && <div className="p-8 text-center text-slate-500 font-medium">Loading analytical models...</div>}
        {error && <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-semibold">{error}</div>}

        {/* PAGE 1: STATISTICAL SKILL DEMAND */}
        {!loading && !error && activePage === 'demand' && m1 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setSkillViewMode('single')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold ${
                        skillViewMode === 'single' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      Single Skill
                    </button>
                    <button
                      onClick={() => setSkillViewMode('all')}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold ${
                        skillViewMode === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      All Skills (Overall)
                    </button>
                  </div>

                  {skillViewMode === 'single' && (
                    <SearchableSelect
                      label="Select Skill (Searchable)"
                      options={m1.skills}
                      value={selectedSkill1}
                      onChange={setSelectedSkill1}
                    />
                  )}
                </div>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                  {['yearly', 'monthly'].map(g => (
                    <button
                      key={g}
                      onClick={() => setGranularity(g)}
                      className={`px-4 py-1.5 rounded-md text-xs font-semibold ${
                        granularity === g ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {g === 'yearly' ? 'Year-Wise (2020–2026)' : 'Month-Wise (2020–2026)'}
                    </button>
                  ))}
                </div>
              </div>

              {skillViewMode === 'single' ? (
                <>
                  <h2 className="text-lg font-bold text-slate-800 pt-2">
                    Historical Demand for <span className="text-indigo-600">{selectedSkill1}</span> ({granularity === 'yearly' ? 'Year-Wise' : 'Month-Wise'})
                  </h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer>
                      <BarChart data={m1.series?.[selectedSkill1]?.[granularity] || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Posting Count F(s)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="space-y-6 pt-2">
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">Total Skill Mentions (All Skills)</div>
                      <div className="text-2xl font-bold text-indigo-600 mt-1">
                        {overallSkillSummary.totalMentions.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">Tracked Technical Skills</div>
                      <div className="text-2xl font-bold text-slate-800 mt-1">
                        {overallSkillSummary.trackedSkillsCount}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">Highest Cumulative Demand Skill</div>
                      <div className="text-xl font-bold text-emerald-600 mt-1">
                        {overallSkillSummary.topSkillOverall
                          ? `${overallSkillSummary.topSkillOverall.skill} (${overallSkillSummary.topSkillOverall.total_mentions.toLocaleString()})`
                          : '—'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-3">
                      Overall Skill Demand Across All Skills ({granularity === 'yearly' ? 'Year-Wise' : 'Month-Wise'})
                    </h2>
                    <div className="h-80 w-full">
                      <ResponsiveContainer>
                        <BarChart data={overallSkillSummary.periodSeries}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total_mentions" name="Total Skill Mentions" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                        All Skills Demand Matrix
                      </h3>
                      <input
                        type="text"
                        value={allSkillsFilter}
                        onChange={(e) => setAllSkillsFilter(e.target.value)}
                        placeholder="Filter skill name..."
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                      />
                    </div>

                    <div className="overflow-x-auto max-h-96">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead className="sticky top-0 bg-slate-100 text-slate-600">
                          <tr>
                            <th className="p-3">Skill</th>
                            <th className="p-3">Total Postings</th>
                            <th className="p-3">Latest Demand %</th>
                            <th className="p-3">Peak Period</th>
                            <th className="p-3">Peak Postings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overallSkillSummary.skillRows
                            .filter(r => r.skill.toLowerCase().includes(allSkillsFilter.toLowerCase()))
                            .map((r) => (
                              <tr key={r.skill} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="p-3 font-bold text-slate-800">{r.skill}</td>
                                <td className="p-3 font-semibold text-indigo-600">{r.total_mentions.toLocaleString()}</td>
                                <td className="p-3">{r.latest_demand_pct}%</td>
                                <td className="p-3 text-slate-600">{r.peak_period}</td>
                                <td className="p-3">{r.peak_count.toLocaleString()}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-slate-800">Top 10 Most Demanded Skills</h2>
                <select
                  value={top10Year}
                  onChange={(e) => setTop10Year(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium"
                >
                  {Object.keys(m1.top10_by_year || {}).map(yr => (
                    <option key={yr} value={yr}>{yr === 'All Years' ? 'All Years (2020–2026)' : `Year ${yr}`}</option>
                  ))}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={m1.top10_by_year?.[top10Year] || []} layout="vertical" margin={{ left: 35 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="skill" type="category" width={110} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" name="Postings" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2">Rank</th>
                      <th className="py-2">Skill</th>
                      <th className="py-2">Frequency F(s)</th>
                      <th className="py-2">Demand % D(s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(m1.top10_by_year?.[top10Year] || []).map((row, idx) => (
                      <tr key={row.skill} className="border-b border-slate-100">
                        <td className="py-2 font-semibold text-slate-500">#{idx + 1}</td>
                        <td className="py-2 font-semibold text-slate-800">{row.skill}</td>
                        <td className="py-2">{row.count.toLocaleString()}</td>
                        <td className="py-2 text-indigo-600 font-semibold">{row.demand_pct}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PAGE 2: APRIORI ASSOCIATION RULES */}
        {!loading && !error && activePage === 'apriori' && m2 && (() => {
          const roleBucket = m2.by_role?.[selectedRole2] || m2.by_role?.['All Roles'] || m2;
          const skillOptions = Array.isArray(roleBucket?.skills) ? roleBucket.skills : [];
          const activeSkill = skillOptions.includes(selectedSkill2)
            ? selectedSkill2
            : (skillOptions.includes('Python') ? 'Python' : (skillOptions[0] || ''));
          const rulesList = Array.isArray(roleBucket?.rules?.[activeSkill])
            ? roleBucket.rules[activeSkill]
            : [];

          return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-wrap items-end gap-4">
                {Array.isArray(m2.roles) && m2.roles.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Filter by Job Role
                    </label>
                    <select
                      value={selectedRole2}
                      onChange={(e) => {
                        const r = e.target.value;
                        setSelectedRole2(r);
                        const nextSkills = m2.by_role?.[r]?.skills || [];
                        if (nextSkills.length > 0 && !nextSkills.includes(selectedSkill2)) {
                          setSelectedSkill2(nextSkills.includes('Python') ? 'Python' : nextSkills[0]);
                        }
                      }}
                      className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800"
                    >
                      {m2.roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                )}

                <SearchableSelect
                  label="Select Base Skill X (Rule: X → Y)"
                  options={skillOptions}
                  value={activeSkill}
                  onChange={setSelectedSkill2}
                />
              </div>

              <h2 className="text-lg font-bold text-slate-800">
                Skills Frequently Co-Occurring With <span className="text-indigo-600">{activeSkill || 'None'}</span>
                {m2.by_role ? ` (${selectedRole2})` : ''}
              </h2>

              {rulesList.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600">
                  No association rules above threshold found for <b>{activeSkill}</b> in <b>{selectedRole2}</b>. Try selecting another skill or role.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600">
                        <th className="p-3 rounded-tl-lg">Rule (X → Y)</th>
                        <th className="p-3">Co-Occurring Skill (Y)</th>
                        <th className="p-3">Support</th>
                        <th className="p-3">Confidence</th>
                        <th className="p-3 rounded-tr-lg">Lift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rulesList.map((r, idx) => (
                        <tr key={`${r.co_skill}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-600">{activeSkill} → {r.co_skill}</td>
                          <td className="p-3 font-bold text-indigo-700">{r.co_skill}</td>
                          <td className="p-3">{r.support} ({r.support_pct}%)</td>
                          <td className="p-3 font-semibold">{r.confidence} ({r.confidence_pct}%)</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              {r.lift}x
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })()}

        {/* PAGE 3: BIDIRECTIONAL ROLE CLASSIFICATION */}
        {!loading && !error && activePage === 'classify' && m3Meta && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              {(m3Meta.metrics || []).map(m => (
                <div key={m.model} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold text-slate-500 uppercase">{m.model}</div>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">
                    {m.accuracy}% <span className="text-xs font-normal text-slate-500">Accuracy</span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Weighted F1: <b>{m.weighted_f1}%</b> | Macro F1: <b>{m.macro_f1}%</b>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setClsMode('desc_to_role')}
                  className={`px-4 py-2 rounded-md text-xs font-bold ${
                    clsMode === 'desc_to_role' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Mode A: Job Description → Predict Job Role
                </button>
                <button
                  onClick={() => setClsMode('role_to_desc')}
                  className={`px-4 py-2 rounded-md text-xs font-bold ${
                    clsMode === 'role_to_desc' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Mode B: Select Job Role → Required Skills & Description
                </button>
              </div>

              {clsMode === 'desc_to_role' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4 items-center">
                    <label className="text-xs font-bold uppercase text-slate-500">Classifier:</label>
                    <select
                      value={selectedClassifier}
                      onChange={e => setSelectedClassifier(e.target.value)}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium"
                    >
                      {(m3Meta.metrics || []).map(m => (
                        <option key={m.model} value={m.model}>{m.model}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-wrap items-end justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <MultiOptionSearch
                      label="Multi-Option Skill Search (Select Multiple)"
                      options={skillPool}
                      selectedOptions={selectedSearchSkills}
                      onToggleOption={handleToggleSearchSkill}
                      onClearAll={() => setSelectedSearchSkills([])}
                      placeholder="Search and select multiple skills..."
                    />
                    <button
                      type="button"
                      onClick={handleAppendSelectedSkillsToInput}
                      disabled={selectedSearchSkills.length === 0}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-lg"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insert Selected Skills
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={jdInput}
                    onChange={e => handleJdChange(e.target.value)}
                    placeholder="Paste skills, tools, or responsibilities (avoid naming the target job role)..."
                    className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />

                  {leakageWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center justify-between gap-3">
                      <span>
                        <b>Leakage Guard:</b> Target job role names detected in input text will be stripped before prediction so the classifier relies on skills and responsibilities.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setJdInput(stripRoleLeakage(jdInput));
                          setLeakageWarning(false);
                        }}
                        className="px-2.5 py-1 bg-amber-200/70 hover:bg-amber-200 rounded font-bold text-amber-950 shrink-0"
                      >
                        Clean Text
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handlePredict}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow"
                  >
                    Predict IT Job Role
                  </button>

                  {predictionRes && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-indigo-900 font-bold text-lg">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        Predicted Role: {predictionRes.predicted_role}
                      </div>
                      <p className="text-sm text-slate-700">{predictionRes.blueprint?.description}</p>
                      <div className="grid md:grid-cols-2 gap-4 pt-2">
                        <div>
                          <div className="text-xs font-bold uppercase text-slate-500 mb-1">Top Model Confidence Scores</div>
                          {(predictionRes.top_probabilities || []).map(p => (
                            <div key={p.role} className="flex justify-between text-sm py-1 border-b border-indigo-100">
                              <span>{p.role}</span>
                              <span className="font-bold text-indigo-700">{p.probability}%</span>
                            </div>
                          ))}
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase text-slate-500 mb-1">
                            Core Skills Required for {predictionRes.predicted_role}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(predictionRes.blueprint?.top_skills || []).slice(0, 8).map(s => (
                              <span
                                key={s.skill}
                                className="px-2.5 py-1 bg-white border border-indigo-200 rounded-full text-xs font-semibold text-indigo-800"
                              >
                                {s.skill} ({s.demand_pct}%)
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <SearchableSelect
                    label="Select Standardized Job Role"
                    options={m3Meta.roles}
                    value={selectedRole3}
                    onChange={setSelectedRole3}
                  />
                  {m3Meta.blueprints?.[selectedRole3] && (
                    <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{selectedRole3}</h3>
                        <p className="text-sm text-slate-600 mt-1">{m3Meta.blueprints[selectedRole3].description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Based on {(m3Meta.blueprints[selectedRole3].total_postings || 0).toLocaleString()} verified Indian IT job postings
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase text-slate-500 mb-2">Most Demanded Skills for This Role</h4>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {(m3Meta.blueprints[selectedRole3].top_skills || []).map(s => (
                            <div key={s.skill} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center">
                              <span className="font-semibold text-sm text-slate-800">{s.skill}</span>
                              <span className="text-xs font-bold text-indigo-600">{s.demand_pct}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PAGE 4: QUANTIFIED TEMPORAL TRENDS */}
        {!loading && !error && activePage === 'trends' && m4 && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setTrendMode('skill')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold ${
                    trendMode === 'skill' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Analyze Skill Over Time
                </button>
                <button
                  onClick={() => setTrendMode('role')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold ${
                    trendMode === 'role' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Analyze Job Role Over Time
                </button>
              </div>

              {trendMode === 'skill' ? (
                <SearchableSelect
                  label="Select Skill"
                  options={Object.keys(m4.skills || {})}
                  value={selectedTrendSkill}
                  onChange={setSelectedTrendSkill}
                />
              ) : (
                <SearchableSelect
                  label="Select Job Role"
                  options={Object.keys(m4.roles || {})}
                  value={selectedTrendRole}
                  onChange={setSelectedTrendRole}
                />
              )}
            </div>

            {verifyingTrend ? (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-800 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                Verifying local trend results for <b>{activeTrendTarget}</b> against live web search via Gemini...
              </div>
            ) : verifiedTrend ? (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  verifiedTrend.corrected
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : verifiedTrend.verified
                      ? 'bg-sky-50 border-sky-200 text-sky-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  <Globe className="w-4 h-4 shrink-0" />
                  <span>
                    {verifiedTrend.corrected
                      ? `Updated Automatically via Web Verification (${verifiedTrend.name})`
                      : verifiedTrend.verified
                        ? `Web-Verified Accurate (${verifiedTrend.name})`
                        : `Local Model Fallback (${verifiedTrend.name})`}
                  </span>
                </div>
                <p>{verifiedTrend.reason}</p>
                {Array.isArray(verifiedTrend.sources) && verifiedTrend.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {verifiedTrend.sources.map((src, idx) => (
                      <a
                        key={`${src}-${idx}`}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-semibold hover:opacity-80"
                      >
                        Source {idx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {(() => {
              const localItem = trendMode === 'skill'
                ? m4.skills?.[selectedTrendSkill]
                : m4.roles?.[selectedTrendRole];
              const localSeries = Array.isArray(localItem?.series) ? localItem.series : [];
              const rawSeries =
                Array.isArray(verifiedTrend?.series) && verifiedTrend.series.length > 0
                  ? verifiedTrend.series
                  : localSeries;

              if (rawSeries.length === 0) return null;

              const labelName = trendMode === 'skill' ? selectedTrendSkill : selectedTrendRole;

              const yoyRows = rawSeries.map((row, idx) => {
                if (idx === 0) {
                  return { ...row, yoy_share_pct: null, yoy_count_pct: null };
                }
                const prev = rawSeries[idx - 1];
                const yoyShare = prev.demand_pct > 0
                  ? Number((((row.demand_pct - prev.demand_pct) / prev.demand_pct) * 100).toFixed(2))
                  : null;
                const yoyCount = prev.count > 0
                  ? Number((((row.count - prev.count) / prev.count) * 100).toFixed(2))
                  : null;
                return { ...row, yoy_share_pct: yoyShare, yoy_count_pct: yoyCount };
              });

              const firstRow = yoyRows[0];
              const lastRow = yoyRows[yoyRows.length - 1];
              const netShareChange = firstRow.demand_pct > 0
                ? Number((((lastRow.demand_pct - firstRow.demand_pct) / firstRow.demand_pct) * 100).toFixed(2))
                : 0;

              const nYears = Math.max(yoyRows.length - 1, 1);
              const cagr = firstRow.demand_pct > 0 && lastRow.demand_pct > 0
                ? Number(((Math.pow(lastRow.demand_pct / firstRow.demand_pct, 1 / nYears) - 1) * 100).toFixed(2))
                : 0;

              const status = netShareChange >= 10 ? 'Increasing' : (netShareChange <= -10 ? 'Decreasing' : 'Stable');
              const isUp = status === 'Increasing';
              const isDown = status === 'Decreasing';

              return (
                <>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">
                        Overall Trajectory ({firstRow.period} → {lastRow.period})
                      </div>
                      <div
                        className={`text-xl font-bold flex items-center gap-1.5 mt-1 ${
                          isUp ? 'text-emerald-600' : isDown ? 'text-rose-600' : 'text-amber-600'
                        }`}
                      >
                        {isUp ? <ArrowUpRight className="w-5 h-5" /> : isDown ? <ArrowDownRight className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                        {status} ({netShareChange > 0 ? `+${netShareChange}%` : `${netShareChange}%`})
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">
                        Start vs. Latest Demand Share
                      </div>
                      <div className="text-xl font-bold text-slate-800 mt-1">
                        {firstRow.demand_pct}% <span className="text-sm font-normal text-slate-400">({firstRow.period})</span>
                        {' → '}
                        <span className="text-indigo-600">{lastRow.demand_pct}%</span> <span className="text-sm font-normal text-slate-400">({lastRow.period})</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="text-xs text-slate-500 font-semibold">Compound Annual Growth (CAGR)</div>
                      <div className={`text-xl font-bold mt-1 ${cagr >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {cagr > 0 ? `+${cagr}%` : `${cagr}%`} / yr
                      </div>
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    <ResponsiveContainer>
                      <AreaChart data={yoyRows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="period" />
                        <YAxis unit="%" />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="demand_pct"
                          name={`${labelName} Demand Share (%)`}
                          stroke="#4f46e5"
                          fill="#c7d2fe"
                          strokeWidth={2.5}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600">
                      Year-by-Year Growth Breakdown ({firstRow.period}–{lastRow.period})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-100 text-slate-600">
                            <th className="p-3 rounded-tl-lg">Year</th>
                            <th className="p-3">Postings F(s)</th>
                            <th className="p-3">YoY Volume Growth</th>
                            <th className="p-3">Demand Share D(s)</th>
                            <th className="p-3 rounded-tr-lg">Annual Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {yoyRows.map((r) => {
                            const g = r.yoy_share_pct;
                            const badge = g === null
                              ? { text: 'Base Year', cls: 'bg-slate-100 text-slate-600' }
                              : g >= 5
                                ? { text: 'Increasing', cls: 'bg-emerald-100 text-emerald-800' }
                                : g <= -5
                                  ? { text: 'Decreasing', cls: 'bg-rose-100 text-rose-800' }
                                  : { text: 'Stable', cls: 'bg-amber-100 text-amber-800' };

                            return (
                              <tr key={r.period} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="p-3 font-bold text-slate-800">{r.period}</td>
                                <td className="p-3">{r.count.toLocaleString()}</td>
                                <td className={`p-3 font-semibold ${r.yoy_count_pct > 0 ? 'text-emerald-600' : r.yoy_count_pct < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                  {r.yoy_count_pct === null ? '—' : `${r.yoy_count_pct > 0 ? '+' : ''}${r.yoy_count_pct}%`}
                                </td>
                                <td className="p-3 font-bold text-indigo-600">{r.demand_pct}%</td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badge.cls}`}>
                                    {badge.text}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* PAGE 5: TIME-SERIES FORECASTING & 2026 VALIDATION */}
        {!loading && !error && activePage === 'forecast' && m5 && (() => {
          const targetNames = Array.isArray(m5.targets) && m5.targets.length > 0
            ? m5.targets
            : ['Overall IT Posting Volume (Consistent Portal)'];
          const activeTargetName = targetNames.includes(selectedForecastTarget)
            ? selectedForecastTarget
            : targetNames[0];
          const activeF = m5.by_target?.[activeTargetName] || m5;
          const unitSuffix = activeF.unit === '%' ? '%' : '';

          return (
            <div className="space-y-6">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Select Forecasting Target Series</h2>
                  <p className="text-xs text-slate-500">Compare 2026 Out-of-Sample Predictions vs. Actuals across Volume & Key Skills</p>
                </div>
                <select
                  value={activeTargetName}
                  onChange={(e) => setSelectedForecastTarget(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
                >
                  {targetNames.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {Object.entries(activeF.metrics || {}).map(([modelName, err]) => (
                  <div key={modelName} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs font-bold uppercase text-slate-500">
                      {modelName.replace(/_/g, ' ')} (2026 Out-of-Sample Error)
                    </div>
                    <div className="flex gap-6 mt-2 text-sm">
                      <div>MAE: <b className="text-indigo-600 text-lg">{err.MAE}{unitSuffix}</b></div>
                      <div>RMSE: <b className="text-slate-800 text-lg">{err.RMSE}{unitSuffix}</b></div>
                      <div>MAPE: <b className="text-emerald-600 text-lg">{err.MAPE_pct}%</b></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-slate-800">
                  2026 Actual vs. Predicted — <span className="text-indigo-600">{activeTargetName}</span>
                </h2>
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <LineChart data={activeF.validation_2026 || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis unit={unitSuffix} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="actual_2026" name="Actual 2026" stroke="#0f172a" strokeWidth={3} />
                      <Line type="monotone" dataKey="holt_predicted" name="Holt-Winters Seasonal" stroke="#4f46e5" strokeDasharray="5 5" strokeWidth={2.5} />
                      <Line type="monotone" dataKey="ridge_predicted" name="Lag-Feature Ridge Regression" stroke="#10b981" strokeDasharray="3 3" strokeWidth={2.5} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })()}

        {/* PAGE 6: HISTORICAL COMPANY HIRING ANALYSIS */}
        {!loading && !error && activePage === 'companies' && addon && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <SearchableSelect
                label="Select IT Job Role"
                options={addon.roles}
                value={selectedCompanyRole}
                onChange={(r) => {
                  setSelectedCompanyRole(r);
                  setSelectedCompany(null);
                }}
              />
              <input
                type="text"
                value={companySearch}
                onChange={e => setCompanySearch(e.target.value)}
                placeholder="Filter company name..."
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <b>Methodological Note:</b> Companies listed below previously advertised vacancies for <b>{selectedCompanyRole}</b> in the historical dataset. Click any company name to open its year-wise analytics pop-up.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600">
                    <th className="p-3">Company</th>
                    <th className="p-3">Historical Postings</th>
                    <th className="p-3">Observed Hiring Period</th>
                    <th className="p-3">Primary Location</th>
                  </tr>
                </thead>
                <tbody>
                  {(addon.companies_by_role?.[selectedCompanyRole] || [])
                    .filter(c => c.company.toLowerCase().includes(companySearch.toLowerCase()))
                    .map(c => {
                      const isSelected = selectedCompany?.company === c.company;
                      return (
                        <tr
                          key={c.company}
                          onClick={() => setSelectedCompany(c)}
                          className={`border-b border-slate-100 cursor-pointer transition ${
                            isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <td className="p-3 font-bold text-indigo-700 underline">{c.company}</td>
                          <td className="p-3 text-indigo-600 font-semibold">{c.posting_count}</td>
                          <td className="p-3 text-slate-600">{c.hiring_period}</td>
                          <td className="p-3 text-slate-500">{c.primary_location}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* POP-UP MODAL FOR SELECTED COMPANY YEAR-WISE ANALYTICS */}
        {selectedCompany && (
          <div
            onClick={() => setSelectedCompany(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-indigo-200 shadow-2xl p-6 space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    Year-Wise Analytics: <span className="text-indigo-600">{selectedCompany.company}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Role: <b>{selectedCompanyRole}</b> · Total Postings: <b>{selectedCompany.posting_count}</b> · Period: <b>{selectedCompany.hiring_period}</b> · Location: <b>{selectedCompany.primary_location}</b>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCompany(null)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                  Close
                </button>
              </div>

              {selectedCompanyYearly.length > 0 ? (
                <>
                  <div className="h-64 w-full">
                    <ResponsiveContainer>
                      <BarChart data={selectedCompanyYearly}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="year" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="postings" name="Yearly Postings" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600">
                          <th className="p-3 rounded-tl-lg">Year</th>
                          <th className="p-3">Postings</th>
                          <th className="p-3 rounded-tr-lg">YoY Growth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCompanyYearly.map((yr) => (
                          <tr key={yr.year} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800">{yr.year}</td>
                            <td className="p-3 font-semibold text-indigo-600">{yr.postings}</td>
                            <td
                              className={`p-3 font-semibold ${
                                yr.yoy_pct == null
                                  ? 'text-slate-400'
                                  : yr.yoy_pct > 0
                                    ? 'text-emerald-600'
                                    : yr.yoy_pct < 0
                                      ? 'text-rose-600'
                                      : 'text-slate-500'
                              }`}
                            >
                              {yr.yoy_pct == null ? '—' : `${yr.yoy_pct > 0 ? '+' : ''}${yr.yoy_pct}%`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  No year-wise series available for this company entry.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}