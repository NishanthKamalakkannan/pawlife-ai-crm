import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, X, Package, Calendar } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../api/axios';
import toast from 'react-hot-toast';
import PetOwnerRow from '../components/PetOwnerRow';

const CITIES = ['', 'Mumbai', 'Bangalore', 'Delhi', 'Chennai', 'Hyderabad', 'Pune'];
const PET_TYPES = ['', 'dog', 'cat'];

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    city: '',
    pet_type: '',
    breed: '',
    last_order_days_ago: '',
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setError(null);
    try {
      const params = {};
      if (filters.city) params.city = filters.city;
      if (filters.pet_type) params.pet_type = filters.pet_type;
      if (filters.breed) params.breed = filters.breed;
      if (filters.last_order_days_ago) params.last_order_days_ago = Number(filters.last_order_days_ago);

      const res = await api.get('/customers', { params });
      setCustomers(res.data);
    } catch (err) {
      console.error('Error fetching customers', err);
      setError('Could not load customers. Please try again.');
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    fetchCustomers();
  }, [fetchCustomers]);

  const viewCustomer = async (id) => {
    setSelectedCustomer(id);
    setProfileLoading(true);
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomerProfile(res.data);
    } catch (err) {
      console.error('Error fetching profile', err);
      toast.error('Failed to load customer profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    setSelectedCustomer(null);
    setCustomerProfile(null);
  };

  const clearFilters = () => {
    setFilters({ city: '', pet_type: '', breed: '', last_order_days_ago: '' });
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const restockClass = (status) => {
    if (status === 'overdue') return 'bg-red-50 border-red-100 text-red-800';
    if (status === 'due') return 'bg-orange-50 border-orange-100 text-orange-800';
    return 'bg-blue-50 border-blue-100 text-blue-800';
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto relative">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500 text-sm mt-1">
            Showing {filteredCustomers.length} of {customers.length} customers
          </p>
        </div>

        <div className="flex space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center text-sm ${showFilters ? 'ring-2 ring-primary/30' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" /> Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card p-4 mb-4 grid grid-cols-1 md:grid-cols-5 gap-4 items-end animate-fade-in">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">City</label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({ ...filters, city: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All cities</option>
              {CITIES.filter(Boolean).map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Pet type</label>
            <select
              value={filters.pet_type}
              onChange={(e) => setFilters({ ...filters, pet_type: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All pets</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Breed</label>
            <input
              type="text"
              placeholder="e.g. Labrador"
              value={filters.breed}
              onChange={(e) => setFilters({ ...filters, breed: e.target.value })}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Last order ≥ {filters.last_order_days_ago || 0} days ago
            </label>
            <input
              type="range"
              min="0"
              max="90"
              value={filters.last_order_days_ago || 0}
              onChange={(e) => setFilters({ ...filters, last_order_days_ago: e.target.value === '0' ? '' : e.target.value })}
              className="w-full"
            />
          </div>
          <button onClick={clearFilters} className="btn-secondary text-sm">Clear filters</button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchCustomers} className="text-red-800 font-medium underline">Retry</button>
        </div>
      )}

      <div className="card flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Owner</th>
                <th className="px-6 py-4 font-medium">City</th>
                <th className="px-6 py-4 font-medium">Pets</th>
                <th className="px-6 py-4 font-medium">Orders</th>
                <th className="px-6 py-4 font-medium">Spent</th>
                <th className="px-6 py-4 font-medium">Last Order</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400">Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-slate-400">No customers match your filters.</td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <PetOwnerRow key={customer._id} customer={customer} onView={viewCustomer} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex justify-end" onClick={closeProfile}>
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Customer Profile</h2>
              <button onClick={closeProfile} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {profileLoading || !customerProfile ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex items-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl mr-4">
                      {customerProfile.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">{customerProfile.name}</h3>
                      <p className="text-slate-500 text-sm mt-1">{customerProfile.city} • {customerProfile.email}</p>
                      <p className="text-slate-500 text-sm">{customerProfile.phone}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="bg-slate-100 p-1.5 rounded-lg mr-2">🐾</span>
                      Pets ({customerProfile.pets?.length || 0})
                    </h4>
                    <div className="grid gap-3">
                      {customerProfile.pets?.map(pet => (
                        <div key={pet.pet_id} className="border border-slate-100 rounded-xl p-4 bg-slate-50 flex items-start">
                          <div className="text-3xl mr-3">{pet.pet_type === 'dog' ? '🐕' : '🐈'}</div>
                          <div>
                            <p className="font-bold text-slate-800">{pet.pet_name}</p>
                            <p className="text-xs text-slate-500 capitalize">{pet.breed} • {pet.age_years} yrs</p>
                            <p className="text-xs text-slate-400 mt-1 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" /> B-day: {pet.birthday}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                      <span className="bg-slate-100 p-1.5 rounded-lg mr-2">📦</span>
                      Recent Orders
                    </h4>
                    {customerProfile.orders?.length > 0 ? (
                      <div className="border border-slate-100 rounded-xl overflow-hidden">
                        {customerProfile.orders.slice(0, 5).map((order, idx) => (
                          <div key={order._id} className={`p-4 ${idx !== 0 ? 'border-t border-slate-100' : ''} bg-white flex justify-between items-center`}>
                            <div className="flex items-start">
                              <Package className="w-4 h-4 text-slate-400 mt-0.5 mr-2" />
                              <div>
                                <p className="text-sm font-medium text-slate-800 line-clamp-1">{order.product_name}</p>
                                <p className="text-xs text-slate-500 capitalize">
                                  {order.product_category} • {format(new Date(order.ordered_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                            <span className="font-semibold text-slate-800 ml-4">₹{order.amount}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">No orders found.</p>
                    )}
                  </div>

                  {customerProfile.restock_prediction && (
                    <div className={`border rounded-xl p-4 ${restockClass(customerProfile.restock_prediction.status)}`}>
                      <h4 className="font-semibold text-sm mb-1">Restock Prediction</h4>
                      <p className="text-xs">{customerProfile.restock_prediction.message}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
