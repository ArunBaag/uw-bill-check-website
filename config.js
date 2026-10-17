/* ===================================================================
   YOUR SETTINGS - edit this file only (in GitHub: open config.js > pencil icon > Commit).
   =================================================================== */
window.SITE_CONFIG = {
  partnerName: "Arun Baag",
  partnerTitle: "Authorised UW Partner",
  partnerId: "",                       // e.g. "UW12345" - leave "" to hide
  email: "er.arunbaag@gmail.com",
  whatsapp: "",                        // your mobile in international format, no + or spaces, e.g. "447700900123"
  area: "",                            // e.g. "Leicester & surrounding areas" - leave "" to hide

  // Free form delivery: sign up at https://web3forms.com with your email, copy the Access Key here.
  // Each completed bill check then arrives in your inbox. Leave "" to use email/WhatsApp buttons only.
  web3formsKey: "",

  // Ofgem price cap used for the instant bill health check (update each quarter)
  priceCap: { period: "1 October - 31 December 2026", elecUnit: 26.32, elecStanding: 54.83, gasUnit: 7.97, gasStanding: 29.68 },

  // Welcome bonus by number of services switched (shown as "ask about" - UW terms apply). Set {} to hide.
  welcomeBonus: { 2: 50, 3: 150, 4: 250 },

  // How long you keep submissions (shown in the privacy notice)
  retentionMonths: 12
};
