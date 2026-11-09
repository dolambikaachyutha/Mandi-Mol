import React, { useEffect, useState } from 'react';
import { FileText, Building, Plus, Receipt, Download, TrendingDown, X, PlusCircle } from 'lucide-react';
import { fetchFpoAnalytics, fetchUserDeals, recordRealDeal } from '../lib/api';
import { CROPS_LIST } from '../lib/crops';
import { SaudaSlipModal } from '../components/deals/SaudaSlipModal';
import type { MonthlyImpactSummary, RealDeal } from '../types';

interface DealsLedgerPageProps {
  userId?: string;
}

export const DealsLedgerPage: React.FC<DealsLedgerPageProps> = ({ userId = 'farmer_local' }) => {
  const [deals, setDeals] = useState<RealDeal[]>([]);
  const [summary, setSummary] = useState<MonthlyImpactSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal & Receipt States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // New Deal Form State
  const [formCropId, setFormCropId] = useState('chilli');
  const [formMandi, setFormMandi] = useState('Warangal APMC Yard');
  const [formDealType, setFormDealType] = useState<'sold' | 'bought'>('sold');
  const [formQuantity, setFormQuantity] = useState(500); // 500 kg default
  const [formUnit, setFormUnit] = useState<'kg' | 'quintal'>('kg');
  const [formPricePerKg, setFormPricePerKg] = useState(190);
  const [formParty, setFormParty] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState('upi');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FPO Tab Toggle
  const [activeTab, setActiveTab] = useState<'ledger' | 'fpo'>('ledger');
  const [fpoData, setFpoData] = useState<any>(null);
  const [fpoLoading, setFpoLoading] = useState(false);

  const loadDeals = async () => {
    try {
      setLoading(true);
      const res = await fetchUserDeals(userId);
      setDeals(res.deals);
      setSummary(res.summary);
    } catch (err) {
      console.error('[DealsLedgerPage] Failed to fetch deals:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFpoAnalytics = async () => {
    try {
      setFpoLoading(true);
      const res = await fetchFpoAnalytics();
      setFpoData(res);
    } catch (err) {
      console.error('[DealsLedgerPage] Failed to load FPO analytics:', err);
    } finally {
      setFpoLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, [userId]);

  useEffect(() => {
    if (activeTab === 'fpo') {
      loadFpoAnalytics();
    }
  }, [activeTab]);

  const handleRecordDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const totalKg = formUnit === 'quintal' ? formQuantity * 100 : formQuantity;
      const res = await recordRealDeal({
        userId,
        cropId: formCropId,
        mandiLocation: formMandi,
        dealType: formDealType,
        quantityKg: totalKg,
        pricePerKg: formPricePerKg,
        buyerSellerName: formParty,
        paymentMode: formPaymentMode,
        notes: formNotes,
      });

      // Update state and display receipt
      setDeals((prev) => [res.deal, ...prev]);
      setSummary(res.summary);
      setIsAddModalOpen(false);
      setSelectedReceipt(res.receipt);
      setIsReceiptOpen(true);
    } catch (err) {
      alert(`Failed to save deal: ${err instanceof Error ? err.message : 'Error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenExistingReceipt = (deal: RealDeal) => {
    setSelectedReceipt({
      receiptNo: `SAUDA-${deal.crop_id.slice(0, 3).toUpperCase()}-${deal.deal_date.replace(/-/g, '')}`,
      dealId: deal.id,
      date: deal.deal_date,
      crop: deal.crop_id,
      mandi: deal.mandi_location,
      party: deal.buyer_seller_name,
      role: deal.deal_type === 'sold' ? 'Buyer (Commission Agent / Trader)' : 'Seller (Farmer)',
      quantityKg: deal.quantity_kg,
      quantityQuintal: Math.round((deal.quantity_kg / 100) * 100) / 100,
      ratePerKg: deal.agreed_price_per_kg,
      ratePerQuintal: deal.agreed_price_per_kg * 100,
      grossTotalRs: deal.total_gross_amount,
      paymentMode: deal.payment_mode,
      diffVsMarketTotalRs: deal.total_diff_vs_market_rs,
      disputeProofNotice: 'Standard APMC Mandi Sauda Slip. Generated for mutual trade record and transparency.',
    });
    setIsReceiptOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28">
      {/* 1. Header Banner */}
      <div className="bg-[#1B1B3A] text-white p-5 rounded-2xl shadow-xl border-2 border-[#1B1B3A] mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wider bg-[#F2B705] text-[#1B1B3A]">
              Module 4: Proof of Impact
            </span>
            <span className="text-xs text-stone-300 font-mono">● Real Market Deal Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-[#F2B705]">
            सौदा बही (Deal Ledger & Sauda Slip)
          </h1>
          <p className="text-xs text-stone-300 mt-1">
            Log real sales, track rupee gains vs Agmarknet modal benchmarks, and generate dispute-proof receipts.
          </p>
        </div>

        {/* Tab switch between Personal Ledger & FPO Aggregates */}
        <div className="flex bg-[#2A2A5A] p-1 rounded-xl border border-white/20 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'ledger' ? 'bg-[#F2B705] text-[#1B1B3A]' : 'text-stone-300 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Ledger</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('fpo')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === 'fpo' ? 'bg-[#F2B705] text-[#1B1B3A]' : 'text-stone-300 hover:text-white'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>FPO Dashboard (5+ Users)</span>
          </button>
        </div>
      </div>

      {activeTab === 'ledger' ? (
        <>
          {/* 2. Monthly Proof-of-Impact Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Deals */}
            <div className="bg-white border-2 border-[#1B1B3A] p-4 rounded-2xl shadow">
              <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Deals Logged</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-[#1B1B3A]">
                  {summary?.totalDeals || 0}
                </span>
                <span className="text-xs font-bold text-stone-600">transactions</span>
              </div>
            </div>

            {/* Total Volume */}
            <div className="bg-white border-2 border-[#1B1B3A] p-4 rounded-2xl shadow">
              <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Total Quantity</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black font-mono text-[#1B1B3A]">
                  {((summary?.totalQuantityKg || 0) / 100).toFixed(1)}
                </span>
                <span className="text-xs font-bold text-stone-600">Quintals ({summary?.totalQuantityKg || 0} kg)</span>
              </div>
            </div>

            {/* Total Gross Revenue */}
            <div className="bg-white border-2 border-[#1B1B3A] p-4 rounded-2xl shadow">
              <span className="text-xs font-bold text-stone-500 uppercase block mb-1">Gross Value</span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-[#1B1B3A]">
                  ₹{(summary?.totalGrossAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Total Extra Rupees Earned vs Benchmark */}
            <div className="bg-emerald-50 border-2 border-emerald-600 p-4 rounded-2xl shadow">
              <span className="text-xs font-bold text-emerald-800 uppercase block mb-1">
                Extra Value vs Modal (बचत)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {(summary?.totalDiffVsMarketRs || 0) >= 0 ? '+' : ''}
                  ₹{(summary?.totalDiffVsMarketRs || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-[10px] text-emerald-900 font-medium">Genuine impact vs market modal price</span>
            </div>
          </div>

          {/* 3. Action Bar: Record Deal Button */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-[#1B1B3A]">सौदा इतिहास (Transaction History)</h2>
              <p className="text-xs text-stone-500">
                Click any row to view, print, or share the official APMC Sauda Slip.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#D62828] text-white font-bold text-xs hover:bg-red-700 transition-colors shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>नया सौदा दर्ज करें (Log Real Deal)</span>
            </button>
          </div>

          {/* 4. Deals Table */}
          <div className="bg-white border-2 border-[#1B1B3A] rounded-2xl shadow overflow-hidden mb-8">
            {loading ? (
              <div className="p-8 text-center text-stone-500 text-xs font-bold">
                सौदा इतिहास लोड हो रहा है (Loading transactions)...
              </div>
            ) : deals.length === 0 ? (
              <div className="p-12 text-center">
                <Receipt className="w-10 h-10 text-stone-400 mx-auto mb-2" />
                <h3 className="text-base font-bold text-[#1B1B3A] mb-1">No Real Deals Logged Yet</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto mb-4">
                  Whenever you sell in the Mandi, log the rate and weight to verify your savings vs Agmarknet benchmarks and get an instant dispute-proof Sauda Slip.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-[#1B1B3A] text-[#F2B705] font-bold text-xs rounded-xl hover:bg-[#2A2A5A]"
                >
                  Log First Deal Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b-2 border-[#1B1B3A] bg-stone-100">
                      <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Date</th>
                      <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Crop</th>
                      <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Mandi Yard</th>
                      <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Weight</th>
                      <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Rate (₹/kg)</th>
                      <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Benchmark Modal</th>
                      <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Vs Market</th>
                      <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Gross Total</th>
                      <th className="py-2.5 px-3 font-bold text-[#1B1B3A]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {deals.map((d) => (
                      <tr key={d.id} className="hover:bg-amber-50/50">
                        <td className="py-2.5 px-3 font-mono text-stone-600">{d.deal_date}</td>
                        <td className="py-2.5 px-3 font-bold uppercase text-[#1B1B3A]">{d.crop_id}</td>
                        <td className="py-2.5 px-3 text-stone-700">{d.mandi_location}</td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {d.quantity_kg} kg <span className="text-[10px] text-stone-500 font-normal">({(d.quantity_kg / 100).toFixed(1)} Qtl)</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-black text-sm text-[#1B1B3A]">
                          ₹{d.agreed_price_per_kg}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-500">
                          ₹{d.agmarknet_modal_price_per_kg}/kg
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {d.diff_vs_market_rs_per_kg >= 0 ? (
                            <span className="text-emerald-700">
                              +₹{d.diff_vs_market_rs_per_kg}/kg (+₹{d.total_diff_vs_market_rs.toLocaleString('en-IN')})
                            </span>
                          ) : (
                            <span className="text-red-700">
                              -₹{Math.abs(d.diff_vs_market_rs_per_kg)}/kg (-₹{Math.abs(d.total_diff_vs_market_rs).toLocaleString('en-IN')})
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-[#1B1B3A]">
                          ₹{d.total_gross_amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => handleOpenExistingReceipt(d)}
                            className="px-2.5 py-1 rounded-lg border border-[#1B1B3A] bg-stone-100 hover:bg-[#1B1B3A] hover:text-[#F2B705] transition-colors font-bold text-[11px] inline-flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Slip</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* 5. FPO / Trader Aggregate Dashboard */
        <div className="space-y-6">
          <div className="bg-white border-2 border-[#1B1B3A] rounded-2xl p-5 shadow">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-purple-700 text-white">
                    DPDP k-Anonymity Standard (k ≥ 5)
                  </span>
                  <span className="text-xs text-stone-500 font-mono">Aggregated Community Intelligence</span>
                </div>
                <h2 className="text-xl font-black font-display text-[#1B1B3A]">
                  FPO & Trader Aggregate Intelligence
                </h2>
                <p className="text-xs text-stone-600">
                  Data only displayed for crop/mandi clusters with at least 5 participating users to prevent individual deanonymization.
                </p>
              </div>

              <a
                href="/api/fpo-dashboard?format=csv"
                download="mandi_mol_fpo_insights.csv"
                className="px-4 py-2 rounded-xl bg-[#1B1B3A] text-[#F2B705] font-bold text-xs hover:bg-[#2A2A5A] transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download CSV Export</span>
              </a>
            </div>

            {fpoLoading ? (
              <div className="p-8 text-center text-stone-500 text-xs font-bold">
                Loading aggregated FPO clusters...
              </div>
            ) : (
              <>
                {/* Aggregate Clusters Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-[#1B1B3A] bg-stone-100">
                        <th className="py-2.5 px-3 font-bold">Crop</th>
                        <th className="py-2.5 px-3 font-bold">Mandi Yard</th>
                        <th className="py-2.5 px-3 font-bold">Users (≥ 5 required)</th>
                        <th className="py-2.5 px-3 font-bold">Sessions</th>
                        <th className="py-2.5 px-3 font-bold">Avg Premium vs Market</th>
                        <th className="py-2.5 px-3 font-bold">Total Volume Traded</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200">
                      {fpoData?.groups?.map((g: any, i: number) => (
                        <tr key={i} className="hover:bg-amber-50/50">
                          <td className="py-2.5 px-3 font-bold uppercase">{g.cropId}</td>
                          <td className="py-2.5 px-3">{g.mandiLocation}</td>
                          <td className="py-2.5 px-3 font-bold font-mono text-purple-900">
                            {g.totalUsers} users
                          </td>
                          <td className="py-2.5 px-3 font-mono">{g.totalSessions}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                            +₹{g.avgPremiumVsMarketRsPerKg}/kg
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            ₹{g.totalVolumeTradedRs.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Common Mandi Tricks & Failure Rates */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <h3 className="text-sm font-black text-[#1B1B3A]">
                      Mandi Trick Vulnerability Aggregates (किस चाल में किसान सबसे ज्यादा झुकते हैं?)
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {fpoData?.commonMandiTricksAggregate?.map((t: any, idx: number) => (
                      <div key={idx} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-[#1B1B3A]">{t.trick}</span>
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold text-[10px]">
                            {t.failureRatePct}% caved
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-600 mt-1">{t.counterTip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Log Real Deal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FAF4E6] border-[3px] border-[#1B1B3A] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-stone-700 hover:text-[#D62828] p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <PlusCircle className="w-5 h-5 text-amber-600" />
              <h3 className="text-xl font-black font-display text-[#1B1B3A]">
                नया सौदा दर्ज करें (Log Real Mandi Deal)
              </h3>
            </div>
            <p className="text-xs text-stone-600 mb-4">
              Enter agreed sale details. We will automatically fetch that day's Agmarknet modal rate to calculate your true rupee edge.
            </p>

            <form onSubmit={handleRecordDeal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Fasal (Crop)</label>
                  <select
                    value={formCropId}
                    onChange={(e) => setFormCropId(e.target.value)}
                    className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                  >
                    {CROPS_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.hindiName})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Type</label>
                  <select
                    value={formDealType}
                    onChange={(e) => setFormDealType(e.target.value as 'sold' | 'bought')}
                    className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                  >
                    <option value="sold">Sold (Farmer selling to trader)</option>
                    <option value="bought">Bought (Trader purchasing produce)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B1B3A] mb-1">APMC Mandi Yard</label>
                <select
                  value={formMandi}
                  onChange={(e) => setFormMandi(e.target.value)}
                  className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                >
                  <option value="Warangal APMC Yard">Warangal APMC Yard (Telangana)</option>
                  <option value="Guntur Mirchi Yard">Guntur Mirchi Yard (Andhra Pradesh)</option>
                  <option value="Azadpur Mandi">Azadpur Mandi (Delhi)</option>
                  <option value="Kolar APMC Market">Kolar APMC Market (Karnataka)</option>
                  <option value="Lasalgaon Onion Yard">Lasalgaon Onion Yard (Maharashtra)</option>
                  <option value="Khanna Grain Market">Khanna Grain Market (Punjab)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-[#1B1B3A]">Weight</label>
                    <div className="flex text-[10px] font-bold border border-[#1B1B3A] rounded">
                      <button
                        type="button"
                        onClick={() => setFormUnit('kg')}
                        className={`px-1.5 ${formUnit === 'kg' ? 'bg-[#1B1B3A] text-white' : 'bg-white'}`}
                      >
                        Kg
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormUnit('quintal')}
                        className={`px-1.5 ${formUnit === 'quintal' ? 'bg-[#1B1B3A] text-white' : 'bg-white'}`}
                      >
                        Qtl
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white font-mono text-sm font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Agreed Rate (₹/kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={formPricePerKg}
                    onChange={(e) => setFormPricePerKg(Number(e.target.value))}
                    className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white font-mono text-sm font-bold text-[#D62828]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">
                    {formDealType === 'sold' ? 'Buyer (Commission Agent)' : 'Seller (Farmer)'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Lakshmi Traders"
                    value={formParty}
                    onChange={(e) => setFormParty(e.target.value)}
                    className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Payment Method</label>
                  <select
                    value={formPaymentMode}
                    onChange={(e) => setFormPaymentMode(e.target.value)}
                    className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                  >
                    <option value="upi">Instant UPI / RTGS</option>
                    <option value="cash">Spot Cash on Weighbridge</option>
                    <option value="cheque_7d">7-Day APMC Cheque</option>
                    <option value="cheque_15d">15-Day Mandi Credit (Udhaari)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Notes / Terms (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weighbridge slip #412 attached, tare 1.2kg per bag"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-[#D62828] text-white font-bold text-xs hover:bg-red-700 transition-colors shadow"
              >
                {isSubmitting ? 'सौदा दर्ज हो रहा है...' : 'सौदा दर्ज करें और पर्ची बनाएं (Save Deal & Generate Slip)'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sauda Slip Modal */}
      <SaudaSlipModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        receipt={selectedReceipt}
      />
    </div>
  );
};
