/**
 * Marketing Templates — WhatsApp quick replies, score-specific messages,
 * parent objection handlers, and ad copy library.
 *
 * Used by the admin dashboard for copy-paste follow-ups and by the
 * marketing plan execution workflow.
 */

// ---------------------------------------------------------------------------
// WhatsApp Quick Replies (5 most common questions)
// ---------------------------------------------------------------------------

export const WHATSAPP_QUICK_REPLIES = {
  fees: {
    label: "Fee Breakdown",
    message: `MBBS at Chuvash State University, Cheboksary — 2026 Intake

💰 Year 1 (all-inclusive): ₹9.12 Lakh
Includes: Tuition, hostel, visa, medical insurance, documents, food allowance, arrival support, and one-way flight from India.

💰 Years 2–6: ₹3.35 Lakh/year

💰 Total over 5.8 years: ₹25.85 Lakh

Compare: India private MBBS = ₹70L – 1.5 Crore (with donation)

No hidden fees. No agent commission. This is the real, complete cost.

Want the full year-by-year breakdown? Just ask. Talking with me is completely free.`,
  },

  eligibility: {
    label: "Eligibility",
    message: `Eligibility for MBBS in Russia (Chuvash 2026):

✅ 50% aggregate in Physics, Chemistry, Biology (PCB) in Class 12
✅ Any valid qualifying NEET-UG score (no cutoff — just qualifying)
✅ Age: 17 years by 31 Dec 2026
✅ Drop years are completely fine — I dropped 3 times myself

That's it. No entrance test. No donation. No management quota.

Direct admission to a government university with NMC + WHO recognition.

Questions? Call me — it's free.`,
  },

  documents: {
    label: "Document Checklist",
    message: `Documents needed for MBBS Russia 2026 admission:

📄 10th marksheet + certificate
📄 12th marksheet + certificate
📄 NEET scorecard
📄 Passport (valid for 2+ years)
📄 Passport-size photos (white background)
📄 Birth certificate
📄 Medical fitness certificate
📄 HIV test report
📄 Invitation letter (we help with this)
📄 Visa application form (we help with this too)

Don't worry if some are pending — I'll guide you through each step. The registration fee is ₹15,000 to start the process.`,
  },

  nmcRecognition: {
    label: "NMC / FMGE / NExT",
    message: `Is MBBS from Russia valid in India? YES.

✅ Chuvash State University is NMC-listed (National Medical Commission)
✅ WHO-recognized
✅ After graduating, you take the NExT exam (replacing FMGE) to practice in India
✅ Same license as any Indian MBBS graduate

I graduated from Russia myself and I'm currently interning at G.R.M.C Gwalior — a government hospital in India. The degree works.

FMGE/NExT preparation starts from Year 3 with my guidance. I don't leave you after admission.`,
  },

  safety: {
    label: "Safety & Living",
    message: `Is Russia safe for Indian students?

🏠 Cheboksary is a calm, safe university city — not Moscow or St. Petersburg
🍛 Indian mess available — home-style food (dal, roti, rice, sabzi)
👨‍👩‍👧 Strong Indian student community — you won't feel alone
🏥 University hostel with 24/7 security
❄️ Yes, winters are cold (-20°C) but hostels and buildings are heated
📱 WhatsApp/video calls work perfectly — parents stay connected daily

I lived there for 6 years. It's safe. Your parents can talk to me directly — I'll answer every question honestly.`,
  },
} as const;

// ---------------------------------------------------------------------------
// Score-Specific Messages (for NEET result day — June 3, 2026)
// ---------------------------------------------------------------------------

export const SCORE_SPECIFIC_MESSAGES = {
  below200: {
    label: "Below 200",
    scoreRange: "0-199",
    message: (firstName: string) =>
      `Hi ${firstName}, I saw NEET results are out. Whatever your score, your MBBS dream is NOT over.

With any qualifying NEET score, you can get direct admission to a government medical university in Russia — NMC recognized, same degree.

Total cost: ₹25.85 lakh over 5.8 years. No donation, no management quota.

I dropped NEET 3 times myself. Today I'm a doctor. Let me explain your options — it's completely free. Reply "yes" and I'll call you.`,
  },

  range200to350: {
    label: "200-350",
    scoreRange: "200-350",
    message: (firstName: string) =>
      `Hi ${firstName}, with your NEET score, India private colleges will ask ₹70L-1.5Cr with donation.

Russia mein same NMC-recognized MBBS degree milti hai — total cost ₹25.85 lakh. No donation.

Chuvash State University, Cheboksary — October 2026 intake.

I'm Dr. Shivang. I studied MBBS in Russia myself. Currently intern at G.R.M.C Gwalior. I can guide you for free.

Reply "interested" and I'll share the complete fee breakdown + process.`,
  },

  range350to500: {
    label: "350-500",
    scoreRange: "350-500",
    message: (firstName: string) =>
      `Hi ${firstName}, your score puts you in a tricky spot — too low for good government colleges, and private colleges will charge ₹70L+.

There's a smarter option: MBBS in Russia at a government university.

₹25.85L total over 5.8 years. NMC + WHO recognized. English medium.

I'm Dr. Shivang — I did my MBBS from Russia and I'm interning in India right now. No agent, no commission. Just honest guidance.

Want to discuss? I can explain everything to you and your parents on a free call.`,
  },

  above500: {
    label: "Above 500",
    scoreRange: "500+",
    message: (firstName: string) =>
      `Hi ${firstName}, good score! But with NEET counseling rounds being unpredictable, it's smart to keep Russia as a backup option.

Chuvash State University — government university, NMC recognized, ₹25.85L total.

Many students with 500+ choose Russia because: no donation, no uncertainty, guaranteed seat.

I'm Dr. Shivang — Russia MBBS graduate, currently interning in India. Happy to explain the option if you're exploring.`,
  },
} as const;

// ---------------------------------------------------------------------------
// Parent Objection Handlers
// ---------------------------------------------------------------------------

export const PARENT_OBJECTION_HANDLERS = {
  safetyFear: {
    label: "Russia safe nahi hai",
    objection: "Russia is not safe",
    response: `Namaste ji. Aapki chinta bilkul samajh mein aati hai.

Cheboksary ek chota, shaant university city hai — Moscow ya St. Petersburg jaisa nahi hai. Yahan crime rate bahut kam hai.

Baat karta hoon facts ki:
• University hostel mein 24/7 security hai
• Indian student community hai — 50+ Indian students wahan hain
• Indian mess hai — ghar jaisa khana milta hai
• Main khud 6 saal wahan raha — meri family bhi yahi concerns thi

Kya aap ek video dekh sakte hain? Mere students ne apna experience share kiya hai. Main aapko WhatsApp pe bhej raha hoon.

Aur agar aap chahein toh wahan ke kisi current student se baat bhi karwa sakta hoon.`,
  },

  degreeValidity: {
    label: "Degree chalegi ya nahi?",
    objection: "Will the degree be valid in India?",
    response: `Ji bilkul. Samjhaata hoon clearly:

✅ Chuvash State University NMC (National Medical Commission) ki list mein hai
✅ WHO recognized hai
✅ Graduate hone ke baad NExT exam dena hota hai — jo har MBBS graduate ko dena hota hai, chahe India se kare ya bahar se
✅ NExT pass karne ke baad — same license, same practice rights as any Indian doctor

Main khud Russia se MBBS kiya hai aur aaj G.R.M.C Gwalior (government hospital) mein intern hoon. Degree valid hai — main iska living proof hoon.

Kya aap NMC ki official website pe check karna chahenge? Main link bhej deta hoon.`,
  },

  tooFar: {
    label: "Bahut door hai",
    objection: "Russia is too far from India",
    response: `Ji, door toh hai — lekin aaj ke time mein distance utna matter nahi karta:

📱 WhatsApp video call daily hota hai — parents se roz baat hoti hai
✈️ Direct flights available hain — Delhi se 6-7 ghante
🏖️ Saal mein 2 baar vacation milta hai — summer + winter break
👨‍⚕️ Main khud 6 saal wahan tha. Mere parents se roz baat hoti thi.

Aur initial days mein Dr. Shivang personally help karta hai — arrival se hostel tak, sab.

Distance ek adjustment hai — lekin ₹25L mein NMC-recognized MBBS degree ke liye worth it hai. India private mein ₹70L+ lagega — same degree ke liye.`,
  },

  preferAgent: {
    label: "Agent se karenge",
    objection: "We will do it through an agent",
    response: `Ji, aap bilkul agent se bhi kar sakte hain. Lekin ek minute — samjhaata hoon fark:

Agent ka charge: ₹2-3 lakh extra (admission fees ke upar)
Mera charge: ₹0. Completely free.

Agents usually admission tak help karte hain. Uske baad — hostel, documents, language, FMGE/NExT preparation — sab aapko khud karna padta hai.

Main 6 saal Russia mein raha hoon. Admission se lekar graduation tak — puri journey mein guide karta hoon. FMGE/NExT prep Year 3 se start hoti hai mere saath.

Main consultant ya agent nahi hoon — main doctor hoon jo apna experience share kar raha hai.

₹2-3L jo agent ko denge — woh Russia mein ek saal ki fees hai. Sochiye.`,
  },

  costTooHigh: {
    label: "Cost zyada hai",
    objection: "The cost is too high",
    response: `Samjhaata hoon comparison ke saath:

Russia (Chuvash, 5.8 years total):
Year 1: ₹9.12L (flight + admission + hostel + everything included)
Years 2-6: ₹3.35L per year
TOTAL: ₹25.85 Lakh

India Private MBBS:
Tuition: ₹15-25L per year
Donation: ₹30-50L+ (one-time)
TOTAL: ₹70L – 1.5 Crore

Same degree. Same NMC license. Same right to practice.

₹25.85L mein poora MBBS — flights aur hostel sab included. India private ka ek saal ka kharcha = Russia ka total.

Agar EMI ya installment option chahiye toh bhi baat kar sakte hain.`,
  },

  noTrackRecord: {
    label: "Pehle kisi ko bheja hai?",
    objection: "Have you sent students before?",
    response: `Valid question. Honestly bataata hoon:

2026 meri first official batch hai. Lekin:

✅ Main KHUD Chuvash se MBBS graduate hoon — 6 saal wahan raha
✅ Currently G.R.M.C Gwalior mein government hospital mein intern
✅ Last year 200+ students ne mujhse guidance li — unme se 28 Chuvash gaye (agents ke through)
✅ Students ke video testimonials hain — main share karta hoon

First batch hone ka matlab hai — main aapko ZYADA time dunga. 20 students ko personally guide karunga, 200 ko nahi.

Aur mera pehla student = meri reputation. Isliye main extra careful rahunga.

Video testimonials bhejun? Aur chahein toh current Chuvash students se baat karwa sakta hoon.`,
  },
} as const;

// ---------------------------------------------------------------------------
// WhatsApp Broadcast Templates (for scheduled campaigns)
// ---------------------------------------------------------------------------

export const BROADCAST_TEMPLATES = {
  preResult: {
    label: "Pre-Result Broadcast",
    timing: "1-2 days before NEET results",
    message: (firstName: string) =>
      `Hi ${firstName}, NEET 2026 ka result expected hai jaldi. Score chahe jo bhi aaye — Russia mein MBBS ek solid option hai.

Total cost: ₹25.85L. NMC recognized. Direct admission.

Main Dr. Shivang — khud Russia se MBBS kiya hai. Result ke baad confused feel ho toh message karna. Free guidance, no selling.`,
  },

  resultDay: {
    label: "Result Day Broadcast",
    timing: "On NEET result day",
    message: (firstName: string) =>
      `Hi ${firstName}, NEET result aa gaya. Score chahe kuch bhi ho — aapka doctor banne ka sapna abhi bhi possible hai.

Russia mein government university se MBBS: ₹25.85L total. Same NMC degree.

Main Dr. Shivang. Abhi call karo — free hai, no pressure. Aapke score ke basis pe best options bataunga.`,
  },

  weeklyNurture: {
    label: "Weekly Nurture",
    timing: "Weekly during peak season",
    message: (firstName: string) =>
      `Hi ${firstName}, Dr. Shivang here. Quick update:

🎓 October 2026 intake registrations open hain
📋 Documents ready karna shuru karo — checklist chahiye toh bolo
👨‍👩‍👧 Parents ke sawaal hain? Free call schedule kar sakte hain

Koi bhi doubt ho toh message karo. Main yahan hoon.`,
  },

  urgencyClose: {
    label: "Urgency Close",
    timing: "Weeks 9-12 (July)",
    message: (firstName: string) =>
      `Hi ${firstName}, Dr. Shivang here.

October 2026 Chuvash intake ke liye seats limited hain. Registration ₹15,000 se start hoti hai.

Agar MBBS Russia ka plan hai toh ab decide karna zaroori hai — documents aur visa process mein time lagta hai.

Kya parents se baat ho gayi? Agar nahi toh main unse baat kar sakta hoon — completely free.

Last date miss mat karna. Reply karo ya call karo — help karunga.`,
  },

  parentIntro: {
    label: "Parent Introduction",
    timing: "After student qualifies",
    message: (parentName: string, studentName: string) =>
      `Namaste ${parentName} ji,

Main Dr. Shivang Gupta hoon. ${studentName} ne MBBS Russia ke baare mein mujhse baat ki thi.

Main doctor hoon — consultant ya agent nahi. Maine khud Russia se MBBS kiya hai aur currently G.R.M.C Gwalior (government hospital) mein intern hoon.

Kya aap 15 minute baat kar sakte hain? Main fees, eligibility, safety — sab clearly explain karunga. Ye call completely free hai, aur main kuch bechne nahi aaunga.

Aapke liye convenient time batayiye.`,
  },

  postParentCall: {
    label: "Post Parent Call Follow-up",
    timing: "24h after parent call",
    message: (parentName: string) =>
      `Namaste ${parentName} ji,

Kal baat karke achha laga. Jo discuss kiya uska summary:

💰 Total cost: ₹25.85L over 5.8 years (all inclusive)
✅ NMC + WHO recognized
🏠 Hostel + Indian mess + student community
📋 Registration: ₹15,000 to start process

Fee breakdown PDF attach kar raha hoon. Document checklist bhi.

Koi bhi sawal ho toh kabhi bhi message kar sakte hain. Main available hoon.`,
  },
} as const;

// ---------------------------------------------------------------------------
// Ad Copy Library
// ---------------------------------------------------------------------------

export const AD_COPY_LIBRARY = {
  // Phase 1: Awareness (Weeks 1-4)
  awareness: {
    ugcReel: {
      label: "UGC Reel - Personal Story",
      hook: "Main 3 baar NEET fail hua. Phir Russia gaya. Ab Indian hospital mein intern hoon.",
      body: "MBBS in Russia — ₹25.85L total. NMC recognized. Same degree as India.",
      cta: "Free guidance. No agent. No selling. DM me or tap the link.",
      primaryText:
        "NEET 3 baar drop kiya. Aaj doctor hoon. Russia mein MBBS kiya — ₹25.85L mein. Same NMC degree. Free guidance chahiye? Message karo.",
      headline: "MBBS Russia — ₹25.85L Total",
    },
    costCarousel: {
      label: "Cost Comparison Carousel",
      slides: [
        "India Private MBBS: ₹70L – 1.5Cr 😰",
        "Russia MBBS (Chuvash): ₹25.85L total 🎓",
        "Year 1: ₹9.12L (flights + hostel included)",
        "NMC recognized. Same license. Same degree.",
        "Free guidance from a doctor who did it. DM now.",
      ],
      primaryText:
        "₹25.85L mein poora MBBS. India private ka ek saal = Russia ka total. NMC recognized. Message karo — guidance completely free hai.",
    },
  },

  // Phase 2: Conversion (Weeks 5-8)
  conversion: {
    testimonialAd: {
      label: "Student Testimonial Ad",
      hook: "[Student] ne NEET mein kam score kiya tha. Aaj Russia mein MBBS kar raha hai.",
      primaryText:
        "Real student. Real story. MBBS Russia — ₹25.85L total, NMC recognized. Dr. Shivang se free guidance lo.",
      headline: "Real Students. Real Results.",
      cta: "Message Dr. Shivang on WhatsApp — Free Guidance",
    },
    scoreSpecificAd: {
      label: "Score-Specific Ad (post-results)",
      hook: "NEET score kam aaya? MBBS ka sapna khatam nahi hua.",
      primaryText:
        "Any qualifying NEET score = direct admission to NMC-recognized Russian university. ₹25.85L total. No donation. Dr. Shivang — Russia MBBS graduate — se free mein baat karo.",
      headline: "Low NEET Score? MBBS Still Possible.",
      cta: "WhatsApp Dr. Shivang — Free, No-Selling Guidance",
    },
    parentAd: {
      label: "Parent-Focused Facebook Ad",
      hook: "Aapke bachche ka NEET score kam aaya? MBBS ka sapna ₹25L mein poora ho sakta hai.",
      primaryText:
        "Dear Parents: Russia mein government university se MBBS — ₹25.85L total, NMC recognized. No donation, no management quota. Dr. Shivang (Russia MBBS graduate, GRMC Gwalior intern) se free call pe baat karo. Koi selling nahi.",
      headline: "MBBS ₹25L | NMC Recognized | Free Guidance",
      cta: "Call Dr. Shivang — Free, Honest Guidance for Parents",
    },
  },

  // Phase 3: Urgency (Weeks 9-12)
  urgency: {
    countdownReel: {
      label: "Countdown / Urgency Reel",
      hook: "October 2026 intake. Seats limited. Ab ya kabhi nahi.",
      primaryText:
        "Chuvash 2026 registration closing soon. ₹15,000 se process start karo. ₹25.85L total — NMC degree. Dr. Shivang personally guide karega.",
      headline: "Last Few Seats — Chuvash 2026",
      cta: "Register Now — ₹15,000 to Start",
    },
    parentTestimonialAd: {
      label: "Parent Testimonial Facebook Ad",
      hook: "Mera beta Russia mein MBBS kar raha hai. Best decision of our life.",
      primaryText:
        "Parent ki real story suniye. ₹25.85L mein NMC-recognized MBBS. Safe city. Indian food. Dr. Shivang se free guidance. October 2026 intake — registration open.",
      headline: "Parent Approved. NMC Recognized.",
      cta: "Talk to Dr. Shivang — Free Parent Call",
    },
  },

  // Google Ads Copy
  googleAds: {
    primary: {
      headlines: [
        "MBBS in Russia — ₹25.85L Total",
        "Dr. Shivang | Real Doctor, Real Guidance",
        "Free Counseling. No Agent Fees.",
        "NMC Recognized MBBS Abroad",
        "Chuvash 2026 Intake Open",
        "NEET Score Low? MBBS Possible.",
      ],
      descriptions: [
        "Indian doctor who studied MBBS in Russia. 1:1 mentorship for Chuvash 2026. Total cost ₹25.85L. NMC recognized. Free guidance.",
        "3x NEET dropper turned doctor. Now helping students get MBBS in Russia. No agent fees. No selling. Just honest guidance.",
        "MBBS at Chuvash State University. ₹9.12L Year 1 (all-inclusive). ₹25.85L total. Direct admission with any NEET score.",
      ],
    },
    resultsSurge: {
      headlines: [
        "NEET 2026 Score Low? MBBS Options",
        "Don't Waste ₹70L on Private MBBS",
        "Russia MBBS — ₹25.85L | NMC Degree",
        "After NEET: Free Doctor Guidance",
      ],
      descriptions: [
        "Any qualifying NEET score = MBBS in Russia. ₹25.85L total vs ₹70L+ India private. Same NMC license. Free guidance from a Russia MBBS graduate.",
        "NEET result disappointing? Dr. Shivang dropped 3 times, then got MBBS from Russia. Now interning in India. Talk to him free.",
      ],
    },
  },
} as const;

// ---------------------------------------------------------------------------
// Audience Targeting Reference
// ---------------------------------------------------------------------------

export const META_AUDIENCE_TARGETING = {
  students: {
    ageRange: "17-25",
    locations: [
      "Uttar Pradesh",
      "Madhya Pradesh",
      "Rajasthan",
      "Bihar",
      "Maharashtra",
      "Delhi NCR",
      "Gujarat",
      "Haryana",
    ],
    interests: [
      "NEET",
      "NEET UG",
      "Medical entrance exam",
      "MBBS",
      "Allen Career Institute",
      "Aakash Institute",
      "Physics Wallah",
      "Medical college",
      "Doctor",
      "Biology",
    ],
    placements: ["Instagram Reels", "Instagram Feed", "Instagram Stories"],
  },
  parents: {
    ageRange: "35-55",
    locations: [
      "Uttar Pradesh",
      "Madhya Pradesh",
      "Rajasthan",
      "Bihar",
      "Maharashtra",
      "Delhi NCR",
      "Gujarat",
      "Haryana",
    ],
    interests: [
      "Parenting",
      "Education",
      "NEET",
      "Medical education",
      "Children's education",
    ],
    placements: ["Facebook Feed", "Facebook Reels", "Facebook Stories"],
  },
} as const;

// ---------------------------------------------------------------------------
// Hashtag Sets
// ---------------------------------------------------------------------------

export const HASHTAG_SETS = {
  everyPost: [
    "#MBBSinRussia",
    "#NEET2026",
    "#MBBSwithDrShivang",
    "#MBBSAbroad",
  ],
  rotate: [
    "#NEETDropper",
    "#ChuvashStateUniversity",
    "#MBBSRussia2026",
    "#StudyInRussia",
    "#DoctorBannaHai",
    "#NEETResult2026",
    "#MBBSFees",
    "#RussianMBBS",
  ],
  trending: [
    "#NEET2026PaperLeak",
    "#NTAScam",
    "#NEETCutoff2026",
    "#NEETResult",
  ],
  hindi: [
    "#डॉक्टरबननाहै",
    "#नीट2026",
    "#एमबीबीएस",
  ],
} as const;
