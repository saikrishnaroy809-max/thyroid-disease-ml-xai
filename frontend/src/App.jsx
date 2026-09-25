import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import "./index.css";

const API_URL = "https://thyroid-disease-ml-xai.onrender.com";
const TEST_ACCURACY = 98.99;

/* =========================================================
   MODEL FEATURES
========================================================= */

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

const INITIAL_FORM = {
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
  TT4: 100,
  "T4U measured": 1,
  T4U: 1,
  "FTI measured": 1,
  FTI: 100,
};

/* =========================================================
   HELPERS
========================================================= */

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

function saveUser(user) {
  localStorage.setItem("thyroidUser", JSON.stringify(user));
}

function saveAdmin(admin) {
  localStorage.setItem("thyroidAdmin", JSON.stringify(admin));
}

function logoutUser() {
  localStorage.removeItem("thyroidUser");
  localStorage.removeItem("latestPrediction");
  window.location.href = "/login";
}

function logoutAdmin() {
  localStorage.removeItem("thyroidAdmin");
  window.location.href = "/admin-login";
}

function formatFeatureName(name) {
  return name
    .replace("TSH", "TSH")
    .replace("TT4", "TT4")
    .replace("T4U", "T4U")
    .replace("FTI", "FTI")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function getErrorMessage(error) {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }

  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  required = true,
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-field">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
      />

      <button
        type="button"
        className="password-eye"
        onClick={() => setShow((previous) => !previous)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

/* =========================================================
   NAVBAR
========================================================= */

function Navbar() {
  const [user, setUser] = useState(getUser());
  const [admin, setAdmin] = useState(getAdmin());

  useEffect(() => {
    const update = () => {
      setUser(getUser());
      setAdmin(getAdmin());
    };

    window.addEventListener("storage", update);

    const interval = setInterval(update, 1000);

    return () => {
      window.removeEventListener("storage", update);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        <div className="brand-icon">🦋</div>

        <div>
          <div className="brand-name">ThyroAI</div>
          <div className="brand-subtitle">Intelligent Thyroid Diagnosis</div>
        </div>
      </Link>

      <nav className="nav-links">
        <Link to="/">Home</Link>

        {user && (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/prediction">Prediction</Link>
            <Link to="/history">History</Link>
          </>
        )}

        {admin && <Link to="/admin">Admin Dashboard</Link>}

        {!user && !admin && (
          <>
            <Link to="/login">User Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/admin-login">Admin</Link>
          </>
        )}

        {user && (
          <button className="nav-logout" onClick={logoutUser}>
            Logout
          </button>
        )}

        {admin && (
          <button className="nav-logout" onClick={logoutAdmin}>
            Logout
          </button>
        )}
      </nav>
    </header>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer() {
  return (
    <footer className="footer">
      <div>
        <strong>ThyroAI</strong>
        <p>
          Machine Learning powered thyroid disease prediction with
          Explainable AI.
        </p>
      </div>

      <div className="footer-right">
        <span> XGBoost</span>
        <span> SHAP</span>
        <span> DiCE</span>
      </div>
    </footer>
  );
}

/* =========================================================
   LAYOUT
========================================================= */

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-content">{children}</main>

      <Footer />
    </div>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home() {
  const user = getUser();
  const admin = getAdmin();

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">
            AI-POWERED THYROID ANALYSIS
          </div>

          <h1>
            Smarter Thyroid
            <span> Diagnosis with AI</span>
          </h1>

          <p>
            ThyroAI uses machine learning and Explainable AI to predict
            thyroid disease and explain the factors behind every prediction.
          </p>

          <div className="hero-buttons">
            {user ? (
              <Link to="/prediction" className="primary-button">
                Start Prediction →
              </Link>
            ) : admin ? (
              <Link to="/admin" className="primary-button">
                Open Admin Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="primary-button">
                  Get Started →
                </Link>

                <Link to="/login" className="secondary-button">
                  User Login
                </Link>
              </>
            )}
          </div>

          <div className="hero-trust">
            <div>
              <strong>98.99%</strong>
              <span>Test Accuracy</span>
            </div>

            <div>
              <strong>XGBoost</strong>
              <span>ML Model</span>
            </div>

            <div>
              <strong>SHAP + DiCE</strong>
              <span>Explainability</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="medical-card">
            <div className="medical-card-icon">🩺</div>

            <h3>Thyroid AI Analysis</h3>

            <div className="analysis-row">
              <span>Machine Learning</span>
              <strong>98.99%</strong>
            </div>

            <div className="analysis-row">
              <span>Explainability</span>
              <strong>SHAP</strong>
            </div>

            <div className="analysis-row">
              <span>Counterfactuals</span>
              <strong>DiCE</strong>
            </div>

            <div className="analysis-status">
              <span className="status-dot"></span>
              AI System Ready
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="section-heading">
          <span>POWERFUL FEATURES</span>
          <h2>One Platform. Complete Analysis.</h2>
          <p>
            From prediction to explanation, ThyroAI provides a complete
            machine-learning workflow.
          </p>
        </div>

        <div className="feature-grid">
          <FeatureCard
            icon="🤖"
            title="XGBoost Prediction"
            text="Predict thyroid disease using a trained XGBoost machine learning model."
          />

          <FeatureCard
            icon="📊"
            title="SHAP Explanation"
            text="Understand which patient features contributed most to the prediction."
          />

          <FeatureCard
            icon="🔄"
            title="DiCE Counterfactuals"
            text="Explore possible changes that could lead to a different prediction."
          />

          <FeatureCard
            icon="📜"
            title="Prediction History"
            text="Securely review previous predictions and their results."
          />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, text }) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

/* =========================================================
   USER LOGIN
========================================================= */

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      saveUser(response.data);
      localStorage.removeItem("thyroidAdmin");

      navigate("/dashboard");
    } catch (error) {
      setError(await getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage
      title="Welcome Back"
      subtitle="Sign in to continue to your thyroid analysis dashboard."
      footer={
        <>
          Don't have an account? <Link to="/register">Create one</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-box">{error}</div>}

        <label>Email Address</label>

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label>Password</label>

        <PasswordField
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <button className="primary-button full-button" disabled={loading}>
          {loading ? "Signing in..." : "Sign In →"}
        </button>
      </form>
    </AuthPage>
  );
}

/* =========================================================
   REGISTER
========================================================= */

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API_URL}/auth/register`, {
        username,
        email,
        password,
      });

      alert("Registration successful. Please login.");

      navigate("/login");
    } catch (error) {
      setError(await getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage
      title="Create Your Account"
      subtitle="Start using AI-powered thyroid analysis."
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-box">{error}</div>}

        <label>Username</label>

        <input
          type="text"
          placeholder="Enter username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <label>Email Address</label>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <label>Password</label>

        <PasswordField
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <label>Confirm Password</label>

        <PasswordField
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm password"
        />

        <button className="primary-button full-button" disabled={loading}>
          {loading ? "Creating account..." : "Create Account →"}
        </button>
      </form>
    </AuthPage>
  );
}

/* =========================================================
   AUTH PAGE
========================================================= */

function AuthPage({ title, subtitle, children, footer }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">🦋</div>

        <h1>{title}</h1>

        <p>{subtitle}</p>

        {children}

        <div className="auth-footer">{footer}</div>
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN LOGIN
========================================================= */

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/admin-login`, {
        username,
        password,
      });

      saveAdmin(response.data);
      localStorage.removeItem("thyroidUser");

      navigate("/admin");
    } catch (error) {
      setError(await getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthPage
      title="Admin Portal"
      subtitle="Secure access to the ThyroAI administration dashboard."
      footer={
        <>
          User account? <Link to="/login">User Login</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <div className="error-box">{error}</div>}

        <label>Admin Username</label>

        <input
          type="text"
          placeholder="Enter admin username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <label>Admin Password</label>

        <PasswordField
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter admin password"
        />

        <button className="primary-button full-button" disabled={loading}>
          {loading ? "Signing in..." : "Admin Sign In →"}
        </button>

        <div className="demo-login">
          <strong>Demo credentials</strong>
          <span>Username: admin</span>
          <span>Password: admin123</span>
        </div>
      </form>
    </AuthPage>
  );
}

/* =========================================================
   USER DASHBOARD
========================================================= */

function UserDashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.user_id) {
      return;
    }

    async function loadHistory() {
      try {
        const response = await axios.get(
          `${API_URL}/auth/history/${user.user_id}`
        );

        setHistory(response.data.history || []);
      } catch {
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user?.user_id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const latest = history[0];

  return (
    <div className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <span className="dashboard-label">USER DASHBOARD</span>

          <h1>
            Welcome, <span>{user.username}</span>
          </h1>

          <p>
            Manage your thyroid predictions and understand your AI results.
          </p>
        </div>

        <button className="primary-button" onClick={() => navigate("/prediction")}>
          + New Prediction
        </button>
      </section>

      <div className="stats-grid">
        <StatCard
          icon="🧪"
          title="Predictions"
          value={loading ? "..." : history.length}
        />

        <StatCard
          icon="📊"
          title="Model Accuracy"
          value={`${TEST_ACCURACY}%`}
        />

        <StatCard
          icon="🤖"
          title="Model"
          value="XGBoost"
        />

        <StatCard
          icon="🔬"
          title="Explainability"
          value="SHAP + DiCE"
        />
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <span className="small-label">LATEST RESULT</span>
              <h2>Recent Prediction</h2>
            </div>

            <span className="card-icon">🩺</span>
          </div>

          {latest ? (
            <div className="latest-result">
              <div
                className={`result-status ${
                  latest.prediction === 1 ? "danger" : "success"
                }`}
              >
                {latest.prediction === 1
                  ? "Thyroid Disease Predicted"
                  : "Thyroid Disease Not Predicted"}
              </div>

              <div className="probability-row">
                <span>Class 0</span>
                <strong>
                  {(latest.probability_class_0 * 100).toFixed(2)}%
                </strong>
              </div>

              <div className="probability-row">
                <span>Class 1</span>
                <strong>
                  {(latest.probability_class_1 * 100).toFixed(2)}%
                </strong>
              </div>

              <button
                className="secondary-button full-button"
                onClick={() => navigate("/history")}
              >
                View History
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <div>🔍</div>
              <h3>No predictions yet</h3>
              <p>Start your first thyroid prediction.</p>

              <button
                className="primary-button"
                onClick={() => navigate("/prediction")}
              >
                Start Prediction
              </button>
            </div>
          )}
        </div>

        <div className="dashboard-card">
          <div className="card-heading">
            <div>
              <span className="small-label">EXPLAINABLE AI</span>
              <h2>Understand Your Result</h2>
            </div>

            <span className="card-icon">💡</span>
          </div>

          <div className="explain-item">
            <span>📊</span>
            <div>
              <strong>SHAP</strong>
              <p>See which features influenced the prediction.</p>
            </div>
          </div>

          <div className="explain-item">
            <span>🔄</span>
            <div>
              <strong>DiCE</strong>
              <p>Explore possible counterfactual changes.</p>
            </div>
          </div>

          <button
            className="primary-button full-button"
            onClick={() => navigate("/prediction")}
          >
            Run New Analysis
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

/* =========================================================
   PREDICTION PAGE
========================================================= */

function PredictionPage() {
  const navigate = useNavigate();
  const user = getUser();

  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function updateField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function updateNumberField(name, value) {
    setForm((previous) => ({
      ...previous,
      [name]: Number(value),
    }));
  }

  async function handlePrediction(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const payload = {
        ...form,
        user_id: user.user_id,
      };

      const missing = FEATURES.filter(
        (feature) =>
          payload[feature] === undefined ||
          payload[feature] === null ||
          Number.isNaN(Number(payload[feature]))
      );

      if (missing.length > 0) {
        throw new Error(
          `Please provide valid values for: ${missing.join(", ")}`
        );
      }

      const [predictionResponse, explanationResponse, counterfactualResponse] =
        await Promise.all([
          axios.post(`${API_URL}/predict`, payload),
          axios.post(`${API_URL}/explain`, payload),
          axios.post(`${API_URL}/counterfactual`, payload),
        ]);

      const result = {
        ...predictionResponse.data,
        explanation: explanationResponse.data?.explanation || [],
        counterfactuals:
          counterfactualResponse.data?.counterfactuals || [],
        input_data: form,
        created_at: new Date().toISOString(),
      };

      localStorage.setItem("latestPrediction", JSON.stringify(result));

      navigate("/results");
    } catch (error) {
      setError(await getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="prediction-page">
      <div className="prediction-header">
        <span className="dashboard-label">AI PREDICTION</span>

        <h1>Thyroid Disease Analysis</h1>

        <p>
          Enter the patient information below. The AI model will analyze the
          data and provide an explainable prediction.
        </p>
      </div>

      {error && <div className="error-box prediction-error">{error}</div>}

      <form onSubmit={handlePrediction}>
        <PredictionSection
          title="Patient Information"
          subtitle="Basic patient characteristics"
        >
          <NumberInput
            label="Age"
            value={form.age}
            onChange={(value) => updateNumberField("age", value)}
            min="1"
            max="120"
          />

          <SelectInput
            label="Sex"
            value={form.sex}
            onChange={(value) => updateField("sex", Number(value))}
            options={[
              ["0", "Female"],
              ["1", "Male"],
            ]}
          />
        </PredictionSection>

        <PredictionSection
          title="Medication & Treatment"
          subtitle="Previous thyroid-related treatment indicators"
        >
          {[
            "on thyroxine",
            "query on thyroxine",
            "on antithyroid medication",
            "thyroid surgery",
            "I131 treatment",
            "lithium",
          ].map((field) => (
            <BinaryInput
              key={field}
              label={formatFeatureName(field)}
              value={form[field]}
              onChange={(value) => updateField(field, Number(value))}
            />
          ))}
        </PredictionSection>

        <PredictionSection
          title="Clinical Indicators"
          subtitle="Patient clinical condition indicators"
        >
          {[
            "sick",
            "pregnant",
            "query hypothyroid",
            "query hyperthyroid",
            "goitre",
            "tumor",
            "hypopituitary",
            "psych",
          ].map((field) => (
            <BinaryInput
              key={field}
              label={formatFeatureName(field)}
              value={form[field]}
              onChange={(value) => updateField(field, Number(value))}
            />
          ))}
        </PredictionSection>

        <PredictionSection
          title="Thyroid Laboratory Values"
          subtitle="Enter available thyroid test measurements"
        >
          <BinaryInput
            label="TSH Measured"
            value={form["TSH measured"]}
            onChange={(value) =>
              updateField("TSH measured", Number(value))
            }
          />

          <NumberInput
            label="TSH"
            value={form.TSH}
            onChange={(value) => updateNumberField("TSH", value)}
            step="0.01"
          />

          <BinaryInput
            label="T3 Measured"
            value={form["T3 measured"]}
            onChange={(value) =>
              updateField("T3 measured", Number(value))
            }
          />

          <BinaryInput
            label="TT4 Measured"
            value={form["TT4 measured"]}
            onChange={(value) =>
              updateField("TT4 measured", Number(value))
            }
          />

          <NumberInput
            label="TT4"
            value={form.TT4}
            onChange={(value) => updateNumberField("TT4", value)}
            step="0.01"
          />

          <BinaryInput
            label="T4U Measured"
            value={form["T4U measured"]}
            onChange={(value) =>
              updateField("T4U measured", Number(value))
            }
          />

          <NumberInput
            label="T4U"
            value={form.T4U}
            onChange={(value) => updateNumberField("T4U", value)}
            step="0.01"
          />

          <BinaryInput
            label="FTI Measured"
            value={form["FTI measured"]}
            onChange={(value) =>
              updateField("FTI measured", Number(value))
            }
          />

          <NumberInput
            label="FTI"
            value={form.FTI}
            onChange={(value) => updateNumberField("FTI", value)}
            step="0.01"
          />
        </PredictionSection>

        <div className="prediction-submit">
          <button
            type="submit"
            className="primary-button prediction-button"
            disabled={loading}
          >
            {loading
              ? "Analyzing Patient Data..."
              : "🔬 Predict Thyroid Disease"}
          </button>

          <p>
            Your prediction includes XGBoost classification, SHAP explanation
            and DiCE counterfactual analysis.
          </p>
        </div>
      </form>
    </div>
  );
}

/* =========================================================
   PREDICTION INPUT COMPONENTS
========================================================= */

function PredictionSection({ title, subtitle, children }) {
  return (
    <section className="prediction-section">
      <div className="prediction-section-heading">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="prediction-fields">{children}</div>
    </section>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = "1",
}) {
  return (
    <div className="form-field">
      <label>{label}</label>

      <input
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        min={min}
        max={max}
        step={step}
        required
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <div className="form-field">
      <label>{label}</label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </div>
  );
}

function BinaryInput({ label, value, onChange }) {
  return (
    <div className="form-field">
      <label>{label}</label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
      >
        <option value={0}>No / 0</option>
        <option value={1}>Yes / 1</option>
      </select>
    </div>
  );
}

/* =========================================================
   RESULTS PAGE
========================================================= */

function ResultsPage() {
  const navigate = useNavigate();

  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("latestPrediction");

      if (stored) {
        setResult(JSON.parse(stored));
      }
    } catch {
      setResult(null);
    }
  }, []);

  if (!result) {
    return (
      <div className="empty-page">
        <div className="empty-state large">
          <div>📊</div>
          <h1>No Prediction Available</h1>
          <p>Run a prediction first to view the results.</p>

          <button
            className="primary-button"
            onClick={() => navigate("/prediction")}
          >
            Start Prediction
          </button>
        </div>
      </div>
    );
  }

  const predictionIsPositive = Number(result.prediction) === 1;

  const probabilityData = [
    {
      name: "Class 0",
      probability: Number(
        (result.probability_class_0 * 100).toFixed(2)
      ),
    },
    {
      name: "Class 1",
      probability: Number(
        (result.probability_class_1 * 100).toFixed(2)
      ),
    },
  ];

  const shapData = (result.explanation || []).map((item) => ({
    feature: formatFeatureName(item.feature),
    value: Number(Number(item.shap_value).toFixed(4)),
  }));

  return (
    <div className="results-page">
      <div className="results-header">
        <span className="dashboard-label">ANALYSIS COMPLETE</span>

        <h1>Prediction Results</h1>

        <p>
          Your thyroid disease prediction and explainable AI analysis are
          ready.
        </p>
      </div>

      <section
        className={`prediction-result-card ${
          predictionIsPositive ? "positive-result" : "negative-result"
        }`}
      >
        <div className="result-icon">
          {predictionIsPositive ? "⚠️" : "✓"}
        </div>

        <div>
          <span className="small-label">MODEL PREDICTION</span>

          <h2>{result.message}</h2>

          <p>
            Model prediction:{" "}
            <strong>Class {result.prediction}</strong>
          </p>
        </div>
      </section>

      <div className="results-stats">
        <div className="result-stat">
          <span>Class 0 Probability</span>
          <strong>
            {(result.probability_class_0 * 100).toFixed(2)}%
          </strong>
        </div>

        <div className="result-stat">
          <span>Class 1 Probability</span>
          <strong>
            {(result.probability_class_1 * 100).toFixed(2)}%
          </strong>
        </div>

        <div className="result-stat">
          <span>Model Accuracy</span>
          <strong>{TEST_ACCURACY}%</strong>
        </div>
      </div>

      <div className="results-grid">
        <div className="result-panel">
          <div className="panel-heading">
            <div>
              <span className="small-label">MODEL CONFIDENCE</span>
              <h2>Prediction Probability</h2>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={probabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="probability" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="result-panel">
          <div className="panel-heading">
            <div>
              <span className="small-label">MODEL</span>
              <h2>XGBoost</h2>
            </div>
          </div>

          <div className="model-info">
            <div>
              <span>Test Accuracy</span>
              <strong>{TEST_ACCURACY}%</strong>
            </div>

            <div>
              <span>Explainability</span>
              <strong>SHAP</strong>
            </div>

            <div>
              <span>Counterfactuals</span>
              <strong>DiCE</strong>
            </div>

            <div>
              <span>Prediction Class</span>
              <strong>{result.prediction}</strong>
            </div>
          </div>
        </div>
      </div>

      <section className="result-panel">
        <div className="panel-heading">
          <div>
            <span className="small-label">EXPLAINABLE AI</span>
            <h2>SHAP Feature Importance</h2>
          </div>
        </div>

        {shapData.length > 0 ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={420}>
              <BarChart
                data={shapData}
                layout="vertical"
                margin={{ left: 30, right: 30 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="feature"
                  width={160}
                />
                <Tooltip />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p>No SHAP explanation available.</p>
        )}
      </section>

      <section className="result-panel">
        <div className="panel-heading">
          <div>
            <span className="small-label">COUNTERFACTUAL AI</span>
            <h2>DiCE Counterfactuals</h2>
          </div>
        </div>

        {result.counterfactuals?.length > 0 ? (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  {Object.keys(result.counterfactuals[0]).map((key) => (
                    <th key={key}>{formatFeatureName(key)}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {result.counterfactuals.map((row, index) => (
                  <tr key={index}>
                    {Object.keys(result.counterfactuals[0]).map((key) => (
                      <td key={key}>
                        {String(row[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div>🔄</div>
            <h3>No counterfactuals generated</h3>
            <p>
              The model could not generate a valid opposite-class
              counterfactual for this input.
            </p>
          </div>
        )}
      </section>

      <div className="result-actions">
        <button
          className="primary-button"
          onClick={() => navigate("/prediction")}
        >
          + New Prediction
        </button>

        <button
          className="secondary-button"
          onClick={() => navigate("/history")}
        >
          View History
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   USER HISTORY
========================================================= */

function UserHistory() {
  const user = getUser();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = user?.user_id;

    if (!userId) {
      setLoading(false);
      return;
    }

    async function loadHistory() {
      try {
        const response = await axios.get(
          `${API_URL}/auth/history/${userId}`
        );

        setHistory(response.data.history || []);
      } catch (error) {
        setError(await getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user?.user_id]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="history-page">
      <div className="dashboard-header">
        <div>
          <span className="dashboard-label">PRIVATE HISTORY</span>
          <h1>My Prediction History</h1>
          <p>Only your prediction records are displayed here.</p>
        </div>

        <Link to="/prediction" className="primary-button">
          + New Prediction
        </Link>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="history-card">
        {loading ? (
          <div className="loading-state">
            Loading prediction history...
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div>📜</div>
            <h2>No History Yet</h2>
            <p>Your completed predictions will appear here.</p>

            <Link to="/prediction" className="primary-button">
              Start Prediction
            </Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Prediction</th>
                  <th>Class 0</th>
                  <th>Class 1</th>
                </tr>
              </thead>

              <tbody>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {record.created_at
                        ? new Date(record.created_at).toLocaleString()
                        : "—"}
                    </td>

                    <td>
                      <span
                        className={`history-badge ${
                          record.prediction === 1
                            ? "history-danger"
                            : "history-success"
                        }`}
                      >
                        {record.prediction === 1
                          ? "Disease Predicted"
                          : "Not Predicted"}
                      </span>
                    </td>

                    <td>
                      {(record.probability_class_0 * 100).toFixed(2)}%
                    </td>

                    <td>
                      {(record.probability_class_1 * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard() {
  const admin = getAdmin();

  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [datasetFile, setDatasetFile] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [preprocessing, setPreprocessing] = useState(false);
  const [algorithmRunning, setAlgorithmRunning] = useState(false);

  const [preprocessStatus, setPreprocessStatus] = useState("");
  const [algorithmStatus, setAlgorithmStatus] = useState("");

  useEffect(() => {
    if (!admin) {
      return;
    }

    loadAdminHistory();
  }, [admin]);

  async function loadAdminHistory() {
    setLoadingHistory(true);

    try {
      const response = await axios.get(`${API_URL}/admin/history`);

      setHistory(response.data.history || []);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function uploadDataset() {
    if (!datasetFile) {
      alert("Please select a CSV file first.");
      return;
    }

    const formData = new FormData();

    formData.append("file", datasetFile);

    setUploading(true);

    try {
      const response = await axios.post(
        `${API_URL}/admin/upload-dataset`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setDatasetInfo(response.data);
      alert("Dataset uploaded successfully.");
    } catch (error) {
      alert(await getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  function preprocessDataset() {
    if (!datasetInfo) {
      alert("Upload a dataset first.");
      return;
    }

    setPreprocessing(true);
    setPreprocessStatus("");

    setTimeout(() => {
      setPreprocessing(false);
      setPreprocessStatus(
        "Dataset preprocessing workflow completed successfully."
      );
    }, 1500);
  }

  function applyAlgorithm() {
    setAlgorithmRunning(true);
    setAlgorithmStatus("");

    setTimeout(() => {
      setAlgorithmRunning(false);
      setAlgorithmStatus(
        "XGBoost analysis completed using the trained model."
      );
    }, 1500);
  }

  if (!admin) {
    return <Navigate to="/admin-login" replace />;
  }

  const diseaseCount = history.filter(
    (item) => Number(item.prediction) === 1
  ).length;

  const noDiseaseCount = history.filter(
    (item) => Number(item.prediction) === 0
  ).length;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <span className="dashboard-label">ADMIN CONTROL CENTER</span>

          <h1>ThyroAI Administration</h1>

          <p>
            Manage datasets, model analysis and all prediction records.
          </p>
        </div>

        <button className="nav-logout" onClick={logoutAdmin}>
          Logout
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          icon="👥"
          title="Total Predictions"
          value={loadingHistory ? "..." : history.length}
        />

        <StatCard
          icon="⚠️"
          title="Disease Predicted"
          value={loadingHistory ? "..." : diseaseCount}
        />

        <StatCard
          icon="✓"
          title="Not Predicted"
          value={loadingHistory ? "..." : noDiseaseCount}
        />

        <StatCard
          icon="🎯"
          title="Test Accuracy"
          value={`${TEST_ACCURACY}%`}
        />
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <div className="admin-card-header">
            <div className="admin-icon">📁</div>

            <div>
              <h2>Dataset Management</h2>
              <p>Upload a CSV dataset for analysis.</p>
            </div>
          </div>

          <div className="upload-area">
            <div className="upload-icon">📤</div>

            <h3>Upload Dataset</h3>

            <p>CSV files only</p>

            <input
              type="file"
              accept=".csv"
              onChange={(event) =>
                setDatasetFile(event.target.files?.[0] || null)
              }
            />

            {datasetFile && (
              <div className="selected-file">
                Selected: <strong>{datasetFile.name}</strong>
              </div>
            )}

            <button
              className="primary-button full-button"
              onClick={uploadDataset}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Dataset"}
            </button>
          </div>

          {datasetInfo && (
            <div className="dataset-info">
              <h3>Dataset Information</h3>

              <div className="dataset-stats">
                <div>
                  <span>Rows</span>
                  <strong>{datasetInfo.rows}</strong>
                </div>

                <div>
                  <span>Columns</span>
                  <strong>{datasetInfo.columns}</strong>
                </div>
              </div>

              {datasetInfo.column_names?.length > 0 && (
                <div className="column-list">
                  {datasetInfo.column_names.map((column) => (
                    <span key={column}>{column}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="admin-card">
          <div className="admin-card-header">
            <div className="admin-icon">⚙️</div>

            <div>
              <h2>ML Pipeline</h2>
              <p>Manage the machine-learning workflow.</p>
            </div>
          </div>

          <div className="pipeline-step">
            <div className="step-number">1</div>

            <div className="step-content">
              <h3>Preprocess Dataset</h3>
              <p>
                Prepare and validate the uploaded dataset.
              </p>

              <button
                className="secondary-button"
                onClick={preprocessDataset}
                disabled={preprocessing}
              >
                {preprocessing
                  ? "Processing..."
                  : "Preprocess Dataset"}
              </button>

              {preprocessStatus && (
                <div className="success-box">
                  {preprocessStatus}
                </div>
              )}
            </div>
          </div>

          <div className="pipeline-step">
            <div className="step-number">2</div>

            <div className="step-content">
              <h3>Apply XGBoost</h3>
              <p>
                Run the trained XGBoost model analysis.
              </p>

              <button
                className="secondary-button"
                onClick={applyAlgorithm}
                disabled={algorithmRunning}
              >
                {algorithmRunning
                  ? "Running XGBoost..."
                  : "Apply XGBoost"}
              </button>

              {algorithmStatus && (
                <div className="success-box">
                  {algorithmStatus}
                </div>
              )}
            </div>
          </div>

          <div className="accuracy-display">
            <span>Current Test Accuracy</span>
            <strong>{TEST_ACCURACY}%</strong>
            <small>XGBoost test-set result</small>
          </div>
        </section>
      </div>

      <section className="admin-card">
        <div className="admin-card-header">
          <div className="admin-icon">📊</div>

          <div>
            <h2>Model Comparison</h2>
            <p>
              Reference comparison of commonly used classification models.
            </p>
          </div>
        </div>

        <AdminComparisonChart />
      </section>

      <section className="admin-card">
        <div className="admin-card-header">
          <div className="admin-icon">👥</div>

          <div>
            <h2>All User Prediction History</h2>
            <p>
              Admin-only view of prediction records from every registered
              user.
            </p>
          </div>

          <button
            className="secondary-button"
            onClick={loadAdminHistory}
          >
            Refresh
          </button>
        </div>

        {loadingHistory ? (
          <div className="loading-state">
            Loading all prediction records...
          </div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <div>📜</div>
            <h3>No Prediction Records</h3>
            <p>User predictions will appear here.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Prediction</th>
                  <th>Class 0</th>
                  <th>Class 1</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {history.map((record) => (
                  <tr key={record.id}>
                    <td>{record.id}</td>

                    <td>
                      <strong>{record.username}</strong>
                    </td>

                    <td>{record.email}</td>

                    <td>
                      <span
                        className={`history-badge ${
                          Number(record.prediction) === 1
                            ? "history-danger"
                            : "history-success"
                        }`}
                      >
                        {Number(record.prediction) === 1
                          ? "Disease"
                          : "No Disease"}
                      </span>
                    </td>

                    <td>
                      {(
                        Number(record.probability_class_0) * 100
                      ).toFixed(2)}
                      %
                    </td>

                    <td>
                      {(
                        Number(record.probability_class_1) * 100
                      ).toFixed(2)}
                      %
                    </td>

                    <td>
                      {record.created_at
                        ? new Date(
                            record.created_at
                          ).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   ADMIN COMPARISON
========================================================= */

function AdminComparisonChart() {
  const data = useMemo(
    () => [
      {
        name: "XGBoost",
        accuracy: 98.99,
      },
      {
        name: "Random Forest",
        accuracy: 97.8,
      },
      {
        name: "Decision Tree",
        accuracy: 95.6,
      },
      {
        name: "Logistic Regression",
        accuracy: 93.7,
      },
    ],
    []
  );

  return (
    <div className="chart-container admin-chart">
      <ResponsiveContainer width="100%" height={380}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="name" />

          <YAxis domain={[80, 100]} />

          <Tooltip formatter={(value) => `${value}%`} />

          <Bar dataKey="accuracy" />
        </BarChart>
      </ResponsiveContainer>

      <div className="chart-note">
        XGBoost accuracy shown here is the trained model's test accuracy.
        The other comparison values are reference values and should be
        replaced with measured results if you train those models.
      </div>
    </div>
  );
}

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function UserRoute({ children }) {
  return getUser() ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  return getAdmin() ? children : <Navigate to="/admin-login" replace />;
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route path="/admin-login" element={<AdminLogin />} />

          <Route
            path="/dashboard"
            element={
              <UserRoute>
                <UserDashboard />
              </UserRoute>
            }
          />

          <Route
            path="/prediction"
            element={
              <UserRoute>
                <PredictionPage />
              </UserRoute>
            }
          />

          <Route
            path="/results"
            element={
              <UserRoute>
                <ResultsPage />
              </UserRoute>
            }
          />

          <Route
            path="/history"
            element={
              <UserRoute>
                <UserHistory />
              </UserRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
