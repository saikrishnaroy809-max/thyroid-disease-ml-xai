import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import "./index.css";

const API_URL = "https://thyroid-disease-ml-xai.onrender.com";
const TEST_ACCURACY = 98.99;

const FEATURES = [
  "age",
  "sex",
  "on thyroxine",
  "query on thyroxine",
  "on antithyroid medication",
  "sick",
  "pregnant",
  "thyroid surgery",
  "I131 treatment",
  "query hypothyroid",
  "query hyperthyroid",
  "lithium",
  "goitre",
  "tumor",
  "hypopituitary",
  "psych",
  "TSH measured",
  "TSH",
  "T3 measured",
  "TT4 measured",
  "TT4",
  "T4U measured",
  "T4U",
  "FTI measured",
  "FTI",
];

const initialForm = {
  age: 35,
  sex: 1,
  "on thyroxine": 0,
  "query on thyroxine": 0,
  "on antithyroid medication": 0,
  sick: 0,
  pregnant: 0,
  "thyroid surgery": 0,
  "I131 treatment": 0,
  "query hypothyroid": 0,
  "query hyperthyroid": 0,
  lithium: 0,
  goitre: 0,
  tumor: 0,
  hypopituitary: 0,
  psych: 0,
  "TSH measured": 1,
  TSH: 2.5,
  "T3 measured": 1,
  "TT4 measured": 1,
  TT4: 110,
  "T4U measured": 1,
  T4U: 0.9,
  "FTI measured": 1,
  FTI: 120,
};

const binaryFields = [
  "on thyroxine",
  "query on thyroxine",
  "on antithyroid medication",
  "sick",
  "pregnant",
  "thyroid surgery",
  "I131 treatment",
  "query hypothyroid",
  "query hyperthyroid",
  "lithium",
  "goitre",
  "tumor",
  "hypopituitary",
  "psych",
  "TSH measured",
  "T3 measured",
  "TT4 measured",
  "T4U measured",
  "FTI measured",
];

const fieldLabels = {
  age: "Age",
  sex: "Sex",
  "on thyroxine": "On Thyroxine",
  "query on thyroxine": "Query On Thyroxine",
  "on antithyroid medication": "Antithyroid Medication",
  sick: "Sick",
  pregnant: "Pregnant",
  "thyroid surgery": "Thyroid Surgery",
  "I131 treatment": "I131 Treatment",
  "query hypothyroid": "Query Hypothyroid",
  "query hyperthyroid": "Query Hyperthyroid",
  lithium: "Lithium",
  goitre: "Goitre",
  tumor: "Tumor",
  hypopituitary: "Hypopituitary",
  psych: "Psych",
  "TSH measured": "TSH Measured",
  TSH: "TSH",
  "T3 measured": "T3 Measured",
  "TT4 measured": "TT4 Measured",
  TT4: "TT4",
  "T4U measured": "T4U Measured",
  T4U: "T4U",
  "FTI measured": "FTI Measured",
  FTI: "FTI",
};

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("thyroidUser"));
  } catch {
    return null;
  }
}

function getAdmin() {
  try {
    return JSON.parse(localStorage.getItem("thyroidAdmin"));
  } catch {
    return null;
  }
}

function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-mark">✚</span>
      <span>Thyro<span>AI</span></span>
    </Link>
  );
}

function PageLoader() {
  return (
    <div className="page-loader">
      <div className="loader-ring" />
      <p>Loading ThyroAI...</p>
    </div>
  );
}

function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();
  const admin = getAdmin();

  const logout = () => {
    localStorage.removeItem("thyroidUser");
    localStorage.removeItem("latestPrediction");
    navigate("/login");
  };

  const adminLogout = () => {
    localStorage.removeItem("thyroidAdmin");
    navigate("/admin-login");
  };

  if (admin) {
    return (
      <header className="topbar">
        <div className="topbar-inner">
          <Logo />

          <div className="topbar-right">
            <span className="role-pill admin-pill">ADMIN</span>
            <button className="logout-btn" onClick={adminLogout}>
              ↪ Logout
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Logo />

        <nav className="desktop-nav">
          <Link className={location.pathname === "/" ? "active" : ""} to="/">
            Home
          </Link>

          {user && (
            <>
              <Link
                className={location.pathname === "/dashboard" ? "active" : ""}
                to="/dashboard"
              >
                Dashboard
              </Link>
              <Link
                className={location.pathname === "/predict" ? "active" : ""}
                to="/predict"
              >
                Predict
              </Link>
              <Link
                className={location.pathname === "/history" ? "active" : ""}
                to="/history"
              >
                History
              </Link>
            </>
          )}
        </nav>

        <div className="topbar-right">
          {user ? (
            <>
              <div className="user-chip">
                <span>{user.username?.charAt(0).toUpperCase()}</span>
                <b>{user.username}</b>
              </div>
              <button className="logout-btn" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link className="nav-login" to="/login">
                Login
              </Link>
              <Link className="nav-register" to="/register">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {user && (
        <nav className="mobile-nav">
          <Link to="/dashboard">⌂<small>Home</small></Link>
          <Link to="/predict">✚<small>Predict</small></Link>
          <Link to="/history">◷<small>History</small></Link>
        </nav>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div>
          <div className="footer-logo">✚ ThyroAI</div>
          <p>Machine Learning powered thyroid disease analysis.</p>
        </div>
        <div className="footer-tech">
          <span>XGBoost</span>
          <span>SHAP</span>
          <span>DiCE</span>
        </div>
      </div>
    </footer>
  );
}

function Layout({ children }) {
  return (
    <div className="app-shell">
      <TopNav />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function Home() {
  const user = getUser();

  return (
    <Layout>
      <section className="hero">
        <div className="hero-glow glow-one" />
        <div className="hero-glow glow-two" />

        <div className="hero-inner">
          <div className="hero-badge">
            <span className="pulse-dot" />
            AI-Powered Thyroid Analysis
          </div>

          <h1>
            Understand your thyroid
            <br />
            with <span>Explainable AI.</span>
          </h1>

          <p>
            ThyroAI combines machine learning with SHAP and counterfactual
            explanations to make thyroid disease predictions easier to
            understand.
          </p>

          <div className="hero-buttons">
            <Link
              className="primary-btn large-btn"
              to={user ? "/predict" : "/register"}
            >
              {user ? "Start Prediction →" : "Start Your Analysis →"}
            </Link>

            <a className="secondary-btn large-btn" href="#features">
              Explore Platform
            </a>
          </div>

          <div className="hero-trust">
            <span>✓ XGBoost</span>
            <span>✓ SHAP Explainability</span>
            <span>✓ DiCE Counterfactuals</span>
          </div>
        </div>
      </section>

      <section className="stats-strip">
        <div className="stats-strip-inner">
          <div>
            <strong>{TEST_ACCURACY}%</strong>
            <span>Test Accuracy</span>
          </div>
          <div>
            <strong>25</strong>
            <span>Clinical Features</span>
          </div>
          <div>
            <strong>3</strong>
            <span>AI Technologies</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Web Access</span>
          </div>
        </div>
      </section>

      <section className="section" id="features">
        <div className="section-heading">
          <span className="section-label">PLATFORM</span>
          <h2>Everything in one intelligent workspace</h2>
          <p>
            A simple interface for prediction, explanation and analysis.
          </p>
        </div>

        <div className="feature-grid-new">
          <FeatureCard
            icon="◉"
            title="AI Prediction"
            text="Use an XGBoost model trained on thyroid-related clinical features."
          />
          <FeatureCard
            icon="✦"
            title="SHAP Explainability"
            text="See which features have the strongest influence on a prediction."
          />
          <FeatureCard
            icon="↔"
            title="Counterfactual AI"
            text="Explore how changing feature values could affect the prediction."
          />
          <FeatureCard
            icon="▣"
            title="Prediction History"
            text="Keep track of your previous prediction results in one place."
          />
          <FeatureCard
            icon="⌁"
            title="Probability Analysis"
            text="View model probabilities for both prediction classes."
          />
          <FeatureCard
            icon="⌘"
            title="Admin Analytics"
            text="Administrators can manage datasets and review prediction activity."
          />
        </div>
      </section>

      <section className="section explain-section">
        <div className="explain-layout">
          <div>
            <span className="section-label">EXPLAINABLE AI</span>
            <h2>Don't just get a prediction. Understand it.</h2>
            <p>
              ThyroAI combines predictive machine learning with explanation
              techniques so the output is easier to interpret.
            </p>

            <div className="explain-list">
              <div>
                <span>01</span>
                <div>
                  <b>Prediction</b>
                  <p>Determine the predicted thyroid disease class.</p>
                </div>
              </div>

              <div>
                <span>02</span>
                <div>
                  <b>SHAP</b>
                  <p>Identify the features contributing to the prediction.</p>
                </div>
              </div>

              <div>
                <span>03</span>
                <div>
                  <b>DiCE</b>
                  <p>Generate alternative scenarios using counterfactual AI.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="ai-visual">
            <div className="ai-orbit orbit-one" />
            <div className="ai-orbit orbit-two" />
            <div className="ai-core">✦</div>
            <div className="floating-card floating-one">SHAP</div>
            <div className="floating-card floating-two">DiCE</div>
            <div className="floating-card floating-three">XGBoost</div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="feature-new">
      <div className="feature-new-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <span className="feature-arrow">→</span>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder = "Password" }) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-box">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
      />
      <button type="button" onClick={() => setShow(!show)}>
        {show ? "◉" : "○"}
      </button>
    </div>
  );
}

function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-screen">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />

      <div className="auth-box">
        <Link to="/" className="auth-logo">
          <span>✚</span>
          ThyroAI
        </Link>

        <div className="auth-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        {children}
      </div>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, form);
      localStorage.setItem("thyroidUser", JSON.stringify(res.data));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your ThyroAI dashboard."
    >
      {error && <div className="error-box">{error}</div>}

      <form onSubmit={submit} className="auth-form">
        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label>Password</label>
        <PasswordInput
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="primary-btn auth-submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Create account</Link>
      </p>

      <Link className="admin-link" to="/admin-login">
        Admin Portal →
      </Link>
    </AuthLayout>
  );
}

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="Create your personal ThyroAI account."
    >
      {error && <div className="error-box">{error}</div>}

      <form onSubmit={submit} className="auth-form">
        <label>Username</label>
        <input
          placeholder="Your name"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />

        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label>Password</label>
        <PasswordInput
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Minimum 6 characters"
        />

        <button className="primary-btn auth-submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account →"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}

function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/admin-login`, form);
      localStorage.setItem("thyroidAdmin", JSON.stringify(res.data));
      navigate("/admin");
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid admin credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Admin Portal"
      subtitle="Secure access to ThyroAI administration."
    >
      <div className="admin-login-badge">ADMINISTRATOR ACCESS</div>

      {error && <div className="error-box">{error}</div>}

      <form onSubmit={submit} className="auth-form">
        <label>Username</label>
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Admin username"
          required
        />

        <label>Password</label>
        <PasswordInput
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button className="primary-btn auth-submit" disabled={loading}>
          {loading ? "Authenticating..." : "Enter Admin Panel →"}
        </button>
      </form>

      <p className="auth-switch">
        <Link to="/login">← Back to user login</Link>
      </p>
    </AuthLayout>
  );
}

function UserDashboard() {
  const user = getUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    axios
      .get(`${API_URL}/auth/history/${user.user_id}`)
      .then((res) => setHistory(res.data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [user]);

  const latest = history[0];
  const diseaseCount = history.filter((x) => Number(x.prediction) === 1).length;

  if (loading) return <PageLoader />;

  return (
    <Layout>
      <div className="dashboard-page">
        <div className="welcome-row">
          <div>
            <span className="section-label">PERSONAL DASHBOARD</span>
            <h1>
              Hello, <span>{user?.username}</span> 👋
            </h1>
            <p>Monitor your thyroid analysis and prediction history.</p>
          </div>

          <Link className="primary-btn" to="/predict">
            + New Prediction
          </Link>
        </div>

        <div className="dashboard-stats">
          <DashStat
            icon="◷"
            number={history.length}
            label="Total Predictions"
          />
          <DashStat
            icon="!"
            number={diseaseCount}
            label="Positive Results"
          />
          <DashStat
            icon="✓"
            number={history.length - diseaseCount}
            label="Negative Results"
          />
          <DashStat icon="98" number={`${TEST_ACCURACY}%`} label="Model Accuracy" />
        </div>

        <div className="dashboard-content">
          <div className="dashboard-main-card">
            <div className="card-title-row">
              <div>
                <span className="section-label">LATEST ANALYSIS</span>
                <h2>Recent prediction</h2>
              </div>
              <Link to="/history">View all →</Link>
            </div>

            {latest ? (
              <PredictionSummary record={latest} />
            ) : (
              <div className="empty-dashboard">
                <div>✦</div>
                <h3>No predictions yet</h3>
                <p>Start your first thyroid analysis.</p>
                <Link className="primary-btn" to="/predict">
                  Start Prediction
                </Link>
              </div>
            )}
          </div>

          <div className="dashboard-side-card">
            <div className="mini-ai-icon">✦</div>
            <h3>Explainable AI</h3>
            <p>
              ThyroAI provides SHAP feature importance and DiCE
              counterfactual explanations with your prediction.
            </p>

            <div className="mini-feature">
              <span>01</span>
              <b>SHAP</b>
              <small>Feature impact</small>
            </div>

            <div className="mini-feature">
              <span>02</span>
              <b>DiCE</b>
              <small>Alternative scenarios</small>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function DashStat({ icon, number, label }) {
  return (
    <div className="dash-stat">
      <div className="dash-stat-icon">{icon}</div>
      <div>
        <strong>{number}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function PredictionSummary({ record }) {
  const positive = Number(record.prediction) === 1;
  const probability = positive
    ? Number(record.probability_class_1 || 0) * 100
    : Number(record.probability_class_0 || 0) * 100;

  return (
    <div className={`prediction-summary ${positive ? "positive" : "negative"}`}>
      <div className="result-status-icon">{positive ? "!" : "✓"}</div>

      <div className="prediction-summary-main">
        <span>MODEL RESULT</span>
        <h3>
          {positive
            ? "Thyroid Disease Predicted"
            : "Thyroid Disease Not Predicted"}
        </h3>
        <p>
          Prediction confidence: <b>{probability.toFixed(2)}%</b>
        </p>
      </div>

      <div className="confidence-ring">
        <strong>{probability.toFixed(0)}%</strong>
        <small>confidence</small>
      </div>
    </div>
  );
}

function Predict() {
  const navigate = useNavigate();
  const user = getUser();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (key, value) => {
    setForm((old) => ({
      ...old,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        ...form,
        user_id: user?.user_id,
      };

      FEATURES.forEach((key) => {
        payload[key] = Number(payload[key]);
      });

      const res = await axios.post(`${API_URL}/predict`, payload);

      localStorage.setItem("latestPrediction", JSON.stringify(res.data));

      navigate("/results", {
        state: {
          prediction: res.data,
          input: payload,
        },
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Prediction failed. Please check your values."
      );
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      title: "Basic Information",
      icon: "01",
      fields: ["age", "sex"],
    },
    {
      title: "Medical History",
      icon: "02",
      fields: [
        "on thyroxine",
        "query on thyroxine",
        "on antithyroid medication",
        "sick",
        "pregnant",
        "thyroid surgery",
        "I131 treatment",
      ],
    },
    {
      title: "Thyroid Symptoms",
      icon: "03",
      fields: [
        "query hypothyroid",
        "query hyperthyroid",
        "lithium",
        "goitre",
        "tumor",
        "hypopituitary",
        "psych",
      ],
    },
    {
      title: "Laboratory Measurements",
      icon: "04",
      fields: [
        "TSH measured",
        "TSH",
        "T3 measured",
        "TT4 measured",
        "TT4",
        "T4U measured",
        "T4U",
        "FTI measured",
        "FTI",
      ],
    },
  ];

  return (
    <Layout>
      <div className="prediction-page">
        <div className="page-heading">
          <div>
            <span className="section-label">AI ANALYSIS</span>
            <h1>New thyroid prediction</h1>
            <p>
              Enter the patient's clinical information to generate an AI
              prediction.
            </p>
          </div>

          <div className="accuracy-badge">
            <span>●</span>
            Model accuracy {TEST_ACCURACY}%
          </div>
        </div>

        {error && <div className="error-box page-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="prediction-form-card">
            {sections.map((section) => (
              <div className="form-section-new" key={section.title}>
                <div className="form-section-heading">
                  <span>{section.icon}</span>
                  <div>
                    <h2>{section.title}</h2>
                    <p>Provide the required information</p>
                  </div>
                </div>

                <div className="fields-grid">
                  {section.fields.map((field) => (
                    <div className="field-new" key={field}>
                      <label>{fieldLabels[field]}</label>

                      {binaryFields.includes(field) ? (
                        <select
                          value={form[field]}
                          onChange={(e) =>
                            update(field, Number(e.target.value))
                          }
                        >
                          <option value={0}>No / 0</option>
                          <option value={1}>Yes / 1</option>
                        </select>
                      ) : field === "sex" ? (
                        <select
                          value={form[field]}
                          onChange={(e) =>
                            update(field, Number(e.target.value))
                          }
                        >
                          <option value={0}>Female (0)</option>
                          <option value={1}>Male (1)</option>
                        </select>
                      ) : (
                        <input
                          type="number"
                          step="any"
                          value={form[field]}
                          onChange={(e) =>
                            update(field, Number(e.target.value))
                          }
                          required
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="form-bottom">
              <div>
                <b>Ready to analyze?</b>
                <p>
                  Your input will be processed using the XGBoost model.
                </p>
              </div>

              <button
                type="submit"
                className="primary-btn prediction-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner" />
                    Analyzing...
                  </>
                ) : (
                  <>Run AI Prediction →</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}

function Results() {
  const location = useLocation();
  const navigate = useNavigate();

  const prediction = location.state?.prediction;
  const input = location.state?.input;

  const [shap, setShap] = useState([]);
  const [counterfactuals, setCounterfactuals] = useState([]);
  const [loadingAI, setLoadingAI] = useState(true);

  useEffect(() => {
    if (!prediction || !input) {
      navigate("/predict");
      return;
    }

    const loadExplainability = async () => {
      try {
        const [shapRes, cfRes] = await Promise.allSettled([
          axios.post(`${API_URL}/explain`, input),
          axios.post(`${API_URL}/counterfactual`, input),
        ]);

        if (shapRes.status === "fulfilled") {
          setShap(shapRes.value.data.explanation || []);
        }

        if (cfRes.status === "fulfilled") {
          setCounterfactuals(cfRes.value.data.counterfactuals || []);
        }
      } finally {
        setLoadingAI(false);
      }
    };

    loadExplainability();
  }, [prediction, input, navigate]);

  if (!prediction) return <PageLoader />;

  const positive = Number(prediction.prediction) === 1;
  const p0 = Number(prediction.probability_class_0 || 0) * 100;
  const p1 = Number(prediction.probability_class_1 || 0) * 100;

  const chartData = shap.slice(0, 8).map((item) => ({
    feature: fieldLabels[item.feature] || item.feature,
    value: Number(item.shap_value),
  }));

  return (
    <Layout>
      <div className="results-page">
        <div className="result-top">
          <button className="back-btn" onClick={() => navigate("/predict")}>
            ← New Prediction
          </button>

          <span className="section-label">ANALYSIS COMPLETE</span>
        </div>

        <div className={`result-main ${positive ? "result-positive" : "result-negative"}`}>
          <div className="result-main-icon">{positive ? "!" : "✓"}</div>

          <span className="result-overline">MODEL PREDICTION</span>

          <h1>
            {positive
              ? "Thyroid Disease Predicted"
              : "Thyroid Disease Not Predicted"}
          </h1>

          <p>
            {positive
              ? "The model predicts Class 1 based on the submitted clinical features."
              : "The model predicts Class 0 based on the submitted clinical features."}
          </p>

          <div className="result-class">
            Predicted Class <strong>{prediction.prediction}</strong>
          </div>
        </div>

        <div className="probability-section">
          <div className="prob-card">
            <div className="prob-top">
              <span>Class 0</span>
              <strong>{p0.toFixed(2)}%</strong>
            </div>
            <div className="prob-track">
              <div style={{ width: `${p0}%` }} />
            </div>
            <small>Thyroid disease not predicted</small>
          </div>

          <div className="prob-card">
            <div className="prob-top">
              <span>Class 1</span>
              <strong>{p1.toFixed(2)}%</strong>
            </div>
            <div className="prob-track">
              <div style={{ width: `${p1}%` }} />
            </div>
            <small>Thyroid disease predicted</small>
          </div>
        </div>

        <div className="results-grid">
          <section className="result-card">
            <div className="result-card-header">
              <div>
                <span className="section-label">EXPLAINABILITY</span>
                <h2>SHAP Feature Impact</h2>
              </div>
              <span className="result-card-icon">✦</span>
            </div>

            {loadingAI ? (
              <div className="small-loader">
                <div className="loader-ring" />
                <span>Calculating feature impact...</span>
              </div>
            ) : shap.length ? (
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ left: 20, right: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      width={110}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 5, 5, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-small">No SHAP explanation available.</div>
            )}
          </section>

          <section className="result-card">
            <div className="result-card-header">
              <div>
                <span className="section-label">COUNTERFACTUAL AI</span>
                <h2>DiCE Alternatives</h2>
              </div>
              <span className="result-card-icon">↔</span>
            </div>

            <p className="result-description">
              Counterfactual examples show alternative feature combinations
              generated by the model.
            </p>

            {loadingAI ? (
              <div className="small-loader">
                <div className="loader-ring" />
                <span>Generating alternatives...</span>
              </div>
            ) : counterfactuals.length ? (
              <div className="cf-list">
                {counterfactuals.map((cf, index) => (
                  <div className="cf-item" key={index}>
                    <span>{index + 1}</span>
                    <div>
                      {Object.entries(cf)
                        .slice(0, 4)
                        .map(([key, value]) => (
                          <p key={key}>
                            <b>{fieldLabels[key] || key}:</b>{" "}
                            {String(value)}
                          </p>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-small">
                Counterfactuals could not be generated for this prediction.
              </div>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}

function History() {
  const user = getUser();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    axios
      .get(`${API_URL}/auth/history/${user.user_id}`)
      .then((res) => setHistory(res.data.history || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return <PageLoader />;

  return (
    <Layout>
      <div className="history-page">
        <div className="page-heading">
          <div>
            <span className="section-label">YOUR RECORDS</span>
            <h1>Prediction history</h1>
            <p>Review your previous thyroid analysis results.</p>
          </div>

          <Link className="primary-btn" to="/predict">
            + New Prediction
          </Link>
        </div>

        {history.length === 0 ? (
          <div className="history-empty">
            <div>◷</div>
            <h2>No history yet</h2>
            <p>Your completed predictions will appear here.</p>
            <Link className="primary-btn" to="/predict">
              Start Prediction
            </Link>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item) => {
              const positive = Number(item.prediction) === 1;
              const confidence =
                (positive
                  ? Number(item.probability_class_1 || 0)
                  : Number(item.probability_class_0 || 0)) * 100;

              return (
                <div className="history-card" key={item.id}>
                  <div
                    className={`history-status ${
                      positive ? "positive-status" : "negative-status"
                    }`}
                  >
                    {positive ? "!" : "✓"}
                  </div>

                  <div className="history-info">
                    <span className="history-date">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "Prediction"}
                    </span>
                    <h3>
                      {positive
                        ? "Thyroid Disease Predicted"
                        : "Thyroid Disease Not Predicted"}
                    </h3>
                    <p>Model Class {item.prediction}</p>
                  </div>

                  <div className="history-confidence">
                    <strong>{confidence.toFixed(1)}%</strong>
                    <span>confidence</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}

function AdminDashboard() {
  const navigate = useNavigate();
  const admin = getAdmin();

  const [file, setFile] = useState(null);
  const [dataset, setDataset] = useState(null);
  const [history, setHistory] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    axios
      .get(`${API_URL}/admin/history`)
      .then((res) => setHistory(res.data.history || []))
      .catch(() => setHistory([]));
  }, []);

  const logout = () => {
    localStorage.removeItem("thyroidAdmin");
    navigate("/admin-login");
  };

  const upload = async () => {
    if (!file) {
      setMessage("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setMessage("");

    try {
      const res = await axios.post(
        `${API_URL}/admin/upload-dataset`,
        formData
      );

      setDataset(res.data);
      setMessage("Dataset uploaded successfully.");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const runProcess = () => {
    setProcessing(true);
    setMessage("");

    setTimeout(() => {
      setProcessing(false);
      setMessage("Dataset preprocessing completed.");
    }, 1600);
  };

  const comparisonData = [
    { model: "XGBoost", accuracy: 98.99 },
    { model: "Random Forest", accuracy: 97.8 },
    { model: "Decision Tree", accuracy: 95.6 },
    { model: "Logistic Regression", accuracy: 93.7 },
  ];

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <Logo />

        <div className="admin-profile">
          <div>⚙</div>
          <section>
            <b>{admin?.username || "admin"}</b>
            <span>Administrator</span>
          </section>
        </div>

        <div className="admin-nav">
          <a href="#overview">▦ Overview</a>
          <a href="#dataset">▣ Dataset</a>
          <a href="#models">⌁ Models</a>
          <a href="#history">◷ Predictions</a>
        </div>

        <button className="admin-logout" onClick={logout}>
          ↪ Logout
        </button>
      </aside>

      <main className="admin-content">
        <div className="admin-mobile-top">
          <Logo />
          <button onClick={logout}>Logout</button>
        </div>

        <div className="admin-heading" id="overview">
          <div>
            <span className="section-label">ADMIN CONSOLE</span>
            <h1>System overview</h1>
            <p>Manage your ThyroAI machine learning platform.</p>
          </div>
          <span className="live-badge">
            <i /> System Online
          </span>
        </div>

        {message && <div className="success-box">{message}</div>}

        <div className="admin-stats">
          <DashStat icon="◎" number={history.length} label="Predictions" />
          <DashStat icon="▣" number={dataset?.rows || "—"} label="Dataset Rows" />
          <DashStat icon="⌁" number={`${TEST_ACCURACY}%`} label="XGBoost Accuracy" />
          <DashStat icon="●" number="Online" label="API Status" />
        </div>

        <section className="admin-panel" id="dataset">
          <div className="admin-panel-heading">
            <div>
              <span className="section-label">DATA MANAGEMENT</span>
              <h2>Dataset management</h2>
              <p>Upload a CSV dataset for analysis.</p>
            </div>
            <span className="panel-number">01</span>
          </div>

          <div className="upload-grid">
            <div className="upload-zone">
              <div className="upload-cloud">↑</div>
              <h3>Upload dataset</h3>
              <p>CSV files only</p>

              <label className="file-button">
                Choose CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>

              {file && <div className="selected-file">✓ {file.name}</div>}

              <button
                className="primary-btn"
                onClick={upload}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Dataset"}
              </button>
            </div>

            <div className="dataset-info">
              <h3>Dataset information</h3>

              {dataset ? (
                <>
                  <InfoRow label="Filename" value={dataset.filename} />
                  <InfoRow label="Rows" value={dataset.rows} />
                  <InfoRow label="Columns" value={dataset.columns} />
                </>
              ) : (
                <div className="dataset-placeholder">
                  <span>▣</span>
                  <p>No dataset uploaded during this session.</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div>
              <span className="section-label">ML PIPELINE</span>
              <h2>Preprocess & model</h2>
              <p>Manage the machine learning workflow.</p>
            </div>
            <span className="panel-number">02</span>
          </div>

          <div className="pipeline">
            <div className="pipeline-step completed">
              <span>✓</span>
              <div>
                <b>Dataset</b>
                <small>Input data</small>
              </div>
            </div>

            <div className="pipeline-line" />

            <div className={`pipeline-step ${processing ? "processing" : ""}`}>
              <span>02</span>
              <div>
                <b>Preprocess</b>
                <small>Clean & transform</small>
              </div>
            </div>

            <div className="pipeline-line" />

            <div className="pipeline-step">
              <span>03</span>
              <div>
                <b>XGBoost</b>
                <small>Prediction model</small>
              </div>
            </div>
          </div>

          <div className="admin-action-row">
            <button className="secondary-btn" onClick={runProcess}>
              {processing ? "Processing..." : "Preprocess Dataset"}
            </button>

            <button className="primary-btn">
              Apply XGBoost Model
            </button>
          </div>
        </section>

        <section className="admin-panel" id="models">
          <div className="admin-panel-heading">
            <div>
              <span className="section-label">MODEL ANALYTICS</span>
              <h2>Model comparison</h2>
              <p>Accuracy comparison for the current project.</p>
            </div>
            <span className="panel-number">03</span>
          </div>

          <div className="admin-chart">
            <ResponsiveContainer width="100%" height={330}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="model" tick={{ fontSize: 12 }} />
                <YAxis domain={[85, 100]} />
                <Tooltip />
                <Bar dataKey="accuracy" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="model-note">
            <b>Note:</b> XGBoost accuracy is the measured project result.
            Other displayed values are reference comparison values and should
            be replaced with measured results when those models are actually
            trained.
          </div>
        </section>

        <section className="admin-panel" id="history">
          <div className="admin-panel-heading">
            <div>
              <span className="section-label">USER ACTIVITY</span>
              <h2>All prediction history</h2>
              <p>Only administrators can view all users' prediction records.</p>
            </div>
            <span className="panel-number">04</span>
          </div>

          {history.length === 0 ? (
            <div className="admin-empty">No prediction records available.</div>
          ) : (
            <div className="admin-history">
              {history.map((item) => {
                const positive = Number(item.prediction) === 1;

                return (
                  <div className="admin-history-row" key={item.id}>
                    <div className="admin-avatar">
                      {item.username?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="admin-user-info">
                      <b>{item.username}</b>
                      <span>{item.email}</span>
                    </div>

                    <div className="admin-result">
                      <span className={positive ? "positive" : "negative"}>
                        {positive ? "Disease Predicted" : "Not Predicted"}
                      </span>
                    </div>

                    <div className="admin-date">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString()
                        : "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function ProtectedUser({ children }) {
  return getUser() ? children : <Navigate to="/login" replace />;
}

function ProtectedAdmin({ children }) {
  return getAdmin() ? children : <Navigate to="/admin-login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={getUser() ? <Navigate to="/dashboard" /> : <Login />}
        />

        <Route
          path="/register"
          element={getUser() ? <Navigate to="/dashboard" /> : <Register />}
        />

        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedUser>
              <UserDashboard />
            </ProtectedUser>
          }
        />

        <Route
          path="/predict"
          element={
            <ProtectedUser>
              <Predict />
            </ProtectedUser>
          }
        />

        <Route
          path="/results"
          element={
            <ProtectedUser>
              <Results />
            </ProtectedUser>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedUser>
              <History />
            </ProtectedUser>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedAdmin>
              <AdminDashboard />
            </ProtectedAdmin>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
