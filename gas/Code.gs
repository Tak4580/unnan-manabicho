/* =========================================================
   Code.gs — 公開サイト用データAPI（Phase 2）

   役割：Googleスプレッドシート（Articles / Courses / Settings / Images）を
         読み、フロントの data.js が期待する SOURCE と同じ形の JSON を返す。

   返す形（data.js の SOURCE と同一のトップレベルキー）:
   {
     settings:     { key: value, ... },
     courses:      [ { course_id, course_name, category, copy, description,
                       activity_months, icon_type, accent_color, accent_soft,
                       accent_ink, is_main_course, display_order, image }, ... ],
     articles:     [ { article_id, course_id, event_date, place, title, subtitle,
                       excerpt, body[], activity_items[], participant_voices[],
                       instructor_name, instructor_title, image }, ... ],
     recruitments: [ { article_id, course_id, title, excerpt, event_date,
                       application_deadline, time, place, fee, application_url }, ... ]
   }
   ※ seasonNotes は編集コンテンツのためAPIでは返さない（フロントの同梱値を使う）。

   デプロイ：
     1. スプレッドシートを開き、拡張機能 > Apps Script でこのコードを貼り付け。
     2. SPREADSHEET_ID を対象シートのIDに設定（同じスプレッドシートに紐づける
        場合は getActive() のままでよい）。
     3. デプロイ > 新しいデプロイ > 種類=ウェブアプリ。
        「次のユーザーとして実行=自分」「アクセスできるユーザー=全員」。
     4. 発行された /exec のURLを、index.html で
        <script>window.LEARNING_DATA_URL = "＜/exec のURL＞";</script>
        のように data.js より前で設定する（または data.js の DEFAULT_DATA_URL）。
   ========================================================= */

// 同一スプレッドシートに紐づける場合は空のまま。別ファイルなら ID を入れる。
var SPREADSHEET_ID = "";

function getBook_() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

// --- Web アプリのエントリポイント -----------------------------------------
// ?page=admin … 管理画面（Googleログイン必須）のHTMLを返す。
// それ以外  … 公開サイト用データ（JSON。?callback= でJSONP）を返す。
function doGet(e) {
  var page = e && e.parameter && e.parameter.page;
  if (page === "admin") {
    return HtmlService.createHtmlOutputFromFile("Admin")
      .setTitle("うんなん暮らしの学び帖 管理画面")
      .addMetaTag("viewport", "width=device-width, initial-scale=1")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
  }

  var data = getSiteData();
  var json = JSON.stringify(data);

  // JSONP（?callback=fn）にも対応。通常は素のJSONを返す。
  var callback = e && e.parameter && e.parameter.callback;
  if (callback && isSafeCallbackName_(callback)) {
    return ContentService
      .createTextOutput(callback + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function isSafeCallbackName_(name) {
  return /^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(String(name || ""));
}

// --- データ組み立て --------------------------------------------------------
function getSiteData() {
  return {
    settings: getSettings_(),
    courses: getCourses_(),
    articles: getArticlesByType_("report"),
    recruitments: getArticlesByType_("recruit")
  };
}

function getSettings_() {
  var rows = readSheet_("Settings");
  var settings = {};
  rows.forEach(function (r) {
    if (r.key) settings[String(r.key)] = r.value == null ? "" : String(r.value);
  });
  return settings;
}

function getCourses_() {
  return readSheet_("Courses")
    .filter(function (r) { return r.course_id; })
    .map(function (r) {
      return {
        course_id: str_(r.course_id),
        course_name: str_(r.course_name),
        category: str_(r.category),
        copy: str_(r.copy),
        description: str_(r.description),
        activity_months: str_(r.activity_months),
        icon_type: str_(r.icon_type),
        accent_color: str_(r.accent_color),
        accent_soft: str_(r.accent_soft),
        accent_ink: str_(r.accent_ink),
        is_main_course: bool_(r.is_main_course),
        display_order: num_(r.display_order),
        image: courseImage_(r)
      };
    })
    .sort(function (a, b) { return a.display_order - b.display_order; });
}

// post_type ごとに公開中の記事を返す。report / recruit で形を出し分ける。
function getArticlesByType_(type) {
  return readSheet_("Articles")
    .filter(function (r) {
      return str_(r.post_type) === type && r.course_id && isVisible_(r);
    })
    .map(function (r) {
      if (type === "recruit") {
        return {
          article_id: str_(r.article_id),
          course_id: str_(r.course_id),
          title: str_(r.title),
          excerpt: str_(r.excerpt),
          event_date: isoDate_(r.event_date),
          application_deadline: isoDate_(r.application_deadline),
          time: str_(r.event_time),
          place: str_(r.place),
          fee: str_(r.fee),
          application_url: str_(r.application_url)
        };
      }
      return {
        article_id: str_(r.article_id),
        course_id: str_(r.course_id),
        event_date: isoDate_(r.event_date),
        place: str_(r.place),
        title: str_(r.title),
        subtitle: str_(r.subtitle),
        excerpt: str_(r.excerpt),
        body: splitLines_(r.body),
        activity_items: activityItems_(r),
        participant_voices: voices_(r),
        instructor_name: str_(r.instructor_name),
        instructor_title: str_(r.instructor_title),
        image: articleImage_(r)
      };
    });
}

// --- 公開判定（docs/05）---------------------------------------------------
// published、または scheduled かつ publish_start_at <= 現在。
function isVisible_(r) {
  var status = str_(r.status);
  if (status === "published") return true;
  if (status === "scheduled") {
    var start = r.publish_start_at ? new Date(r.publish_start_at) : null;
    return start ? start.getTime() <= Date.now() : false;
  }
  return false;
}

// --- 画像の解決 ------------------------------------------------------------
// 写真パイプライン（後続フェーズ）までは、講座アセットにフォールバックする。
// Images/Drive を使う場合は main_image_file_id から公開URLを組み立てる。
function courseImage_(r) {
  if (r.image_path) return str_(r.image_path);
  return "assets/images/" + str_(r.course_id) + ".png";
}
function articleImage_(r) {
  if (r.main_image_file_id) return driveImageUrl_(str_(r.main_image_file_id));
  if (r.image_path) return str_(r.image_path);
  return "assets/images/" + str_(r.course_id) + ".png";
}
// Drive の画像を <img> で表示できるURL（Google CDN）。要 anyone-with-link 共有。
function driveImageUrl_(fileId) {
  return "https://lh3.googleusercontent.com/d/" + fileId;
}

// --- セル整形ヘルパー ------------------------------------------------------
function activityItems_(r) {
  var items = splitLines_(r.activity_items);
  return items.length ? items : splitLines_(r.menu_items);
}
function voices_(r) {
  var list = [];
  var main = str_(r.participant_voice_main);
  if (main) list.push(main);
  return list.concat(splitLines_(r.participant_voices));
}
function splitLines_(v) {
  if (v == null || v === "") return [];
  return String(v)
    .split(/\r?\n/)
    .map(function (s) { return s.trim(); })
    .filter(function (s) { return s.length > 0; });
}
function str_(v) { return v == null ? "" : String(v); }
function num_(v) { var n = Number(v); return isNaN(n) ? 0 : n; }
function bool_(v) {
  return v === true || String(v).toUpperCase() === "TRUE";
}
// 日付セルは Date でも文字列でも受け、YYYY-MM-DD に正規化する。
function isoDate_(v) {
  if (v == null || v === "") return "";
  if (Object.prototype.toString.call(v) === "[object Date]") {
    return Utilities.formatDate(v, "Asia/Tokyo", "yyyy-MM-dd");
  }
  return String(v);
}

// --- シート読み込み：1行目をヘッダーとしたオブジェクト配列に ---------------
function readSheet_(name) {
  var sheet = getBook_().getSheetByName(name);
  if (!sheet) return [];
  var values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    var empty = true;
    for (var c = 0; c < headers.length; c++) {
      if (!headers[c]) continue;
      var val = values[i][c];
      row[headers[c]] = val;
      if (val !== "" && val != null) empty = false;
    }
    if (!empty) { row.__rowIndex = i + 1; rows.push(row); } // __rowIndex はシート実行番号
  }
  return rows;
}

/* =========================================================
   管理画面（Phase 3）— 認証つきの読み書き
   - Admin.html から google.script.run で呼ぶ。
   - このスクリプトを「実行＝アクセスするユーザー」でデプロイすること。
   - 許可メールは スクリプトプロパティ ALLOWED_EDITORS（カンマ/改行区切り）。
   ========================================================= */

// --- 認証 ------------------------------------------------------------------
function currentEmail_() {
  var u = Session.getActiveUser();
  return (u && u.getEmail && u.getEmail()) || "";
}
function allowedEditors_() {
  var p = PropertiesService.getScriptProperties().getProperty("ALLOWED_EDITORS") || "";
  return p.split(/[,\n]/).map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
}
function assertStaff_() {
  var email = currentEmail_();
  var list = allowedEditors_();
  if (!list.length) {
    throw new Error("管理者メールが未設定です。Apps Script の「プロジェクトの設定 > スクリプト プロパティ」で ALLOWED_EDITORS に許可するGoogleアカウントのメールを設定してください。");
  }
  if (list.indexOf(email.toLowerCase()) < 0) {
    throw new Error("このアカウントには権限がありません（" + (email || "未ログイン") + "）。ALLOWED_EDITORS に登録されたアカウントでアクセスしてください。");
  }
  return email;
}

// --- 管理画面の初期データ --------------------------------------------------
function getAdminData() {
  var email = assertStaff_();
  var courses = readSheet_("Courses")
    .filter(function (r) { return r.course_id; })
    .map(function (r) {
      return {
        course_id: str_(r.course_id),
        course_name: str_(r.course_name),
        category: str_(r.category),
        accent_color: str_(r.accent_color),
        accent_soft: str_(r.accent_soft),
        accent_ink: str_(r.accent_ink),
        display_order: num_(r.display_order)
      };
    })
    .sort(function (a, b) { return a.display_order - b.display_order; });
  var articles = readSheet_("Articles").map(function (r) {
    return {
      article_id: str_(r.article_id),
      post_type: str_(r.post_type),
      course_id: str_(r.course_id),
      status: str_(r.status) || "draft",
      event_date: isoDate_(r.event_date),
      title: str_(r.title)
    };
  });
  // 開催日の新しい順
  articles.sort(function (a, b) { return String(b.event_date).localeCompare(String(a.event_date)); });
  return { email: email, courses: courses, articles: articles };
}

// 1件を編集用に取得（値は文字列に正規化）
function getArticle(articleId) {
  assertStaff_();
  var rows = readSheet_("Articles");
  for (var i = 0; i < rows.length; i++) {
    if (str_(rows[i].article_id) === String(articleId)) {
      var r = rows[i], out = {};
      Object.keys(r).forEach(function (k) {
        if (k === "__rowIndex") return;
        out[k] = (k === "event_date" || k === "application_deadline" || k === "publish_date")
          ? isoDate_(r[k]) : str_(r[k]);
      });
      return out;
    }
  }
  throw new Error("記事が見つかりません: " + articleId);
}

// --- 保存（下書き / 公開）--------------------------------------------------
// payload: フォーム値（snake_case）＋ intent: 'draft' | 'publish'
function saveArticle(payload) {
  var email = assertStaff_();
  payload = payload || {};
  var intent = payload.intent === "publish" ? "publish" : "draft";

  // 基本の必須
  requireFields_(payload, ["post_type", "course_id", "title"]);
  if (intent === "publish") {
    requireFields_(payload, ["event_date"]);
    if (payload.post_type === "recruit") {
      requireFields_(payload, ["application_deadline", "event_time", "place"]);
    }
    if (payload.post_type === "report" && !str_(payload.body) && !str_(payload.content_memo)) {
      throw new Error("公開には本文または内容メモが必要です。");
    }
    if (!str_(payload.image_path) && !str_(payload.main_image_file_id)) {
      throw new Error("公開には写真が1枚以上必要です。");
    }
    if (!(bool_(payload.photo_confirmed) && bool_(payload.privacy_confirmed) && bool_(payload.permission_confirmed))) {
      throw new Error("公開前チェック3点すべての確認が必要です。");
    }
  }

  var sheet = getBook_().getSheetByName("Articles");
  if (!sheet) throw new Error("Articles シートがありません。");

  var now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd'T'HH:mm:ssZ");

  // 書き込む列（ホワイトリスト）
  var writable = ["post_type", "course_id", "event_date", "event_time", "place", "title",
    "subtitle", "excerpt", "body", "activity_items", "menu_items", "participant_voice_main",
    "participant_voices", "instructor_name", "instructor_title", "instructor_instagram_url",
    "content_memo", "instagram_caption", "hashtags", "application_deadline", "application_url",
    "fee", "image_path", "main_image_file_id"];
  var values = {};
  writable.forEach(function (k) { if (payload[k] != null) values[k] = String(payload[k]); });

  // サーバーが決める値
  values.status = intent === "publish" ? "published" : "draft";
  values.updated_by = email;
  values.updated_at = now;
  if (intent === "publish") {
    values.photo_confirmed = "TRUE";
    values.privacy_confirmed = "TRUE";
    values.permission_confirmed = "TRUE";
    if (!str_(payload.publish_date)) values.publish_date = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd");
  }

  var articleId = str_(payload.article_id);
  var rowIndex = articleId ? findRowIndex_(sheet, "article_id", articleId) : 0;

  if (!rowIndex) {
    // 新規
    articleId = articleId || generateArticleId_(sheet);
    values.article_id = articleId;
    values.created_by = email;
    values.created_at = now;
    rowIndex = appendRow_(sheet);
  }

  writeCells_(sheet, rowIndex, values);
  SpreadsheetApp.flush();
  return { ok: true, article_id: articleId, status: values.status };
}

function requireFields_(payload, keys) {
  keys.forEach(function (k) {
    if (!str_(payload[k]).trim()) throw new Error("必須項目が未入力です: " + k);
  });
}

// --- 記事の状態変更・削除 ---------------------------------------------------
// 公開中の記事を下書きに戻す／下書きを公開に戻すなど、statusだけを切り替える。
function setArticleStatus(articleId, status) {
  var email = assertStaff_();
  status = String(status);
  if (status !== "draft" && status !== "published") {
    throw new Error("不正なステータスです: " + status);
  }
  var sheet = getBook_().getSheetByName("Articles");
  if (!sheet) throw new Error("Articles シートがありません。");
  var rowIndex = findRowIndex_(sheet, "article_id", articleId);
  if (!rowIndex) throw new Error("記事が見つかりません: " + articleId);
  var now = Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd'T'HH:mm:ssZ");
  writeCells_(sheet, rowIndex, { status: status, updated_by: email, updated_at: now });
  SpreadsheetApp.flush();
  return { ok: true, article_id: String(articleId), status: status };
}

// 記事の行そのものを削除する（元に戻せないので管理画面側で確認してから呼ぶ）。
function deleteArticle(articleId) {
  assertStaff_();
  var sheet = getBook_().getSheetByName("Articles");
  if (!sheet) throw new Error("Articles シートがありません。");
  var rowIndex = findRowIndex_(sheet, "article_id", articleId);
  if (!rowIndex) throw new Error("記事が見つかりません: " + articleId);
  sheet.deleteRow(rowIndex);
  SpreadsheetApp.flush();
  return { ok: true, article_id: String(articleId) };
}

// --- サイト設定の編集 -------------------------------------------------------
function getSettingsAdmin() {
  assertStaff_();
  return readSheet_("Settings")
    .filter(function (r) { return r.key; })
    .map(function (r) { return { key: str_(r.key), value: str_(r.value) }; });
}

// entries: [{key, value}] 既存キーは値を更新、無いキーは行を追加する。
function saveSettings(entries) {
  assertStaff_();
  var sheet = getBook_().getSheetByName("Settings");
  if (!sheet) throw new Error("Settings シートがありません。");
  (entries || []).forEach(function (e) {
    if (!e || !str_(e.key).trim()) return;
    var rowIndex = findRowIndex_(sheet, "key", e.key) || appendRow_(sheet);
    writeCells_(sheet, rowIndex, { key: str_(e.key), value: str_(e.value) });
  });
  SpreadsheetApp.flush();
  return { ok: true };
}

// --- 講座の編集 -------------------------------------------------------------
var COURSE_COLUMNS = ["course_id", "course_name", "category", "copy", "description",
  "activity_months", "icon_type", "accent_color", "accent_soft", "accent_ink",
  "is_main_course", "display_order", "image_path"];

function getCoursesAdmin() {
  assertStaff_();
  return readSheet_("Courses")
    .filter(function (r) { return r.course_id; })
    .map(function (r) {
      var out = {};
      COURSE_COLUMNS.forEach(function (k) { out[k] = str_(r[k]); });
      return out;
    })
    .sort(function (a, b) { return num_(a.display_order) - num_(b.display_order); });
}

// course_id が既存なら更新、新しければ行を追加する。
function saveCourse(payload) {
  assertStaff_();
  payload = payload || {};
  requireFields_(payload, ["course_id", "course_name"]);
  if (!/^[a-z0-9_-]+$/.test(str_(payload.course_id))) {
    throw new Error("講座IDは半角英数字・ハイフン・アンダースコアで入力してください。");
  }
  var sheet = getBook_().getSheetByName("Courses");
  if (!sheet) throw new Error("Courses シートがありません。");
  var values = {};
  COURSE_COLUMNS.forEach(function (k) { if (payload[k] != null) values[k] = String(payload[k]); });
  var rowIndex = findRowIndex_(sheet, "course_id", payload.course_id) || appendRow_(sheet);
  writeCells_(sheet, rowIndex, values);
  SpreadsheetApp.flush();
  return { ok: true, course_id: str_(payload.course_id) };
}

// --- シート書き込みヘルパー ------------------------------------------------
function headers_(sheet) {
  return sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0]
    .map(function (h) { return String(h).trim(); });
}
function ensureColumns_(sheet, names) {
  var headers = headers_(sheet);
  var missing = names.filter(function (n) { return headers.indexOf(n) < 0; });
  if (missing.length) {
    sheet.getRange(1, headers.length + 1, 1, missing.length).setValues([missing]);
    headers = headers.concat(missing);
  }
  return headers;
}
function findRowIndex_(sheet, colName, value) {
  var headers = headers_(sheet);
  var col = headers.indexOf(colName);
  if (col < 0) return 0;
  var last = sheet.getLastRow();
  if (last < 2) return 0;
  var vals = sheet.getRange(2, col + 1, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === String(value)) return i + 2; // シート実行番号
  }
  return 0;
}
function appendRow_(sheet) {
  return sheet.getLastRow() + 1;
}
function writeCells_(sheet, rowIndex, valueMap) {
  var headers = ensureColumns_(sheet, Object.keys(valueMap));
  Object.keys(valueMap).forEach(function (k) {
    var col = headers.indexOf(k);
    if (col >= 0) sheet.getRange(rowIndex, col + 1).setValue(valueMap[k]);
  });
}
function generateArticleId_(sheet) {
  var headers = headers_(sheet);
  var col = headers.indexOf("article_id");
  var max = 0;
  if (col >= 0 && sheet.getLastRow() >= 2) {
    var vals = sheet.getRange(2, col + 1, sheet.getLastRow() - 1, 1).getValues();
    vals.forEach(function (v) {
      var m = String(v[0]).match(/(\d+)\s*$/);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
  }
  var n = String(max + 1);
  while (n.length < 4) n = "0" + n;
  return "article_" + n;
}

/* =========================================================
   Google Drive のフォルダ構成
   「うんなん暮らしの学び帖」に関して Drive につくるものは、すべて
   Drive直下の「うんなん暮らしの学び帖」フォルダの中に入れる。
   写真・バックアップ・エクスポート・スプレッドシート本体も含む。
   ========================================================= */

var DRIVE_ROOT_NAME = "うんなん暮らしの学び帖";

// 親フォルダ配下の同名フォルダを取得。なければ作る。
function getOrCreateChildFolder_(parent, name) {
  var it = parent.getFoldersByName(name);
  return it.hasNext() ? it.next() : parent.createFolder(name);
}

// Drive直下の「うんなん暮らしの学び帖」ルートフォルダ（get-or-create）。
function getRootFolder_() {
  var it = DriveApp.getFoldersByName(DRIVE_ROOT_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(DRIVE_ROOT_NAME);
}

// ルート配下の階層フォルダを get-or-create。例: getFolder_(["images","reports"])
function getFolder_(pathParts) {
  var folder = getRootFolder_();
  (pathParts || []).forEach(function (name) {
    folder = getOrCreateChildFolder_(folder, name);
  });
  return folder;
}

// このスクリプトが Drive につくるファイルを、必ずルートフォルダ配下の
// 指定パスへ入れ直すためのヘルパー。作成直後の file を渡す。
function moveFileToFolder_(file, pathParts) {
  var dest = getFolder_(pathParts);
  dest.addFile(file);
  var parents = file.getParents();
  while (parents.hasNext()) {
    var p = parents.next();
    if (p.getId() !== dest.getId()) p.removeFile(file);
  }
  return file;
}

// 初期化：フォルダ構成を作り、スプレッドシート本体もルート配下へ移す。
// Apps Script エディタから1回だけ手動実行する（要 Drive 認可）。
function setupDriveFolders() {
  var root = getRootFolder_();
  ["images/reports", "images/courses", "images/thumbnails", "backups", "exports"]
    .forEach(function (p) { getFolder_(p.split("/")); });

  // 紐づくスプレッドシートもルートフォルダの中へ入れる。
  try {
    var file = DriveApp.getFileById(getBook_().getId());
    moveFileToFolder_(file, []); // ルート直下へ
  } catch (e) {
    // スプレッドシートIDが取れない/権限外のときは移動をスキップ。
  }
  return root.getUrl();
}

// --- 写真アップロード（管理画面から）--------------------------------------
// payload: { filename, mimeType, dataBase64 }
// 「うんなん暮らしの学び帖 / images / reports」配下に保存し、
// anyone-with-link 共有にして、file_id と表示URLを返す。
// ※ 管理画面は「アクセスユーザーとして実行」のため、実行者（＝運用者）の
//   Drive に保存される。運用者がオーナーなら中央フォルダに集約される。
function uploadPhoto(payload) {
  assertStaff_();
  payload = payload || {};
  if (!payload.dataBase64) throw new Error("画像データがありません。");
  var bytes = Utilities.base64Decode(payload.dataBase64);
  var blob = Utilities.newBlob(bytes, payload.mimeType || "image/jpeg", payload.filename || "photo.jpg");
  var folder = getFolder_(["images", "reports"]);
  var file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (e) {
    // 共有設定に失敗しても保存は続行（後で手動共有できる）。
  }
  return { file_id: file.getId(), url: driveImageUrl_(file.getId()), name: file.getName() };
}
