"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/config";
import { 
  FiUpload, 
  FiFileText, 
  FiActivity, 
  FiTrendingUp, 
  FiUsers, 
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiDownload,
  FiBarChart,
  FiPieChart,
  FiTarget,
  FiEye
} from "react-icons/fi";

export default function Dashboard() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const dragOverTimeoutRef = useRef(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    highRisk: 0,
    moderateRisk: 0,
    lowRisk: 0
  });
  const [backendStatus, setBackendStatus] = useState('checking');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Check backend status on component mount
    checkBackendStatus();
  }, []);

  // Prevent browser from opening the file when dropped outside
  useEffect(() => {
    const preventDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);
    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const checkBackendStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (error) {
      setBackendStatus('error');
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      setError(null);
      setResults(null);
    } else {
      setError("Please select a valid CSV file");
      setSelectedFile(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Debounce hiding to avoid flicker between drag targets
    if (!isDragActive) setIsDragActive(true);
    if (dragOverTimeoutRef.current) clearTimeout(dragOverTimeoutRef.current);
    dragOverTimeoutRef.current = setTimeout(() => {
      setIsDragActive(false);
      setDragCounter(0);
    }, 250);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => {
      const next = c + 1;
      if (next > 0) setIsDragActive(true);
      return next;
    });
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((c) => {
      const next = Math.max(0, c - 1);
      if (next === 0) setIsDragActive(false);
      return next;
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(0);
    setIsDragActive(false);
    const dt = e.dataTransfer;
    if (!dt || !dt.files || dt.files.length === 0) return;
    const file = dt.files[0];
    if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
      setSelectedFile(file);
      setError(null);
      setResults(null);
    } else {
      setError("Please drop a valid CSV file");
      setSelectedFile(null);
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setUploadProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`${API_URL}/upload_predict`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setResults(data);
        setStats({
          totalPatients: data.total_patients,
          highRisk: data.summary.high_risk,
          moderateRisk: data.summary.moderate_risk,
          lowRisk: data.summary.low_risk
        });
      } else {
        throw new Error(data.message || 'Processing failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to process file');
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const downloadResults = () => {
    if (!results) return;
    exportAnalysis(results.results);
  };

  const convertResultsToCSV = (results) => {
    if (!results || results.length === 0) return '';
    
    const headers = Object.keys(results[0]).join(',');
    const rows = results.map(result => 
      Object.values(result).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  };

  // ----- Export helpers (XLSX preferred, CSV fallback) -----
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{1F900}-\u{1F9FF}\u{1F1E6}-\u{1F1FF}\u{2600}-\u{27BF}]/gu;

  const stripEmojis = (value) => {
    if (typeof value !== 'string') return value;
    return value.replace(emojiRegex, '');
  };

  const toPlainValue = (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return stripEmojis(value);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    // arrays or objects -> stable JSON string without emojis
    try {
      return JSON.stringify(value, (key, val) => {
        if (typeof val === 'string') return stripEmojis(val);
        return val;
      });
    } catch (_) {
      return String(value);
    }
  };

  const collectAllKeys = (rows) => {
    const keySet = new Set();
    rows.forEach((row) => Object.keys(row || {}).forEach((k) => keySet.add(k)));
    return Array.from(keySet);
  };

  const buildAOAFromResults = (rows) => {
    if (!rows || rows.length === 0) return [];
    const headers = collectAllKeys(rows);
    const aoa = [headers];
    rows.forEach((row) => {
      const line = headers.map((h) => toPlainValue(row[h]));
      aoa.push(line);
    });
    return aoa;
  };

  const exportAnalysis = async (rows) => {
    const data = buildAOAFromResults(rows);
    if (!data.length) return;

    // Try XLSX first
    try {
      const xlsx = await import('xlsx');
      const workbook = xlsx.utils.book_new();
      const worksheet = xlsx.utils.aoa_to_sheet(data);
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Analysis');
      const fileName = `healthcare_predictions_${new Date().toISOString().split('T')[0]}.xlsx`;
      xlsx.writeFile(workbook, fileName);
      return;
    } catch (err) {
      // Fallback to CSV if xlsx isn't available
    }

    // CSV fallback
    const csv = data.map((row) => row.map((cell) => {
      const v = cell == null ? '' : String(cell);
      const needsQuotes = v.includes(',') || v.includes('"') || v.includes('\n');
      const escaped = v.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    }).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthcare_predictions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/upload/sample_patients.csv');
      if (!response.ok) throw new Error('Template not found');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_patients.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (_) {
      const a = document.createElement('a');
      a.href = '/upload/sample_patients.csv';
      a.download = 'sample_patients.csv';
      a.click();
    }
  };

  const getRiskColor = (riskLevel) => {
    if (riskLevel.includes('🔴') || riskLevel.includes('🟠')) return 'text-red-600 bg-red-50';
    if (riskLevel.includes('🟡')) return 'text-yellow-600 bg-yellow-50';
    if (riskLevel.includes('🟢')) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getActionRequired = (riskLevel) => {
    if (riskLevel.includes('🔴')) return '🚨 IMMEDIATE: 24-72h follow-up';
    if (riskLevel.includes('🟠')) return '⚠️ URGENT: 1 week follow-up';
    if (riskLevel.includes('🟡')) return '📋 PRIORITY: 2 week follow-up';
    if (riskLevel.includes('🟢')) return '✅ ROUTINE: Standard care';
    return '📋 Standard follow-up';
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 border-t-transparent"></div>
    </div>
  );
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 font-MyFont">
                🏥 Clinical Decision Support System
              </h1>
              <p className="mt-2 text-gray-600 text-lg">
                AI-powered readmission risk assessment with actionable clinical recommendations
              </p>
            </div>
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                backendStatus === 'connected' ? 'bg-green-500' : 
                backendStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                backendStatus === 'connected' ? 'text-green-700' : 
                backendStatus === 'error' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {backendStatus === 'connected' ? 'System Online' : 
                 backendStatus === 'error' ? 'System Offline' : 'Initializing...'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-xl">
                <FiUsers className="h-7 w-7 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalPatients}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-xl">
                <FiAlertTriangle className="h-7 w-7 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Risk Cases</p>
                <p className="text-3xl font-bold text-red-600">{stats.highRisk}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-yellow-200 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <FiTarget className="h-7 w-7 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Moderate Risk</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.moderateRisk}</p>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
              <FiUpload className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-3">
              Clinical Data Analysis
            </h2>
            <p className="text-gray-600 mb-6 text-lg">
              Upload patient data for AI-powered risk assessment and actionable clinical recommendations
            </p>
            <div className="mb-6">
              <button 
                type="button"
                onClick={downloadTemplate}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiDownload className="h-5 w-5 mr-2" />
                Download Template
              </button>
              <p className="text-sm text-gray-500 mt-3">
                Use this sample file to test the clinical analysis system
              </p>
            </div>

            {backendStatus === 'error' && (
              <div className="mb-6 p-6 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <FiAlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800">System Connection Error</p>
                    <p className="text-xs text-red-700 mt-1">
                      Please ensure the clinical analysis server is running on http://localhost:5000
                    </p>
                    <div className="mt-3 text-xs text-red-600">
                      <p>To start the server:</p>
                      <ol className="list-decimal list-inside mt-1 space-y-1">
                        <li>Navigate to the backend directory</li>
                        <li>Run: <code className="bg-red-100 px-2 py-1 rounded">python app.py</code></li>
                        <li>Ensure all dependencies are installed</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-center w-full">
              <label 
                className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-blue-300'}`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex flex-col items-center justify-center pt-6 pb-6">
                  <FiFileText className="w-10 h-10 mb-3 text-blue-400" />
                  <p className="mb-2 text-sm text-blue-600">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-blue-500">CSV files only</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".csv"
                  onChange={handleFileSelect}
                  disabled={isProcessing || backendStatus !== 'connected'}
                />
              </label>
            </div>

            {selectedFile && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiFileText className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-900">
                      {selectedFile.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <FiX className="h-5 w-5 text-red-600 mr-2" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                onClick={processFile}
                disabled={!selectedFile || isProcessing || backendStatus !== 'connected'}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Analyzing Data...
                  </>
                ) : (
                  <>
                    <FiActivity className="h-5 w-5 mr-2" />
                    Analyze Patient Data
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="mt-6">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-3 text-center">
                  {uploadProgress < 100 ? 'Processing clinical data...' : 'Analysis complete!'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {results && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">
                Clinical Analysis Results
              </h2>
              <button
                onClick={downloadResults}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center shadow-md hover:shadow-lg"
              >
                <FiDownload className="h-4 w-4 mr-2" />
                Export Results
              </button>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <FiAlertTriangle className="h-6 w-6 text-red-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Critical & High Risk</p>
                    <p className="text-2xl font-bold text-red-900">{results.summary.high_risk}</p>
                    <p className="text-xs text-red-700">🔴🟠 Immediate attention needed</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center">
                  <FiTarget className="h-6 w-6 text-yellow-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Moderate Risk</p>
                    <p className="text-2xl font-bold text-yellow-900">{results.summary.moderate_risk}</p>
                    <p className="text-xs text-yellow-700">🟡 Close monitoring required</p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center">
                  <FiCheckCircle className="h-6 w-6 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Low Risk</p>
                    <p className="text-2xl font-bold text-green-900">{results.summary.low_risk}</p>
                    <p className="text-xs text-green-700">🟢 Standard care protocol</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Assessment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Clinical Recommendations
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action Required
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.results.slice(0, 10).map((result, index) => (
                    <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.patient_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(result.risk_level)}`}>
                          {result.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={result.clinical_recommendation}>
                          {result.clinical_recommendation}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={getActionRequired(result.risk_level)}>
                          {getActionRequired(result.risk_level)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <button
                          onClick={() => {
                            setSelectedPatient(result);
                            setShowDetailsModal(true);
                          }}
                          className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-colors duration-200"
                        >
                          <FiEye className="h-3 w-3 mr-1" />
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {results.results.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Showing first 10 results. Download the complete analysis above.
                </p>
              </div>
            )}

            {/* Clinical Insights Section */}
            <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <FiActivity className="h-5 w-5 text-blue-600 mr-2" />
                Clinical Decision Support
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Risk Level Interpretation</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">🔴</span>
                      <span><strong>CRITICAL:</strong> Immediate intervention required, 24-72 hour follow-up</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">🟠</span>
                      <span><strong>VERY HIGH:</strong> Urgent attention, 1 week follow-up</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">🟡</span>
                      <span><strong>HIGH:</strong> Priority monitoring, 2 week follow-up</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">🟢</span>
                      <span><strong>MODERATE/LOW:</strong> Standard care protocol</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">AI Model Confidence</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>This system uses advanced machine learning to analyze:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Patient demographics & medical history</li>
                      <li>Medication complexity & interactions</li>
                      <li>Hospital stay patterns & procedures</li>
                      <li>Comorbidity profiles & risk factors</li>
                    </ul>
                    <p className="mt-2 text-xs text-gray-600">
                      <strong>Note:</strong> AI predictions support clinical decision-making but should not replace professional medical judgment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Drag Overlay Popup */}
        {isDragActive && (
          <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-[1000] pointer-events-none backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-[90%] p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4">
                <FiUpload className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Drop your CSV here</h3>
              <p className="text-gray-600 mb-4">Release to upload. Only .csv files are accepted.</p>
              <div className="text-xs text-gray-500">Drag anywhere over the page to keep this open</div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Clinical Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 text-left group">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FiBarChart className="h-7 w-7 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Risk Analytics</p>
                  <p className="text-sm text-gray-600">Detailed patient risk analysis</p>
                </div>
              </div>
            </button>
            
            <button className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 text-left group">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FiPieChart className="h-7 w-7 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Risk Distribution</p>
                  <p className="text-sm text-gray-600">Patient risk breakdown</p>
                </div>
              </div>
            </button>
            
            <button className="p-6 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 text-left group">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <FiTrendingUp className="h-7 w-7 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="font-medium text-gray-900">Clinical Trends</p>
                  <p className="text-sm text-gray-600">Historical patterns</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Details Modal */}
        {showDetailsModal && selectedPatient && (
          <div
            className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center z-90 p-4"
            onClick={() => setShowDetailsModal(false)}
          >
            <div
              className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Clinical Analysis Details
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Patient ID: {selectedPatient.patient_id}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="space-y-6">
                  {/* Patient Summary */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FiActivity className="h-4 w-4 text-blue-600 mr-2" />
                      Risk Assessment Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Risk Level</p>
                        <p className="font-medium text-gray-900">{selectedPatient.risk_level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Probability</p>
                        <p className="font-medium text-gray-900">
                          {(selectedPatient.readmission_probability * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Action Required</p>
                        <p className="font-medium text-gray-900">{getActionRequired(selectedPatient.risk_level)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Recommendation */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <FiCheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      Clinical Recommendation
                    </h4>
                    <p className="text-gray-800 leading-relaxed">
                      {selectedPatient.clinical_recommendation}
                    </p>
                  </div>

                  {/* Detailed Explanation */}
                  {selectedPatient.explanation_text && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <FiBarChart className="h-4 w-4 text-yellow-600 mr-2" />
                        AI Model Explanation
                      </h4>
                      <div className="bg-white rounded-lg p-4 border border-yellow-200">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                          {selectedPatient.explanation_text}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Feature Contributions */}
                  {selectedPatient.feature_contributions && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <FiTrendingUp className="h-4 w-4 text-purple-600 mr-2" />
                        Key Contributing Factors
                      </h4>
                      <div className="space-y-3">
                        {selectedPatient.feature_contributions.slice(0, 5).map((contribution, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-purple-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">
                                {contribution.feature || contribution.feature_name}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                contribution.risk_impact === 'INCREASES' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {contribution.risk_impact}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">
                              {contribution.detailed_explanation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prediction Reasoning */}
                  {selectedPatient.prediction_reasoning && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <FiTarget className="h-4 w-4 text-red-600 mr-2" />
                        Clinical Decision Reasoning
                      </h4>
                      <div className="space-y-4">
                        {/* Primary Decision */}
                        <div className="bg-white rounded-lg p-3 border border-red-200">
                          <h5 className="font-medium text-gray-900 mb-2">Primary Decision</h5>
                          <p className="text-sm text-gray-700">
                            {selectedPatient.prediction_reasoning.primary_decision}
                          </p>
                        </div>

                        {/* Key Risk Factors */}
                        {selectedPatient.prediction_reasoning.key_risk_factors && selectedPatient.prediction_reasoning.key_risk_factors.length > 0 && (
                          <div className="bg-white rounded-lg p-3 border border-red-200">
                            <h5 className="font-medium text-gray-900 mb-2">Key Risk Factors</h5>
                            <div className="space-y-2">
                              {selectedPatient.prediction_reasoning.key_risk_factors.map((factor, index) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium text-red-700">{factor.factor}:</span>
                                  <span className="text-gray-700 ml-2">{factor.value}</span>
                                  <p className="text-gray-600 text-xs mt-1">{factor.explanation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Protective Factors */}
                        {selectedPatient.prediction_reasoning.protective_factors && selectedPatient.prediction_reasoning.protective_factors.length > 0 && (
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <h5 className="font-medium text-gray-900 mb-2">Protective Factors</h5>
                            <div className="space-y-2">
                              {selectedPatient.prediction_reasoning.protective_factors.map((factor, index) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium text-green-700">{factor.factor}:</span>
                                  <span className="text-gray-700 ml-2">{factor.value}</span>
                                  <p className="text-gray-600 text-xs mt-1">{factor.explanation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Clinical Interpretation */}
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                          <h5 className="font-medium text-gray-900 mb-2">Clinical Interpretation</h5>
                          <p className="text-sm text-gray-700">
                            {selectedPatient.prediction_reasoning.clinical_interpretation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
