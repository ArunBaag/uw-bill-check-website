/* ===================================================================
   YOUR SETTINGS - edit this file only (in GitHub: open config.js > pencil icon > Commit).
   =================================================================== */
window.SITE_CONFIG = {
  partnerName: "Arun Baag",
  partnerTitle: "Authorised UW Partner",
  partnerId: "",                       // e.g. "UW12345" - leave "" to hide
  email: "er.arunbaag@gmail.com",
  whatsapp: "447448894997",                        // your mobile in international format, no + or spaces, e.g. "447700900123"
  area: "",                            // e.g. "Leicester & surrounding areas" - leave "" to hide

  // Free form delivery: sign up at https://web3forms.com with your email, copy the Access Key here.
  // Each completed bill check then arrives in your inbox. Leave "" to use email/WhatsApp buttons only.
  web3formsKey: "",

  // Ofgem price cap used for the instant bill health check (update each quarter)
  priceCap: { period: "1 October - 31 December 2026", elecUnit: 26.32, elecStanding: 54.83, gasUnit: 7.97, gasStanding: 29.68 },

  // Welcome bonus by number of services switched (shown as "ask about" - UW terms apply). Set {} to hide.
  welcomeBonus: { 2: 50, 3: 150, 4: 250 },

  // UW standard prices used for the health check (as shown on uw.co.uk) - update when UW changes them
  uw: {
    asOf: "17 October 2026",
    broadband: [
      { name: "Full Fibre 150", speed: 150, monthly: 23.95 },
      { name: "Full Fibre 500", speed: 500, monthly: 30 },
      { name: "Full Fibre 900", speed: 900, monthly: 35 }
    ],
    partFibre: { name: "Fibre (part fibre, up to 63Mb)", speed: 63, monthly: 26 },
    broadbandAprilRise: 4,           // £/month added each April (published by UW)
    freeBroadbandMonths: 6,          // eligible addresses only - set 0 to hide
    mobile: [
      { name: "Go Essential", maxGB: 10, monthly: 6, desc: "10GB data, unlimited calls & texts" },
      { name: "Go Unlimited", maxGB: 99999, monthly: 13, desc: "unlimited data, calls & texts" }
    ],
    extraSimOffer: "Extra unlimited SIMs are currently free for the first 3 months (UW terms apply).",
    cover: { name: "UW Insurance & Home Cover", monthly: 25,
             includes: "boiler service & repairs, central heating, plumbing, drainage, electrics, pet cover and home security" },
    energyBelowCap: 50,              // "up to £x below the price cap with 3+ services" - set 0 to hide
    exitFeeHelp: 400                 // "up to £x towards early exit fees" - set 0 to hide
  },

  // Energy market check (update when Ofgem / the market moves)
  market: {
    checked: "14 October 2026",
    capTypicalAnnual: 1723, previousCapTypical: 1663,
    bestFixedElecUnit: 22.5, bestFixedGasUnit: 5.3, bestFixedTypicalAnnual: 1515,   // cheapest fixed deals on the market
    nextCapDate: "1 January 2027", nextCapISO: "2027-01-01", nextCapAnnounced: "by 25 November 2026",
    forecastLowPct: 16, forecastHighPct: 24           // published forecasts (Cornwall Insight, suppliers)
  },

  // How long you keep submissions (shown in the privacy notice)
  retentionMonths: 12
};
