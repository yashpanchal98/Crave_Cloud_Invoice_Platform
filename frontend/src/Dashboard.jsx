import React, { useState, useEffect } from 'react';
import { orderAPI } from './apis/api';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyStats();
  }, [selectedDate]);

  const fetchDailyStats = async () => {
    try {
      setLoading(true);
      const response = await orderAPI.getDailyStats(selectedDate);
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch daily statistics');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (orderId, invoiceNumber) => {
    try {
      const blob = await orderAPI.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to download invoice');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Daily Dashboard</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="input-field max-w-xs"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Total Orders</h3>
          <div className="text-4xl font-bold text-blue-900">{stats?.orderCount || 0}</div>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200">
          <h3 className="text-sm font-medium text-green-800 mb-2">Total Sales</h3>
          <div className="text-4xl font-bold text-green-900">₹{stats?.totalSales?.toFixed(2) || '0.00'}</div>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800 mb-2">Average Order Value</h3>
          <div className="text-4xl font-bold text-purple-900">
            ₹{stats?.orderCount > 0 
              ? (stats.totalSales / stats.orderCount).toFixed(2) 
              : '0.00'}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Today's Orders</h3>
        {stats?.orders && stats.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.clientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.items.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      ₹{order.grandTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => downloadInvoice(order._id, order.invoiceNumber)}
                      >
                        Download Invoice
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-4 text-gray-500">No orders found for this date.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;