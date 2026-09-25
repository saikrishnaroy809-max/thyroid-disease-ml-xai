import { useState } from "react";
import axios from "axios";
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

const initialForm = {
  age: 45,
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
  T4U: 1.0,
  "FTI measured": 1,
  FTI: 110,
};

const yesNoFields = [
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

function App() {
  const [page, setPage] = useState("home");

  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState([]);
  const [counterfactuals, setCounterfactuals] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ------------------------------------------
  // USER
  // ------------------------------------------

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("thyro_user") || "null")
  );

  const [authMode, setAuthMode] = useState("login");

  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // ------------------------------------------
  // ADMIN
  // ------------------------------------------

  const [admin, setAdmin] = useState(
    localStorage.getItem("thyro_admin") === "true"
  );

  const [adminForm, setAdminForm] = useState({
    username: "",
    password: "",
  });

  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const [datasetFile, setDatasetFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  // ------------------------------------------
  // NAVIGATION
  // ------------------------------------------

  const nav = (target) => {
    setPage(target);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ------------------------------------------
  // FORM CHANGE
  // ------------------------------------------

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  // ------------------------------------------
  // AUTH FORM CHANGE
  // ------------------------------------------

  const handleAuthChange = (e) => {
    const { name, value } = e.target;

    setAuthForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ------------------------------------------
  // USER REGISTER
  // ------------------------------------------

  const registerUser = async () => {
    setAuthError("");
    setAuthMessage("");

    if (
      !authForm.username ||
      !authForm.email ||
      !authForm.password
    ) {
      setAuthError("Please fill all fields.");
      return;
    }

    setAuthLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/register`,
        {
          username: authForm.username,
          email: authForm.email,
          password: authForm.password,
        }
      );

      setAuthMessage(
        response.data.message || "Registration successful."
      );

      setAuthMode("login");

      setAuthForm({
        username: "",
        email: authForm.email,
        password: "",
      });
    } catch (err) {
      setAuthError(
        err.response?.data?.detail ||
          "Registration failed."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // ------------------------------------------
  // USER LOGIN
  // ------------------------------------------

  const loginUser = async () => {
    setAuthError("");
    setAuthMessage("");

    if (!authForm.email || !authForm.password) {
      setAuthError("Enter email and password.");
      return;
    }

    setAuthLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/login`,
        {
          email: authForm.email,
          password: authForm.password,
        }
      );

      const loggedUser = {
        user_id: response.data.user_id,
        username: response.data.username,
        email: response.data.email,
      };

      setUser(loggedUser);

      localStorage.setItem(
        "thyro_user",
        JSON.stringify(loggedUser)
      );

      setAuthForm({
        username: "",
        email: "",
        password: "",
      });

      setAuthError("");
      setAuthMessage("");

      nav("dashboard");
    } catch (err) {
      setAuthError(
        err.response?.data?.detail ||
          "Invalid email or password."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // ------------------------------------------
  // USER LOGOUT
  // ------------------------------------------

  const logoutUser = () => {
    setUser(null);
    setHistory([]);

    localStorage.removeItem("thyro_user");

    nav("home");
  };

  // ------------------------------------------
  // GET USER HISTORY
  // ------------------------------------------

  const loadHistory = async () => {
    if (!user?.user_id) {
      nav("login");
      return;
    }

    setHistoryLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/auth/history/${user.user_id}`
      );

      setHistory(
        response.data.history || []
      );

      nav("history");
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load prediction history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // ------------------------------------------
  // PREDICTION
  // ------------------------------------------

  const predictDisease = async () => {
    if (!user) {
      nav("login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const predictionData = {
        ...form,
        user_id: user.user_id,
      };

      const predictResponse = await axios.post(
        `${API_URL}/predict`,
        predictionData
      );

      setPrediction(predictResponse.data);

      // SHAP
      try {
        const explainResponse = await axios.post(
          `${API_URL}/explain`,
          form
        );

        setExplanation(
          explainResponse.data.explanation || []
        );
      } catch {
        setExplanation([]);
      }

      // DiCE
      try {
        const cfResponse = await axios.post(
          `${API_URL}/counterfactual`,
          form
        );

        setCounterfactuals(
          cfResponse.data.counterfactuals || []
        );
      } catch {
        setCounterfactuals([]);
      }

      nav("results");
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
          "Unable to connect to the prediction server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------
  // RESET
  // ------------------------------------------

  const resetPrediction = () => {
    setPrediction(null);
    setExplanation([]);
    setCounterfactuals([]);
    setError("");
    setForm(initialForm);

    nav("prediction");
  };

  // ------------------------------------------
  // DOWNLOAD REPORT
  // ------------------------------------------

  const downloadReport = () => {
    if (!prediction) return;

    const resultText =
      prediction.prediction === 1
        ? "THYROID DISEASE PREDICTED"
        : "THYROID DISEASE NOT PREDICTED";

    let report = `
THYROID DISEASE DIAGNOSIS
MACHINE LEARNING & COUNTERFACTUAL EXPLAINABLE AI
------------------------------------------------

User:
${user?.username || "User"}

Prediction Result:
${resultText}

Model Class:
Class ${prediction.prediction}

Class 0 Probability:
${(
  prediction.probability_class_0 * 100
).toFixed(2)}%

Class 1 Probability:
${(
  prediction.probability_class_1 * 100
).toFixed(2)}%

------------------------------------------------
SHAP EXPLANATION
------------------------------------------------
`;

    explanation.forEach((item, index) => {
      report += `${index + 1}. ${item.feature}
SHAP Value: ${item.shap_value.toFixed(4)}
Impact: ${item.impact}

`;
    });

    report += `
------------------------------------------------
DISCLAIMER
------------------------------------------------

This application is an academic machine-learning
decision-support project.

The prediction must not be treated as a medical diagnosis.

Clinical interpretation by a qualified healthcare
professional is required.

Counterfactual explanations are model-generated
scenarios and are not treatment recommendations.
`;

    const blob = new Blob([report], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "thyroid_prediction_report.txt";

    link.click();

    URL.revokeObjectURL(url);
  };

  // ------------------------------------------
  // ADMIN LOGIN
  // ------------------------------------------

  const adminLogin = async () => {
    setAdminError("");

    if (
      !adminForm.username ||
      !adminForm.password
    ) {
      setAdminError(
        "Enter admin username and password."
      );

      return;
    }

    setAdminLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/admin-login`,
        {
          username: adminForm.username,
          password: adminForm.password,
        }
      );

      if (response.data.role === "admin") {
        setAdmin(true);

        localStorage.setItem(
          "thyro_admin",
          "true"
        );

        setAdminForm({
          username: "",
          password: "",
        });

        nav("admin");
      }
    } catch (err) {
      setAdminError(
        err.response?.data?.detail ||
          "Invalid admin credentials."
      );
    } finally {
      setAdminLoading(false);
    }
  };

  // ------------------------------------------
  // ADMIN LOGOUT
  // ------------------------------------------

  const adminLogout = () => {
    setAdmin(false);

    localStorage.removeItem(
      "thyro_admin"
    );

    nav("home");
  };

  // ------------------------------------------
  // DATASET UI
  // ------------------------------------------

  const handleDatasetUpload = () => {
    if (!datasetFile) {
      setUploadMessage(
        "Please select a CSV file first."
      );

      return;
    }

    if (
      !datasetFile.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setUploadMessage(
        "Only CSV files are allowed."
      );

      return;
    }

    setUploadMessage(
      `Dataset "${datasetFile.name}" selected successfully.`
    );
  };

  // ------------------------------------------
  // CHART DATA
  // ------------------------------------------

  const probabilityData = prediction
    ? [
        {
          name: "Class 0",
          probability:
            prediction.probability_class_0 *
            100,
        },
        {
          name: "Class 1",
          probability:
            prediction.probability_class_1 *
            100,
        },
      ]
    : [];

  const shapData = explanation.map(
    (item) => ({
      feature: item.feature,
      value: Math.abs(
        item.shap_value
      ),
      original: item.shap_value,
    })
  );

  return (
    <div className="app">

      {/* ================================================= */}
      {/* NAVBAR */}
      {/* ================================================= */}

      <header className="navbar">

        <div
          className="brand"
          onClick={() => nav("home")}
        >
          <div className="brand-icon">
            🩺
          </div>

          <div>
            <h2>ThyroAI</h2>

            <span>
              ML + Counterfactual XAI
            </span>
          </div>
        </div>

        <nav className="nav-links">

          <button
            className={
              page === "home"
                ? "active"
                : ""
            }
            onClick={() => nav("home")}
          >
            Home
          </button>

          <button
            className={
              page === "prediction"
                ? "active"
                : ""
            }
            onClick={() => nav("prediction")}
          >
            Prediction
          </button>

          {user && (
            <>
              <button
                onClick={() =>
                  nav("dashboard")
                }
              >
                Dashboard
              </button>

              <button
                onClick={loadHistory}
              >
                History
              </button>
            </>
          )}

          <button
            className={
              page === "about"
                ? "active"
                : ""
            }
            onClick={() => nav("about")}
          >
            About
          </button>

          {!user && (
            <button
              className="admin-button"
              onClick={() =>
                nav("login")
              }
            >
              👤 Login
            </button>
          )}

          {user && (
            <button
              className="admin-button"
              onClick={logoutUser}
            >
              Logout
            </button>
          )}

          <button
            className="admin-button"
            onClick={() =>
              nav(
                admin
                  ? "admin"
                  : "admin-login"
              )
            }
          >
            🔐 Admin
          </button>

        </nav>

      </header>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main>

        {/* ================================================= */}
        {/* HOME */}
        {/* ================================================= */}

        {page === "home" && (
          <section className="home-page">

            <div className="hero">

              <div className="hero-content">

                <div className="badge">
                  🧠 Machine Learning + Explainable AI
                </div>

                <h1>
                  Enhancing Thyroid Disease Diagnosis
                </h1>

                <h2>
                  With Machine Learning and
                  Counterfactual Explainable AI
                </h2>

                <p>
                  An academic AI-based system using
                  machine learning, SHAP explanations
                  and counterfactual examples.
                </p>

                <div className="hero-buttons">

                  <button
                    className="primary-button"
                    onClick={() =>
                      nav(
                        user
                          ? "prediction"
                          : "login"
                      )
                    }
                  >
                    Start Prediction →
                  </button>

                  <button
                    className="secondary-button"
                    onClick={() =>
                      nav("about")
                    }
                  >
                    Explore Project
                  </button>

                </div>

              </div>

              <div className="hero-card">

                <div className="hero-card-icon">
                  🧬
                </div>

                <h3>
                  Explainable Prediction
                </h3>

                <p>
                  XGBoost prediction combined
                  with SHAP and DiCE.
                </p>

                <div className="mini-stats">

                  <div>
                    <strong>ML</strong>
                    <span>XGBoost</span>
                  </div>

                  <div>
                    <strong>XAI</strong>
                    <span>SHAP</span>
                  </div>

                  <div>
                    <strong>CF</strong>
                    <span>DiCE</span>
                  </div>

                </div>

              </div>

            </div>

            <div className="feature-grid">

              <div className="feature-card">
                <span>🤖</span>
                <h3>
                  Machine Learning
                </h3>
                <p>
                  XGBoost-based classification.
                </p>
              </div>

              <div className="feature-card">
                <span>🔍</span>
                <h3>
                  SHAP
                </h3>
                <p>
                  Understand influential features.
                </p>
              </div>

              <div className="feature-card">
                <span>🔄</span>
                <h3>
                  Counterfactual AI
                </h3>
                <p>
                  Explore alternative model scenarios.
                </p>
              </div>

              <div className="feature-card">
                <span>📜</span>
                <h3>
                  User History
                </h3>
                <p>
                  Review previous predictions.
                </p>
              </div>

            </div>

            <div className="disclaimer">

              <strong>
                ⚠️ Academic & Medical Disclaimer
              </strong>

              <p>
                This application is an academic
                machine-learning project and is not
                a medical diagnostic system.
              </p>

            </div>

          </section>
        )}

        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        {page === "login" && (
          <section className="page-container">

            <div className="login-modal standalone">

              <div className="login-icon">
                👤
              </div>

              <h2>
                {authMode === "login"
                  ? "User Login"
                  : "Create Account"}
              </h2>

              <p>
                {authMode === "login"
                  ? "Login to access prediction and history."
                  : "Create your ThyroAI account."}
              </p>

              {authMode === "register" && (
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={authForm.username}
                  onChange={handleAuthChange}
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={authForm.email}
                onChange={handleAuthChange}
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={authForm.password}
                onChange={handleAuthChange}
              />

              {authError && (
                <div className="error-box">
                  ❌ {authError}
                </div>
              )}

              {authMessage && (
                <div className="upload-message">
                  ✅ {authMessage}
                </div>
              )}

              <button
                className="primary-button full-width"
                disabled={authLoading}
                onClick={
                  authMode === "login"
                    ? loginUser
                    : registerUser
                }
              >
                {authLoading
                  ? "Please wait..."
                  : authMode === "login"
                  ? "Login"
                  : "Register"}
              </button>

              <button
                className="secondary-button full-width"
                onClick={() => {
                  setAuthMode(
                    authMode === "login"
                      ? "register"
                      : "login"
                  );

                  setAuthError("");
                  setAuthMessage("");
                }}
              >
                {authMode === "login"
                  ? "Create New Account"
                  : "Already have an account? Login"}
              </button>

            </div>

          </section>
        )}

        {/* ================================================= */}
        {/* USER DASHBOARD */}
        {/* ================================================= */}

        {page === "dashboard" && user && (
          <section className="page-container">

            <div className="page-heading">

              <span className="section-label">
                USER DASHBOARD
              </span>

              <h1>
                Welcome, {user.username}
              </h1>

              <p>
                Manage your thyroid prediction
                analysis and history.
              </p>

            </div>

            <div className="feature-grid">

              <div className="feature-card">

                <span>🔬</span>

                <h3>
                  New Prediction
                </h3>

                <p>
                  Submit thyroid-related
                  features for model analysis.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    nav("prediction")
                  }
                >
                  Start
                </button>

              </div>

              <div className="feature-card">

                <span>📜</span>

                <h3>
                  Prediction History
                </h3>

                <p>
                  View your previous prediction
                  records.
                </p>

                <button
                  className="secondary-button"
                  onClick={loadHistory}
                >
                  View History
                </button>

              </div>

              <div className="feature-card">

                <span>🧠</span>

                <h3>
                  Explainable AI
                </h3>

                <p>
                  View SHAP and DiCE explanations
                  after prediction.
                </p>

              </div>

            </div>

          </section>
        )}

        {/* ================================================= */}
        {/* PREDICTION */}
        {/* ================================================= */}

        {page === "prediction" && (
          <section className="page-container">

            <div className="page-heading">

              <span className="section-label">
                AI ANALYSIS
              </span>

              <h1>
                Thyroid Disease Prediction
              </h1>

              <p>
                Enter the patient-related features.
              </p>

            </div>

            {!user ? (
              <div className="large-card">

                <h2>
                  Login Required
                </h2>

                <p>
                  Please login before making
                  a prediction so the result
                  can be saved to your history.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    nav("login")
                  }
                >
                  Login
                </button>

              </div>
            ) : (

              <div className="prediction-layout">

                <div className="form-card">

                  <h2>
                    Patient Information
                  </h2>

                  <div className="form-grid">

                    <div className="input-group">
                      <label>Age</label>

                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={handleChange}
                        min="1"
                        max="120"
                      />
                    </div>

                    <div className="input-group">
                      <label>Sex</label>

                      <select
                        name="sex"
                        value={form.sex}
                        onChange={handleChange}
                      >
                        <option value={0}>
                          Female
                        </option>

                        <option value={1}>
                          Male
                        </option>
                      </select>
                    </div>

                    {yesNoFields.map(
                      (field) => (
                        <div
                          className="input-group"
                          key={field}
                        >
                          <label>
                            {field}
                          </label>

                          <select
                            name={field}
                            value={form[field]}
                            onChange={handleChange}
                          >
                            <option value={0}>
                              No
                            </option>

                            <option value={1}>
                              Yes
                            </option>
                          </select>
                        </div>
                      )
                    )}

                    <div className="input-group">
                      <label>TSH</label>

                      <input
                        type="number"
                        step="0.01"
                        name="TSH"
                        value={form.TSH}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="input-group">
                      <label>TT4</label>

                      <input
                        type="number"
                        step="0.01"
                        name="TT4"
                        value={form.TT4}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="input-group">
                      <label>T4U</label>

                      <input
                        type="number"
                        step="0.01"
                        name="T4U"
                        value={form.T4U}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="input-group">
                      <label>FTI</label>

                      <input
                        type="number"
                        step="0.01"
                        name="FTI"
                        value={form.FTI}
                        onChange={handleChange}
                      />
                    </div>

                  </div>

                  {error && (
                    <div className="error-box">
                      ❌ {error}
                    </div>
                  )}

                  <button
                    className="predict-button"
                    onClick={predictDisease}
                    disabled={loading}
                  >
                    {loading
                      ? "Analyzing..."
                      : "🔍 Predict Thyroid Disease"}
                  </button>

                </div>

                <div className="info-card">

                  <div className="info-icon">
                    🧠
                  </div>

                  <h2>
                    How it works
                  </h2>

                  <div className="process-step">
                    <b>01</b>
                    <span>
                      Patient features are submitted.
                    </span>
                  </div>

                  <div className="process-step">
                    <b>02</b>
                    <span>
                      XGBoost generates prediction.
                    </span>
                  </div>

                  <div className="process-step">
                    <b>03</b>
                    <span>
                      SHAP explains feature impact.
                    </span>
                  </div>

                  <div className="process-step">
                    <b>04</b>
                    <span>
                      DiCE generates counterfactuals.
                    </span>
                  </div>

                </div>

              </div>

            )}

          </section>
        )}

        {/* ================================================= */}
        {/* RESULTS */}
        {/* ================================================= */}

        {page === "results" && prediction && (
          <section className="page-container">

            <div className="page-heading">

              <span className="section-label">
                ANALYSIS COMPLETE
              </span>

              <h1>
                Prediction Results
              </h1>

            </div>

            <div
              className={
                prediction.prediction === 1
                  ? "result-card result-danger"
                  : "result-card result-safe"
              }
            >

              <div className="result-icon">
                {prediction.prediction === 1
                  ? "🔴"
                  : "🟢"}
              </div>

              <div>

                <span className="result-small">
                  MODEL RESULT
                </span>

                <h2>
                  {prediction.prediction === 1
                    ? "Thyroid Disease Predicted"
                    : "Thyroid Disease Not Predicted"}
                </h2>

                <p>
                  Model prediction:{" "}
                  <strong>
                    Class {prediction.prediction}
                  </strong>
                </p>

              </div>

            </div>

            {/* PROBABILITY */}

            <div className="result-grid">

              <div className="chart-card">

                <div className="card-header">

                  <div>
                    <span>
                      MODEL CONFIDENCE
                    </span>

                    <h2>
                      Prediction Probability
                    </h2>
                  </div>

                </div>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart
                    data={probabilityData}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="name"
                    />

                    <YAxis
                      domain={[0, 100]}
                    />

                    <Tooltip
                      formatter={(value) =>
                        `${Number(value).toFixed(2)}%`
                      }
                    />

                    <Bar
                      dataKey="probability"
                      radius={[
                        8,
                        8,
                        0,
                        0,
                      ]}
                    />

                  </BarChart>
                </ResponsiveContainer>

              </div>

              <div className="probability-card">

                <h2>
                  Probability Details
                </h2>

                <div className="probability-row">
                  <span>
                    Class 0
                  </span>

                  <strong>
                    {(
                      prediction.probability_class_0 *
                      100
                    ).toFixed(2)}
                    %
                  </strong>
                </div>

                <div className="progress">
                  <div
                    style={{
                      width: `${
                        prediction.probability_class_0 *
                        100
                      }%`,
                    }}
                  />
                </div>

                <div className="probability-row">
                  <span>
                    Class 1
                  </span>

                  <strong>
                    {(
                      prediction.probability_class_1 *
                      100
                    ).toFixed(2)}
                    %
                  </strong>
                </div>

                <div className="progress">
                  <div
                    style={{
                      width: `${
                        prediction.probability_class_1 *
                        100
                      }%`,
                    }}
                  />
                </div>

              </div>

            </div>

            {/* SHAP */}

            <div className="large-card">

              <div className="card-header">

                <div>
                  <span>
                    EXPLAINABLE AI
                  </span>

                  <h2>
                    SHAP Feature Impact
                  </h2>
                </div>

              </div>

              {shapData.length > 0 ? (

                <ResponsiveContainer
                  width="100%"
                  height={420}
                >
                  <BarChart
                    data={shapData}
                    layout="vertical"
                    margin={{
                      left: 40,
                      right: 30,
                    }}
                  >

                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis type="number" />

                    <YAxis
                      dataKey="feature"
                      type="category"
                      width={150}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="value"
                      radius={[
                        0,
                        6,
                        6,
                        0,
                      ]}
                    />

                  </BarChart>
                </ResponsiveContainer>

              ) : (
                <p>
                  SHAP explanation unavailable.
                </p>
              )}

            </div>

            {/* SHAP LIST */}

            {explanation.length > 0 && (
              <div className="large-card">

                <h2>
                  Top Influential Features
                </h2>

                <div className="shap-list">

                  {explanation.map(
                    (item, index) => (
                      <div
                        className="shap-item"
                        key={index}
                      >

                        <div className="shap-rank">
                          {index + 1}
                        </div>

                        <div className="shap-info">

                          <strong>
                            {item.feature}
                          </strong>

                          <span>
                            {item.impact ===
                            "positive"
                              ? "Positive impact"
                              : "Negative impact"}
                          </span>

                        </div>

                        <div
                          className={
                            item.impact ===
                            "positive"
                              ? "shap-positive"
                              : "shap-negative"
                          }
                        >
                          {item.shap_value > 0
                            ? "+"
                            : ""}
                          {item.shap_value.toFixed(4)}
                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* DICE */}

            <div className="large-card">

              <span>
                COUNTERFACTUAL EXPLAINABILITY
              </span>

              <h2>
                Alternative Model Scenarios
              </h2>

              {counterfactuals.length > 0 ? (

                <div className="counterfactual-grid">

                  {counterfactuals.map(
                    (cf, index) => (
                      <div
                        className="counterfactual-card"
                        key={index}
                      >

                        <h3>
                          Scenario {index + 1}
                        </h3>

                        <div className="cf-result">
                          Target Class:{" "}
                          <strong>
                            {cf.binaryClass}
                          </strong>
                        </div>

                        <div className="cf-values">

                          {Object.entries(cf)
                            .filter(
                              ([key]) =>
                                key !==
                                "binaryClass"
                            )
                            .slice(0, 8)
                            .map(
                              ([key, value]) => (
                                <div
                                  key={key}
                                >
                                  <span>
                                    {key}
                                  </span>

                                  <strong>
                                    {String(
                                      value
                                    )}
                                  </strong>
                                </div>
                              )
                            )}

                        </div>

                      </div>
                    )
                  )}

                </div>

              ) : (
                <div className="empty-state">
                  Counterfactual examples
                  unavailable.
                </div>
              )}

            </div>

            <div className="result-actions">

              <button
                className="primary-button"
                onClick={downloadReport}
              >
                📥 Download Report
              </button>

              <button
                className="secondary-button"
                onClick={resetPrediction}
              >
                🔄 New Prediction
              </button>

            </div>

            <div className="disclaimer">

              <strong>
                ⚠️ Important Medical Disclaimer
              </strong>

              <p>
                This result is generated by a
                machine-learning model for academic
                and research purposes. It should not
                be interpreted as a confirmed medical
                diagnosis.
              </p>

            </div>

          </section>
        )}

        {/* ================================================= */}
        {/* HISTORY */}
        {/* ================================================= */}

        {page === "history" && user && (
          <section className="page-container">

            <div className="page-heading">

              <span className="section-label">
                USER HISTORY
              </span>

              <h1>
                Prediction History
              </h1>

              <p>
                Previous predictions saved to
                your account.
              </p>

            </div>

            {historyLoading ? (
              <div className="large-card">
                Loading history...
              </div>
            ) : history.length === 0 ? (

              <div className="large-card">

                <h2>
                  No prediction history
                </h2>

                <p>
                  Your completed predictions
                  will appear here.
                </p>

                <button
                  className="primary-button"
                  onClick={() =>
                    nav("prediction")
                  }
                >
                  Make a Prediction
                </button>

              </div>

            ) : (

              <div className="large-card">

                <div className="history-list">

                  {history.map(
                    (record) => (
                      <div
                        className="history-item"
                        key={record.id}
                      >

                        <div>

                          <strong>
                            {record.prediction === 1
                              ? "🔴 Thyroid Disease Predicted"
                              : "🟢 Thyroid Disease Not Predicted"}
                          </strong>

                          <p>
                            Class{" "}
                            {record.prediction}
                          </p>

                          <small>
                            {record.created_at}
                          </small>

                        </div>

                        <div>

                          <strong>
                            Class 0:{" "}
                            {(
                              record.probability_class_0 *
                              100
                            ).toFixed(2)}
                            %
                          </strong>

                          <br />

                          <strong>
                            Class 1:{" "}
                            {(
                              record.probability_class_1 *
                              100
                            ).toFixed(2)}
                            %
                          </strong>

                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

            )}

          </section>
        )}

        {/* ================================================= */}
        {/* ADMIN LOGIN */}
        {/* ================================================= */}

        {page === "admin-login" && (
          <section className="page-container">

            <div className="login-modal standalone">

              <div className="login-icon">
                🔐
              </div>

              <h2>
                Admin Login
              </h2>

              <p>
                Administrator access
              </p>

              <input
                type="text"
                placeholder="Username"
                value={adminForm.username}
                onChange={(e) =>
                  setAdminForm({
                    ...adminForm,
                    username:
                      e.target.value,
                  })
                }
              />

              <input
                type="password"
                placeholder="Password"
                value={adminForm.password}
                onChange={(e) =>
                  setAdminForm({
                    ...adminForm,
                    password:
                      e.target.value,
                  })
                }
              />

              {adminError && (
                <div className="error-box">
                  ❌ {adminError}
                </div>
              )}

              <button
                className="primary-button full-width"
                disabled={adminLoading}
                onClick={adminLogin}
              >
                {adminLoading
                  ? "Logging in..."
                  : "Admin Login"}
              </button>

            </div>

          </section>
        )}

        {/* ================================================= */}
        {/* ADMIN DASHBOARD */}
        {/* ================================================= */}

        {page === "admin" && admin && (
          <section className="page-container">

            <div className="page-heading">

              <span className="section-label">
                ADMINISTRATION
              </span>

              <h1>
                Admin Dashboard
              </h1>

              <p>
                Manage datasets and monitor
                the machine-learning system.
              </p>

            </div>

            <div className="feature-grid">

              <div className="feature-card">

                <span>📁</span>

                <h3>
                  Upload Dataset
                </h3>

                <p>
                  Select a CSV dataset.
                </p>

                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) =>
                    setDatasetFile(
                      e.target.files?.[0] ||
                        null
                    )
                  }
                />

                <button
                  className="primary-button"
                  onClick={
                    handleDatasetUpload
                  }
                >
                  Select Dataset
                </button>

                {uploadMessage && (
                  <p>
                    {uploadMessage}
                  </p>
                )}

              </div>

              <div className="feature-card">

                <span>🤖</span>

                <h3>
                  Current Algorithm
                </h3>

                <p>
                  XGBoost
                </p>

              </div>

              <div className="feature-card">

                <span>🧠</span>

                <h3>
                  Explainability
                </h3>

                <p>
                  SHAP + DiCE
                </p>

              </div>

              <div className="feature-card">

                <span>📊</span>

                <h3>
                  Model Status
                </h3>

                <p>
                  Connected to FastAPI
                </p>

              </div>

            </div>

            <div className="large-card">

              <h2>
                Dataset Processing
              </h2>

              <p>
                Dataset preprocessing, algorithm
                comparison, test accuracy and
                comparison graphs will be connected
                to the backend in the next stage.
              </p>

            </div>

            <button
              className="secondary-button"
              onClick={adminLogout}
            >
              Logout Admin
            </button>

          </section>
        )}

        {/* ================================================= */}
        {/* ABOUT */}
        {/* ================================================= */}

        {page === "about" && (
          <section className="page-container">

            <div className="page-heading">

              <span className="section-label">
                PROJECT INFORMATION
              </span>

              <h1>
                About the Project
              </h1>

              <p>
                Enhancing Thyroid Disease Diagnosis
                With Machine Learning and
                Counterfactual Explainable AI
              </p>

            </div>

            <div className="about-grid">

              <div className="large-card">

                <h2>
                  Project Overview
                </h2>

                <p>
                  This final-year B.Tech project
                  explores machine-learning techniques
                  for thyroid disease prediction while
                  improving model interpretability
                  through Explainable AI.
                </p>

                <p>
                  The system uses XGBoost together
                  with SHAP feature explanations
                  and DiCE counterfactual examples.
                </p>

              </div>

              <div className="large-card">

                <h2>
                  Technology Stack
                </h2>

                <div className="tech-list">

                  <span>Python</span>
                  <span>Pandas</span>
                  <span>XGBoost</span>
                  <span>SHAP</span>
                  <span>DiCE</span>
                  <span>FastAPI</span>
                  <span>React</span>
                  <span>Vite</span>
                  <span>Recharts</span>
                  <span>SQLite</span>

                </div>

              </div>

            </div>

          </section>
        )}

      </main>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer>

        <div>

          <strong>
            ThyroAI
          </strong>

          <p>
            Machine Learning + Explainable AI
          </p>

        </div>

        <div className="footer-right">
          Final Year B.Tech Project • 2026
        </div>

      </footer>

    </div>
  );
}

export default App;
