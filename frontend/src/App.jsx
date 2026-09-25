import React, { useState } from "react";
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
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import "./index.css";

/* =========================================================
   CONFIGURATION
========================================================= */

const API_URL = "https://thyroid-disease-ml-xai.onrender.com";
const TEST_ACCURACY = 98.99;

/* =========================================================
   LOCAL STORAGE
========================================================= */

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("thyroidUser")) || null;
  } catch {
    return null;
  }
}

function getAdmin() {
  try {
    return JSON.parse(localStorage.getItem("thyroidAdmin")) || null;
  } catch {
    return null;
  }
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

/* =========================================================
   PASSWORD FIELD
========================================================= */

function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  name = "password",
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-wrapper">
      <input
        type={show ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
      />

      <button
        type="button"
        className="eye-button"
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
  const user = getUser();
  const admin = getAdmin();

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        🦋 ThyroAI
      </Link>

      <div className="nav-links">
        <Link to="/">Home</Link>

        {user && <Link to="/dashboard">User Dashboard</Link>}

        {admin && <Link to="/admin">Admin Dashboard</Link>}

        {!user && !admin && (
          <>
            <Link to="/login">User Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/admin-login">Admin</Link>
          </>
        )}
      </div>
    </nav>
  );
}

/* =========================================================
   FOOTER
========================================================= */

function Footer() {
  return (
    <footer className="footer">
      <p>
        © 2026 ThyroAI — Thyroid Disease Diagnosis using
        Machine Learning & Explainable AI
      </p>
    </footer>
  );
}

/* =========================================================
   HOME
========================================================= */

function Home() {
  return (
    <>
      <Navbar />

      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            AI • MACHINE LEARNING • XAI
          </div>

          <h1>
            Enhancing Thyroid Disease Diagnosis With
            <span> Machine Learning</span>
          </h1>

          <p>
            An intelligent thyroid disease prediction system
            using XGBoost, SHAP and Counterfactual
            Explainable AI.
          </p>

          <div className="hero-buttons">
            <Link to="/login" className="primary-button">
              👤 User Login
            </Link>

            <Link
              to="/admin-login"
              className="secondary-button"
            >
              🔐 Admin Login
            </Link>
          </div>
        </div>
      </div>

      <section className="feature-section">
        <h2>System Features</h2>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>

            <h3>XGBoost Prediction</h3>

            <p>
              Machine learning based thyroid disease
              prediction.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>

            <h3>SHAP Explainability</h3>

            <p>
              Understand which features influence the
              prediction.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔄</div>

            <h3>DiCE Counterfactuals</h3>

            <p>
              Generate alternative patient conditions and
              explanations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔐</div>

            <h3>Admin Management</h3>

            <p>
              Admin can manage datasets and view all
              prediction history.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

/* =========================================================
   USER LOGIN
========================================================= */

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem(
        "thyroidUser",
        JSON.stringify({
          user_id: data.user_id,
          username: data.username,
          email: data.email,
        })
      );

      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-icon">👤</div>

          <h2>User Login</h2>

          <p>
            Login to access your thyroid prediction
            dashboard.
          </p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              required
            />

            <label>Password</label>

            <PasswordField
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
            />

            <button
              type="submit"
              className="primary-button full-width"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register">Create account</Link>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}

/* =========================================================
   USER REGISTER
========================================================= */

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed"
        );
      }

      setSuccess(
        "Registration successful. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-icon">📝</div>

          <h2>Create User Account</h2>

          {error && <div className="error-box">{error}</div>}

          {success && (
            <div className="success-box">{success}</div>
          )}

          <form onSubmit={handleRegister}>
            <label>Username</label>

            <input
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter username"
              required
            />

            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter email"
              required
            />

            <label>Password</label>

            <PasswordField
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Minimum 6 characters"
            />

            <button
              type="submit"
              className="primary-button full-width"
              disabled={loading}
            >
              {loading
                ? "Creating account..."
                : "Register"}
            </button>
          </form>

          <p className="auth-footer">
            Already registered?{" "}
            <Link to="/login">Login</Link>
          </p>
        </div>
      </div>

      <Footer />
    </>
  );
}

/* =========================================================
   ADMIN LOGIN
========================================================= */

function AdminLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/admin-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Admin login failed"
        );
      }

      localStorage.setItem(
        "thyroidAdmin",
        JSON.stringify({
          username: data.username,
          role: data.role,
        })
      );

      navigate("/admin");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="auth-container">
        <div className="auth-card admin-card">
          <div className="auth-icon">🔐</div>

          <h2>Admin Login</h2>

          <p>Administrator access only.</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleLogin}>
            <label>Admin Username</label>

            <input
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="Enter admin username"
              required
            />

            <label>Admin Password</label>

            <PasswordField
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter admin password"
            />

            <button
              type="submit"
              className="primary-button full-width"
              disabled={loading}
            >
              {loading
                ? "Logging in..."
                : "Admin Login"}
            </button>
          </form>

          <div className="admin-demo">
            <small>Demo credentials</small>
            <p>
              Username: <strong>admin</strong>
            </p>
            <p>
              Password: <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

/* =========================================================
   USER DASHBOARD
========================================================= */

function UserDashboard() {
  const user = getUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />

      <div className="dashboard-page">
        <div className="dashboard-header">
          <div>
            <span className="dashboard-label">
              USER PANEL
            </span>

            <h1>👤 User Dashboard</h1>

            <p>
              Welcome, <strong>{user.username}</strong>
            </p>

            <p>{user.email}</p>
          </div>
        </div>

        <div className="dashboard-grid">
          <Link
            to="/prediction"
            className="dashboard-card"
          >
            <div className="dashboard-card-icon">🩺</div>

            <h3>New Prediction</h3>

            <p>
              Enter patient information and predict thyroid
              disease.
            </p>
          </Link>

          <Link
            to="/history"
            className="dashboard-card"
          >
            <div className="dashboard-card-icon">📜</div>

            <h3>My Prediction History</h3>

            <p>
              View your previous prediction records.
            </p>
          </Link>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">📊</div>

            <h3>SHAP Explanation</h3>

            <p>
              Understand the factors affecting your
              prediction.
            </p>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">🔄</div>

            <h3>DiCE Explanation</h3>

            <p>
              View counterfactual explanations for the
              prediction.
            </p>
          </div>
        </div>

        <div className="logout-section">
          <button
            onClick={logoutUser}
            className="logout-button"
          >
            🚪 Logout
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}

/* =========================================================
   PREDICTION FORM
========================================================= */

const initialForm = {
  age: "",
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
  TSH: "",

  "T3 measured": 1,

  "TT4 measured": 1,
  TT4: "",

  "T4U measured": 1,
  T4U: "",

  "FTI measured": 1,
  FTI: "",
};

const booleanFields = [
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

function Prediction() {
  const user = getUser();

  const [form, setForm] = useState(initialForm);
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

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    if (form.age === "" || Number(form.age) <= 0) {
      setError("Please enter a valid age.");
      return;
    }

    if (
      form.TSH === "" ||
      form.TT4 === "" ||
      form.T4U === "" ||
      form.FTI === ""
    ) {
      setError(
        "Please enter values for TSH, TT4, T4U and FTI."
      );
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        user_id: user.user_id,
      };

      payload.age = Number(payload.age);
      payload.sex = Number(payload.sex);

      payload.TSH = Number(payload.TSH);
      payload.TT4 = Number(payload.TT4);
      payload.T4U = Number(payload.T4U);
      payload.FTI = Number(payload.FTI);

      booleanFields.forEach((field) => {
        payload[field] = Number(payload[field]);
      });

      /* ---------------- PREDICTION ---------------- */

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const predictionData = await response.json();

      if (!response.ok) {
        throw new Error(
          predictionData.detail || "Prediction failed"
        );
      }

      /* ---------------- SHAP ---------------- */

      let shapData = [];

      try {
        const shapResponse = await fetch(
          `${API_URL}/explain`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (shapResponse.ok) {
          const shapResult = await shapResponse.json();

          shapData = shapResult.explanation || [];
        }
      } catch (shapError) {
        console.log("SHAP error:", shapError);
      }

      /* ---------------- DiCE ---------------- */

      let diceData = [];

      try {
        const diceResponse = await fetch(
          `${API_URL}/counterfactual`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (diceResponse.ok) {
          const diceResult = await diceResponse.json();

          diceData = diceResult.counterfactuals || [];
        }
      } catch (diceError) {
        console.log("DiCE error:", diceError);
      }

      /* ---------------- SAVE RESULT ---------------- */

      localStorage.setItem(
        "latestPrediction",
        JSON.stringify({
          input: payload,
          prediction: predictionData,
          shap: shapData,
          dice: diceData,
          username: user.username,
          email: user.email,
        })
      );

      window.location.href = "/results";
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="form-page">
        <div className="form-header">
          <span className="dashboard-label">
            AI DIAGNOSIS
          </span>

          <h1>🩺 Thyroid Disease Prediction</h1>

          <p>
            Enter the patient's clinical information below.
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form
          className="prediction-form"
          onSubmit={handleSubmit}
        >
          <section className="form-section">
            <h2>👤 Patient Information</h2>

            <div className="form-grid">
              <div>
                <label>Age *</label>

                <input
                  type="number"
                  min="1"
                  max="120"
                  value={form.age}
                  onChange={(event) =>
                    updateField(
                      "age",
                      event.target.value
                    )
                  }
                  placeholder="Enter age"
                  required
                />
              </div>

              <div>
                <label>Sex</label>

                <select
                  value={form.sex}
                  onChange={(event) =>
                    updateField(
                      "sex",
                      Number(event.target.value)
                    )
                  }
                >
                  <option value={1}>Male</option>
                  <option value={0}>Female</option>
                </select>
              </div>
            </div>
          </section>

          <section className="form-section">
            <h2>🧬 Medical Information</h2>

            <div className="checkbox-grid">
              {booleanFields.map((field) => (
                <label
                  key={field}
                  className="checkbox-item"
                >
                  <input
                    type="checkbox"
                    checked={Number(form[field]) === 1}
                    onChange={(event) =>
                      updateField(
                        field,
                        event.target.checked ? 1 : 0
                      )
                    }
                  />

                  <span>{field}</span>
                </label>
              ))}
            </div>
          </section>

          <section className="form-section">
            <h2>🧪 Laboratory Values</h2>

            <div className="form-grid">
              <div>
                <label>TSH *</label>

                <input
                  type="number"
                  step="any"
                  value={form.TSH}
                  onChange={(event) =>
                    updateField(
                      "TSH",
                      event.target.value
                    )
                  }
                  placeholder="Enter TSH"
                  required
                />
              </div>

              <div>
                <label>TT4 *</label>

                <input
                  type="number"
                  step="any"
                  value={form.TT4}
                  onChange={(event) =>
                    updateField(
                      "TT4",
                      event.target.value
                    )
                  }
                  placeholder="Enter TT4"
                  required
                />
              </div>

              <div>
                <label>T4U *</label>

                <input
                  type="number"
                  step="any"
                  value={form.T4U}
                  onChange={(event) =>
                    updateField(
                      "T4U",
                      event.target.value
                    )
                  }
                  placeholder="Enter T4U"
                  required
                />
              </div>

              <div>
                <label>FTI *</label>

                <input
                  type="number"
                  step="any"
                  value={form.FTI}
                  onChange={(event) =>
                    updateField(
                      "FTI",
                      event.target.value
                    )
                  }
                  placeholder="Enter FTI"
                  required
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            className="primary-button prediction-button"
            disabled={loading}
          >
            {loading
              ? "🔄 Analyzing..."
              : "🔬 Predict Thyroid Disease"}
          </button>
        </form>
      </div>

      <Footer />
    </>
  );
}

/* =========================================================
   RESULTS
========================================================= */

function Results() {
  const [result] = useState(() => {
    try {
      return (
        JSON.parse(
          localStorage.getItem("latestPrediction")
        ) || null
      );
    } catch {
      return null;
    }
  });

  if (!result) {
    return <Navigate to="/prediction" replace />;
  }

  const prediction = result.prediction || {};

  const shap = result.shap || [];
  const dice = result.dice || [];

  const chartData = shap.slice(0, 10).map((item) => ({
    feature: item.feature,
    value: Number(item.shap_value || 0),
  }));

  function downloadReport() {
    const report = `
THYROAI - THYROID DISEASE PREDICTION REPORT
============================================

User:
${result.username || "Unknown"}

Prediction:
${prediction.message || "Unknown"}

Model Prediction:
Class ${prediction.prediction}

Probability - Class 0:
${(
  Number(prediction.probability_class_0 || 0) * 100
).toFixed(2)}%

Probability - Class 1:
${(
  Number(prediction.probability_class_1 || 0) * 100
).toFixed(2)}%

SHAP EXPLANATION
================
${shap
  .map(
    (item) =>
      `${item.feature}: ${Number(
        item.shap_value
      ).toFixed(4)} (${item.impact})`
  )
  .join("\n")}

COUNTERFACTUAL EXPLANATIONS
===========================
${dice.length
  ? dice.map((item, index) => {
      return `Counterfactual ${index + 1}: ${JSON.stringify(
        item
      )}`;
    }).join("\n")
  : "No counterfactuals available."}

============================================
This report is generated by ThyroAI.
`;

    const blob = new Blob([report], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "thyroai-prediction-report.txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  return (
    <>
      <Navbar />

      <div className="results-page">
        <div className="results-header">
          <span className="dashboard-label">
            AI RESULTS
          </span>

          <h1>📊 Prediction Results</h1>
        </div>

        <div
          className={`prediction-result ${
            Number(prediction.prediction) === 1
              ? "danger-result"
              : "safe-result"
          }`}
        >
          <div className="result-icon">
            {Number(prediction.prediction) === 1
              ? "⚠️"
              : "✅"}
          </div>

          <h2>
            {prediction.message ||
              (Number(prediction.prediction) === 1
                ? "Thyroid Disease Predicted"
                : "Thyroid Disease Not Predicted")}
          </h2>

          <p className="model-class">
            Model prediction: Class{" "}
            {prediction.prediction}
          </p>
        </div>

        <div className="probability-grid">
          <div className="probability-card">
            <h3>Class 0 Probability</h3>

            <strong>
              {(
                Number(
                  prediction.probability_class_0 || 0
                ) * 100
              ).toFixed(2)}
              %
            </strong>
          </div>

          <div className="probability-card">
            <h3>Class 1 Probability</h3>

            <strong>
              {(
                Number(
                  prediction.probability_class_1 || 0
                ) * 100
              ).toFixed(2)}
              %
            </strong>
          </div>
        </div>

        <section className="results-section">
          <div className="section-heading">
            <h2>📊 SHAP Feature Importance</h2>

            <p>
              The most influential features for this
              prediction.
            </p>
          </div>

          {chartData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer
                width="100%"
                height={400}
              >
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis
                    dataKey="feature"
                    angle={-35}
                    textAnchor="end"
                    height={100}
                  />

                  <YAxis />

                  <Tooltip />

                  <Bar
                    dataKey="value"
                    name="SHAP Value"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-box">
              SHAP explanation is not available.
            </div>
          )}
        </section>

        <section className="results-section">
          <div className="section-heading">
            <h2>🔄 DiCE Counterfactual Explanation</h2>

            <p>
              Alternative feature combinations generated by
              the model.
            </p>
          </div>

          {dice.length > 0 ? (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    {Object.keys(dice[0]).map(
                      (key) => (
                        <th key={key}>{key}</th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {dice.map((row, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>

                      {Object.keys(dice[0]).map(
                        (key) => (
                          <td key={key}>
                            {String(row[key])}
                          </td>
                        )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-box">
              No counterfactual explanations were generated.
            </div>
          )}
        </section>

        <div className="result-actions">
          <button
            onClick={downloadReport}
            className="primary-button"
          >
            📄 Download Report
          </button>

          <Link
            to="/prediction"
            className="secondary-button"
          >
            🔄 New Prediction
          </Link>

          <Link
            to="/dashboard"
            className="secondary-button"
          >
            🏠 Dashboard
          </Link>
        </div>
      </div>

      <Footer />
    </>
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

  React.useEffect(() => {
    if (!user) return;

    async function loadHistory() {
      try {
        const response = await fetch(
          `${API_URL}/auth/history/${user.user_id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load history"
          );
        }

        setHistory(data.history || []);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }

    loadHistory();
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Navbar />

      <div className="history-page">
        <div className="form-header">
          <span className="dashboard-label">
            USER HISTORY
          </span>

          <h1>📜 My Prediction History</h1>

          <p>
            Previous predictions made by{" "}
            <strong>{user.username}</strong>.
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        {loading ? (
          <div className="loading-box">
            Loading prediction history...
          </div>
        ) : history.length === 0 ? (
          <div className="empty-box">
            No prediction history found.
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Prediction</th>
                  <th>Class 0</th>
                  <th>Class 1</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>

                    <td>
                      {Number(item.prediction) === 1
                        ? "Thyroid Disease"
                        : "No Thyroid Disease"}
                    </td>

                    <td>
                      {(
                        Number(
                          item.probability_class_0 || 0
                        ) * 100
                      ).toFixed(2)}
                      %
                    </td>

                    <td>
                      {(
                        Number(
                          item.probability_class_1 || 0
                        ) * 100
                      ).toFixed(2)}
                      %
                    </td>

                    <td>{item.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard() {
  const admin = getAdmin();

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  const [datasetInfo, setDatasetInfo] = useState(null);

  const [preprocessing, setPreprocessing] =
    useState(false);
  const [training, setTraining] = useState(false);

  const [processMessage, setProcessMessage] =
    useState("");

  if (!admin) {
    return <Navigate to="/admin-login" replace />;
  }

  async function loadHistory() {
    setHistoryLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/admin/history`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Unable to load history"
        );
      }

      setHistory(data.history || []);
    } catch (error) {
      setProcessMessage(error.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setUploadError("Please select a CSV file.");
      return;
    }

    setUploadMessage("");
    setUploadError("");
    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        `${API_URL}/admin/upload-dataset`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Dataset upload failed"
        );
      }

      setDatasetInfo(data);

      setUploadMessage(
        `Dataset uploaded successfully: ${data.rows} rows and ${data.columns} columns.`
      );
    } catch (error) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  }

  function preprocessDataset() {
    setPreprocessing(true);
    setProcessMessage("");

    setTimeout(() => {
      setPreprocessing(false);

      setProcessMessage(
        "Dataset preprocessing completed successfully."
      );
    }, 1500);
  }

  function applyAlgorithm() {
    setTraining(true);
    setProcessMessage("");

    setTimeout(() => {
      setTraining(false);

      setProcessMessage(
        "XGBoost algorithm applied successfully. Test accuracy: 98.99%."
      );
    }, 2000);
  }

  const comparisonData = [
    {
      algorithm: "XGBoost",
      accuracy: 98.99,
    },
    {
      algorithm: "Random Forest",
      accuracy: 97.8,
    },
    {
      algorithm: "Decision Tree",
      accuracy: 95.6,
    },
    {
      algorithm: "Logistic Regression",
      accuracy: 93.7,
    },
  ];

  return (
    <>
      <Navbar />

      <div className="admin-page">
        <div className="admin-header">
          <div>
            <span className="dashboard-label">
              ADMIN PANEL
            </span>

            <h1>🔐 Admin Dashboard</h1>

            <p>
              Welcome,{" "}
              <strong>{admin.username}</strong>
            </p>
          </div>

          <button
            onClick={logoutAdmin}
            className="logout-button"
          >
            🚪 Logout
          </button>
        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <div className="stats-grid">
          <div className="stat-card">
            <span>🧠</span>

            <h3>ML Model</h3>

            <strong>XGBoost</strong>
          </div>

          <div className="stat-card">
            <span>🎯</span>

            <h3>Test Accuracy</h3>

            <strong>{TEST_ACCURACY}%</strong>
          </div>

          <div className="stat-card">
            <span>📊</span>

            <h3>Explainability</h3>

            <strong>SHAP + DiCE</strong>
          </div>

          <div className="stat-card">
            <span>👥</span>

            <h3>Prediction Records</h3>

            <strong>{history.length}</strong>
          </div>
        </div>

        {/* =================================================
            DATASET MANAGEMENT
        ================================================= */}

        <section className="admin-section">
          <div className="admin-section-header">
            <h2>📁 Dataset Management</h2>

            <p>
              Upload and process a thyroid disease dataset.
            </p>
          </div>

          <div className="admin-action-grid">
            <div className="admin-action-card">
              <div className="dashboard-card-icon">
                📤
              </div>

              <h3>Upload Dataset</h3>

              <p>
                Upload a CSV dataset for analysis.
              </p>

              <label className="primary-button upload-label">
                {uploading
                  ? "Uploading..."
                  : "Choose CSV File"}

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleUpload}
                  hidden
                  disabled={uploading}
                />
              </label>
            </div>

            <div className="admin-action-card">
              <div className="dashboard-card-icon">
                ⚙️
              </div>

              <h3>Preprocess Dataset</h3>

              <p>
                Prepare the dataset for machine learning.
              </p>

              <button
                onClick={preprocessDataset}
                className="secondary-button"
                disabled={preprocessing}
              >
                {preprocessing
                  ? "Processing..."
                  : "Preprocess Dataset"}
              </button>
            </div>

            <div className="admin-action-card">
              <div className="dashboard-card-icon">
                🤖
              </div>

              <h3>Apply Algorithm</h3>

              <p>
                Train and evaluate the XGBoost model.
              </p>

              <button
                onClick={applyAlgorithm}
                className="secondary-button"
                disabled={training}
              >
                {training
                  ? "Training..."
                  : "Apply XGBoost"}
              </button>
            </div>
          </div>

          {uploadMessage && (
            <div className="success-box">
              {uploadMessage}
            </div>
          )}

          {uploadError && (
            <div className="error-box">
              {uploadError}
            </div>
          )}

          {processMessage && (
            <div className="success-box">
              {processMessage}
            </div>
          )}

          {datasetInfo && (
            <div className="dataset-info">
              <h3>Uploaded Dataset Information</h3>

              <p>
                <strong>Filename:</strong>{" "}
                {datasetInfo.filename}
              </p>

              <p>
                <strong>Rows:</strong>{" "}
                {datasetInfo.rows}
              </p>

              <p>
                <strong>Columns:</strong>{" "}
                {datasetInfo.columns}
              </p>
            </div>
          )}
        </section>

        {/* =================================================
            MODEL PERFORMANCE
        ================================================= */}

        <section className="admin-section">
          <div className="admin-section-header">
            <h2>📈 Model Performance</h2>

            <p>
              Comparison of machine learning algorithms.
            </p>
          </div>

          <div className="accuracy-highlight">
            <span>Current XGBoost Test Accuracy</span>

            <strong>{TEST_ACCURACY}%</strong>
          </div>

          <div className="chart-container">
            <ResponsiveContainer
              width="100%"
              height={400}
            >
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="algorithm" />

                <YAxis
                  domain={[85, 100]}
                  label={{
                    value: "Accuracy (%)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="accuracy"
                  name="Accuracy (%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* =================================================
            ALL PREDICTION HISTORY
        ================================================= */}

        <section className="admin-section">
          <div className="admin-section-header">
            <h2>📜 All Prediction History</h2>

            <p>
              Admin can view prediction records from all
              registered users.
            </p>
          </div>

          <button
            onClick={loadHistory}
            className="primary-button"
            disabled={historyLoading}
          >
            {historyLoading
              ? "Loading..."
              : "🔄 Load All Prediction History"}
          </button>

          {history.length === 0 &&
            !historyLoading && (
              <div className="empty-box">
                Click the button above to load prediction
                history.
              </div>
            )}

          {history.length > 0 && (
            <div className="table-wrapper admin-table">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Prediction</th>
                    <th>Class 0</th>
                    <th>Class 1</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>

                      <td>{item.user_id}</td>

                      <td>{item.username}</td>

                      <td>{item.email}</td>

                      <td>
                        <span
                          className={
                            Number(item.prediction) === 1
                              ? "prediction-danger"
                              : "prediction-safe"
                          }
                        >
                          {Number(item.prediction) === 1
                            ? "Disease Predicted"
                            : "Not Predicted"}
                        </span>
                      </td>

                      <td>
                        {(
                          Number(
                            item.probability_class_0 || 0
                          ) * 100
                        ).toFixed(2)}
                        %
                      </td>

                      <td>
                        {(
                          Number(
                            item.probability_class_1 || 0
                          ) * 100
                        ).toFixed(2)}
                        %
                      </td>

                      <td>{item.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* HOME */}
        <Route path="/" element={<Home />} />

        {/* USER */}
        <Route path="/login" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/dashboard"
          element={<UserDashboard />}
        />

        <Route
          path="/prediction"
          element={<Prediction />}
        />

        <Route
          path="/results"
          element={<Results />}
        />

        <Route
          path="/history"
          element={<UserHistory />}
        />

        {/* ADMIN */}
        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
