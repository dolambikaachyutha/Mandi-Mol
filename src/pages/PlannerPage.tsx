import React, { useEffect, useState } from 'react';
import { fetchSellPlan } from '../lib/api';
import { CROPS_LIST } from '../lib/crops';
import type { SellPlanResponse } from '../types';

interface PlannerPageProps {
  initialCropId?: string;
  onStartPracticeWithPlan?: (cropId: string, referencePrice: number, floorPrice: number) => void;
}

export const PlannerPage: React.FC<PlannerPageProps> = ({
  initialCropId = 'chilli',
  onStartPracticeWithPlan,
}) => {
  const [selectedCropId, setSelectedCropId] = useState<string>(initialCropId);
  const [quantity, setQuantity] = useState<number>(10); // default 10 quintals
  const [unit, setUnit] = useState<'quintal' | 'kg'>('quintal');
  const [qualityGrade, setQualityGrade] = useState<string>('Grade A (Export / Premium Quality)');
  const [transportCostPerQuintal, setTransportCostPerQuintal] = useState<number>(35); // ₹35 / quintal baseline
  const [mandiFeePct, setMandiFeePct] = useState<number>(1.5); // 1.5% APMC cess
  const [hamaliPerBag, setHamaliPerBag] = useState<number>(12); // ₹12 / 50kg bag

  const [planResult, setPlanResult] = useState<SellPlanResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const calculatePlan = async () => {
    try {
      setLoading(true);
      const quantityKg = unit === 'quintal' ? quantity * 100 : quantity;
      const res = await fetchSellPlan({
        cropId: selectedCropId,
        quantityKg,
        grade: qualityGrade,
        transportCostPerQuintal,
        mandiFeePct,
        hamaliPerBag,
      });
      setPlanResult(res);
    } catch (err) {
      console.error('[PlannerPage] Failed to calculate sell plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculatePlan();
  }, [selectedCropId, quantity, unit, qualityGrade, transportCostPerQuintal, mandiFeePct, hamaliPerBag]);

  const selectedCrop = CROPS_LIST.find((c) => c.id === selectedCropId) || CROPS_LIST[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* Header */}
      <div className="bg-[#1B1B3A] text-white p-5 rounded-2xl shadow-xl border-2 border-[#1B1B3A] mb-6">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-[#F2B705] text-[#1B1B3A]">
            Pre-Trip Mandi Briefing
          </span>
          <span className="text-xs text-stone-300 font-mono">
            ● Code-Verified Logistics Arithmetic
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black font-display text-[#F2B705]">
          मंडी प्लानर (Sell Planner & Net-in-Hand Calculator)
        </h1>
        <p className="text-xs text-stone-300 mt-1">
          Know your true net-in-hand after transport, mandi cess, and hamali charges before loading the truck.
        </p>
      </div>

      {/* Grid: Inputs on Left, Plan Briefing on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Form Inputs */}
        <div className="bg-white border-2 border-[#1B1B3A] rounded-2xl p-5 shadow-md space-y-4">
          <h2 className="text-base font-black text-[#1B1B3A] border-b pb-2">
            ⚙️ Trip Parameters (अपनी यात्रा विवरण)
          </h2>

          {/* Crop Selector */}
          <div>
            <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Fasal (Crop)</label>
            <select
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-stone-50 font-bold text-xs"
            >
              {CROPS_LIST.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.hindiName})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Toggle */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-[#1B1B3A]">Produce Quantity</label>
              <div className="flex text-[10px] font-bold border rounded-lg overflow-hidden border-[#1B1B3A]">
                <button
                  type="button"
                  onClick={() => setUnit('quintal')}
                  className={`px-2 py-0.5 ${unit === 'quintal' ? 'bg-[#1B1B3A] text-white' : 'bg-white text-[#1B1B3A]'}`}
                >
                  Quintals (100 kg)
                </button>
                <button
                  type="button"
                  onClick={() => setUnit('kg')}
                  className={`px-2 py-0.5 ${unit === 'kg' ? 'bg-[#1B1B3A] text-white' : 'bg-white text-[#1B1B3A]'}`}
                >
                  Kg
                </button>
              </div>
            </div>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white font-mono font-bold text-sm"
            />
            <p className="text-[11px] text-stone-500 mt-1">
              Total weight: {unit === 'quintal' ? `${quantity * 100} kg` : `${(quantity / 100).toFixed(2)} Quintals`}
            </p>
          </div>

          {/* Quality Grade */}
          <div>
            <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Quality Grade (गुणवत्ता)</label>
            <select
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-stone-50 text-xs font-medium"
            >
              <option value="Grade A (Export / Premium Quality)">Grade A (Export / Premium Quality)</option>
              <option value="Grade B (Fair Average Quality - FAQ)">Grade B (Fair Average Quality - FAQ)</option>
              <option value="Grade C (Standard / Local Grade)">Grade C (Standard / Local Grade)</option>
            </select>
          </div>

          {/* Transport Cost */}
          <div>
            <label className="block text-xs font-bold text-[#1B1B3A] mb-1">
              Transport Cost (भाड़ा ₹ / Quintal)
            </label>
            <input
              type="number"
              min="0"
              step="5"
              value={transportCostPerQuintal}
              onChange={(e) => setTransportCostPerQuintal(Number(e.target.value))}
              className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white font-mono font-bold text-xs"
            />
            <span className="text-[10px] text-stone-500">Tractor/Mini-truck freight rate per 100 kg</span>
          </div>

          {/* Mandi Cess & Hamali */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-[#1B1B3A] mb-1">Mandi Fee (%)</label>
              <input
                type="number"
                step="0.5"
                value={mandiFeePct}
                onChange={(e) => setMandiFeePct(Number(e.target.value))}
                className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#1B1B3A] mb-1">Hamali (₹/Bag)</label>
              <input
                type="number"
                step="1"
                value={hamaliPerBag}
                onChange={(e) => setHamaliPerBag(Number(e.target.value))}
                className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Output Briefing */}
        <div className="lg:col-span-2 space-y-5">
          {loading ? (
            <div className="p-12 text-center text-stone-500 font-bold bg-white rounded-2xl border-2 border-[#1B1B3A]">
              प्लानिंग की गणना हो रही है (Calculating Net-in-Hand across Mandis)...
            </div>
          ) : planResult ? (
            <>
              {/* Highlight Cards: Best Mandi & Floor Price */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Best Market */}
                <div className="bg-[#FAF4E6] border-2 border-[#1B1B3A] p-4 rounded-2xl shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🏆</span>
                    <span className="text-xs font-bold uppercase text-[#D62828] tracking-wider">
                      Best Mandi Today (सर्वोत्तम मंडी)
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#1B1B3A]">{planResult.bestMarketToday}</h3>
                  <p className="text-xs text-stone-600 mt-1">
                    Yields the highest net pocket income after deducting all freight and mandi fees.
                  </p>
                </div>

                {/* Recommended Floor */}
                <div className="bg-[#1B1B3A] text-white p-4 rounded-2xl shadow border-2 border-[#1B1B3A]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">🛑</span>
                    <span className="text-xs font-bold uppercase text-amber-300 tracking-wider">
                      Do Not Sell Below Floor (न्यूनतम तल)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black font-mono text-[#F2B705]">
                      ₹{planResult.recommendedFloorPricePerKg}
                    </span>
                    <span className="text-sm text-stone-300">/kg</span>
                  </div>
                  <p className="text-[11px] text-stone-300 mt-1">
                    Based on recent APMC auction minimums. Walk away if initial offers fall below this.
                  </p>
                </div>
              </div>

              {/* Net-in-Hand Mandi Comparison Table */}
              <div className="bg-white border-2 border-[#1B1B3A] rounded-2xl p-5 shadow">
                <h3 className="text-sm font-black text-[#1B1B3A] mb-1">
                  मंडी अनुसार नेट कमाई तुलना (Net-in-Hand Comparison)
                </h3>
                <p className="text-xs text-stone-500 mb-3">
                  Gross Revenue minus Transport Freight, Mandi Cess ({mandiFeePct}%), and Hamali (₹{hamaliPerBag}/bag).
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-[#1B1B3A] bg-stone-100">
                        <th className="py-2 px-2.5 font-bold">Mandi Yard</th>
                        <th className="py-2 px-2.5 font-bold">Modal Rate</th>
                        <th className="py-2 px-2.5 font-bold">Freight & Fees</th>
                        <th className="py-2 px-2.5 font-bold">Net In Hand</th>
                        <th className="py-2 px-2.5 font-bold">Net / kg</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {planResult.mandiComparisons.map((m, idx) => (
                        <tr
                          key={idx}
                          className={m.isBestMarket ? 'bg-amber-50 font-bold border-l-4 border-l-[#D62828]' : ''}
                        >
                          <td className="py-2.5 px-2.5">
                            <div className="flex items-center gap-1.5">
                              {m.isBestMarket && <span className="text-xs">⭐</span>}
                              <span>{m.market}</span>
                            </div>
                            <span className="text-[10px] text-stone-500 font-normal">~{m.distanceKm} km away</span>
                          </td>
                          <td className="py-2.5 px-2.5 font-mono">₹{m.modalPricePerKg}/kg</td>
                          <td className="py-2.5 px-2.5 font-mono text-red-700">
                            -₹{(m.transportDeductionRs + m.mandiFeeDeductionRs + m.hamaliDeductionRs).toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2.5 font-mono font-black text-sm text-[#1B1B3A]">
                            ₹{m.netInHandTotalRs.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-2.5 font-mono text-emerald-800 font-bold">
                            ₹{m.netPerKgRs}/kg
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top 3 Likely Tricks & Counter-measures */}
              <div className="bg-white border-2 border-[#1B1B3A] rounded-2xl p-5 shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">⚠️</span>
                  <h3 className="text-sm font-black text-[#1B1B3A]">
                    इस मंडी में संभावित 3 चालें (Top 3 Likely Tricks at {planResult.bestMarketToday})
                  </h3>
                </div>

                <div className="space-y-3">
                  {planResult.topTricksAtMandi.map((t, idx) => (
                    <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 rounded-full bg-[#D62828] text-white flex items-center justify-center font-bold text-[11px]">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-[#1B1B3A]">{t.name}</span>
                      </div>
                      <p className="text-stone-600 mb-1.5 pl-7">{t.description}</p>
                      <div className="pl-7 text-emerald-800 font-bold flex items-start gap-1">
                        <span>🛡️ Counter:</span>
                        <span>{t.counterMeasure}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTA: Start Practice with this Floor */}
              <div className="p-4 bg-[#F2B705] border-2 border-[#1B1B3A] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div>
                  <h4 className="font-black text-[#1B1B3A] text-sm">
                    Ready to practice with this live floor price?
                  </h4>
                  <p className="text-xs text-[#1B1B3A]/80">
                    Simulate bargaining with a tough commission agent using ₹{planResult.recommendedFloorPricePerKg}/kg as your walkaway benchmark.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onStartPracticeWithPlan &&
                    onStartPracticeWithPlan(
                      selectedCropId,
                      planResult.mandiComparisons[0]?.modalPricePerKg || 188,
                      planResult.recommendedFloorPricePerKg
                    )
                  }
                  className="px-5 py-2.5 bg-[#1B1B3A] text-[#F2B705] font-bold text-xs rounded-xl hover:bg-[#2A2A5A] transition-colors shrink-0 shadow"
                >
                  🎙️ Start Practice Simulation
                </button>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
