(function () {
  "use strict";

  const dictionaries = window.SNAPPORT_I18N || {};
  const languageNames = window.SNAPPORT_LANGUAGE_NAMES || {};
  const supported = window.SNAPPORT_LOCALES || Object.keys(dictionaries);
  const fallback = "en-US";
  const rtlLocales = new Set(["ar-SA", "he"]);
  const page = document.body.dataset.page || "home";

  function resolveLocale(rawLocale) {
    if (!rawLocale) return null;

    const normalized = rawLocale.replace("_", "-").toLowerCase();
    const exact = supported.find(function (locale) {
      return locale.toLowerCase() === normalized;
    });
    if (exact) return exact;

    if (normalized.startsWith("zh")) {
      return /(?:hans|cn|sg)/.test(normalized) ? "zh-Hans" : "zh-Hant";
    }
    if (normalized.startsWith("en-au")) return "en-AU";
    if (normalized.startsWith("en-ca")) return "en-CA";
    if (normalized.startsWith("en-gb")) return "en-GB";
    if (normalized.startsWith("fr-ca")) return "fr-CA";
    if (normalized.startsWith("pt-br")) return "pt-BR";
    if (normalized.startsWith("es-mx")) return "es-MX";

    const base = normalized.split("-")[0];
    return supported.find(function (locale) {
      return locale.toLowerCase().split("-")[0] === base;
    }) || null;
  }

  function savedLocale() {
    try {
      return resolveLocale(localStorage.getItem("snapport_locale"));
    } catch (error) {
      console.warn("Unable to read the saved locale.", error);
      return null;
    }
  }

  function detectedLocale() {
    const browserLocales = navigator.languages || [navigator.language];
    for (const browserLocale of browserLocales) {
      const locale = resolveLocale(browserLocale);
      if (locale) return locale;
    }
    return fallback;
  }

  function applyLocale(locale) {
    const selected = dictionaries[locale] ? locale : fallback;
    const dictionary = dictionaries[selected] || {};
    const fallbackDictionary = dictionaries[fallback] || {};

    document.documentElement.lang = selected;
    document.documentElement.dir = rtlLocales.has(selected) ? "rtl" : "ltr";
    document.title = dictionary[page + "MetaTitle"] || fallbackDictionary[page + "MetaTitle"];

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = dictionary[page + "MetaDescription"]
        || fallbackDictionary[page + "MetaDescription"];
    }

    document.querySelectorAll("[data-i18n]").forEach(function (element) {
      const key = element.dataset.i18n;
      const value = dictionary[key] || fallbackDictionary[key];
      if (value !== undefined) element.textContent = value;
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (element) {
      const key = element.dataset.i18nAria;
      const value = dictionary[key] || fallbackDictionary[key];
      if (value !== undefined) element.setAttribute("aria-label", value);
    });

    const selector = document.getElementById("language-select");
    if (selector) {
      selector.value = selected;
      selector.setAttribute(
        "aria-label",
        dictionary.languageLabel || fallbackDictionary.languageLabel || "Language"
      );
    }
  }

  function populateLanguageSelector() {
    const selector = document.getElementById("language-select");
    if (!selector) return;

    supported.forEach(function (locale) {
      const option = document.createElement("option");
      option.value = locale;
      option.textContent = languageNames[locale] || locale;
      selector.appendChild(option);
    });

    selector.addEventListener("change", function () {
      try {
        localStorage.setItem("snapport_locale", selector.value);
      } catch (error) {
        console.warn("Unable to save the selected locale.", error);
      }
      applyLocale(selector.value);
    });
  }

  function revealVisibleSections() {
    document.querySelectorAll(".reveal").forEach(function (element) {
      if (element.getBoundingClientRect().top < window.innerHeight - 60) {
        element.classList.add("in");
      }
    });
  }

  populateLanguageSelector();
  applyLocale(savedLocale() || detectedLocale());
  revealVisibleSections();
  window.addEventListener("scroll", revealVisibleSections, { passive: true });
}());
