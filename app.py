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

app = Flask(__name__)
CORS(app)

# --------------------------------------------------
# GLOBAL VARIABLES
# --------------------------------------------------

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


# --------------------------------------------------
# TARGET DETECTION
# --------------------------------------------------

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


def find_target_column(df):

    columns_lower = {
        str(col).strip().lower(): col
        for col in df.columns
    }

    for name in TARGET_NAMES:
        if name in columns_lower:
            return columns_lower[name]

    # Look for columns containing target-like words
    for col in df.columns:
        col_lower = str(col).lower()

        if any(
            word in col_lower
            for word in [
                "target",
                "class",
                "diagnos",
                "disease",
                "thyroid",
                "label",
                "output"
            ]
        ):
            return col

    # Fallback: last column
    return df.columns[-1]


# --------------------------------------------------
# FEATURE INFORMATION
# --------------------------------------------------

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
            "name": column,
            "type": feature_type,
            "missing": int(series.isna().sum())
        })

    return result


# --------------------------------------------------
# PREPARE DATA
# --------------------------------------------------

def prepare_target(y):

    y = y.copy()

    # Convert missing values
    y = y.replace(
        ["?", "NA", "N/A", "null", "None", ""],
        np.nan
    )

    y = y.dropna()

    # Numeric target
    if pd.api.types.is_numeric_dtype(y):
        unique = sorted(y.unique())

        if len(unique) == 2:
            mapping = {
                unique[0]: 0,
                unique[1]: 1
            }

            return y.map(mapping).astype(int)

    # Text target
    values = y.astype(str).str.strip().str.lower()

    unique = list(values.unique())

    if len(unique) != 2:
        raise ValueError(
            f"Target column must contain exactly 2 classes. "
            f"Found: {unique}"
        )

    # Prefer disease/positive class as 1
    positive_words = [
        "yes",
        "disease",
        "positive",
        "true",
        "1",
        "thyroid"
    ]

    mapping = {}

    for value in unique:
        if any(word in value for word in positive_words):
            mapping[value] = 1

    if len(mapping) == 1:
        negative = [
            value for value in unique
            if value not in mapping
        ][0]

        mapping[negative] = 0

    else:
        mapping = {
            unique[0]: 0,
            unique[1]: 1
        }

    return values.map(mapping).astype(int)


# --------------------------------------------------
# BUILD PREPROCESSOR
# --------------------------------------------------

def build_preprocessor(X):

    numeric_columns = X.select_dtypes(
        include=["number"]
    ).columns.tolist()

    categorical_columns = X.select_dtypes(
        exclude=["number"]
    ).columns.tolist()

    numeric_pipeline = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median")
            ),
            (
                "scaler",
                StandardScaler()
            )
        ]
    )

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

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                numeric_pipeline,
                numeric_columns
            ),
            (
                "categorical",
                categorical_pipeline,
                categorical_columns
            )
        ]
    )

    return preprocessor


# --------------------------------------------------
# LOAD DATASET
# --------------------------------------------------

@app.route("/api/upload", methods=["POST"])
def upload_dataset():

    global DATASET
    global DATASET_NAME
    global TARGET_COLUMN
    global FEATURE_COLUMNS
    global FEATURE_INFO

    if "file" not in request.files:
        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({
            "error": "No file selected"
        }), 400

    if not file.filename.lower().endswith(".csv"):
        return jsonify({
            "error": "Only CSV files are supported"
        }), 400

    try:

        content = file.read()

        df = pd.read_csv(
            io.BytesIO(content)
        )

        if df.empty:
            return jsonify({
                "error": "Dataset is empty"
            }), 400

        # Clean column names
        df.columns = [
            str(col).strip()
            for col in df.columns
        ]

        DATASET = df
        DATASET_NAME = file.filename

        TARGET_COLUMN = find_target_column(df)

        FEATURE_COLUMNS = [
            col
            for col in df.columns
            if col != TARGET_COLUMN
        ]

        FEATURE_INFO = create_feature_info(
            df,
            TARGET_COLUMN
        )

        return jsonify({
            "message": "Dataset uploaded successfully",

            "dataset": {
                "name": DATASET_NAME,
                "rows": int(df.shape[0]),
                "columns": int(df.shape[1]),
                "features": len(FEATURE_COLUMNS),
                "target": TARGET_COLUMN
            },

            "features": FEATURE_INFO
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# PREPROCESS
# --------------------------------------------------

@app.route("/api/preprocess", methods=["POST"])
def preprocess_dataset():

    global DATASET

    if DATASET is None:
        return jsonify({
            "error": "Upload a dataset first"
        }), 400

    try:

        original_rows = len(DATASET)

        df = DATASET.copy()

        # Replace common missing markers
        df = df.replace(
            ["?", "NA", "N/A", "null", "None", ""],
            np.nan
        )

        # Remove completely empty columns
        df = df.dropna(
            axis=1,
            how="all"
        )

        # Remove duplicate rows
        df = df.drop_duplicates()

        DATASET = df

        missing_values = int(
            df.isna().sum().sum()
        )

        return jsonify({
            "message": "Preprocessing completed",

            "original_rows": original_rows,

            "final_rows": int(len(df)),

            "missing_values": missing_values
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# TRAIN MODELS
# --------------------------------------------------

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
            "error": "Upload a dataset first"
        }), 400

    try:

        df = DATASET.copy()

        if TARGET_COLUMN not in df.columns:
            return jsonify({
                "error": "Target column not found"
            }), 400

        X = df.drop(
            columns=[TARGET_COLUMN]
        )

        y = prepare_target(
            df[TARGET_COLUMN]
        )

        # Align X with valid target rows
        valid_indices = y.index

        X = X.loc[valid_indices]

        if len(y.unique()) != 2:
            return jsonify({
                "error": "The target must contain exactly two classes"
            }), 400

        X_TRAIN, X_TEST, Y_TRAIN, Y_TEST = train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=42,
            stratify=y
        )

        preprocessor = build_preprocessor(X)

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
                "name": name,
                "accuracy": float(accuracy)
            })

        return jsonify({
            "message": "Models trained successfully",
            "models": results
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# PREDICTION
# --------------------------------------------------

@app.route("/api/predict", methods=["POST"])
def predict():

    if not MODELS:
        return jsonify({
            "error": "Train the models first"
        }), 400

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No input data received"
            }), 400

        row = {}

        for feature in FEATURE_COLUMNS:

            value = data.get(feature)

            if value is None or value == "":
                value = np.nan

            row[feature] = value

        input_df = pd.DataFrame(
            [row]
        )

        # Convert numeric columns
        for feature in FEATURE_INFO:

            name = feature["name"]

            if feature["type"] == "numeric":

                input_df[name] = pd.to_numeric(
                    input_df[name],
                    errors="coerce"
                )

        # Select model with highest test accuracy
        best_model_name = max(
            MODEL_RESULTS,
            key=MODEL_RESULTS.get
        )

        model = MODELS[
            best_model_name
        ]

        prediction = int(
            model.predict(input_df)[0]
        )

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

        if prediction == 1:

            explanation = (
                f"The selected model "
                f"({best_model_name}) classified "
                f"this input as Class 1. "
                f"Class 1 represents the positive "
                f"class in the trained dataset."
            )

        else:

            explanation = (
                f"The selected model "
                f"({best_model_name}) classified "
                f"this input as Class 0. "
                f"Class 0 represents the negative "
                f"class in the trained dataset."
            )

        return jsonify({

            "prediction": prediction,

            "probability": probability,

            "model": best_model_name,

            "accuracy": MODEL_RESULTS[
                best_model_name
            ],

            "explanation": explanation
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# STATUS
# --------------------------------------------------

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
            "accuracy": accuracy
        })

    return jsonify({

        "status": "online",

        "dataset": dataset_info,

        "features": FEATURE_INFO,

        "models": models
    })


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.route("/", methods=["GET"])
def home():

    return jsonify({
        "message":
            "ThyroAI backend is running successfully",
        "status": "online"
    })


# --------------------------------------------------
# RUN
# --------------------------------------------------

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
