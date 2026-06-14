import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import CampaignCard from '../components/CampaignCard';

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, sending, completed, draft

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await api.get('/campaigns');
        setCampaigns(res.data);
      } catch (error) {
        console.error("Error fetching campaigns", error);
        toast.error('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(c => filter === 'all' || c.status === filter);

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track your marketing campaigns</p>
        </div>
        
        <Link to="/campaigns/new" className="btn-primary flex items-center">
          <PlusCircle className="w-5 h-5 mr-2" />
          Create Campaign
        </Link>
      </div>

      <div className="flex space-x-2 mb-6 border-b border-slate-200 pb-px">
        {['all', 'sending', 'completed', 'draft'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              filter === f 
                ? 'border-primary text-primary' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.length > 0 ? (
            filteredCampaigns.map(camp => (
              <CampaignCard key={camp._id} campaign={camp} />
            ))
          ) : (
            <div className="col-span-full card p-16 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlusCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">No campaigns found</h3>
              <p className="text-slate-500 mb-6">You haven't created any campaigns with this status yet.</p>
              <Link to="/campaigns/new" className="btn-primary inline-flex">
                Create your first campaign
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Campaigns;
