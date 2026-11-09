import React, { useState, useEffect } from 'react';
import { Store, Sprout, PlusCircle, Phone, MessageSquare, FileText, CheckCircle, ArrowRight, Filter, ShieldCheck, Scale, Award } from 'lucide-react';
import { CROPS_LIST } from '../lib/crops';
import { CropIcon } from '../components/common/CropIcon';
import { SaudaSlipModal } from '../components/deals/SaudaSlipModal';
import { useGame } from '../store/useGame';
import { t } from '../lib/i18n';

export interface TradeListing {
  id: string;
  type: 'buy' | 'sell'; // 'buy' posted by Trader, 'sell' posted by Farmer
  cropId: string;
  cropName: string;
  variety: string;
  quantityKg: number;
  pricePerKg: number;
  mandiLocation: string;
  partyName: string;
  partyPhone: string;
  paymentTerms: string;
  qualityGrade: string;
  benchmarkPrice: number;
  postedAt: string;
  status: 'active' | 'completed';
}

const INITIAL_TRADE_LISTINGS: TradeListing[] = [
  {
    id: 'trade_1',
    type: 'buy',
    cropId: 'chilli',
    cropName: 'Teja Chilli (Dry)',
    variety: 'Guntur Teja #S17',
    quantityKg: 2500,
    pricePerKg: 192,
    mandiLocation: 'Guntur Mirchi Yard',
    partyName: 'Balaji Spices & Exports',
    partyPhone: '+91 98480 12345',
    paymentTerms: 'Instant RTGS on weighbridge clearance',
    qualityGrade: 'Grade A (Export Quality)',
    benchmarkPrice: 188,
    postedAt: '25 mins ago',
    status: 'active',
  },
  {
    id: 'trade_2',
    type: 'sell',
    cropId: 'chilli',
    cropName: 'Teja Chilli (Dry)',
    variety: 'Guntur Teja #S17',
    quantityKg: 1200,
    pricePerKg: 190,
    mandiLocation: 'Warangal APMC Yard',
    partyName: 'Ramesh Reddy (Kisan)',
    partyPhone: '+91 94401 54321',
    paymentTerms: 'Spot Cash or Same-day UPI',
    qualityGrade: 'Grade A (Sun-dried, <10% moisture)',
    benchmarkPrice: 185,
    postedAt: '1 hour ago',
    status: 'active',
  },
  {
    id: 'trade_3',
    type: 'buy',
    cropId: 'tomato',
    cropName: 'Hybrid Tomato',
    variety: 'Shivam Semi-Determinate',
    quantityKg: 3000,
    pricePerKg: 35,
    mandiLocation: 'Kolar APMC Market',
    partyName: 'Bangalore Fresh Veggies Ltd',
    partyPhone: '+91 99002 67890',
    paymentTerms: 'Direct Account Transfer within 2 hours',
    qualityGrade: 'Grade A (Firm Red, 25kg crates)',
    benchmarkPrice: 32,
    postedAt: '40 mins ago',
    status: 'active',
  },
  {
    id: 'trade_4',
    type: 'sell',
    cropId: 'wheat',
    cropName: 'Sharbati Wheat',
    variety: 'C-306 Golden Grain',
    quantityKg: 5000,
    pricePerKg: 29.5,
    mandiLocation: 'Khanna Grain Market',
    partyName: 'Gurpreet Singh (Kisan FPO)',
    partyPhone: '+91 98140 98765',
    paymentTerms: 'NEFT / RTGS on APMC gate weighment',
    qualityGrade: 'Grade A (Clean lustrous bold grain)',
    benchmarkPrice: 28,
    postedAt: '2 hours ago',
    status: 'active',
  },
  {
    id: 'trade_5',
    type: 'buy',
    cropId: 'onion',
    cropName: 'Nashik Red Onion',
    variety: 'Garwa Summer Stock',
    quantityKg: 4000,
    pricePerKg: 26,
    mandiLocation: 'Lasalgaon Onion Yard',
    partyName: 'Mahalaxmi Trading Co.',
    partyPhone: '+91 98220 45678',
    paymentTerms: 'Same day mandi settlement',
    qualityGrade: 'Medium/Big clean export dry skin',
    benchmarkPrice: 24,
    postedAt: '3 hours ago',
    status: 'active',
  },
];

const STORAGE_KEY = 'mandi_mol_live_trades_v1';

interface TradeBoardPageProps {
  userRole?: 'farmer' | 'trader';
  onSwitchRole?: (role: 'farmer' | 'trader') => void;
}

export const TradeBoardPage: React.FC<TradeBoardPageProps> = ({ userRole = 'farmer', onSwitchRole }) => {
  const { uiLanguage } = useGame();
  const [listings, setListings] = useState<TradeListing[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return INITIAL_TRADE_LISTINGS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'buy' | 'sell'>(
    userRole === 'farmer' ? 'buy' : 'sell'
  );
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // New Listing Form State
  const [postType, setPostType] = useState<'buy' | 'sell'>(userRole === 'farmer' ? 'sell' : 'buy');
  const [postCropId, setPostCropId] = useState('chilli');
  const [postQuantityKg, setPostQuantityKg] = useState(1000);
  const [postPricePerKg, setPostPricePerKg] = useState(190);
  const [postMandi, setPostMandi] = useState('Warangal APMC Yard');
  const [postPartyName, setPostPartyName] = useState('');
  const [postPartyPhone, setPostPartyPhone] = useState('');
  const [postPaymentTerms, setPostPaymentTerms] = useState('Instant RTGS / Cash on Scale');
  const [postQualityGrade, setPostQualityGrade] = useState('Grade A (Standard FAQ)');

  // Sauda Slip State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(listings));
    }
  }, [listings]);

  // Sync activeFilter when userRole changes
  useEffect(() => {
    setActiveFilter(userRole === 'farmer' ? 'buy' : 'sell');
    setPostType(userRole === 'farmer' ? 'sell' : 'buy');
  }, [userRole]);

  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    const cropObj = CROPS_LIST.find((c) => c.id === postCropId) || CROPS_LIST[0];

    const newListing: TradeListing = {
      id: `trade_${Date.now()}`,
      type: postType,
      cropId: cropObj.id,
      cropName: cropObj.name,
      variety: cropObj.variety,
      quantityKg: postQuantityKg,
      pricePerKg: postPricePerKg,
      mandiLocation: postMandi,
      partyName: postPartyName || (postType === 'buy' ? 'Verified Mandi Trader' : 'Verified Kisan'),
      partyPhone: postPartyPhone || '+91 98000 00000',
      paymentTerms: postPaymentTerms,
      qualityGrade: postQualityGrade,
      benchmarkPrice: cropObj.referencePrice,
      postedAt: 'Just now',
      status: 'active',
    };

    setListings([newListing, ...listings]);
    setIsPostModalOpen(false);
  };

  const handleOpenDealSlip = (trade: TradeListing) => {
    const qQuintal = (trade.quantityKg / 100).toFixed(1);
    const grossTotal = Math.round(trade.quantityKg * trade.pricePerKg);

    setSelectedReceipt({
      receiptNo: `SAUDA-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      crop: trade.cropName,
      mandi: trade.mandiLocation,
      party: trade.partyName,
      role: trade.type === 'buy' ? 'APMC Commission Trader' : 'Kisan Seller',
      quantityKg: trade.quantityKg,
      quantityQuintal: Number(qQuintal),
      ratePerKg: trade.pricePerKg,
      ratePerQuintal: trade.pricePerKg * 100,
      grossTotalRs: grossTotal,
      paymentMode: trade.paymentTerms,
    });
    setIsReceiptOpen(true);
  };

  const filteredListings = listings.filter((item) => {
    if (activeFilter !== 'all' && item.type !== activeFilter) return false;
    if (selectedCropFilter !== 'all' && item.cropId !== selectedCropFilter) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header Banner */}
      <div className="bg-[#1B1B3A] text-white p-6 sm:p-8 rounded-3xl border-3 border-[#1B1B3A] shadow-xl mb-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-[#F2B705] border border-[#F2B705]/40 text-xs font-bold uppercase tracking-wider mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>Real Mandi Trade Exchange · लाइव व्यापार मंच</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-display tracking-tight text-white">
              {uiLanguage === 'te'
                ? 'రైతులు & వ్యాపారుల ప్రత్యక్ష మార్కెట్ వేదిక'
                : uiLanguage === 'hi'
                ? 'किसान और व्यापारी सीधा व्यापार मंच'
                : 'Direct Farmer & Trader Mandi Trade Desk'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl">
              {uiLanguage === 'te'
                ? 'ధరల మోసం లేకుండా వ్యాపారుల కొనుగోలు డిమాండ్ మరియు రైతుల పంట అమ్మకపు వివరాలు. ప్రతి ఒప్పందానికి తక్షణ అధికారిక రశీదు.'
                : uiLanguage === 'hi'
                ? 'बिचौलियों के बिना वास्तविक मंडी खरीद व बिक्री। एगमार्कनेट मॉडल भाव से तुलना कर सीधे सौदा तय करें और पक्की रसीद लें।'
                : 'Zero intermediaries. Match buyer demand with farmer supply directly, benchmarked against certified daily Agmarknet modal rates.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {onSwitchRole && (
              <div className="bg-[#12122B] p-1 rounded-xl border border-white/20 flex items-center">
                <button
                  type="button"
                  onClick={() => onSwitchRole('farmer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    userRole === 'farmer' ? 'bg-[#F2B705] text-[#1B1B3A]' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Kisan (Farmer)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchRole('trader')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    userRole === 'trader' ? 'bg-[#F2B705] text-[#1B1B3A]' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Vyapari (Trader)</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsPostModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#D62828] text-white font-bold text-xs sm:text-sm hover:bg-red-700 transition-colors shadow-lg flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>
                {userRole === 'farmer'
                  ? 'फसल बिक्री के लिए डालें (List Produce Lot)'
                  : 'खरीद मांग पोस्ट करें (Post Buying Demand)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border-2 border-[#1B1B3A] shadow-sm">
          <button
            type="button"
            onClick={() => setActiveFilter('buy')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeFilter === 'buy' ? 'bg-[#1B1B3A] text-[#F2B705]' : 'text-stone-600 hover:text-[#1B1B3A]'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Trader Buy Offers ({listings.filter((l) => l.type === 'buy').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('sell')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeFilter === 'sell' ? 'bg-[#1B1B3A] text-[#F2B705]' : 'text-stone-600 hover:text-[#1B1B3A]'
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Farmer Sell Lots ({listings.filter((l) => l.type === 'sell').length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeFilter === 'all' ? 'bg-amber-100 text-[#1B1B3A]' : 'text-stone-500 hover:text-[#1B1B3A]'
            }`}
          >
            All
          </button>
        </div>

        {/* Crop Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-500" />
          <span className="text-xs font-bold text-[#1B1B3A]">Filter by Crop:</span>
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="p-2 rounded-xl border-2 border-[#1B1B3A] bg-white font-bold text-xs cursor-pointer shadow-sm"
          >
            <option value="all">All Crops (सभी फसलें)</option>
            {CROPS_LIST.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Trade Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        {filteredListings.length === 0 ? (
          <div className="col-span-full bg-white border-2 border-[#1B1B3A] rounded-2xl p-12 text-center shadow-md">
            <Scale className="w-12 h-12 mx-auto mb-3 text-stone-400" />
            <h3 className="text-lg font-bold text-[#1B1B3A]">No trade postings found</h3>
            <p className="text-xs text-stone-500 mt-1 mb-4">
              Be the first to post your buy demand or sell lot in this category!
            </p>
            <button
              type="button"
              onClick={() => setIsPostModalOpen(true)}
              className="px-4 py-2 bg-[#1B1B3A] text-[#F2B705] font-bold text-xs rounded-xl"
            >
              Post Listing Now
            </button>
          </div>
        ) : (
          filteredListings.map((trade) => {
            const isBuy = trade.type === 'buy';
            const priceDiff = trade.pricePerKg - trade.benchmarkPrice;

            return (
              <div
                key={trade.id}
                className="bg-white border-[2.5px] border-[#1B1B3A] rounded-2xl p-5 shadow-md hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Badge: Type & Time */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        isBuy
                          ? 'bg-blue-100 text-blue-900 border border-blue-300'
                          : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}
                    >
                      {isBuy ? <Store className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
                      <span>{isBuy ? 'Trader Buying' : 'Farmer Selling'}</span>
                    </span>

                    <span className="text-[10px] text-stone-400 font-mono font-medium">
                      {trade.postedAt}
                    </span>
                  </div>

                  {/* Crop Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 border border-stone-200 flex items-center justify-center shrink-0">
                      <CropIcon cropId={trade.cropId} className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-[#1B1B3A] leading-tight">
                        {trade.cropName}
                      </h3>
                      <p className="text-xs text-stone-500 font-medium">{trade.variety}</p>
                    </div>
                  </div>

                  {/* Quantity & Location */}
                  <div className="p-3 bg-[#FAF4E6] rounded-xl border border-stone-200 mb-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-medium">Quantity / Weight:</span>
                      <span className="font-bold font-mono text-[#1B1B3A]">
                        {trade.quantityKg.toLocaleString('en-IN')} kg ({(trade.quantityKg / 100).toFixed(1)} Qtl)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-medium">Mandi Location:</span>
                      <span className="font-bold text-[#1B1B3A]">{trade.mandiLocation}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-medium">Quality Grade:</span>
                      <span className="font-semibold text-stone-700">{trade.qualityGrade}</span>
                    </div>
                  </div>

                  {/* Price Banner */}
                  <div className="my-3 flex items-baseline justify-between border-t border-b border-stone-100 py-2.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                        {isBuy ? 'Offered Purchase Rate' : 'Asking Price'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black font-mono text-[#D62828]">
                          ₹{trade.pricePerKg}
                        </span>
                        <span className="text-xs font-bold text-[#1B1B3A]">/kg (₹{trade.pricePerKg * 100}/Qtl)</span>
                      </div>
                    </div>

                    {/* Benchmark comparison badge */}
                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          priceDiff >= 0
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {priceDiff >= 0 ? `+₹${priceDiff}/kg vs Modal` : `₹${Math.abs(priceDiff)}/kg below modal`}
                      </span>
                    </div>
                  </div>

                  {/* Payment Terms & Party */}
                  <div className="text-xs text-stone-600 mb-4 space-y-1">
                    <p className="font-medium">
                      <span className="font-bold text-[#1B1B3A]">Party:</span> {trade.partyName}
                    </p>
                    <p className="text-[11px] text-stone-500 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{trade.paymentTerms}</span>
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${trade.partyPhone.replace(/[^0-9]/g, '')}&text=${encodeURIComponent(
                      `Namaste! I saw your Mandi Mol trade posting for ${trade.cropName} (${trade.quantityKg} kg @ ₹${trade.pricePerKg}/kg at ${trade.mandiLocation}). I want to confirm the deal.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 text-center shadow"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleOpenDealSlip(trade)}
                    className="py-2 px-3 rounded-xl border-2 border-[#1B1B3A] bg-[#1B1B3A] text-[#F2B705] font-bold text-xs hover:bg-[#2A2A5A] transition-colors flex items-center justify-center gap-1 text-center shadow"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Sauda Slip</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Post Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FAF4E6] border-[3px] border-[#1B1B3A] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-4 right-4 text-stone-700 hover:text-[#D62828] font-bold text-lg p-1"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-[#D62828]" />
              <h2 className="text-xl font-black font-display text-[#1B1B3A]">
                {postType === 'buy' ? 'व्यापारी खरीद मांग दर्ज करें (Post Buy Demand)' : 'फसल बिक्री लॉट डालें (Post Sell Lot)'}
              </h2>
            </div>
            <p className="text-xs text-stone-600 mb-4">
              Enter your real produce specifications. Listings appear instantly for local buyers and sellers.
            </p>

            <form onSubmit={handleCreateListing} className="space-y-4">
              {/* Type Toggle */}
              <div>
                <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Posting As:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPostType('buy')}
                    className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 ${
                      postType === 'buy'
                        ? 'bg-[#1B1B3A] text-[#F2B705] border-[#1B1B3A]'
                        : 'bg-white text-[#1B1B3A] border-stone-300'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    <span>Trader Buying (खरीददार)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPostType('sell')}
                    className={`p-2.5 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-1.5 ${
                      postType === 'sell'
                        ? 'bg-[#1B1B3A] text-[#F2B705] border-[#1B1B3A]'
                        : 'bg-white text-[#1B1B3A] border-stone-300'
                    }`}
                  >
                    <Sprout className="w-4 h-4" />
                    <span>Farmer Selling (विक्रेता)</span>
                  </button>
                </div>
              </div>

              {/* Crop & Mandi */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Crop (फसल)</label>
                  <select
                    value={postCropId}
                    onChange={(e) => setPostCropId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                  >
                    {CROPS_LIST.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Mandi Yard</label>
                  <select
                    value={postMandi}
                    onChange={(e) => setPostMandi(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                  >
                    <option value="Warangal APMC Yard">Warangal APMC Yard (Telangana)</option>
                    <option value="Guntur Mirchi Yard">Guntur Mirchi Yard (Andhra Pradesh)</option>
                    <option value="Azadpur Mandi">Azadpur Mandi (Delhi)</option>
                    <option value="Kolar APMC Market">Kolar Market (Karnataka)</option>
                    <option value="Lasalgaon Onion Yard">Lasalgaon Yard (Maharashtra)</option>
                    <option value="Khanna Grain Market">Khanna Market (Punjab)</option>
                  </select>
                </div>
              </div>

              {/* Quantity & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Quantity (Kg)</label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    value={postQuantityKg}
                    onChange={(e) => setPostQuantityKg(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-sm font-mono font-bold"
                    required
                  />
                  <span className="text-[10px] text-stone-500 font-mono">
                    = {(postQuantityKg / 100).toFixed(1)} Quintals
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Price Rate (₹ / Kg)</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={postPricePerKg}
                    onChange={(e) => setPostPricePerKg(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-sm font-mono font-bold text-[#D62828]"
                    required
                  />
                  <span className="text-[10px] text-stone-500 font-mono">
                    = ₹{(postPricePerKg * 100).toLocaleString('en-IN')} / Quintal
                  </span>
                </div>
              </div>

              {/* Quality & Terms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Quality Grade</label>
                  <select
                    value={postQualityGrade}
                    onChange={(e) => setPostQualityGrade(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                  >
                    <option value="Grade A (Export / Premium Quality)">Grade A (Export / Premium)</option>
                    <option value="Grade B (Fair Average Quality - FAQ)">Grade B (Standard FAQ)</option>
                    <option value="Grade C (Local Grade)">Grade C (Local Grade)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Payment Method</label>
                  <select
                    value={postPaymentTerms}
                    onChange={(e) => setPostPaymentTerms(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                  >
                    <option value="Instant RTGS on weighbridge clearance">Instant RTGS on weighbridge</option>
                    <option value="Spot Cash upon delivery">Spot Cash on scale</option>
                    <option value="UPI / Account Transfer within 2 hours">UPI within 2 hours</option>
                    <option value="7-Day Mandi Cheque">7-Day Mandi Cheque</option>
                  </select>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">Party / Company Name</label>
                  <input
                    type="text"
                    value={postPartyName}
                    onChange={(e) => setPostPartyName(e.target.value)}
                    placeholder="e.g. Ramesh Reddy or Kisan FPO"
                    className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1B1B3A] mb-1">WhatsApp Phone Number</label>
                  <input
                    type="tel"
                    value={postPartyPhone}
                    onChange={(e) => setPostPartyPhone(e.target.value)}
                    placeholder="+91 98480 12345"
                    className="w-full p-2.5 rounded-xl border-2 border-[#1B1B3A] bg-white text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-[#1B1B3A] text-[#F2B705] font-black text-sm rounded-xl hover:bg-[#2A2A5A] transition-colors shadow-lg"
                >
                  Post Trade Listing to Mandi Exchange
                </button>
              </div>
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

