"use client"; // If you plan to add interactivity later (animations, hooks)

import Link from "next/link"; 
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 p-6 md:p-12">
      <section className="max-w-5xl mx-auto">
        
        <header className="rounded-3xl p-8 md:p-12 bg-white dark:bg-slate-800 shadow-lg border dark:border-slate-700">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight text-indigo-600 dark:text-indigo-300">
            Hospital Readmission Prediction System
          </h1>
          <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">
            Helping hospitals reduce unplanned readmissions with AI.
          </p>
        </header>

        <section className="mt-10 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow border dark:border-slate-700">
          <h2 className="text-2xl font-bold">🏥 Project Introduction & Problem Statement</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Hospital readmissions are a major challenge in healthcare, leading to increased patient risk and billions of dollars in additional costs.
            This project, <strong>Hospital Readmission Prediction System</strong>, leverages Machine Learning to identify patients at high risk of being readmitted within 30 days.
            With early predictions, healthcare providers can improve patient care and reduce costs.
          </p>
        </section>

        <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border dark:border-slate-700">
            <h3 className="font-semibold">⚡ Predictive Analytics</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Uses advanced ML algorithms to forecast patient readmission risks.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border dark:border-slate-700">
            <h3 className="font-semibold">📊 Data-Driven Insights</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Helps doctors and administrators make informed decisions with real-time predictions.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border dark:border-slate-700">
            <h3 className="font-semibold">🔒 Secure & Scalable</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Designed with healthcare data sensitivity in mind, ensuring privacy while allowing scalability for large hospitals.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mt-10 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow border dark:border-slate-700">
          <h2 className="text-2xl font-bold">🎯 Our Mission</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            Our mission is to <strong>help hospitals and providers</strong> by offering an AI-powered tool that reduces avoidable readmissions, enhances patient outcomes, and decreases healthcare expenses.
          </p>
        </section>

        {/* How It Works */}
        <section className="mt-10 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow border dark:border-slate-700">
          <h2 className="text-2xl font-bold">🛠 How It Works</h2>
          <ul className="mt-3 list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
            <li><strong>Dataset:</strong> Hospital readmission dataset (e.g., UCI / Kaggle).</li>
            <li><strong>ML Models:</strong> Random Forest, XGBoost, Logistic Regression.</li>
            <li><strong>Tech Stack:</strong> Python, Flask API, Next.js frontend, Tailwind CSS, MySQL DB.</li>
            <li><strong>Metrics:</strong> Accuracy, Precision, Recall, F1, ROC-AUC.</li>
          </ul>
        </section>

        {/* Team */}
        <section className="mt-10">
          <h2 className="text-2xl font-bold">👨‍💻 Team</h2>
          <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow border dark:border-slate-700">
            <h3 className="font-semibold">Faizur Rahman</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Developer & Machine Learning Engineer</p>
            <ul className="mt-2 list-disc list-inside text-slate-600 dark:text-slate-300 text-sm">
              <li>Designed and trained ML models.</li>
              <li>Built Flask API for predictions.</li>
              <li>Developed Next.js frontend.</li>
            </ul>
          </div>
        </section>

        {/* Acknowledgements */}
        <section className="mt-10 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow border dark:border-slate-700">
          <h2 className="text-2xl font-bold">📚 Acknowledgements</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            <strong>Dataset:</strong> UCI / Kaggle.<br />
            <strong>Libraries:</strong> Pandas, NumPy, Scikit-learn, XGBoost, Flask, Next.js, Tailwind CSS.<br />
            Special thanks to mentors, professors, and open-source contributors.
          </p>
        </section>

        {/* Disclaimer */}
        <section className="mt-10 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow border dark:border-slate-700">
          <h2 className="text-2xl font-bold">⚖️ Disclaimer</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">
            This project is developed for <strong>academic research</strong>.  
            It is <strong>not a clinical tool</strong> and should not replace medical diagnosis or treatment.
          </p>
        </section>

        {/* Contact */}
        <section className="mt-10 bg-white dark:bg-slate-800 rounded-2xl p-8 shadow border dark:border-slate-700">
          <h2 className="text-2xl font-bold">📞 Contact</h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300">📧 Email: faizur@example.com</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">💻 GitHub: github.com/yourrepo</p>
          <p className="mt-1 text-slate-600 dark:text-slate-300">🔗 LinkedIn: linkedin.com/in/faizur</p>
          <Link href="/" className="mt-3 inline-block text-indigo-600 dark:text-indigo-300 underline">
            ← Back to Home
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-10 text-center text-xs text-slate-500">
          <div>© {new Date().getFullYear()} Hospital Readmission Project. All rights reserved.</div>
          <div>Built with ❤️ using Machine Learning & Next.js.</div>
        </footer>
      </section>
    </main>
  );
}
