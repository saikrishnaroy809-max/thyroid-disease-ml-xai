from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

import joblib
import pandas as pd
import shap
import dice_ml
import json
import os
import shutil

from auth import router as auth_router
from database import save_prediction


# ==================================================
# FASTAPI APP
# ==================================================

app = FastAPI(
    title="Thyroid Disease Prediction API",
    description="ML-based thyroid prediction with SHAP, DiCE and Admin Dashboard",
    version="3.0.0"
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# ==================================================
# AUTHENTICATION ROUTES
# ==================================================

app.include_router(auth_router)


# ==================================================
# LOAD MODEL
# ==================================================

model = joblib.load("thyroid_xgboost_model.pkl")

# SHAP explainer
explainer = shap.TreeExplainer(model)


# ==================================================
# FEATURES
# ==================================================

FEATURES = [
    "age",
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
    "TSH",
    "T3 measured",
    "TT4 measured",
    "TT4",
    "T4U measured",
    "T4U",
    "FTI measured",
    "FTI"
]


CONTINUOUS_FEATURES = [
    "age",
    "TSH",
    "TT4",
    "T4U",
    "FTI"
]


CATEGORICAL_FEATURES = [
    col
    for col in FEATURES
    if col not in CONTINUOUS_FEATURES
]


# ==================================================
# DICE TRAINING DATA
# ==================================================

dice_data_df = pd.read_csv(
    "dice_training_data.csv"
)


dice_data = dice_ml.Data(
    dataframe=dice_data_df,
    continuous_features=CONTINUOUS_FEATURES,
    categorical_features=CATEGORICAL_FEATURES,
    outcome_name="binaryClass"
)


# ==================================================
# NUMERIC MODEL WRAPPER
# ==================================================

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


# ==================================================
# PERMITTED RANGES
# ==================================================

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


# ==================================================
# ROOT
# ==================================================

@app.get("/")
def root():

    return {
        "message": "Thyroid Disease Prediction API is running",
        "version": "3.0.0",
        "features": [
            "Prediction",
            "SHAP",
            "DiCE",
            "User Authentication",
            "User History",
            "Admin Dataset Upload"
        ]
    }


# ==================================================
# HEALTH CHECK
# ==================================================

@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model": "XGBoost",
        "explainability": [
            "SHAP",
            "DiCE"
        ],
        "authentication": True,
        "user_history": True,
        "admin_dataset_upload": True
    }


# ==================================================
# PREDICTION
# ==================================================

@app.post("/predict")
def predict(data: dict):

    # ----------------------------------------------
    # Check missing features
    # ----------------------------------------------

    missing = [
        f
        for f in FEATURES
        if f not in data
    ]

    if missing:

        raise HTTPException(
            status_code=400,
            detail=f"Missing features: {missing}"
        )


    # ----------------------------------------------
    # Create input dataframe
    # ----------------------------------------------

    input_df = pd.DataFrame(
        [[data[f] for f in FEATURES]],
        columns=FEATURES
    )


    # ----------------------------------------------
    # Prediction
    # ----------------------------------------------

    prediction = int(
        model.predict(input_df)[0]
    )


    # ----------------------------------------------
    # Probabilities
    # ----------------------------------------------

    probabilities = model.predict_proba(
        input_df
    )[0]


    probability_class_0 = float(
        probabilities[0]
    )

    probability_class_1 = float(
        probabilities[1]
    )


    # ----------------------------------------------
    # Optional user ID
    # ----------------------------------------------

    user_id = data.get("user_id")


    # ----------------------------------------------
    # Save prediction history
    # ----------------------------------------------

    if user_id is not None:

        try:

            clean_input_data = {
                feature: data[feature]
                for feature in FEATURES
            }

            save_prediction(
                user_id=int(user_id),
                prediction=prediction,
                probability_class_0=probability_class_0,
                probability_class_1=probability_class_1,
                input_data=json.dumps(
                    clean_input_data
                )
            )

        except Exception as e:

            print(
                "History save error:",
                str(e)
            )


    # ----------------------------------------------
    # Result
    # ----------------------------------------------

    return {

        "prediction": prediction,

        "probability_class_0":
            probability_class_0,

        "probability_class_1":
            probability_class_1,

        "message":
            (
                "Thyroid Disease Predicted"
                if prediction == 1
                else
                "Thyroid Disease Not Predicted"
            )
    }


# ==================================================
# SHAP EXPLANATION
# ==================================================

@app.post("/explain")
def explain(data: dict):

    missing = [
        f
        for f in FEATURES
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


    # ----------------------------------------------
    # SHAP
    # ----------------------------------------------

    shap_result = explainer(
        input_df
    )


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

            "shap_value":
                float(value),

            "impact":
                (
                    "positive"
                    if value > 0
                    else "negative"
                )
        })


    # ----------------------------------------------
    # Sort by importance
    # ----------------------------------------------

    explanation.sort(
        key=lambda x:
            abs(x["shap_value"]),
        reverse=True
    )


    return {

        "explanation":
            explanation[:10]
    }


# ==================================================
# COUNTERFACTUAL EXPLANATION
# ==================================================

@app.post("/counterfactual")
def counterfactual(data: dict):

    missing = [
        f
        for f in FEATURES
        if f not in data
    ]

    if missing:

        raise HTTPException(
            status_code=400,
            detail=f"Missing features: {missing}"
        )


    # ----------------------------------------------
    # Query instance
    # ----------------------------------------------

    query_instance = pd.DataFrame(
        [[data[f] for f in FEATURES]],
        columns=FEATURES
    )


    # ----------------------------------------------
    # DiCE categorical values
    # ----------------------------------------------

    for col in CATEGORICAL_FEATURES:

        query_instance[col] = (
            query_instance[col]
            .astype(int)
            .astype(str)
        )


    # ----------------------------------------------
    # DiCE continuous values
    # ----------------------------------------------

    for col in CONTINUOUS_FEATURES:

        query_instance[col] = (
            query_instance[col]
            .astype(float)
        )


    # ----------------------------------------------
    # Generate counterfactuals
    # ----------------------------------------------

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
            .to_dict(
                orient="records"
            )
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


# ==================================================
# ADMIN - DATASET UPLOAD
# ==================================================

@app.post("/admin/upload-dataset")
async def upload_dataset(
    file: UploadFile = File(...)
):

    # ----------------------------------------------
    # Check file
    # ----------------------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="No file selected"
        )


    # ----------------------------------------------
    # Only CSV allowed
    # ----------------------------------------------

    if not file.filename.lower().endswith(".csv"):

        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )


    # ----------------------------------------------
    # Create uploads directory
    # ----------------------------------------------

    os.makedirs(
        "uploads",
        exist_ok=True
    )


    # ----------------------------------------------
    # Save uploaded file
    # ----------------------------------------------

    file_path = os.path.join(
        "uploads",
        "admin_dataset.csv"
    )


    try:

        with open(
            file_path,
            "wb"
        ) as buffer:

            shutil.copyfileobj(
                file.file,
                buffer
            )


        # ------------------------------------------
        # Read uploaded dataset
        # ------------------------------------------

        df = pd.read_csv(
            file_path
        )


        # ------------------------------------------
        # Return dataset information
        # ------------------------------------------

        return {

            "message":
                "Dataset uploaded successfully",

            "filename":
                file.filename,

            "rows":
                int(len(df)),

            "columns":
                int(len(df.columns)),

            "column_names":
                df.columns.tolist()
        }


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Dataset upload failed: {str(e)}"
        )


# ==================================================
# END
# ==================================================
