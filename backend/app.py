from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import pickle
import os
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

class HealthcareModelPredictor:
    """
    A comprehensive system to load trained healthcare models and make predictions
    with detailed feature importance analysis
    """

    def __init__(self, model_path, optimal_threshold=None):
        """
        Initialize the predictor

        Args:
            model_path: Path to the pickle file containing the trained model
            optimal_threshold: Optimal threshold for binary classification (if known)
        """
        self.model_path = model_path
        self.optimal_threshold = optimal_threshold
        self.model = None
        self.scaler = None
        self.encoder = None
        self.feature_names = None
        self.is_loaded = False

    def load_model(self):
        """Load the trained model from pickle file"""
        try:
            with open(self.model_path, 'rb') as f:
                model_data = pickle.load(f)

            # Handle different pickle formats
            if isinstance(model_data, dict):
                self.model = model_data.get('model')
                self.scaler = model_data.get('scaler')
                self.encoder = model_data.get('encoder')
                self.feature_names = model_data.get('feature_names')

                # Try to extract threshold from filename if not provided
                if self.optimal_threshold is None and 'optimal_threshold' in model_data:
                    self.optimal_threshold = model_data['optimal_threshold']

            else:
                # If it's just the model object
                self.model = model_data

            self.is_loaded = True
            print(f"✅ Model loaded successfully from {self.model_path}")
            print(f"   Model type: {type(self.model).__name__}")

            if hasattr(self.model, 'n_features_in_'):
                print(f"   Expected features: {self.model.n_features_in_}")

            if self.optimal_threshold:
                print(f"   Optimal threshold: {self.optimal_threshold:.3f}")
            else:
                print("   Using default threshold: 0.5")
                self.optimal_threshold = 0.5

            return True

        except FileNotFoundError:
            print(f"❌ Model file not found: {self.model_path}")
            return False
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False

    def prepare_data(self, data):
        """
        Prepare data for prediction (scaling, encoding, etc.)

        Args:
            data: DataFrame or dict with patient data

        Returns:
            Processed numpy array ready for prediction
        """
        if isinstance(data, dict):
            data = pd.DataFrame([data])
        elif isinstance(data, pd.Series):
            data = pd.DataFrame([data])

        # Remove columns that shouldn't be used for prediction
        columns_to_drop = ['encounter_id', 'patient_nbr', 'patient_id', 'readmitted']
        for col in columns_to_drop:
            if col in data.columns:
                data = data.drop(columns=[col])

        # Ensure we have the expected number of features
        if hasattr(self.model, 'n_features_in_'):
            expected_features = self.model.n_features_in_
            if data.shape[1] != expected_features:
                print(f"⚠️  Warning: Expected {expected_features} features, got {data.shape[1]}")
                print(f"Available columns: {list(data.columns)}")

                # If we have too few features, this is a problem
                if data.shape[1] < expected_features:
                    raise ValueError(f"Missing features. Expected {expected_features}, got {data.shape[1]}")

                # If we have too many, select the first N features
                elif data.shape[1] > expected_features:
                    print(f"🔧 Selecting first {expected_features} features for prediction")
                    data = data.iloc[:, :expected_features]

        # Apply scaling if scaler is available
        if self.scaler is not None:
            data_scaled = self.scaler.transform(data)
        else:
            data_scaled = data.values if isinstance(data, pd.DataFrame) else data

        return data_scaled

    def predict_single_patient(self, patient_data, explain=True):
        """
        Make prediction for a single patient with detailed analysis

        Args:
            patient_data: Dict or Series with patient features
            explain: Whether to provide feature importance explanation

        Returns:
            Dictionary with prediction results and explanations
        """
        if not self.is_loaded:
            raise ValueError("Model not loaded. Call load_model() first.")

        # Prepare data
        X_prepared = self.prepare_data(patient_data)

        # Make predictions
        y_pred_proba = self.model.predict_proba(X_prepared)[0, 1]
        y_pred_binary = 1 if y_pred_proba >= self.optimal_threshold else 0
        y_pred_default = 1 if y_pred_proba >= 0.5 else 0

        # Risk categorization
        if y_pred_proba >= 0.8:
            risk_level = "🔴 CRITICAL"
        elif y_pred_proba >= 0.6:
            risk_level = "🟠 VERY HIGH"
        elif y_pred_proba >= 0.4:
            risk_level = "🟡 HIGH"
        elif y_pred_proba >= 0.2:
            risk_level = "🟢 MODERATE"
        else:
            risk_level = "🟢 LOW"

        # Clinical recommendation
        if y_pred_proba >= 0.7:
            recommendation = ("IMMEDIATE ACTION: Schedule follow-up within 24-72 hours. "
                            "Review discharge plan, medication reconciliation, and patient education.")
        elif y_pred_proba >= 0.4:
            recommendation = ("HIGH PRIORITY: Schedule follow-up within 1 week. "
                            "Ensure clear discharge instructions and medication adherence.")
        elif y_pred_proba >= 0.2:
            recommendation = ("STANDARD CARE: Regular follow-up within 2 weeks. "
                            "Provide standard discharge instructions.")
        else:
            recommendation = ("ROUTINE: Standard discharge process with routine follow-up.")

        result = {
            'patient_id': patient_data.get('patient_id', 'Unknown') if isinstance(patient_data, dict) else 'Single_Patient',
            'readmission_probability': y_pred_proba,
            'prediction_optimal_threshold': y_pred_binary,
            'prediction_default_threshold': y_pred_default,
            'risk_level': risk_level,
            'clinical_recommendation': recommendation,
            'optimal_threshold_used': self.optimal_threshold
        }

        # Add feature importance analysis if requested
        if explain:
            feature_analysis = self.analyze_feature_importance(patient_data, X_prepared)
            result.update(feature_analysis)

        return result

    def predict_batch(self, patients_df, explain=False):
        """
        Make predictions for multiple patients

        Args:
            patients_df: DataFrame with patient data
            explain: Whether to include feature importance for each patient

        Returns:
            DataFrame with predictions and analysis
        """
        if not self.is_loaded:
            raise ValueError("Model not loaded. Call load_model() first.")

        results = []

        # Store patient IDs before processing
        patient_ids = []
        if 'patient_id' in patients_df.columns:
            patient_ids = patients_df['patient_id'].tolist()
        elif 'encounter_id' in patients_df.columns:
            patient_ids = patients_df['encounter_id'].tolist()
        else:
            patient_ids = [f"Patient_{idx}" for idx in range(len(patients_df))]

        for idx, row in patients_df.iterrows():
            try:
                # Get patient ID first
                patient_id = patient_ids[idx] if idx < len(patient_ids) else f"Patient_{idx}"

                # Convert row to dict and add patient_id
                patient_data = row.to_dict()
                patient_data['patient_id'] = patient_id

                result = self.predict_single_patient(patient_data, explain=explain)
                results.append(result)

            except Exception as e:
                print(f"Error processing patient {idx} (ID: {patient_ids[idx] if idx < len(patient_ids) else 'Unknown'}): {e}")
                # Add error result
                error_result = {
                    'patient_id': patient_ids[idx] if idx < len(patient_ids) else f"Patient_{idx}",
                    'readmission_probability': np.nan,
                    'prediction_optimal_threshold': -1,
                    'prediction_default_threshold': -1,
                    'risk_level': 'ERROR',
                    'clinical_recommendation': f'Error in prediction: {e}',
                    'optimal_threshold_used': self.optimal_threshold
                }
                results.append(error_result)

        return pd.DataFrame(results)

    def analyze_feature_importance(self, patient_data, X_prepared):
        """
        Analyze how features contribute to the prediction with detailed explanations

        Args:
            patient_data: Original patient data
            X_prepared: Preprocessed data used for prediction

        Returns:
            Dictionary with feature importance analysis and explanations
        """
        analysis = {}

        # Get feature names
        if self.feature_names:
            feature_names = self.feature_names
        elif isinstance(patient_data, pd.DataFrame):
            feature_names = patient_data.columns.tolist()
        elif isinstance(patient_data, dict):
            feature_names = list(patient_data.keys())
        else:
            feature_names = [f'feature_{i}' for i in range(len(X_prepared[0]))]

        # Global feature importance (if available)
        if hasattr(self.model, 'feature_importances_'):
            # Create feature importance dict
            feature_importance = dict(zip(feature_names, self.model.feature_importances_))
            sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)

            analysis['global_feature_importance'] = dict(sorted_features)
            analysis['top_10_important_features'] = dict(sorted_features[:10])

        # DETAILED PREDICTION EXPLANATION
        analysis.update(self._explain_prediction_detailed(patient_data, X_prepared, feature_names))

        return analysis

    def _explain_prediction_detailed(self, patient_data, X_prepared, feature_names):
        """
        Provide detailed explanation of why the model made this prediction
        """
        explanation = {}

        if isinstance(patient_data, dict):
            patient_values = patient_data
        else:
            patient_values = patient_data.to_dict() if hasattr(patient_data, 'to_dict') else {}

        # Get baseline prediction (average risk)
        try:
            baseline_prob = self._get_baseline_probability()
            current_prob = self.model.predict_proba(X_prepared)[0, 1]

            explanation['baseline_risk'] = baseline_prob
            explanation['patient_risk'] = current_prob
            explanation['risk_difference'] = current_prob - baseline_prob

        except:
            baseline_prob = 0.5  # Default if we can't calculate
            current_prob = self.model.predict_proba(X_prepared)[0, 1]
            explanation['baseline_risk'] = baseline_prob
            explanation['patient_risk'] = current_prob
            explanation['risk_difference'] = current_prob - baseline_prob

        # Analyze individual feature contributions
        feature_contributions = self._calculate_feature_contributions(
            patient_values, X_prepared, feature_names, baseline_prob, current_prob
        )

        explanation['feature_contributions'] = feature_contributions
        explanation['explanation_text'] = self._generate_explanation_text(
            feature_contributions, current_prob, baseline_prob
        )

        return explanation

    def _get_baseline_probability(self):
        """Calculate baseline probability (average risk across population)"""
        try:
            # For tree-based models, we can estimate baseline as the probability
            # when all features are at their average/median values
            if hasattr(self.model, 'feature_importances_'):
                # Create a "average patient" with neutral values
                n_features = len(self.model.feature_importances_)
                neutral_patient = np.zeros((1, n_features))  # Neutral/average values
                baseline_prob = self.model.predict_proba(neutral_patient)[0, 1]
                return baseline_prob
            else:
                return 0.3  # Typical hospital readmission rate
        except:
            return 0.3  # Default hospital readmission rate

    def _calculate_feature_contributions(self, patient_values, X_prepared, feature_names, baseline_prob, current_prob):
        """
        Calculate how much each feature contributes to the prediction with detailed analysis
        """
        contributions = []

        if not hasattr(self.model, 'feature_importances_'):
            return contributions

        # Get feature importances
        importances = self.model.feature_importances_

        # Calculate mean values for comparison (if possible)
        try:
            # Create baseline comparison
            baseline_values = self._get_baseline_feature_values(feature_names)
        except:
            baseline_values = {}

        for i, feature_name in enumerate(feature_names):
            if feature_name in patient_values:
                feature_value = patient_values[feature_name]
                feature_importance = importances[i] if i < len(importances) else 0

                # Get baseline value for comparison
                baseline_value = baseline_values.get(feature_name, 0)

                # Calculate how much this feature differs from baseline
                if isinstance(feature_value, (int, float)) and isinstance(baseline_value, (int, float)):
                    value_difference = feature_value - baseline_value
                    # Normalize the difference
                    if baseline_value != 0:
                        relative_difference = value_difference / max(abs(baseline_value), 1)
                    else:
                        relative_difference = feature_value
                else:
                    value_difference = 1 if feature_value else 0
                    relative_difference = value_difference

                # Calculate contribution score based on importance and value difference
                contribution_score = abs(feature_importance * relative_difference)

                # Determine direction and impact
                if isinstance(feature_value, (int, float)):
                    if feature_value > baseline_value:
                        direction = "increases"
                        risk_impact = "INCREASES" if self._feature_increases_risk(feature_name, feature_value) else "DECREASES"
                    elif feature_value < baseline_value:
                        direction = "decreases"
                        risk_impact = "DECREASES" if self._feature_increases_risk(feature_name, feature_value) else "INCREASES"
                    else:
                        direction = "neutral"
                        risk_impact = "NEUTRAL"
                else:
                    # For binary/categorical features
                    if feature_value:
                        direction = "increases"
                        risk_impact = "INCREASES" if self._feature_increases_risk(feature_name, feature_value) else "NEUTRAL"
                    else:
                        direction = "neutral"
                        risk_impact = "NEUTRAL"

                # Get detailed interpretation
                interpretation = self._interpret_feature_value(feature_name, feature_value)
                risk_explanation = self._explain_why_feature_affects_risk(feature_name, feature_value, risk_impact)

                contributions.append({
                    'feature': feature_name,
                    'value': feature_value,
                    'baseline_value': baseline_value,
                    'importance': feature_importance,
                    'contribution_score': contribution_score,
                    'direction': direction,
                    'risk_impact': risk_impact,
                    'interpretation': interpretation,
                    'risk_explanation': risk_explanation,
                    'explanation': f"{feature_name} = {feature_value} → {interpretation} → {risk_impact} risk",
                    'detailed_explanation': f"{feature_name}: {feature_value} (vs typical: {baseline_value}) → {risk_explanation}"
                })

        # Sort by contribution score
        contributions.sort(key=lambda x: x['contribution_score'], reverse=True)

        return contributions

    def _get_baseline_feature_values(self, feature_names):
        """Get typical/baseline values for features"""
        # These are typical baseline values for hospital readmission prediction
        # You can customize these based on your dataset's characteristics
        baseline_values = {
            'age': 65,  # Average patient age
            'time_in_hospital': 4,  # Average hospital stay
            'num_medications': 10,  # Average number of medications
            'num_lab_procedures': 30,  # Average lab procedures
            'num_procedures': 2,  # Average procedures
            'number_diagnoses': 5,  # Average diagnoses
            # Binary medication features (0 = not taking, 1 = taking)
            'metformin': 0, 'insulin': 0, 'glimepiride': 0, 'pioglitazone': 0,
            'repaglinide': 0, 'glyburide': 0, 'change': 0, 'diabetesMed': 0
        }

        # Set default baseline for any feature not specified
        for feature in feature_names:
            if feature not in baseline_values:
                # If this is a composite feature (e.g., "a|b"), derive baseline
                if '|' in feature:
                    parts = [p.strip() for p in feature.split('|') if p.strip()]
                    if parts:
                        # Average the known baselines of parts, defaulting missing parts to 0
                        part_baselines = [baseline_values.get(p, 0) for p in parts]
                        baseline_values[feature] = float(sum(part_baselines)) / max(len(part_baselines), 1)
                        continue
                # Reasonable default for unknown numeric-like counts
                baseline_values[feature] = 0

        return baseline_values

    def _feature_increases_risk(self, feature_name, value):
        """Determine if a feature value typically increases readmission risk"""

        # Features that typically increase risk when higher/present
        risk_increasing_features = {
            'age': lambda x: x > 70,  # Elderly patients
            'time_in_hospital': lambda x: x > 7,  # Long stays
            'num_medications': lambda x: x > 15,  # Many medications
            'num_lab_procedures': lambda x: x > 50,  # Many tests
            'num_procedures': lambda x: x > 3,  # Many procedures
            'number_diagnoses': lambda x: x > 8,  # Complex cases
            'insulin': lambda x: x == 1,  # On insulin
            'change': lambda x: x == 1,  # Medication changes
            'diabetesMed': lambda x: x == 1,  # On diabetes meds
        }

        if feature_name in risk_increasing_features:
            return risk_increasing_features[feature_name](value)

        # Default: assume higher values increase risk
        return bool(value) if not isinstance(value, (int, float)) else value > 0

    def _explain_why_feature_affects_risk(self, feature_name, value, risk_impact):
        """Explain why a feature affects readmission risk"""

        explanations = {
            'age': {
                'INCREASES': f"Elderly patients ({value} years) have higher readmission risk due to frailty and comorbidities",
                'DECREASES': f"Younger patients ({value} years) typically have better recovery and lower readmission risk"
            },
            'time_in_hospital': {
                'INCREASES': f"Long hospital stay ({value} days) indicates complex condition and higher readmission risk",
                'DECREASES': f"Short hospital stay ({value} days) suggests simpler condition and lower readmission risk"
            },
            'num_medications': {
                'INCREASES': f"Many medications ({value}) indicate complex conditions and increase readmission risk",
                'DECREASES': f"Fewer medications ({value}) suggest simpler conditions and lower readmission risk"
            },
            'insulin': {
                'INCREASES': "Insulin therapy indicates advanced diabetes requiring careful management",
                'NEUTRAL': "Not on insulin therapy"
            },
            'change': {
                'INCREASES': "Medication changes during hospitalization may indicate unstable condition",
                'NEUTRAL': "No medication changes during stay"
            },
            'diabetesMed': {
                'INCREASES': "Diabetes medications indicate chronic condition requiring ongoing management",
                'NEUTRAL': "Not on diabetes medications"
            },
            # Composite feature rationales (derived signals capturing combined burden/complexity)
            'num_medications|num_lab_procedures': {
                'INCREASES': "High medication burden together with many lab procedures reflects complex, actively managed cases with higher complication and readmission risk",
                'DECREASES': "Low meds and few labs indicate simpler care needs and lower readmission risk"
            },
            'num_medications|number_diagnoses': {
                'INCREASES': "Many medications alongside multiple diagnoses suggest multimorbidity and polypharmacy, both associated with higher readmission risk",
                'DECREASES': "Fewer medications with fewer diagnoses indicate lower clinical complexity"
            },
            'time_in_hospital|num_lab_procedures': {
                'INCREASES': "Longer stays with extensive lab testing imply severity and ongoing issues, increasing risk of return",
                'DECREASES': "Short stays and limited testing typically reflect lower acuity"
            },
            'num_medications|time_in_hospital': {
                'INCREASES': "High medication counts during longer admissions point to complex titration and potential adherence issues post-discharge",
                'DECREASES': "Few meds during brief admissions usually mean simpler discharge plans"
            },
            'number_diagnoses|time_in_hospital': {
                'INCREASES': "Multiple diagnoses over a prolonged stay indicate complex clinical trajectories, which elevates readmission risk",
                'DECREASES': "Limited diagnoses with short stay suggest straightforward cases"
            }
        }

        if feature_name in explanations and risk_impact in explanations[feature_name]:
            return explanations[feature_name][risk_impact]

        # Default explanations
        if risk_impact == 'INCREASES':
            return f"This value ({value}) is associated with higher readmission risk"
        elif risk_impact == 'DECREASES':
            return f"This value ({value}) is associated with lower readmission risk"
        else:
            return f"This value ({value}) has neutral impact on readmission risk"

    def _interpret_feature_value(self, feature_name, value):
        """
        Interpret what a feature value means clinically
        """
        # Composite feature interpretation
        if '|' in str(feature_name):
            parts = [p.strip().replace('_', ' ') for p in str(feature_name).split('|') if p.strip()]
            if len(parts) == 2:
                return f"Combined indicator of {parts[0]} and {parts[1]} workload: {value}"
            elif len(parts) > 2:
                joined = ', '.join(parts[:-1]) + f" and {parts[-1]}"
                return f"Combined indicator across {joined}: {value}"

        feature_interpretations = {
            'age': lambda x: f"Patient is {x} years old" + (" (elderly)" if x > 70 else " (younger)" if x < 50 else " (middle-aged)"),
            'time_in_hospital': lambda x: f"{x} days in hospital" + (" (long stay)" if x > 7 else " (short stay)" if x < 3 else " (average stay)"),
            'num_medications': lambda x: f"{x} medications" + (" (many meds)" if x > 15 else " (few meds)" if x < 5 else " (moderate)"),
            'num_lab_procedures': lambda x: f"{x} lab procedures" + (" (many tests)" if x > 50 else " (few tests)" if x < 20 else " (moderate)"),
            'number_diagnoses': lambda x: f"{x} diagnoses" + (" (complex case)" if x > 8 else " (simple case)" if x < 3 else " (moderate)"),
            'insulin': lambda x: "On insulin therapy" if x else "Not on insulin",
            'metformin': lambda x: "Taking metformin" if x else "Not taking metformin",
            'change': lambda x: "Medication changes during stay" if x else "No medication changes",
            'diabetesMed': lambda x: "On diabetes medication" if x else "Not on diabetes medication",
        }

        # Default interpretation
        if feature_name in feature_interpretations:
            return feature_interpretations[feature_name](value)
        else:
            if isinstance(value, (int, float)):
                if value == 0:
                    return "Not present/Normal"
                elif value == 1:
                    return "Present/Yes"
                else:
                    return f"Value: {value}"
            else:
                return f"Value: {value}"

    def _generate_explanation_text(self, contributions, current_prob, baseline_prob):
        """
        Generate human-readable explanation of the prediction
        """
        if current_prob > baseline_prob + 0.1:
            risk_level = "HIGHER than average"
            main_explanation = f"This patient has {risk_level} readmission risk ({current_prob:.1%} vs {baseline_prob:.1%} average)."
        elif current_prob < baseline_prob - 0.1:
            risk_level = "LOWER than average"
            main_explanation = f"This patient has {risk_level} readmission risk ({current_prob:.1%} vs {baseline_prob:.1%} average)."
        else:
            risk_level = "SIMILAR to average"
            main_explanation = f"This patient has {risk_level} readmission risk ({current_prob:.1%} vs {baseline_prob:.1%} average)."

        # Get top contributing factors
        increasing_risk = [c for c in contributions[:5] if c['risk_impact'] == 'INCREASES']
        decreasing_risk = [c for c in contributions[:5] if c['risk_impact'] == 'DECREASES']

        detailed_explanation = main_explanation + "\n\n"

        if increasing_risk:
            detailed_explanation += "🔴 FACTORS INCREASING RISK:\n"
            for factor in increasing_risk[:3]:
                detailed_explanation += f"• {factor['explanation']}\n"

        if decreasing_risk:
            detailed_explanation += "\n🟢 FACTORS DECREASING RISK:\n"
            for factor in decreasing_risk[:3]:
                detailed_explanation += f"• {factor['explanation']}\n"

        return detailed_explanation.strip()

# Global predictor instance
predictor = None

def load_models():
    """Load the trained model and related files"""
    global predictor
    try:
        # Initialize predictor with new model path
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'best_healthcare_model_aggressive_smote_RF_ExtremeRecall.pkl')
        optimal_threshold = 0.286  # From your training results
        
        predictor = HealthcareModelPredictor(model_path, optimal_threshold)
        
        if predictor.load_model():
            print("✅ Healthcare Model Predictor loaded successfully")
            return True
        else:
            print("❌ Failed to load Healthcare Model Predictor")
            return False
            
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        health_status = {
            'status': 'healthy',
            'timestamp': pd.Timestamp.now().isoformat(),
            'model_loaded': predictor is not None and predictor.is_loaded,
            'model_type': type(predictor.model).__name__ if predictor and predictor.model else 'None',
            'optimal_threshold': predictor.optimal_threshold if predictor else None,
            'api_version': '1.0.0',
            'endpoints': [
                '/health',
                '/predict', 
                '/predict_batch',
                '/example',
                '/model_info',
                '/upload_predict',
                '/stats'
            ]
        }
        
        if predictor and predictor.is_loaded:
            health_status['message'] = 'API is healthy and ready for predictions'
            health_status['model_status'] = 'loaded'
        else:
            health_status['status'] = 'unhealthy'
            health_status['message'] = 'Model not loaded - API is not ready'
            health_status['model_status'] = 'not_loaded'
            
        return jsonify(health_status)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Health check failed: {str(e)}',
            'timestamp': pd.Timestamp.now().isoformat()
        }), 500

@app.route('/predict', methods=['POST'])
def predict():
    """Predict hospital readmission endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'No data provided',
                'required_format': 'JSON with patient features',
                'example': '/example'
            }), 400
        
        if not predictor or not predictor.is_loaded:
            return jsonify({
                'status': 'error',
                'message': 'Model not loaded. Please check server logs.',
                'health_check': '/health'
            }), 500
        
        # Add patient_id if not provided
        if 'patient_id' not in data:
            data['patient_id'] = f'API_Patient_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}'
        
        # Make prediction with detailed analysis
        result = predictor.predict_single_patient(data, explain=True)
        
        # Add metadata for API consistency
        result.update({
            'status': 'success',
            'timestamp': pd.Timestamp.now().isoformat(),
            'endpoint': '/predict',
            'model_version': '1.0.0'
        })
        
        return jsonify(result)
        
    except ValueError as ve:
        return jsonify({
            'status': 'error',
            'message': f'Invalid data format: {str(ve)}',
            'required_format': 'JSON with patient features',
            'example': '/example'
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Prediction failed: {str(e)}',
            'timestamp': pd.Timestamp.now().isoformat(),
            'health_check': '/health'
        }), 500

@app.route('/predict_batch', methods=['POST'])
def predict_batch():
    """Predict hospital readmission for multiple patients"""
    try:
        data = request.get_json()
        
        if not data or 'patients' not in data:
            return jsonify({
                'status': 'error',
                'message': 'No patients data provided. Expected format: {"patients": [...]}',
                'required_format': 'JSON with patients array',
                'example': '/example'
            }), 400
        
        if not predictor or not predictor.is_loaded:
            return jsonify({
                'status': 'error',
                'message': 'Model not loaded. Please check server logs.',
                'health_check': '/health'
            }), 500
        
        patients = data['patients']
        
        if not isinstance(patients, list) or len(patients) == 0:
            return jsonify({
                'status': 'error',
                'message': 'Patients must be a non-empty array',
                'required_format': 'JSON with patients array'
            }), 400
        
        if len(patients) > 100:  # Limit batch size
            return jsonify({
                'status': 'error',
                'message': 'Batch size too large. Maximum 100 patients per request.',
                'current_size': len(patients),
                'max_size': 100
            }), 400
        
        results = []
        errors = []
        
        for i, patient_data in enumerate(patients):
            try:
                # Add patient_id if not provided
                if 'patient_id' not in patient_data:
                    patient_data['patient_id'] = f'Batch_Patient_{i}_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}'
                
                # Make prediction with analysis
                result = predictor.predict_single_patient(patient_data, explain=True)
                result['batch_index'] = i
                results.append(result)
                
            except Exception as e:
                # Add error result
                error_result = {
                    'patient_id': patient_data.get('patient_id', f'Batch_Patient_{i}'),
                    'batch_index': i,
                    'readmission_probability': None,
                    'prediction_optimal_threshold': -1,
                    'prediction_default_threshold': -1,
                    'risk_level': 'ERROR',
                    'clinical_recommendation': f'Error in prediction: {str(e)}',
                    'optimal_threshold_used': predictor.optimal_threshold,
                    'status': 'error',
                    'message': str(e),
                    'error_type': type(e).__name__
                }
                results.append(error_result)
                errors.append(error_result)
        
        response_data = {
            'status': 'success',
            'timestamp': pd.Timestamp.now().isoformat(),
            'endpoint': '/predict_batch',
            'total_patients': len(patients),
            'successful_predictions': len([r for r in results if r.get('status') != 'error']),
            'failed_predictions': len(errors),
            'success_rate': f"{(len([r for r in results if r.get('status') != 'error']) / len(patients)) * 100:.1f}%",
            'results': results,
            'summary': {
                'high_risk': len([r for r in results if r.get('risk_level', '').startswith('🔴') or r.get('risk_level', '').startswith('🟠')]),
                'moderate_risk': len([r for r in results if r.get('risk_level', '').startswith('🟡')]),
                'low_risk': len([r for r in results if r.get('risk_level', '').startswith('🟢')]),
                'errors': len(errors)
            }
        }
        
        return jsonify(response_data)
        
    except ValueError as ve:
        return jsonify({
            'status': 'error',
            'message': f'Invalid data format: {str(ve)}',
            'required_format': 'JSON with patients array'
        }), 400
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Batch prediction failed: {str(e)}',
            'timestamp': pd.Timestamp.now().isoformat(),
            'health_check': '/health'
        }), 500

@app.route('/upload_predict', methods=['POST'])
def upload_predict():
    """File upload and prediction endpoint"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'status': 'error',
                'message': 'No file uploaded',
                'required_format': 'CSV, Excel file with patient data',
                'supported_formats': ['.csv', '.xls', '.xlsx']
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'status': 'error',
                'message': 'No file selected'
            }), 400
        
        # Validate file type
        allowed_extensions = ['.csv', '.xls', '.xlsx']
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        if file_extension not in allowed_extensions:
            return jsonify({
                'status': 'error',
                'message': f'Invalid file type. Allowed: {", ".join(allowed_extensions)}',
                'uploaded_file': file.filename,
                'file_extension': file_extension
            }), 400
        
        # Read file based on type
        try:
            if file_extension == '.csv':
                df = pd.read_csv(file)
            elif file_extension in ['.xls', '.xlsx']:
                df = pd.read_excel(file)
            
            # Basic validation
            if df.empty:
                return jsonify({
                    'status': 'error',
                    'message': 'File is empty or contains no data'
                }), 400
            
            if len(df) > 1000:  # Limit file size
                return jsonify({
                    'status': 'error',
                    'message': 'File too large. Maximum 1000 patients per file.',
                    'current_size': len(df),
                    'max_size': 1000
                }), 400
            
            # Convert to list of dictionaries for batch processing
            patients = df.to_dict('records')
            
            # Process predictions
            results = []
            errors = []
            
            for i, patient_data in enumerate(patients):
                try:
                    # Add patient_id if not provided
                    if 'patient_id' not in patient_data:
                        patient_data['patient_id'] = f'File_Patient_{i}_{pd.Timestamp.now().strftime("%Y%m%d_%H%M%S")}'
                    
                    # Make prediction with explanations enabled so users can see reasons
                    result = predictor.predict_single_patient(patient_data, explain=True)
                    result['file_index'] = i
                    results.append(result)
                    
                except Exception as e:
                    error_result = {
                        'patient_id': patient_data.get('patient_id', f'File_Patient_{i}'),
                        'file_index': i,
                        'readmission_probability': None,
                        'prediction_optimal_threshold': -1,
                        'prediction_default_threshold': -1,
                        'risk_level': 'ERROR',
                        'clinical_recommendation': f'Error in prediction: {str(e)}',
                        'optimal_threshold_used': predictor.optimal_threshold,
                        'status': 'error',
                        'message': str(e),
                        'error_type': type(e).__name__
                    }
                    results.append(error_result)
                    errors.append(error_result)
            
            response_data = {
                'status': 'success',
                'timestamp': pd.Timestamp.now().isoformat(),
                'endpoint': '/upload_predict',
                'filename': file.filename,
                'file_size': len(df),
                'file_type': file_extension,
                'total_patients': len(patients),
                'successful_predictions': len([r for r in results if r.get('status') != 'error']),
                'failed_predictions': len(errors),
                'success_rate': f"{(len([r for r in results if r.get('status') != 'error']) / len(patients)) * 100:.1f}%",
                'results': results,
                'summary': {
                    'high_risk': len([r for r in results if r.get('risk_level', '').startswith('🔴') or r.get('risk_level', '').startswith('🟠')]),
                    'moderate_risk': len([r for r in results if r.get('risk_level', '').startswith('🟡')]),
                    'low_risk': len([r for r in results if r.get('risk_level', '').startswith('🟢')]),
                    'errors': len(errors)
                }
            }
            
            return jsonify(response_data)
            
        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Error reading file: {str(e)}',
                'file_type': file_extension,
                'supported_formats': ['.csv', '.xls', '.xlsx']
            }), 400
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'File upload failed: {str(e)}',
            'timestamp': pd.Timestamp.now().isoformat()
        }), 500

@app.route('/example', methods=['GET'])
def get_example():
    """Get example patient data"""
    example_patient = {
        'patient_id': 'EXAMPLE_001',
        'age': 75,
        'time_in_hospital': 8,
        'num_lab_procedures': 65,
        'num_procedures': 4,
        'num_medications': 22,
        'number_diagnoses': 10,
        'metformin': 1,
        'insulin': 1,
        'change': 1,
        'diabetesMed': 1,
        'glimepiride': 1,
        'pioglitazone': 1,
        'repaglinide': 0,
        'glyburide': 0
    }
    
    return jsonify({
        'status': 'success',
        'timestamp': pd.Timestamp.now().isoformat(),
        'endpoint': '/example',
        'example_patient': example_patient,
        'description': 'This is an example patient data structure for testing the prediction endpoint.',
        'note': 'Please ensure all required features are included based on your model requirements.',
        'usage': 'Use this data structure as a template for POST /predict requests',
        'feature_descriptions': {
            'age': 'Patient age in years',
            'time_in_hospital': 'Length of hospital stay in days',
            'num_lab_procedures': 'Number of lab procedures performed',
            'num_procedures': 'Number of procedures performed',
            'num_medications': 'Number of medications prescribed',
            'number_diagnoses': 'Number of diagnoses',
            'metformin': 'Whether patient is on metformin (0/1)',
            'insulin': 'Whether patient is on insulin (0/1)',
            'change': 'Whether medications were changed (0/1)',
            'diabetesMed': 'Whether patient is on diabetes medication (0/1)',
            'glimepiride': 'Whether patient is on glimepiride (0/1)',
            'pioglitazone': 'Whether patient is on pioglitazone (0/1)',
            'repaglinide': 'Whether patient is on repaglinide (0/1)',
            'glyburide': 'Whether patient is on glyburide (0/1)'
        }
    })

@app.route('/model_info', methods=['GET'])
def get_model_info():
    """Get information about the loaded model"""
    try:
        if not predictor or not predictor.is_loaded:
            return jsonify({
                'status': 'error',
                'message': 'Model not loaded',
                'health_check': '/health'
            }), 500
        
        info = {
            'status': 'success',
            'timestamp': pd.Timestamp.now().isoformat(),
            'endpoint': '/model_info',
            'model_type': type(predictor.model).__name__,
            'optimal_threshold': predictor.optimal_threshold,
            'model_path': predictor.model_path,
            'is_loaded': predictor.is_loaded,
            'model_loaded_at': pd.Timestamp.now().isoformat()
        }
        
        if hasattr(predictor.model, 'n_features_in_'):
            info['expected_features'] = predictor.model.n_features_in_
        
        if predictor.feature_names:
            info['feature_names'] = predictor.feature_names
        
        # Add model performance metrics if available
        if hasattr(predictor.model, 'feature_importances_'):
            info['has_feature_importance'] = True
            info['top_features'] = list(predictor.feature_names[:10]) if predictor.feature_names else []
        else:
            info['has_feature_importance'] = False
        
        return jsonify(info)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to get model info: {str(e)}',
            'timestamp': pd.Timestamp.now().isoformat()
        }), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get API usage statistics and model performance metrics"""
    try:
        if not predictor or not predictor.is_loaded:
            return jsonify({
                'status': 'error',
                'message': 'Model not loaded',
                'health_check': '/health'
            }), 500
        
        stats = {
            'status': 'success',
            'timestamp': pd.Timestamp.now().isoformat(),
            'endpoint': '/stats',
            'model_info': {
                'type': type(predictor.model).__name__,
                'optimal_threshold': predictor.optimal_threshold,
                'features_expected': predictor.model.n_features_in_ if hasattr(predictor.model, 'n_features_in_') else 'Unknown'
            },
            'api_info': {
                'version': '1.0.0',
                'endpoints_available': 7,
                'uptime': 'Since model load',
                'supported_formats': ['JSON', 'CSV', 'Excel']
            },
            'performance_metrics': {
                'model_loaded': True,
                'prediction_capability': 'Single and Batch',
                'file_upload_support': True,
                'max_batch_size': 100,
                'max_file_size': 1000
            }
        }
        
        return jsonify(stats)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Failed to get stats: {str(e)}',
            'timestamp': pd.Timestamp.now().isoformat()
        }), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information"""
    return jsonify({
        'status': 'success',
        'message': '🏥 Healthcare Readmission Prediction API',
        'version': '1.0.0',
        'timestamp': pd.Timestamp.now().isoformat(),
        'endpoints': {
            'health': '/health - Check API health',
            'predict': '/predict - Single patient prediction',
            'predict_batch': '/predict_batch - Multiple patients prediction',
            'upload_predict': '/upload_predict - File upload and prediction',
            'example': '/example - Get example data structure',
            'model_info': '/model_info - Model information',
            'stats': '/stats - API statistics'
        },
        'documentation': 'Use /example to see data structure, then /predict for predictions',
        'health_check': '/health'
    })

if __name__ == '__main__':
    # Load models on startup
    if load_models():
        print("🏥 Healthcare Readmission Prediction API is starting...")
        print(f"   Model: {type(predictor.model).__name__}")
        print(f"   Optimal Threshold: {predictor.optimal_threshold}")
        print("   Server running on http://0.0.0.0:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("❌ Failed to load models. Please check the model files.")
        print("   Expected model file: best_healthcare_model_aggressive_smote_RF_ExtremeRecall.pkl")