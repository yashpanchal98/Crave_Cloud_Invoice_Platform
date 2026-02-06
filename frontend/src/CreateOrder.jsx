import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI, clientAPI } from './apis/api';
import { toast } from 'react-toastify';

const CreateOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('clientId');

  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    orderDate: new Date().toISOString().split('T')[0],
  });
  const [items, setItems] = useState([
    { foodPacket: '', quantity: 1, unitPrice: 0 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (preselectedClientId && clients.length > 0) {
      const client = clients.find(c => c._id === preselectedClientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [preselectedClientId, clients]);

  const fetchClients = async () => {
    try {
      const response = await clientAPI.getAllClients();
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to fetch clients');
      console.error('Error:', error);
    }
  };

  const handleClientChange = (e) => {
    const client = clients.find(c => c._id === e.target.value);
    setSelectedClient(client);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { foodPacket: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const calculateLineTotal = (quantity, unitPrice) => {
    return (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);
  };

  const calculateGrandTotal = () => {
    return items.reduce((total, item) => {
      return total + calculateLineTotal(item.quantity, item.unitPrice);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClient) {
      toast.error('Please select a client');
      return;
    }

    const validItems = items.filter(item => 
      item.foodPacket.trim() && item.quantity > 0 && item.unitPrice >= 0
    );

    if (validItems.length === 0) {
      toast.error('At least one valid item is required');
      return;
    }

    try {
      setLoading(true);
      const orderData = {
        clientId: selectedClient._id,
        clientName: selectedClient.name,
        orderDate: formData.orderDate,
        items: validItems.map(item => ({
          foodPacket: item.foodPacket,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice)
        }))
      };

      const response = await orderAPI.createOrder(orderData);
      toast.success('Order created successfully!');
      
      const blob = await orderAPI.downloadInvoice(response.data._id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${response.data.invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSelectedClient(null);
      setFormData({
        orderDate: new Date().toISOString().split('T')[0],
      });
      setItems([{ foodPacket: '', quantity: 1, unitPrice: 0 }]);

      setTimeout(() => navigate('/orders'), 1500);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create order');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Create New Order</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Client Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="label">Select Client *</label>
              <select
                value={selectedClient?._id || ''}
                onChange={handleClientChange}
                className="input-field"
                required
              >
                <option value="">-- Select a client --</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name} {client.email && `(${client.email})`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => navigate('/create-client')}
                className="text-sm text-indigo-600 hover:text-indigo-800 mt-2"
              >
                + Add New Client
              </button>
            </div>
            <div>
              <label className="label">Order Date *</label>
              <input
                type="date"
                name="orderDate"
                value={formData.orderDate}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
                className="input-field"
                required
              />
            </div>
          </div>

          {/* Selected Client Info */}
          {selectedClient && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-8">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">Client Information</h3>
              <div className="text-sm text-indigo-800">
                <p><strong>Name:</strong> {selectedClient.name}</p>
                {selectedClient.email && <p><strong>Email:</strong> {selectedClient.email}</p>}
                {selectedClient.phone && <p><strong>Phone:</strong> {selectedClient.phone}</p>}
                <p><strong>Total Orders:</strong> {selectedClient.totalOrders}</p>
                <p><strong>Total Spent:</strong> ₹{selectedClient.totalSpent?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          )}

          {/* Order Items Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Order Items</h3>
              <button
                type="button"
                onClick={addItem}
                className="btn btn-secondary flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {/* Item Number Badge */}
                    <div className="flex-shrink-0 mt-7">
                      <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                    </div>

                    {/* Item Fields */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-1">
                        <label className="label">Food Packet Name *</label>
                        <input
                          type="text"
                          value={item.foodPacket}
                          onChange={(e) => handleItemChange(index, 'foodPacket', e.target.value)}
                          placeholder="e.g., Biryani Pack"
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Quantity *</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          min="1"
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Unit Price (₹) *</label>
                        <input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          min="0"
                          step="0.01"
                          className="input-field"
                          required
                        />
                      </div>
                      <div>
                        <label className="label">Line Total (₹)</label>
                        <input
                          type="text"
                          value={calculateLineTotal(item.quantity, item.unitPrice).toFixed(2)}
                          disabled
                          className="input-field bg-gray-200 font-semibold"
                        />
                      </div>
                    </div>

                    {/* Remove Button */}
                    {items.length > 1 && (
                      <div className="flex-shrink-0 mt-7">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="btn btn-danger"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-semibold text-green-900">Grand Total:</span>
              <span className="text-4xl font-bold text-green-700">₹{calculateGrandTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              disabled={loading}
              className="btn btn-secondary w-full sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-success w-full sm:w-auto flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Order...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Create Order & Generate Invoice
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder;