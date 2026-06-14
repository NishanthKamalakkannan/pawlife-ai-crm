import { useState, useEffect } from 'react';
import { Users, Megaphone, MessageSquare, Eye, MapPin, PawPrint, Bot, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import toast from 'react-hot-toast';
import StatCard from '../components/StatCard';
import AutopilotCard from '../components/AutopilotCard';
import CampaignCard from '../components/CampaignCard';
import DashboardChat from '../components/DashboardChat';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayInsight, setTodayInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const fetchCoreData = async () => {
    setError(null);
    setStatsLoading(true);
    try {
      const [statsRes, campRes] = await Promise.all([
        api.get('/stats/overview'),
        api.get('/campaigns'),
      ]);
      setStats(statsRes.data);
      setCampaigns(campRes.data.slice(0, 5));
    } catch (err) {
      console.error('Error fetching dashboard data', err);
      setError('Could not load dashboard data.');
      toast.error('Failed to load dashboard');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    setSuggestionsLoading(true);
    try {
      const res = await api.get('/autopilot/suggestions');
      setSuggestions(res.data);
    } catch (err) {
      console.error('Error fetching suggestions', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const fetchTodayInsight = async () => {
    setInsightLoading(true);
    try {
      const res = await api.post('/ai/dashboard-insight');
      setTodayInsight(res.data.insight);
    } catch (err) {
      console.error('Error fetching today insight', err);
    } finally {
      setInsightLoading(false);
    }
  };

  useEffect(() => {
    fetchCoreData();
    fetchSuggestions();
    fetchTodayInsight();
  }, []);

  const chartData = campaigns.map(c => {
    const s = c.stats || {};
    return {
      name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
      Delivered: s.delivered || 0,
      Opened: s.opened || 0,
      Clicked: s.clicked || 0,
    };
  }).reverse();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Welcome back! 👋</h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your customers today.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={fetchCoreData} className="font-medium underline">Retry</button>
        </div>
      )}

      {/* Today's AI Insight — loads async, never blocks page */}
      <div className="card p-5 border-l-4 border-l-primary bg-gradient-to-r from-orange-50 to-white">
        <div className="flex items-start gap-3">
          <div className="bg-primary/15 p-2 rounded-lg text-primary shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-2">
              Today's Insight
              <Bot className="w-4 h-4 text-primary" />
            </h3>
            {insightLoading ? (
              <div className="flex items-center text-sm text-slate-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                Analyzing your customer base...
              </div>
            ) : (
              <p className="text-slate-700 text-sm leading-relaxed">{todayInsight}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse h-28 bg-slate-100" />
          ))
        ) : (
          <>
            <StatCard title="Total Pet Owners" value={stats?.total_customers?.toLocaleString() ?? '0'} icon={Users} trend={`${stats?.total_pets ?? 0} total pets`} />
            <StatCard title="Total Campaigns" value={stats?.total_campaigns?.toLocaleString() ?? '0'} icon={Megaphone} trend={`${stats?.campaigns_this_week ?? 0} this week`} />
            <StatCard title="Messages Sent" value={stats?.total_messages_sent?.toLocaleString() ?? '0'} icon={MessageSquare} trend={`${stats?.avg_click_rate?.toFixed(1) ?? 0}% avg click rate`} />
            <StatCard title="Avg Open Rate" value={`${stats?.avg_open_rate?.toFixed(1) ?? '0'}%`} icon={Eye} />
          </>
        )}
      </div>

      {!statsLoading && (stats?.top_city || stats?.most_common_breed) && (
        <div className="flex flex-wrap gap-4">
          <div className="card px-4 py-3 flex items-center text-sm text-slate-600">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            Top city: <span className="font-semibold text-slate-800 ml-1">{stats.top_city}</span>
          </div>
          <div className="card px-4 py-3 flex items-center text-sm text-slate-600">
            <PawPrint className="w-4 h-4 mr-2 text-primary" />
            Most common breed: <span className="font-semibold text-slate-800 ml-1">{stats.most_common_breed}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6 flex flex-col">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Recent Campaign Performance</h2>
          <div className="flex-1 min-h-[300px]">
            {statsLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                  <Bar dataKey="Delivered" fill="#22C55E" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="Opened" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="Clicked" fill="#F97316" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No campaign data yet — launch one from AI suggestions!</div>
            )}
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-none text-white shadow-xl">
          <div className="flex items-center mb-6">
            <span className="text-2xl mr-2">🤖</span>
            <h2 className="text-lg font-bold">AI Suggestions — Ready to Launch</h2>
          </div>
          <div className="space-y-4">
            {suggestionsLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/50" />
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.slice(0, 5).map((sugg, idx) => (
                <AutopilotCard key={sugg.type || idx} suggestion={sugg} />
              ))
            ) : (
              <div className="text-center py-10 text-slate-400 bg-slate-800/50 rounded-xl">
                <p>No actionable insights right now.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Campaigns</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!statsLoading && campaigns.length > 0 ? (
            campaigns.map(camp => <CampaignCard key={camp._id} campaign={camp} />)
          ) : statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse h-40 bg-slate-100" />
            ))
          ) : (
            <div className="col-span-full card p-10 text-center text-slate-500">
              No campaigns run yet. Launch one from the AI suggestions!
            </div>
          )}
        </div>
      </div>

      <DashboardChat />
    </div>
  );
};

export default Dashboard;
