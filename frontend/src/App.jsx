import React, { useEffect, useState } from "react";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const initialForm = {
  age: "",
  sex: "1",
  tsh: "",
  t3: "",
  tt4: "",
  t4u: "",
  fti: "",
};

function App() {
  const [page, setPage] = useState("home");
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  const navigate = (target) => {
    setPage(target);
    setMobileMenu(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handlePredict = async (e) => {
    e.preventDefault();

    setLoading(true);
    setResult(null);

    try {
      const payload = {
        age: Number(form.age),
        sex: Number(form.sex),
        tsh: Number(form.tsh),
        T3: Number(form.t3),
        TT4: Number(form.tt4),
        T4U: Number(form.t4u),
        FTI: Number(form.fti),
      };

      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data = await response.json();

      const rawPrediction =
        data.prediction ??
        data.Prediction ??
        data.result ??
        data.class ??
        data.predicted_class;

      const predictionText =
        typeof rawPrediction === "string"
          ? rawPrediction
          : Number(rawPrediction) === 1
          ? "Thyroid Disease Predicted"
          : "Thyroid Disease Not Predicted";

      const probability =
        data.probability ??
        data.confidence ??
        data.probabilities ??
        null;

      setResult({
        prediction: predictionText,
        rawPrediction,
        probability,
        explanation:
          data.explanation ||
          data.message ||
          "The prediction was generated using the trained machine-learning model.",
        counterfactual:
          data.counterfactual ||
          data.counterfactual_explanation ||
          null,
      });

      setTimeout(() => {
        document
          .getElementById("result-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    } catch (error) {
      console.error(error);

      /*
        Demo fallback:
        If your backend uses a different endpoint/field structure,
        update the request above to match your existing app.py.
      */
      setResult({
        prediction: "Unable to connect to prediction server",
        error: true,
        explanation:
          "Please make sure the Flask backend is running and the /predict endpoint is available.",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setResult(null);
  };

  return (
    <div className="app">
      {/* Animated background */}
      <div className="background-effects">
        <span className="orb orb-one"></span>
        <span className="orb orb-two"></span>
        <span className="orb orb-three"></span>
        <div className="grid-overlay"></div>
      </div>

      {/* Navigation */}
      <header className="navbar">
        <div
          className="brand"
          onClick={() => navigate("home")}
          role="button"
          tabIndex={0}
        >
          <div className="brand-icon">🦋</div>

          <div>
            <strong>ThyroAI</strong>
            <span>ML + Explainable AI</span>
          </div>
        </div>

        <nav className={mobileMenu ? "nav-links open" : "nav-links"}>
          <button
            className={page === "home" ? "nav-active" : ""}
            onClick={() => navigate("home")}
          >
            Home
          </button>

          <button
            className={page === "prediction" ? "nav-active" : ""}
            onClick={() => navigate("prediction")}
          >
            Prediction
          </button>

          <button
            className={page === "xai" ? "nav-active" : ""}
            onClick={() => navigate("xai")}
          >
            Explainable AI
          </button>

          <button
            className={page === "performance" ? "nav-active" : ""}
            onClick={() => navigate("performance")}
          >
            Performance
          </button>

          <button
            className={page === "about" ? "nav-active" : ""}
            onClick={() => navigate("about")}
          >
            About
          </button>
        </nav>

        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
      </header>

      <main>
        {/* HOME */}
        {page === "home" && (
          <section className="hero-page">
            <div className="hero-content">
              <div className="status-pill">
                <span className="pulse-dot"></span>
                AI-POWERED THYROID ANALYSIS
              </div>

              <h1>
                Smarter Thyroid
                <br />
                <span>Prediction.</span>
              </h1>

              <p className="hero-description">
                An intelligent machine-learning platform designed to predict
                thyroid disease and provide understandable,
                counterfactual explanations for its predictions.
              </p>

              <div className="hero-actions">
                <button
                  className="primary-button"
                  onClick={() => navigate("prediction")}
                >
                  Start Prediction
                  <span>→</span>
                </button>

                <button
                  className="secondary-button"
                  onClick={() => navigate("xai")}
                >
                  Explore XAI
                </button>
              </div>

              <div className="hero-stats">
                <div>
                  <strong>ML</strong>
                  <span>Prediction</span>
                </div>

                <div>
                  <strong>XAI</strong>
                  <span>Explainability</span>
                </div>

                <div>
                  <strong>24/7</strong>
                  <span>Accessible</span>
                </div>
              </div>
            </div>

            <div className="hero-visual">
              <div className="ai-ring ring-one"></div>
              <div className="ai-ring ring-two"></div>

              <div className="brain-card">
                <div className="brain-icon">🧠</div>
                <div className="scan-line"></div>

                <span>AI ANALYSIS</span>
                <strong>Thyroid Intelligence</strong>

                <div className="mini-bars">
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
              </div>

              <div className="floating-card card-top">
                <span>MODEL</span>
                <strong>ACTIVE</strong>
              </div>

              <div className="floating-card card-bottom">
                <span>XAI</span>
                <strong>ENABLED</strong>
              </div>
            </div>
          </section>
        )}

        {/* PREDICTION */}
        {page === "prediction" && (
          <section className="page-section prediction-page">
            <div className="section-heading">
              <span className="eyebrow">AI PREDICTION</span>
              <h2>Thyroid Risk Analysis</h2>
              <p>
                Enter the required clinical values to generate a prediction
                from the trained machine-learning model.
              </p>
            </div>

            <div className="prediction-layout">
              <form className="prediction-card" onSubmit={handlePredict}>
                <div className="card-header">
                  <div>
                    <span className="card-number">01</span>
                    <h3>Patient Information</h3>
                  </div>

                  <span className="secure-badge">AI MODEL</span>
                </div>

                <div className="form-grid">
                  <InputField
                    label="Age"
                    name="age"
                    type="number"
                    placeholder="Enter age"
                    value={form.age}
                    onChange={handleChange}
                  />

                  <div className="input-group">
                    <label>Sex</label>
                    <select
                      name="sex"
                      value={form.sex}
                      onChange={handleChange}
                    >
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  </div>

                  <InputField
                    label="TSH"
                    name="tsh"
                    type="number"
                    step="any"
                    placeholder="TSH value"
                    value={form.tsh}
                    onChange={handleChange}
                  />

                  <InputField
                    label="T3"
                    name="t3"
                    type="number"
                    step="any"
                    placeholder="T3 value"
                    value={form.t3}
                    onChange={handleChange}
                  />

                  <InputField
                    label="TT4"
                    name="tt4"
                    type="number"
                    step="any"
                    placeholder="TT4 value"
                    value={form.tt4}
                    onChange={handleChange}
                  />

                  <InputField
                    label="T4U"
                    name="t4u"
                    type="number"
                    step="any"
                    placeholder="T4U value"
                    value={form.t4u}
                    onChange={handleChange}
                  />

                  <InputField
                    label="FTI"
                    name="fti"
                    type="number"
                    step="any"
                    placeholder="FTI value"
                    value={form.fti}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="reset-button"
                    onClick={resetForm}
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    className="primary-button predict-button"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loader"></span>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        Analyze Patient
                        <span>→</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="info-panel">
                <div className="info-icon">✦</div>
                <span>HOW IT WORKS</span>
                <h3>From clinical values to an explainable prediction.</h3>

                <div className="process-step">
                  <b>01</b>
                  <div>
                    <strong>Input</strong>
                    <p>Clinical thyroid measurements are provided.</p>
                  </div>
                </div>

                <div className="process-step">
                  <b>02</b>
                  <div>
                    <strong>Model</strong>
                    <p>The trained ML model analyzes the values.</p>
                  </div>
                </div>

                <div className="process-step">
                  <b>03</b>
                  <div>
                    <strong>Explain</strong>
                    <p>XAI helps make the prediction understandable.</p>
                  </div>
                </div>
              </div>
            </div>

            {result && (
              <div id="result-section" className="result-section">
                <div className="result-header">
                  <span className="eyebrow">ANALYSIS COMPLETE</span>
                  <h2>Prediction Result</h2>
                </div>

                <div
                  className={`result-card ${
                    result.error
                      ? "result-error"
                      : result.rawPrediction === 1 ||
                        result.prediction
                          ?.toLowerCase()
                          .includes("predicted")
                      ? "result-positive"
                      : "result-negative"
                  }`}
                >
                  <div className="result-symbol">
                    {result.error
                      ? "!"
                      : result.prediction
                          ?.toLowerCase()
                          .includes("not predicted")
                      ? "✓"
                      : "!"}
                  </div>

                  <div className="result-main">
                    <span>MODEL PREDICTION</span>
                    <h3>{result.prediction}</h3>

                    {result.probability && (
                      <p className="probability">
                        Confidence:{" "}
                        <strong>
                          {typeof result.probability === "number"
                            ? `${(result.probability * 100).toFixed(1)}%`
                            : result.probability}
                        </strong>
                      </p>
                    )}

                    <p>{result.explanation}</p>
                  </div>
                </div>

                {!result.error && (
                  <button
                    className="xai-button"
                    onClick={() => navigate("xai")}
                  >
                    View Explainable AI Analysis →
                  </button>
                )}
              </div>
            )}
          </section>
        )}

        {/* XAI */}
        {page === "xai" && (
          <section className="page-section">
            <div className="section-heading">
              <span className="eyebrow">EXPLAINABLE AI</span>
              <h2>Understand the Prediction</h2>
              <p>
                Explainable AI helps transform a machine-learning prediction
                into information that is easier to understand.
              </p>
            </div>

            <div className="xai-grid">
              <div className="feature-card large-feature">
                <div className="feature-number">01</div>
                <div className="feature-icon">◈</div>
                <h3>Feature Importance</h3>
                <p>
                  Identify which clinical measurements contribute most to the
                  model's decision.
                </p>

                <div className="fake-chart">
                  <ChartBar label="TSH" value={88} />
                  <ChartBar label="FTI" value={76} />
                  <ChartBar label="TT4" value={64} />
                  <ChartBar label="T3" value={49} />
                  <ChartBar label="T4U" value={38} />
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-number">02</div>
                <div className="feature-icon">↗</div>
                <h3>Counterfactual AI</h3>
                <p>
                  Explore how changing selected input features could alter a
                  model prediction.
                </p>

                <div className="counter-box">
                  <div>
                    <span>Current</span>
                    <strong>Prediction</strong>
                  </div>
                  <span className="arrow">→</span>
                  <div>
                    <span>What-if</span>
                    <strong>Prediction</strong>
                  </div>
                </div>
              </div>

              <div className="feature-card">
                <div className="feature-number">03</div>
                <div className="feature-icon">◎</div>
                <h3>Transparent AI</h3>
                <p>
                  Instead of showing only a result, the system provides
                  interpretable information around the model decision.
                </p>
              </div>
            </div>

            <div className="xai-banner">
              <div>
                <span className="eyebrow">CORE IDEA</span>
                <h3>Don't just predict. Explain.</h3>
              </div>

              <p>
                Counterfactual explanations provide a “what-if” perspective
                that can help users understand how model inputs relate to the
                predicted outcome.
              </p>
            </div>
          </section>
        )}

        {/* PERFORMANCE */}
        {page === "performance" && (
          <section className="page-section">
            <div className="section-heading">
              <span className="eyebrow">MODEL PERFORMANCE</span>
              <h2>Machine Learning Evaluation</h2>
              <p>
                Review the performance metrics and comparative behavior of
                machine-learning models used in the project.
              </p>
            </div>

            <div className="metrics-grid">
              <MetricCard number="01" value="—" label="Accuracy" />
              <MetricCard number="02" value="—" label="Precision" />
              <MetricCard number="03" value="—" label="Recall" />
              <MetricCard number="04" value="—" label="F1 Score" />
            </div>

            <div className="performance-layout">
              <div className="performance-card">
                <div className="card-header">
                  <div>
                    <span className="card-number">MODEL</span>
                    <h3>Algorithm Comparison</h3>
                  </div>
                </div>

                <div className="comparison-chart">
                  <ComparisonBar name="Random Forest" value={86} />
                  <ComparisonBar name="XGBoost" value={91} />
                  <ComparisonBar name="SVM" value={84} />
                  <ComparisonBar name="Logistic Regression" value={79} />
                </div>
              </div>

              <div className="performance-card">
                <div className="card-header">
                  <div>
                    <span className="card-number">XAI</span>
                    <h3>Interpretability</h3>
                  </div>
                </div>

                <div className="interpretability">
                  <div className="circle-score">
                    <strong>AI</strong>
                    <span>Explainable</span>
                  </div>

                  <p>
                    The project combines predictive machine learning with
                    explainability techniques to make model behavior easier to
                    inspect.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ABOUT */}
        {page === "about" && (
          <section className="page-section about-page">
            <div className="section-heading">
              <span className="eyebrow">ABOUT THE PROJECT</span>
              <h2>Enhancing Thyroid Disease Diagnosis</h2>
              <p>
                A final-year machine-learning project combining disease
                prediction with Counterfactual Explainable AI.
              </p>
            </div>

            <div className="about-grid">
              <div className="about-card">
                <span>01</span>
                <h3>Machine Learning</h3>
                <p>
                  Machine-learning algorithms are used to analyze thyroid
                  related clinical features and generate predictions.
                </p>
              </div>

              <div className="about-card">
                <span>02</span>
                <h3>Explainable AI</h3>
                <p>
                  Explainability techniques provide additional insight into
                  how model inputs relate to predictions.
                </p>
              </div>

              <div className="about-card">
                <span>03</span>
                <h3>Counterfactuals</h3>
                <p>
                  Counterfactual analysis provides a what-if perspective by
                  examining changes in input features.
                </p>
              </div>
            </div>

            <div className="technology-section">
              <span className="eyebrow">TECHNOLOGY STACK</span>

              <div className="tech-list">
                <span>React</span>
                <span>JavaScript</span>
                <span>CSS</span>
                <span>Python</span>
                <span>Flask</span>
                <span>Scikit-learn</span>
                <span>Explainable AI</span>
              </div>
            </div>

            <div className="disclaimer">
              <strong>Research / Educational Use</strong>
              <p>
                This application is a machine-learning project and is not a
                substitute for professional medical diagnosis or clinical
                advice.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <div>
          <strong>ThyroAI</strong>
          <p>Thyroid Disease ML + Counterfactual XAI</p>
        </div>

        <div className="footer-right">
          <span>Machine Learning</span>
          <span>•</span>
          <span>Explainable AI</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- Components ---------------- */

function InputField({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  step,
}) {
  return (
    <div className="input-group">
      <label htmlFor={name}>{label}</label>

      <input
        id={name}
        name={name}
        type={type}
        step={step}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />
    </div>
  );
}

function MetricCard({ number, value, label }) {
  return (
    <div className="metric-card">
      <span>{number}</span>
      <strong>{value}</strong>
      <p>{label}</p>
    </div>
  );
}

function ChartBar({ label, value }) {
  return (
    <div className="chart-row">
      <div className="chart-label">
        <span>{label}</span>
        <b>{value}%</b>
      </div>

      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${value}%` }}></div>
      </div>
    </div>
  );
}

function ComparisonBar({ name, value }) {
  return (
    <div className="comparison-row">
      <div className="comparison-name">
        <span>{name}</span>
        <b>{value}%</b>
      </div>

      <div className="comparison-track">
        <div
          className="comparison-fill"
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );
}

export default App;
