import React, { useEffect, useState } from "react";
import "./index.css";

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_URL = "https://thyroid-disease-ml-xai.onrender.com";

/* =========================================================
   NAVIGATION
   ========================================================= */

const pages = [
  ["home", "Home"],
  ["prediction", "Prediction"],
  ["xai", "Explainable AI"],
  ["performance", "Performance"],
  ["about", "About"],
];

/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  /* Backend */
  const [backendOnline, setBackendOnline] = useState(false);
  const [status, setStatus] = useState(null);

  /* Dataset / ML */
  const [dataset, setDataset] = useState(null);
  const [features, setFeatures] = useState([]);
  const [models, setModels] = useState([]);

  /* Prediction */
  const [form, setForm] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);

  /* XAI */
  const [xaiResult, setXaiResult] = useState(null);
  const [counterfactuals, setCounterfactuals] = useState([]);

  /* Performance */
  const [performance, setPerformance] = useState(null);

  /* Admin */
  const [datasetFile, setDatasetFile] = useState(null);

  /* UI */
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =======================================================
     COMMON HELPERS
     ======================================================= */

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const apiRequest = async (endpoint, options = {}) => {
    const response = await fetch(`${API_URL}${endpoint}`, options);

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          `Request failed with status ${response.status}`
      );
    }

    return data;
  };

  /* =======================================================
     BACKEND STATUS
     ======================================================= */

  const loadStatus = async () => {
    try {
      const data = await apiRequest("/api/status");

      setBackendOnline(true);
      setStatus(data);

      setDataset(data.dataset || null);
      setFeatures(Array.isArray(data.features) ? data.features : []);
      setModels(Array.isArray(data.models) ? data.models : []);

      if (Array.isArray(data.features)) {
        setForm((old) => {
          const values = {};

          data.features.forEach((feature) => {
            const name =
              typeof feature === "string"
                ? feature
                : feature.name || feature.feature || feature.column;

            if (name) {
              values[name] = old[name] ?? "";
            }
          });

          return {
            ...values,
            ...old,
          };
        });
      }
    } catch (err) {
      setBackendOnline(false);
      setStatus(null);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  /* =======================================================
     NAVIGATION
     ======================================================= */

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    clearMessages();

    if (nextPage === "performance") {
      loadPerformance();
    }
  };

  /* =======================================================
     INPUT HANDLING
     ======================================================= */

  const handleInput = (name, value) => {
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  };

  /* =======================================================
     DATASET UPLOAD
     ======================================================= */

  const uploadDataset = async (file) => {
    if (!file) return;

    setUploading(true);
    clearMessages();

    try {
      const formData = new FormData();

      formData.append("file", file);

      const data = await apiRequest("/api/dataset/upload", {
        method: "POST",
        body: formData,
      });

      setMessage(
        data.message || "Dataset uploaded successfully."
      );

      setDataset(data.dataset || data);

      await loadStatus();
    } catch (err) {
      setError(err.message || "Dataset upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDatasetChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setDatasetFile(file);
  };

  /* =======================================================
     TRAIN MODELS
     ======================================================= */

  const trainModels = async () => {
    setTraining(true);
    clearMessages();

    try {
      const data = await apiRequest("/api/train", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      setMessage(
        data.message || "Machine-learning models trained successfully."
      );

      setModels(
        data.models ||
          data.results ||
          data.model_results ||
          []
      );

      await loadStatus();
      await loadPerformance();
    } catch (err) {
      setError(
        err.message ||
          "Model training failed. Please check the backend."
      );
    } finally {
      setTraining(false);
    }
  };

  /* =======================================================
     PREDICTION
     ======================================================= */

  const predict = async () => {
    setLoading(true);
    clearMessages();

    try {
      const cleanedForm = {};

      Object.entries(form).forEach(([key, value]) => {
        if (value === "") {
          cleanedForm[key] = null;
          return;
        }

        const numberValue = Number(value);

        cleanedForm[key] =
          Number.isNaN(numberValue) ? value : numberValue;
      });

      const data = await apiRequest("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedForm),
      });

      setPrediction(data);

      /*
       * Some backends return XAI information directly
       * together with the prediction.
       */
      if (data.xai) {
        setXaiResult(data.xai);
      }

      if (data.explanation) {
        setXaiResult(data.explanation);
      }

      if (data.counterfactuals) {
        setCounterfactuals(
          Array.isArray(data.counterfactuals)
            ? data.counterfactuals
            : []
        );
      }

      setMessage(
        data.message || "Prediction completed successfully."
      );

      await loadPredictionHistory();
    } catch (err) {
      setError(
        err.message ||
          "Prediction failed. Please check your input values."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     XAI
     ======================================================= */

  const generateExplanation = async () => {
    if (!prediction) {
      setError("Please make a prediction first.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const payload = {
        ...form,
        prediction:
          prediction.prediction ??
          prediction.result ??
          prediction.class ??
          prediction.label,
      };

      const data = await apiRequest("/api/xai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      setXaiResult(
        data.explanation ||
          data.xai ||
          data
      );

      if (Array.isArray(data.counterfactuals)) {
        setCounterfactuals(data.counterfactuals);
      }

      setMessage(
        data.message ||
          "Explainable AI analysis generated."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to generate the explanation."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     COUNTERFACTUAL EXPLANATION
     ======================================================= */

  const generateCounterfactual = async () => {
    if (!prediction) {
      setError("Make a prediction before generating counterfactuals.");
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const payload = {
        ...form,
        prediction:
          prediction.prediction ??
          prediction.result ??
          prediction.class ??
          prediction.label,
      };

      const data = await apiRequest(
        "/api/counterfactual",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const results =
        data.counterfactuals ||
        data.results ||
        data.data ||
        [];

      setCounterfactuals(
        Array.isArray(results) ? results : []
      );

      setMessage(
        data.message ||
          "Counterfactual explanation generated."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to generate counterfactual explanation."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     PERFORMANCE
     ======================================================= */

  const loadPerformance = async () => {
    try {
      const data = await apiRequest("/api/performance");

      setPerformance(
        data.performance ||
          data.results ||
          data
      );
    } catch {
      /*
       * Performance endpoint may not exist yet.
       * Keep the application usable.
       */
    }
  };

  /* =======================================================
     PREDICTION HISTORY
     ======================================================= */

  const loadPredictionHistory = async () => {
    try {
      const data = await apiRequest(
        "/api/prediction-history"
      );

      const history =
        data.history ||
        data.predictions ||
        data.results ||
        [];

      setPredictionHistory(
        Array.isArray(history) ? history : []
      );
    } catch {
      /*
       * History is optional.
       */
    }
  };

  useEffect(() => {
    loadPredictionHistory();
  }, []);

  /* =======================================================
     RESET
     ======================================================= */

  const resetPrediction = () => {
    setPrediction(null);
    setXaiResult(null);
    setCounterfactuals([]);
    clearMessages();
  };

  /* =======================================================
     RESULT HELPERS
     ======================================================= */

  const getPredictionLabel = () => {
    if (!prediction) return "No prediction";

    return (
      prediction.prediction ??
      prediction.result ??
      prediction.class ??
      prediction.label ??
      prediction.predicted_class ??
      "Prediction available"
    );
  };

  const getProbability = () => {
    if (!prediction) return null;

    return (
      prediction.probability ??
      prediction.confidence ??
      prediction.prediction_probability ??
      null
    );
  };

  /* =======================================================
     FEATURE LABEL
     ======================================================= */

  const formatFeatureName = (name) => {
    if (!name) return "";

    return name
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  };

  /* =======================================================
     FEATURE INPUT
     ======================================================= */

  const renderFeatureInput = (feature) => {
    const name =
      typeof feature === "string"
        ? feature
        : feature.name ||
          feature.feature ||
          feature.column;

    if (!name) return null;

    const type =
      typeof feature === "object"
        ? feature.type ||
          feature.data_type ||
          "number"
        : "number";

    const options =
      typeof feature === "object"
        ? feature.options
        : null;

    if (
      Array.isArray(options) &&
      options.length > 0
    ) {
      return (
        <div className="form-group" key={name}>
          <label htmlFor={name}>
            {formatFeatureName(name)}
          </label>

          <select
            id={name}
            value={form[name] ?? ""}
            onChange={(e) =>
              handleInput(name, e.target.value)
            }
          >
            <option value="">
              Select {formatFeatureName(name)}
            </option>

            {options.map((option) => (
              <option
                key={String(option)}
                value={option}
              >
                {String(option)}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="form-group" key={name}>
        <label htmlFor={name}>
          {formatFeatureName(name)}
        </label>

        <input
          id={name}
          type={
            type === "object" ||
            type === "string" ||
            type === "category"
              ? "text"
              : "number"
          }
          step="any"
          value={form[name] ?? ""}
          onChange={(e) =>
            handleInput(name, e.target.value)
          }
          placeholder={`Enter ${formatFeatureName(name)}`}
        />
      </div>
    );
  };

  /* =======================================================
     HOME PAGE
     ======================================================= */

  const renderHome = () => (
    <section className="hero">
      <div className="hero-content">
        <span className="badge">
          AI • MACHINE LEARNING • XAI
        </span>

        <h1>
          Enhancing Thyroid Disease Diagnosis
          <span> With Machine Learning</span>
        </h1>

        <p>
          An academic machine-learning system for
          thyroid disease prediction with
          Explainable AI and counterfactual
          explanations.
        </p>

        <div className="hero-buttons">
          <button
            className="primary-btn"
            onClick={() => navigate("prediction")}
          >
            Start Prediction
          </button>

          <button
            className="secondary-btn"
            onClick={() => navigate("xai")}
          >
            Explore XAI
          </button>
        </div>

        <div className="status-card">
          <span
            className={
              backendOnline
                ? "status-dot online"
                : "status-dot offline"
            }
          />

          <div>
            <strong>
              {backendOnline
                ? "Backend Online"
                : "Backend Offline"}
            </strong>

            <small>
              {backendOnline
                ? "ML prediction API is connected"
                : "Unable to connect to the ML API"}
            </small>
          </div>
        </div>
      </div>

      <div className="hero-card">
        <div className="medical-icon">🧬</div>

        <h2>Intelligent Diagnosis Support</h2>

        <p>
          Predict thyroid conditions and understand
          why the model made its prediction.
        </p>

        <div className="mini-stats">
          <div>
            <strong>
              {features.length || "—"}
            </strong>
            <span>Features</span>
          </div>

          <div>
            <strong>
              {models.length || "—"}
            </strong>
            <span>Models</span>
          </div>

          <div>
            <strong>
              {dataset?.rows ||
                dataset?.samples ||
                "—"}
            </strong>
            <span>Samples</span>
          </div>
        </div>
      </div>
    </section>
  );

  /* =======================================================
     PREDICTION PAGE
     ======================================================= */

  const renderPrediction = () => (
    <section className="page-section">
      <div className="page-header">
        <span className="badge">
          THYROID PREDICTION
        </span>

        <h1>Thyroid Disease Prediction</h1>

        <p>
          Enter the patient's clinical and
          laboratory information to obtain a
          machine-learning prediction.
        </p>
      </div>

      {!backendOnline && (
        <div className="alert error-alert">
          Backend is currently unavailable.
          Please make sure the Render API is running.
        </div>
      )}

      {error && (
        <div className="alert error-alert">
          {error}
        </div>
      )}

      {message && (
        <div className="alert success-alert">
          {message}
        </div>
      )}

      <div className="prediction-layout">
        <div className="card">
          <div className="card-header">
            <h2>Patient Information</h2>
            <span>
              {features.length} features
            </span>
          </div>

          {features.length === 0 ? (
            <div className="empty-state">
              <div>📋</div>

              <h3>
                No features available
              </h3>

              <p>
                The backend has not returned the
                prediction features yet.
              </p>

              <button
                className="secondary-btn"
                onClick={loadStatus}
              >
                Refresh Backend
              </button>
            </div>
          ) : (
            <div className="feature-grid">
              {features.map(renderFeatureInput)}
            </div>
          )}

          <div className="form-actions">
            <button
              className="secondary-btn"
              onClick={resetPrediction}
            >
              Clear
            </button>

            <button
              className="primary-btn"
              onClick={predict}
              disabled={
                loading ||
                !backendOnline ||
                features.length === 0
              }
            >
              {loading
                ? "Predicting..."
                : "Predict Thyroid Disease"}
            </button>
          </div>
        </div>

        <div className="card result-card">
          <div className="card-header">
            <h2>Prediction Result</h2>
          </div>

          {!prediction ? (
            <div className="empty-state">
              <div>🔬</div>

              <h3>
                Prediction will appear here
              </h3>

              <p>
                Complete the form and click the
                prediction button.
              </p>
            </div>
          ) : (
            <>
              <div className="prediction-result">
                <span className="result-label">
                  Predicted Class
                </span>

                <h2>
                  {String(getPredictionLabel())}
                </h2>

 
