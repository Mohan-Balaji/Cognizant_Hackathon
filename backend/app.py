from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os

app = Flask(__name__)
CORS(app)

# Load the trained model and related files
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'hospital_readmission_model.pkl')
COLUMNS_PATH = os.path.join(os.path.dirname(__file__), 'models', 'training_columns.pkl')
THRESHOLD_PATH = os.path.join(os.path.dirname(__file__), 'models', 'best_threshold.pkl')

# Global variables to store loaded models
model = MODEL_PATH
training_columns = COLUMNS_PATH
threshold = THRESHOLD_PATH

def load_models():
    """Load the trained model and related files"""
    global model, training_columns, threshold
    try:
        model = joblib.load(MODEL_PATH)
        training_columns = joblib.load(COLUMNS_PATH)
        threshold = joblib.load(THRESHOLD_PATH)
        print("Models loaded successfully")
        return True
    except Exception as e:
        print(f"Error loading models: {e}")
        return False

def simplify_age_group(age_range):
    """Simplify age groups"""
    if pd.isna(age_range): 
        return 'Other'
    if age_range in ['[0-10)','[10-20)','[20-30)','[30-40)','[40-50)']:
        return 'Young'
    elif age_range in ['[50-60)','[60-70)','[70-80)']:
        return 'Middle-aged'
    else:
        return 'Senior'

def simplify_diag(diag):
    """Simplify diagnosis categories"""
    if pd.isna(diag): 
        return 'Other'
    diag = str(diag).lower()
    if 'diabetes' in diag: 
        return 'Diabetes'
    if 'circulatory' in diag: 
        return 'Circulatory'
    if 'respiratory' in diag: 
        return 'Respiratory'
    return 'Other'

def predict_readmission_safe(patient_data):
    """Predict hospital readmission for a patient"""
    try:
        # Create DataFrame from patient data
        df_sample = pd.DataFrame([patient_data])

        # Feature engineering
        df_sample['num_diagnoses'] = df_sample[['diag_1','diag_2','diag_3']].count(axis=1)
        df_sample['total_med_procedures'] = df_sample['n_lab_procedures'] + df_sample['n_procedures']
        df_sample['med_to_stay_ratio'] = (df_sample['n_medications'] / df_sample['time_in_hospital']).replace([np.inf,-np.inf],0).fillna(0)

        # Simplify age
        df_sample['age_group_simplified'] = df_sample['age'].apply(simplify_age_group)

        # Simplify diag_1
        df_sample['diag_1'] = df_sample['diag_1'].apply(simplify_diag)

        # Drop unnecessary columns
        df_sample = df_sample.drop(['age','diag_2','diag_3'], axis=1)

        # Handle medical_specialty
        top_specialties = ['InternalMedicine','Other','Emergency/Trauma','Family/GeneralPractice',
                           'Cardiology','Surgery','Orthopedics','Radiology','Nephrology','Pulmonology']
        df_sample['medical_specialty'] = df_sample['medical_specialty'].apply(
            lambda x: x if x in top_specialties else 'Other'
        )

        # One-hot encode categorical variables
        categorical_cols = ['medical_specialty','diag_1','glucose_test','A1Ctest','change','diabetes_med','age_group_simplified']
        df_sample = pd.get_dummies(df_sample, columns=categorical_cols, drop_first=True)

        # Sanitize column names
        df_sample.columns = [str(col).replace('[','_').replace(']','_').replace('<','_').replace(',','_')
                             .replace('(','_').replace(')','_').replace(' ','_') for col in df_sample.columns]

        # Add missing columns and reorder
        for col in training_columns:
            if col not in df_sample.columns:
                df_sample[col] = 0
        df_sample = df_sample[training_columns]

        # Make prediction
        prob = model.predict_proba(df_sample)[:,1][0]
        pred_class = 1 if prob >= threshold else 0

        return {
            'predicted_class': int(pred_class),
            'readmission_probability': float(prob),
            'threshold': float(threshold),
            'status': 'success'
        }
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Predict hospital readmission endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Validate needed fields
        required_fields = [
            'age', 'time_in_hospital', 'n_lab_procedures', 'n_procedures', 
            'n_medications', 'n_outpatient', 'n_inpatient', 'n_emergency',
            'medical_specialty', 'diag_1', 'diag_2', 'diag_3', 'glucose_test',
            'A1Ctest', 'change', 'diabetes_med'
        ]
        
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {missing_fields}'
            }), 400
        
        # predicting 
        result = predict_readmission_safe(data)
        
        if result['status'] == 'error':
            return jsonify(result), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/example', methods=['GET'])
def get_example():
    """Get example patient data"""
    example_patient = {
        'age': '[70-80)',
        'time_in_hospital': 5,
        'n_lab_procedures': 40,
        'n_procedures': 1,
        'n_medications': 20,
        'n_outpatient': 0,
        'n_inpatient': 0,
        'n_emergency': 0,
        'medical_specialty': 'InternalMedicine',
        'diag_1': 'Circulatory',
        'diag_2': 'Other',
        'diag_3': 'Other',
        'glucose_test': 'normal',
        'A1Ctest': 'high',
        'change': 'Ch',
        'diabetes_med': 'Yes'
    }
    
    return jsonify({
        'example_patient': example_patient,
        'description': 'This is an example patient data structure for testing the prediction endpoint'
    })

if __name__ == '__main__':
    # Load models on startup
    if load_models():
        print("Hospital Readmission Prediction API is starting...")
        app.run(debug=True, host='0.0.0.0', port=5000)
    else:
        print("Failed to load models. Please check the model files.")
