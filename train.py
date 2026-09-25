import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from xgboost import XGBClassifier


# ==============================
# 1. LOAD DATASET
# ==============================

DATASET_PATH = "dice_training_data.csv"

df = pd.read_csv(DATASET_PATH)

print("Dataset loaded successfully")
print("Rows:", len(df))
print("Columns:", len(df.columns))


# ==============================
# 2. TARGET COLUMN
# ==============================

TARGET = "binaryClass"

if TARGET not in df.columns:
    raise ValueError(
        f"Target column '{TARGET}' was not found in the dataset."
    )


# ==============================
# 3. FEATURES
# ==============================

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


# ==============================
# 4. CHECK FEATURES
# ==============================

missing_features = [
    feature for feature in FEATURES
    if feature not in df.columns
]

if missing_features:
    raise ValueError(
        f"Missing features in dataset: {missing_features}"
    )


# ==============================
# 5. PREPARE DATA
# ==============================

X = df[FEATURES].copy()
y = df[TARGET].copy()


# Convert features to numeric

for column in FEATURES:
    X[column] = pd.to_numeric(
        X[column],
        errors="coerce"
    )


# Convert target to numeric

y = pd.to_numeric(
    y,
    errors="coerce"
)


# Remove invalid rows

valid_rows = X.notna().all(axis=1) & y.notna()

X = X[valid_rows]
y = y[valid_rows]


print("Usable rows:", len(X))


# ==============================
# 6. TRAIN / TEST SPLIT
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("Training rows:", len(X_train))
print("Testing rows:", len(X_test))


# ==============================
# 7. TRAIN XGBOOST
# ==============================

model = XGBClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric="logloss",
    n_jobs=1,
    tree_method="hist"
)

print("Training XGBoost...")
print("Please wait...")


model.fit(
    X_train,
    y_train
)


print("Training completed successfully!")


# ==============================
# 8. PREDICTION
# ==============================

y_pred = model.predict(X_test)


# ==============================
# 9. TEST ACCURACY
# ==============================

accuracy = accuracy_score(
    y_test,
    y_pred
)

print()
print("==============================")
print("XGBOOST TEST ACCURACY")
print("==============================")
print(f"{accuracy * 100:.2f}%")
print("==============================")


# ==============================
# 10. CLASSIFICATION REPORT
# ==============================

print()
print("Classification Report:")

print(
    classification_report(
        y_test,
        y_pred
    )
)


# ==============================
# 11. SAVE MODEL
# ==============================

joblib.dump(
    model,
    "thyroid_xgboost_model.pkl"
)

print()
print("Model saved successfully:")
print("thyroid_xgboost_model.pkl")
