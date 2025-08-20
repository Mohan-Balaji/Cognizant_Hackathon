'use client'
import ProtectedRoute from './components/ProtectedRoute';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase/config';
import Link from 'next/link';

export default function Home() {
  const [user] = useAuthState(auth);

  const dashboardCards = [
    {
      title: 'Health Records',
      description: 'View and manage your medical records',
      icon: '📋',
      href: '/health-records',
      color: 'bg-blue-500',
    },
    {
      title: 'Appointments',
      description: 'Schedule and manage appointments',
      icon: '📅',
      href: '/appointments',
      color: 'bg-green-500',
    },
    {
      title: 'Medications',
      description: 'Track your medications and dosages',
      icon: '💊',
      href: '/medications',
      color: 'bg-purple-500',
    },
    {
      title: 'Analytics',
      description: 'View your health trends and insights',
      icon: '📊',
      href: '/analytics',
      color: 'bg-orange-500',
    },
  ];

  const quickActions = [
    { name: 'Add Health Record', href: '/health-records/add', icon: '➕' },
    { name: 'Book Appointment', href: '/appointments/book', icon: '📝' },
    { name: 'Update Medications', href: '/medications/update', icon: '💊' },
    { name: 'View Reports', href: '/reports', icon: '📄' },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Welcome Section */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.email?.split('@')[0] || 'User'}! 👋
                </h1>
                <p className="mt-2 text-gray-600 font-MyFont">
                  Here's an overview of your health journey today.
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Dashboard Cards */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Health Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {dashboardCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{card.title}</h3>
                      <p className="text-sm text-gray-600">{card.description}</p>
                    </div>  
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link
                  key={action.name}
                  href={action.href}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200 flex items-center space-x-3"
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="font-medium text-gray-900">{action.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Health Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📋</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Health record updated</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">📅</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Appointment scheduled</p>
                    <p className="text-xs text-gray-500">Yesterday</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">💊</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Medication reminder set</p>
                    <p className="text-xs text-gray-500">3 days ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Health Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Active Medications</span>
                  <span className="text-lg font-semibold text-gray-900">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Upcoming Appointments</span>
                  <span className="text-lg font-semibold text-gray-900">2</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Health Records</span>
                  <span className="text-lg font-semibold text-gray-900">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Days Since Last Checkup</span>
                  <span className="text-lg font-semibold text-gray-900">45</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}