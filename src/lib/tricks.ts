import { Trick, TrickId } from '../types';

export const TRICKS: Record<TrickId, Trick> = {
  quality_nitpick: {
    id: 'quality_nitpick',
    name: 'Quality Nitpicking',
    hindiName: 'क्वालिटी में नुक्स निकालना',
    description: 'Trader spots 2 slightly dry or pale chillies/tomatoes to discount your entire lot by 15%.',
    hinglishExample: 'Arre bhai, aadhe laal hain aadhe peele! Is quality ka maal Guntur mein koi nahi poochega.',
    counterTip: 'Pull 5 top-grade samples from different sacks: "Bhaiya random check karo, 95% uniform grade A hai, mandi sample dekh lo."',
    icon: '🔍',
  },
  false_market_drop: {
    id: 'false_market_drop',
    name: 'False Market Drop',
    hindiName: 'झूठी मंदी का हौवा',
    description: 'Claims today morning prices crashed by ₹20 due to heavy incoming trucks.',
    hinglishExample: 'Aaj subah 4 baje 20 gaadi aayi hai bypass se. Mandi ka bhav ₹15 gir chuka hai!',
    counterTip: 'Quote real Agmarknet or neighboring mandi rates from your phone: "Subah e-NAM pe Warangal aur Khammam ₹190 khula hai."',
    icon: '📉',
  },
  fake_scarcity: {
    id: 'fake_scarcity',
    name: 'Fake Scarcity / Glut',
    hindiName: 'गोदाम भरा होने का नाटक',
    description: 'Trader pretends his godown is already packed to make you feel desperate to unload.',
    hinglishExample: 'Mera shed pehle se bhara hai. Tumhara 500 kg leke main kahan rakhunga? Bas tumhare kehne pe ehsaan kar raha hoon.',
    counterTip: 'Call the bluff with your vehicle ready: "Koi baat nahi bhaiya, aage Gate No. 3 par Sharmaji ka commission agent bula raha hai."',
    icon: '📦',
  },
  weight_cut: {
    id: 'weight_cut',
    name: 'Weight Cut / Kanta Deduction',
    hindiName: 'कांटा और नमी कटौती',
    description: 'Demands an unjustified 4-5 kg deduction per quintal for moisture or tare bag weight.',
    hinglishExample: 'Chalo rate theek hai, lekin 4 kilo per bori nami aur kanta katauti katega. Yahi mandi ka dastoor hai.',
    counterTip: 'Enforce APMC scale rules: "Standard bardana 1 kg ka hai bhaiya, APMC ka certified kanta hai, extra katauti nahi hogi."',
    icon: '⚖️',
  },
  delayed_payment: {
    id: 'delayed_payment',
    name: 'Delayed Payment (Udhaari)',
    hindiName: 'उधारी और देर से भुगतान',
    description: 'Offers a slightly higher price but delays payment by 15-20 days, cutting your working capital.',
    hinglishExample: 'Agar ₹185 chahiye toh 20 din baad check milega. Aaj nagad (cash) chahiye toh ₹165 se ek paisa zyada nahi.',
    counterTip: 'Firmly state cash/RTGS settlement rule: "Khad aur diesel nagad khareeda tha. Maal utrega toh hisaab aaj sham 4 baje RTGS se hoga."',
    icon: '⏳',
  },
  friendly_pressure: {
    id: 'friendly_pressure',
    name: 'Friendly Pressure',
    hindiName: 'पुराना रिश्ता और मीठी बातें',
    description: 'Uses tea, chai-paani, and past relationship to guilt-trip you into surrendering your margin.',
    hinglishExample: 'Arre Ramesh bhai, 10 saal se tumhara hi maal leta hoon. Chai piyo pehle! Apno se bhi do rupaye ke liye ladoge kya?',
    counterTip: 'Separate relationship from business: "Rishta apni jagah hai Lalaji, par khet ka kharcha rishte se nahi chalta. Sahi daam dijiye."',
    icon: '🤝',
  },
};

export const TRICK_LIST = Object.values(TRICKS);
