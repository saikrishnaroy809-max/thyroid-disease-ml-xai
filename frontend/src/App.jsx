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
   STORAGE
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
              Generate alternative patient conditions and
              explanations.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Admin Management</h3>
            <p>
              Admin can manage datasets and view prediction
              history.
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

          <p>
            Login to access your thyroid prediction dashboard.
          </p>

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

  async function handleRegister(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

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

            <button
              type="submit"
              className="primary-button full-width"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Register"}
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

  async function handleLogin(e) {
    e.preventDefault();

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

            <button
              type="submit"
              className="primary-button full-width"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Admin Login"}
            </button>
          </form>
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
              View counterfactual explanations.
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

      /* =====================================================
         SHAP
      ===================================================== */

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
      } catch (error) {
        console.log("SHAP error:", error);
      }

      /* =====================================================
         DiCE
      ===================================================== */

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
                  onChange={(e) =>
                    updateField(
                      "age",
                      e.target.value
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
                  onChange={(e) =>
                    updateField(
                      "sex",
                      Number(e.target.value)
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
              {booleanFields
                .filter
