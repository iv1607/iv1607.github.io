(() => {
  "use strict";

  const header = document.querySelector("[data-header]");
  const menuButton = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const page = document.body.dataset.page;

  const setHeaderState = () => header?.classList.toggle("is-scrolled", window.scrollY > 24);
  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  if (page) {
    const activeLink = document.querySelector(`[data-nav="${page}"]`);
    activeLink?.setAttribute("aria-current", "page");
  }

  const closeMenu = () => {
    if (!menuButton || !menu) return;
    menuButton.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-open");
    document.body.classList.remove("menu-open");
  };

  menuButton?.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menu?.classList.toggle("is-open", willOpen);
    document.body.classList.toggle("menu-open", willOpen);
  });

  menu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px" });
    reveals.forEach((element) => observer.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add("is-visible"));
  }

  const formatNumber = (value, digits = 3) => new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
  }).format(value);

  const toBaseVolume = (value, unit) => {
    const factors = { uL: 0.001, mL: 1, L: 1000 };
    return value * factors[unit];
  };

  const fromBaseVolume = (value, unit) => {
    const factors = { uL: 0.001, mL: 1, L: 1000 };
    return value / factors[unit];
  };

  const dilutionForm = document.querySelector("[data-dilution-form]");
  dilutionForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(dilutionForm);
    const c1 = Number(data.get("stockConcentration"));
    const c2 = Number(data.get("targetConcentration"));
    const finalVolume = Number(data.get("finalVolume"));
    const finalUnit = String(data.get("finalVolumeUnit"));
    const outputUnit = String(data.get("outputUnit"));
    const panel = dilutionForm.querySelector("[data-result]");
    const valueNode = dilutionForm.querySelector("[data-result-value]");
    const detailNode = dilutionForm.querySelector("[data-result-detail]");

    if (!panel || !valueNode || !detailNode) return;
    panel.hidden = false;

    if (![c1, c2, finalVolume].every((value) => Number.isFinite(value) && value > 0)) {
      valueNode.textContent = "Check your inputs";
      detailNode.textContent = "All values must be positive numbers.";
      return;
    }
    if (c2 > c1) {
      valueNode.textContent = "Dilution not possible";
      detailNode.textContent = "The target concentration cannot exceed the stock concentration.";
      return;
    }

    const finalVolumeMl = toBaseVolume(finalVolume, finalUnit);
    const stockVolumeMl = (c2 * finalVolumeMl) / c1;
    const diluentVolumeMl = finalVolumeMl - stockVolumeMl;
    const stockOutput = fromBaseVolume(stockVolumeMl, outputUnit);
    const diluentOutput = fromBaseVolume(diluentVolumeMl, outputUnit);
    valueNode.textContent = `${formatNumber(stockOutput)} ${outputUnit} stock`;
    detailNode.textContent = `Add ${formatNumber(diluentOutput)} ${outputUnit} diluent to reach ${formatNumber(fromBaseVolume(finalVolumeMl, outputUnit))} ${outputUnit} total.`;
  });

  const conversionForm = document.querySelector("[data-conversion-form]");
  const conversionUnits = {
    volume: ["uL", "mL", "L"],
    mass: ["mg", "g", "kg"],
    temperature: ["°C", "°F", "K"],
  };
  const massFactors = { mg: 0.001, g: 1, kg: 1000 };

  const setConversionOptions = (category) => {
    const units = conversionUnits[category];
    const from = conversionForm?.querySelector("[name='fromUnit']");
    const to = conversionForm?.querySelector("[name='toUnit']");
    if (!from || !to || !units) return;
    from.innerHTML = units.map((unit) => `<option value="${unit}">${unit}</option>`).join("");
    to.innerHTML = units.map((unit, index) => `<option value="${unit}"${index === 1 ? " selected" : ""}>${unit}</option>`).join("");
  };

  setConversionOptions("volume");
  conversionForm?.querySelector("[name='category']")?.addEventListener("change", (event) => {
    setConversionOptions(event.target.value);
    conversionForm.querySelector("[data-result]").hidden = true;
  });

  conversionForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(conversionForm);
    const input = Number(data.get("value"));
    const category = String(data.get("category"));
    const from = String(data.get("fromUnit"));
    const to = String(data.get("toUnit"));
    const panel = conversionForm.querySelector("[data-result]");
    const valueNode = conversionForm.querySelector("[data-result-value]");
    const detailNode = conversionForm.querySelector("[data-result-detail]");
    if (!panel || !valueNode || !detailNode) return;
    panel.hidden = false;

    if (!Number.isFinite(input)) {
      valueNode.textContent = "Enter a number";
      detailNode.textContent = "The converter needs a numeric value.";
      return;
    }

    let result;
    if (category === "volume") {
      result = fromBaseVolume(toBaseVolume(input, from), to);
    } else if (category === "mass") {
      result = (input * massFactors[from]) / massFactors[to];
    } else {
      const celsius = from === "°C" ? input : from === "°F" ? (input - 32) * 5 / 9 : input - 273.15;
      result = to === "°C" ? celsius : to === "°F" ? celsius * 9 / 5 + 32 : celsius + 273.15;
    }
    valueNode.textContent = `${formatNumber(result, 5)} ${to}`;
    detailNode.textContent = `${formatNumber(input, 5)} ${from} equals ${formatNumber(result, 5)} ${to}.`;
  });

  const scaleForm = document.querySelector("[data-scale-form]");
  scaleForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(scaleForm);
    const originalVolume = Number(data.get("originalVolume"));
    const targetVolume = Number(data.get("targetVolume"));
    const originalAmount = Number(data.get("originalAmount"));
    const amountUnit = String(data.get("amountUnit"));
    const panel = scaleForm.querySelector("[data-result]");
    const valueNode = scaleForm.querySelector("[data-result-value]");
    const detailNode = scaleForm.querySelector("[data-result-detail]");
    if (!panel || !valueNode || !detailNode) return;
    panel.hidden = false;

    if (![originalVolume, targetVolume, originalAmount].every((value) => Number.isFinite(value) && value > 0)) {
      valueNode.textContent = "Check your inputs";
      detailNode.textContent = "All values must be positive numbers.";
      return;
    }
    const factor = targetVolume / originalVolume;
    const scaledAmount = originalAmount * factor;
    valueNode.textContent = `${formatNumber(scaledAmount)} ${amountUnit}`;
    detailNode.textContent = `${formatNumber(factor)}× scale factor from ${formatNumber(originalVolume)} to ${formatNumber(targetVolume)} volume units.`;
  });

  document.querySelectorAll("[data-reset-form]").forEach((button) => {
    button.addEventListener("click", () => {
      const form = button.closest("form");
      form?.reset();
      const panel = form?.querySelector("[data-result]");
      if (panel) panel.hidden = true;
      if (form === conversionForm) setConversionOptions("volume");
    });
  });

  const lightbox = document.querySelector("[data-lightbox]");
  const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
  const lightboxCaption = lightbox?.querySelector("[data-lightbox-caption]");
  const lightboxClose = lightbox?.querySelector("[data-lightbox-close]");
  let lastPhotoTrigger = null;

  document.querySelectorAll("[data-full]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (!lightbox || !lightboxImage || !lightboxCaption) return;
      lastPhotoTrigger = trigger;
      const thumbnail = trigger.querySelector("img");
      const hasExplicitCaption = Object.prototype.hasOwnProperty.call(trigger.dataset, "caption");
      const caption = hasExplicitCaption ? trigger.dataset.caption : (thumbnail?.alt || "Full-size photo");
      lightboxImage.src = trigger.dataset.full;
      lightboxImage.alt = thumbnail?.alt || caption;
      lightboxCaption.textContent = caption;
      lightboxCaption.hidden = !caption;
      lightbox.showModal();
    });
  });

  const closeLightbox = () => {
    if (!lightbox?.open) return;
    lightbox.close();
    lastPhotoTrigger?.focus();
  };

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox?.addEventListener("close", () => {
    if (lightboxImage) lightboxImage.src = "";
  });
})();
