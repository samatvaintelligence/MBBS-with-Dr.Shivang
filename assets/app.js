// WhatsApp number is Dr. Shivang's personal mentorship line (per the brand PDF).
// International format, digits only, no + or spaces.
const WA_NUMBER = "919211567773";
const WA_MESSAGE = "I want to be a doctor";
const INSTAGRAM_URL = "https://www.instagram.com/mbbswithdr.shivang/?__d=1";
const FACEBOOK_URL = "https://www.facebook.com/share/18g92rEW95/?mibextid=wwXIfr";
const CALENDLY_URL = "https://calendly.com/samatvaintelligence/30min";

// Paste the deployed Google Apps Script web app URL here after deployment.
const LEAD_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbx0_WkMEnGuSnmkV3gxoWrlxbWFIgebWIcMjyXWJM6p9U82f0uZApbDtMdO1ILNN_DKOg/exec";

// Paste the Meta Pixel ID here. Tracking is skipped when this is empty.
const META_PIXEL_ID = "853031131149794";

const ATTRIBUTION_STORAGE_KEY = "mbbsWithDrShivangAttribution";
const ATTRIBUTION_KEYS = [
  "utm_id",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "ad_platform",
  "campaign_id",
  "adset_id",
  "ad_id",
  "placement",
  "fbclid",
];

document.addEventListener("DOMContentLoaded", () => {
  initAttribution();
  initMetaPixel();
  rewriteWhatsAppLinks();
  rewriteTelLinks();
  rewriteSocialLinks();
  initCalendlyButtons();
  initFeeToggle();
  initFeeCurrencyToggle();
  initLanguageToggle();
  initAdmissionsForm();
});

function initAttribution() {
  const attribution = collectAttribution();
  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
  } catch (err) {
    // Private browsing can block storage; the in-memory attribution still works for this page.
  }
  populateAttributionFields(attribution);
}

function collectAttribution() {
  const params = new URLSearchParams(window.location.search);
  const stored = getStoredAttribution();
  const attribution = { ...stored };

  ATTRIBUTION_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) attribution[key] = value;
  });

  const fbclid = params.get("fbclid") || attribution.fbclid;
  if (fbclid) {
    attribution.fbclid = fbclid;
    attribution.fbc = attribution.fbc || `fb.1.${Date.now()}.${fbclid}`;
  }

  const fbcCookie = getCookie("_fbc");
  if (fbcCookie) attribution.fbc = fbcCookie;

  const fbpCookie = getCookie("_fbp");
  if (fbpCookie) attribution.fbp = fbpCookie;

  if (!attribution.landingPage) {
    attribution.landingPage = window.location.href;
  }

  if (!attribution.referrer && document.referrer) {
    attribution.referrer = document.referrer;
  }

  attribution.currentPage = window.location.href;
  attribution.sourcePage = window.location.pathname.split("/").pop() || "index.html";
  attribution.userAgent = navigator.userAgent;

  return attribution;
}

function getStoredAttribution() {
  try {
    return JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}");
  } catch (err) {
    return {};
  }
}

function getAttribution() {
  return collectAttribution();
}

function populateAttributionFields(attribution) {
  document.querySelectorAll("[data-attribution-field]").forEach((input) => {
    const key = input.getAttribute("data-attribution-field");
    input.value = attribution[key] || "";
  });
}

function initMetaPixel() {
  if (!META_PIXEL_ID) return;

  if (!window.fbq) {
    !(function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  }

  window.fbq("init", META_PIXEL_ID);
  window.fbq("track", "PageView", getTrackingParams());
}

function getTrackingParams(extra = {}) {
  const attribution = getAttribution();
  return {
    page_title: document.title,
    page_path: window.location.pathname,
    source_page: attribution.sourcePage || "",
    landing_page: attribution.landingPage || "",
    utm_source: attribution.utm_source || "",
    utm_medium: attribution.utm_medium || "",
    utm_campaign: attribution.utm_campaign || "",
    utm_content: attribution.utm_content || "",
    utm_term: attribution.utm_term || "",
    utm_id: attribution.utm_id || "",
    ad_platform: attribution.ad_platform || "",
    campaign_id: attribution.campaign_id || "",
    adset_id: attribution.adset_id || "",
    ad_id: attribution.ad_id || "",
    placement: attribution.placement || "",
    fbclid: attribution.fbclid || "",
    fbc: attribution.fbc || "",
    fbp: attribution.fbp || "",
    ...extra,
  };
}

function trackMetaEvent(eventName, params = {}, options = {}) {
  if (!window.fbq) return;

  const eventType = options.standard ? "track" : "trackCustom";
  window.fbq(eventType, eventName, getTrackingParams(params));
}

function rewriteWhatsAppLinks() {
  const url = getWhatsAppUrl();
  document.querySelectorAll('[data-wa="1"]').forEach((el) => {
    el.setAttribute("href", url);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
    el.addEventListener("click", () => {
      trackMetaEvent("WhatsAppClick", {
        link_text: getElementText(el),
        destination: "whatsapp",
      });
    });
  });
}

function getWhatsAppUrl(message = WA_MESSAGE) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
}

function rewriteTelLinks() {
  document.querySelectorAll('[data-tel="1"]').forEach((el) => {
    el.setAttribute("href", `tel:+${WA_NUMBER}`);
  });
}

function rewriteSocialLinks() {
  document.querySelectorAll('[data-social="instagram"]').forEach((el) => {
    el.setAttribute("href", INSTAGRAM_URL);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });

  document.querySelectorAll('[data-social="facebook"]').forEach((el) => {
    if (FACEBOOK_URL) {
      el.setAttribute("href", FACEBOOK_URL);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
      el.setAttribute("aria-label", "Facebook");
      el.setAttribute("title", "Facebook");
      el.removeAttribute("aria-disabled");
      return;
    }

    el.setAttribute("href", "#");
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("title", "Facebook page to be created");
    el.addEventListener("click", (event) => event.preventDefault());
  });
}

function initCalendlyButtons() {
  document.querySelectorAll('[data-calendly="1"]').forEach((el) => {
    el.addEventListener("click", (event) => {
      event.preventDefault();
      const calendlyUrl = el.getAttribute("data-calendly-url") || CALENDLY_URL;

      trackMetaEvent("CalendlyClick", {
        calendly_url: calendlyUrl,
        link_text: getElementText(el),
      });

      if (window.Calendly && typeof window.Calendly.initPopupWidget === "function") {
        window.Calendly.initPopupWidget({ url: calendlyUrl });
        return;
      }

      window.open(calendlyUrl, "_blank", "noopener,noreferrer");
    });
  });
}

function initFeeToggle() {
  const toggles = document.querySelectorAll("[data-fee-view]");
  const panels = document.querySelectorAll("[data-fee-panel]");
  if (!toggles.length || !panels.length) return;

  function showFeeView(view) {
    toggles.forEach((toggle) => {
      const isActive = toggle.getAttribute("data-fee-view") === view;
      toggle.setAttribute("aria-selected", String(isActive));
      toggle.classList.toggle("bg-zinc-950", isActive);
      toggle.classList.toggle("text-white", isActive);
      toggle.classList.toggle("shadow-sm", isActive);
      toggle.classList.toggle("text-muted", !isActive);
    });

    panels.forEach((panel) => {
      panel.classList.toggle("hidden", panel.getAttribute("data-fee-panel") !== view);
    });
  }

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => showFeeView(toggle.getAttribute("data-fee-view")));
  });
}

function initFeeCurrencyToggle() {
  const toggles = document.querySelectorAll("[data-fee-currency]");
  const amounts = document.querySelectorAll("[data-currency-amount]");
  const units = document.querySelectorAll("[data-currency-unit]");
  if (!toggles.length || !amounts.length) return;

  function showCurrency(currency) {
    toggles.forEach((toggle) => {
      const isActive = toggle.getAttribute("data-fee-currency") === currency;
      toggle.setAttribute("aria-selected", String(isActive));
      toggle.classList.toggle("bg-zinc-950", isActive);
      toggle.classList.toggle("text-white", isActive);
      toggle.classList.toggle("shadow-sm", isActive);
      toggle.classList.toggle("text-muted", !isActive);
    });

    amounts.forEach((amount) => {
      const value = amount.getAttribute(`data-${currency}`);
      if (value) amount.textContent = value;
    });

    units.forEach((unit) => {
      const value = unit.getAttribute(`data-${currency}`);
      if (value) unit.textContent = value;
    });
  }

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => showCurrency(toggle.getAttribute("data-fee-currency")));
  });
}

function initLanguageToggle() {
  const group = document.querySelector('[data-toggle="delivery"]');
  if (!group) return;
  const buttons = group.querySelectorAll("button");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => {
        b.classList.remove("bg-on-surface", "text-background");
        b.classList.add("text-on-surface");
      });
      btn.classList.add("bg-on-surface", "text-background");
      btn.classList.remove("text-on-surface");
    });
  });
}

function initAdmissionsForm() {
  const form = document.getElementById("admissions-form");
  if (!form) return;

  const steps = Array.from(form.querySelectorAll("[data-step]"));
  const progressSegments = document.querySelectorAll("[data-progress]");
  const stepLabels = document.querySelectorAll("[data-step-label]");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitError = document.getElementById("lead-submit-error");
  const originalSubmitText = submitButton ? submitButton.textContent : "";
  let current = 0;
  let formStarted = false;

  const state = {
    fullName: "",
    phone: "",
  };

  function show(idx) {
    steps.forEach((s, i) => {
      s.classList.toggle("hidden", i !== idx);
    });
    progressSegments.forEach((seg, i) => {
      seg.classList.toggle("bg-primary", i <= idx);
      seg.classList.toggle("bg-border-subtle", i > idx);
    });
    stepLabels.forEach((lbl, i) => {
      lbl.classList.toggle("text-on-surface", i === idx);
      lbl.classList.toggle("font-bold", i === idx);
      lbl.classList.toggle("text-muted", i !== idx);
    });
    current = idx;
  }

  function markFormStarted() {
    if (formStarted) return;
    formStarted = true;
    trackMetaEvent("LeadFormStart", { form_id: form.id });
  }

  function validateStep(idx) {
    const stepEl = steps[idx];
    const inputs = stepEl.querySelectorAll("input[required], select[required]");
    let valid = true;
    inputs.forEach((input) => {
      const err = input.parentElement.querySelector("[data-error]");
      if (!input.value.trim() || !input.checkValidity()) {
        input.classList.add("border-error-red", "border-2");
        input.classList.remove("border-border-subtle");
        if (err) err.classList.remove("hidden");
        valid = false;
      } else {
        input.classList.remove("border-error-red", "border-2");
        input.classList.add("border-border-subtle");
        if (err) err.classList.add("hidden");
      }
    });
    return valid;
  }

  function captureStep(idx) {
    const stepEl = steps[idx];
    stepEl.querySelectorAll("[name]").forEach((input) => {
      if (Object.prototype.hasOwnProperty.call(state, input.name)) {
        state[input.name] = input.value;
      }
    });
  }

  function captureAllSteps() {
    steps.forEach((_, idx) => captureStep(idx));
  }

  function resetState() {
    Object.keys(state).forEach((key) => {
      state[key] = "";
    });
  }

  function renderReview() {
    const reviewEl = document.getElementById("review-summary");
    if (!reviewEl) return;
    reviewEl.innerHTML = `
      <div class="flex justify-between gap-4 py-3 border-b border-border-subtle"><span class="text-muted">Name</span><span class="font-bold text-right">${escapeHtml(state.fullName)}</span></div>
      <div class="flex justify-between gap-4 py-3"><span class="text-muted">Phone</span><span class="font-bold text-right">${escapeHtml(state.phone)}</span></div>
    `;
  }

  function buildLeadPayload() {
    const attribution = getAttribution();
    return {
      submittedAt: new Date().toISOString(),
      fullName: state.fullName.trim(),
      phone: state.phone.trim(),
      leadStatus: "new",
      followUpOwner: "Dr. Shivang",
      notes: "",
      finalOutcome: "",
      aiSummary: "",
      consentToContact: true,
      sourcePage: attribution.sourcePage || "",
      landingPage: attribution.landingPage || "",
      referrer: attribution.referrer || "",
      attribution,
    };
  }

  async function submitLead(payload) {
    if (!LEAD_ENDPOINT_URL) {
      throw new Error("Lead endpoint is not configured.");
    }

    const response = await fetch(LEAD_ENDPOINT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    // Apps Script accepts the POST, but browsers usually expose the response as
    // opaque because Google does not send normal CORS headers for ContentService.
    if (response.type === "opaque") {
      return { ok: true, opaque: true };
    }

    let result = null;
    try {
      result = await response.json();
    } catch (err) {
      result = null;
    }

    if (!response.ok || (result && result.ok === false)) {
      throw new Error((result && result.error) || "Lead submission failed.");
    }

    return result || { ok: true };
  }

  function setSubmitting(isSubmitting) {
    if (!submitButton) return;
    submitButton.disabled = isSubmitting;
    submitButton.classList.toggle("opacity-70", isSubmitting);
    submitButton.classList.toggle("cursor-wait", isSubmitting);
    submitButton.textContent = isSubmitting ? "Saving details..." : originalSubmitText;
  }

  function showSubmitError(message) {
    if (!submitError) return;
    const messageEl = submitError.querySelector("[data-lead-error-message]");
    if (messageEl) messageEl.textContent = message;
    submitError.classList.remove("hidden");
  }

  function hideSubmitError() {
    if (submitError) submitError.classList.add("hidden");
  }

  form.addEventListener("input", markFormStarted);

  form.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
      markFormStarted();
      if (!validateStep(current)) return;
      captureStep(current);
      if (current === steps.length - 2) renderReview();
      show(current + 1);
    });
  });

  form.querySelectorAll("[data-prev]").forEach((btn) => {
    btn.addEventListener("click", () => show(current - 1));
  });

  form.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = parseInt(btn.getAttribute("data-edit"), 10);
      show(target);
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    markFormStarted();
    if (!validateStep(current)) return;
    captureAllSteps();
    hideSubmitError();
    setSubmitting(true);

    const payload = buildLeadPayload();
    const whatsappUrl = getWhatsAppUrl();

    try {
      await submitLead(payload);
      trackMetaEvent("LeadSubmitted", {
        form_id: form.id,
        next_step: "whatsapp",
      });
      trackMetaEvent("Lead", { form_id: form.id }, { standard: true });

      form.reset();
      resetState();
      populateAttributionFields(getAttribution());
      window.location.href = whatsappUrl;
    } catch (err) {
      showSubmitError("I couldn't save this form right now. Please message Dr. Shivang directly on WhatsApp so your query is not missed.");
      trackMetaEvent("LeadSubmitFailed", {
        form_id: form.id,
        error_message: err.message || "unknown",
      });
    } finally {
      setSubmitting(false);
    }
  });

  show(0);
}

function getElementText(el) {
  return (el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function getCookie(name) {
  const value = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.split("=").slice(1).join("=")) : "";
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}
