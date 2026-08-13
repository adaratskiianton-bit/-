(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function scrollToId(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  /* ---------- Логотип: fallback на текст, если файл ещё не залит ---------- */

  function initLogoFallback() {
    function replaceWithFallback(img) {
      var span = document.createElement("span");
      span.className = "logo-fallback-text";
      span.textContent = img.dataset.fallbackText;
      img.replaceWith(span);
    }

    document.querySelectorAll("img[data-fallback-text]").forEach(function (img) {
      // Локальный файл может «упасть» ещё до того, как слушатель успеет подписаться —
      // проверяем уже завершённую неудачную загрузку отдельно от будущих ошибок.
      if (img.complete && img.naturalWidth === 0) {
        replaceWithFallback(img);
      } else {
        img.addEventListener("error", function () {
          replaceWithFallback(img);
        });
      }
    });
  }

  /* ---------- Мобильное меню ---------- */

  function initMobileMenu() {
    var burger = document.getElementById("burger");
    var nav = document.getElementById("main-nav");
    if (!burger || !nav) return;

    function close() {
      document.body.classList.remove("menu-open");
      burger.setAttribute("aria-expanded", "false");
    }
    function toggle() {
      var isOpen = document.body.classList.toggle("menu-open");
      burger.setAttribute("aria-expanded", String(isOpen));
    }

    burger.addEventListener("click", toggle);
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  /* ---------- Подсветка активного пункта меню при скролле ---------- */

  function initScrollSpy() {
    var sections = document.querySelectorAll("main section[id]");
    if (!sections.length || !("IntersectionObserver" in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var link = document.querySelector('.main-nav a[href="#' + entry.target.id + '"]');
          if (!link) return;
          if (entry.isIntersecting) {
            document.querySelectorAll(".main-nav a.is-active").forEach(function (a) {
              a.classList.remove("is-active");
            });
            link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    sections.forEach(function (s) {
      observer.observe(s);
    });
  }

  /* ---------- Scroll-reveal ---------- */

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- Год в футере ---------- */

  function initFooterYear() {
    var el = document.getElementById("year");
    if (el) el.textContent = new Date().getFullYear();
  }

  /* ---------- Каталог: подбор, поиск, фильтры ---------- */

  var BRAND_NAMES = {
    dayun: "Dayun",
    dongfeng: "DongFeng",
    faw: "FAW",
    foton: "FOTON",
    jac: "JAC",
    howo: "HOWO",
    sany: "Sany",
    shacman: "SHACMAN",
    sitrak: "Sitrak"
  };

  var CATEGORY_NAMES = {
    engine: "Двигатель",
    brakes: "Тормозная система",
    suspension: "Подвеска",
    electrical: "Электрика",
    fuel: "Топливная система",
    cabin: "Кабина и оптика",
    transmission: "Трансмиссия",
    filters: "Фильтры"
  };

  function initCatalog() {
    var grid = document.getElementById("products-grid");
    if (!grid) return;

    var cards = Array.prototype.slice.call(grid.querySelectorAll(".product-card"));
    var emptyState = document.getElementById("catalog-empty");
    var countEl = document.getElementById("catalog-count");
    var catalogSearch = document.getElementById("catalog-search");
    var heroSearchInput = document.getElementById("hero-search-input");
    var heroSearchBtn = document.getElementById("hero-search-btn");
    var heroStepper = document.getElementById("hero-stepper");
    var stepperBrand = document.getElementById("stepper-brand");
    var stepperCategory = document.getElementById("stepper-category");
    var brandChips = document.querySelectorAll(".brand-chip[data-brand]");
    var categoryCards = document.querySelectorAll(".category-card[data-category]");
    var activeFiltersBar = document.getElementById("active-filters");
    var filterChipBrand = document.getElementById("filter-chip-brand");
    var filterChipCategory = document.getElementById("filter-chip-category");
    var filtersClearBtn = document.getElementById("filters-clear");

    var state = { text: "", brand: "", category: "" };

    function syncControls() {
      if (catalogSearch) catalogSearch.value = state.text;
      if (stepperBrand) stepperBrand.value = state.brand;
      if (stepperCategory) stepperCategory.value = state.category;

      brandChips.forEach(function (chip) {
        chip.classList.toggle("is-active", chip.dataset.brand === state.brand && state.brand !== "");
      });
      categoryCards.forEach(function (card) {
        card.classList.toggle("is-active", card.dataset.category === state.category && state.category !== "");
      });

      var hasFilters = !!(state.brand || state.category);
      if (activeFiltersBar) activeFiltersBar.hidden = !hasFilters;

      if (filterChipBrand) {
        if (state.brand) {
          filterChipBrand.hidden = false;
          filterChipBrand.textContent = BRAND_NAMES[state.brand] || state.brand;
        } else {
          filterChipBrand.hidden = true;
        }
      }
      if (filterChipCategory) {
        if (state.category) {
          filterChipCategory.hidden = false;
          filterChipCategory.textContent = CATEGORY_NAMES[state.category] || state.category;
        } else {
          filterChipCategory.hidden = true;
        }
      }
    }

    function applyFilters() {
      var text = state.text.trim().toLowerCase();
      var visible = 0;

      cards.forEach(function (card) {
        var name = (card.dataset.name || "").toLowerCase();
        var category = card.dataset.category || "";
        var brands = (card.dataset.brands || "").split(",");

        var matchesText = !text || name.indexOf(text) !== -1;
        var matchesBrand = !state.brand || brands.indexOf(state.brand) !== -1;
        var matchesCategory = !state.category || category === state.category;
        var matches = matchesText && matchesBrand && matchesCategory;

        card.classList.toggle("is-hidden", !matches);
        if (matches) visible++;
      });

      if (emptyState) emptyState.hidden = visible !== 0;
      if (countEl) {
        countEl.textContent = "Показано " + visible + " из " + cards.length;
      }
    }

    function update() {
      syncControls();
      applyFilters();
    }

    if (catalogSearch) {
      catalogSearch.addEventListener("input", function () {
        state.text = catalogSearch.value;
        applyFilters();
      });
    }

    if (heroSearchBtn && heroSearchInput) {
      var submitHeroSearch = function (e) {
        if (e) e.preventDefault();
        state.text = heroSearchInput.value;
        update();
        scrollToId("catalog");
      };
      heroSearchBtn.addEventListener("click", submitHeroSearch);
      heroSearchInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") submitHeroSearch(e);
      });
    }

    if (heroStepper) {
      heroStepper.addEventListener("submit", function (e) {
        e.preventDefault();
        state.brand = stepperBrand ? stepperBrand.value : "";
        state.category = stepperCategory ? stepperCategory.value : "";
        update();
        scrollToId("catalog");
      });
    }

    brandChips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        state.brand = state.brand === chip.dataset.brand ? "" : chip.dataset.brand;
        update();
        scrollToId("catalog");
      });
    });

    categoryCards.forEach(function (card) {
      card.addEventListener("click", function () {
        state.category = state.category === card.dataset.category ? "" : card.dataset.category;
        update();
        scrollToId("catalog");
      });
    });

    if (filterChipBrand) {
      filterChipBrand.addEventListener("click", function () {
        state.brand = "";
        update();
      });
    }
    if (filterChipCategory) {
      filterChipCategory.addEventListener("click", function () {
        state.category = "";
        update();
      });
    }
    if (filtersClearBtn) {
      filtersClearBtn.addEventListener("click", function () {
        state.text = "";
        state.brand = "";
        state.category = "";
        if (heroSearchInput) heroSearchInput.value = "";
        update();
      });
    }

    /* Кнопка «Уточнить наличие» — переносит интерес к товару в раздел контактов */
    var interestNote = document.getElementById("interest-note");
    var interestNoteText = document.getElementById("interest-note-text");
    cards.forEach(function (card) {
      var cta = card.querySelector(".product-card__cta");
      if (!cta) return;
      cta.addEventListener("click", function () {
        if (interestNote && interestNoteText) {
          interestNoteText.textContent = card.dataset.name || "";
          interestNote.hidden = false;
        }
        scrollToId("contacts");
      });
    });

    update();
  }

  /* ---------- Чат-помощник ---------- */

  var CHAT_FAQ = [
    {
      question: "Часы работы и адрес",
      keywords: ["час", "график", "режим", "адрес", "где вы", "находит", "город"],
      answer: "Работаем Пн–Пт с 09:00 до 18:00, суббота и воскресенье — выходной. Адрес: г. Батайск, ул. Промышленная, 19Б.",
      action: { label: "Показать на карте", targetId: "contacts" }
    },
    {
      question: "Как подобрать запчасть?",
      keywords: ["подобрать", "подбор", "найти", "поиск", "выбрать", "категор"],
      answer: "Выберите марку грузовика и категорию узла в форме подбора наверху страницы — каталог сразу покажет подходящие позиции. Можно и просто ввести название или артикул в поиске.",
      action: { label: "Перейти к подбору", targetId: "hero" }
    },
    {
      question: "Какие марки вы обслуживаете?",
      keywords: ["марк", "dayun", "dongfeng", "faw", "foton", "jac", "howo", "sany", "shacman", "sitrak", "бренд", "грузовик"],
      answer: "Работаем с Dayun, DongFeng, FAW, FOTON, JAC, HOWO, Sany, SHACMAN и Sitrak.",
      action: { label: "Посмотреть марки", targetId: "brands" }
    },
    {
      question: "Как сделать заказ?",
      keywords: ["заказ", "купить", "цена", "стоимост", "оплат", "доставк"],
      answer: "Цены в каталоге ориентировочные. Нажмите «Уточнить наличие» на карточке товара или позвоните нам — менеджер подтвердит цену, наличие и поможет оформить заказ.",
      action: { label: "Позвонить", href: "tel:+79001205161" }
    },
    {
      question: "Связаться с менеджером",
      keywords: ["менеджер", "телефон", "позвонить", "связат", "номер"],
      answer: "Наш телефон: +7 (900) 120-51-61. Будем рады помочь!",
      action: { label: "Позвонить", href: "tel:+79001205161" }
    }
  ];

  function initChatWidget() {
    var toggle = document.getElementById("chat-toggle");
    var panel = document.getElementById("chat-panel");
    var closeBtn = document.getElementById("chat-close");
    var body = document.getElementById("chat-body");
    var quick = document.getElementById("chat-quick");
    var form = document.getElementById("chat-form");
    var input = document.getElementById("chat-input");
    if (!toggle || !panel || !closeBtn || !body || !quick || !form || !input) return;

    var started = false;

    function addMessage(sender, text, action) {
      var msg = document.createElement("div");
      msg.className = "chat-msg chat-msg--" + sender;
      msg.textContent = text;

      if (action) {
        var actionEl = document.createElement(action.href ? "a" : "button");
        actionEl.className = "chat-msg__action";
        actionEl.textContent = action.label;
        if (action.href) {
          actionEl.href = action.href;
        } else {
          actionEl.type = "button";
          actionEl.addEventListener("click", function () {
            closePanel();
            scrollToId(action.targetId);
          });
        }
        msg.appendChild(document.createElement("br"));
        msg.appendChild(actionEl);
      }

      body.appendChild(msg);
      body.scrollTop = body.scrollHeight;
    }

    function renderQuickReplies() {
      quick.innerHTML = "";
      CHAT_FAQ.forEach(function (item) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chat-quick-btn";
        btn.textContent = item.question;
        btn.addEventListener("click", function () {
          askQuestion(item);
        });
        quick.appendChild(btn);
      });
    }

    function askQuestion(item) {
      addMessage("user", item.question);
      window.setTimeout(
        function () {
          addMessage("bot", item.answer, item.action);
        },
        prefersReducedMotion ? 0 : 350
      );
    }

    function findAnswer(text) {
      var lower = text.toLowerCase();
      for (var i = 0; i < CHAT_FAQ.length; i++) {
        var keywords = CHAT_FAQ[i].keywords;
        for (var k = 0; k < keywords.length; k++) {
          if (lower.indexOf(keywords[k]) !== -1) return CHAT_FAQ[i];
        }
      }
      return null;
    }

    function start() {
      if (started) return;
      started = true;
      addMessage("bot", "Здравствуйте! Я подскажу по сайту «ЧИНА». Выберите вопрос ниже или напишите свой.");
      renderQuickReplies();
    }

    function openPanel() {
      panel.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      start();
      input.focus();
    }
    function closePanel() {
      panel.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", function () {
      if (panel.hidden) openPanel();
      else closePanel();
    });
    closeBtn.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) closePanel();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) return;
      addMessage("user", text);
      input.value = "";

      var match = findAnswer(text);
      window.setTimeout(
        function () {
          if (match) {
            addMessage("bot", match.answer, match.action);
          } else {
            addMessage(
              "bot",
              "Пока не готова ответить на такой вопрос текстом — вот что я умею, или позвоните нам напрямую:",
              { label: "Позвонить", href: "tel:+79001205161" }
            );
            renderQuickReplies();
          }
        },
        prefersReducedMotion ? 0 : 350
      );
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initLogoFallback();
    initMobileMenu();
    initScrollSpy();
    initReveal();
    initFooterYear();
    initCatalog();
    initChatWidget();
  });
})();
