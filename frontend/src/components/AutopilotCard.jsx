import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, AlertCircle, Clock, HelpCircle } from 'lucide-react';
import api from '../api/axios';

const AutopilotCard = ({ suggestion }) => {
  const navigate = useNavigate();
  const [explanation, setExplanation] = useState(null);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const handleLaunch = () => {
    navigate('/campaigns/new', { state: { suggestion } });
  };

  const handleWhy = async () => {
    if (explanation) {
      setShowWhy(!showWhy);
      return;
    }
    setShowWhy(true);
    setLoadingExplain(true);
    try {
      const res = await api.post('/ai/segment-explain', {
        type: suggestion.type,
        title: suggestion.title,
        description: suggestion.description,
        audience_count: suggestion.audience_count,
        segment_rule: suggestion.segment_rule,
      });
      setExplanation(res.data.explanation);
    } catch {
      setExplanation(suggestion.description);
    } finally {
      setLoadingExplain(false);
    }
  };

  return (
    <div className="card p-4 flex flex-col justify-between border-l-4" style={{ borderLeftColor: suggestion.urgency === 'high' ? '#EF4444' : '#EAB308' }}>
      <div>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2 flex-wrap gap-1">
            {suggestion.urgency === 'high' ? (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-600 rounded flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> High Urgency
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-yellow-100 text-yellow-700 rounded flex items-center">
                <Clock className="w-3 h-3 mr-1" /> Medium
              </span>
            )}
            <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {suggestion.audience_count} users
            </span>
          </div>
        </div>

        <h4 className="font-semibold text-slate-800 text-base mb-1">{suggestion.title}</h4>
        <p className="text-sm text-slate-500 mb-2">{suggestion.description}</p>

        <button
          onClick={handleWhy}
          className="text-xs text-primary hover:text-orange-700 flex items-center gap-1 mb-3 font-medium transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Why this segment?
        </button>

        {showWhy && (
          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2.5 mb-3 italic leading-relaxed">
            {loadingExplain ? (
              <span className="flex items-center gap-2 not-italic text-slate-400">
                <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary" />
                AI is analyzing...
              </span>
            ) : (
              `"${explanation}"`
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleLaunch}
        className="w-full btn-primary text-sm flex items-center justify-center py-2"
      >
        <Rocket className="w-4 h-4 mr-2" />
        Launch Campaign
      </button>
    </div>
  );
};

export default AutopilotCard;
