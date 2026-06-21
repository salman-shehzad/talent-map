import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Briefcase,
  BookOpen,
  Compass,
  UserCog,
  ShieldCheck,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Bookmark,
  FileText,
  ChevronRight,
  TrendingUp,
  Cpu,
  CheckCircle2,
  AlertCircle,
  LayoutDashboard
} from "lucide-react";
import "./styles.css";

const roleLabels = {
  student: "Candidate",
  staff: "Content Manager",
  admin: "Administrator",
  super_admin: "Super Admin"
};

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user") || "null"));
  const [notifications, setNotifications] = useState([]);
  const [view, setView] = useState("overview");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedJobId, setSelectedJobId] = useState(null); // For Career Roadmap view

  async function request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(path, { ...options, headers });
    if (response.headers.get("content-type")?.includes("application/pdf")) return response;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Something went wrong.");
    return body;
  }

  async function refresh() {
    if (!token) return;
    try {
      const data = await request("/api/profile");
      setUser(data.user);
      setNotifications(data.notifications || []);
      localStorage.setItem("user", JSON.stringify(data.user));
    } catch (err) {
      logout();
    }
  }

  useEffect(() => {
    if (token) {
      refresh().catch(() => logout());
      // Adjust view based on role
      if (user?.role === "staff") setView("jobs");
      else if (user?.role === "admin") setView("analytics");
      else if (user?.role === "super_admin") setView("system_config");
      else setView("overview");
    }
  }, [token]);

  function saveSession(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem("token", nextToken);
    localStorage.setItem("user", JSON.stringify(nextUser));
  }

  function logout() {
    setToken("");
    setUser(null);
    setNotifications([]);
    setView("overview");
    setSelectedJobId(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  function triggerSuccess(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  }

  function triggerError(msg) {
    setError(msg);
    setTimeout(() => setError(""), 5000);
  }

  if (!token || !user) {
    return <AuthScreen saveSession={saveSession} request={request} />;
  }

  // Load Nav Items dynamically
  function navItems(role) {
    const items = [];
    if (role === "student") {
      items.push(
        { id: "overview", label: "Overview", icon: LayoutDashboard },
        { id: "profile", label: "My Profile", icon: UserCog },
        { id: "recommendations", label: "Job Matcher", icon: Briefcase },
        { id: "saved_jobs", label: "Saved Jobs", icon: Bookmark }
      );
    } else if (role === "staff") {
      items.push(
        { id: "jobs", label: "Job Listings", icon: Briefcase },
        { id: "skills", label: "Skill Taxonomy", icon: Cpu },
        { id: "resources", label: "Learning Resources", icon: BookOpen }
      );
    } else if (role === "admin") {
      items.push(
        { id: "analytics", label: "Analytics Panel", icon: TrendingUp },
        { id: "users", label: "Manage Roles", icon: UserCog },
        { id: "audit", label: "Audit Logs", icon: ShieldCheck }
      );
    } else if (role === "super_admin") {
      items.push(
        { id: "system_config", label: "System Config", icon: Settings },
        { id: "health", label: "Platform Health", icon: ShieldCheck }
      );
    }
    return items;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">
            <Compass size={24} color="#ffffff" />
          </div>
          <div className="brand-text">
            <strong>TalentMap</strong>
            <span>Smart Recommender</span>
          </div>
        </div>
        <nav className="nav">
          {navItems(user.role).map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => {
                setView(item.id);
                setSelectedJobId(null); // Reset roadmap when moving
              }}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="user-chip">
          <span className="user-chip-name">{user.name}</span>
          <span className="user-chip-role">{roleLabels[user.role]}</span>
          <button className="secondary" onClick={logout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="main">
        {error && <div className="error">{error}</div>}
        {success && <div className="panel" style={{ borderLeft: "4px solid var(--secondary)", padding: "12px 18px", marginBottom: "20px" }}>{success}</div>}

        {/* Dynamic content rendering */}
        {(() => {
          if (selectedJobId) {
            return (
              <CareerRoadmap
                jobId={selectedJobId}
                request={request}
                setSelectedJobId={setSelectedJobId}
                triggerError={triggerError}
              />
            );
          }

          switch (view) {
            // Student Views
            case "overview":
              return (
                <Overview
                  user={user}
                  notifications={notifications}
                  request={request}
                  setView={setView}
                  setSelectedJobId={setSelectedJobId}
                />
              );
            case "profile":
              return (
                <Profile
                  user={user}
                  request={request}
                  refresh={refresh}
                  setView={setView}
                  triggerSuccess={triggerSuccess}
                  triggerError={triggerError}
                />
              );
            case "recommendations":
              return (
                <Recommendations
                  request={request}
                  setSelectedJobId={setSelectedJobId}
                  triggerSuccess={triggerSuccess}
                  triggerError={triggerError}
                  user={user}
                  refresh={refresh}
                />
              );
            case "saved_jobs":
              return (
                <SavedJobs
                  request={request}
                  refresh={refresh}
                  user={user}
                  setSelectedJobId={setSelectedJobId}
                  triggerSuccess={triggerSuccess}
                />
              );

            // Content Manager Views
            case "jobs":
              return (
                <JobsManager
                  request={request}
                  triggerSuccess={triggerSuccess}
                  triggerError={triggerError}
                />
              );
            case "skills":
              return (
                <SkillsManager
                  request={request}
                  triggerSuccess={triggerSuccess}
                  triggerError={triggerError}
                />
              );
            case "resources":
              return (
                <ResourcesManager
                  request={request}
                  triggerSuccess={triggerSuccess}
                  triggerError={triggerError}
                />
              );

            // Admin Views
            case "analytics":
              return (
                <AnalyticsPanel
                  request={request}
                  token={token}
                  triggerError={triggerError}
                />
              );
            case "users":
              return (
                <UsersManager
                  request={request}
                  currentUser={user}
                  triggerSuccess={triggerSuccess}
                  triggerError={triggerError}
                />
              );
            case "audit":
              return <AuditLogs request={request} />;

            // Super Admin Views
            case "system_config":
              return (
                <SystemConfigPanel
                  request={request}
                  triggerSuccess={triggerSuccess}
                  triggerError={triggerError}
                />
              );
            case "health":
              return <PlatformHealth request={request} />;

            default:
              return <div>Welcome to TalentMap</div>;
          }
        })()}
      </main>
    </div>
  );
}

// Layout Dashboard / Common Topbar Component
function Topbar({ title, subtitle, children }) {
  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

// Authentication Screen
function AuthScreen({ saveSession, request }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Authentication failed.");
      saveSession(body.token, body.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-header">
          <h1>{mode === "login" ? "Sign In to TalentMap" : "Create Account"}</h1>
          <p>{mode === "login" ? "Discover your skill gaps and perfect job matches." : "Start mapping your career path today."}</p>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          {error && <div className="error">{error}</div>}
          {mode === "register" && (
            <label>
              Full Name
              <input name="name" placeholder="John Doe" required />
            </label>
          )}
          <label>
            Email Address
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              required
            />
          </label>
          <button type="submit">
            {mode === "login" ? "Sign In" : "Register Candidate"}
          </button>
          <button
            className="secondary"
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Create a Candidate Account" : "Already have an account? Sign In"}
          </button>
        </form>
      </section>
    </main>
  );
}

// STUDENT VIEW: Overview
function Overview({ user, notifications, request, setView, setSelectedJobId }) {
  const [stats, setStats] = useState({ savedJobsCount: 0, skillsCount: 0, topMatchScore: 0 });
  const [topJobs, setTopJobs] = useState([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const recData = await request("/api/profile/recommendations");
        const recs = recData.recommendations || [];
        const topScore = recs.length > 0 ? recs[0].score : 0;
        setStats({
          savedJobsCount: user.savedJobs?.length || 0,
          skillsCount: user.skills?.length || 0,
          topMatchScore: topScore
        });
        setTopJobs(recs.slice(0, 3));
      } catch (err) {
        console.error(err);
      }
    }
    loadStats();
  }, [user]);

  return (
    <>
      <Topbar title={`Welcome back, ${user.name}`} subtitle="Here is a summary of your career mapping and match insights." />
      <section className="grid">
        {/* Metric panels */}
        <div className="panel span-4 metric">
          <div className="metric-icon">
            <Cpu size={24} />
          </div>
          <div className="metric-details">
            <span>Skills Registered</span>
            <strong>{stats.skillsCount}</strong>
          </div>
        </div>
        <div className="panel span-4 metric">
          <div className="metric-icon">
            <Bookmark size={24} />
          </div>
          <div className="metric-details">
            <span>Saved Openings</span>
            <strong>{stats.savedJobsCount}</strong>
          </div>
        </div>
        <div className="panel span-4 metric">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-details">
            <span>Top Match Score</span>
            <strong>{stats.topMatchScore}%</strong>
          </div>
        </div>

        {/* Main section: Job Match previews */}
        <div className="panel span-7">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2>Top Job Recommendations</h2>
            <button className="ghost" onClick={() => setView("recommendations")}>
              View All <ChevronRight size={16} />
            </button>
          </div>
          <div className="rec-list">
            {topJobs.length > 0 ? (
              topJobs.map((rec) => (
                <div key={rec.job._id} className="rec-item">
                  <div className="rec-meta">
                    <h3>{rec.job.title}</h3>
                    <p>{rec.job.company} • {rec.job.location}</p>
                    <div className="badge-list" style={{ marginTop: "8px" }}>
                      <span className="badge success">{rec.job.category}</span>
                      <span className="badge secondary">{rec.job.experienceLevel}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className={`score-ring ${rec.score >= 70 ? "high" : rec.score >= 40 ? "medium" : "low"}`}>
                      {rec.score}%
                    </div>
                    <button className="secondary" onClick={() => setSelectedJobId(rec.job._id)}>
                      Roadmap
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty">No recommendations found. Update your profile skills and interests.</div>
            )}
          </div>
        </div>

        {/* Right column: Notifications */}
        <div className="panel span-5">
          <h2>Notifications & Updates</h2>
          <div className="note-list" style={{ marginTop: "16px" }}>
            {notifications.length > 0 ? (
              notifications.map((note) => (
                <div key={note._id} className="note-item">
                  <div className="note-content">
                    <strong>{note.title}</strong>
                    <p>{note.message}</p>
                  </div>
                  <span className="note-time">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            ) : (
              <div className="empty">No notifications yet.</div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

// STUDENT VIEW: Profile
function Profile({ user, request, refresh, setView, triggerSuccess, triggerError }) {
  const [skills, setSkills] = useState(user.skills?.join(", ") || "");
  const [interests, setInterests] = useState(user.interests?.join(", ") || "");
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || "entry");
  const [careerGoals, setCareerGoals] = useState(user.careerGoals || "");
  const [loading, setLoading] = useState(false);

  // Sync form if parent user prop changes (e.g. after refresh)
  useEffect(() => {
    setSkills(user.skills?.join(", ") || "");
    setInterests(user.interests?.join(", ") || "");
    setExperienceLevel(user.experienceLevel || "entry");
    setCareerGoals(user.careerGoals || "");
  }, [user]);

  async function handleSave(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const interestsArray = interests.split(",").map((i) => i.trim()).filter(Boolean);

      await request("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          skills: skillsArray,
          interests: interestsArray,
          experienceLevel,
          careerGoals
        })
      });
      // Refresh user state in App, then navigate to overview so it loads fresh data
      await refresh();
      triggerSuccess("Profile updated! Redirecting to your dashboard...");
      setTimeout(() => setView("overview"), 800);
    } catch (err) {
      triggerError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="My Profile Settings" subtitle="Keep your career preferences up to date to receive highly accurate recommendations." />
      <section className="grid">
        <form className="panel form span-8" onSubmit={handleSave}>
          <div className="form-row">
            <label>
              Skills (comma-separated)
              <input
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="React, Node.js, Python, SQL"
                required
              />
            </label>
            <label>
              Career Interests (comma-separated)
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Web Development, Data Science, Cloud Engineering"
                required
              />
            </label>
          </div>
          <div className="form-row">
            <label>
              Experience Level
              <select value={experienceLevel} onChange={(e) => setExperienceLevel(e.target.value)}>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
              </select>
            </label>
            <label>
              Career Goals
              <input
                value={careerGoals}
                onChange={(e) => setCareerGoals(e.target.value)}
                placeholder="Aspiring software engineer looking for backend roles."
              />
            </label>
          </div>
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Update Career Profile"}
          </button>
        </form>
        <div className="panel span-4">
          <h2>Why keep your profile updated?</h2>
          <div style={{ color: "var(--muted)", display: "grid", gap: "12px", marginTop: "16px", fontSize: "14.5px" }}>
            <p><strong>🔥 Recommendation Precision:</strong> The recommender compares your skill list and experience against job listings in real-time.</p>
            <p><strong>🚀 Skill Gap Analysis:</strong> If you're missing requirements, we automatically fetch Udemy and Coursera suggestions to match them.</p>
            <p><strong>🎯 Roadmap Generation:</strong> A complete course-by-course timeline will be constructed based on target roles.</p>
          </div>
        </div>
      </section>
    </>
  );
}

// STUDENT VIEW: Recommendations / Job Matcher
function Recommendations({ request, setSelectedJobId, triggerSuccess, triggerError, user, refresh }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadRecommendations() {
    try {
      const data = await request("/api/profile/recommendations");
      setRecommendations(data.recommendations || []);
    } catch (err) {
      triggerError("Failed to fetch job matches.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendations();
  }, []);

  async function toggleBookmark(jobId, isSaved) {
    try {
      if (isSaved) {
        await request(`/api/profile/saved-jobs/${jobId}`, { method: "DELETE" });
        triggerSuccess("Bookmark removed.");
      } else {
        await request(`/api/profile/saved-jobs/${jobId}`, { method: "POST" });
        triggerSuccess("Job bookmarked!");
      }
      await refresh();
    } catch (err) {
      triggerError("Failed to toggle bookmark.");
    }
  }

  return (
    <>
      <Topbar title="Job Match recommendations" subtitle="Dynamic AI-matched opportunities based on your skills and job category interests." />
      {loading ? (
        <div className="panel empty">Computing matches...</div>
      ) : (
        <div className="grid">
          <div className="span-12 rec-list">
            {recommendations.length > 0 ? (
              recommendations.map((rec) => {
                const isSaved = user.savedJobs?.includes(rec.job._id);
                return (
                  <div key={rec.job._id} className="panel rec-item">
                    <div className="rec-meta" style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <h3>{rec.job.title}</h3>
                        <span className="badge success">{rec.job.category}</span>
                      </div>
                      <p style={{ fontWeight: 600, color: "var(--ink)" }}>{rec.job.company} • {rec.job.location}</p>
                      <p style={{ fontSize: "14.5px", marginTop: "6px" }}>{rec.job.description}</p>
                      
                      <div style={{ marginTop: "12px" }}>
                        <strong>Matching Skills:</strong>
                        <div className="badge-list" style={{ marginTop: "6px" }}>
                          {rec.matchedSkills.map(s => <span key={s} className="badge success">{s}</span>)}
                          {rec.matchedSkills.length === 0 && <span style={{ color: "var(--muted)", fontSize: "13px" }}>None</span>}
                        </div>
                      </div>

                      <div style={{ marginTop: "10px" }}>
                        <strong>Skill Gaps (Missing):</strong>
                        <div className="badge-list" style={{ marginTop: "6px" }}>
                          {rec.missingSkills.map(s => <span key={s} className="badge danger">{s}</span>)}
                          {rec.missingSkills.length === 0 && <span className="badge success">All requirements met!</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "16px" }}>
                      <div className={`score-ring ${rec.score >= 70 ? "high" : rec.score >= 40 ? "medium" : "low"}`} title="Match Score">
                        {rec.score}%
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="secondary" onClick={() => toggleBookmark(rec.job._id, isSaved)} title="Save Job">
                          <Bookmark size={18} fill={isSaved ? "var(--primary)" : "transparent"} color={isSaved ? "var(--primary)" : "currentColor"} />
                        </button>
                        <button onClick={() => setSelectedJobId(rec.job._id)}>
                          Roadmap
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">No job matches found. Expand your profile skills list to get more matches.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// STUDENT VIEW: Saved Jobs
function SavedJobs({ request, refresh, user, setSelectedJobId, triggerSuccess }) {
  const [savedList, setSavedList] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSaved() {
    try {
      const data = await request("/api/profile");
      setSavedList(data.user.savedJobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSaved();
  }, [user]);

  async function removeSaved(jobId) {
    try {
      await request(`/api/profile/saved-jobs/${jobId}`, { method: "DELETE" });
      triggerSuccess("Bookmark removed.");
      await refresh();
      loadSaved();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <>
      <Topbar title="Bookmarked Openings" subtitle="Track and manage job opportunities you have bookmarked for later review." />
      {loading ? (
        <div className="panel empty">Loading bookmarks...</div>
      ) : (
        <div className="grid">
          <div className="span-12 rec-list">
            {savedList.length > 0 ? (
              savedList.map((job) => (
                <div key={job._id} className="panel rec-item">
                  <div className="rec-meta">
                    <h3>{job.title}</h3>
                    <p>{job.company} • {job.location}</p>
                    <p style={{ fontSize: "14px", marginTop: "8px" }}>{job.salaryRange ? `Salary: ${job.salaryRange}` : ""}</p>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="secondary danger" onClick={() => removeSaved(job._id)}>
                      <Trash2 size={16} /> Remove
                    </button>
                    <button onClick={() => setSelectedJobId(job._id)}>
                      Build Path
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty">No bookmarked jobs yet. Go to Job Matcher and save jobs.</div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// STUDENT VIEW: Career Roadmap (Selected Job Timeline)
function CareerRoadmap({ jobId, request, setSelectedJobId, triggerError }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoadmap() {
      try {
        const data = await request(`/api/profile/roadmap/${jobId}`);
        setRoadmap(data);
      } catch (err) {
        triggerError("Failed to fetch career roadmap.");
        setSelectedJobId(null);
      } finally {
        setLoading(false);
      }
    }
    loadRoadmap();
  }, [jobId]);

  return (
    <>
      <Topbar title="Personalized Learning Path" subtitle="A step-by-step roadmap to acquire missing skills and qualify for your target role.">
        <button className="secondary" onClick={() => setSelectedJobId(null)}>
          Back to matches
        </button>
      </Topbar>

      {loading ? (
        <div className="panel empty">Generating learning path...</div>
      ) : (
        roadmap && (
          <section className="grid">
            <div className="panel span-7">
              <h2>{roadmap.job.title} Roadmap</h2>
              <p style={{ color: "var(--muted)", margin: "8px 0 24px" }}>At {roadmap.job.company} • {roadmap.job.location}</p>

              <div className="roadmap-timeline">
                {/* Step 1: Current skills */}
                <div className="roadmap-step completed">
                  <div className="roadmap-step-header">
                    <h4>Step 1: Current Skills Verified ({roadmap.completedSkills.length})</h4>
                  </div>
                  <div className="roadmap-step-content">
                    <p style={{ marginBottom: "10px" }}>Skills you already possess that match this job requirement:</p>
                    <div className="badge-list">
                      {roadmap.completedSkills.map((s) => (
                        <span key={s} className="badge success">{s}</span>
                      ))}
                      {roadmap.completedSkills.length === 0 && <span style={{ color: "var(--danger)" }}>None</span>}
                    </div>
                  </div>
                </div>

                {/* Step 2: Skill Gaps and Courses */}
                <div className="roadmap-step pending">
                  <div className="roadmap-step-header">
                    <h4>Step 2: Close Identified Skill Gaps ({roadmap.gaps.length})</h4>
                  </div>
                  <div className="roadmap-step-content">
                    <p style={{ marginBottom: "16px" }}>Acquire the missing qualifications by taking these recommended materials:</p>
                    <div style={{ display: "grid", gap: "16px" }}>
                      {roadmap.gaps.map((gap) => (
                        <div key={gap.skill} style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(255,255,255,0.01)" }}>
                          <strong style={{ color: "var(--primary)" }}>Missing Skill: {gap.skill}</strong>
                          <div style={{ marginTop: "10px", display: "grid", gap: "8px" }}>
                            {gap.resources.length > 0 ? (
                              gap.resources.map((res) => (
                                <div key={res._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <div>
                                    <span style={{ fontWeight: 600, color: "var(--ink)", fontSize: "13.5px" }}>{res.title}</span>
                                    <span style={{ display: "block", fontSize: "11px", color: "var(--muted)" }}>{res.provider} • {res.type}</span>
                                  </div>
                                  <a href={res.url} target="_blank" rel="noopener noreferrer">
                                    <button className="secondary" style={{ minHeight: "30px", padding: "0 10px", fontSize: "12px" }}>
                                      Start Learning
                                    </button>
                                  </a>
                                </div>
                              ))
                            ) : (
                              <span style={{ color: "var(--muted)", fontSize: "12.5px" }}>No curated resources available. Seek certification or online courses on {gap.skill}.</span>
                            )}
                          </div>
                        </div>
                      ))}
                      {roadmap.gaps.length === 0 && <span className="badge success">No skill gaps! You're ready to apply.</span>}
                    </div>
                  </div>
                </div>

                {/* Step 3: Application readiness */}
                <div className="roadmap-step">
                  <div className="roadmap-step-header">
                    <h4>Step 3: Job-Ready Application</h4>
                  </div>
                  <div className="roadmap-step-content">
                    <p>Once you close the skill gaps, you are ready to apply for this job at {roadmap.job.company}. Update your profile skills to view updated matching percentages!</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="panel span-5" style={{ alignSelf: "flex-start" }}>
              <h2>Job Details</h2>
              <div style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
                <p><strong>Required Experience:</strong> {roadmap.job.experienceLevel}</p>
                <p><strong>Category:</strong> {roadmap.job.category}</p>
                <p><strong>Salary Range:</strong> {roadmap.job.salaryRange || "Not Disclosed"}</p>
                <div style={{ borderTop: "1px solid var(--line)", paddingTop: "12px", marginTop: "8px" }}>
                  <strong>Description:</strong>
                  <p style={{ color: "var(--muted)", marginTop: "6px", fontSize: "14px" }}>{roadmap.job.description}</p>
                </div>
              </div>
            </div>
          </section>
        )
      )}
    </>
  );
}

// CONTENT MANAGER VIEW: Job listings CRUD
function JobsManager({ request, triggerSuccess, triggerError }) {
  const [jobs, setJobs] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editJobId, setEditJobId] = useState(null);

  async function loadJobs() {
    try {
      const data = await request("/api/jobs");
      setJobs(data || []);
      const skData = await request("/api/skills");
      setSkills(skData || []);
    } catch (err) {
      triggerError("Failed to fetch jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const requiredSkills = fd.getAll("requiredSkills");
    const values = {
      title: fd.get("title"),
      company: fd.get("company"),
      location: fd.get("location"),
      category: fd.get("category"),
      experienceLevel: fd.get("experienceLevel"),
      salaryRange: fd.get("salaryRange"),
      description: fd.get("description"),
      requiredSkills
    };

    try {
      if (editJobId) {
        await request(`/api/jobs/${editJobId}`, {
          method: "PUT",
          body: JSON.stringify(values)
        });
        triggerSuccess("Job updated successfully!");
      } else {
        await request("/api/jobs", {
          method: "POST",
          body: JSON.stringify(values)
        });
        triggerSuccess("New job added successfully!");
      }
      setShowForm(false);
      setEditJobId(null);
      loadJobs();
    } catch (err) {
      triggerError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this job listing?")) return;
    try {
      await request(`/api/jobs/${id}`, { method: "DELETE" });
      triggerSuccess("Job deleted successfully.");
      loadJobs();
    } catch (err) {
      triggerError("Failed to delete job.");
    }
  }

  function handleEdit(job) {
    setEditJobId(job._id);
    setShowForm(true);
    // Populate form values asynchronously
    setTimeout(() => {
      const form = document.getElementById("job-form");
      if (form) {
        form.elements.title.value = job.title;
        form.elements.company.value = job.company;
        form.elements.location.value = job.location;
        form.elements.category.value = job.category;
        form.elements.experienceLevel.value = job.experienceLevel;
        form.elements.salaryRange.value = job.salaryRange || "";
        form.elements.description.value = job.description;
        // set skills checkboxes
        const checkboxes = form.querySelectorAll('input[name="requiredSkills"]');
        checkboxes.forEach((cb) => {
          cb.checked = job.requiredSkills.includes(cb.value);
        });
      }
    }, 100);
  }

  return (
    <>
      <Topbar title="Job Listings Manager" subtitle="Manage jobs posted on the TalentMap recommendation platform.">
        <button onClick={() => { setShowForm(!showForm); setEditJobId(null); }}>
          {showForm ? "Close Form" : "Add New Job"}
        </button>
      </Topbar>

      {showForm && (
        <form id="job-form" className="panel form" style={{ marginBottom: "32px" }} onSubmit={handleSave}>
          <h2>{editJobId ? "Edit Job Listing" : "Create New Job Opening"}</h2>
          <div className="form-row">
            <label>Title <input name="title" required /></label>
            <label>Company <input name="company" required /></label>
          </div>
          <div className="form-row">
            <label>Location <input name="location" required /></label>
            <label>Category <input name="category" placeholder="Web Development" required /></label>
          </div>
          <div className="form-row">
            <label>
              Experience Level
              <select name="experienceLevel" defaultValue="entry">
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
              </select>
            </label>
            <label>Salary Range <input name="salaryRange" placeholder="$1000 - $1500 / month" /></label>
          </div>
          <label>Description <textarea name="description" required /></label>

          <label>
            Required Skills
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "10px", padding: "10px", border: "1px solid var(--line)", borderRadius: "8px", background: "rgba(0,0,0,0.1)" }}>
              {skills.map((skill) => (
                <div key={skill._id} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input type="checkbox" name="requiredSkills" value={skill.name} style={{ width: "auto", minHeight: "auto" }} />
                  <span>{skill.name}</span>
                </div>
              ))}
            </div>
          </label>

          <button type="submit">Save Job Opening</button>
        </form>
      )}

      {loading ? (
        <div className="panel empty">Loading job database...</div>
      ) : (
        <div className="grid">
          <div className="span-12 panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Job Details</th>
                  <th>Category</th>
                  <th>Skills Required</th>
                  <th>Experience</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job._id}>
                    <td>
                      <strong>{job.title}</strong>
                      <div style={{ color: "var(--muted)", fontSize: "13px" }}>{job.company} • {job.location}</div>
                    </td>
                    <td><span className="badge success">{job.category}</span></td>
                    <td>
                      <div className="badge-list">
                        {job.requiredSkills.map(s => <span key={s} className="badge">{s}</span>)}
                      </div>
                    </td>
                    <td style={{ textTransform: "capitalize" }}>{job.experienceLevel}</td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="secondary" onClick={() => handleEdit(job)}>Edit</button>
                        <button className="secondary danger" onClick={() => handleDelete(job._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty">No jobs posted yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// CONTENT MANAGER VIEW: Skills taxonomy manager
function SkillsManager({ request, triggerSuccess, triggerError }) {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadSkills() {
    try {
      const data = await request("/api/skills");
      setSkills(data || []);
    } catch (err) {
      triggerError("Failed to fetch skills.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSkills();
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await request("/api/skills", {
        method: "POST",
        body: JSON.stringify(values)
      });
      triggerSuccess("Skill added to taxonomy!");
      event.target.reset();
      loadSkills();
    } catch (err) {
      triggerError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this skill? This will affect matching scores immediately.")) return;
    try {
      await request(`/api/skills/${id}`, { method: "DELETE" });
      triggerSuccess("Skill deleted.");
      loadSkills();
    } catch (err) {
      triggerError("Failed to delete skill.");
    }
  }

  return (
    <>
      <Topbar title="Skill Taxonomy library" subtitle="Maintain the system-wide catalog of valid skills used by candidates and jobs." />
      <section className="grid">
        <form className="panel form span-4" onSubmit={handleAdd} style={{ alignSelf: "flex-start" }}>
          <h2>Add New Skill</h2>
          <label>Skill Name <input name="name" placeholder="e.g. Docker" required /></label>
          <label>Category <input name="category" placeholder="e.g. Cloud Engineering" required /></label>
          <label>Description <textarea name="description" placeholder="Short summary" /></label>
          <button type="submit">Register Skill</button>
        </form>

        <div className="panel span-8">
          <h2>Taxonomy Tree ({skills.length} skills)</h2>
          {loading ? (
            <div className="empty">Loading taxonomy...</div>
          ) : (
            <div className="table-wrap" style={{ marginTop: "16px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((skill) => (
                    <tr key={skill._id}>
                      <td><strong>{skill.name}</strong></td>
                      <td><span className="badge success">{skill.category}</span></td>
                      <td>{skill.description || "-"}</td>
                      <td>
                        <button className="secondary danger" onClick={() => handleDelete(skill._id)}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {skills.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty">No skills registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// CONTENT MANAGER VIEW: Resource curator
function ResourcesManager({ request, triggerSuccess, triggerError }) {
  const [resources, setResources] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadResources() {
    try {
      const resData = await request("/api/resources");
      setResources(resData || []);
      const skData = await request("/api/skills");
      setSkills(skData || []);
    } catch (err) {
      triggerError("Failed to load resources.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResources();
  }, []);

  async function handleAdd(event) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const skillsTaught = fd.getAll("skillsTaught");
    const values = {
      title: fd.get("title"),
      provider: fd.get("provider"),
      url: fd.get("url"),
      type: fd.get("type"),
      skillsTaught
    };

    try {
      await request("/api/resources", {
        method: "POST",
        body: JSON.stringify(values)
      });
      triggerSuccess("Learning resource curated!");
      event.target.reset();
      loadResources();
    } catch (err) {
      triggerError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this learning material?")) return;
    try {
      await request(`/api/resources/${id}`, { method: "DELETE" });
      triggerSuccess("Resource deleted.");
      loadResources();
    } catch (err) {
      triggerError("Failed to delete resource.");
    }
  }

  return (
    <>
      <Topbar title="Curated Learning Materials" subtitle="Associate courses and certifications to skill tags, used to fill user competency gaps." />
      <section className="grid">
        <form className="panel form span-4" onSubmit={handleAdd} style={{ alignSelf: "flex-start" }}>
          <h2>Add Resource</h2>
          <label>Course Title <input name="title" placeholder="Python for Everybody" required /></label>
          <label>Provider <input name="provider" placeholder="Coursera" required /></label>
          <label>URL Link <input name="url" placeholder="https://coursera.org/..." required /></label>
          <label>
            Type
            <select name="type">
              <option value="course">Online Course</option>
              <option value="certification">Industry Certification</option>
            </select>
          </label>

          <label>
            Skills Taught
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", padding: "10px", border: "1px solid var(--line)", borderRadius: "8px", maxHeight: "120px", overflowY: "auto" }}>
              {skills.map((skill) => (
                <div key={skill._id} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <input type="checkbox" name="skillsTaught" value={skill.name} style={{ width: "auto", minHeight: "auto" }} />
                  <span style={{ fontSize: "12.5px" }}>{skill.name}</span>
                </div>
              ))}
            </div>
          </label>

          <button type="submit">Curate Material</button>
        </form>

        <div className="panel span-8">
          <h2>Curated Course Index ({resources.length} courses)</h2>
          {loading ? (
            <div className="empty">Loading resources...</div>
          ) : (
            <div className="table-wrap" style={{ marginTop: "16px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Material Details</th>
                    <th>Type</th>
                    <th>Skills Covered</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res) => (
                    <tr key={res._id}>
                      <td>
                        <strong>{res.title}</strong>
                        <div style={{ fontSize: "12px", color: "var(--muted)" }}>{res.provider} • <a href={res.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>Visit Link</a></div>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>{res.type}</td>
                      <td>
                        <div className="badge-list">
                          {res.skillsTaught.map(s => <span key={s} className="badge">{s}</span>)}
                        </div>
                      </td>
                      <td>
                        <button className="secondary danger" onClick={() => handleDelete(res._id)}>
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {resources.length === 0 && (
                    <tr>
                      <td colSpan="4" className="empty">No learning resources curated yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ADMIN VIEW: Analytics & PDF Reports
function AnalyticsPanel({ request, token, triggerError }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await request("/api/admin/analytics");
        setAnalytics(data);
      } catch (err) {
        triggerError("Failed to load platform analytics.");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  async function handleDownloadPDF() {
    try {
      const response = await fetch("/api/admin/reports/pdf", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to export PDF report.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `talentmap-report-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      triggerError(err.message);
    }
  }

  return (
    <>
      <Topbar title="Platform Overview & Analytics" subtitle="Live statistics tracking system growth, engagement levels, and popular career tracks.">
        <button onClick={handleDownloadPDF} className="accent">
          <FileText size={16} /> Export PDF Report
        </button>
      </Topbar>

      {loading ? (
        <div className="panel empty">Computing analytics...</div>
      ) : (
        analytics && (
          <section className="grid">
            {/* Metric widgets */}
            <div className="panel span-3 metric">
              <div className="metric-icon"><UserCog size={22} /></div>
              <div className="metric-details">
                <span>Total Users</span>
                <strong>{analytics.metrics.totalUsers}</strong>
              </div>
            </div>
            <div className="panel span-3 metric">
              <div className="metric-icon"><Briefcase size={22} /></div>
              <div className="metric-details">
                <span>Active Jobs</span>
                <strong>{analytics.metrics.totalJobs}</strong>
              </div>
            </div>
            <div className="panel span-3 metric">
              <div className="metric-icon"><Cpu size={22} /></div>
              <div className="metric-details">
                <span>Skills Logged</span>
                <strong>{analytics.metrics.totalSkills}</strong>
              </div>
            </div>
            <div className="panel span-3 metric">
              <div className="metric-icon"><TrendingUp size={22} /></div>
              <div className="metric-details">
                <span>Avg Match Score</span>
                <strong>{analytics.metrics.averageMatchScore}%</strong>
              </div>
            </div>

            {/* Main Graphs / Tables */}
            <div className="panel span-7">
              <h2>User Roles Distribution</h2>
              <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14.5px" }}>
                  <span>Candidates (Students):</span>
                  <strong>{analytics.metrics.studentCount} accounts</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", height: "8px", borderRadius: "4px" }}>
                  <div style={{ background: "var(--primary)", height: "8px", borderRadius: "4px", width: `${(analytics.metrics.studentCount / analytics.metrics.totalUsers) * 100}%` }}></div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14.5px" }}>
                  <span>Content Managers (Staff):</span>
                  <strong>{analytics.metrics.staffCount} accounts</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", height: "8px", borderRadius: "4px" }}>
                  <div style={{ background: "var(--secondary)", height: "8px", borderRadius: "4px", width: `${(analytics.metrics.staffCount / analytics.metrics.totalUsers) * 100}%` }}></div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14.5px" }}>
                  <span>System Administrators:</span>
                  <strong>{analytics.metrics.adminCount} accounts</strong>
                </div>
                <div style={{ background: "rgba(255,255,255,0.05)", height: "8px", borderRadius: "4px" }}>
                  <div style={{ background: "var(--accent)", height: "8px", borderRadius: "4px", width: `${(analytics.metrics.adminCount / analytics.metrics.totalUsers) * 100}%` }}></div>
                </div>
              </div>
            </div>

            <div className="panel span-5">
              <h2>Popular Job Categories</h2>
              <div className="note-list" style={{ marginTop: "20px" }}>
                {analytics.popularCategories.map((c) => (
                  <div key={c.name} className="note-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{c.name}</strong>
                    <span className="badge success">{c.count} Job(s)</span>
                  </div>
                ))}
                {analytics.popularCategories.length === 0 && (
                  <div className="empty">No job category statistics.</div>
                )}
              </div>
            </div>
          </section>
        )
      )}
    </>
  );
}

// ADMIN VIEW: Users roles manager
function UsersManager({ request, currentUser, triggerSuccess, triggerError }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadUsers() {
    try {
      const data = await request("/api/admin/users");
      setUsers(data || []);
    } catch (err) {
      triggerError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function changeRole(userId, newRole) {
    try {
      await request(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole })
      });
      triggerSuccess("User role updated successfully.");
      loadUsers();
    } catch (err) {
      triggerError(err.message);
    }
  }

  return (
    <>
      <Topbar title="Role assignment control" subtitle="Promote or demote system permissions. Admin changes take effect instantly." />
      {loading ? (
        <div className="panel empty">Loading users...</div>
      ) : (
        <div className="grid">
          <div className="span-12 panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Registered Email</th>
                  <th>Current Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u._id === currentUser._id;
                  return (
                    <tr key={u._id} style={{ opacity: isSelf ? 0.8 : 1 }}>
                      <td>
                        <strong>{u.name}</strong>
                        {isSelf && <span className="badge success" style={{ marginLeft: "8px" }}>You</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className="badge success" style={{ textTransform: "uppercase" }}>{roleLabels[u.role]}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            className="secondary"
                            disabled={isSelf}
                            onClick={() => changeRole(u._id, "student")}
                          >
                            Set Candidate
                          </button>
                          <button
                            className="secondary"
                            disabled={isSelf}
                            onClick={() => changeRole(u._id, "staff")}
                          >
                            Set Manager
                          </button>
                          <button
                            className="secondary"
                            disabled={isSelf}
                            onClick={() => changeRole(u._id, "admin")}
                          >
                            Set Admin
                          </button>
                          <button
                            className="secondary"
                            disabled={isSelf}
                            onClick={() => changeRole(u._id, "super_admin")}
                          >
                            Set Super Admin
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ADMIN VIEW: Audit Logs
function AuditLogs({ request }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLogs() {
      try {
        const data = await request("/api/admin/audit-logs");
        setLogs(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <>
      <Topbar title="Activity Audit logs" subtitle="System accountability log tracing updates made by candidates, managers, and administrators." />
      {loading ? (
        <div className="panel empty">Loading logs...</div>
      ) : (
        <div className="grid">
          <div className="span-12 panel table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Event Action</th>
                  <th>Target Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>
                      <strong>{log.actor?.name || "System"}</strong>
                      <div style={{ fontSize: "11px", color: "var(--muted)" }}>{log.actor ? roleLabels[log.actor.role] : ""}</div>
                    </td>
                    <td><span className="badge success">{log.action}</span></td>
                    <td>{log.target || "-"}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan="4" className="empty">No audit logs available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// SUPER ADMIN VIEW: System configurations
function SystemConfigPanel({ request, triggerSuccess, triggerError }) {
  const [skillWeight, setSkillWeight] = useState(70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await request("/api/superadmin/config");
        setSkillWeight(config.skillWeight || 70);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      await request("/api/superadmin/config", {
        method: "PUT",
        body: JSON.stringify({
          skillWeight,
          interestWeight: 100 - skillWeight
        })
      });
      triggerSuccess("Global recommendation weights successfully saved!");
    } catch (err) {
      triggerError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Topbar title="Global recommender Weights" subtitle="Adjust dynamic weights for skill matching vs career interest category matching. Must sum to 100%." />
      {loading ? (
        <div className="panel empty">Loading config...</div>
      ) : (
        <section className="grid">
          <div className="panel span-7 slider-container">
            <h2>Weight Fine-Tuning</h2>
            <div className="slider-labels" style={{ marginTop: "20px" }}>
              <span style={{ color: "var(--primary)" }}>Skills Match: {skillWeight}%</span>
              <span style={{ color: "var(--accent)" }}>Interests Match: {100 - skillWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={skillWeight}
              onChange={(e) => setSkillWeight(Number(e.target.value))}
              style={{ margin: "18px 0" }}
            />
            <p style={{ color: "var(--muted)", fontSize: "14px", marginBottom: "20px" }}>
              Adjusting this will immediately change the Job Match Scores computed for all candidate profiles.
            </p>
            <button onClick={handleSave} disabled={saving}>
              {saving ? "Saving Changes..." : "Apply Global Weights"}
            </button>
          </div>

          <div className="panel span-5">
            <h2>Current Config Summary</h2>
            <div style={{ display: "grid", gap: "16px", marginTop: "16px", fontSize: "14.5px" }}>
              <p><strong>🎯 Skill Weight ({skillWeight}%):</strong> Percent of match score derived from direct intersection of user skills vs job required skills.</p>
              <p><strong>🔥 Interest Weight ({100 - skillWeight}%):</strong> Percent of match score derived from user career category matching job category.</p>
              <p><strong>⚡ Experience Level Matching:</strong> (Automatic) Deducts 15% penalty for each level mismatch between candidate and job requirements.</p>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

// SUPER ADMIN VIEW: Platform health metrics
function PlatformHealth({ request }) {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadHealth() {
    try {
      const data = await request("/api/superadmin/health");
      setHealth(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHealth();
    const timer = setInterval(loadHealth, 10000); // Poll health metrics
    return () => clearInterval(timer);
  }, []);

  function formatUptime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  }

  return (
    <>
      <Topbar title="System Diagnostics & Uptime" subtitle="Live health monitoring of MongoDB connections, system collections, and memory usages." />
      {loading ? (
        <div className="panel empty">Reading database sockets...</div>
      ) : (
        health && (
          <section className="grid">
            <div className="panel span-8">
              <h2>Infrastructure Health Diagnostics</h2>
              <div className="health-grid">
                <div className="health-card">
                  <span>MongoDB Connection</span>
                  <strong style={{ color: health.dbStatus === "connected" ? "var(--secondary)" : "var(--danger)" }}>
                    {health.dbStatus.toUpperCase()}
                  </strong>
                </div>
                <div className="health-card">
                  <span>Active Database</span>
                  <strong>{health.dbName}</strong>
                </div>
                <div className="health-card">
                  <span>Server Uptime</span>
                  <strong>{formatUptime(health.uptime)}</strong>
                </div>
                <div className="health-card">
                  <span>Process Memory</span>
                  <strong>{Math.round(health.memoryUsage.rss / 1024 / 1024)} MB</strong>
                </div>
              </div>
            </div>

            <div className="panel span-4">
              <h2>Collection Metrics</h2>
              <div className="note-list" style={{ marginTop: "16px" }}>
                <div className="note-item" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>User Accounts</span>
                  <strong>{health.counts.users}</strong>
                </div>
                <div className="note-item" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Job Listings</span>
                  <strong>{health.counts.jobs}</strong>
                </div>
                <div className="note-item" style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Audit Actions Logged</span>
                  <strong>{health.counts.auditLogs}</strong>
                </div>
              </div>
            </div>
          </section>
        )
      )}
    </>
  );
}

// Render the application
createRoot(document.getElementById("root")).render(<App />);
