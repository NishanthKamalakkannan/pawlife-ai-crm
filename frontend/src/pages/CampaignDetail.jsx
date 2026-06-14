import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Mail, Smartphone, CheckCircle, Eye, MousePointer, XCircle, Bot, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { formatDistanceToNow, format } from 'date-fns';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CampaignDetail = () => {
  const { id } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  const generateInsight = useCallback(async () => {
    setGeneratingInsight(true);
    try {
      const res = await api.post('/ai/campaign-insight', { campaign_id: id });
      setInsight(res.data.insight);
    } catch (error) {
      console.error('Error generating insight', error);
      toast.error('Could not generate AI insight');
    } finally {
      setGeneratingInsight(false);
    }
  }, [id]);

  const fetchCampaign = useCallback(async () => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      setCampaign(res.data);
      return res.data;
    } catch (error) {
      console.error('Error fetching campaign details', error);
      toast.error('Failed to load campaign');
      return null;
    }
  }, [id]);

  useEffect(() => {
    let interval;

    const init = async () => {
      setLoading(true);
      const [campData] = await Promise.all([
        fetchCampaign(),
        api.get('/campaigns').then(res => setAllCampaigns(res.data)).catch(() => {}),
      ]);
      setLoading(false);

      if (!campData) return;

      if (campData.status === 'sending') {
        interval = setInterval(async () => {
          const updated = await fetchCampaign();
          if (updated?.status === 'completed') {
            clearInterval(interval);
            generateInsight();
          }
        }, 5000);
      } else if (campData.status === 'completed') {
        generateInsight();
      }
    };

    init();
    return () => { if (interval) clearInterval(interval); };
  }, [id, fetchCampaign, generateInsight]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!campaign) {
    return <div className="text-center py-20 text-slate-500">Campaign not found</div>;
  }

  const getChannelIcon = (ch) => {
    switch (ch) {
      case 'whatsapp': return <MessageSquare className="w-5 h-5" />;
      case 'email': return <Mail className="w-5 h-5" />;
      case 'sms': return <Smartphone className="w-5 h-5" />;
      default: return <MessageSquare className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-success bg-success/10 border-success/20';
      case 'sending': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  const getMsgStatusBadge = (status) => {
    const styles = {
      delivered: 'bg-blue-100 text-blue-700',
      opened: 'bg-green-100 text-green-700',
      clicked: 'bg-orange-100 text-orange-700',
      failed: 'bg-red-100 text-red-700',
      sent: 'bg-slate-100 text-slate-700',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded capitalize ${styles[status] || 'bg-slate-100 text-slate-500'}`}>
        {status}
      </span>
    );
  };

  const stats = campaign.stats || {};
  const totalSent = stats.sent || 0;
  const openRate = totalSent > 0 ? Math.round((stats.opened || 0) / totalSent * 100) : 0;
  const clickRate = totalSent > 0 ? Math.round((stats.clicked || 0) / totalSent * 100) : 0;

  const prevCampaign = allCampaigns
    .filter(c => c._id !== campaign._id && c.status === 'completed' && new Date(c.created_at) < new Date(campaign.created_at))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  const prevSent = prevCampaign?.stats?.sent || 0;
  const prevOpenRate = prevSent > 0 ? Math.round((prevCampaign.stats.opened || 0) / prevSent * 100) : null;
  const prevClickRate = prevSent > 0 ? Math.round((prevCampaign.stats.clicked || 0) / prevSent * 100) : null;
  const openDelta = prevOpenRate != null ? openRate - prevOpenRate : null;
  const clickDelta = prevClickRate != null ? clickRate - prevClickRate : null;

  const chartData = [
    { name: 'Delivered', value: stats.delivered || 0, color: '#3B82F6' },
    { name: 'Opened', value: stats.opened || 0, color: '#22C55E' },
    { name: 'Clicked', value: stats.clicked || 0, color: '#F97316' },
    { name: 'Failed', value: stats.failed || 0, color: '#EF4444' },
  ].filter(d => d.value > 0);

  if (chartData.length === 0 && totalSent > 0) {
    chartData.push({ name: 'Sent', value: totalSent, color: '#94A3B8' });
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <Link to="/campaigns" className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Campaigns
      </Link>

      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{campaign.name}</h1>
          <div className="flex items-center text-sm text-slate-500 space-x-4">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(campaign.status)} flex items-center capitalize`}>
              {campaign.status === 'sending' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-ping" />}
              {campaign.status}
            </span>
            <span className="flex items-center capitalize">
              {getChannelIcon(campaign.channel)}
              <span className="ml-1.5">{campaign.channel}</span>
            </span>
            <span>Created {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}</span>
          </div>
          {prevCampaign && openDelta != null && campaign.status === 'completed' && (
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${
                openDelta >= 0 ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
              }`}>
                {openDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                Open rate {openRate}% — {openDelta >= 0 ? 'up' : 'down'} {Math.abs(openDelta)}% vs last campaign
              </span>
              {clickDelta != null && (
                <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${
                  clickDelta >= 0 ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-red-50 text-red-700 border-red-100'
                }`}>
                  Click rate {clickRate}% — {clickDelta >= 0 ? '+' : ''}{clickDelta}% vs last
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card p-5 mb-8 border-l-4 border-l-primary bg-orange-50/50">
        <div className="flex items-start">
          <div className="bg-primary/20 p-2 rounded-lg text-primary mr-4 mt-1">
            <Bot className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 mb-1">AI Campaign Insight</h3>
            {generatingInsight ? (
              <div className="flex items-center text-sm text-slate-500">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                Analyzing campaign performance...
              </div>
            ) : insight ? (
              <p className="text-slate-700 text-sm leading-relaxed">{insight}</p>
            ) : campaign.status === 'sending' ? (
              <p className="text-slate-500 text-sm">Insights will appear once the campaign completes.</p>
            ) : (
              <button onClick={generateInsight} className="text-sm text-primary font-medium hover:underline">Generate insight</button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="card p-4 bg-slate-50">
          <div className="flex items-center text-slate-500 mb-2 text-sm"><MessageSquare className="w-4 h-4 mr-1.5" /> Sent</div>
          <div className="text-2xl font-bold text-slate-800">{stats.sent || 0}</div>
          <div className="text-xs text-slate-400 mt-1">out of {stats.total}</div>
        </div>
        <div className="card p-4 border-blue-100">
          <div className="flex items-center text-blue-600 mb-2 text-sm"><CheckCircle className="w-4 h-4 mr-1.5" /> Delivered</div>
          <div className="text-2xl font-bold text-slate-800">{stats.delivered || 0}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">{totalSent > 0 ? Math.round(stats.delivered / totalSent * 100) : 0}% rate</div>
        </div>
        <div className="card p-4 border-green-100">
          <div className="flex items-center text-green-600 mb-2 text-sm"><Eye className="w-4 h-4 mr-1.5" /> Opened</div>
          <div className="text-2xl font-bold text-slate-800">{stats.opened || 0}</div>
          <div className="text-xs text-green-600 font-medium mt-1">{totalSent > 0 ? Math.round(stats.opened / totalSent * 100) : 0}% rate</div>
        </div>
        <div className="card p-4 border-orange-100">
          <div className="flex items-center text-orange-600 mb-2 text-sm"><MousePointer className="w-4 h-4 mr-1.5" /> Clicked</div>
          <div className="text-2xl font-bold text-slate-800">{stats.clicked || 0}</div>
          <div className="text-xs text-orange-600 font-medium mt-1">{totalSent > 0 ? Math.round(stats.clicked / totalSent * 100) : 0}% rate</div>
        </div>
        <div className="card p-4 border-red-100">
          <div className="flex items-center text-red-600 mb-2 text-sm"><XCircle className="w-4 h-4 mr-1.5" /> Failed</div>
          <div className="text-2xl font-bold text-slate-800">{stats.failed || 0}</div>
          <div className="text-xs text-red-600 font-medium mt-1">{totalSent > 0 ? Math.round(stats.failed / totalSent * 100) : 0}% rate</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="card p-6 flex flex-col justify-center items-center">
          <h3 className="font-bold text-slate-800 mb-4 self-start">Engagement Funnel</h3>
          <div className="w-full h-64">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">Awaiting delivery data...</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 card flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-bold text-slate-800">Message Log</h3>
            {campaign.status === 'sending' && (
              <span className="text-xs font-medium text-blue-600 flex items-center bg-blue-100 px-2 py-1 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse mr-1.5" />
                Live tracking active
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto max-h-[400px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 text-xs sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-5 py-3 font-medium">Owner</th>
                  <th className="px-5 py-3 font-medium">Pet</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaign.messages?.map((msg) => (
                  <tr key={msg._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{msg.owner_name || msg.phone}</td>
                    <td className="px-5 py-3 text-slate-600 capitalize">{msg.pet_name}</td>
                    <td className="px-5 py-3">{getMsgStatusBadge(msg.status)}</td>
                    <td className="px-5 py-3 text-right text-slate-500 text-xs">
                      {msg.updated_at ? format(new Date(msg.updated_at), 'HH:mm:ss') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetail;
