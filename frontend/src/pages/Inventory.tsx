import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventoryStore } from '../store';
import { apiClient } from '../api/client';
import { getApiErrorMessage } from '../utils/errorMessage';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Plus, Loader } from 'lucide-react';

const getToday = () => format(new Date(), 'yyyy-MM-dd');

export const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { items, setItems, isLoading, setLoading } = useInventoryStore();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    food_name: '',
    quantity: '',
    unit: 'grams',
    expiry_date: getToday(),
    no_expiry_date: false,
  });

  React.useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getInventory();
      setItems(res.data);
    } catch (error: any) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.food_name || !formData.quantity || (!formData.no_expiry_date && !formData.expiry_date)) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const res = await apiClient.addInventoryItem({
        food_name: formData.food_name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        expiry_date: formData.no_expiry_date ? null : `${formData.expiry_date}T00:00:00`,
      });
      setItems([res.data, ...items]);
      setFormData({
        food_name: '',
        quantity: '',
        unit: 'grams',
        expiry_date: getToday(),
        no_expiry_date: false,
      });
      setShowForm(false);
      toast.success('Item added to inventory');
    } catch (error: any) {
      toast.error(getApiErrorMessage(error, 'Failed to add item'));
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm('Remove this item from inventory?')) return;
    try {
      await apiClient.deleteInventoryItem(itemId);
      setItems(items.filter(item => item.id !== itemId));
      toast.success('Item removed');
    } catch (error: any) {
      toast.error('Failed to remove item');
    }
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    return differenceInCalendarDays(parseISO(expiryDate), new Date());
  };

  const getExpiryColor = (days: number) => {
    if (days < 0) return 'text-forest/80 bg-mist';
    if (days === 0) return 'text-forest/80 bg-mist';
    if (days <= 3) return 'text-forest/80 bg-mist';
    if (days <= 7) return 'text-forest/80 bg-mist';
    return 'text-forest/80 bg-mist';
  };

  return (
    <div className="min-h-screen bg-mist p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-forest">Household Inventory</h1>
            <p className="text-forest/80 mt-1">Manage your available food items</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-forest hover:bg-forest/90 text-mist font-semibold py-3 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Add Item
          </button>
        </div>

        {/* Add Item Form */}
        {showForm && (
          <div className="bg-sage rounded-lg border border-sage p-6 mb-6">
            <h2 className="text-xl font-bold text-forest mb-4">Add New Item</h2>
            <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Food name"
                value={formData.food_name}
                onChange={(e) => setFormData({ ...formData, food_name: e.target.value })}
                className="px-4 py-2 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="px-4 py-2 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
              />
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="px-4 py-2 border border-sage rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/40"
              >
                <option>grams</option>
                <option>ml</option>
                <option>pieces</option>
                <option>cups</option>
                <option>tbsp</option>
              </select>
              <div className="space-y-2">
                <label htmlFor="expiry-date" className="block text-sm font-medium text-forest">
                  Expiry Date
                </label>
                <input
                  id="expiry-date"
                  type="date"
                  value={formData.expiry_date}
                  disabled={formData.no_expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="w-full rounded-lg border border-sage px-4 py-2 focus:outline-none focus:ring-2 focus:ring-forest/40 disabled:cursor-not-allowed disabled:bg-sage disabled:text-forest/50"
                />
                <label className="flex items-center gap-2 text-sm text-forest">
                  <input
                    type="checkbox"
                    checked={formData.no_expiry_date}
                    onChange={(e) => setFormData({ ...formData, no_expiry_date: e.target.checked })}
                    className="rounded border-sage"
                  />
                  No expiry date
                </label>
              </div>
              <div className="col-span-1 md:col-span-4 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-forest hover:bg-forest/90 text-mist font-semibold py-2 rounded-lg transition-colors"
                >
                  Add to Inventory
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-sage hover:bg-sage/80 text-forest font-semibold py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Inventory List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-forest/70" size={32} />
          </div>
        ) : items.length === 0 ? (
          <div className="bg-sage rounded-lg border border-sage p-12 text-center">
            <p className="text-forest/80 text-lg">No items in inventory yet.</p>
            <p className="text-forest/70">Add items to get meal recommendations based on what you have.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => {
              const daysUntilExpiry = item.expiry_date
                ? getDaysUntilExpiry(item.expiry_date)
                : null;
              return (
                <div key={item.id} className="bg-sage rounded-lg border border-sage p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-forest">{item.food_name}</h3>
                      <p className="text-sm text-forest/80">
                        {item.quantity} {item.unit}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-forest/50 hover:text-forest/70 transition-colors text-sm font-semibold"
                    >
                      ✕
                    </button>
                  </div>
                  {daysUntilExpiry === null ? (
                    <div className="inline-block rounded-full bg-sage px-3 py-1 text-sm font-semibold text-forest/80">
                      No expiry date
                    </div>
                  ) : (
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getExpiryColor(daysUntilExpiry)}`}>
                      {daysUntilExpiry < 0
                        ? 'Expired'
                        : daysUntilExpiry === 0
                          ? 'Expires today'
                          : `${daysUntilExpiry} days`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        {items.length > 0 && (
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => navigate('/generate-meal-prep')}
              className="flex-1 bg-forest hover:bg-forest/90 text-mist font-semibold py-3 rounded-lg transition-colors"
            >
              Generate Meal Recommendations
            </button>
            <button
              onClick={() => navigate('/calendar/daily')}
              className="flex-1 bg-forest hover:bg-forest/90 text-mist font-semibold py-3 rounded-lg transition-colors"
            >
              View Meal Calendar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;
