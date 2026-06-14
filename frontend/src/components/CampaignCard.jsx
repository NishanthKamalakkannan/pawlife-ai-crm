import { Link } from 'react-router-dom';
import { MessageCircle, Mail, Smartphone, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CampaignCard = ({ campaign }) => {
  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <Smartphone className="w-4 h-4" />;
      default: return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-medium bg-success/10 text-success border border-success/20 rounded-full">Completed</span>;
      case 'sending':
        return (
          <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-600 border border-blue-200 rounded-full flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-ping"></span>
            Sending
          </span>
        );
      default:
        return <span className="px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 rounded-full">Draft</span>;
    }
  };

  const stats = campaign.stats || {};
  const sent = stats.sent || 0;
  const opened = stats.opened || 0;
  const clicked = stats.clicked || 0;
  
  const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
  const clickRate = sent > 0 ? Math.round((clicked / sent) * 100) : 0;

  return (
    <div className="card p-5 hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-slate-800 text-lg mb-1">{campaign.name}</h3>
          <div className="flex items-center text-xs text-slate-500 space-x-3">
            <span className="flex items-center capitalize">
              {getChannelIcon(campaign.channel)}
              <span className="ml-1">{campaign.channel}</span>
            </span>
            <span>•</span>
            <span>{campaign.created_at ? formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true }) : 'Just now'}</span>
          </div>
        </div>
        {getStatusBadge(campaign.status)}
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-5 p-3 bg-slate-50 rounded-lg">
        <div>
          <p className="text-xs text-slate-500 mb-1">Sent</p>
          <p className="font-semibold text-slate-800">{sent}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Opened</p>
          <p className="font-semibold text-slate-800">{openRate}%</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Clicked</p>
          <p className="font-semibold text-slate-800">{clickRate}%</p>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Link 
          to={`/campaigns/${campaign._id}`}
          className="text-sm font-medium text-primary hover:text-orange-700 flex items-center transition-colors group-hover:translate-x-1 duration-200"
        >
          View Details <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default CampaignCard;
