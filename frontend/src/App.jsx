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

const API_URL =
  "https://thyroid-disease-ml-xai.onrender.com";

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
  T4U: 1,
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

  // ==================================================
  // PREDICTION
  // ==================================================

  const [form, setForm] = useState(initialForm);
  const [prediction, setPrediction] = useState(null);
  const [explanation, setExplanation] = useState([]);
  const [counterfactuals, setCounterfactuals] =
    useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==================================================
  // USER
  // ==================================================

  const [user, setUser] = useState(
    JSON.parse(
      localStorage.getItem("thyro_user") || "null"
    )
  );

  const [authMode, setAuthMode] =
    useState("login");

  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] =
    useState("");
  const [authLoading, setAuthLoading] =
    useState(false);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);

  // ==================================================
  // ADMIN
  // ==================================================

  const [admin, setAdmin] = useState(
    localStorage.getItem("thyro_admin") ===
      "true"
  );

  const [adminForm, setAdminForm] = useState({
    username: "",
    password: "",
  });

  const [adminError, setAdminError] = useState("");
  const [adminLoading, setAdminLoading] =
    useState(false);

  // Dataset
  const [datasetFile, setDatasetFile] =
    useState(null);

  const [datasetUploading, setDatasetUploading] =
    useState(false);

  const [datasetInfo, setDatasetInfo] =
    useState(null);

  const [uploadMessage, setUploadMessage] =
    useState("");

  // ==================================================
  // NAVIGATION
  // ==================================================

  const nav = (target) => {
    setPage(target);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==================================================
  // FORM CHANGE
  // ==================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: Number(value),
    }));
  };

  // ==================================================
  // AUTH FORM CHANGE
  // ==================================================

  const handleAuthChange = (e) => {
    const { name, value } = e.target;

    setAuthForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==================================================
  // REGISTER
  // ==================================================

  const registerUser = async () => {
    setAuthError("");
    setAuthMessage("");

    if (
      !authForm.username ||
      !authForm.email ||
      !authForm.password
    ) {
      setAuthError(
        "Please fill all fields."
      );
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
        response.data.message ||
          "Registration successful."
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

  // ==================================================
  // LOGIN
  // ==================================================

  const loginUser = async () => {
    setAuthError("");
    setAuthMessage("");

    if (
      !authForm.email ||
      !authForm.password
    ) {
      setAuthError(
        "Enter email and password."
      );
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

  // ==================================================
  // USER LOGOUT
  // ==================================================

  const logoutUser = () => {
    setUser(null);
    setHistory([]);

    localStorage.removeItem(
      "thyro_user"
    );

    nav("home");
  };

  // ==================================================
  // HISTORY
  // ==================================================

  const loadHistory = async () => {
    if (!user?.user_id) {
      nav("login");
      return;
    }

    setHistoryLoading(true);
    setError("");

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

  // ==================================================
  // PREDICTION
  // ==================================================

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

      const predictionResponse =
        await axios.post(
          `${API_URL}/predict`,
          predictionData
        );

      setPrediction(
        predictionResponse.data
      );

      // SHAP
      try {
        const shapResponse =
          await axios.post(
            `${API_URL}/explain`,
            form
          );

        setExplanation(
          shapResponse.data.explanation ||
            []
        );
      } catch (shapError) {
        console.error(
          "SHAP error:",
          shapError
        );

        setExplanation([]);
      }

      // DiCE
      try {
        const diceResponse =
          await axios.post(
            `${API_URL}/counterfactual`,
            form
          );

        setCounterfactuals(
          diceResponse.data
            .counterfactuals || []
        );
      } catch (diceError) {
        console.error(
          "DiCE error:",
          diceError
        );

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

  // ==================================================
  // RESET
  // ==================================================

  const resetPrediction = () => {
    setPrediction(null);
    setExplanation([]);
    setCounterfactuals([]);
    setError("");
    setForm(initialForm);

    nav("prediction");
  };

  // ==================================================
  // DOWNLOAD REPORT
  // ==================================================

  const downloadReport = () => {
    if (!prediction) return;

    const resultText =
      prediction.prediction === 1
        ? "THYROID DISEASE PREDICTED"
        : "THYROID DISEASE NOT PREDICTED";

    let report = `
THYROID DISEASE DIAGNOSIS
MACHINE LEARNING & COUNTERFACTUAL EXPLAINABLE AI
================================================

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

================================================
SHAP EXPLANATION
================================================
`;

    explanation.forEach((item, index) => {
      report += `${index + 1}. ${
        item.feature
      }
SHAP Value: ${item.shap_value.toFixed(4)}
Impact: ${item.impact}

`;
    });

    report += `
================================================
DISCLAIMER
================================================

This application is an academic
machine-learning decision-support project.

The prediction must not be treated as
a medical diagnosis.

Clinical interpretation by a qualified
healthcare professional is required.

Counterfactual explanations are
model-generated scenarios and are not
treatment recommendations.
`;

    const blob = new Blob([report], {
      type: "text/plain",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      "thyroid_prediction_report.txt";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ==================================================
  // ADMIN LOGIN
  // ==================================================

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

      if (
        response.data.role === "admin"
      ) {
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

  // ==================================================
  // ADMIN LOGOUT
  // ==================================================

  const adminLogout = () => {
    setAdmin(false);

    localStorage.removeItem(
      "thyro_admin"
    );

    nav("home");
  };

  // ==================================================
  // DATASET FILE SELECTION
  // ==================================================

  const selectDataset = (e) => {
    const file =
      e.target.files?.[0] || null;

    setDatasetFile(file);
    setDatasetInfo(null);
    setUploadMessage("");

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setDatasetFile(null);

      setUploadMessage(
        "❌ Only CSV files are allowed."
      );
    }
  };

  // ==================================================
  // DATASET UPLOAD
  // ==================================================

  const uploadDataset = async () => {
    if (!datasetFile) {
      setUploadMessage(
        "❌ Please select a CSV dataset first."
      );

      return;
    }

    if (
      !datasetFile.name
        .toLowerCase()
        .endsWith(".csv")
    ) {
      setUploadMessage(
        "❌ Only CSV files are allowed."
      );

      return;
    }

    setDatasetUploading(true);
    setUploadMessage("");
    setDatasetInfo(null);

    try {
      const formData =
        new FormData();

      formData.append(
        "file",
        datasetFile
      );

      const response =
        await axios.post(
          `${API_URL}/admin/upload-dataset`,
          formData
        );

      setDatasetInfo({
        filename:
          response.data.filename,
        rows: response.data.rows,
        columns:
          response.data.columns,
        column_names:
          response.data.column_names ||
          [],
      });

      setUploadMessage(
        "✅ Dataset uploaded successfully."
      );
    } catch (err) {
      console.error(
        "Dataset upload error:",
        err
      );

      setUploadMessage(
        err.response?.data?.detail ||
          "❌ Dataset upload failed."
      );
    } finally {
      setDatasetUploading(false);
    }
  };

  // ==================================================
  // CHART DATA
  // ==================================================

  const probabilityData =
    prediction
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

  const shapData =
    explanation.map((item) => ({
      feature: item.feature,
      value: Math.abs(
        item.shap_value
      ),
      original:
        item.shap_value,
    }));

  // ==================================================
  // UI
  // ==================================================

  return (
    <div className="app">

      {/* ================================================= */}
      {/* NAVBAR */}
      {/* ================================================= */}

      <header className="navbar">

        <div
          className="brand"
          onClick={() =>
            nav("home")
          }
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
            onClick={() =>
              nav("home")
            }
          >
            Home
          </button>

          <button
            className={
              page === "prediction"
                ? "active"
                : ""
            }
            onClick={() =>
              nav("prediction")
            }
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
            onClick={() =>
              nav("about")
            }
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
                  🧠 Machine Learning +
                  Explainable AI
                </div>

                <h1>
                  Enhancing Thyroid
                  Disease Diagnosis
                </h1>

                <h2>
                  With Machine Learning
                  and Counterfactual
                  Explainable AI
                </h2>

                <p>
                  An academic AI-based
                  system using machine
                  learning, SHAP explanations
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
                  XGBoost prediction
                  combined with SHAP
                  and DiCE.
                </p>

                <div className="mini-stats">

                  <div>
                    <strong>
                      ML
                    </strong>

                    <span>
                      XGBoost
                    </span>
                  </div>

                  <div>
                    <strong>
                      XAI
                    </strong>

                    <span>
                      SHAP
                    </span>
                  </div>

                  <div>
                    <strong>
                      CF
                    </strong>

                    <span>
                      DiCE
                    </span>
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
                  XGBoost-based
                  classification.
                </p>
              </div>

              <div className="feature-card">
                <span>🔍</span>

                <h3>
                  SHAP
                </h3>

                <p>
                  Understand influential
                  features.
                </p>
              </div>

              <div className="feature-card">
                <span>🔄</span>

                <h3>
                  Counterfactual AI
                </h3>

                <p>
                  Explore alternative
                  model scenarios.
                </p>
              </div>

              <div className="feature-card">
                <span>📜</span>

                <h3>
                  User History
                </h3>

                <p>
                  Review previous
                  predictions.
                </p>
              </div>

            </div>

            <div className="disclaimer">

              <strong>
                ⚠️ Academic & Medical
                Disclaimer
              </strong>

              <p>
                This application is an
                academic machine-learning
                project and is not a
                medical diagnostic system.
              </p>

            </div>

          </section>
        )}

        {/* ================================================= */}
        {/* USER LOGIN / REGISTER */}
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

              {authMode ===
                "register" && (
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={
                    authForm.username
                  }
                  onChange={
                    handleAuthChange
                  }
                />
              )}

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={authForm.email}
                onChange={
                  handleAuthChange
                }
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={
                  authForm.password
                }
                onChange={
                  handleAuthChange
                }
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

        {page === "dashboard" &&
          user && (
            <section className="page-container">

              <div className="page-heading">

                <span className="section-label">
                  USER DASHBOARD
                </span>

                <h1>
                  Welcome,{" "}
                  {user.username}
                </h1>

                <p>
                  Manage your thyroid
                  prediction analysis
                  and history.
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
                    features for model
                    analysis.
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
                    View your previous
                    prediction records.
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
                    View SHAP and DiCE
                    explanations after
                    prediction.
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
                Thyroid Disease
                Prediction
              </h1>

              <p>
                Enter the patient-related
                features.
              </p>

            </div>

            {!user ? (
              <div className="large-card">

                <h2>
                  Login Required
                </h2>

                <p>
                  Please login before
                  making a prediction.
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

                      <label>
                        Age
                      </label>

                      <input
                        type="number"
                        name="age"
                        value={form.age}
                        onChange={
                          handleChange
                        }
                        min="1"
                        max="120"
                      />

                    </div>

                    <div className="input-group">

                      <label>
                        Sex
                      </label>

                      <select
                        name="sex"
                        value={form.sex}
                        onChange={
                          handleChange
                        }
                      >
                        <option value={0}>
                          Female
