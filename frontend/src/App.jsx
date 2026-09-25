import React, { useEffect, useState } from "react";
import "./index.css";

const API_URL = "http://localhost:5000";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");

  const [dataset, setDataset] = useState(null);
  const [preprocess, setPreprocess] = useState(null);
  const [models, setModels] = useState([]);
  const [features, setFeatures] = useState([]);

  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [login, setLogin] = useState({
    username: "",
    password: "",
  });

  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const res = await fetch(`${API_URL}/api/status`);
      const data = await res.json();

      setDataset(data.dataset);
      setModels(data.models || []);
      setFeatures(data.features || []);

      if (data.features) {
        const initial = {};
        data.features.forEach((f) => {
          initial[f.name] = "";
        });
        setFormData(initial);
      }
    } catch (error) {
      console.log("Backend not connected");
    }
  }

  function handleLogin(e) {
    e.preventDefault();

    if (
      login.username === "admin" &&
      login.password === "admin123"
    ) {
      setLoggedIn(true);
      setMessage("");
    } else {
      setMessage("Invalid username or password");
    }
  }

  async function uploadDataset(e) {
    const file = e.target.files[0];

    if (!file) return;

    const form = new FormData();
    form.append("file", file);

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setDataset(data.dataset);
      setFeatures(data.features || []);

      const initial = {};
      (data.features || []).forEach((f) => {
        initial[f.name] = "";
      });

      setFormData(initial);
      setMessage("Dataset uploaded successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function preprocessDataset() {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/preprocess`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setPreprocess(data);
      setMessage("Dataset preprocessing completed");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function trainModels() {
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/train`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setModels(data.models || []);
      setMessage("Machine learning models trained successfully");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function predictDisease(e) {
    e.preventDefault();

    setLoading(true);
    setPrediction(null);

    try {
      const res = await fetch(`${API_URL}/api/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error);
      }

      setPrediction(data);
      setMessage("Prediction completed");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function updateForm(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function logout() {
    setLoggedIn(false);
    setActivePage("dashboard");
  }

  if (!loggedIn) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="logo-circle">🧬</div>

          <h1>ThyroAI</h1>

          <p className="login-subtitle">
            Thyroid Disease Detection & Explainable AI
          </p>

          <form onSubmit={handleLogin}>
            <label>Username</label>

            <input
              type="text"
              placeholder="Enter username"
              value={login.username}
              onChange={(e) =>
                setLogin({
                  ...login,
                  username: e.target.value,
                })
              }
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter password"
              value={login.password}
              onChange={(e) =>
                setLogin({
                  ...login,
                  password: e.target.value,
                })
              }
            />

            {message && (
              <div className="error-message">{message}</div>
            )}

            <button className="primary-button" type="submit">
              Login
            </button>
          </form>

          <div className="login-hint">
            Demo login: <b>admin</b> / <b>admin123</b>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🧬</div>
          <div>
            <strong>ThyroAI</strong>
            <span>ML + XAI</span>
          </div>
        </div>

        <nav>
          <button
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => setActivePage("dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={activePage === "dataset" ? "active" : ""}
            onClick={() => setActivePage("dataset")}
          >
            <span>▣</span>
            Dataset
          </button>

          <button
            className={activePage === "models" ? "active" : ""}
            onClick={() => setActivePage("models")}
          >
            <span>⚙</span>
            ML Models
          </button>

          <button
            className={activePage === "prediction" ? "active" : ""}
            onClick={() => setActivePage("prediction")}
          >
            <span>✦</span>
            Prediction
          </button>

          <button
            className={activePage === "results" ? "active" : ""}
            onClick={() => setActivePage("results")}
          >
            <span>▥</span>
            Results
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-box">
            <div className="avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>Admin account</span>
            </div>
          </div>

          <button className="logout" onClick={logout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>
              {activePage === "dashboard" && "Dashboard"}
              {activePage === "dataset" && "Dataset Management"}
              {activePage === "models" && "Machine Learning Models"}
              {activePage === "prediction" && "Thyroid Prediction"}
              {activePage === "results" && "Model Results"}
            </h2>

            <p>
              Thyroid disease detection using machine learning
            </p>
          </div>

          <div className="status">
            <span className="status-dot"></span>
            System Online
          </div>
        </header>

        {message && (
          <div className="notification">
            <span>✓</span>
            {message}
            <button onClick={() => setMessage("")}>×</button>
          </div>
        )}

        {activePage === "dashboard" && (
          <Dashboard
            dataset={dataset}
            models={models}
            preprocess={preprocess}
            setActivePage={setActivePage}
          />
        )}

        {activePage === "dataset" && (
          <DatasetPage
            dataset={dataset}
            preprocess={preprocess}
            loading={loading}
            uploadDataset={uploadDataset}
            preprocessDataset={preprocessDataset}
          />
        )}

        {activePage === "models" && (
          <ModelsPage
            models={models}
            loading={loading}
            trainModels={trainModels}
          />
        )}

        {activePage === "prediction" && (
          <PredictionPage
            features={features}
            formData={formData}
            updateForm={updateForm}
            predictDisease={predictDisease}
            prediction={prediction}
            loading={loading}
          />
        )}

        {activePage === "results" && (
          <ResultsPage models={models} />
        )}
      </main>
    </div>
  );
}

function Dashboard({
  dataset,
  models,
  preprocess,
  setActivePage,
}) {
  return (
    <div className="page-content">
      <section className="hero">
        <div>
          <span className="eyebrow">FINAL YEAR PROJECT</span>

          <h1>
            Intelligent Thyroid
            <br />
            Disease Detection
          </h1>

          <p>
            A machine learning platform for thyroid disease
            prediction with explainable AI.
          </p>

          <button
            className="primary-button"
            onClick={() => setActivePage("prediction")}
          >
            Start Prediction →
          </button>
        </div>

        <div className="hero-visual">
          <div className="orb">
            <span>🧬</span>
          </div>
        </div>
      </section>

      <div className="stats-grid">
        <StatCard
          icon="📁"
          title="Dataset"
          value={
            dataset
              ? `${dataset.rows.toLocaleString()}`
              : "—"
          }
          subtitle={
            dataset ? "Records loaded" : "No dataset"
          }
        />

        <StatCard
          icon="⚙"
          title="Features"
          value={dataset?.features || "—"}
          subtitle="Input variables"
        />

        <StatCard
          icon="🤖"
          title="Models"
          value={models.length || "—"}
          subtitle="Algorithms trained"
        />

        <StatCard
          icon="✓"
          title="Status"
          value="Ready"
          subtitle="System operational"
        />
      </div>

      <div className="section-heading">
        <div>
          <h2>Project Workflow</h2>
          <p>Complete machine learning pipeline</p>
        </div>
      </div>

      <div className="workflow-grid">
        <WorkflowCard
          number="01"
          icon="📤"
          title="Upload Dataset"
          text="Upload your thyroid CSV dataset."
          onClick={() => setActivePage("dataset")}
        />

        <WorkflowCard
          number="02"
          icon="🧹"
          title="Preprocess"
          text="Clean missing values and prepare data."
          onClick={() => setActivePage("dataset")}
        />

        <WorkflowCard
          number="03"
          icon="🤖"
          title="Train Models"
          text="Apply multiple machine learning algorithms."
          onClick={() => setActivePage("models")}
        />

        <WorkflowCard
          number="04"
          icon="🔮"
          title="Predict"
          text="Enter patient values and get prediction."
          onClick={() => setActivePage("prediction")}
        />
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

function WorkflowCard({
  number,
  icon,
  title,
  text,
  onClick,
}) {
  return (
    <button className="workflow-card" onClick={onClick}>
      <span className="workflow-number">{number}</span>
      <div className="workflow-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      <span className="workflow-arrow">→</span>
    </button>
  );
}

function DatasetPage({
  dataset,
  preprocess,
  loading,
  uploadDataset,
  preprocessDataset,
}) {
  return (
    <div className="page-content">
      <div className="page-title">
        <h1>Dataset Management</h1>
        <p>Upload and preprocess your thyroid dataset.</p>
      </div>

      <div className="upload-card">
        <div className="upload-icon">📁</div>

        <h2>Upload CSV Dataset</h2>

        <p>
          Upload the cleaned thyroid dataset in CSV format.
        </p>

        <label className="upload-button">
          {loading ? "Uploading..." : "Choose CSV File"}
          <input
            type="file"
            accept=".csv"
            onChange={uploadDataset}
            hidden
          />
        </label>
      </div>

      {dataset && (
        <div className="data-info">
          <div className="info-card">
            <span>Rows</span>
            <strong>{dataset.rows}</strong>
          </div>

          <div className="info-card">
            <span>Columns</span>
            <strong>{dataset.columns}</strong>
          </div>

          <div className="info-card">
            <span>Features</span>
            <strong>{dataset.features}</strong>
          </div>

          <div className="info-card">
            <span>Target</span>
            <strong>{dataset.target}</strong>
          </div>
        </div>
      )}

      {dataset && (
        <div className="action-card">
          <div>
            <h2>Preprocess Dataset</h2>
            <p>
              Handle missing values and prepare the dataset
              for machine learning.
            </p>
          </div>

          <button
            className="primary-button"
            onClick={preprocessDataset}
            disabled={loading}
          >
            {loading ? "Processing..." : "Preprocess Dataset"}
          </button>
        </div>
      )}

      {preprocess && (
        <div className="preprocess-result">
          <h2>Preprocessing Summary</h2>

          <div className="data-info">
            <div className="info-card">
              <span>Original Rows</span>
              <strong>{preprocess.original_rows}</strong>
            </div>

            <div className="info-card">
              <span>Final Rows</span>
              <strong>{preprocess.final_rows}</strong>
            </div>

            <div className="info-card">
              <span>Missing Values</span>
              <strong>{preprocess.missing_values}</strong>
            </div>

            <div className="info-card">
              <span>Status</span>
              <strong>✓ Ready</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelsPage({
  models,
  loading,
  trainModels,
}) {
  return (
    <div className="page-content">
      <div className="page-title">
        <h1>Machine Learning Models</h1>
        <p>
          Train and compare different classification algorithms.
        </p>
      </div>

      <div className="action-card">
        <div>
          <h2>Train Models</h2>
          <p>
            The system will train multiple algorithms and
            calculate their test accuracy.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={trainModels}
          disabled={loading}
        >
          {loading ? "Training..." : "Train All Models"}
        </button>
      </div>

      {models.length > 0 && (
        <div className="model-grid">
          {models.map((model, index) => (
            <div className="model-card" key={index}>
              <div className="model-top">
                <div className="model-icon">🤖</div>

                <span className="model-badge">
                  Tested
                </span>
              </div>

              <h2>{model.name}</h2>

              <div className="accuracy">
                <strong>
                  {(model.accuracy * 100).toFixed(2)}%
                </strong>

                <span>Test Accuracy</span>
              </div>

              <div className="progress">
                <div
                  style={{
                    width: `${model.accuracy * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {models.length === 0 && (
        <div className="empty-state">
          <div>🤖</div>
          <h2>No models trained yet</h2>
          <p>
            Upload and preprocess your dataset, then train the
            machine learning models.
          </p>
        </div>
      )}
    </div>
  );
}

function PredictionPage({
  features,
  formData,
  updateForm,
  predictDisease,
  prediction,
  loading,
}) {
  return (
    <div className="page-content">
      <div className="page-title">
        <h1>Thyroid Prediction</h1>
        <p>
          Enter patient information to generate a prediction.
        </p>
      </div>

      {features.length === 0 ? (
        <div className="empty-state">
          <div>📊</div>
          <h2>Dataset required</h2>
          <p>
            Upload and train a dataset before making a
            prediction.
          </p>
        </div>
      ) : (
        <form
          className="prediction-layout"
          onSubmit={predictDisease}
        >
          <div className="form-card">
            <div className="card-heading">
              <h2>Patient Information</h2>
              <span>{features.length} features</span>
            </div>

            <div className="form-grid">
              {features.map((feature) => (
                <div className="field" key={feature.name}>
                  <label>{feature.name}</label>

                  {feature.type === "numeric" ? (
                    <input
                      type="number"
                      step="any"
                      value={formData[feature.name] ?? ""}
                      onChange={(e) =>
                        updateForm(
                          feature.name,
                          e.target.value
                        )
                      }
                      placeholder="Enter value"
                      required
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[feature.name] ?? ""}
                      onChange={(e) =>
                        updateForm(
                          feature.name,
                          e.target.value
                        )
                      }
                      placeholder="Enter value"
                      required
                    />
                  )}
                </div>
              ))}
            </div>

            <button
              className="primary-button full"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Analyzing..."
                : "Predict Thyroid Disease"}
            </button>
          </div>

          <div className="result-card">
            {!prediction ? (
              <>
                <div className="result-placeholder">🔬</div>
                <h2>Prediction Result</h2>
                <p>
                  Your prediction result will appear here.
                </p>
              </>
            ) : (
              <>
                <div
                  className={
                    prediction.prediction === 1
                      ? "result-icon danger"
                      : "result-icon success"
                  }
                >
                  {prediction.prediction === 1 ? "!" : "✓"}
                </div>

                <span className="result-label">
                  MODEL PREDICTION
                </span>

                <h2>
                  {prediction.prediction === 1
                    ? "Thyroid Disease Predicted"
                    : "Thyroid Disease Not Predicted"}
                </h2>

                <div className="prediction-class">
                  Class {prediction.prediction}
                </div>

                {prediction.probability !== null && (
                  <div className="probability">
                    <span>Prediction probability</span>
                    <strong>
                      {(
                        prediction.probability * 100
                      ).toFixed(2)}
                      %
                    </strong>
                  </div>
                )}

                {prediction.explanation && (
                  <div className="explanation">
                    <h3>Explainable AI</h3>

                    <p>
                      {prediction.explanation}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function ResultsPage({ models }) {
  return (
    <div className="page-content">
      <div className="page-title">
        <h1>Model Results</h1>
        <p>Compare the performance of trained models.</p>
      </div>

      {models.length === 0 ? (
        <div className="empty-state">
          <div>📈</div>
          <h2>No results available</h2>
          <p>Train your models first.</p>
        </div>
      ) : (
        <div className="results-table-card">
          <table>
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Accuracy</th>
                <th>Performance</th>
              </tr>
            </thead>

            <tbody>
              {models.map((model, index) => (
                <tr key={index}>
                  <td>
                    <strong>{model.name}</strong>
                  </td>

                  <td>
                    {(model.accuracy * 100).toFixed(2)}%
                  </td>

                  <td>
                    <div className="table-progress">
                      <div
                        style={{
                          width: `${
                            model.accuracy * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;
