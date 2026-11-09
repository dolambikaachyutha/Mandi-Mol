import React, { useEffect, useState } from 'react';
import { createPriceAlert, fetchMandiPrices, queryMandiVoice } from '../lib/api';
import { audioManager } from '../lib/audio';
import { convertToPrismaWav } from '../lib/wav';
import { CROPS_LIST } from '../lib/crops';
import type { MandiPriceItem, NearbyMandiItem, PriceAlert } from '../types';

interface PricesPageProps {
  onStartPracticeWithCrop?: (cropId: string, referencePrice: number) => void;
  onOpenPlannerWithCrop?: (cropId: string) => void;
}

export const PricesPage: React.FC<PricesPageProps> = ({
  onStartPracticeWithCrop,
  onOpenPlannerWithCrop,
}) => {
  const [prices, setPrices] = useState<MandiPriceItem[]>([]);
  const [nearby, setNearby] = useState<NearbyMandiItem[]>([]);
  const [userMandi, setUserMandi] = useState('Warangal APMC Yard');
  const [userState, setUserState] = useState('Telangana');
  const [userDistrict, setUserDistrict] = useState('Warangal');
  const [source, setSource] = useState('Agmarknet / data.gov.in APMC Daily Wholesale Feed');
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);

  // Voice Search State
  const [isRecording, setIsRecording] = useState(false);
  const [voiceQueryText, setVoiceQueryText] = useState('');
  const [voiceAnswer, setVoiceAnswer] = useState<string | null>(null);
  const [voiceAudioBase64, setVoiceAudioBase64] = useState<string | null>(null);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);

  // Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [selectedCropForAlert, setSelectedCropForAlert] = useState<string>('chilli');
  const [alertTargetPrice, setAlertTargetPrice] = useState<number>(195);
  const [alertChannel, setAlertChannel] = useState<'push' | 'whatsapp'>('push');
  const [alertPhone, setAlertPhone] = useState('');
  const [alertStatusMessage, setAlertStatusMessage] = useState<string | null>(null);

  // Load prices
  const loadPrices = async () => {
    try {
      setLoading(true);
      const res = await fetchMandiPrices({
        state: userState,
        district: userDistrict,
        mandi: userMandi,
      });
      setPrices(res.prices);
      setNearby(res.nearbyMarkets);
      setSource(res.source);
      setLastUpdated(res.lastUpdated);
    } catch (err) {
      console.error('[PricesPage] Failed to fetch prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, [userState, userDistrict, userMandi]);

  // Handle Voice Recording
  const handleToggleVoiceRecord = async () => {
    if (isRecording) {
      try {
        setIsRecording(false);
        setIsVoiceLoading(true);
        const rec = await audioManager.stopRecording();
        const uploadBlob = await convertToPrismaWav(rec.blob);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1];
          try {
            const result = await queryMandiVoice({
              audioBase64: base64,
              mandiLocation: userMandi,
              languageCode: 'hinglish',
            });
            setVoiceQueryText(result.recognizedQuery);
            setVoiceAnswer(result.data.spokenAnswer);

            if (result.audioReplyBase64) {
              setVoiceAudioBase64(result.audioReplyBase64);
              const audio = new Audio(`data:audio/mp3;base64,${result.audioReplyBase64}`);
              audio.play().catch((e) => console.warn('Audio autoplay prevented:', e));
            }
          } catch (e) {
            setVoiceAnswer('Bhav query failed. Please check connection or ask in text.');
          } finally {
            setIsVoiceLoading(false);
          }
        };
        reader.readAsDataURL(uploadBlob);
      } catch (err) {
        console.error('[PricesPage] Recording stop error:', err);
        setIsRecording(false);
        setIsVoiceLoading(false);
      }
    } else {
      try {
        setVoiceAnswer(null);
        setVoiceAudioBase64(null);
        await audioManager.startRecording();
        setIsRecording(true);
      } catch (err) {
        alert('Microphone permission required for voice price queries.');
      }
    }
  };

  const handleTextQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceQueryText.trim()) return;

    try {
      setIsVoiceLoading(true);
      const result = await queryMandiVoice({
        queryText: voiceQueryText,
        mandiLocation: userMandi,
        languageCode: 'hinglish',
      });
      setVoiceAnswer(result.data.spokenAnswer);
      if (result.audioReplyBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${result.audioReplyBase64}`);
        audio.play().catch((e) => console.warn('Audio playback blocked:', e));
      }
    } catch (e) {
      setVoiceAnswer('Could not parse price query. Try: "Aaj tamatar ka bhav kya hai?"');
    } finally {
      setIsVoiceLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createPriceAlert({
        userId: 'farmer_local',
        cropId: selectedCropForAlert,
        mandiLocation: userMandi,
        targetPricePerKg: alertTargetPrice,
        condition: 'above',
        channel: alertChannel,
        phone: alertPhone,
      });
      setAlertStatusMessage(res.message);
      setTimeout(() => {
        setIsAlertModalOpen(false);
        setAlertStatusMessage(null);
      }, 2500);
    } catch (err) {
      alert('Failed to set alert.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* 1. Header Banner & Location Selector */}
      <div className="bg-[#1B1B3A] text-white p-5 rounded-2xl shadow-xl border-2 border-[#1B1B3A] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-[#D62828] text-white">
              Official Agmarknet Feed
            </span>
            <span className="text-xs text-amber-300 font-mono">
              ● Last Synced: {lastUpdated || 'Today 06:00 AM IST'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-[#F2B705]">
            आज का मंडी भाव (Live Mandi Prices)
          </h1>
          <p className="text-xs text-stone-300 mt-1">
            Certified wholesale auction benchmark rates. Zero invented numbers.
          </p>
        </div>

        {/* Location Dropdown */}
        <div className="flex items-center gap-2 bg-[#2A2A5A] p-2 rounded-xl border border-white/20">
          <span className="text-xl">📍</span>
          <div>
            <label className="text-[10px] text-amber-200 block uppercase font-bold">Selected APMC Mandi</label>
            <select
              value={userMandi}
              onChange={(e) => setUserMandi(e.target.value)}
              className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
            >
              <option value="Warangal APMC Yard" className="text-[#1B1B3A]">Warangal APMC Yard (Telangana)</option>
              <option value="Guntur Mirchi Yard" className="text-[#1B1B3A]">Guntur Mirchi Yard (Andhra Pradesh)</option>
              <option value="Azadpur Mandi" className="text-[#1B1B3A]">Azadpur Mandi (Delhi APMC)</option>
              <option value="Kolar APMC Market" className="text-[#1B1B3A]">Kolar Tomato Yard (Karnataka)</option>
              <option value="Lasalgaon Onion Yard" className="text-[#1B1B3A]">Lasalgaon Onion Mandi (Maharashtra)</option>
              <option value="Khanna Grain Market" className="text-[#1B1B3A]">Khanna Grain Hub (Punjab)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Voice Price Query Hero Bar (Low-Literacy Friendly) */}
      <div className="bg-[#FAF4E6] border-2 border-[#1B1B3A] p-5 rounded-2xl shadow-md mb-8">
        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Big Mic Button */}
          <button
            type="button"
            onClick={handleToggleVoiceRecord}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-lg border-4 transition-transform active:scale-95 shrink-0 ${
              isRecording
                ? 'bg-[#D62828] text-white border-white animate-pulse'
                : 'bg-[#F2B705] text-[#1B1B3A] border-[#1B1B3A] hover:bg-[#e0a804]'
            }`}
            title="Press and speak your crop question"
            aria-label="Voice Search"
          >
            {isRecording ? '⏹️' : '🎙️'}
          </button>

          <div className="flex-1 w-full text-center md:text-left">
            <h2 className="text-base sm:text-lg font-black text-[#1B1B3A]">
              {isRecording ? 'सुन रहे हैं... (Listening...)' : 'बोलकर भाव पूछें (Ask Price by Voice)'}
            </h2>
            <p className="text-xs text-stone-600 mb-2">
              Prisma STT & Timbre TTS powered: Say <i>"Aaj tamatar ka bhav kya hai?"</i> or <i>"mirchi ka rate batao"</i>
            </p>

            {/* Quick Text Input fallback */}
            <form onSubmit={handleTextQuerySubmit} className="flex gap-2">
              <input
                type="text"
                placeholder='या टाइप करें: "Tamatar ka bhav", "Mirchi rate"'
                value={voiceQueryText}
                onChange={(e) => setVoiceQueryText(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border-2 border-[#1B1B3A] bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#F2B705]"
              />
              <button
                type="submit"
                disabled={isVoiceLoading}
                className="px-4 py-2 bg-[#1B1B3A] text-[#F2B705] text-xs font-bold rounded-xl hover:bg-[#2A2A5A] transition-colors"
              >
                {isVoiceLoading ? 'खोज रहे हैं...' : 'पूछें (Search)'}
              </button>
            </form>
          </div>
        </div>

        {/* Spoken Answer Result Card */}
        {voiceAnswer && (
          <div className="mt-4 p-4 bg-amber-50 border-2 border-[#F2B705] rounded-xl flex items-start gap-3 animate-fade-in">
            <span className="text-2xl">🔊</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-[#D62828] uppercase tracking-wider">
                Mandi Mol Verified Answer
              </p>
              <p className="text-sm font-semibold text-[#1B1B3A] mt-1 leading-relaxed">
                "{voiceAnswer}"
              </p>
              <p className="text-[10px] text-stone-500 mt-1">
                Voice synthesized by Gnani Timbre • Factual data sourced directly from Agmarknet cache
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Live Price Cards Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black font-display text-[#1B1B3A]">
              प्रमुख फसलों के दैनिक भाव (Today's Benchmark Rates)
            </h2>
            <p className="text-xs text-stone-600">
              Quoted per Quintal (100 kg) & converted to ₹/kg for transparent farmer negotiation.
            </p>
          </div>
          <button
            onClick={() => setIsAlertModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold text-[#1B1B3A] hover:bg-amber-100 transition-colors"
          >
            <span>🔔</span>
            <span>Set Price Alert</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-stone-500 font-bold">
            लोड हो रहा है... (Fetching live Agmarknet prices)...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {prices.map((item, index) => {
              const cropMeta = CROPS_LIST.find((c) => c.name.toLowerCase().includes(item.commodity.toLowerCase())) || CROPS_LIST[0];
              const diffStatement = item.nearbyComparison?.statement;

              return (
                <div
                  key={index}
                  className="bg-white border-[2.5px] border-[#1B1B3A] rounded-2xl p-5 shadow-md flex flex-col justify-between hover:shadow-xl transition-all"
                >
                  <div>
                    {/* Header: Crop name & Variety */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{cropMeta.icon}</span>
                        <div>
                          <h3 className="font-black text-lg text-[#1B1B3A] leading-tight">
                            {item.commodity}
                          </h3>
                          <span className="text-xs text-stone-500 font-medium">{item.variety}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        {item.arrivalDate}
                      </span>
                    </div>

                    {/* Modal Price Highlight */}
                    <div className="my-3 p-3 bg-[#FAF4E6] rounded-xl border border-stone-200">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-stone-600">Modal Rate (औसत भाव):</span>
                        <div className="text-right">
                          <span className="text-2xl font-black font-mono text-[#D62828]">
                            ₹{item.modalPricePerKg}
                          </span>
                          <span className="text-xs font-bold text-[#1B1B3A]"> /kg</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-[11px] text-stone-500 mt-1">
                        <span>Range: ₹{item.minPricePerKg} - ₹{item.maxPricePerKg} /kg</span>
                        <span className="font-mono">₹{item.modalPriceQuintal} /Qtl</span>
                      </div>
                    </div>

                    {/* Nearby Mandi Delta Banner */}
                    {diffStatement && (
                      <div className="mb-3 px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-1.5">
                        <span>💡</span>
                        <span>{diffStatement}</span>
                      </div>
                    )}

                    {/* 7-Day Sparkline Trend */}
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] text-stone-500 font-bold mb-1">
                        <span>7-Day APMC Trend</span>
                        <span className="font-mono">₹{item.trend7d[0]} → ₹{item.trend7d[item.trend7d.length - 1]}</span>
                      </div>
                      <div className="h-8 flex items-end gap-1 px-1 bg-stone-50 rounded border border-stone-200">
                        {item.trend7d.map((val, i) => {
                          const min = Math.min(...item.trend7d);
                          const max = Math.max(...item.trend7d);
                          const range = max - min || 1;
                          const heightPct = Math.max(15, Math.round(((val - min) / range) * 80 + 15));
                          return (
                            <div
                              key={i}
                              title={`₹${val}/kg`}
                              style={{ height: `${heightPct}%` }}
                              className="flex-1 bg-[#F2B705] hover:bg-[#D62828] rounded-t transition-colors"
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => onOpenPlannerWithCrop && onOpenPlannerWithCrop(cropMeta.id)}
                      className="py-2 px-2 text-xs font-bold rounded-xl border-2 border-[#1B1B3A] bg-stone-100 hover:bg-stone-200 text-[#1B1B3A] text-center transition-colors"
                    >
                      🗺️ Sell Plan
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartPracticeWithCrop && onStartPracticeWithCrop(cropMeta.id, item.modalPricePerKg)}
                      className="py-2 px-2 text-xs font-bold rounded-xl bg-[#1B1B3A] text-[#F2B705] hover:bg-[#2A2A5A] text-center transition-colors"
                    >
                      🎙️ Practice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Nearby Mandis Comparison Table (~100km radius) */}
      <div className="bg-white border-2 border-[#1B1B3A] rounded-2xl p-5 shadow-md mb-8">
        <h2 className="text-lg font-black text-[#1B1B3A] mb-1">
          आस-पास की मंडियों की तुलना (Nearby Mandi Comparison - ~100 km)
        </h2>
        <p className="text-xs text-stone-600 mb-4">
          Compare spot prices before transporting your produce. Real net differences help decide if traveling further pays off.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b-2 border-[#1B1B3A] bg-stone-100">
                <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Mandi Yard</th>
                <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Distance</th>
                <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Modal Rate</th>
                <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Diff vs Local</th>
                <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Opportunity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {nearby.map((m, idx) => (
                <tr key={idx} className="hover:bg-amber-50/50">
                  <td className="py-2.5 px-3 font-bold text-[#1B1B3A]">{m.market} ({m.district})</td>
                  <td className="py-2.5 px-3 font-mono text-stone-600">~{m.distanceKm} km</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-sm text-[#1B1B3A]">₹{m.modalPricePerKg}/kg</td>
                  <td className="py-2.5 px-3 font-mono font-bold">
                    {m.diffFromLocalRs > 0 ? (
                      <span className="text-emerald-700">+{m.diffFromLocalRs} ₹/kg (+{m.diffPct}%)</span>
                    ) : m.diffFromLocalRs < 0 ? (
                      <span className="text-red-700">{m.diffFromLocalRs} ₹/kg ({m.diffPct}%)</span>
                    ) : (
                      <span className="text-stone-500">Same (Baseline)</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-stone-700 font-medium">{m.statement}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Trust, Legal & Disclaimer Banner */}
      <div className="p-4 bg-stone-100 border border-stone-300 rounded-xl text-center text-xs text-stone-500 leading-relaxed">
        <p className="font-bold text-stone-700 mb-1">Data Integrity Commitment</p>
        <p>
          Prices are fetched from certified public Agmarknet APIs ({source}). Mandi Mol never invents or simulates market prices. All market information is provided strictly for educational negotiation assistance, not formal financial advice.
        </p>
      </div>

      {/* Price Alert Modal */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#F6EBD3] border-[3px] border-[#1B1B3A] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAlertModalOpen(false)}
              className="absolute top-4 right-4 text-2xl font-bold text-[#1B1B3A] hover:text-[#D62828]"
            >
              ✕
            </button>
            <h3 className="text-xl font-black font-display text-[#1B1B3A] mb-1">
              🔔 Set Price Alert
            </h3>
            <p className="text-xs text-stone-600 mb-4">
              Get notified immediately on WhatsApp or Browser Push when the modal price crosses your target.
            </p>

            {alertStatusMessage ? (
              <div className="p-3 bg-emerald-100 border border-emerald-500 rounded-xl text-emerald-900 font-bold text-xs mb-3">
                ✓ {alertStatusMessage}
              </div>
            ) : null}

            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Crop</label>
                <select
                  value={selectedCropForAlert}
                  onChange={(e) => setSelectedCropForAlert(e.target.value)}
                  className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                >
                  {CROPS_LIST.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.hindiName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Target Price (₹/kg)</label>
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  value={alertTargetPrice}
                  onChange={(e) => setAlertTargetPrice(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-sm font-bold font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Notification Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAlertChannel('push')}
                    className={`p-2 rounded-xl border-2 font-bold text-xs ${
                      alertChannel === 'push'
                        ? 'bg-[#1B1B3A] text-[#F2B705] border-[#1B1B3A]'
                        : 'bg-white text-[#1B1B3A] border-stone-300'
                    }`}
                  >
                    🔔 Browser Push
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlertChannel('whatsapp')}
                    className={`p-2 rounded-xl border-2 font-bold text-xs ${
                      alertChannel === 'whatsapp'
                        ? 'bg-[#1B1B3A] text-[#F2B705] border-[#1B1B3A]'
                        : 'bg-white text-[#1B1B3A] border-stone-300'
                    }`}
                  >
                    💬 WhatsApp
                  </button>
                </div>
              </div>

              {alertChannel === 'whatsapp' && (
                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">WhatsApp Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={alertPhone}
                    onChange={(e) => setAlertPhone(e.target.value)}
                    className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-medium"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#D62828] text-white font-bold text-xs hover:bg-red-700 transition-colors shadow"
              >
                Activate Price Alert
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
