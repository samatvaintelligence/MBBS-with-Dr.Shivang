// WhatsApp number is Dr. Shivang's personal mentorship line (per the brand PDF).
// International format, digits only, no + or spaces.
const WA_NUMBER = "919211567773";
const WA_MESSAGE = "I want to be a doctor";
const INSTAGRAM_URL = "https://www.instagram.com/mbbswithdr.shivang/?__d=1";
const FACEBOOK_URL = "";

document.addEventListener("DOMContentLoaded", () => {
  rewriteWhatsAppLinks();
  rewriteTelLinks();
  rewriteSocialLinks();
  initFeeToggle();
  initLanguageToggle();
  initAdmissionsForm();
});

function rewriteWhatsAppLinks() {
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`;
  document.querySelectorAll('[data-wa="1"]').forEach((el) => {
    el.setAttribute("href", url);
    el.setAttribute("target", "_blank");
    el.setAttribute("rel", "noopener noreferrer");
  });
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
      return;
    }

    el.setAttribute("href", "#");
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("title", "Facebook page to be created");
    el.addEventListener("click", (event) => event.preventDefault());
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
  let current = 0;

  const state = { fullName: "", phone: "", neet: "", drops: "", budget: "", year: "" };

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

  function validateStep(idx) {
    const stepEl = steps[idx];
    const inputs = stepEl.querySelectorAll("input[required], select[required]");
    let valid = true;
    inputs.forEach((input) => {
      const err = input.parentElement.querySelector("[data-error]");
      if (!input.value.trim()) {
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
      state[input.name] = input.value;
    });
  }

  function renderReview() {
    const reviewEl = document.getElementById("review-summary");
    if (!reviewEl) return;
    reviewEl.innerHTML = `
      <div class="flex justify-between py-3 border-b border-border-subtle"><span class="text-muted">Name</span><span class="font-bold">${escapeHtml(state.fullName)}</span></div>
      <div class="flex justify-between py-3 border-b border-border-subtle"><span class="text-muted">Phone</span><span class="font-bold">${escapeHtml(state.phone)}</span></div>
      <div class="flex justify-between py-3 border-b border-border-subtle"><span class="text-muted">NEET Score</span><span class="font-bold">${escapeHtml(state.neet)}</span></div>
      <div class="flex justify-between py-3 border-b border-border-subtle"><span class="text-muted">Drop Years</span><span class="font-bold">${escapeHtml(state.drops)}</span></div>
      <div class="flex justify-between py-3 border-b border-border-subtle"><span class="text-muted">Total Budget</span><span class="font-bold">${escapeHtml(state.budget)}</span></div>
      <div class="flex justify-between py-3"><span class="text-muted">Target Year</span><span class="font-bold">${escapeHtml(state.year)}</span></div>
    `;
  }

  form.querySelectorAll("[data-next]").forEach((btn) => {
    btn.addEventListener("click", () => {
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

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    // No backend wired up. When ready, POST `state` to Formspree / Netlify Forms / a real endpoint.
    const modal = document.getElementById("success-modal");
    if (modal) modal.classList.remove("hidden");
    form.reset();
  });

  const closeBtn = document.getElementById("modal-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      document.getElementById("success-modal").classList.add("hidden");
      show(0);
    });
  }

  show(0);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
