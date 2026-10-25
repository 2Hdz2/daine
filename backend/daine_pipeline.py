"""
DAINE suitability pipeline
===========================
Rules (hard safety filter) -> ML model (Decision Tree / XGBoost) ->
suitability score -> SHAP explanation.

Data source: Sri_Lankan_Food_Recommendation_Database.xlsx
    Sheet used: FoodHealth_DB
    Columns: food_id, food_name, condition, suitability, reasoning_tag,
             reasoning, key_nutritional_factor, portion_size, carbs_g,
             protein_g, fat_g, saturated_fat_g, fiber_g, sodium_mg,
             calories, glycemic_index_tier

Run:
    python daine_pipeline.py --model tree      # Decision Tree (default)
    python daine_pipeline.py --model xgboost   # XGBoost
"""

import argparse
from pathlib import Path

import pandas as pd
import numpy as np
import shap
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder

DATA_PATH = Path(__file__).resolve().parent / "data" / "food_db.xlsx"

GI_ORDER = {"low": 0, "moderate": 1, "high": 2}
FEATURE_COLS = [
    "carbs_g", "protein_g", "fat_g", "saturated_fat_g",
    "fiber_g", "sodium_mg", "calories", "gi_score",
]

# ---------------------------------------------------------------------------
# 1. RULES: hard safety filter
# ---------------------------------------------------------------------------
# These are non-negotiable clinical guardrails that should NEVER be
# overridden by a learned model. They run BEFORE the ML step. Anything that
# fails here is excluded outright and never reaches the model/SHAP stage.

def hard_rule_filter(row: pd.Series) -> tuple[bool, str]:
    """Return (passes_filter, reason_if_blocked)."""
    condition = row["condition"]

    if condition == "diabetes":
        if row["gi_score"] == GI_ORDER["high"] and row["carbs_g"] > 45:
            return False, "High-GI + high-carb combination unsafe for diabetes"

    if condition == "hypertension":
        if row["sodium_mg"] > 800:
            return False, "Sodium exceeds safe single-serving threshold for hypertension"

    if condition in ("cardiovascular", "high_cholesterol"):
        if row["saturated_fat_g"] > 10:
            return False, "Saturated fat exceeds safe threshold for heart/cholesterol conditions"

    if condition == "weight_management":
        if row["calories"] > 700:
            return False, "Calorie density too high for a single weight-management serving"

    return True, ""


def apply_rules(df: pd.DataFrame) -> pd.DataFrame:
    results = df.apply(hard_rule_filter, axis=1, result_type="expand")
    df = df.copy()
    df["rule_pass"], df["rule_block_reason"] = results[0], results[1]
    return df


# ---------------------------------------------------------------------------
# 2. Load + prepare data
# ---------------------------------------------------------------------------

def load_data(path: str = DATA_PATH) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name="FoodHealth_DB")
    df["gi_score"] = df["glycemic_index_tier"].map(GI_ORDER)
    return df


# ---------------------------------------------------------------------------
# 3. ML model: predicts suitability for items that PASS the rule filter
# ---------------------------------------------------------------------------

def train_model(df: pd.DataFrame, model_type: str = "tree"):
    """Train one model per condition (a diabetes-safe curry and a
    cholesterol-safe curry are judged on different criteria)."""
    models = {}
    encoders = {}

    for condition, group in df.groupby("condition"):
        # Only train on rows that already passed the hard rule filter -
        # the model should never learn to contradict a safety rule.
        train_df = group[group["rule_pass"]]

        X = train_df[FEATURE_COLS]
        y_raw = train_df["suitability"]

        le = LabelEncoder()
        y = le.fit_transform(y_raw)  # recommended / moderate / not_recommended

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        if model_type == "xgboost":
            from xgboost import XGBClassifier
            model = XGBClassifier(
                n_estimators=100, max_depth=3, learning_rate=0.1,
                eval_metric="mlogloss", random_state=42,
            )
        else:
            model = DecisionTreeClassifier(max_depth=4, random_state=42)

        model.fit(X_train, y_train)

        print(f"\n=== {condition} ({model_type}) — held-out test report ===")
        print(classification_report(
            y_test, model.predict(X_test),
            labels=range(len(le.classes_)), target_names=le.classes_, zero_division=0,
        ))

        models[condition] = model
        encoders[condition] = le

    return models, encoders


# ---------------------------------------------------------------------------
# 4. Suitability score = model's predicted probability of "recommended"
# ---------------------------------------------------------------------------

def suitability_score(model, encoder, feature_row: pd.DataFrame) -> dict:
    proba = model.predict_proba(feature_row)[0]
    class_probs = dict(zip(encoder.classes_, proba))
    predicted_label = encoder.classes_[np.argmax(proba)]
    # A single 0-100 score, weighting "recommended" highest.
    weight = {"recommended": 1.0, "moderate": 0.5, "not_recommended": 0.0}
    score = sum(class_probs.get(k, 0) * v for k, v in weight.items()) * 100
    return {
        "predicted_label": predicted_label,
        "class_probabilities": class_probs,
        "suitability_score": round(score, 1),
    }


# ---------------------------------------------------------------------------
# 5. SHAP explanation
# ---------------------------------------------------------------------------

def explain(model, feature_row: pd.DataFrame, model_type: str) -> pd.DataFrame:
    if model_type == "xgboost":
        explainer = shap.TreeExplainer(model)
    else:
        explainer = shap.TreeExplainer(model)  # works for sklearn trees too

    shap_values = explainer.shap_values(feature_row)

    # shap_values shape differs slightly between binary/multiclass & lib
    # versions; normalise to a per-feature contribution to the predicted class.
    if isinstance(shap_values, list):
        pred_class_idx = model.predict(feature_row)[0]
        contribs = shap_values[pred_class_idx][0]
    elif shap_values.ndim == 3:
        pred_class_idx = model.predict(feature_row)[0]
        contribs = shap_values[0, :, pred_class_idx]
    else:
        contribs = shap_values[0]

    exp_df = pd.DataFrame({
        "feature": feature_row.columns,
        "value": feature_row.iloc[0].values,
        "shap_contribution": contribs,
    }).sort_values("shap_contribution", key=abs, ascending=False)

    return exp_df


def explain_batch(model, feature_rows: pd.DataFrame) -> list[pd.DataFrame]:
    """Explain each row with one TreeExplainer call, selecting its predicted class."""
    if feature_rows.empty:
        return []

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(feature_rows)
    predicted_classes = np.asarray(model.predict(feature_rows), dtype=int)
    row_indices = np.arange(len(feature_rows))
    feature_count = feature_rows.shape[1]

    if isinstance(shap_values, list):
        contributions = np.stack([
            np.asarray(shap_values[class_index])[row_index]
            for row_index, class_index in enumerate(predicted_classes)
        ])
    else:
        shap_array = np.asarray(shap_values)
        if shap_array.ndim == 2:
            contributions = shap_array
        elif shap_array.ndim == 3 and shap_array.shape[1] == feature_count:
            contributions = shap_array[row_indices, :, predicted_classes]
        elif shap_array.ndim == 3 and shap_array.shape[2] == feature_count:
            contributions = shap_array[row_indices, predicted_classes, :]
        else:
            raise ValueError(
                f"Unexpected SHAP output shape for batch explanation: {shap_array.shape}"
            )

    explanations = []
    for row_index, row_contributions in enumerate(contributions):
        explanations.append(pd.DataFrame({
            "feature": feature_rows.columns,
            "value": feature_rows.iloc[row_index].values,
            "shap_contribution": row_contributions,
        }).sort_values("shap_contribution", key=abs, ascending=False))

    return explanations


# ---------------------------------------------------------------------------
# 6. End-to-end demo
# ---------------------------------------------------------------------------

def run_pipeline_for_item(df, models, encoders, food_id, condition, model_type):
    row = df[(df["food_id"] == food_id) & (df["condition"] == condition)]
    if row.empty:
        print(f"No entry for {food_id} / {condition}")
        return
    row = row.iloc[0]

    print(f"\n{'='*60}\n{row['food_name']}  |  condition: {condition}\n{'='*60}")

    passed, reason = hard_rule_filter(row)
    if not passed:
        print(f"BLOCKED by rule filter: {reason}")
        print("(Never reaches the ML model — hard safety rules are final.)")
        return

    print("Passed rule filter. Sending to ML model...")

    feature_row = pd.DataFrame([row[FEATURE_COLS]])
    model = models[condition]
    encoder = encoders[condition]

    result = suitability_score(model, encoder, feature_row)
    print(f"Predicted suitability : {result['predicted_label']}")
    print(f"Suitability score     : {result['suitability_score']} / 100")
    print(f"Class probabilities   : {result['class_probabilities']}")

    print("\nSHAP explanation (top contributing factors):")
    exp_df = explain(model, feature_row, model_type)
    print(exp_df.to_string(index=False))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", choices=["tree", "xgboost"], default="tree")
    parser.add_argument("--food_id", default="F0001")
    parser.add_argument("--condition", default="diabetes")
    args = parser.parse_args()

    data = load_data()
    data = apply_rules(data)
    models, encoders = train_model(data, model_type=args.model)
    run_pipeline_for_item(data, models, encoders, args.food_id, args.condition, args.model)