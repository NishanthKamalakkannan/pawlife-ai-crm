import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wand2, Users, MessageSquare, Rocket, Sparkles, Smartphone, Mail, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CHAR_LIMITS = { sms: 160, whatsapp: 300, email: 2000 };

const NewCampaign = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const suggestion = location.state?.suggestion;

  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [isFindingAudience, setIsFindingAudience] = useState(false);
  const [audienceResult, setAudienceResult] = useState(null);
  const [message, setMessage] = useState('');
  const [isGeneratingMsg, setIsGeneratingMsg] = useState(false);
  const [channel, setChannel] = useState('whatsapp');
  const [campaignName, setCampaignName] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [launchedCampaignId, setLaunchedCampaignId] = useState(null);
  const [liveStats, setLiveStats] = useState(null);

  const loadAudienceFromRules = async (segmentRule, goalText) => {
    setIsFindingAudience(true);
    try {
      const res = await api.post('/segment/manual', segmentRule);
      setAudienceResult({
        owners: res.data.owners,
        count: res.data.count,
        filter_used: res.data.filter_used || segmentRule,
      });
      if (!campaignName) {
        setCampaignName(`Campaign: ${goalText.substring(0, 40)}`);
      }
      setStep(2);
    } catch (error) {
      toast.error('Failed to load autopilot audience');
      console.error(error);
    } finally {
      setIsFindingAudience(false);
    }
  };

  useEffect(() => {
    if (suggestion) {
      const goalText = suggestion.goal || `Find ${suggestion.description}`;
      setGoal(goalText);
      setChannel(suggestion.suggested_channel || 'whatsapp');
      if (suggestion.suggested_message) setMessage(suggestion.suggested_message);
      setCampaignName(`${suggestion.title} - ${new Date().toLocaleDateString()}`);
      if (suggestion.segment_rule) {
        loadAudienceFromRules(suggestion.segment_rule, goalText);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestion]);

  useEffect(() => {
    if (step !== 4 || !launchedCampaignId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/campaigns/${launchedCampaignId}`);
        setLiveStats(res.data.stats);
      } catch (e) {
        console.error(e);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [step, launchedCampaignId]);

  const quickTemplates = [
    { label: 'Reorder Reminder', prompt: "Find dog owners who haven't bought food in 25 days and send them a restock reminder" },
    { label: 'Birthday Campaign', prompt: 'Find pets with birthdays in the next 7 days and send a birthday offer' },
    { label: 'Win-Back Inactive', prompt: "Find customers who haven't ordered in 45 days and give them 20% off to come back" },
    { label: 'VIP Appreciation', prompt: "Find top spenders who haven't ordered in 20 days and offer exclusive early access" },
  ];

  const charLimit = CHAR_LIMITS[channel] || 300;
  const charCount = message.length;
  const charOverLimit = charCount > charLimit;

  const handleFindAudience = async () => {
    if (!goal) return toast.error('Please describe your goal');
    setIsFindingAudience(true);
    try {
      const res = await api.post('/segment/ai', { query: goal });
      setAudienceResult(res.data);
      if (!campaignName) setCampaignName(`Campaign: ${goal.substring(0, 30)}...`);
      setStep(2);
    } catch (error) {
      toast.error('Failed to find audience. Try being more specific.');
      console.error(error);
    } finally {
      setIsFindingAudience(false);
    }
  };

  const handleGenerateMessage = async () => {
    setIsGeneratingMsg(true);
    try {
      const sampleOwner = audienceResult?.owners[0] || {};
      const samplePet = sampleOwner.pets?.[0] || {};
      const res = await api.post('/ai/write-message', {
        goal,
        channel,
        sample_owner_name: sampleOwner.name || 'Priya',
        sample_pet_name: samplePet.pet_name || 'Bruno',
        sample_breed: samplePet.breed || 'Labrador',
        sample_product: 'Premium Food',
      });
      setMessage(res.data.message);
    } catch (error) {
      toast.error('Failed to generate message');
    } finally {
      setIsGeneratingMsg(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!campaignName || !message || !audienceResult) return toast.error('Missing required fields');

    setIsSavingDraft(true);
    try {
      await api.post('/campaigns', {
        name: campaignName,
        goal,
        message_template: message,
        channel,
        segment_rule: audienceResult.filter_used,
        audience_ids: audienceResult.owners.map(o => o._id),
      });
      toast.success('Campaign saved as draft');
      navigate('/campaigns');
    } catch {
      toast.error('Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleLaunch = async () => {
    if (!campaignName || !message || !audienceResult) return toast.error('Missing required fields');
    if (charOverLimit) return toast.error(`Message exceeds ${charLimit} character limit for ${channel}`);

    setIsLaunching(true);
    try {
      const campRes = await api.post('/campaigns', {
        name: campaignName,
        goal,
        message_template: message,
        channel,
        segment_rule: audienceResult.filter_used,
        audience_ids: audienceResult.owners.map(o => o._id),
      });
      const campaignId = campRes.data._id;
      await api.post(`/campaigns/${campaignId}/send`);
      setLaunchedCampaignId(campaignId);
      setLiveStats(campRes.data.stats);
      setStep(4);
      setTimeout(() => navigate(`/campaigns/${campaignId}`), 5000);
    } catch (error) {
      toast.error('Failed to launch campaign');
      setIsLaunching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Create New Campaign</h1>

      <div className="mb-8 relative">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-200">
          <div style={{ width: `${(step / 4) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary transition-all duration-500" />
        </div>
        <div className="flex justify-between text-xs font-medium text-slate-500">
          <span className={step >= 1 ? 'text-primary' : ''}>1. Audience</span>
          <span className={step >= 2 ? 'text-primary' : ''}>2. Message</span>
          <span className={step >= 3 ? 'text-primary' : ''}>3. Review</span>
          <span className={step === 4 ? 'text-primary' : ''}>4. Launch</span>
        </div>
      </div>

      {step === 1 && (
        <div className="card p-8 animate-fade-in">
          {isFindingAudience && suggestion ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
              <p className="text-slate-600 font-medium">AI is finding your audience from autopilot...</p>
              <p className="text-sm text-slate-400 mt-1">{suggestion.title}</p>
            </div>
          ) : (
          <>
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-primary mr-3" />
            <h2 className="text-xl font-bold text-slate-800">Define Your Goal</h2>
          </div>

          <textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={"Describe your campaign goal in plain English...\nExample: Find dog owners who haven't bought food in 25 days and send them a restock reminder"}
            className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none mb-4"
          />

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500 mb-3">Or choose a quick template:</p>
            <div className="flex flex-wrap gap-2">
              {quickTemplates.map((t, idx) => (
                <button key={idx} onClick={() => setGoal(t.prompt)} className="px-4 py-2 bg-slate-100 hover:bg-primary/10 text-slate-600 hover:text-primary rounded-lg text-sm font-medium transition-colors">
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleFindAudience} disabled={isFindingAudience || !goal} className="btn-primary flex items-center">
              {isFindingAudience ? (
                <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> AI is finding your audience...</>
              ) : (
                <><Wand2 className="w-4 h-4 mr-2" /> Find My Audience</>
              )}
            </button>
          </div>
          </>
          )}
        </div>
      )}

      {step === 2 && audienceResult && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-success/10 border border-success/20 p-4 rounded-xl flex items-start justify-between">
            <div>
              <h3 className="font-bold text-success flex items-center mb-1">
                <CheckCircle className="w-5 h-5 mr-2" /> Found {audienceResult.count} matching pet owners
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {Object.entries(audienceResult.filter_used || {}).map(([k, v]) => (
                  <span key={k} className="px-2 py-1 bg-white text-xs font-medium text-slate-600 rounded shadow-sm border border-slate-100">
                    {k}: {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                  </span>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-800 underline">Edit Goal</button>
          </div>

          <div className="card p-4 bg-slate-50 border-dashed">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Audience Preview</p>
            <div className="space-y-2">
              {audienceResult.owners.slice(0, 5).map((o, i) => (
                <div key={i} className="flex items-center text-sm text-slate-700">
                  <span className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mr-2">{o.name.charAt(0)}</span>
                  <span className="font-medium">{o.name}</span>
                  <span className="text-slate-400 mx-2">•</span>
                  <span className="text-slate-500">{o.pets?.[0]?.pet_name || 'Pet'}</span>
                </div>
              ))}
              {audienceResult.count > 5 && (
                <p className="text-xs text-slate-400 pt-1">+{audienceResult.count - 5} more owners</p>
              )}
            </div>
          </div>

          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <MessageSquare className="w-6 h-6 text-primary mr-3" />
                <h2 className="text-xl font-bold text-slate-800">Craft Your Message</h2>
              </div>
              <button onClick={handleGenerateMessage} disabled={isGeneratingMsg} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                {isGeneratingMsg ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {message ? 'Regenerate' : 'Generate with AI'}
              </button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message here... Use {owner_name} and {pet_name} as placeholders."
              className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none resize-none mb-2 text-slate-700"
            />
            <div className={`flex justify-end text-xs mb-6 ${charOverLimit ? 'text-red-500 font-medium' : charCount > charLimit * 0.9 ? 'text-orange-500' : 'text-slate-400'}`}>
              {charCount} / {charLimit} chars ({channel})
            </div>

            <h3 className="font-semibold text-slate-700 mb-3">Select Channel</h3>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, desc: 'Highest open rate' },
                { id: 'sms', name: 'SMS', icon: Smartphone, desc: 'Good for alerts' },
                { id: 'email', name: 'Email', icon: Mail, desc: 'Best for newsletters' },
              ].map(c => (
                <div key={c.id} onClick={() => setChannel(c.id)} className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${channel === c.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-300'}`}>
                  <c.icon className={`w-6 h-6 mb-2 ${channel === c.id ? 'text-primary' : 'text-slate-400'}`} />
                  <p className="font-bold text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="btn-secondary">Back</button>
              <button onClick={() => setStep(3)} disabled={!message || charOverLimit} className="btn-primary">Review Campaign</button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card p-8 animate-fade-in">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Review & Launch</h2>
          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
              <input type="text" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Audience</h4>
                <p className="text-3xl font-bold text-slate-800 mb-1">{audienceResult?.count}</p>
                <p className="text-sm text-slate-600">Pet owners selected</p>
                <div className="mt-4 flex items-center text-sm font-medium text-primary capitalize">
                  <Smartphone className="w-4 h-4 mr-1" /> via {channel}
                </div>
              </div>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="w-full max-w-[240px] bg-white rounded-2xl shadow-sm border border-slate-200 p-4 relative z-10 text-sm text-slate-700">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 mr-2 flex items-center justify-center text-[10px]">Paw</div>
                    <span className="font-semibold text-xs">PawLife</span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {message.replace('{owner_name}', audienceResult?.owners[0]?.name || 'Priya').replace('{pet_name}', audienceResult?.owners[0]?.pets?.[0]?.pet_name || 'Bruno')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-6 border-t border-slate-100">
            <button onClick={() => setStep(2)} className="btn-secondary">Back</button>
            <div className="flex gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft || isLaunching}
                className="btn-secondary px-6"
              >
                {isSavingDraft ? 'Saving...' : 'Save as Draft'}
              </button>
              <button onClick={handleLaunch} disabled={isLaunching || isSavingDraft} className="btn-primary text-lg px-8 py-3 flex items-center shadow-lg shadow-primary/30">
                {isLaunching ? (
                  <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" /> Sending to {audienceResult?.count} recipients...</>
                ) : (
                  <><Rocket className="w-5 h-5 mr-2" /> Launch Campaign</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="card p-12 text-center animate-fade-in flex flex-col items-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            {['🎉', '🐾', '✨', '🎊', '🐕'].map((emoji, i) => (
              <span key={i} className="absolute text-2xl animate-bounce" style={{ left: `${10 + i * 18}%`, top: `${10 + (i % 3) * 15}%`, animationDelay: `${i * 0.15}s` }}>{emoji}</span>
            ))}
          </div>
          <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mb-6 relative z-10">
            <CheckCircle className="w-12 h-12 text-success" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2 relative z-10">Campaign Launched! 🎉</h2>
          <p className="text-slate-500 mb-6 max-w-md mx-auto relative z-10">
            Dispatching to {audienceResult?.count} pet owners via {channel}.
          </p>
          {liveStats && (
            <div className="grid grid-cols-4 gap-4 mb-8 relative z-10">
              {[
                { label: 'Sent', value: liveStats.sent },
                { label: 'Delivered', value: liveStats.delivered },
                { label: 'Opened', value: liveStats.opened },
                { label: 'Clicked', value: liveStats.clicked },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="text-xl font-bold text-slate-800">{s.value || 0}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-100 px-4 py-2 rounded-full relative z-10">
            <div className="w-2 h-2 rounded-full bg-primary animate-ping mr-2" />
            Redirecting to live dashboard...
          </div>
        </div>
      )}
    </div>
  );
};

export default NewCampaign;
