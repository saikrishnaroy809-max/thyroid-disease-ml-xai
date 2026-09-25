import React, { useEffect, useState } from "react";
import "./index.css";

const API_URL = "https://thyroid-disease-ml-xai.onrender.com";

const pages = [
  ["home", "Home"],
  ["prediction", "Prediction"],
  ["xai", "Explainable AI"],
  ["performance", "Performance"],
  ["about", "About"],
];

function App() {
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  const [backendOnline, setBackendOnline] = useState(false);
  const [status, setStatus] = useState(null);

  const [dataset, setDataset] = useState(null);
  const [features, setFeatures] = useState([]);
  const [models, setModels] = useState([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({});
  const [prediction, setPrediction] = useState(null);

  // --------------------------------------------------
  // BACKEND STATUS
  // --------------------------------------------------

  const loadStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/status`);

      if (!response.ok) {
        throw new Error("Backend unavailable");
      }

      const data = await response.json();

      setBackendOnline(true);
      setStatus(data);
      setDataset(data.dataset || null);
      setFeatures(data.features || []);
      setModels(data.models || []);

      if (data.features) {
        const values = {};

        data.features.forEach((feature) => {
          values[feature.name] = "";
        });

        setForm((old) => ({
          ...values,
          ...old,
        }));
      }
    } catch (err) {
      setBackendOnline(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // --------------------------------------------------
  // NAVIGATION
  // --------------------------------------------------

  const navigate = (nextPage) => {
    setPage(nextPage);
    setMenuOpen(false);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // --------------------------------------------------
  // INPUT
  // --------------------------------------------------

  const handleInput = (name, value) => {
    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  };

  // --------------------------------------------------
  // UPLOAD DATASET
  // --------------------------------------------------

  const uploadDataset = async (file) => {
    if (!file) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setDataset(data.dataset || null);
      setFeatures(data.features || []);

      const values = {};

      (data.features || []).forEach((feature) => {
        values[feature.name] = "";
      });

      setForm(values);

      setMessage("Dataset uploaded successfully.");

      await loadStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // PREPROCESS
  // --------------------------------------------------

  const preprocessDataset = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/preprocess`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Preprocessing failed");
      }

      setMessage(
        `Preprocessing completed. Final rows: ${data.final_rows}`
      );

      await loadStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // TRAIN
  // --------------------------------------------------

  const trainModels = async () => {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/train`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Training failed");
      }

      setModels(data.models || []);

      setMessage("Machine-learning models trained successfully.");

      await loadStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // PREDICT
  // --------------------------------------------------

  const predictDisease = async () => {
    setLoading(true);
    setError("");
    setMessage("");
    setPrediction(null);

    try {
      const cleanData = {};

      features.forEach((feature) => {
        let value = form[feature.name];

        if (value === undefined || value === "") {
          value = null;
        }

        cleanData[feature.name] = value;
      });

      const response = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Prediction failed");
      }

      setPrediction(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // HOME
  // --------------------------------------------------

  const Home = () => (
    <main className="page">
      <section className="hero">
        <div className="hero-content">
          <div className="badge">
            <span className="pulse-dot"></span>
            AI-Powered Thyroid Analysis
          </div>

          <h1>
            Smarter
            <span> Thyroid </span>
            Disease Diagnosis
          </h1>

          <p>
            A machine-learning based platform for thyroid disease
            prediction with explainable artificial intelligence.
          </p>

          <div className="hero-buttons">
            <button
              className="primary-btn"
              onClick={() => navigate("prediction")}
            >
              Start Prediction →
            </button>

            <button
              className="secondary-btn"
              onClick={() => navigate("xai")}
            >
              Explore XAI
            </button>
          </div>

          <div className="hero-stats">
            <div>
              <strong>ML</strong>
              <span>Models</span>
            </div>

            <div>
              <strong>XAI</strong>
              <span>Explainable</span>
            </div>

            <div>
              <strong>AI</strong>
              <span>Analysis</span>
            </div>
          </div>
        </div>

        <div className="ai-visual">
          <div className="ai-orbit orbit-one"></div>
          <div className="ai-orbit orbit-two"></div>

          <div className="ai-core">
            <span>AI</span>
          </div>

          <div className="floating-card card-one">
            <small>Prediction</small>
            <strong>Ready</strong>
          </div>

          <div className="floating-card card-two">
            <small>XAI</small>
            <strong>Enabled</strong>
          </div>

          <div className="scan-line"></div>
        </div>
      </section>

      <section className="info-section">
        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>From data to intelligent prediction</h2>
        </div>

        <div className="feature-grid">
          <InfoCard
            number="01"
            title="Input"
            text="Provide the required thyroid-related clinical features."
          />

          <InfoCard
            number="02"
            title="Machine Learning"
            text="Multiple classification algorithms can be trained and compared."
          />

          <InfoCard
            number="03"
            title="Prediction"
            text="The best-performing trained model generates the prediction."
          />

          <InfoCard
            number="04"
            title="Explainability"
            text="Understand how artificial intelligence reaches its result."
          />
        </div>
      </section>
    </main>
  );

  // --------------------------------------------------
  // PREDICTION
  // --------------------------------------------------

  const Prediction = () => (
    <main className="page">
      <section className="page-header">
        <div className="badge">PREDICTION</div>

        <h1>
          Thyroid Disease
          <span> Prediction</span>
        </h1>

        <p>
          Enter the features used by your trained dataset and run the
          machine-learning model.
        </p>

        <div className={`backend-status ${backendOnline ? "online" : "offline"}`}>
          <span></span>
          {backendOnline ? "Backend Online" : "Backend Offline"}
        </div>
      </section>

      {!dataset && (
        <section className="setup-card">
          <h2>Dataset & Model Setup</h2>

          <p>
            Your backend needs a dataset and trained models before
            prediction can be performed.
          </p>

          <label className="upload-box">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => uploadDataset(e.target.files[0])}
            />

            <span>📁</span>
            <strong>Upload CSV Dataset</strong>
            <small>Choose your thyroid dataset</small>
          </label>

          <div className="setup-actions">
            <button
              className="secondary-btn"
              onClick={preprocessDataset}
              disabled={loading}
            >
              Preprocess Dataset
            </button>

            <button
              className="primary-btn"
              onClick={trainModels}
              disabled={loading}
            >
              Train Models
            </button>
          </div>
        </section>
      )}

      {dataset && (
        <section className="dataset-card">
          <div>
            <small>ACTIVE DATASET</small>
            <h3>{dataset.name}</h3>
          </div>

          <div className="dataset-stats">
            <div>
              <strong>{dataset.rows}</strong>
              <span>Rows</span>
            </div>

            <div>
              <strong>{dataset.columns}</strong>
              <span>Columns</span>
            </div>

            <div>
              <strong>{dataset.features}</strong>
              <span>Features</span>
            </div>
          </div>
        </section>
      )}

      {features.length > 0 && (
        <section className="prediction-layout">
          <div className="prediction-form glass-card">
            <div className="card-heading">
              <span>01</span>

              <div>
                <h2>Clinical Features</h2>
                <p>Enter patient feature values.</p>
              </div>
            </div>

            <div className="dynamic-form">
              {features.map((feature) => (
                <div className="input-group" key={feature.name}>
                  <label>{feature.name}</label>

                  <input
                    type={feature.type === "numeric" ? "number" : "text"}
                    step="any"
                    value={form[feature.name] ?? ""}
                    onChange={(e) =>
                      handleInput(feature.name, e.target.value)
                    }
                    placeholder={`Enter ${feature.name}`}
                  />

                  {feature.missing > 0 && (
                    <small>
                      Dataset missing values: {feature.missing}
                    </small>
                  )}
                </div>
              ))}
            </div>

            <button
              className="predict-btn"
              onClick={predictDisease}
              disabled={loading || !backendOnline}
            >
              {loading ? "Analyzing..." : "Run AI Prediction →"}
            </button>
          </div>

          <div className="result-area">
            {!prediction && (
              <div className="empty-result glass-card">
                <div className="result-icon">✦</div>

                <h2>Awaiting Prediction</h2>

                <p>
                  Submit the clinical features to receive the
                  machine-learning prediction.
                </p>
              </div>
            )}

            {prediction && (
              <div className="prediction-result glass-card">
                <div className="result-icon success">✓</div>

                <span className="result-label">MODEL PREDICTION</span>

                <h2>
                  Class {prediction.prediction}
                </h2>

                <p>
                  {prediction.prediction === 1
                    ? "Positive class predicted"
                    : "Negative class predicted"}
                </p>

                {prediction.probability !== null &&
                  prediction.probability !== undefined && (
                    <div className="probability">
                      <div className="probability-top">
                        <span>Probability</span>
                        <strong>
                          {(prediction.probability * 100).toFixed(1)}%
                        </strong>
                      </div>

                      <div className="progress">
                        <div
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                100,
                                prediction.probability * 100
                              )
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                <div className="result-details">
                  <div>
                    <span>Selected Model</span>
                    <strong>{prediction.model}</strong>
                  </div>

                  <div>
                    <span>Test Accuracy</span>
                    <strong>
                      {prediction.accuracy !== undefined
                        ? `${(prediction.accuracy * 100).toFixed(2)}%`
                        : "—"}
                    </strong>
                  </div>
                </div>

                <div className="explanation">
                  <span>AI Explanation</span>
                  <p>{prediction.explanation}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {message && <div className="success-message">{message}</div>}

      {error && <div className="error-message">{error}</div>}
    </main>
  );

  // --------------------------------------------------
  // XAI
  // --------------------------------------------------

  const XAI = () => (
    <main className="page">
      <section className="page-header">
        <div className="badge">EXPLAINABLE AI</div>

        <h1>
          Don't just get a prediction.
          <span> Understand it.</span>
        </h1>

        <p>
          Explainable AI helps make machine-learning predictions easier
          to interpret.
        </p>
      </section>

      <section className="xai-grid">
        <div className="xai-card large">
          <div className="xai-number">01</div>

          <h2>Feature Importance</h2>

          <p>
            Identify which input features contribute most strongly to
            a model's decision.
          </p>

          <div className="fake-chart">
            <ChartBar label="TSH" value={88} />
            <ChartBar label="TT4" value={74} />
            <ChartBar label="T3" value={62} />
            <ChartBar label="FTI" value={51} />
            <ChartBar label="T4U" value={43} />
          </div>
        </div>

        <div className="xai-card">
          <div className="xai-number">02</div>

          <h2>Counterfactual AI</h2>

          <p>
            Counterfactual explanations show how changing input
            conditions could change a model's prediction.
          </p>

          <div className="counter-box">
            <span>Example</span>
            <p>
              "If feature X changed from A to B, the prediction could
              change."
            </p>
          </div>
        </div>

        <div className="xai-card">
          <div className="xai-number">03</div>

          <h2>Transparency</h2>

          <p>
            The goal is to make machine-learning systems easier to
            understand rather than treating the prediction as a black
            box.
          </p>
        </div>
      </section>
    </main>
  );

  // --------------------------------------------------
  // PERFORMANCE
  // --------------------------------------------------

  const Performance = () => (
    <main className="page">
      <section className="page-header">
        <div className="badge">MODEL PERFORMANCE</div>

        <h1>
          Compare your
          <span> trained models</span>
        </h1>

        <p>
          These results come directly from your Flask backend after
          training.
        </p>
      </section>

      {models.length === 0 ? (
        <div className="empty-performance glass-card">
          <div className="result-icon">◎</div>

          <h2>No trained models yet</h2>

          <p>
            Upload your dataset and train the models to display real
            accuracy results.
          </p>

          <button
            className="primary-btn"
            onClick={() => navigate("prediction")}
          >
            Go to Prediction →
          </button>
        </div>
      ) : (
        <section className="performance-grid">
          {models.map((model) => (
            <div className="metric-card glass-card" key={model.name}>
              <span>{model.name}</span>

              <strong>
                {(model.accuracy * 100).toFixed(2)}%
              </strong>

              <div className="metric-progress">
                <div
                  style={{
                    width: `${model.accuracy * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );

  // --------------------------------------------------
  // ABOUT
  // --------------------------------------------------

  const About = () => (
    <main className="page">
      <section className="page-header">
        <div className="badge">ABOUT THE PROJECT</div>

        <h1>
          Thyro<span>AI</span>
        </h1>

        <p>
          Enhancing Thyroid Disease Diagnosis With Machine Learning
          and Counterfactual Explainable AI.
        </p>
      </section>

      <section className="about-grid">
        <div className="about-card glass-card">
          <h2>Machine Learning</h2>
          <p>
            The backend supports Logistic Regression, Random Forest,
            Decision Tree and K-Nearest Neighbors classification.
          </p>
        </div>

        <div className="about-card glass-card">
          <h2>Explainable AI</h2>
          <p>
            The project focuses on making machine-learning results
            easier to interpret.
          </p>
        </div>

        <div className="about-card glass-card">
          <h2>Counterfactuals</h2>
          <p>
            Counterfactual reasoning provides an intuitive way to
            understand how changing input features can affect model
            outcomes.
          </p>
        </div>

        <div className="about-card glass-card">
          <h2>Technology</h2>
          <p>
            React, CSS, Flask, Python, NumPy, Pandas and Scikit-learn
            are used throughout the system.
          </p>
        </div>
      </section>

      <div className="disclaimer">
        <strong>Research & Educational Project</strong>
        <p>
          This application is intended for academic and research
          demonstration. It is not a substitute for professional
          medical diagnosis.
        </p>
      </div>
    </main>
  );

  // --------------------------------------------------
  // RENDER PAGE
  // --------------------------------------------------

  const renderPage = () => {
    switch (page) {
      case "prediction":
        return <Prediction />;

      case "xai":
        return <XAI />;

      case "performance":
        return <Performance />;

      case "about":
        return <About />;

      default:
        return <Home />;
    }
  };

  return (
    <div className="app">
      <div className="background-grid"></div>
      <div className="background-orb orb-a"></div>
      <div className="background-orb orb-b"></div>

      <header className="navbar">
        <button className="brand" onClick={() => navigate("home")}>
          <span className="brand-icon">✦</span>
          <span>
            Thyro<span>AI</span>
          </span>
        </button>

        <nav className={menuOpen ? "nav-links open" : "nav-links"}>
          {pages.map(([id, name]) => (
            <button
              key={id}
              className={page === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              {name}
            </button>
          ))}
        </nav>

        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </header>

      {renderPage()}

      <footer className="footer">
        <div>
          <strong>ThyroAI</strong>
          <span> • ML + Explainable AI</span>
        </div>

        <div className="footer-status">
          <span
            className={backendOnline ? "status-dot online" : "status-dot"}
          ></span>

          {backendOnline ? "Backend Connected" : "Backend Offline"}
        </div>
      </footer>
    </div>
  );
}

// --------------------------------------------------
// COMPONENTS
// --------------------------------------------------

function InfoCard({ number, title, text }) {
  return (
    <div className="info-card glass-card">
      <span>{number}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ChartBar({ label, value }) {
  return (
    <div className="chart-row">
      <span>{label}</span>

      <div className="chart-track">
        <div
          className="chart-fill"
          style={{ width: `${value}%` }}
        ></div>
      </div>

      <strong>{value}%</strong>
    </div>
  );
}

export default App;
