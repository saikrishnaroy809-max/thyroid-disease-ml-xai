import os
import io
import warnings

import numpy as np
import pandas as pd

from flask import Flask, request, jsonify
from flask_cors import CORS

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier

from sklearn.metrics import accuracy_score

warnings.filterwarnings("ignore")

# ============================================================
# FLASK APPLICATION
# ============================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    }
)


# ============================================================
# GLOBAL VARIABLES
# ============================================================

DATASET = None
DATASET_NAME = None
TARGET_COLUMN = None

FEATURE_COLUMNS = []
FEATURE_INFO = []

MODELS = {}
MODEL_RESULTS = {}

X_TRAIN = None
X_TEST = None
Y_TRAIN = None
Y_TEST = None


# ============================================================
# TARGET COLUMN NAMES
# ============================================================

TARGET_NAMES = [
    "target",
    "class",
    "label",
    "diagnosis",
    "thyroid",
    "thyroid_disease",
    "disease",
    "output",
    "result",
    "status"
]


# ============================================================
# FIND TARGET COLUMN
# ============================================================

def find_target_column(df):

    columns_lower = {
        str(column).strip().lower(): column
        for column in df.columns
    }

    # Exact target names
    for name in TARGET_NAMES:

        if name in columns_lower:
            return columns_lower[name]

    # Partial target names
    for column in df.columns:

        column_lower = str(column).strip().lower()

        for word in [
            "target",
            "class",
            "diagnos",
            "disease",
            "thyroid",
            "label",
            "output"
        ]:

            if word in column_lower:
                return column

    # Last column fallback
    return df.columns[-1]


# ============================================================
# FEATURE INFORMATION
# ============================================================

def create_feature_info(df, target):

    result = []

    for column in df.columns:

        if column == target:
            continue

        series = df[column]

        if pd.api.types.is_numeric_dtype(series):
            feature_type = "numeric"
        else:
            feature_type = "categorical"

        result.append({
            "name": str(column),
            "type": feature_type,
            "missing": int(series.isna().sum())
        })

    return result


# ============================================================
# CLEAN MISSING VALUES
# ============================================================

def clean_missing_values(df):

    return df.replace(
        [
            "?",
            "NA",
            "N/A",
            "null",
            "NULL",
            "None",
            "none",
            ""
        ],
        np.nan
    )


# ============================================================
# PREPARE TARGET
# ============================================================

def prepare_target(y):

    y = y.copy()

    y = y.replace(
        [
            "?",
            "NA",
            "N/A",
            "null",
            "NULL",
            "None",
            "none",
            ""
        ],
        np.nan
    )

    # Remove missing target rows
    y = y.dropna()

    if len(y) == 0:
        raise ValueError(
            "Target column contains no valid values."
        )

    # Numeric target
    if pd.api.types.is_numeric_dtype(y):

        unique = sorted(
            y.unique()
        )

        if len(unique) != 2:

            raise ValueError(
                "Target column must contain exactly two classes."
            )

        mapping = {
            unique[0]: 0,
            unique[1]: 1
        }

        return y.map(mapping).astype(int)

    # Text target
    values = (
        y.astype(str)
        .str.strip()
        .str.lower()
    )

    unique = list(
        values.unique()
    )

    if len(unique) != 2:

        raise ValueError(
            "Target column must contain exactly two classes. "
            f"Found: {unique}"
        )

    positive_words = [
        "yes",
        "disease",
        "positive",
        "true",
        "thyroid",
        "1",
        "present"
    ]

    mapping = {}

    for value in unique:

        if any(
            word in value
            for word in positive_words
        ):

            mapping[value] = 1

    if len(mapping) == 1:

        negative = [
            value
            for value in unique
            if value not in mapping
        ][0]

        mapping[negative] = 0

    else:

        mapping = {
            unique[0]: 0,
            unique[1]: 1
        }

    return values.map(mapping).astype(int)


# ============================================================
# BUILD PREPROCESSOR
# ============================================================

def build_preprocessor(X):

    numeric_columns = (
        X.select_dtypes(
            include=["number"]
        )
        .columns
        .tolist()
    )

    categorical_columns = (
        X.select_dtypes(
            exclude=["number"]
        )
        .columns
        .tolist()
    )

    transformers = []

    # Numeric pipeline
    if numeric_columns:

        numeric_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(
                        strategy="median"
                    )
                ),
                (
                    "scaler",
                    StandardScaler()
                )
            ]
        )

        transformers.append(
            (
                "numeric",
                numeric_pipeline,
                numeric_columns
            )
        )

    # Categorical pipeline
    if categorical_columns:

        categorical_pipeline = Pipeline(
            steps=[
                (
                    "imputer",
                    SimpleImputer(
                        strategy="most_frequent"
                    )
                ),
                (
                    "encoder",
                    OneHotEncoder(
                        handle_unknown="ignore"
                    )
                )
            ]
        )

        transformers.append(
            (
                "categorical",
                categorical_pipeline,
                categorical_columns
            )
        )

    return ColumnTransformer(
        transformers=transformers
    )


# ============================================================
# HOME / HEALTH CHECK
# ============================================================

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message": "ThyroAI backend is running successfully",
        "status": "online",
        "version": "1.0"
    })


# ============================================================
# STATUS
# ============================================================

@app.route("/api/status", methods=["GET"])
def status():

    dataset_info = None

    if DATASET is not None:

        dataset_info = {
            "name": DATASET_NAME,
            "rows": int(
                DATASET.shape[0]
            ),
            "columns": int(
                DATASET.shape[1]
            ),
            "features": len(
                FEATURE_COLUMNS
            ),
            "target": TARGET_COLUMN
        }

    models = []

    for name, accuracy in MODEL_RESULTS.items():

        models.append({
            "name": name,
            "accuracy": float(accuracy)
        })

    return jsonify({

        "status": "online",

        "dataset": dataset_info,

        "features": FEATURE_INFO,

        "models": models

    })


# ============================================================
# UPLOAD DATASET
# ============================================================

@app.route("/api/upload", methods=["POST"])
def upload_dataset():

    global DATASET
    global DATASET_NAME
    global TARGET_COLUMN
    global FEATURE_COLUMNS
    global FEATURE_INFO

    if "file" not in request.files:

        return jsonify({
            "error": "No file uploaded."
        }), 400

    file = request.files["file"]

    if file.filename == "":

        return jsonify({
            "error": "No file selected."
        }), 400

    if not file.filename.lower().endswith(".csv"):

        return jsonify({
            "error": "Only CSV files are supported."
        }), 400

    try:

        content = file.read()

        df = pd.read_csv(
            io.BytesIO(content)
        )

        if df.empty:

            return jsonify({
                "error": "Dataset is empty."
            }), 400

        # Clean column names
        df.columns = [
            str(column).strip()
            for column in df.columns
        ]

        # Store dataset
        DATASET = df
        DATASET_NAME = file.filename

        # Detect target
        TARGET_COLUMN = find_target_column(
            df
        )

        # Features
        FEATURE_COLUMNS = [
            column
            for column in df.columns
            if column != TARGET_COLUMN
        ]

        # Feature metadata
        FEATURE_INFO = create_feature_info(
            df,
            TARGET_COLUMN
        )

        # Reset trained models
        MODELS.clear()
        MODEL_RESULTS.clear()

        return jsonify({

            "message":
                "Dataset uploaded successfully.",

            "dataset": {

                "name":
                    DATASET_NAME,

                "rows":
                    int(df.shape[0]),

                "columns":
                    int(df.shape[1]),

                "features":
                    len(FEATURE_COLUMNS),

                "target":
                    TARGET_COLUMN
            },

            "features":
                FEATURE_INFO

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# PREPROCESS DATASET
# ============================================================

@app.route("/api/preprocess", methods=["POST"])
def preprocess_dataset():

    global DATASET
    global TARGET_COLUMN
    global FEATURE_COLUMNS
    global FEATURE_INFO

    if DATASET is None:

        return jsonify({
            "error":
                "Upload a dataset first."
        }), 400

    try:

        original_rows = len(
            DATASET
        )

        df = DATASET.copy()

        # Replace missing markers
        df = clean_missing_values(
            df
        )

        # Remove completely empty columns
        df = df.dropna(
            axis=1,
            how="all"
        )

        # Remove duplicate rows
        df = df.drop_duplicates()

        DATASET = df

        # Re-detect target
        if (
            TARGET_COLUMN not in df.columns
        ):

            TARGET_COLUMN = find_target_column(
                df
            )

        FEATURE_COLUMNS = [
            column
            for column in df.columns
            if column != TARGET_COLUMN
        ]

        FEATURE_INFO = create_feature_info(
            df,
            TARGET_COLUMN
        )

        missing_values = int(
            df.isna()
            .sum()
            .sum()
        )

        return jsonify({

            "message":
                "Preprocessing completed.",

            "original_rows":
                original_rows,

            "final_rows":
                int(len(df)),

            "missing_values":
                missing_values,

            "features":
                FEATURE_INFO

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# TRAIN MODELS
# ============================================================

@app.route("/api/train", methods=["POST"])
def train_models():

    global MODELS
    global MODEL_RESULTS

    global X_TRAIN
    global X_TEST
    global Y_TRAIN
    global Y_TEST

    if DATASET is None:

        return jsonify({
            "error":
                "Upload a dataset first."
        }), 400

    try:

        df = DATASET.copy()

        if TARGET_COLUMN not in df.columns:

            return jsonify({
                "error":
                    "Target column not found."
            }), 400

        # Split X and y
        X = df.drop(
            columns=[
                TARGET_COLUMN
            ]
        )

        y = prepare_target(
            df[TARGET_COLUMN]
        )

        # Align features with target
        X = X.loc[
            y.index
        ]

        if len(y.unique()) != 2:

            return jsonify({
                "error":
                    "Target must contain exactly two classes."
            }), 400

        # Train / test split
        X_TRAIN, X_TEST, Y_TRAIN, Y_TEST = train_test_split(

            X,
            y,

            test_size=0.20,

            random_state=42,

            stratify=y
        )

        preprocessor = build_preprocessor(
            X
        )

        # Models
        algorithms = {

            "Logistic Regression":
                LogisticRegression(
                    max_iter=2000
                ),

            "Random Forest":
                RandomForestClassifier(
                    n_estimators=200,
                    random_state=42
                ),

            "Decision Tree":
                DecisionTreeClassifier(
                    random_state=42
                ),

            "K-Nearest Neighbors":
                KNeighborsClassifier(
                    n_neighbors=5
                )
        }

        MODELS = {}
        MODEL_RESULTS = {}

        results = []

        # Train each model
        for name, algorithm in algorithms.items():

            pipeline = Pipeline(
                steps=[

                    (
                        "preprocessor",
                        preprocessor
                    ),

                    (
                        "model",
                        algorithm
                    )
                ]
            )

            pipeline.fit(
                X_TRAIN,
                Y_TRAIN
            )

            predictions = pipeline.predict(
                X_TEST
            )

            accuracy = accuracy_score(
                Y_TEST,
                predictions
            )

            MODELS[name] = pipeline

            MODEL_RESULTS[name] = float(
                accuracy
            )

            results.append({

                "name":
                    name,

                "accuracy":
                    float(accuracy)

            })

        # Sort results
        results.sort(
            key=lambda item:
                item["accuracy"],
            reverse=True
        )

        return jsonify({

            "message":
                "Models trained successfully.",

            "models":
                results

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# PREDICTION
# ============================================================

@app.route("/api/predict", methods=["POST"])
def predict():

    if not MODELS:

        return jsonify({
            "error":
                "Train the models first."
        }), 400

    try:

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({
                "error":
                    "No input data received."
            }), 400

        row = {}

        # Build row according to
        # dataset feature columns
        for feature in FEATURE_COLUMNS:

            value = data.get(
                feature
            )

            if (
                value is None
                or value == ""
            ):

                value = np.nan

            row[feature] = value

        input_df = pd.DataFrame(
            [row]
        )

        # Convert numeric features
        for feature in FEATURE_INFO:

            name = feature["name"]

            if feature["type"] == "numeric":

                input_df[name] = pd.to_numeric(
                    input_df[name],
                    errors="coerce"
                )

        # Select best model
        best_model_name = max(
            MODEL_RESULTS,
            key=MODEL_RESULTS.get
        )

        model = MODELS[
            best_model_name
        ]

        # Prediction
        prediction = int(
            model.predict(
                input_df
            )[0]
        )

        # Probability
        probability = None

        if hasattr(
            model,
            "predict_proba"
        ):

            probabilities = model.predict_proba(
                input_df
            )[0]

            if len(probabilities) > 1:

                probability = float(
                    probabilities[1]
                )

        # Explanation
        if prediction == 1:

            explanation = (
                f"The selected model "
                f"({best_model_name}) "
                f"classified this input "
                f"as Class 1."
            )

        else:

            explanation = (
                f"The selected model "
                f"({best_model_name}) "
                f"classified this input "
                f"as Class 0."
            )

        return jsonify({

            "prediction":
                prediction,

            "probability":
                probability,

            "model":
                best_model_name,

            "accuracy":
                float(
                    MODEL_RESULTS[
                        best_model_name
                    ]
                ),

            "explanation":
                explanation

        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ============================================================
# RESET
# ============================================================

@app.route("/api/reset", methods=["POST"])
def reset():

    global DATASET
    global DATASET_NAME
    global TARGET_COLUMN
    global FEATURE_COLUMNS
    global FEATURE_INFO
    global MODELS
    global MODEL_RESULTS

    DATASET = None
    DATASET_NAME = None
    TARGET_COLUMN = None

    FEATURE_COLUMNS = []
    FEATURE_INFO = []

    MODELS = {}
    MODEL_RESULTS = {}

    return jsonify({
        "message":
            "Backend state reset successfully."
    })


# ============================================================
# ERROR HANDLER
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error":
            "Endpoint not found."
    }), 404


@app.errorhandler(500)
def internal_error(error):

    return jsonify({
        "error":
            "Internal server error."
    }), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
        )
