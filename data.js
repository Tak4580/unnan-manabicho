/* =========================================================
   data.js — サイトのデータ層（Phase 1: データ分離）

   ・SOURCE … スプレッドシート設計（docs/05_spreadsheet_schema.md）に
              沿った素データ。将来は GAS が Sheets から同じ形の JSON を
              返すようにし、ここを fetch() に差し替えるだけで済む。
   ・toViewModel() … SOURCE を app.js が使う表示用モデルへ変換する。
                     令和表記・短縮日付・講師名の整形などはここで行う。

   app.js は window.LearningData を読むだけ（描画ロジックは一切変えない）。
   ========================================================= */
(function () {
  "use strict";

  // 画像は試作段階ではローカルアセット。将来は Drive の file_id に置き換える。
  const images = {
    cooking: "assets/images/cooking.png",
    karin: "assets/images/karin.png",
    agri: "assets/images/agri.png",
    baby: "assets/images/baby.png",
    yoga: "assets/images/yoga.png"
  };

  // --- 素データ（スキーマ準拠） -------------------------------------------
  const SOURCE = {
    // Settings シート相当
    settings: {
      organization_name: "JAしまね雲南地区本部",
      site_name: "うんなん暮らしの学び帖",
      site_introduction: "JAでひらく、講座と活動の記録。",
      top_copy: "食べて、つくって、話して。\n暮らしを少し楽しく。",
      site_description: "料理教室、JA女性大学、親子体験、赤ちゃん食堂など。\n雲南の暮らしに寄り添う小さな活動を、写真とことばで記録しています。",
      instagram_url: "https://www.instagram.com/",
      contact_department: "ふれあい課",
      contact_tel: "0854-xx-xxxx",
      contact_hours: "平日 9:00から17:00",
      contact_instagram_note: "日々の活動はInstagramでもお知らせします。"
    },

    // Courses シート相当
    courses: [
      { course_id: "cooking", course_name: "おしゃべりクッキング", category: "暮らしのキッチン", copy: "食べて、話して、暮らしを楽しむ料理教室。", description: "季節の食材を使った料理を囲みながら、楽しく学び合う時間です。", activity_months: "5月・7月・9月・10月ごろ", icon_type: "bowl", accent_color: "#c9824a", accent_soft: "#f5e4d5", accent_ink: "#9f5f35", is_main_course: true, display_order: 1, image: images.cooking },
      { course_id: "karin", course_name: "華凜", category: "暮らしの花", copy: "学びと交流を重ねる、大人の女性のための時間。", description: "料理、手芸、ものづくり、健康教室、日帰り旅行など。暮らしを楽しむ学びを、同じ仲間と重ねています。", activity_months: "10月・12月・1月・4月・6月ごろ", icon_type: "flower", accent_color: "#b9788e", accent_soft: "#f4e4e9", accent_ink: "#965f72", is_main_course: true, display_order: 2, image: images.karin },
      { course_id: "agri", course_name: "アグリスクール", category: "アグリスタイル", copy: "親子で食と農にふれる、わくわく体験教室。", description: "料理や体験を通して、食べものや地域の農に親子でふれる時間です。", activity_months: "6月・8月ごろ", icon_type: "leaf", accent_color: "#7f9b73", accent_soft: "#e8efe3", accent_ink: "#5e7a55", is_main_course: true, display_order: 3, image: images.agri },
      { course_id: "baby", course_name: "赤ちゃん食堂", category: "食育", copy: "赤ちゃんと保護者が、ほっとできる食と交流の場。", description: "あたたかい食事と交流を通して、子育て中のひとときに寄り添います。", activity_months: "8月・12月ごろ", icon_type: "bowl", accent_color: "#d6b766", accent_soft: "#f6edcf", accent_ink: "#9f8140", is_main_course: true, display_order: 4, image: images.baby },
      { course_id: "yoga", course_name: "ヨガ講座", category: "心とからだ", copy: "からだをゆるめて、心を整えるやさしい時間。", description: "無理なくからだを動かしながら、日々の暮らしを少し軽やかにする講座です。", activity_months: "2か月に1回程度", icon_type: "moon", accent_color: "#7fa8a0", accent_soft: "#e4efed", accent_ink: "#5d827b", is_main_course: false, display_order: 5, image: images.yoga }
    ],

    // Articles シート相当（post_type = report）
    articles: [
      {
        article_id: "report-001", post_type: "report", course_id: "karin",
        event_date: "2026-01-27", place: "雲南市 木次町",
        title: "からだ想いのやさしい食事 手軽に簡単！発酵食品の魅力",
        subtitle: "発酵食品を、毎日の食卓へ",
        excerpt: "味噌やヨーグルト、塩麹など、身近な発酵食品を使いながら、からだにやさしい食事づくりを学びました。",
        body: [
          "この日は、発酵食品をテーマにした料理教室を開催しました。味噌やヨーグルト、塩麹など、身近な発酵食品を使いながら、からだにやさしい食事づくりを学びました。",
          "参加者同士で声をかけ合いながら調理を進め、会場にはあたたかな雰囲気が広がりました。できあがった料理を囲む時間も、講座の大切な楽しみです。"
        ],
        activity_items: ["味噌とヨーグルトで和風炊き込みご飯", "ヨーグルト味噌汁", "鶏肉の塩麹焼き", "混ぜるだけちぎりパン"],
        participant_voices: ["ヨーグルトの新しい利用法がすごく勉強になりました。", "みんなで手際よく作るので、豪華な食事になり幸せな気分になります。"],
        instructor_name: "飯塚生美子", instructor_title: "島根県家の光講師",
        image: images.cooking
      },
      {
        article_id: "report-002", post_type: "report", course_id: "karin",
        event_date: "2025-12-10", place: "雲南市 三刀屋町",
        title: "ふわふわあたたか 羊毛フェルトでうま作り",
        subtitle: "手のひらに残る、冬の手しごと",
        excerpt: "干支の「うま」をテーマに、ほっこり癒される作品作りに挑戦しました。",
        body: ["羊毛を少しずつ重ねながら、干支の飾りを作りました。手を動かす時間の中で会話も生まれ、穏やかな冬の講座になりました。"],
        activity_items: ["羊毛フェルトの基本", "干支飾りの制作", "作品の撮影と交流"],
        participant_voices: ["家でも続けて作ってみたくなりました。"],
        instructor_name: "", instructor_title: "手しごと講師",
        image: images.karin
      },
      {
        article_id: "report-003", post_type: "report", course_id: "agri",
        event_date: "2025-08-20", place: "雲南市 掛合町",
        title: "親子で畑へ 夏野菜にふれる体験教室",
        subtitle: "土にふれる、夏の学び",
        excerpt: "土にふれながら、食べものが育つ楽しさを親子で感じました。",
        body: ["親子で畑に入り、夏野菜の収穫や観察を行いました。育つ過程を知ることで、食卓に並ぶ野菜へのまなざしも少し変わります。"],
        activity_items: ["畑の見学", "夏野菜の観察", "食と農のお話"],
        participant_voices: ["子どもと一緒に土にふれる時間が楽しかったです。"],
        instructor_name: "", instructor_title: "JA営農担当",
        image: images.agri
      },
      {
        article_id: "report-004", post_type: "report", course_id: "baby",
        event_date: "2025-08-08", place: "雲南市 大東町",
        title: "赤ちゃんと保護者がほっとする食の時間",
        subtitle: "やさしいごはんと、短い休息",
        excerpt: "やさしい食事と会話で、あたたかな交流の場になりました。",
        body: ["赤ちゃんと保護者が安心して過ごせるよう、やさしい味つけの食事と交流の時間を用意しました。短い時間でも、気持ちがふっとゆるむ場を目指しています。"],
        activity_items: ["やさしいごはんの提供", "参加者同士の交流", "子育ての情報交換"],
        participant_voices: ["同じように子育てをしている方と話せて、少し気持ちが楽になりました。"],
        instructor_name: "", instructor_title: "ふれあい課スタッフ",
        image: images.baby
      },
      {
        article_id: "report-005", post_type: "report", course_id: "yoga",
        event_date: "2025-07-18", place: "雲南市 加茂町",
        title: "からだをゆるめて呼吸を整えるヨガ講座",
        subtitle: "自分に戻る、静かな時間",
        excerpt: "静かな会場で、日々の疲れをほどく時間を過ごしました。",
        body: ["ゆったりとした呼吸に合わせて、無理のない動きでからだを整えました。はじめての方も参加しやすい、やさしいヨガの時間です。"],
        activity_items: ["呼吸を整える練習", "肩まわりをほぐす動き", "短いリラックスタイム"],
        participant_voices: ["終わったあと、体が軽くなったように感じました。"],
        instructor_name: "", instructor_title: "ヨガ講師",
        image: images.yoga
      }
    ],

    // Articles シート相当（post_type = recruit）
    recruitments: [
      {
        article_id: "recruit-001", course_id: "cooking",
        title: "おしゃべりクッキング 9月講座",
        excerpt: "季節の野菜を使った料理教室を開催します。初めての方も参加しやすい、あたたかな雰囲気の講座です。",
        event_date: "2026-09-20", application_deadline: "2026-09-10",
        time: "10:00から13:00", place: "JAしまね雲南地区本部", fee: "1,000円",
        application_url: ""
      }
    ],

    // 季節の活動（表示専用。シート化はしていない）
    seasonNotes: [
      { season: "春", title: "春の台所と手しごと", text: "山菜や春野菜、花しごとなど、暮らしが少し明るくなる学びを。", icon: "flower" },
      { season: "夏", title: "親子でふれる食と農", text: "畑や地元食材を通して、作る楽しさ、食べる喜びに出会います。", icon: "sprout" },
      { season: "秋", title: "実りを味わう時間", text: "旬の恵みを食卓に取り入れ、季節を楽しむ講座を開きます。", icon: "leaf" },
      { season: "冬", title: "あたたかな食卓と手仕事", text: "発酵食品やものづくりなど、冬の暮らしをやさしく整える時間を。", icon: "pot" }
    ]
  };

  // --- 日付・講師名の整形ヘルパー ------------------------------------------
  // 令和 = 西暦 - 2018（2019年5月以降）。試作データはすべて令和のみ想定。
  function reiwaParts(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    if (!y || !m || !d) return null;
    return { ry: y - 2018, m, d };
  }
  function reiwaLong(iso) {
    const parts = reiwaParts(iso);
    if (!parts) return "";
    const { ry, m, d } = parts;
    return `令和${ry}年${m}月${d}日`;
  }
  function reiwaShort(iso) {
    const parts = reiwaParts(iso);
    if (!parts) return "";
    const { ry, m, d } = parts;
    return `R${ry}/${m}/${d}`;
  }
  // 講師表示：氏名があれば「肩書き 氏名先生」、なければ肩書きのみ。
  function formatInstructor(name, title) {
    return name ? `${title} ${name}先生` : title;
  }

  // --- 変換：素データ → 表示用モデル ---------------------------------------
  function toViewModel(src) {
    src = src || {};
    const s = Object.assign({}, SOURCE.settings, src.settings);
    const sourceCourses = Array.isArray(src.courses) && src.courses.length ? src.courses : SOURCE.courses;
    const sourceArticles = Array.isArray(src.articles) ? src.articles : SOURCE.articles;
    const sourceRecruitments = Array.isArray(src.recruitments) ? src.recruitments : SOURCE.recruitments;
    const sourceSeasonNotes = Array.isArray(src.seasonNotes) ? src.seasonNotes : SOURCE.seasonNotes;

    const site = {
      organization: s.organization_name,
      name: s.site_name,
      introduction: s.site_introduction,
      lead: s.top_copy,
      description: s.site_description,
      instagramUrl: s.instagram_url
    };

    const contactInfo = {
      organization: s.organization_name,
      department: s.contact_department,
      tel: s.contact_tel,
      hours: s.contact_hours,
      instagramNote: s.contact_instagram_note
    };

    const courses = sourceCourses
      .slice()
      .sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0))
      .map((c) => ({
        id: c.course_id,
        name: c.course_name,
        category: c.category,
        copy: c.copy,
        description: c.description,
        months: c.activity_months,
        icon: c.icon_type,
        color: c.accent_color,
        soft: c.accent_soft,
        ink: c.accent_ink,
        image: c.image
      }));

    const reports = sourceArticles
      .filter((a) => a && a.article_id && a.course_id)
      .map((a) => ({
        id: a.article_id,
        courseId: a.course_id,
        eventDate: a.event_date,
        date: reiwaLong(a.event_date),
        shortDate: reiwaShort(a.event_date),
        title: a.title,
        subtitle: a.subtitle,
        excerpt: a.excerpt,
        body: Array.isArray(a.body) ? a.body : String(a.body || "").split(/\r?\n/).filter(Boolean),
        activityItems: Array.isArray(a.activity_items) ? a.activity_items : String(a.activity_items || "").split(/\r?\n/).filter(Boolean),
        voices: Array.isArray(a.participant_voices) ? a.participant_voices : String(a.participant_voices || "").split(/\r?\n/).filter(Boolean),
        instructor: formatInstructor(a.instructor_name, a.instructor_title),
        image: a.image,
        place: a.place
      }))
      .sort((a, b) => String(b.eventDate || "").localeCompare(String(a.eventDate || "")));

    const r = sourceRecruitments.find((item) => item && item.article_id && item.course_id) || null;
    const recruitment = r ? {
      id: r.article_id,
      courseId: r.course_id,
      title: r.title,
      excerpt: r.excerpt,
      eventDate: r.event_date ? reiwaLong(r.event_date) : "",
      deadline: r.application_deadline ? reiwaLong(r.application_deadline) : "",
      deadlineDate: r.application_deadline,
      time: r.time,
      place: r.place,
      fee: r.fee,
      formUrl: r.application_url
    } : null;

    return {
      site,
      contactInfo,
      courses,
      reports,
      recruitment,
      seasonNotes: sourceSeasonNotes
    };
  }

  const data = toViewModel(SOURCE);
  data.SOURCE = SOURCE; // 素データも公開（デバッグ・将来のGAS差し替え用）

  // --- リモート取得（Phase 2: 公開サイトの fetch 化） ----------------------
  // GAS Web アプリのURLを設定すると、そこから SOURCE と同じ形の JSON を取得し、
  // 同梱データを差し替える。未設定なら同梱データ（上記 SOURCE）のまま動く。
  // URLは index.html で window.LEARNING_DATA_URL = "..." と指定してもよいし、
  // 下の既定値を書き換えてもよい。
  const DEFAULT_DATA_URL = "";

  // GAS からの JSON（SOURCE と同じトップレベルキー）を表示用モデルへ。
  // 欠けたキーは同梱 SOURCE で補完するので、部分的な JSON でも壊れない。
  function withCallbackParam(url, callbackName) {
    const separator = url.indexOf("?") >= 0 ? "&" : "?";
    return url + separator + "callback=" + encodeURIComponent(callbackName);
  }

  function loadJsonp(url) {
    return new Promise(function (resolve, reject) {
      const callbackName = "__learningDataJsonp_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      const script = document.createElement("script");
      let done = false;

      window[callbackName] = function (payload) {
        done = true;
        cleanup();
        resolve(payload);
      };

      function cleanup() {
        delete window[callbackName];
        script.remove();
      }

      script.src = withCallbackParam(url, callbackName);
      script.async = true;
      script.onerror = function () {
        if (done) return;
        cleanup();
        reject(new Error("data jsonp failed"));
      };

      document.head.appendChild(script);
      window.setTimeout(function () {
        if (done) return;
        cleanup();
        reject(new Error("data jsonp timeout"));
      }, 12000);
    });
  }

  async function loadRemoteSource(url) {
    try {
      const res = await fetch(url, { method: "GET", credentials: "omit" });
      if (!res.ok) throw new Error("data fetch failed: HTTP " + res.status);
      return await res.json();
    } catch (error) {
      if (typeof document === "undefined") throw error;
      return loadJsonp(url);
    }
  }

  async function loadSiteData() {
    const url =
      (typeof window !== "undefined" && window.LEARNING_DATA_URL) ||
      DEFAULT_DATA_URL;
    if (!url) return null; // リモート未設定なら何もしない（同梱データを使う）

    const remote = await loadRemoteSource(url) || {};
    const merged = {
      settings: Object.assign({}, SOURCE.settings, remote.settings),
      courses: Array.isArray(remote.courses) && remote.courses.length ? remote.courses : SOURCE.courses,
      articles: Array.isArray(remote.articles) ? remote.articles : SOURCE.articles,
      recruitments: Array.isArray(remote.recruitments) ? remote.recruitments : SOURCE.recruitments,
      seasonNotes: remote.seasonNotes || SOURCE.seasonNotes
    };
    return toViewModel(merged);
  }

  if (typeof window !== "undefined") {
    window.LearningData = data;
    window.loadSiteData = loadSiteData;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { data: data, loadSiteData: loadSiteData, toViewModel: toViewModel, SOURCE: SOURCE };
  }
})();
