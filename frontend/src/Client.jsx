import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientAPI, orderAPI } from './apis/api';
import { toast } from 'react-toastify';

const Client = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async (search = '') => {
    try {
      setLoading(true);
      const response = await clientAPI.getAllClients(search);
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to fetch clients');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchClients(searchTerm);
  };

  const deleteClient = async (clientId) => {
    if (window.confirm('Are you sure you want to delete this client? This will only work if they have no orders.')) {
      try {
        await clientAPI.deleteClient(clientId);
        toast.success('Client deleted successfully');
        fetchClients(searchTerm);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete client');
        console.error('Error:', error);
      }
    }
  };

  const downloadConsolidatedInvoice = async (clientId, clientName) => {
    try {
      const blob = await orderAPI.downloadConsolidatedInvoice(clientId, dateRange);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = dateRange.startDate && dateRange.endDate 
        ? `${dateRange.startDate}_to_${dateRange.endDate}`
        : 'all_orders';
      link.download = `consolidated-invoice-${clientName.replace(/\s+/g, '-')}-${dateStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Consolidated invoice downloaded successfully');
      setShowModal(false);
      setDateRange({ startDate: '', endDate: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to download consolidated invoice');
      console.error('Error:', error);
    }
  };

  const openConsolidatedInvoiceModal = (client) => {
    setSelectedClient(client);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

 return (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-gray-900">
            Clients
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your customers and their orders
          </p>
        </div>

        <button
          onClick={() => navigate('/create-client')}
          className="btn btn-success flex items-center justify-center gap-2 rounded-lg shadow-sm hover:shadow transition"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add New Client
        </button>
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-6 bg-gray-50 p-4 rounded-xl border">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, or phone"
          className="flex-1 rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 input-field"
        />
        <button onClick={handleSearch} className="btn btn-primary rounded-lg">
          Search
        </button>
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              fetchClients('');
            }}
            className="btn btn-secondary rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      {/* Clients Table */}
      {clients.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100 text-gray-600">
              <tr>
                {[
                  'Name',
                  'Contact',
                  'Total Orders',
                  'Total Spent',
                  'Last Order',
                  'Actions',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {clients.map((client) => (
                <tr
                  key={client._id}
                  className="transition-colors hover:bg-gray-50/70"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {client.name}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      {client.email || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {client.phone || 'N/A'}
                    </div>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {client.totalOrders}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                    ₹{client.totalSpent?.toFixed(2) || '0.00'}
                    <span className="text-xs text-gray-400 ml-1">INR</span>
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {client.lastOrderDate
                      ? new Date(
                          client.lastOrderDate
                        ).toLocaleDateString()
                      : 'Never'}
                  </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2 flex-wrap items-center">
                      <button
                        onClick={() =>
                          navigate(`/client/${client._id}`)
                        }
                        className="btn btn-primary btn-sm rounded-lg shadow-sm hover:shadow"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/create-order?clientId=${client._id}`
                          )
                        }
                        className="btn btn-success btn-sm rounded-lg shadow-sm hover:shadow"
                      >
                        New Order
                      </button>
                      <button
                        onClick={() =>
                          openConsolidatedInvoiceModal(client)
                        }
                        className="btn btn-secondary btn-sm rounded-lg shadow-sm hover:shadow"
                        disabled={client.totalOrders === 0}
                      >
                        Invoice
                      </button>
                      <button
                        onClick={() => deleteClient(client._id)}
                        className="btn btn-danger btn-sm rounded-lg shadow-sm hover:shadow"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed">
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <p className="mt-4 text-gray-500 text-base">
            No clients found. Add your first client to get started!
          </p>
        </div>
      )}
    </div>

    {/* Consolidated Invoice Modal */}
    {showModal && selectedClient && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
          <h3 className="text-xl font-semibold tracking-tight text-gray-900 mb-2">
            Download Consolidated Invoice
          </h3>
          <p className="text-gray-600 mb-4">
            Client: <strong>{selectedClient.name}</strong>
          </p>

          <div className="space-y-4">
            <div>
              <label className="label">Start Date (Optional)</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    startDate: e.target.value,
                  })
                }
                className="input-field rounded-lg"
              />
            </div>

            <div>
              <label className="label">End Date (Optional)</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) =>
                  setDateRange({
                    ...dateRange,
                    endDate: e.target.value,
                  })
                }
                className="input-field rounded-lg"
              />
            </div>

            <p className="text-sm text-gray-500">
              Leave dates empty to include all orders
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() =>
                downloadConsolidatedInvoice(
                  selectedClient._id,
                  selectedClient.name
                )
              }
              className="btn btn-success flex-1 rounded-lg shadow-sm hover:shadow"
            >
              Download
            </button>
            <button
              onClick={() => {
                setShowModal(false);
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="btn btn-secondary flex-1 rounded-lg shadow-sm hover:shadow"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
);
};

export default Client;