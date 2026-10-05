// Анимации не управляют содержимым: если браузер их не поддерживает,
// все разделы и кнопки продолжают работать.
(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
  const dialog = document.querySelector("#dialog");
  let closing = false;

  function animate(element, keyframes, options = {}) {
    if (!element || reducedMotion.matches || !element.animate) return null;
    return element.animate(keyframes, { duration: 420, easing, ...options });
  }

  function animateCards() {
    document.querySelectorAll(".card").forEach((card, index) => {
      animate(
        card,
        [
          { opacity: 0, transform: "translateY(12px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 360, delay: Math.min(index * 45, 180), fill: "backwards" },
      );
    });
  }

  function animateDialog(alreadyOpen) {
    const target = alreadyOpen
      ? document.querySelector("#dialog-content")
      : dialog;
    animate(
      target,
      [
        { opacity: 0, transform: "translateY(10px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 280 },
    );
  }

  async function closeDialog() {
    if (!dialog.open || closing) return;
    closing = true;
    const animation = animate(
      dialog,
      [
        { opacity: 1, transform: "translateY(0)" },
        { opacity: 0, transform: "translateY(8px)" },
      ],
      { duration: 160, easing: "ease-in" },
    );
    try {
      if (animation) await animation.finished;
    } catch {
      // Отмена анимации не должна мешать закрыть окно.
    } finally {
      dialog.close();
      closing = false;
    }
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
  });

  function revealSections() {
    if (reducedMotion.matches || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animate(
            entry.target,
            [
              { opacity: 0, transform: "translateY(20px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 600 },
          );
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12 },
    );
    document
      .querySelectorAll(
        ".about, .section-heading, .quiz-banner, .prep-grid, .faq, .closing",
      )
      .forEach((section) => observer.observe(section));
  }

  // Оставляем нативный details: клавиатура и работа без JS сохраняются.
  function setupQuestions() {
    document.querySelectorAll(".faq details").forEach((details) => {
      let runningAnimation = null;
      const summary = details.querySelector("summary");
      summary.addEventListener("click", (event) => {
        if (reducedMotion.matches || !details.animate) return;
        event.preventDefault();
        if (runningAnimation) return;
        const opening = !details.open;
        const startHeight = details.offsetHeight;
        if (opening) details.open = true;
        const endHeight = opening
          ? details.offsetHeight
          : summary.offsetHeight + 1;
        details.style.overflow = "hidden";
        runningAnimation = animate(
          details,
          [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
          { duration: 260 },
        );
        runningAnimation.finished
          .then(() => {
            if (!opening) details.open = false;
          })
          .catch(() => {})
          .finally(() => {
            details.style.overflow = "";
            runningAnimation = null;
          });
      });
    });
  }

  window.siteMotion = { animateCards, animateDialog, closeDialog };
  revealSections();
  setupQuestions();
})();
