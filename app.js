/* =========================================================
   データは data.js から読み込む。
   ・初期表示は同梱データ（window.LearningData）で即描画する。
   ・GAS のURLが設定されていれば window.loadSiteData() で取得し、
     取れ次第データを差し替えて再描画する（Phase 2: fetch 化）。
   スキーマ準拠の素データ → 表示用モデルへの変換は data.js 側で行う。
   ここ（app.js）は描画のみを担当する。
   ========================================================= */
let site, contactInfo, courses, reports, recruitment, seasonNotes;

function applySiteData(vm) {
  ({ site, contactInfo, courses, reports, recruitment, seasonNotes } = vm);
}

applySiteData(window.LearningData);

const app = document.querySelector("#app");
const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");
const pageLoading = document.querySelector("#pageLoading");

function courseById(id) {
  return courses.find((course) => course.id === id) || courses[0] || {
    id: "general",
    name: "講座",
    category: "活動",
    copy: "",
    description: "",
    months: "",
    icon: "leaf",
    color: "#7f9b73",
    soft: "#e8efe3",
    ink: "#5e7a55",
    image: "assets/images/symbol_ja.png"
  };
}

function isRecruiting(item) {
  if (!item || !item.deadlineDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(`${item.deadlineDate}T23:59:59`);
  if (Number.isNaN(deadline.getTime())) return false;
  return deadline >= today;
}

function articleRoute(id) {
  return `article-${encodeURIComponent(id)}`;
}

function findReportById(id) {
  return reports.find((report) => report.id === id) || reports[0] || null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function safeUrl(value, fallback = "#") {
  const url = String(value ?? "").trim();
  if (/^(https?:|mailto:|tel:|#|blob:)/i.test(url)) return escapeAttr(url);
  if (/^(assets\/|\/(?!\/)|\.\/)/.test(url)) return escapeAttr(url);
  return escapeAttr(fallback);
}

function safeColor(value, fallback) {
  const color = String(value ?? "").trim();
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : fallback;
}

function iconSvg(name = "leaf") {
  const paths = {
    bowl: '<path d="M15 31.5h34c-1 10.5-7.4 17.2-17 17.2s-16-6.7-17-17.2Z"></path><path d="M13 31.5c4 2.4 10.8 3.8 19 3.8s15-1.4 19-3.8"></path><path d="M24 48.8h16"></path><path d="M24.5 24.2c-1.1-1.9.3-3.4 1.5-4.8"></path><path d="M32 24.2c-1.1-1.9.3-3.4 1.5-4.8"></path><path d="M39.5 24.2c-1.1-1.9.3-3.4 1.5-4.8"></path>',
    pot: '<path d="M15 31.5h34c-1 10.5-7.4 17.2-17 17.2s-16-6.7-17-17.2Z"></path><path d="M13 31.5c4 2.4 10.8 3.8 19 3.8s15-1.4 19-3.8"></path><path d="M24 48.8h16"></path><path d="M24.5 24.2c-1.1-1.9.3-3.4 1.5-4.8"></path><path d="M32 24.2c-1.1-1.9.3-3.4 1.5-4.8"></path><path d="M39.5 24.2c-1.1-1.9.3-3.4 1.5-4.8"></path>',
    flower: '<path d="M32 30.5c3.9-7.2 9.4-9.6 11.8-7.1 2.2 2.3-.6 6.2-7.7 7.5 7 1.5 9.5 5.4 7.1 7.8-2.6 2.5-7.6-.1-11-7.3-3.2 7.1-8.7 9.8-11.3 7.2-2.3-2.4.3-6.2 7.5-7.7-7.2-1.5-9.8-5.5-7.5-7.8 2.6-2.5 7.7.1 11.1 7.4Z"></path><circle cx="32" cy="31" r="1.8"></circle><path d="M31.7 33.2c-1 6.1-2.8 12.2-6.5 18.4"></path><path d="M27.5 44.4c-3.8-.7-6.7-2.5-8.5-5.5 4.2-.3 7.4 1.2 9.4 4.2"></path>',
    leaf: '<path d="M16 51c7.1-13.6 17.2-25.3 32-37"></path><path d="M26.8 39.5c-5.2-.8-9-3.3-11.1-7.6 5.7-.8 10.6 1.8 13.5 6.5"></path><path d="M34.4 31.5c-4.1-3.1-5.9-7.1-5.3-11.8 4.9 2.4 7.7 6.6 7.3 11.1"></path><path d="M39.2 27.2c5-1.7 9.3-1 12.7 2.1-4.2 3.3-8.9 3.5-13.3.7"></path>',
    sprout: '<path d="M18 49c5.6-10.7 12.4-18.9 22.5-27.5"></path><path d="M28 38.2c-4.6-.7-8-2.8-10-6.2 5-.8 9.3 1.3 11.9 5.1"></path><path d="M36 29.8c-3.7-2.7-5.2-6.1-4.7-10.3 4.4 2.1 6.8 5.7 6.5 9.7"></path>',
    moon: '<path d="M43.2 47.1c-11.6 1.5-21.5-7.7-20.3-19 .6-6.2 4.4-11.1 9.3-13.9-1.7 4.4-1.8 8.8-.1 12.9 2.6 6.2 8.5 10.1 15.1 9.9-1 4.4-2.4 7.5-4 10.1Z"></path><path d="M18 50.5c5-1.4 9.7-2.1 14-2.1s9 .7 14 2.1"></path>',
    wave: '<path d="M2 14c15-10 28 10 43 0s28-10 43 0 21 5 30-1"></path>'
  };

  const viewBox = name === "wave" ? "0 0 120 24" : "0 0 64 64";
  return `<span class="hand-icon hand-icon-${name}" aria-hidden="true"><svg viewBox="${viewBox}" fill="none" stroke="currentColor" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.leaf}</svg></span>`;
}

function courseStyle(course) {
  return `--course-color:${safeColor(course?.color, "#7f9b73")};--course-soft:${safeColor(course?.soft, "#e8efe3")};--course-ink:${safeColor(course?.ink, "#5e7a55")}`;
}

function courseLabel(course) {
  return `<span class="course-label ${escapeAttr(course.id)}">${escapeHtml(course.name)}</span>`;
}

function textLink(label, route) {
  return `<a class="text-link" href="#${escapeAttr(route)}" data-route="${escapeAttr(route)}">${escapeHtml(label)}</a>`;
}

function lineBreaks(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

function applicationButton(item, active) {
  if (!active) {
    return `<span class="button-quiet application-button is-disabled" aria-disabled="true">募集は終了しました</span>`;
  }

  if (!item?.formUrl) {
    return `<span class="button-quiet application-button is-disabled" aria-disabled="true">申込フォーム準備中</span>`;
  }

  return `<a class="button-quiet application-button" href="${safeUrl(item.formUrl)}" target="_blank" rel="noopener noreferrer">申込フォームへ</a>`;
}

function copyActions(type, item) {
  const title = escapeAttr(item.title);
  const date = escapeAttr(item.eventDate || "");
  return `
    <div class="copy-actions" data-copy-actions aria-label="コピー操作">
      <button class="copy-button" type="button" data-copy-kind="url" data-copy-type="${type}" data-copy-title="${title}" data-copy-date="${date}" aria-label="リンクをコピー" title="リンクをコピー">
        <span class="copy-icon" aria-hidden="true">⌁</span>
      </button>
      <button class="copy-button" type="button" data-copy-kind="intro" data-copy-type="${type}" data-copy-title="${title}" data-copy-date="${date}" aria-label="紹介文つきでコピー" title="紹介文つきでコピー">
        <span class="copy-icon" aria-hidden="true">□</span>
      </button>
      <span class="copy-status" aria-live="polite"></span>
      <textarea class="copy-fallback" readonly hidden></textarea>
    </div>
  `;
}

function featuredReport(report) {
  const course = courseById(report.courseId);
  const route = articleRoute(report.id);
  return `
    <article class="feature-report" style="${courseStyle(course)}">
      <a class="feature-report__image image-frame photo-frame article-main-photo photo-pos-center" href="#${escapeAttr(route)}" data-route="${escapeAttr(route)}" aria-label="${escapeAttr(report.title)}" data-image-box>
        <img src="${safeUrl(report.image)}" alt="${escapeAttr(report.title)}の写真" loading="eager">
      </a>
      <div class="feature-report__caption">
        <span class="kicker">最新活動レポート</span>
        ${courseLabel(course)}
        <p>雲南のあちこちで生まれた、小さな学びのひとこま。</p>
        <h2><a href="#${escapeAttr(route)}" data-route="${escapeAttr(route)}">${escapeHtml(report.title)}</a></h2>
        <p class="meta">${escapeHtml(report.date)}｜${escapeHtml(report.place)}</p>
        <p>${escapeHtml(report.excerpt)}</p>
        ${textLink("活動の様子を見る", route)}
      </div>
    </article>
  `;
}

function reportListItem(report) {
  const course = courseById(report.courseId);
  const route = articleRoute(report.id);
  return `
    <a class="news-item" href="#${escapeAttr(route)}" data-route="${escapeAttr(route)}" style="${courseStyle(course)}" aria-label="${escapeAttr(report.title)}">
      <div class="news-item__meta">
        <time>${escapeHtml(report.shortDate)}</time>
        ${courseLabel(course)}
      </div>
      <div class="news-item__body">
        <h3>${escapeHtml(report.title)}</h3>
        <p>${escapeHtml(report.excerpt)}</p>
      </div>
      <span class="news-item__image image-frame photo-frame gallery-photo photo-pos-center" data-image-box>
        <img src="${safeUrl(report.image)}" alt="${escapeAttr(report.title)}の写真" loading="lazy">
      </span>
      <span class="row-action">読む<span aria-hidden="true">→</span></span>
    </a>
  `;
}

function courseRow(course, compact = false) {
  return `
    <a class="course-row" href="#course-${escapeAttr(course.id)}" data-route="course-${escapeAttr(course.id)}" style="${courseStyle(course)}" aria-label="${escapeAttr(course.name)}">
      <span class="course-row__icon">
        ${iconSvg(course.icon)}
      </span>
      <div class="course-row__body">
        <span class="kicker">${escapeHtml(course.category)}</span>
        <h3>${escapeHtml(course.name)}</h3>
        <p>${escapeHtml(course.name)}は、${escapeHtml(compact ? course.copy : course.description)}</p>
        <span class="meta">開催目安：${escapeHtml(course.months)}</span>
      </div>
      <span class="row-action">この講座を見る<span aria-hidden="true">→</span></span>
    </a>
  `;
}

function quietRecruitNotice() {
  if (!recruitment) return "";
  if (!isRecruiting(recruitment)) return "";
  const course = courseById(recruitment.courseId);
  return `
    <aside class="quiet-recruit" style="${courseStyle(course)}">
      <span class="kicker">次回のご案内</span>
      <h3>${escapeHtml(recruitment.title)}</h3>
      <p>参加できる講座があるときだけ、こちらでお知らせします。</p>
      <p class="meta">申込締切：${escapeHtml(recruitment.deadline)}</p>
      ${textLink("募集案内を見る", "recruit")}
    </aside>
  `;
}

function seasonNote(note) {
  return `
    <article class="season-note">
      ${iconSvg(note.icon)}
      <div>
        <span>${escapeHtml(note.season)}</span>
        <h3>${escapeHtml(note.title)}</h3>
        <p>${escapeHtml(note.text)}</p>
      </div>
    </article>
  `;
}

function homePage() {
  const latest = reports[0];
  const recent = reports.slice(1, 4).map(reportListItem).join("");
  const featured = latest
    ? featuredReport(latest)
    : `<aside class="feature-report__caption empty-feature"><span class="kicker">活動レポート</span><h2>最初の記事を準備中です</h2><p>公開された活動レポートが入ると、ここに新しい順で表示されます。</p></aside>`;

  return `
    <div class="page">
      <section class="home-cover">
        <div class="container home-cover__grid">
          <div class="home-cover__copy">
            <span class="kicker">${escapeHtml(site.introduction)}</span>
            <h1>${lineBreaks(site.lead)}</h1>
            <p>${lineBreaks(site.description)}</p>
            <div class="hero-actions home-cover__actions" aria-label="はじめに見るページ">
              <a class="primary-button" href="#reports" data-route="reports">最近の活動を見る<span aria-hidden="true">→</span></a>
              <a class="outline-button" href="#courses" data-route="courses">講座を探す</a>
            </div>
            <div class="cover-doodle">${iconSvg("flower")}${iconSvg("wave")}</div>
          </div>
          ${featured}
        </div>
      </section>

      <section class="section">
        <div class="container home-news">
          <div>
            <div class="section-header">
              <div>
                <span class="kicker">最近の活動レポート</span>
                <h2 class="section-title">最近の活動レポート</h2>
                <p class="lead">講座の様子を、写真とことばで。</p>
              </div>
              <a class="section-link" href="#reports" data-route="reports">読む</a>
            </div>
            <div class="news-list mini-news">${recent || `<p class="empty-state">公開された活動レポートはまだありません。</p>`}</div>
          </div>
          ${quietRecruitNotice()}
        </div>
      </section>

      <section class="section section-paper">
        <div class="container">
          <div class="section-header">
            <div>
              <span class="kicker">講座のこと</span>
              <h2 class="section-title">講座一覧</h2>
              <p class="lead">食、手しごと、親子の体験、交流の場。<br>暮らしに近い学びをひらいています。</p>
            </div>
            <a class="section-link" href="#courses" data-route="courses">講座一覧を見る</a>
          </div>
          <div class="course-list home-course-list">${courses.map((course) => courseRow(course, true)).join("")}</div>
        </div>
      </section>

      <section class="section">
        <div class="container season-section">
          <div class="section-header">
            <div>
              <span class="kicker">季節の活動</span>
              <h2 class="section-title">季節の活動</h2>
              <p class="lead">その季節だからこそ楽しめる、食と暮らしの学びがあります。</p>
            </div>
          </div>
          <div class="season-list">${seasonNotes.map(seasonNote).join("")}</div>
        </div>
      </section>
    </div>
  `;
}

function coursesPage() {
  return `
    <div class="page">
      <section class="subpage-hero">
        <div class="container">
          <span class="kicker">講座一覧</span>
          <h1>暮らしの近くにある、学びと交流。</h1>
          <p class="lead">写真がなくても、講座の色と線画で雰囲気が伝わるように。各講座を、落ち着いた縦の一覧で紹介します。</p>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="course-list">${courses.map((course) => courseRow(course)).join("")}</div>
        </div>
      </section>
    </div>
  `;
}

function coursePage(courseId) {
  const course = courseById(courseId);
  if (!course) return notFoundPage();
  const courseReports = reports.filter((report) => report.courseId === course.id);
  const reportItems = (courseReports.length ? courseReports : reports.slice(0, 3)).map(reportListItem).join("");
  const recruitBlock = recruitment && course.id === recruitment.courseId && isRecruiting(recruitment) ? quietRecruitNotice() : "";

  return `
    <div class="page">
      <section class="course-door" style="${courseStyle(course)}">
        <div class="container course-door__inner">
          <div class="course-door__copy">
            <span class="kicker">${escapeHtml(course.category)}</span>
            ${iconSvg(course.icon)}
            <h1>${escapeHtml(course.name)}</h1>
            <p class="lead">${escapeHtml(course.copy)}</p>
            <p>${escapeHtml(course.description)}</p>
            <p class="meta">開催目安：${escapeHtml(course.months)}</p>
          </div>
          <figure class="course-door__photo image-frame photo-frame article-main-photo photo-pos-center" data-image-box>
            <img src="${safeUrl(course.image)}" alt="${escapeAttr(course.name)}の様子" loading="lazy">
          </figure>
        </div>
      </section>
      <section class="section">
        <div class="container two-column">
          <div>
            <div class="section-header">
              <div>
                <span class="kicker">活動の記録</span>
                <h2 class="section-title">この講座の活動レポート</h2>
              </div>
            </div>
            <div class="news-list">${reportItems || `<p class="empty-state">この講座の活動レポートはまだありません。</p>`}</div>
          </div>
          ${recruitBlock}
        </div>
      </section>
    </div>
  `;
}

function reportsPage() {
  const years = [...new Set(reports.map((report) => String(report.eventDate || "").slice(0, 4)).filter(Boolean))];
  return `
    <div class="page">
      <section class="subpage-hero">
        <div class="container">
          <span class="kicker">活動レポート</span>
          <h1>講座の雰囲気を、読み物として残す。</h1>
          <p class="lead">開催日をもとに、新しい順で活動を掲載します。講座ごとに絞り込みながら、地域の学びの記録を読めます。</p>
        </div>
      </section>
      <section class="section">
        <div class="container">
          <div class="report-tools">
            <div class="filter-bar" aria-label="講座で絞り込み">
              <button class="is-active" type="button" data-filter="all">すべて</button>
              ${courses.map((course) => `<button type="button" data-filter="${escapeAttr(course.id)}">${escapeHtml(course.name)}</button>`).join("")}
            </div>
            <div class="report-search" aria-label="活動レポート検索">
              <label>
                <span>キーワード</span>
                <input id="reportSearch" type="search" placeholder="タイトル・内容で探す">
              </label>
              <label>
                <span>年</span>
                <select id="reportYear">
                  <option value="all">すべて</option>
                  ${years.map((year) => `<option value="${escapeAttr(year)}">${escapeHtml(year)}年</option>`).join("")}
                </select>
              </label>
            </div>
          </div>
          <div class="news-list" id="reportList">${reports.length ? reports.map(reportListItem).join("") : `<p class="empty-state">公開された活動レポートはまだありません。</p>`}</div>
        </div>
      </section>
    </div>
  `;
}

function articlePage(reportId) {
  const report = findReportById(reportId);
  if (!report) return notFoundPage("活動レポートはまだありません", "公開された記事が入ると、ここから読めるようになります。");
  const course = courseById(report.courseId);
  const related = reports.filter((item) => item.courseId === report.courseId && item.id !== report.id);

  return `
    <div class="page">
      <article class="article-page" style="${courseStyle(course)}">
        <header class="article-hero">
          <div class="container article-title-block">
            <span class="kicker">活動レポート</span>
            ${courseLabel(course)}
            <h1>${escapeHtml(report.title)}</h1>
            <p class="lead">${escapeHtml(report.subtitle)}</p>
            <p class="meta">${escapeHtml(report.date)}｜${escapeHtml(report.place)}｜講師：${escapeHtml(report.instructor)}</p>
            ${copyActions("report", report)}
            <div class="article-doodle">${iconSvg(course.icon)}${iconSvg("wave")}</div>
          </div>
        </header>
        <div class="container article-body">
          <figure class="article-main-image image-frame photo-frame article-main-photo photo-pos-center" data-image-box>
            <img src="${safeUrl(report.image)}" alt="${escapeAttr(report.title)}の写真" loading="eager">
          </figure>
          <div class="reading">
            ${report.body.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
            <section class="info-box">
              <h2>今回の内容</h2>
              <ul class="content-list">
                ${report.activityItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
              </ul>
            </section>
            <section class="voice-box">
              <h2>参加者の声</h2>
              ${report.voices.map((voice) => `<blockquote>${escapeHtml(voice)}</blockquote>`).join("") || `<p class="empty-state">参加者の声はまだ登録されていません。</p>`}
            </section>
          </div>
          <aside class="related-block">
            <div class="section-header">
              <div>
                <span class="kicker">講座の記録</span>
                <h2 class="section-title">この講座のほかの記録</h2>
              </div>
            </div>
            <div class="related-list">
              ${related.length ? related.map((item) => `
                <a href="#${escapeAttr(articleRoute(item.id))}" data-route="${escapeAttr(articleRoute(item.id))}">
                  <span>${escapeHtml(item.title)}</span>
                  <small>${escapeHtml(item.shortDate)}</small>
                </a>
              `).join("") : `<p class="empty-state">この講座のほかの記録はまだありません。</p>`}
            </div>
          </aside>
        </div>
      </article>
    </div>
  `;
}

function notFoundPage(title = "ページが見つかりません", text = "指定されたページは公開中ではないか、移動した可能性があります。") {
  return `
    <div class="page">
      <section class="subpage-hero">
        <div class="container">
          <span class="kicker">お知らせ</span>
          <h1>${escapeHtml(title)}</h1>
          <p class="lead">${escapeHtml(text)}</p>
          ${textLink("ホームへ戻る", "home")}
        </div>
      </section>
    </div>
  `;
}

function recruitPage() {
  if (!recruitment) {
    return notFoundPage("募集情報はまだありません", "募集中の講座があるときに、このページで案内します。");
  }
  const course = courseById(recruitment.courseId);
  const active = isRecruiting(recruitment);
  return `
    <div class="page">
      <section class="subpage-hero quiet-recruit-hero" style="${courseStyle(course)}">
        <div class="container">
          <span class="kicker">募集情報</span>
          <h1>${escapeHtml(recruitment.title)}</h1>
          <p class="lead">${active ? escapeHtml(recruitment.excerpt) : "この募集は終了しました。開催後の様子は活動レポートで紹介します。"}</p>
          ${copyActions("recruit", recruitment)}
        </div>
      </section>
      <section class="section">
        <div class="container article-body">
          <figure class="article-main-image image-frame photo-frame article-main-photo photo-pos-center" data-image-box>
            <img src="${safeUrl(course.image)}" alt="${escapeAttr(course.name)}の様子" loading="eager">
          </figure>
          <div class="reading">
            <p>募集情報は、活動レポートの流れを邪魔しないように静かに掲載します。締切後はトップページから自動で非表示になり、このページでは終了案内として残ります。</p>
            <section class="info-box">
              <h2>概要</h2>
              <ul class="content-list">
                <li>日時：${escapeHtml(recruitment.eventDate)} ${escapeHtml(recruitment.time)}</li>
                <li>場所：${escapeHtml(recruitment.place)}</li>
                <li>参加費：${escapeHtml(recruitment.fee)}</li>
                <li>申込締切：${escapeHtml(recruitment.deadline)}</li>
              </ul>
              ${applicationButton(recruitment, active)}
            </section>
            <div class="recruit-bottom-cta">
              <p>${active ? "参加を希望される方は、内容をご確認のうえお申し込みください。" : "募集は終了しました。次回の案内をお待ちください。"}</p>
              ${applicationButton(recruitment, active)}
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function contactPage() {
  const examples = ["講座について", "申込について", "赤ちゃん食堂について", "写真掲載について", "その他のお問い合わせ"];
  return `
    <div class="page">
      <section class="subpage-hero contact-hero">
        <div class="container">
          <span class="kicker">お問い合わせ</span>
          <h1>お問い合わせ</h1>
          <p class="lead">講座や活動についてのお問い合わせは、JAしまね雲南地区本部までご連絡ください。</p>
        </div>
      </section>
      <section class="section">
        <div class="container contact-layout">
          <div class="contact-main">
            <section class="info-box contact-panel">
              <h2>連絡先</h2>
              <dl class="contact-list">
                <div>
                  <dt>団体名</dt>
                  <dd>${escapeHtml(contactInfo.organization)}</dd>
                </div>
                <div>
                  <dt>担当部署</dt>
                  <dd>${escapeHtml(contactInfo.department)}</dd>
                </div>
                <div>
                  <dt>電話番号</dt>
                  <dd>${escapeHtml(contactInfo.tel)}</dd>
                </div>
                <div>
                  <dt>受付時間</dt>
                  <dd>${escapeHtml(contactInfo.hours)}</dd>
                </div>
              </dl>
              <p class="contact-note">お問い合わせの際は、「うんなん暮らしの学び帖を見た」とお伝えください。</p>
            </section>
            <section class="info-box contact-panel">
              <h2>問い合わせ例</h2>
              <ul class="content-list">
                ${examples.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </section>
          </div>
          <aside class="quiet-recruit contact-side">
            <span class="kicker">Instagram</span>
            <h3>活動の様子を、写真でも。</h3>
            <p>${escapeHtml(contactInfo.instagramNote)}</p>
            <a class="button-quiet nav-external" href="${safeUrl(site.instagramUrl)}" target="_blank" rel="noopener noreferrer">Instagram</a>
          </aside>
        </div>
      </section>
    </div>
  `;
}

function adminUrl() {
  const configured = String(window.LEARNING_ADMIN_URL || "").trim();
  if (configured) return configured;
  const dataUrl = String(window.LEARNING_DATA_URL || "").trim();
  if (!dataUrl) return "";
  return `${dataUrl}${dataUrl.includes("?") ? "&" : "?"}page=admin`;
}

function adminPage() {
  const url = adminUrl();
  return `
    <div class="page">
      <section class="subpage-hero">
        <div class="container">
          <span class="kicker">管理画面</span>
          <h1>記事の登録・編集はGAS管理画面で行います。</h1>
          <p class="lead">この公開ページ内の <code>#admin</code> は案内用です。読み込み中のまま止まる場合は、GASウェブアプリの管理画面URLを直接開いてください。</p>
          <div class="hero-actions">
            ${url ? `<a class="primary-button nav-external" href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">GAS管理画面を開く</a>` : ""}
            <a class="button-quiet" href="#home" data-route="home">公開サイトへ戻る</a>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="container two-column">
          <section class="info-box">
            <h2>読み込み中で止まるとき</h2>
            <ul class="content-list">
              <li>管理画面は <code>/exec?page=admin</code> で開きます。</li>
              <li>ローカルの <code>gas/Admin.html</code> を直接開くと、GAS連携が動かないため読み込めません。</li>
              <li>Apps Script の <code>ALLOWED_EDITORS</code> に利用するGoogleアカウントを登録してください。</li>
            </ul>
          </section>
          <aside class="quiet-recruit">
            <span class="kicker">公開ページ</span>
            <h3>ここでは表示確認だけできます。</h3>
            <p>活動レポートや講座ページの見え方は、このサイト側で確認できます。記事の保存・写真アップロードはGAS管理画面を使います。</p>
          </aside>
        </div>
      </section>
    </div>
  `;
}

function adminDashboard() {
  return `
    <div class="admin-top">
      <div>
        <span class="kicker">管理画面</span>
        <h1>${escapeHtml(site.name)}</h1>
        <p class="meta">入力項目は増やさず、講座色・アイコン・関連表示は自動で反映します。</p>
      </div>
      <a class="button-quiet" href="#home" data-route="home">公開サイトを見る</a>
    </div>
    <div class="admin-actions">
      <button class="admin-card" type="button" data-admin-view="editor"><span>+</span><h3>新規記事</h3><p>活動レポートを作成</p></button>
      <button class="admin-card" type="button" data-admin-view="past"><span>+</span><h3>過去記事</h3><p>過去開催分を登録</p></button>
      <button class="admin-card" type="button" data-admin-view="recruit"><span>+</span><h3>募集案内</h3><p>締切後は自動で控えめに</p></button>
    </div>
    <div class="admin-columns">
      <div>
        <div class="section-header"><h2 class="section-title">最近の記事</h2></div>
        ${adminList()}
      </div>
      ${previewPalette()}
    </div>
  `;
}

function adminList() {
  const rows = reports.slice(0, 4).map((report, index) => {
    const course = courseById(report.courseId);
    const status = index === 1 ? "下書き" : "公開";
    return `<div class="admin-row"><span data-label="状態"><b class="admin-status ${status === "公開" ? "published" : "draft"}">${status}</b></span><span data-label="開催日">${escapeHtml(report.shortDate)}</span><span data-label="講座">${escapeHtml(course.name)}</span><span data-label="タイトル">${escapeHtml(report.title)}</span><span data-label="操作"><button type="button" class="table-action">編集</button></span></div>`;
  }).join("");

  return `
    <div class="admin-list">
      <div class="admin-row head"><span>状態</span><span>開催日</span><span>講座</span><span>タイトル</span><span>操作</span></div>
      ${rows || `<p class="empty-state">公開された記事はまだありません。</p>`}
    </div>
  `;
}

function editorView(mode = "report") {
  const title = {
    report: "記事作成",
    past: "過去記事登録",
    recruit: "募集案内作成"
  }[mode] || "記事作成";
  const sampleReport = reports[0] || { title: "", image: "assets/images/symbol_ja.png" };
  const editorTitle = mode === "recruit" ? recruitment?.title || "" : sampleReport.title;

  return `
    <div class="admin-top">
      <div>
        <span class="kicker">管理画面</span>
        <h1>${title}</h1>
      </div>
      <div class="header-actions">
        <button class="button-quiet" type="button">下書き保存</button>
        <button class="primary-button" type="button" data-publish-button disabled>公開</button>
      </div>
    </div>
    <div class="editor-layout">
      <form class="editor-form">
        <div class="field-grid">
          <label class="field">
            <span>投稿タイプ</span>
            <select><option>${mode === "recruit" ? "募集案内" : "活動レポート"}</option><option>お知らせ</option></select>
          </label>
          <label class="field">
            <span>講座名</span>
            <select data-editor-course>${courses.map((course) => `<option>${escapeHtml(course.name)}</option>`).join("")}</select>
          </label>
          <label class="field">
            <span>開催日</span>
            <input type="date" value="2026-01-27" data-editor-date>
          </label>
          <label class="field">
            <span>公開状態</span>
            <select><option>下書き</option><option>公開予約</option><option>公開</option></select>
          </label>
        </div>
        <label class="field">
          <span>タイトル</span>
          <input value="${escapeAttr(editorTitle)}" data-editor-title>
        </label>
        <div class="field-grid">
          <label class="field">
            <span>講師名</span>
            <input value="飯塚生美子">
          </label>
          <label class="field">
            <span>講師肩書き</span>
            <input value="島根県家の光講師">
          </label>
        </div>
        <label class="field">
          <span>内容メモ</span>
          <textarea>発酵食品をテーマにした料理教室。味噌、ヨーグルト、塩麹を使ったメニュー。</textarea>
        </label>
        <label class="field">
          <span>本文</span>
          <textarea>この日は、発酵食品をテーマにした料理教室を開催しました。</textarea>
        </label>
        ${photoQualitySection()}
        <label class="field">
          <span>参加者の声</span>
          <textarea>ヨーグルトの新しい利用法がすごく勉強になりました。</textarea>
        </label>
        <label class="field">
          <span>Instagram本文・ハッシュタグ</span>
          <textarea>#JAしまね #雲南 #華凜</textarea>
        </label>
      </form>
      ${previewPalette()}
    </div>
  `;
}

function photoQualitySection() {
  const report = reports[0] || { image: "assets/images/symbol_ja.png", title: "サンプル" };
  return `
    <section class="photo-tools" data-photo-tools>
      <div class="photo-tools__head">
        <div>
          <span class="kicker">写真管理</span>
          <h2>写真の品質と統一感</h2>
          <p class="form-hint">AI連携はせず、相談用プロンプトと職員の確認で写真を整えます。</p>
        </div>
        <button class="button-quiet" type="button" data-ai-photo-prompt>AIに写真を相談するプロンプトをコピー</button>
      </div>
      <textarea class="ai-prompt-fallback" data-ai-prompt-fallback readonly hidden></textarea>

      <div class="shooting-guide">
        <p>写真は上手に撮ろうとしすぎなくて大丈夫です。</p>
        <ul>
          <li>1枚は全体、1枚は手元、1枚は完成品を撮ると記事にしやすくなります。</li>
          <li>顔写真よりも、料理・作品・手元・会場の雰囲気を優先してください。</li>
          <li>赤ちゃん食堂や親子講座では、顔や個人情報が写りすぎていないか確認してください。</li>
        </ul>
      </div>

      <label class="upload-box">
        <span>写真を選択</span>
        <small class="form-hint">複数枚選べます。選んだ写真は公開サイトと同じ加工で確認できます。</small>
        <input type="file" accept="image/*" multiple data-photo-input>
      </label>

      <div class="photo-view-switch" role="group" aria-label="写真表示の切り替え">
        <button class="is-active" type="button" data-photo-mode="published">掲載イメージ</button>
        <button type="button" data-photo-mode="original">元写真</button>
      </div>

      <div class="photo-cards" data-photo-list>
        ${photoCardTemplate({ src: report.image, name: "写真1", caption: "講座の雰囲気が伝わる一枚", alt: `${report.title}の様子`, sample: true })}
      </div>

      <label class="field">
        <span>AIからの写真アドバイス貼り付け欄</span>
        <textarea data-ai-photo-advice placeholder="チャッピー等の回答をここに貼り付けます。自動反映はせず、内容を見ながら手動で設定します。"></textarea>
      </label>

      <div class="check-panel publish-checks" data-publish-checks>
        <label><input type="checkbox" data-required-publish-check> 写真掲載に問題がないことを確認しました</label>
        <label><input type="checkbox" data-required-publish-check> 顔や個人情報が写りすぎていないことを確認しました</label>
        <label><input type="checkbox" data-required-publish-check> 必要に応じて掲載許可を確認しました</label>
        <p class="form-hint">すべて確認すると公開ボタンが使えるようになります。</p>
      </div>
    </section>
  `;
}

function photoCardTemplate({ src, name, caption = "", alt = "", sample = false }) {
  const escapedSrc = safeUrl(src);
  return `
    <article class="photo-card" data-photo-card data-photo-mode-current="published">
      <div class="photo-preview-pair">
        <figure class="photo-frame article-main-photo photo-pos-center photo-preview photo-preview-published">
          <img src="${escapedSrc}" alt="${escapeAttr(alt || name)}">
        </figure>
        <figure class="photo-frame article-main-photo photo-preview photo-preview-original">
          <img src="${escapedSrc}" alt="${escapeAttr(alt || name)}">
        </figure>
      </div>
      <div class="photo-card__body">
        <div class="photo-card__top">
          <strong>${escapeHtml(name)}</strong>
          ${sample ? `<span class="meta">サンプル</span>` : ""}
        </div>
        <div class="field-grid">
          <label class="field">
            <span>使用設定</span>
            <select data-photo-use><option>使用する</option><option>使用しない</option></select>
          </label>
          <label class="field">
            <span>役割</span>
            <select data-photo-role><option>メイン写真</option><option>本文中の写真</option><option>ギャラリー</option><option>使わない</option></select>
          </label>
          <label class="field">
            <span>トリミング位置</span>
            <select data-photo-position>
              <option value="center">中央</option>
              <option value="top">上寄せ</option>
              <option value="bottom">下寄せ</option>
              <option value="left">左寄せ</option>
              <option value="right">右寄せ</option>
            </select>
          </label>
          <label class="field check-field">
            <span>写真掲載チェック</span>
            <label><input type="checkbox" data-photo-approved> 確認済み</label>
          </label>
        </div>
        <label class="field">
          <span>キャプション</span>
          <input value="${escapeAttr(caption)}" data-photo-caption>
        </label>
        <label class="field">
          <span>altテキスト</span>
          <input value="${escapeAttr(alt)}" data-photo-alt>
        </label>
        <label class="field">
          <span>AIアドバイス</span>
          <textarea data-photo-advice placeholder="AIの助言や注意点をメモします。"></textarea>
        </label>
      </div>
    </article>
  `;
}

function phonePreview() {
  const report = reports[0] || { courseId: "", image: "assets/images/symbol_ja.png", title: "プレビュー", excerpt: "", voices: [""] };
  const course = courseById(report.courseId);
  return `
    <div class="site-header-mini">
      <strong>${escapeHtml(site.name)}</strong>
      <span>☰</span>
    </div>
    <article class="phone-story" style="${courseStyle(course)}">
      <img src="${safeUrl(report.image)}" alt="${escapeAttr(report.title)}の写真">
      ${courseLabel(course)}
      <h3>${escapeHtml(report.title)}</h3>
      <p>${escapeHtml(report.excerpt)}</p>
    </article>
    <div class="voice-box compact-voice"><blockquote>${escapeHtml(report.voices[0] || "")}</blockquote></div>
  `;
}

function previewPalette() {
  return `
    <section class="preview-palette is-closed" data-preview-palette aria-label="スマホプレビュー">
      <div class="preview-palette__bar" data-preview-action="close" title="ダブルクリックで閉じる">
        <div class="palette-controls" aria-label="プレビュー操作">
          <button class="palette-button close" type="button" data-preview-action="close" aria-label="閉じる"></button>
          <button class="palette-button minimize" type="button" data-preview-action="minimize" aria-label="最小化"></button>
          <button class="palette-button maximize" type="button" data-preview-action="maximize" aria-label="最大化"></button>
        </div>
        <span class="palette-title"><strong>Phone View</strong><span>スマホプレビュー</span></span>
      </div>
      <div class="preview-palette__body">
        <div class="preview-phone">${phonePreview()}</div>
      </div>
    </section>
  `;
}

const routes = {
  home: homePage,
  courses: coursesPage,
  reports: reportsPage,
  article: articlePage,
  recruit: recruitPage,
  contact: contactPage,
  admin: adminPage
};

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function routeFromHash() {
  const raw = window.location.hash.replace("#", "") || "home";
  try {
    return decodeURIComponent(raw);
  } catch (error) {
    return raw;
  }
}

function render() {
  closeMenu();
  if (pageLoading) pageLoading.hidden = false;
  const route = routeFromHash();
  const courseMatch = route.match(/^course-(.+)$/);

  if (courseMatch) {
    app.innerHTML = coursePage(courseMatch[1]);
  } else if (route === "article") {
    app.innerHTML = articlePage();
  } else if (route.startsWith("article-")) {
    app.innerHTML = articlePage(route.replace(/^article-/, ""));
  } else {
    const page = routes[route] || routes.home;
    app.innerHTML = page();
  }

  updateActiveNav(route);
  bindPageActions();
  bindImageFallbacks();
  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  window.setTimeout(() => {
    if (pageLoading) pageLoading.hidden = true;
  }, 140);
}

function updateActiveNav(route) {
  document.querySelectorAll(".desktop-nav a, .mobile-menu a").forEach((link) => {
    const linkRoute = link.dataset.route;
    const isCourse = route.startsWith("course") && linkRoute === "courses";
    const isReport = route.startsWith("article") && linkRoute === "reports";
    const isActive = linkRoute === route || isCourse || isReport;
    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function bindPageActions() {
  bindRouteLinks();
  bindPreviewPalettes();
  bindPhotoTools();

  document.querySelectorAll(".mobile-menu a:not([data-route])").forEach((link) => {
    if (link.dataset.boundMenu === "true") return;
    link.dataset.boundMenu = "true";
    link.addEventListener("click", closeMenu);
  });

  function applyReportFilters() {
    const activeFilter = document.querySelector("[data-filter].is-active")?.dataset.filter || "all";
    const keyword = document.querySelector("#reportSearch")?.value.trim().toLowerCase() || "";
    const year = document.querySelector("#reportYear")?.value || "all";
    const filtered = reports.filter((report) => {
      const course = courseById(report.courseId);
      const matchesCourse = activeFilter === "all" || report.courseId === activeFilter;
      const matchesYear = year === "all" || String(report.eventDate || "").startsWith(year);
      const haystack = `${report.title} ${report.excerpt} ${report.place} ${course.name}`.toLowerCase();
      const matchesKeyword = !keyword || haystack.includes(keyword);
      return matchesCourse && matchesYear && matchesKeyword;
    });
    const list = document.querySelector("#reportList");
    if (list) {
      list.innerHTML = filtered.length ? filtered.map(reportListItem).join("") : `<p class="empty-state">該当する活動レポートはありません。</p>`;
      bindRouteLinks(list);
      bindImageFallbacks(list);
    }
  }

  document.querySelectorAll("[data-filter]").forEach((button) => {
    if (button.dataset.boundFilter === "true") return;
    button.dataset.boundFilter = "true";
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-filter]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      applyReportFilters();
    });
  });

  const reportSearch = document.querySelector("#reportSearch");
  if (reportSearch && reportSearch.dataset.boundSearch !== "true") {
    reportSearch.dataset.boundSearch = "true";
    reportSearch.addEventListener("input", applyReportFilters);
  }

  const reportYear = document.querySelector("#reportYear");
  if (reportYear && reportYear.dataset.boundYear !== "true") {
    reportYear.dataset.boundYear = "true";
    reportYear.addEventListener("change", applyReportFilters);
  }

  document.querySelectorAll("[data-admin-view]").forEach((button) => {
    if (button.dataset.boundAdmin === "true") return;
    button.dataset.boundAdmin = "true";
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-admin-view]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const view = button.dataset.adminView;
      const adminContent = document.querySelector("#adminContent");
      if (view === "dashboard") adminContent.innerHTML = adminDashboard();
      if (view === "list") adminContent.innerHTML = `<div class="admin-top"><h1>記事一覧</h1></div>${adminList()}`;
      if (view === "editor") adminContent.innerHTML = editorView("report");
      if (view === "past") adminContent.innerHTML = editorView("past");
      if (view === "recruit") adminContent.innerHTML = editorView("recruit");
      bindPageActions();
    });
  });
}

function bindPhotoTools(root = document) {
  root.querySelectorAll("[data-photo-tools]").forEach((tools) => {
    if (tools.dataset.boundPhotoTools === "true") return;
    tools.dataset.boundPhotoTools = "true";

    const list = tools.querySelector("[data-photo-list]");
    const fileInput = tools.querySelector("[data-photo-input]");

    const syncPublishState = () => {
      const requiredChecks = [...document.querySelectorAll("[data-required-publish-check]")];
      const publishButton = document.querySelector("[data-publish-button]");
      if (!publishButton) return;
      const ready = requiredChecks.length > 0 && requiredChecks.every((item) => item.checked);
      publishButton.disabled = !ready;
      publishButton.setAttribute("aria-disabled", String(!ready));
    };

    const setPhotoMode = (mode) => {
      tools.dataset.photoMode = mode;
      tools.querySelectorAll("[data-photo-mode]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.photoMode === mode);
      });
      tools.querySelectorAll("[data-photo-card]").forEach((card) => {
        card.dataset.photoModeCurrent = mode;
      });
    };

    tools.querySelectorAll("[data-photo-mode]").forEach((button) => {
      button.addEventListener("click", () => setPhotoMode(button.dataset.photoMode));
    });

    fileInput?.addEventListener("change", () => {
      const files = [...fileInput.files || []].filter((file) => file.type.startsWith("image/"));
      if (!list || files.length === 0) return;
      list.innerHTML = files.map((file, index) => photoCardTemplate({
        src: URL.createObjectURL(file),
        name: `写真${index + 1}`,
        caption: "",
        alt: file.name.replace(/\.[^.]+$/, "")
      })).join("");
      setPhotoMode(tools.dataset.photoMode || "published");
      bindPhotoTools(tools);
    });

    tools.addEventListener("change", (event) => {
      const positionSelect = event.target.closest?.("[data-photo-position]");
      if (positionSelect) {
        const card = positionSelect.closest("[data-photo-card]");
        const frames = card?.querySelectorAll(".photo-frame");
        frames?.forEach((frame) => {
          frame.classList.remove("photo-pos-center", "photo-pos-top", "photo-pos-bottom", "photo-pos-left", "photo-pos-right");
          frame.classList.add(`photo-pos-${positionSelect.value}`);
        });
      }
      if (event.target.matches("[data-required-publish-check]")) syncPublishState();
    });

    tools.querySelector("[data-ai-photo-prompt]")?.addEventListener("click", async () => {
      const prompt = buildPhotoAdvicePrompt();
      const button = tools.querySelector("[data-ai-photo-prompt]");
      try {
        await copyToClipboard(prompt);
        button.textContent = "コピーしました";
        window.setTimeout(() => {
          button.textContent = "AIに写真を相談するプロンプトをコピー";
        }, 1800);
      } catch (error) {
        const fallback = tools.querySelector("[data-ai-prompt-fallback]");
        if (fallback) {
          fallback.hidden = false;
          fallback.value = prompt;
          fallback.focus();
          fallback.select();
        }
        button.textContent = "コピーできない場合は選択中の文面をコピー";
      }
    });

    syncPublishState();
  });
}

function buildPhotoAdvicePrompt() {
  const courseName = document.querySelector("[data-editor-course]")?.value || courses[0].name;
  const eventDate = document.querySelector("[data-editor-date]")?.value || reports[0].date;
  const title = document.querySelector("[data-editor-title]")?.value || reports[0].title;
  const photoCount = document.querySelectorAll("[data-photo-card]").length || 2;
  const photoBlocks = Array.from({ length: Math.max(photoCount, 2) }, (_, index) => `写真${index + 1}：
- 掲載判断：
- 役割：
- トリミング位置：
- 注意点：
- キャプション：`).join("\n\n");

  return `以下の写真を、JAしまね雲南地区本部の「うんなん暮らしの学び帖」に掲載する前提で確認してください。

サイトの雰囲気：
生成り背景、細い線、ミニマル、やさしい暮らしの記録。
派手すぎず、少し明るく、彩度控えめ、あたたかい雰囲気。

記事情報：
講座名：${courseName}
開催日：${eventDate}
記事タイトル：${title}

確認してほしいこと：
1. メイン写真に向いている写真
2. ギャラリー向きの写真
3. 使わない方がよい写真
4. 顔や個人情報が写りすぎていないか
5. トリミングするなら、中央・上寄せ・下寄せ・左寄せ・右寄せのどれがよいか
6. 各写真の短いキャプション
7. 記事全体として写真が足りているか

出力形式：
${photoBlocks}`;
}

function bindPreviewPalettes(root = document) {
  root.querySelectorAll("[data-preview-palette]").forEach((palette) => {
    if (palette.dataset.boundPreview === "true") return;
    palette.dataset.boundPreview = "true";
    let dragState = null;

    const movePalette = (event) => {
      if (!dragState) return;
      const nextLeft = Math.min(Math.max(8, event.clientX - dragState.offsetX), window.innerWidth - dragState.width - 8);
      const nextTop = Math.min(Math.max(8, event.clientY - dragState.offsetY), window.innerHeight - 48);
      palette.style.left = `${nextLeft}px`;
      palette.style.top = `${nextTop}px`;
    };

    const stopDragging = () => {
      dragState = null;
      document.removeEventListener("pointermove", movePalette);
      document.removeEventListener("pointerup", stopDragging);
      document.removeEventListener("pointercancel", stopDragging);
    };

    palette.querySelectorAll("[data-preview-action]").forEach((control) => {
      const action = control.dataset.previewAction;
      if (action === "close" && control.classList.contains("preview-palette__bar")) {
        control.addEventListener("pointerdown", (event) => {
          if (event.target.closest(".palette-button")) return;
          if (event.button !== 0) return;
          const rect = palette.getBoundingClientRect();
          palette.classList.add("is-floating");
          palette.classList.remove("is-maximized");
          palette.style.width = `${Math.round(rect.width)}px`;
          palette.style.left = `${Math.round(rect.left)}px`;
          palette.style.top = `${Math.round(rect.top)}px`;
          palette.style.right = "auto";
          palette.style.bottom = "auto";
          dragState = {
            offsetX: event.clientX - rect.left,
            offsetY: event.clientY - rect.top,
            width: rect.width
          };
          document.addEventListener("pointermove", movePalette);
          document.addEventListener("pointerup", stopDragging);
          document.addEventListener("pointercancel", stopDragging);
        });
        control.addEventListener("dblclick", () => {
          if (dragState) return;
          palette.classList.add("is-closed");
        });
        return;
      }

      control.addEventListener("click", (event) => {
        event.stopPropagation();
        if (action === "close") {
          palette.classList.add("is-closed");
          return;
        }
        if (action === "minimize") {
          palette.classList.toggle("is-minimized");
          palette.classList.remove("is-maximized");
          return;
        }
        if (action === "maximize") {
          palette.classList.toggle("is-maximized");
          palette.classList.remove("is-minimized");
          if (palette.classList.contains("is-maximized")) {
            palette.classList.remove("is-floating");
            palette.style.left = "";
            palette.style.top = "";
            palette.style.right = "";
            palette.style.bottom = "";
            palette.style.width = "";
          }
        }
      });
    });
  });

  root.querySelectorAll("[data-preview-restore]").forEach((button) => {
    if (button.dataset.boundPreviewRestore === "true") return;
    button.dataset.boundPreviewRestore = "true";
    button.addEventListener("click", () => {
      const palette = document.querySelector("[data-preview-palette]");
      if (!palette?.matches("[data-preview-palette]")) return;
      palette.classList.remove("is-closed", "is-minimized", "is-maximized", "is-floating");
      palette.style.left = "";
      palette.style.top = "";
      palette.style.right = "";
      palette.style.bottom = "";
      palette.style.width = "";
    });
  });
}

function currentPageUrl() {
  return `${window.location.origin}${window.location.pathname}${window.location.hash || "#home"}`;
}

function copyTextForButton(button) {
  const url = currentPageUrl();
  if (button.dataset.copyKind === "url") return url;

  const title = button.dataset.copyTitle || document.title;
  if (button.dataset.copyType === "recruit") {
    const date = button.dataset.copyDate ? `開催日：${button.dataset.copyDate}\n` : "";
    return `募集案内はこちらです。\n${title}\n${date}${url}`;
  }

  return `活動レポートを掲載しました。\n${title}\n${url}`;
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // Fall through to the textarea fallback for browsers with stricter clipboard permissions.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("copy failed");
}

function bindRouteLinks(root = document) {
  root.querySelectorAll("[data-route]").forEach((link) => {
    if (link.dataset.boundRoute === "true") return;
    link.dataset.boundRoute = "true";
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetRoute = link.dataset.route;
      closeMenu();

      if (routeFromHash() === targetRoute) {
        render();
        return;
      }

      window.location.hash = `#${targetRoute}`;
    });
  });
}

function bindImageFallbacks(root = document) {
  root.querySelectorAll("[data-image-box] img").forEach((img) => {
    if (img.dataset.boundImage === "true") return;
    img.dataset.boundImage = "true";
    img.addEventListener("load", () => {
      img.closest("[data-image-box]")?.classList.remove("is-loading", "is-error");
    });
    img.addEventListener("error", () => {
      const frame = img.closest("[data-image-box]");
      if (!frame) return;
      frame.classList.remove("is-loading");
      frame.classList.add("is-error");
      img.hidden = true;
    });
    if (!img.complete) {
      img.closest("[data-image-box]")?.classList.add("is-loading");
    }
  });
}

function closeMenu() {
  mobileMenu.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
  document.body.classList.remove("menu-open");
}

menuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  const expanded = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!expanded));
  mobileMenu.hidden = expanded;
  document.body.classList.toggle("menu-open", !expanded);
});

mobileMenu.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  if (menuButton.getAttribute("aria-expanded") === "true") closeMenu();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest?.("[data-copy-kind]");
  if (!button) return;
  event.preventDefault();
  const text = copyTextForButton(button);
  const actions = button.closest("[data-copy-actions]");
  const status = actions?.querySelector(".copy-status");
  const fallback = actions?.querySelector(".copy-fallback");
  try {
    await copyToClipboard(text);
    if (fallback) fallback.hidden = true;
    if (status) status.textContent = "コピーしました";
  } catch (error) {
    if (fallback) {
      fallback.value = text;
      fallback.hidden = false;
      fallback.focus();
      fallback.select();
    }
    if (status) status.textContent = "コピーできない場合は、選択中の文面をコピーしてください";
  }
  if (status) {
    window.setTimeout(() => {
      status.textContent = "";
    }, 2200);
  }
});

window.addEventListener("hashchange", render);

// まず同梱データで即描画。GASのURLが設定されていれば取得して差し替え、再描画する。
render();

if (typeof window.loadSiteData === "function") {
  window
    .loadSiteData()
    .then((vm) => {
      if (vm) {
        applySiteData(vm);
        render();
      }
    })
    .catch((error) => {
      // 取得失敗時は同梱データのまま表示を続ける（サイトは止めない）。
      console.warn("リモートデータの取得に失敗しました。同梱データで表示します。", error);
    });
}
