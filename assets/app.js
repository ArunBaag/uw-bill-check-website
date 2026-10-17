/* Free bill check - wizard, instant health check and send. No external libraries. */
(function () {
  "use strict";
  var CFG = window.SITE_CONFIG || {};
  var KEY = "uwbc_v1";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var num = function (v) { var n = parseFloat(String(v || "").replace(/[£,\s]/g, "")); return isFinite(n) && n >= 0 ? n : null; };
  var gbp = function (n, dp) { return "£" + Number(n).toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  var digits = function (s) { return String(s || "").replace(/\D/g, ""); };

  /* ---------- theme ---------- */
  function isDark() {
    var t = document.documentElement.dataset.theme;
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  $("#themeBtn").addEventListener("click", function () {
    var t = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = t;
    store.set("theme", t);
  });

  /* ---------- config binding ---------- */
  $$("[data-cfg]").forEach(function (el) { var v = CFG[el.dataset.cfg]; if (v) el.textContent = v; });
  $$("[data-cfg-first]").forEach(function (el) { var v = CFG[el.dataset.cfgFirst]; if (v) el.textContent = String(v).split(" ")[0]; });
  if (CFG.partnerName) document.title = "Free household bill check - " + CFG.partnerName;
  if (CFG.partnerId) $("#pid").textContent = " · Partner ID " + CFG.partnerId;
  if (CFG.area) $("#areaTxt").textContent = " · Covering " + CFG.area;
  var WA = digits(CFG.whatsapp);
  if (WA) {
    var h = $("#heroWhatsApp");
    h.hidden = false;
    h.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hi " + String(CFG.partnerName || "").split(" ")[0] + ", I'd like a free bill check.");
    h.target = "_blank"; h.rel = "noopener";
  }
  var bonus = CFG.welcomeBonus || {};
  var tiers = Object.keys(bonus).filter(function (k) { return num(bonus[k]); }).sort();
  if (tiers.length) {
    $("#bonusCard").hidden = false;
    $("#tiers").innerHTML = tiers.map(function (k) { return "<div><b>" + gbp(bonus[k]) + "</b><small>" + esc(k) + (k == 4 ? "+" : "") + " services</small></div>"; }).join("");
  }

  /* ---------- dynamic rows (SIMs, pets) ---------- */
  var simTpl = function (d) {
    d = d || {};
    return '<div class="row-item sim">' +
      '<label>Whose phone<input data-k="who" placeholder="e.g. Me" value="' + esc(d.who) + '"></label>' +
      '<label>Network<input data-k="network" list="networks" placeholder="e.g. O2" value="' + esc(d.network) + '"></label>' +
      '<label>£ / month<input data-k="monthly" type="number" min="0" step="0.01" inputmode="decimal" value="' + esc(d.monthly) + '"></label>' +
      '<label>Data<select data-k="data">' + ["", "Up to 10GB", "11-50GB", "51-150GB", "Unlimited", "Not sure"].map(function (o) {
        return "<option" + (o === (d.data || "") ? " selected" : "") + ' value="' + o + '">' + (o || "Choose") + "</option>"; }).join("") + "</select></label>" +
      '<button type="button" class="rm" aria-label="Remove this SIM">×</button>' +
      '<label style="grid-column:1/-1">Contract / handset ends (if any)<input data-k="end" type="date" value="' + esc(d.end) + '"></label>' +
      "</div>";
  };
  var petTpl = function (d) {
    d = d || {};
    return '<div class="row-item pet">' +
      '<label>Pet<select data-k="type">' + ["Dog", "Cat", "Other"].map(function (o) { return "<option" + (o === d.type ? " selected" : "") + ">" + o + "</option>"; }).join("") + "</select></label>" +
      '<label>Pet insurer<input data-k="insurer" placeholder="e.g. Petplan" value="' + esc(d.insurer) + '"></label>' +
      '<label>£ / month<input data-k="monthly" type="number" min="0" step="0.01" inputmode="decimal" value="' + esc(d.monthly) + '"></label>' +
      '<button type="button" class="rm" aria-label="Remove this pet">×</button></div>';
  };
  function addRow(box, tpl, d) { box.insertAdjacentHTML("beforeend", tpl(d)); }
  function rows(box) {
    return $$(".row-item", box).map(function (r) {
      var o = {}; $$("[data-k]", r).forEach(function (i) { o[i.dataset.k] = i.value.trim(); });
      return o;
    }).filter(function (o) { return Object.keys(o).some(function (k) { return k !== "type" && k !== "who" && o[k]; }); });
  }
  var sims = $("#sims"), pets = $("#pets");
  $("#addSim").addEventListener("click", function () { addRow(sims, simTpl); save(); });
  $("#addPet").addEventListener("click", function () { addRow(pets, petTpl); save(); });
  [sims, pets].forEach(function (box) {
    box.addEventListener("click", function (e) { if (e.target.classList.contains("rm")) { e.target.closest(".row-item").remove(); save(); } });
  });

  /* ---------- collect / restore ---------- */
  var form = $("#form");
  function setPath(o, path, v) {
    var p = path.split("."), cur = o;
    for (var i = 0; i < p.length - 1; i++) { cur[p[i]] = cur[p[i]] || {}; cur = cur[p[i]]; }
    cur[p[p.length - 1]] = v;
  }
  function collect() {
    var d = { v: 1, kind: "uw_site_v1" };
    $$("[name]", form).forEach(function (el) {
      if (!el.name || el.name === "botcheck" || el.name === "consent") return;
      if (el.type === "checkbox") return;
      setPath(d, el.name, el.value.trim());
    });
    var covers = $$('input[name="cover.covers"]:checked', form).map(function (c) { return c.value; });
    setPath(d, "cover.covers", covers);
    d.mobile = rows(sims);
    d.pets = rows(pets).filter(function (p) { return p.insurer || p.monthly; });
    return d;
  }
  function restore(d) {
    $$("[name]", form).forEach(function (el) {
      if (!el.name || el.name === "botcheck") return;
      if (el.name === "cover.covers") { el.checked = ((d.cover || {}).covers || []).indexOf(el.value) >= 0; return; }
      if (el.type === "checkbox") return;
      var v = el.name.split(".").reduce(function (o, k) { return o && o[k]; }, d);
      if (v != null && typeof v !== "object") el.value = v;
    });
    sims.innerHTML = ""; (d.mobile && d.mobile.length ? d.mobile : [{ who: "Me" }]).forEach(function (s) { addRow(sims, simTpl, s); });
    pets.innerHTML = ""; (d.pets || []).forEach(function (p) { addRow(pets, petTpl, p); });
  }
  var savedT;
  function save() {
    var d = collect(); d.step = cur;
    store.set(KEY, JSON.stringify(d));
    var s = $("#saved"); s.textContent = "Saved on this device ✓";
    clearTimeout(savedT); savedT = setTimeout(function () { s.textContent = ""; }, 1800);
  }
  form.addEventListener("input", save);
  form.addEventListener("change", save);

  /* ---------- wizard ---------- */
  var steps = $$("fieldset.step", form), cur = 0;
  var stepper = $("#stepper");
  stepper.innerHTML = steps.map(function (s, i) { return '<li><button type="button" data-i="' + i + '">' + (i + 1) + ". " + esc(s.dataset.title) + "</button></li>"; }).join("");
  stepper.addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    var i = +b.dataset.i; if (i > cur && !valid()) return; go(i, true);
  });
  function valid() {
    if (cur !== 0) return true;
    var ok = true;
    $$("[required]", steps[0]).forEach(function (el) {
      var bad = !el.value.trim(); el.classList.toggle("err", bad);
      if (bad && ok) { el.focus(); ok = false; }
    });
    var em = $('[name="contact.email"]'), ph = $('[name="contact.phone"]');
    if (ok && em.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value.trim())) { em.classList.add("err"); em.focus(); ok = false; }
    if (ok && !em.value.trim() && digits(ph.value).length < 10) {
      ph.classList.add("err"); ph.focus(); ok = false;
      $("#saved").textContent = "Please add a mobile number or email so I can reply.";
    }
    return ok;
  }
  function go(i, scroll) {
    cur = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function (s, k) { s.hidden = k !== cur; });
    $$("button", stepper).forEach(function (b, k) { b.classList.toggle("on", k === cur); b.classList.toggle("done", k < cur); b.setAttribute("aria-current", k === cur ? "step" : "false"); });
    $("#bar").style.width = Math.round(cur / (steps.length - 1) * 100) + "%";
    $("#backBtn").style.visibility = cur === 0 ? "hidden" : "visible";
    $("#nextBtn").hidden = cur === steps.length - 1;
    if (cur === steps.length - 1) renderResults();
    if (scroll) $("#check").scrollIntoView({ behavior: "smooth", block: "start" });
    save();
  }
  $("#nextBtn").addEventListener("click", function () { if (valid()) go(cur + 1, true); });
  $("#backBtn").addEventListener("click", function () { go(cur - 1, true); });

  /* ---------- health check ---------- */
  var CAP = CFG.priceCap || {};
  function daysTo(d) { if (!d) return null; var t = new Date(d + "T00:00:00"); if (isNaN(t)) return null; return Math.round((t - new Date().setHours(0, 0, 0, 0)) / 864e5); }
  function fmtDate(d) { var t = new Date(d + "T00:00:00"); return isNaN(t) ? d : t.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

  function analyse(d) {
    var out = [], spend = 0, flags = 0, checks = 0, counted = [];
    var add = function (o) { out.push(o); };

    /* energy */
    var e = d.energy || {};
    if (e.fuel !== "I don't pay energy bills") {
      var it = [], lvl = "good", gas = e.fuel !== "Electricity only";
      var m = num(e.monthly); if (m) { spend += m * 12; counted.push("Energy"); }
      var cmp = function (label, v, cap, unit) {
        if (v == null || !cap) return;
        checks++;
        var diff = (v - cap) / cap * 100;
        if (diff > 3) { it.push(label + " " + v + unit + " is about " + Math.round(diff) + "% above the current price cap (" + cap + unit + ")."); lvl = "bad"; flags++; }
        else if (diff < -3) it.push(label + " " + v + unit + " is below the price cap (" + cap + unit + ") - nice.");
        else it.push(label + " " + v + unit + " is in line with the price cap (" + cap + unit + ").");
      };
      cmp("Electricity unit rate", num(e.elec_unit), CAP.elecUnit, "p");
      cmp("Electricity standing charge", num(e.elec_sc), CAP.elecStanding, "p/day");
      if (gas) { cmp("Gas unit rate", num(e.gas_unit), CAP.gasUnit, "p"); cmp("Gas standing charge", num(e.gas_sc), CAP.gasStanding, "p/day"); }
      var ek = num(e.elec_kwh), gk = num(e.gas_kwh);
      if (ek && num(e.elec_unit) != null) {
        var yr = (ek * num(e.elec_unit) + 365 * (num(e.elec_sc) || 0)) / 100;
        if (gas && gk && num(e.gas_unit) != null) yr += (gk * num(e.gas_unit) + 365 * (num(e.gas_sc) || 0)) / 100;
        it.push("At your rates and usage, energy costs roughly " + gbp(yr) + " a year (" + gbp(yr / 12) + "/month).");
        if (m && m * 12 > yr * 1.2) { it.push("Your Direct Debit looks higher than your usage needs - worth checking for a credit build-up."); if (lvl === "good") lvl = "warn"; }
        if (m && m * 12 < yr * 0.85) { it.push("Your Direct Debit looks lower than your usage - you may be building up a debt."); if (lvl === "good") lvl = "warn"; }
      }
      if (e.type === "Variable / standard") { checks++; it.push("You're on a variable tariff that follows the price cap - it changes every 3 months. Fixed or tracker options can cost less."); if (lvl === "good") lvl = "warn"; flags++; }
      if (e.type === "Prepayment") it.push("Prepayment meters can usually be switched - I can check what's possible for your home.");
      var de = daysTo(e.end);
      if (de != null) {
        checks++;
        if (de < 0) { it.push("Your fixed deal ended on " + fmtDate(e.end) + " - you're probably on a standard variable rate now."); lvl = "bad"; flags++; }
        else if (de <= 49) { it.push("Your fix ends " + fmtDate(e.end) + " - you can usually switch now with no exit fees (the 49-day rule)."); if (lvl === "good") lvl = "warn"; flags++; }
        else it.push("Your fix ends " + fmtDate(e.end) + " (" + de + " days). I'll note the best time to move.");
      }
      var xf = num(e.exit_fee); if (xf) it.push("Exit fee: " + gbp(xf) + " per fuel if you leave early" + (gas ? " (up to " + gbp(xf * 2) + " for both)." : "."));
      if (e.smart === "No") it.push("No smart meter - some of the cheapest tariffs need one; they're free to install.");
      if (!it.length && !m) it.push("Add your monthly payment or unit rates for a proper check.");
      add({ k: "energy", t: "⚡ Energy" + (e.supplier ? " - " + e.supplier : ""), lvl: lvl, items: it });
    }

    /* broadband */
    var b = d.broadband || {};
    if (b.has !== "No") {
      var bi = [], bl = "good", bm = num(b.monthly), sp = num(b.speed);
      if (bm) {
        spend += bm * 12; counted.push("Broadband"); checks++;
        var typ = !sp ? 32 : sp <= 80 ? 25 : sp <= 300 ? 30 : sp <= 600 ? 35 : 40;
        if (bm > typ + 3) { bi.push(gbp(bm, 2) + "/month is above the typical " + gbp(typ) + " or so for " + (sp ? sp + "Mb" : "a similar speed") + " - about " + gbp((bm - typ) * 12) + " a year more."); bl = "bad"; flags++; }
        else bi.push(gbp(bm, 2) + "/month is around the typical price for " + (sp ? sp + "Mb." : "this kind of package."));
      }
      var db = daysTo(b.end);
      if (db != null) {
        checks++;
        if (db < 0) { bi.push("Out of contract since " + fmtDate(b.end) + " - out-of-contract prices are often the highest. No exit fee to move."); bl = "bad"; flags++; }
        else if (db <= 60) { bi.push("Contract ends " + fmtDate(b.end) + " - a great time to look (no exit fee after that date)."); if (bl === "good") bl = "warn"; flags++; }
        else bi.push("Contract ends " + fmtDate(b.end) + ".");
      }
      var bx = num(b.exit_fee); if (bx) bi.push("Exit fee if you left now: " + gbp(bx) + ".");
      bi.push("Most providers raise prices every April - check how much yours goes up.");
      if (b.tv === "Yes") bi.push("TV is included - I'll make sure any comparison keeps what you watch.");
      add({ k: "broadband", t: "📶 Broadband" + (b.provider ? " - " + b.provider : ""), lvl: bl, items: bi });
    }

    /* mobile */
    var mob = d.mobile || [];
    if (mob.length) {
      var mi = [], ml = "good", mt = 0;
      mob.forEach(function (s, i) {
        var mm = num(s.monthly); if (!mm) return;
        mt += mm; checks++;
        var lim = { "Up to 10GB": 8, "11-50GB": 12, "51-150GB": 15, "Unlimited": 20 }[s.data] || 15;
        var who = (s.who || "SIM " + (i + 1)) + (s.network ? " (" + s.network + ")" : "");
        var ds = daysTo(s.end), inHandset = ds != null && ds > 0;
        if (mm > lim + 3 && !inHandset) { mi.push(who + ": " + gbp(mm, 2) + "/month - SIM-only deals with " + (s.data || "similar data") + " are often around " + gbp(lim) + "."); ml = "bad"; flags++; }
        else if (inHandset) mi.push(who + ": contract runs to " + fmtDate(s.end) + " - I'll note it so you can move when it ends.");
        else if (ds != null && ds <= 0) { mi.push(who + ": handset contract has ended - if the price didn't drop, you may be still paying for the phone."); ml = "bad"; flags++; }
        else mi.push(who + ": " + gbp(mm, 2) + "/month looks fair.");
      });
      if (mt) { spend += mt * 12; counted.push("Mobile"); mi.unshift(mob.length + " SIM" + (mob.length > 1 ? "s" : "") + ", " + gbp(mt, 2) + "/month in total."); }
      if (mi.length) add({ k: "mobile", t: "📱 Mobile", lvl: ml, items: mi });
    }

    /* home cover, pets & security (one UW package) */
    var cv = d.cover || {}, sec = d.security || {}, pt = d.pets || [];
    var hi = [], hl = "good", policies = 0, ht = 0;
    var cm = num(cv.monthly); if (cm) { policies++; ht += cm; hi.push("Boiler & home cover" + (cv.provider ? " with " + cv.provider : "") + ": " + gbp(cm, 2) + "/month" + ((cv.covers || []).length ? " (" + cv.covers.join(", ") + ")." : ".")); }
    pt.forEach(function (p) { var pm = num(p.monthly); if (pm) { policies++; ht += pm; hi.push((p.type || "Pet") + " insurance" + (p.insurer ? " with " + p.insurer : "") + ": " + gbp(pm, 2) + "/month."); } });
    var sm = num(sec.monthly); if (sm) { policies++; ht += sm; hi.push("Home security" + (sec.provider ? " with " + sec.provider : "") + ": " + gbp(sm, 2) + "/month."); }
    if (policies) {
      spend += ht * 12; counted.push("Home cover"); checks++;
      if (policies >= 2) { hi.push("You're paying " + policies + " separate providers - about " + gbp(ht, 2) + "/month. These can be combined into one package on one bill."); hl = hl === "good" ? "warn" : hl; flags++; }
      if ((cv.covers || []).length && (cv.covers || []).length < 4) hi.push("Your cover doesn't include everything (e.g. " + ["Plumbing", "Drainage", "Electrics", "Central heating"].filter(function (x) { return (cv.covers || []).indexOf(x) < 0; }).slice(0, 2).join(", ") + ") - I can show a package that does.");
      add({ k: "home", t: "🏠 Home cover & insurance", lvl: hl, items: hi });
    } else if (cv.provider) {
      add({ k: "home", t: "🏠 Home cover & insurance", lvl: "info", items: ["Add your prices and I'll check them."] });
    }

    /* car */
    var car = d.car || {}, ca = num(car.annual), dc = daysTo(car.renewal);
    if (ca || dc != null) {
      var ci = [], cl = "info";
      if (ca) { spend += ca; counted.push("Car insurance"); ci.push("Car insurance" + (car.insurer ? " with " + car.insurer : "") + ": " + gbp(ca) + " a year."); }
      if (dc != null && dc >= 0 && dc <= 60) { ci.push("Renews " + fmtDate(car.renewal) + " - prices are usually lowest when you compare about 3-4 weeks before renewal."); cl = "warn"; flags++; }
      else if (dc != null && dc >= 0) ci.push("Renews " + fmtDate(car.renewal) + ". UW car insurance is coming soon - I'll remind you before then.");
      add({ k: "car", t: "🚗 Car insurance", lvl: cl, items: ci });
    }

    var score = checks ? Math.max(20, Math.min(98, Math.round(100 - flags / checks * 55 - Math.min(flags, 8) * 2))) : null;
    return { list: out, spend: spend, flags: flags, score: score, counted: counted };
  }

  function renderResults() {
    var d = collect(), a = analyse(d), first = (d.contact && d.contact.name || "").split(" ")[0];
    var sc = a.score, col = sc == null ? "var(--muted)" : sc >= 75 ? "var(--good)" : sc >= 50 ? "var(--warn)" : "var(--bad)";
    var headline = sc == null ? "Add a few prices to get your score" : sc >= 75 ? "Looking healthy" + (first ? ", " + esc(first) : "") + "!" : sc >= 50 ? "Some room to improve" : "You could be overpaying";
    var html =
      '<div class="score"><div class="ring" style="--v:' + (sc || 0) + ";--col:" + col + '"><b>' + (sc == null ? "–" : sc) + "</b></div>" +
      "<div><h3>" + headline + "</h3><p>" + (a.flags ? "I spotted <b>" + a.flags + " thing" + (a.flags > 1 ? "s" : "") + "</b> worth looking at." : "Nothing major flagged from what you entered.") +
      " Send this to me and I'll prepare your personal comparison.</p></div></div>" +
      '<div class="kpis"><div class="kpi"><small>You pay about (a year)</small><b>' + (a.spend ? gbp(a.spend) : "–") + "</b></div>" +
      '<div class="kpi"><small>That\'s a month</small><b>' + (a.spend ? gbp(a.spend / 12) : "–") + "</b></div>" +
      '<div class="kpi"><small>Things to check</small><b>' + a.flags + "</b></div></div>";
    var tagTxt = { bad: "Check this", warn: "Worth a look", good: "Looks OK", info: "Noted" };
    html += a.list.map(function (r) {
      return '<div class="res ' + r.lvl + '"><h4>' + esc(r.t) + '<span class="tag ' + r.lvl + '">' + tagTxt[r.lvl] + "</span></h4><ul>" +
        r.items.map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul></div>";
    }).join("");
    var nUW = a.counted.filter(function (x) { return x !== "Car insurance"; }).length;
    if (nUW >= 2) html += '<div class="res info"><h4>✨ One bill for everything<span class="tag info">Idea</span></h4><ul><li>You pay ' + nUW +
      " separate household bills. Utility Warehouse puts energy, broadband, mobile and home cover on one monthly bill" +
      (tiers.length ? ", and there's a welcome bonus when you switch 2 or more services (UW terms apply)" : "") + ".</li><li>I'll show you exactly how your numbers compare - no obligation.</li></ul></div>";
    html += '<p class="tiny">Your health check is a general guide based on what you entered and typical market prices (price cap ' + esc(CAP.period || "") +
      "). It is not a quote or advice. Real prices depend on your home and usage and are confirmed only through UW's official sign-up.</p>";
    $("#results").innerHTML = html;
    a.counted.length ? $("#results").dataset.ok = "1" : delete $("#results").dataset.ok;
    updateSend(d, a);
  }

  /* ---------- summary text ---------- */
  function line(label, v) { return v ? label + ": " + v + "\n" : ""; }
  function summary(d, a, short) {
    var c = d.contact || {}, e = d.energy || {}, b = d.broadband || {}, s = "";
    s += "BILL CHECK - " + (c.name || "") + " (" + (c.postcode || "").toUpperCase() + ")\n";
    s += line("Phone", c.phone) + line("Email", c.email) + line("Contact by", (c.method || "") + (c.time ? ", " + c.time : "")) + line("Household", [c.household && c.household + " people", c.tenure].filter(Boolean).join(", "));
    if (a.score != null) s += "Health score: " + a.score + "/100 · about " + gbp(a.spend) + "/yr · " + a.flags + " to check\n";
    s += "\nENERGY: " + [e.fuel, e.supplier, e.tariff, e.type].filter(Boolean).join(" · ") + "\n" +
      line("  Monthly", e.monthly && "£" + e.monthly) + line("  Fix ends", e.end) + line("  Exit fee/fuel", e.exit_fee && "£" + e.exit_fee) + line("  Smart", e.smart);
    if (!short) s += line("  Elec", (e.elec_unit || e.elec_sc || e.elec_kwh) && [e.elec_unit && e.elec_unit + "p/kWh", e.elec_sc && e.elec_sc + "p/day", e.elec_kwh && e.elec_kwh + "kWh/yr"].filter(Boolean).join(", ")) +
      line("  Gas", (e.gas_unit || e.gas_sc || e.gas_kwh) && [e.gas_unit && e.gas_unit + "p/kWh", e.gas_sc && e.gas_sc + "p/day", e.gas_kwh && e.gas_kwh + "kWh/yr"].filter(Boolean).join(", "));
    s += "\nBROADBAND: " + (b.has === "No" ? "none" : [b.provider, b.speed && b.speed + "Mb", b.monthly && "£" + b.monthly + "/mo"].filter(Boolean).join(" · ")) + "\n" +
      line("  Ends", b.end) + line("  Exit fee", b.exit_fee && "£" + b.exit_fee) + line("  TV", b.tv) + line("  Landline", b.landline);
    if ((d.mobile || []).length) s += "\nMOBILE:\n" + d.mobile.map(function (m) { return "  - " + [m.who, m.network, m.monthly && "£" + m.monthly + "/mo", m.data, m.end && "ends " + m.end].filter(Boolean).join(" · "); }).join("\n") + "\n";
    var h = d.home || {}, cv = d.cover || {}, sec = d.security || {}, car = d.car || {};
    s += "\nHOME COVER & INSURANCE:\n" +
      line("  Home cover", [cv.provider, cv.monthly && "£" + cv.monthly + "/mo", (cv.covers || []).join(", ")].filter(Boolean).join(" · ")) +
      (d.pets || []).map(function (p) { return "  Pet: " + [p.type, p.insurer, p.monthly && "£" + p.monthly + "/mo"].filter(Boolean).join(" · ") + "\n"; }).join("") +
      line("  Security", [sec.provider, sec.monthly && "£" + sec.monthly + "/mo"].filter(Boolean).join(" · "));
    s += line("\nCAR", [car.insurer, car.annual && "£" + car.annual + "/yr", car.renewal && "renews " + car.renewal, car.cars && car.cars + " car(s)"].filter(Boolean).join(" · "));
    s += line("\nNotes", d.notes);
    return s.replace(/\n{3,}/g, "\n\n").trim();
  }

  /* ---------- send ---------- */
  var KEY3 = String(CFG.web3formsKey || "").trim();
  var consent = $("#consent"), sendBtn = $("#sendBtn"), waBtn = $("#waBtn"), mailBtn = $("#mailBtn");
  if (!KEY3) sendBtn.hidden = true;
  if (!WA) waBtn.hidden = true;
  if (!CFG.email) mailBtn.hidden = true;
  function updateSend(d, a) {
    d = d || collect(); a = a || analyse(d);
    var ok = consent.checked;
    sendBtn.disabled = !ok;
    [waBtn, mailBtn].forEach(function (x) { x.classList.toggle("btn-disabled", !ok); x.setAttribute("aria-disabled", String(!ok)); });
    var txt = summary(d, a, true);
    if (WA) waBtn.href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(txt.slice(0, 1800));
    if (CFG.email) mailBtn.href = "mailto:" + CFG.email + "?subject=" + encodeURIComponent("Bill check - " + ((d.contact || {}).name || "")) + "&body=" + encodeURIComponent(summary(d, a, false).slice(0, 1800));
    $("#sendNote").textContent = ok ? (KEY3 ? "Press Send - it arrives straight in my inbox." : "Choose WhatsApp or email - your summary is filled in for you.") : "Please tick the box above to send.";
  }
  consent.addEventListener("change", function () { updateSend(); });
  [waBtn, mailBtn].forEach(function (x) {
    x.addEventListener("click", function (e) {
      if (!consent.checked) { e.preventDefault(); consent.focus(); $("#sendNote").textContent = "Please tick the box above first."; return; }
      thanks(x === waBtn ? "WhatsApp" : "email");
    });
  });
  sendBtn.addEventListener("click", function () {
    if (!consent.checked || !KEY3) return;
    if ($('[name="botcheck"]').value) return;
    var d = collect(), a = analyse(d), c = d.contact || {};
    d.submitted = new Date().toISOString(); d.consent = { time: d.submitted, text: "Agreed to be contacted about a comparison (privacy notice)" };
    d.health = { score: a.score, annual_spend: Math.round(a.spend), flags: a.flags };
    sendBtn.disabled = true; sendBtn.textContent = "Sending…";
    var body = {
      access_key: KEY3,
      subject: "New bill check: " + (c.name || "") + " (" + (c.postcode || "").toUpperCase() + ")",
      from_name: "Bill check website",
      name: c.name, email: c.email || undefined, phone: c.phone,
      message: summary(d, a, false),
      hub_import_json: JSON.stringify(d),
      botcheck: ""
    };
    fetch("https://api.web3forms.com/submit", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || j.success === false) throw new Error(j.message || "Send failed"); }); })
      .then(function () { thanks("email"); sendBtn.textContent = "Sent ✓"; })
      .catch(function () {
        sendBtn.disabled = false; sendBtn.textContent = "Try again";
        $("#sendResult").innerHTML = '<div class="fail">Sorry, that didn\'t go through. Please use ' + (WA ? "WhatsApp or " : "") + "the email button instead - your details are filled in for you.</div>";
      });
  });
  function thanks(via) {
    var first = String(CFG.partnerName || "I").split(" ")[0];
    $("#sendResult").innerHTML = '<div class="ok"><b>Thank you!</b> ' + (via === "WhatsApp" ? "Just press send in WhatsApp. " : "") + esc(first) +
      " will be in touch soon with your personal comparison. Keep your latest bills handy - and nothing changes unless you say yes.</div>";
    store.set(KEY + "_sent", new Date().toISOString());
  }

  /* ---------- clear ---------- */
  $("#clearData").addEventListener("click", function (e) {
    e.preventDefault();
    store.del(KEY); store.del(KEY + "_sent");
    form.reset(); restore({}); go(0, false); $("#results").innerHTML = ""; $("#sendResult").innerHTML = "";
    $("#saved").textContent = "Your saved answers were cleared from this device.";
  });

  /* ---------- start ---------- */
  var init = {};
  try { init = JSON.parse(store.get(KEY) || "{}") || {}; } catch (e) { init = {}; }
  restore(init);
  go(Math.min(+init.step || 0, steps.length - 1), false);
  $("#saved").textContent = "";
})();
