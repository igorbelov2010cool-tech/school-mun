// Каталог, сравнение и подготовка делегата.
// Данные находятся в committees.js, а анимации — в motion.js.
const levels = {
  beginner: "Для новичков",
  middle: "Средний уровень",
  advanced: "Продвинутый",
};
const languages = { RU: "Русский", EN: "English", KZ: "Қазақша" };
let language = "all",
  selected = new Set();
const $ = (s) => document.querySelector(s),
  dialog = $("#dialog");
let toastTimer;
function showToast(t) {
  $("#toast").textContent = t;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 3500);
}
function renderCommittees() {
  const list = committees.filter(
    (c) =>
      (language === "all" || c.lang === language) &&
      ($("#level").value === "all" || c.level === $("#level").value),
  );
  $("#cards").innerHTML = list
    .map(
      (c) => `<article class="card">
<div class="card-top">
<span class="card-code">${c.id}</span>
<span class="tag">${c.lang}</span>
</div>
<div class="card-number">COMMITTEE / 0${committees.indexOf(c) + 1}</div>
<h3>${c.name}</h3>
<p>${c.topic}</p>
<span class="difficulty">${levels[c.level]}</span>
<div class="card-bottom">
<button data-detail="${c.id}" aria-label="Подробнее о ${c.id}">О комитете <span aria-hidden="true">＋</span>
</button>
<label>
<input type="checkbox" data-compare="${c.id}" ${selected.has(c.id) ? "checked" : ""} aria-label="Сравнить ${c.id}">Сравнить</label>
</div>
</article>`,
    )
    .join("");
  window.siteMotion.animateCards();
  $("#count").textContent = `Найдено: ${list.length} из ${committees.length}`;
  $("#empty").hidden = list.length > 0;
  document
    .querySelectorAll("[data-detail]")
    .forEach((b) => (b.onclick = () => openCommittee(b.dataset.detail)));
  document.querySelectorAll("[data-compare]").forEach(
    (c) =>
      (c.onchange = () => {
        if (c.checked && selected.size === 2) {
          c.checked = false;
          showToast(
            "Для сравнения можно выбрать два комитета. Сначала убери один из выбранных.",
          );
          return;
        }
        c.checked
          ? selected.add(c.dataset.compare)
          : selected.delete(c.dataset.compare);
        updateComparisonTray();
      }),
  );
}
function updateComparisonTray() {
  $("#tray").hidden = !selected.size;
  $("#compare-count").textContent = `Выбрано: ${selected.size} / 2`;
  $("#compare-open").textContent =
    selected.size === 2 ? "Сравнить" : "Выбери ещё один";
  $("#compare-open").disabled = selected.size !== 2;
}
function openDialog(html) {
  const wasOpen = dialog.open;
  $("#dialog-content").innerHTML = html;
  if (!wasOpen) {
    dialog.showModal();
    document.body.classList.add("dialog-open");
  }
  dialog.scrollTop = 0;
  if (wasOpen) $("#dialog-content").focus({ preventScroll: true });
  window.siteMotion.animateDialog(wasOpen);
}
function openCommittee(id) {
  const c = committees.find((c) => c.id === id);
  openDialog(`<p class="eyebrow blue">КОМИТЕТ / ${c.id}</p>
<h2 id="dialog-title">${c.name}</h2>
<div class="dialog-tags">
<span class="tag">${languages[c.lang]}</span>
<span class="tag">${levels[c.level]}</span>
</div>
<h3>Повестка</h3>
<p>${c.topic}</p>
<p>${c.desc}</p>
<h3>Вопросы для обсуждения</h3>
<ul>${c.questions.map((q) => `<li>${q}</li>`).join("")}</ul>
<h3>С чего начать подготовку</h3>
<p>${c.first}</p>
<button class="button primary" id="pick">${selected.has(id) ? "Убрать из сравнения" : "Добавить к сравнению"}</button>`);
  $("#pick").onclick = () => {
    if (selected.has(id)) {
      selected.delete(id);
    } else if (selected.size < 2) {
      selected.add(id);
    } else {
      showToast("Уже выбраны два комитета. Убери один, чтобы добавить другой.");
      return;
    }
    renderCommittees();
    updateComparisonTray();
    openCommittee(id);
  };
}
function openQuiz() {
  openDialog(`<p class="eyebrow blue">ТРИ ВОПРОСА / ТВОЙ КОМИТЕТ</p>
<h2 id="dialog-title">Найдём твоё направление.</h2>
<p>Выбери комфортный язык, свой опыт и интересующую тему.</p>
<form class="quiz-form" id="quiz">
<label for="q-language">На каком языке хочешь вести дебаты?</label>
<select id="q-language">
<option value="RU">Русский</option>
<option value="EN">English</option>
<option value="KZ">Қазақша</option>
</select>
<label for="q-level">Какой у тебя опыт?</label>
<select id="q-level">
<option value="beginner">Это будет мой первый MUN</option>
<option value="middle">Уже участвовал в дебатах</option>
<option value="advanced">Готов к сложным переговорам</option>
</select>
<label for="q-topic">Какая тема увлекает больше всего?</label>
<select id="q-topic">
<option value="security">Международная безопасность</option>
<option value="health">Здоровье и помощь людям</option>
<option value="economy">Технологии и экономика</option>
<option value="education">Образование и культура</option>
<option value="history">История и кризисы</option>
</select>
<button class="button primary" type="submit">Показать рекомендацию</button>
</form>`);
  $("#quiz").onsubmit = (e) => {
    e.preventDefault();
    const lang = $("#q-language").value,
      level = $("#q-level").value,
      topic = $("#q-topic").value;
    const candidates = committees
      .filter((c) => c.lang === lang)
      .sort((a, b) => score(b) - score(a));
    function score(c) {
      return (
        (c.level === level ? 4 : 0) +
        (c.area === topic ? 3 : 0) -
        (level === "beginner" && c.level === "advanced" ? 5 : 0)
      );
    }
    const c = candidates[0];
    const reason = [
      `Рабочий язык — ${languages[c.lang]}.`,
      c.level === level
        ? "Уровень соответствует твоему опыту."
        : `В этом языке ближайший вариант имеет уровень «${levels[c.level]}».`,
      c.area === topic
        ? "Повестка совпадает с выбранным интересом."
        : "Точного совпадения по теме нет: предлагаем ближайший вариант на выбранном языке.",
    ];
    openDialog(`<p class="eyebrow blue">ТВОЙ РЕЗУЛЬТАТ</p>
<h2 id="dialog-title">Начни с ${c.id}.</h2>
<div class="reco">
<h3>${c.name}</h3>
<p>${c.topic}</p>
</div>
<p>${reason.join(" ")}</p>${level === "beginner" && c.level !== "beginner" ? "<p>Для первой конференции этот вариант потребует дополнительной подготовки. Попроси президиум помочь с процедурой.</p>" : ""}<h3>Твой первый шаг</h3>
<p>${c.first}</p>
<button class="button primary" id="result-details">Подробнее о комитете</button> <button class="text-button dark" id="quiz-again">Пройти заново</button>`);
    $("#result-details").onclick = () => openCommittee(c.id);
    $("#quiz-again").onclick = openQuiz;
  };
}
document.querySelectorAll("[data-lang]").forEach(
  (b) =>
    (b.onclick = () => {
      language = b.dataset.lang;
      document.querySelectorAll("[data-lang]").forEach((x) => {
        x.classList.toggle("active", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      renderCommittees();
    }),
);
$("#level").onchange = renderCommittees;
$("#reset").onclick = () => {
  $("#level").value = "all";
  document.querySelector('[data-lang="all"]').click();
};
document.querySelectorAll("[data-quiz]").forEach((b) => (b.onclick = openQuiz));
$(".close").onclick = () => window.siteMotion.closeDialog();
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      window.siteMotion.closeDialog();
  }
});
$("#compare-clear").onclick = () => {
  selected.clear();
  renderCommittees();
  updateComparisonTray();
};
$("#compare-open").onclick = () => {
  if (selected.size !== 2) return;
  const items = [...selected].map((id) => committees.find((c) => c.id === id));
  openDialog(`<p class="eyebrow blue">НАЙДИ СВОЙ ФОРМАТ</p>
<h2 id="dialog-title">Сравнение комитетов</h2>
<div class="comparison">${items
    .map(
      (c) => `<article>
<h3>${c.id}</h3>
<p>${c.name}</p>
<h4>ЯЗЫК</h4>
<p>${languages[c.lang]}</p>
<h4>УРОВЕНЬ</h4>
<p>${levels[c.level]}</p>
<h4>ПОВЕСТКА</h4>
<p>${c.topic}</p>
<h4>ПЕРВЫЙ ШАГ</h4>
<p>${c.first}</p>
</article>`,
    )
    .join("")}</div>`);
};
const checks = [...document.querySelectorAll("[data-check]")];
function updatePreparationProgress() {
  const n = checks.filter((x) => x.checked).length;
  $("#progress").textContent = `${n} / 4`;
  $("#bar").style.width = `${n * 25}%`;
  $("#progress-text").textContent =
    n === 4
      ? "Базовая подготовка готова. Удачных дебатов!"
      : n === 0
        ? "Первый шаг — выбрать интересную тему."
        : `Готово ${n} из 4 шагов. Продолжай в своём темпе.`;
}
checks.forEach((c) => {
  try {
    c.checked = localStorage.getItem("school-mun-" + c.dataset.check) === "1";
  } catch {}
  c.onchange = () => {
    try {
      localStorage.setItem(
        "school-mun-" + c.dataset.check,
        c.checked ? "1" : "0",
      );
    } catch {
      showToast(
        "Браузер не разрешает сохранять отметки. Они останутся до закрытия страницы.",
      );
    }
    updatePreparationProgress();
  };
});
$("#download").onclick = () => {
  const text =
    "SCHOOL MUN — ПАМЯТКА ДЕЛЕГАТА\n\n1. Выбери комитет и изучи повестку.\n2. После распределения изучи официальную позицию своей страны.\n3. Подготовь речь на одну минуту: проблема, позиция, предложение.\n4. Ознакомься с регламентом у организаторов.\n\nСТРУКТУРА РЕЧИ\nУважаемый президиум, уважаемые делегаты!\nНаша делегация считает ключевой проблемой…\nПозиция нашего государства заключается в…\nМы предлагаем…\nМы открыты к сотрудничеству с делегациями, которые…\n\nПРОВЕРЬ ПЕРЕД КОНФЕРЕНЦИЕЙ\nДату, адрес, назначенную страну, рабочий язык и требования организаторов.\n\nТВОЙ ПРОГРЕСС\n" +
    checks
      .map(
        (c) =>
          (c.checked ? "[✓] " : "[ ] ") +
          c.closest("label").querySelector("b").textContent,
      )
      .join("\n");
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "School-MUN-памятка.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
renderCommittees();
updatePreparationProgress();
