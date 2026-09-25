import React, { useEffect, useState } from "react";
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

const API_URL = "https://thyroid-disease-ml-xai.onrender.com";
const TEST_ACCURACY = 98.99;

/* =========================================================
   STORAGE HELPERS
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
  name,
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
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}

/* =========================================================
   COMMON NAVBAR
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
   HOME
========================================================= */

function Home() {
  return (
    <>
      <Navbar />

      <div className="hero">
        <div className="hero-content">
          <div className="hero-badge">AI • MACHINE LEARNING • XAI</div>

          <h1>
            Enhancing Thyroid Disease Diagnosis With
            <span> Machine Learning</span>
          </h1>

          <p>
            An intelligent thyroid disease prediction system using
            XGBoost, SHAP and Counterfactual Explainable AI.
          </p>

          <div className="hero-buttons">
            <Link to="/login" className="primary-button">
              👤 User Login
            </Link>

            <Link to="/admin-login" className="secondary-button">
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
              Machine learning based thyroid disease prediction.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>SHAP Explainability</h3>
            <p>
              Understand which features influence the prediction.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔄</div>
            <h3>DiCE Counterfactuals</h3>
            <p>
              Generate alternative patient conditions and explanations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Admin Management</h3>
            <p>
              Admin can manage datasets and view prediction history.
            </p>
          </div>
        </div>
      </section>
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

  async function handleLogin(e) {
    e.preventDefault();

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
          <p>Login to access your thyroid prediction dashboard.</p>

          {error && <div className="error-box">{error}</div>}

          <form onSubmit={handleLogin}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />

            <label>Password</label>

            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />

            <button className="primary-button full-width">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register">Create account</Link>
          </p>
        </div>
      </div>
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

  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed");
      }

      setSuccess("Registration successful. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      setError(error.message);
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
          {success && <div className="success-box">{success}</div>}

          <form onSubmit={handleRegister}>
            <label>Username</label>

            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />

            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              required
            />

            <label>Password</label>

            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />

            <button className="primary-button full-width">
              Register
            </button>
          </form>

          <p className="auth-footer">
            Already registered?{" "}
            <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
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

  async function handleLogin(e) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Admin login failed");
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
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
            />

            <label>Admin Password</label>

            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />

            <button className="primary-button full-width">
              {loading ? "Logging in..." : "Admin Login"}
            </button>
          </form>
        </div>
      </div>
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
            <span className="dashboard-label">USER PANEL</span>
            <h1>👤 User Dashboard</h1>
            <p>
              Welcome, <strong>{user.username}</strong>
            </p>
          </div>
        </div>

        <div className="dashboard-grid">
          <Link to="/prediction" className="dashboard-card">
            <div className="dashboard-card-icon">🩺</div>
            <h3>New Prediction</h3>
            <p>Enter patient information and predict thyroid disease.</p>
          </Link>

          <Link to="/history" className="dashboard-card">
            <div className="dashboard-card-icon">📜</div>
            <h3>My Prediction History</h3>
            <p>View your previous predictions.</p>
          </Link>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">📊</div>
            <h3>SHAP Explanation</h3>
            <p>Understand the factors affecting your prediction.</p>
          </div>

          <div className="dashboard-card">
            <div className="dashboard-card-icon">🔄</div>
            <h3>DiCE Explanation</h3>
            <p>View counterfactual explanations.</p>
          </div>
        </div>

        <div className="logout-section">
          <button onClick={logoutUser} className="logout-button">
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
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

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
      setError("Please enter values for TSH, TT4, T4U and FTI.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        user_id: user.user_id,
      };

      payload.age = Number(payload.age);
      payload.TSH = Number(payload.TSH);
      payload.TT4 = Number(payload.TT4);
      payload.T4U = Number(payload.T4U);
      payload.FTI = Number(payload.FTI);

      booleanFields.forEach((field) => {
        payload[field] = Number(payload[field]);
      });

      payload.sex = Number(payload.sex);

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

      let shapData = [];
      let diceData = [];

      try {
        const shapResponse = await fetch(`${API_URL}/explain`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (shapResponse.ok) {
          const shapResult = await shapResponse.json();
          shapData = shapResult.explanation || [];
        }
      } catch (error) {
        console.log("SHAP error:", error);
      }

      try {
        const diceResponse = await fetch(`${API_URL}/counterfactual`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (diceResponse.ok) {
          const diceResult = await diceResponse.json();
          diceData = diceResult.counterfactuals || [];
        }
      } catch (error) {
        console.log("DiCE error:", error);
      }

      localStorage.setItem(
        "latestPrediction",
        JSON.stringify({
          input: payload,
          prediction: predictionData,
          shap: shapData,
          dice: diceData,
          username: user.username,
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
          <span className="dashboard-label">AI DIAGNOSIS</span>
          <h1>🩺 Thyroid Disease Prediction</h1>
          <p>
            Enter the patient's clinical information below.
          </p>
        </div>

        {error && <div className="error-box">{error}</div>}

        <form className="prediction-form" onSubmit={handleSubmit}>
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
                  onChange={(e) =>
                    updateField("age", e.target.value)
                  }
                  placeholder="Enter age"
                  required
                />
              </div>

              <div>
                <label>Sex</label>

                <select
                  value={form.sex}
                  onChange={(e) =>
                    updateField("sex", Number(e.target.value))
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
              {booleanFields
                .filter(
                  (field) =>
                    !field.includes("measured")
                )
                .map((field) => (
                  <label className="checkbox-item" key={field}>
                    <input
                      type="checkbox"
                      checked={Boolean(form[field])}
                      onChange={(e) =>
                        updateField(
                          field,
                          e.target.checked ? 1 : 0
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
                <label>TSH</label>
                <input
                  type="number"
                  step="any"
                  value={form.TSH}
                  onChange={(e) =>
                    updateField("TSH", e.target.value)
                  }
                  placeholder="Enter TSH"
                  required
                />
              </div>

              <div>
                <label>TT4</label>
                <input
                  type="number"
                  step="any"
                  value={form.TT4}
                  onChange={(e) =>
                    updateField("TT4", e.target.value)
                  }
                  placeholder="Enter TT4"
                  required
                />
              </div>

              <div>
                <label>T4U</label>
                <input
                  type="number"
                  step="any"
                  value={form.T4U}
                  onChange={(e) =>
                    updateField("T4U", e.target.value)
                  }
                  placeholder="Enter T4U"
                  required
                />
              </div>

              <div>
                <label>FTI</label>
                <input
                  type="number"
                  step="any"
                  value={form.FTI}
                  onChange={(e) =>
                    updateField("FTI", e.target.value)
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
              ? "🔄 Processing..."
              : "🤖 Predict Thyroid Disease"}
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
  const user = getUser();

  const [result, setResult] = useState(null);

  useEffect(() => {
    try {
      const data =
        JSON.parse(localStorage.getItem("latestPrediction"));

      setResult(data);
    } catch {
      setResult(null);
    }
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!result) {
    return (
      <>
        <Navbar />

        <div className="empty-page">
          <h2>No prediction found</h2>
          <Link to="/prediction" className="primary-button">
            Make Prediction
          </Link>
        </div>
      </>
    );
  }

  const prediction = result.prediction;

  const chartData = (result.shap || []).map((item) => ({
    feature: item.feature,
    value: Number(item.shap_value),
  }));

  return (
    <>
      <Navbar />

      <div className="results-page">
        <div className="results-header">
          <span className="dashboard-label">
            PREDICTION RESULT
          </span>

          <h1>📊 Thyroid Analysis</h1>
        </div>

        <div
          className={`prediction-result ${
            prediction.prediction === 1
              ? "positive-result"
              : "negative-result"
          }`}
        >
          <div className="result-icon">
            {prediction.prediction === 1 ? "⚠️" : "✅"}
          </div>

          <div>
            <h2>{prediction.message}</h2>

            <p>
              Model prediction:{" "}
              <strong>
                Class {prediction.prediction}
              </strong>
            </p>
          </div>
        </div>

        <div className="probability-grid">
          <div className="probability-card">
            <h3>Class 0</h3>
            <strong>
              {(prediction.probability_class_0 * 100).toFixed(2)}%
            </strong>
          </div>

          <div className="probability-card">
            <h3>Class 1</h3>
            <strong>
              {(prediction.probability_class_1 * 100).toFixed(2)}%
            </strong>
          </div>
        </div>

        <section className="result-section">
          <h2>📊 SHAP Feature Importance</h2>

          {chartData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{
                    left: 30,
                    right: 30,
                  }}
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

        <section className="result-section">
          <h2>🔄 DiCE Counterfactual Explanations</h2>

          {result.dice && result.dice.length > 0 ? (
            <div className="counterfactual-container">
              {result.dice.map((cf, index) => (
                <div className="cf-card" key={index}>
                  <h3>Counterfactual {index + 1}</h3>

                  <div className="cf-grid">
                    {Object.entries(cf).map(
                      ([key, value]) => (
                        <div className="cf-item" key={key}>
                          <span>{key}</span>
                          <strong>{String(value)}</strong>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>
              Counterfactual explanations are not available
              for this prediction.
            </p>
          )}
        </section>

        <div className="result-actions">
          <button
            className="primary-button"
            onClick={downloadReport}
          >
            📄 Download Report
          </button>

          <Link
            to="/prediction"
            className="secondary-button"
          >
            🔄 New Prediction
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}

/* =========================================================
   REPORT
========================================================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadReport() {
  const result =
    JSON.parse(localStorage.getItem("latestPrediction"));

  if (!result) {
    alert("No prediction report available.");
    return;
  }

  const prediction = result.prediction;

  const shapRows = (result.shap || [])
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.feature)}</td>
          <td>${Number(item.shap_value).toFixed(6)}</td>
          <td>${escapeHtml(item.impact)}</td>
        </tr>
      `
    )
    .join("");

  const cfRows = (result.dice || [])
    .map(
      (cf, index) => `
        <h3>Counterfactual ${index + 1}</h3>
        <table>
          <tbody>
            ${Object.entries(cf)
              .map(
                ([key, value]) => `
                  <tr>
                    <td>${escapeHtml(key)}</td>
                    <td>${escapeHtml(value)}</td>
                  </tr>
                `
              )
              .join("")}
          </tbody>
        </table>
      `
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>ThyroAI Prediction Report</title>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 40px;
  color: #1f2937;
}

h1 {
  color: #2563eb;
}

h2 {
  margin-top: 30px;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  border: 1px solid #ddd;
  padding: 10px;
  text-align: left;
}

th {
  background: #f3f4f6;
}

.result {
  padding: 20px;
  border-radius: 10px;
  background: #f3f4f6;
  margin: 20px 0;
}

.footer {
  margin-top: 40px;
  color: #666;
}
</style>

</head>

<body>

<h1>🦋 ThyroAI Prediction Report</h1>

<p>
Generated by Thyroid Disease Prediction System
</p>

<div class="result">

<h2>Prediction Result</h2>

<p>
<strong>${escapeHtml(prediction.message)}</strong>
</p>

<p>
Model Prediction:
Class ${escapeHtml(prediction.prediction)}
</p>

<p>
Class 0 Probability:
${(prediction.probability_class_0 * 100).toFixed(2)}%
</p>

<p>
Class 1 Probability:
${(prediction.probability_class_1 * 100).toFixed(2)}%
</p>

</div>

<h2>SHAP Explanation</h2>

<table>

<thead>
<tr>
<th>Feature</th>
<th>SHAP Value</th>
<th>Impact</th>
</tr>
</thead>

<tbody>
${shapRows}

</tbody>

</table>

<h2>DiCE Counterfactuals</h2>

${cfRows || "<p>No counterfactuals available.</p>"}

<div class="footer">

<p>
ThyroAI — Machine Learning and Explainable AI
</p>

</div>

</body>
</html>
`;

  const blob = new Blob([html], {
    type: "text/html",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;
  link.download = "ThyroAI_Prediction_Report.html";

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/* =========================================================
   USER HISTORY
========================================================= */

function History() {
  const user = getUser();

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    fetch(`${API_URL}/auth/history/${user.user_id}`)
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Unable to load history"
          );
        }

        setHistory(data.history || []);
      })
      .catch((error) => {
        setError(error.message);
      })
      .finally(() => {
        setLoading(false);
      });
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
            Only your own prediction records are shown here.
          </p>
        </div>

        {loading && <p>Loading history...</p>}

        {error && <div className="error-box">{error}</div>}

        {!loading && !error && history.length === 0 && (
          <div className="empty-card">
            <h3>No predictions yet</h3>

            <p>
              Make your first thyroid prediction to see it here.
            </p>

            <Link
              to="/prediction"
              className="primary-button"
            >
              New Prediction
            </Link>
          </div>
        )}

        <div className="history-list">
          {history.map((item) => (
            <div className="history-card" key={item.id}>
              <div>
                <h3>
                  {item.prediction === 1
                    ? "⚠️ Thyroid Disease Predicted"
                    : "✅ Thyroid Disease Not Predicted"}
                </h3>

                <p>
                  Prediction Class:{" "}
                  <strong>{item.prediction}</strong>
                </p>

                <p>
                  Class 0:{" "}
                  {(item.probability_class_0 * 100).toFixed(
                    2
                  )}
                  %
                </p>

                <p>
                  Class 1:{" "}
                  {(item.probability_class_1 * 100).toFixed(
                    2
                  )}
                  %
                </p>
              </div>

              <div className="history-date">
                {item.created_at}
              </div>
            </div>
          ))}
        </div>
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

  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [adminHistory, setAdminHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [message, setMessage] = useState("");

  if (!admin) {
    return <Navigate to="/admin-login" replace />;
  }

  async function handleDatasetUpload(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setMessage("Please select a CSV file.");
      return;
    }

    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", file);

    try {
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

      setUploadResult(data);

      setMessage(
        `Dataset uploaded successfully: ${data.rows} rows, ${data.columns} columns.`
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  }

  async function loadAllHistory() {
    setHistoryLoading(true);
    setMessage("");

    try {
      /*
        Current backend only exposes user-specific history.
        This section is prepared for the admin-only endpoint.

        Once /admin/history is added to the backend,
        it will display all users' records here.
      */

      const response = await fetch(
        `${API_URL}/admin/history`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Admin history endpoint is not available yet."
        );
      }

      setAdminHistory(data.history || []);
    } catch (error) {
      setMessage(
        "Admin history backend endpoint is not connected yet."
      );
    } finally {
      setHistoryLoading(false);
    }
  }

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
              Welcome, <strong>{admin.username}</strong>
            </p>
          </div>

          <div className="admin-status">
            🟢 Administrator
          </div>
        </div>

        {/* ACCURACY */}

        <section className="admin-section">
          <h2>🎯 Model Performance</h2>

          <div className="accuracy-card">
            <div className="accuracy-icon">🎯</div>

            <div>
              <span>Test Accuracy</span>

              <strong>{TEST_ACCURACY}%</strong>

              <small>
                XGBoost test-set accuracy
              </small>
            </div>
          </div>
        </section>

        {/* ADMIN FEATURES */}

        <section className="admin-section">
          <h2>⚙️ Machine Learning Management</h2>

          <div className="admin-feature-grid">
            {/* UPLOAD */}

            <div className="admin-feature-card">
              <div className="admin-feature-icon">
                📁
              </div>

              <h3>Upload Dataset</h3>

              <p>
                Upload a CSV dataset for the ML pipeline.
              </p>

              <label className="primary-button upload-label">
                {uploading
                  ? "Uploading..."
                  : "Choose CSV Dataset"}

                <input
                  type="file"
                  accept=".csv"
                  onChange={handleDatasetUpload}
                  hidden
                />
              </label>

              {uploadResult && (
                <div className="upload-info">
                  <strong>
                    {uploadResult.filename}
                  </strong>

                  <p>
                    Rows: {uploadResult.rows}
                  </p>

                  <p>
                    Columns: {uploadResult.columns}
                  </p>
                </div>
              )}
            </div>

            {/* PREPROCESS */}

            <div className="admin-feature-card">
              <div className="admin-feature-icon">
                ⚙️
              </div>

              <h3>Dataset Preprocessing</h3>

              <p>
                Clean and prepare the dataset before model
                training.
              </p>

              <button
                className="secondary-button"
                onClick={() =>
                  setMessage(
                    "Dataset preprocessing module is ready to be connected to the backend."
                  )
                }
              >
                Start Preprocessing
              </button>
            </div>

            {/* TRAINING */}

            <div className="admin-feature-card">
              <div className="admin-feature-icon">
                🤖
              </div>

              <h3>Algorithm Training</h3>

              <p>
                Train the machine learning model using the
                prepared dataset.
              </p>

              <button
                className="secondary-button"
                onClick={() =>
                  setMessage(
                    "Algorithm training module is ready to be connected to the backend."
                  )
                }
              >
                Train Algorithm
              </button>
            </div>

            {/* COMPARISON */}

            <div className="admin-feature-card">
              <div className="admin-feature-icon">
                📊
              </div>

              <h3>Algorithm Comparison</h3>

              <p>
                Compare machine learning algorithms using
                performance metrics.
              </p>

              <button
                className="secondary-button"
                onClick={() =>
                  setMessage(
                    "Algorithm comparison module is ready to be connected to the backend."
                  )
                }
              >
                View Comparison
              </button>
            </div>
          </div>
        </section>

        {/* ALL USER HISTORY */}

        <section className="admin-section">
          <div className="admin-history-header">
            <div>
              <h2>📋 All Users' Prediction History</h2>

              <p>
                This section is visible only to the administrator.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={loadAllHistory}
            >
              {historyLoading
                ? "Loading..."
                : "View All History"}
            </button>
          </div>

          {adminHistory.length > 0 && (
            <div className="admin-history-table-wrapper">
              <table className="admin-history-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User ID</th>
                    <th>Prediction</th>
                    <th>Class 0</th>
                    <th>Class 1</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {adminHistory.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.user_id}</td>

                      <td>
                        {item.prediction === 1
                          ? "Disease Predicted"
                          : "Not Predicted"}
                      </td>

                      <td>
                        {(
                          item.probability_class_0 * 100
                        ).toFixed(2)}
                        %
                      </td>

                      <td>
                        {(
                          item.probability_class_1 * 100
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

        {message && (
          <div className="success-box admin-message">
            {message}
          </div>
        )}

        <div className="logout-section">
          <button
            onClick={logoutAdmin}
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
   FOOTER
========================================================= */

function Footer() {
  return (
    <footer className="footer">
      <p>
        🦋 <strong>ThyroAI</strong> — Thyroid Disease
        Prediction using Machine Learning & Explainable AI
      </p>

      <p>
        XGBoost • SHAP • DiCE
      </p>
    </footer>
  );
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/admin-login"
          element={<AdminLogin />}
        />

        {/* USER */}

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
          element={<History />}
        />

        {/* ADMIN */}

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
