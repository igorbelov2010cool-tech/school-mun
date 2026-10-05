// Разделы переключаются без загрузки страницы. Хеш сохраняет прямые ссылки
// и работу кнопок «Назад» и «Вперёд» в браузере.
(() => {
  const main = document.querySelector("main");
  const home = document.querySelector(".hero");
  const routes = new Map();
  const titles = {
    about: "О конференции",
    committees: "Комитеты",
    prepare: "Подготовка",
    faq: "Вопросы и ответы",
  };
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let activeView = null;
  let transition = null;

  home.id = "home";
  routes.set("home", home);

  Object.entries(titles).forEach(([id, title]) => {
    const section = document.getElementById(id);
    const panel = document.createElement("div");
    panel.className = "page-window";
    panel.dataset.view = id;
    panel.hidden = true;

    const toolbar = document.createElement("div");
    toolbar.className = "window-toolbar";
    const label = document.createElement("span");
    label.textContent = `SCHOOL MUN / ${title}`;
    const closeLink = document.createElement("a");
    closeLink.href = "#home";
    closeLink.textContent = "×";
    closeLink.setAttribute("aria-label", "На главную");
    toolbar.append(label, closeLink);
    main.insertBefore(panel, section);
    panel.append(toolbar, section);
    routes.set(id, panel);
  });

  routes.get("about").append(document.querySelector(".quiz-banner"));
  document.querySelector(".closing").remove();
  document.body.classList.add("window-layout");

  function showRoute({ focus = true } = {}) {
    const requested = location.hash.slice(1) || "home";
    const route = routes.has(requested) ? requested : "home";
    const nextView = routes.get(route);
    if (nextView === activeView) return;
    if (transition) transition.cancel();
    routes.forEach((view) => {
      view.hidden = view !== nextView;
    });
    activeView = nextView;

    document.querySelectorAll("header nav a").forEach((link) => {
      const active = link.hash === `#${route}`;
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.title =
      route === "home"
        ? "School MUN — пространство диалога"
        : `${titles[route]} — School MUN`;

    // При переходе из длинного раздела новый экран начинается сверху,
    // без анимированной прокрутки через старое содержимое.
    window.scrollTo({ top: 0, behavior: "instant" });
    if (focus) {
      const heading = nextView.querySelector("h1, h2");
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
    if (!reducedMotion.matches && nextView.animate) {
      transition = nextView.animate(
        [
          { opacity: 0, transform: "translateY(8px) scale(0.995)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        { duration: 300, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
    }
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (
      !link ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    )
      return;
    const route = link.hash.slice(1) || "home";
    if (!routes.has(route)) return;
    event.preventDefault();
    if (location.hash !== `#${route}`) history.pushState(null, "", `#${route}`);
    showRoute();
  });
  window.addEventListener("popstate", () => showRoute());
  window.addEventListener("hashchange", () => showRoute());
  showRoute({ focus: false });
})();
