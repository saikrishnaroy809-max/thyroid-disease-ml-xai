
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
import pandas as pd
import shap
import dice_ml

app = FastAPI(

    title="Thyroid Disease Prediction API",
    description="ML-based thyroid prediction with SHAP and DiCE",
    version="1.0.0"
)

# Allow React frontend to communicate with this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Load model
# --------------------------------------------------

model = joblib.load("thyroid_xgboost_model.pkl")

# SHAP
explainer = shap.TreeExplainer(model)

# --------------------------------------------------
# Features
# --------------------------------------------------

FEATURES = [
    'age', 'sex', 'on thyroxine', 'query on thyroxine',
    'on antithyroid medication', 'sick', 'pregnant',
    'thyroid surgery', 'I131 treatment', 'query hypothyroid',
    'query hyperthyroid', 'lithium', 'goitre', 'tumor',
    'hypopituitary', 'psych', 'TSH measured', 'TSH',
    'T3 measured', 'TT4 measured', 'TT4', 'T4U measured',
    'T4U', 'FTI measured', 'FTI'
]

CONTINUOUS_FEATURES = [
    'age', 'TSH', 'TT4', 'T4U', 'FTI'
]

CATEGORICAL_FEATURES = [
    col for col in FEATURES
    if col not in CONTINUOUS_FEATURES
]

# --------------------------------------------------
# DiCE training data
# --------------------------------------------------

dice_data_df = pd.read_csv("dice_training_data.csv")

dice_data = dice_ml.Data(
    dataframe=dice_data_df,
    continuous_features=CONTINUOUS_FEATURES,
    categorical_features=CATEGORICAL_FEATURES,
    outcome_name="binaryClass"
)


# --------------------------------------------------
# Numeric model wrapper
# --------------------------------------------------

class NumericModelWrapper:

    def __init__(self, model, feature_names):
        self.model = model
        self.feature_names = feature_names

    def predict_proba(self, X):

        X = pd.DataFrame(
            X,
            columns=self.feature_names
        )

        X = X.apply(
            pd.to_numeric,
            errors="coerce"
        ).astype(float)

        return self.model.predict_proba(X)

    def predict(self, X):

        X = pd.DataFrame(
            X,
            columns=self.feature_names
        )

        X = X.apply(
            pd.to_numeric,
            errors="coerce"
        ).astype(float)

        return self.model.predict(X)


wrapped_model = NumericModelWrapper(
    model,
    FEATURES
)

dice_model = dice_ml.Model(
    model=wrapped_model,
    backend="sklearn",
    model_type="classifier"
)

dice_exp = dice_ml.Dice(
    dice_data,
    dice_model,
    method="genetic"
)

# --------------------------------------------------
# Permitted ranges
# --------------------------------------------------

permitted_range = {}

for col in CATEGORICAL_FEATURES:

    categories = sorted(
        dice_data_df[col]
        .astype(str)
        .unique()
        .tolist()
    )

    permitted_range[col] = categories


for col in CONTINUOUS_FEATURES:

    permitted_range[col] = [
        float(dice_data_df[col].min()),
        float(dice_data_df[col].max())
    ]


# --------------------------------------------------
# Root
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "message": "Thyroid Disease Prediction API is running"
    }


# --------------------------------------------------
# Health
# --------------------------------------------------

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model": "XGBoost",
        "explainability": [
            "SHAP",
            "DiCE"
        ]
    }


# --------------------------------------------------
# Prediction
# --------------------------------------------------

@app.post("/predict")
def predict(data: dict):

    missing = [
        f for f in FEATURES
        if f not in data
    ]

    if missing:

        raise HTTPException(
            status_code=400,
            detail=f"Missing features: {missing}"
        )

    input_df = pd.DataFrame(
        [[data[f] for f in FEATURES]],
        columns=FEATURES
    )

    prediction = int(
        model.predict(input_df)[0]
    )

    probabilities = model.predict_proba(
        input_df
    )[0]

    return {

        "prediction": prediction,

        "probability_class_0":
            float(probabilities[0]),

        "probability_class_1":
            float(probabilities[1])
    }


# --------------------------------------------------
# SHAP Explanation
# --------------------------------------------------

@app.post("/explain")
def explain(data: dict):

    missing = [
        f for f in FEATURES
        if f not in data
    ]

    if missing:

        raise HTTPException(
            status_code=400,
            detail=f"Missing features: {missing}"
        )

    input_df = pd.DataFrame(
        [[data[f] for f in FEATURES]],
        columns=FEATURES
    )

    shap_result = explainer(input_df)

    values = shap_result.values[0]

    if len(values.shape) > 1:

        values = values[:, -1]

    explanation = []

    for feature, value in zip(
        FEATURES,
        values
    ):

        explanation.append({

            "feature": feature,

            "shap_value": float(value),

            "impact":
                "positive"
                if value > 0
                else "negative"
        })


    explanation.sort(
        key=lambda x: abs(x["shap_value"]),
        reverse=True
    )

    return {
        "explanation": explanation[:10]
    }


# --------------------------------------------------
# Counterfactual Explanation
# --------------------------------------------------

@app.post("/counterfactual")
def counterfactual(data: dict):

    missing = [
        f for f in FEATURES
        if f not in data
    ]

    if missing:

        raise HTTPException(
            status_code=400,
            detail=f"Missing features: {missing}"
        )

    query_instance = pd.DataFrame(
        [[data[f] for f in FEATURES]],
        columns=FEATURES
    )

    # DiCE expects categorical values as strings
    for col in CATEGORICAL_FEATURES:

        query_instance[col] = (
            query_instance[col]
            .astype(int)
            .astype(str)
        )

    for col in CONTINUOUS_FEATURES:

        query_instance[col] = (
            query_instance[col]
            .astype(float)
        )

    try:

        result = dice_exp.generate_counterfactuals(

            query_instance,

            total_CFs=3,

            desired_class="opposite",

            features_to_vary="all",

            permitted_range=permitted_range
        )

        cf_df = (
            result
            .cf_examples_list[0]
            .final_cfs_df
        )

        counterfactuals = (
            cf_df
            .to_dict(orient="records")
        )

        return {

            "counterfactuals":
                counterfactuals

        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
