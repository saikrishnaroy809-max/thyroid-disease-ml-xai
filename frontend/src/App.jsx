import { useState } from "react";
import axios from "axios";

const API = "https://thyroid-disease-ml-xai.onrender.com";

const initialData = {
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

function App() {
  const [data, setData] = useState(initialData);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setData({
      ...data,
      [name]: Number(value),
    });
  };

  const predict = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const prediction = await axios.post(`${API}/predict`, data);
      const explanation = await axios.post(`${API}/explain`, data);
      const counterfactual = await axios.post(
        `${API}/counterfactual`,
        data
      );

      setResult({
        prediction: prediction.data,
        explanation: explanation.data,
        counterfactual: counterfactual.data,
      });
    } catch (err) {
      console.error(err);
      setError("Unable to connect to the prediction API.");
    }

    setLoading(false);
  };

  const binaryFields = [
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
    "T3 measured",
    "TT4 measured",
    "T4U measured",
    "FTI measured",
  ];

  const numericFields = [
    "age",
    "TSH",
    "TT4",
    "T4U",
    "FTI",
  ];

  return (
    <div className="app">
      <header className="hero">
        <div>
          <div className="badge">AI • ML • XAI</div>

          <h1>Thyroid Disease Prediction</h1>

          <p>
            Machine learning prediction with SHAP explanations
            and counterfactual AI.
          </p>
        </div>
      </header>

      <main>
        <section className="card">
          <h2>Patient Information</h2>

          <div className="grid">
            {numericFields.map((field) => (
              <label key={field}>
                <span>{field}</span>

                <input
                  type="number"
                  step="any"
                  name={field}
                  value={data[field]}
                  onChange={handleChange}
                />
              </label>
            ))}

            {binaryFields.map((field) => (
              <label key={field}>
                <span>{field}</span>

                <select
                  name={field}
                  value={data[field]}
                  onChange={handleChange}
                >
                  <option value={0}>No / 0</option>
                  <option value={1}>Yes / 1</option>
                </select>
              </label>
            ))}
          </div>

          <button
            className="predict-btn"
            onClick={predict}
            disabled={loading}
          >
            {loading
              ? "Analyzing..."
              : "Predict Thyroid Status"}
          </button>

          {error && (
            <div className="error">
              {error}
            </div>
          )}
        </section>

        {result && (
          <>
            <section className="result-card">
              <h2>Prediction Result</h2>

              <div className="prediction">
                {result.prediction.prediction === 1
                  ? "Class 1"
                  : "Class 0"}
              </div>

              <div className="probabilities">
                <div>
                  <strong>
                    {(
                      result.prediction
                        .probability_class_0 * 100
                    ).toFixed(2)}
                    %
                  </strong>

                  <span>
                    Class 0 probability
                  </span>
                </div>

                <div>
                  <strong>
                    {(
                      result.prediction
                        .probability_class_1 * 100
                    ).toFixed(2)}
                    %
                  </strong>

                  <span>
                    Class 1 probability
                  </span>
                </div>
              </div>
            </section>

            <section className="card">
              <h2>SHAP Explanation</h2>

              <p className="muted">
                Features with the strongest contribution
                to this prediction.
              </p>

              <div className="explanation-list">
                {result.explanation.explanation.map(
                  (item) => (
                    <div
                      className="explanation-row"
                      key={item.feature}
                    >
                      <span>
                        {item.feature}
                      </span>

                      <strong
                        className={item.impact}
                      >
                        {item.shap_value > 0
                          ? "+"
                          : ""}
                        {item.shap_value.toFixed(4)}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </section>

            <section className="card">
              <h2>Counterfactual Examples</h2>

              <p className="muted">
                Model-generated scenarios that produce
                the opposite class.
              </p>

              <div className="cf-list">
                {result.counterfactual.counterfactuals.map(
                  (cf, index) => (
                    <div
                      className="cf-card"
                      key={index}
                    >
                      <h3>
                        Scenario {index + 1}
                      </h3>

                      <p>
                        Age:{" "}
                        <strong>
                          {cf.age}
                        </strong>
                      </p>

                      <p>
                        TSH:{" "}
                        <strong>
                          {cf.TSH}
                        </strong>
                      </p>

                      <p>
                        TT4:{" "}
                        <strong>
                          {cf.TT4}
                        </strong>
                      </p>

                      <p>
                        T4U:{" "}
                        <strong>
                          {cf.T4U}
                        </strong>
                      </p>

                      <p>
                        FTI:{" "}
                        <strong>
                          {cf.FTI}
                        </strong>
                      </p>

                      <p>
                        Target class:{" "}
                        <strong>
                          {cf.binaryClass}
                        </strong>
                      </p>
                    </div>
                  )
                )}
              </div>
            </section>
          </>
        )}

        <footer>
          <p>
            Academic decision-support project.
            Model outputs are not a medical diagnosis.
            Clinical interpretation is required.
          </p>
        </footer>
      </main>
    </div>
  );
}

export default App;
