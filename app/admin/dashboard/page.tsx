// app/admin/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Utensils,
  Star,
  Clock
} from 'lucide-react';

interface DashboardStats {
  totalReservations: number;
  activeReservations: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalMenuItems: number;
  featuredItems: number;
  popularItems: any[];
  recentReservations: any[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    change, 
    color = 'blue' 
  }: { 
    title: string;
    value: string | number;
    icon: any;
    change?: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${
              change.startsWith('+') ? 'text-green-600' : 'text-red-600'
            }`}>
              {change} from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-100 text-${color}-600`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className=" p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mt-14 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your restaurant management dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Reservations"
          value={stats?.totalReservations || 0}
          icon={Calendar}
          color="blue"
          change="+12%"
        />
        <StatCard
          title="Active Reservations"
          value={stats?.activeReservations || 0}
          icon={Users}
          color="green"
          change="+8%"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats?.monthlyRevenue || 0}`}
          icon={DollarSign}
          color="orange"
          change="+15%"
        />
        <StatCard
          title="Menu Items"
          value={stats?.totalMenuItems || 0}
          icon={Utensils}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Items */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Popular Menu Items</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats?.popularItems?.map((item, index) => (
              <div key={item._id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <span className="text-orange-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${item.price}</p>
                  <p className="text-sm text-gray-500">{item.orderCount} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reservations */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Recent Reservations</h3>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {stats?.recentReservations?.map((reservation) => (
              <div key={reservation._id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{reservation.name}</p>
                  <p className="text-sm text-gray-500">{reservation.guests} guests</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{reservation.time}</p>
                  <p className="text-sm text-gray-500">{new Date(reservation.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}