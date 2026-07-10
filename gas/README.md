# GAS データAPI（Phase 2）

公開サイトに本物のデータを供給するための、Google Apps Script（GAS）ウェブアプリです。
`Code.gs` が Googleスプレッドシートを読み、フロントの `data.js` が期待するのと
同じ形（`SOURCE`）の JSON を返します。フロント側は `window.loadSiteData()` で
これを取得し、同梱サンプルデータと差し替えて再描画します。

## ファイル

- `Code.gs` … `doGet` でデータJSONを返す／`?page=admin` で管理画面を返す本体。
  記事の読み書き（`getAdminData` / `getArticle` / `saveArticle`）と認証もここ。
- `Admin.html` … 管理画面（GAS配信・Googleログイン必須）。`google.script.run` で `Code.gs` を呼ぶ。
- `sheets/Settings.csv` / `sheets/Courses.csv` / `sheets/Articles.csv`
  … スプレッドシートに取り込むためのひな形（現在のサンプルデータ入り）

## セットアップ手順

1. **スプレッドシートを用意**
   新規Googleスプレッドシートを作成し、シートを3つ用意して
   `Settings` / `Courses` / `Articles` と命名する。
   （写真パイプライン導入時に `Images` シートを追加する。）

2. **ひな形を取り込む**
   各シートで「ファイル > インポート > アップロード」から対応するCSVを選び、
   「現在のシートを置き換える」で取り込む。1行目がヘッダーになる。

3. **Apps Script にコードを貼る**
   スプレッドシートで「拡張機能 > Apps Script」を開き、`Code.gs` の内容を貼り付ける。
   同じスプレッドシートに紐づけるので `SPREADSHEET_ID` は空のままでよい。

4. **ウェブアプリとしてデプロイ**
   「デプロイ > 新しいデプロイ > 種類＝ウェブアプリ」。
   - 次のユーザーとして実行：**自分**
   - アクセスできるユーザー：**全員**
   発行された `.../exec` のURLを控える。

5. **フロントに接続**
   `index.html` の data.js 読み込み前にあるコメントを外し、URLを設定する：
   ```html
   <script>window.LEARNING_DATA_URL = "＜/exec のURL＞";</script>
   ```
   これで公開サイトはGAS経由のデータで表示される。未設定なら同梱データのまま動く。

## 返すJSONの形

`data.js` の `SOURCE` と同じトップレベルキー：

```json
{
  "settings": { "site_name": "…", "top_copy": "…", "contact_tel": "…" },
  "courses": [ { "course_id": "cooking", "course_name": "…", "accent_color": "#c9824a" } ],
  "articles": [ { "article_id": "report-001", "course_id": "karin", "event_date": "2026-01-27",
                  "title": "…", "body": ["…"], "activity_items": ["…"],
                  "participant_voices": ["…"], "instructor_name": "…", "instructor_title": "…" } ],
  "recruitments": [ { "article_id": "recruit-001", "course_id": "cooking",
                      "event_date": "2026-09-20", "application_deadline": "2026-09-10",
                      "time": "…", "fee": "…", "application_url": "…" } ]
}
```

`seasonNotes`（季節の活動）は編集コンテンツのためAPIでは返さず、フロント同梱値を使う。

## Articles シートの補足列（Phase 2で追加）

現行プロトタイプの表示に合わせ、`docs/05_spreadsheet_schema.md` の基本列に加えて
以下を使う。

- `event_time` … 募集の開催時間（例：10:00から13:00）
- `fee` … 募集の参加費（例：1,000円）
- `image_path` … 写真を Drive に載せる前の暫定画像パス（例：assets/images/karin.png）

写真パイプライン導入後は、`main_image_file_id`（Drive）を優先し、`image_path` は
フォールバックとして扱う。`image_path` も無ければ講座アセット
`assets/images/{course_id}.png` にフォールバックする。

## CORS について

ウェブアプリを「全員」で公開した場合、別オリジン（GitHub Pages 等）からの
単純GET取得は通常成功する。もしCORSで弾かれる場合は、
`?callback=関数名` を付けるJSONP形式にも対応しているので、そちらで取得する。
初期段階のように公開サイト自体をGASのHTMLで配信するなら同一オリジンで問題ない。

---

# 管理画面（Phase 3）

`Code.gs` に、記事を作成・編集してスプレッドシートに書き込む管理画面
（`Admin.html`）と、その認証を追加した。書き込みは **Googleログインした
許可ユーザーだけ** に制限する。

## なぜデプロイを2つに分けるか

- **公開データAPI**（Phase 2）は「実行＝自分／アクセス＝全員」で、
  誰でも匿名で読める必要がある。
- **管理画面**は「実行＝アクセスするユーザー／アクセス＝全員（Googleアカウント）」
  にして初めて、`Session.getActiveUser()` でログイン中の職員メールが取れる。

この2つは同じデプロイでは両立しない（後者は必ずログインを要求するため）。
そこで **同じスクリプトのまま、デプロイを2種類** つくる。`doGet` が
`?page=admin` の有無で管理画面HTMLとデータJSONを出し分ける。

## 管理画面のデプロイ手順

1. **許可メールを設定**
   Apps Script の「プロジェクトの設定（歯車）> スクリプト プロパティ」で
   `ALLOWED_EDITORS` を追加し、管理できるGoogleアカウントのメールを
   カンマ区切りで入れる（例：`admin@example.com, staff@example.com`）。
   未設定だと管理画面は誰も使えない（安全側）。

2. **2つ目のデプロイを作成**
   「デプロイ > 新しいデプロイ > 種類＝ウェブアプリ」。
   - 次のユーザーとして実行：**アクセスしているユーザー**
   - アクセスできるユーザー：**Googleアカウントを持つ全員**
   発行された `/exec` URLの末尾に `?page=admin` を付けたものが管理画面URL。
   例：`https://script.google.com/macros/s/＜ID＞/exec?page=admin`

3. **職員に配布**
   このURLを開くとGoogleログイン → 許可メールなら管理画面、
   そうでなければ「権限がありません」と表示される。

※ 公開データAPI（Phase 2）のデプロイはそのまま残す。コードを更新したら、
   両方のデプロイを「デプロイを管理 > 編集 > 新バージョン」で更新する。

## Drive フォルダ（うんなん暮らしの学び帖）

「うんなん暮らしの学び帖」に関して Drive につくるものは、すべて Drive 直下の
**「うんなん暮らしの学び帖」フォルダの中**に入れる（写真・サムネイル・バックアップ・
エクスポート・スプレッドシート本体も含む）。

初期化は、Apps Script エディタで関数 `setupDriveFolders` を一度だけ実行する：

1. エディタ上部の関数選択で `setupDriveFolders` を選び「実行」。
2. 初回は Drive へのアクセス認可を求められる → 許可。
3. これで次の構成ができ、**スプレッドシート本体もこのフォルダの中へ移動**する。

```text
うんなん暮らしの学び帖
├─ （スプレッドシート本体）
├─ images/reports, images/courses, images/thumbnails
├─ backups
└─ exports
```

以後、GAS がつくるファイルは `getFolder_(["images","reports"])` のように
このルート配下へ入れる（写真保存の次段でここを使う）。

## できること（現時点）

- 記事一覧の表示（下書き含む）／新規作成・既存編集
  ＋ **絞り込み**（公開/下書き・投稿タイプ・タイトル検索）
- 活動レポート／募集案内／お知らせの入力
- **下書き保存**（公開サイトには出ない）
- **写真アップロード**（メイン1枚）。ブラウザ側で長辺1600pxに縮小 →
  `うんなん暮らしの学び帖/images/reports` に保存 → anyone-with-link 共有にして
  `main_image_file_id` を記事に記録。公開サイトは Google CDN（lh3）経由で表示。
- **公開**（必須項目＋写真＋公開前チェック3点が揃わないと押せない・保存もエラー）
- **プレビュー**（保存前に、公開ページに近い見た目を管理画面内で確認できる）
- **非公開に戻す**（published → draft）・**削除**（確認ダイアログつき）・
  **複製して新規**（既存記事をひな形に新しい記事をつくる）
- **講座タブ**：講座の追加・編集（名前・カテゴリ・説明・アクセント色・表示順など）。
  講座IDは記事と紐づくため既存講座では変更不可。削除はシートから直接行う。
- **サイト設定タブ**：Settings シートの文言（キャッチコピー・問い合わせ先など）を編集
- 保存内容はスプレッドシートの各シートに書き込まれ、
  公開データAPIを通してそのまま公開サイトに反映される

対応する `Code.gs` の関数：`getAdminData` / `getArticle` / `saveArticle` /
`setArticleStatus` / `deleteArticle` / `getSettingsAdmin` / `saveSettings` /
`getCoursesAdmin` / `saveCourse` / `uploadPhoto`

※ 写真は「管理画面を操作した人」の Drive に保存される（実行＝アクセスユーザーのため）。
  運用者がスプレッドシートのオーナーなら、中央の「うんなん暮らしの学び帖」フォルダに
  集約される。複数人で編集する場合は各自の Drive に分かれる点に注意。

### ローカルでの動作確認（モックモード）

GAS にデプロイしなくても、`Admin.html` をローカルサーバーで開いて
URL に `?mock=1` を付けると、サンプルデータで一通りの操作を試せる
（例：`http://localhost:4173/gas/Admin.html?mock=1`）。
スプレッドシートには何も書き込まれない。見た目や操作感の確認用。

## clasp でのコード反映（2026-07-11〜）

管理画面用の GAS はスタンドアロンプロジェクト（`gas/.clasp.json` の scriptId）で運用し、
コード反映はエディタへの貼り付けではなく clasp で行う：

```sh
cd gas
npx @google/clasp push -f            # Code.gs / Admin.html / appsscript.json を反映
npx @google/clasp create-version "説明"
npx @google/clasp update-deployment ＜デプロイID＞ --versionNumber ＜番号＞
npx @google/clasp list-deployments   # デプロイ一覧
```

- `appsscript.json` の `webapp` は管理画面用（実行＝アクセスユーザー／要Googleアカウント）。
- スタンドアロンのため、スクリプトプロパティ `SPREADSHEET_ID` にシートIDが必要。
- 公開データAPIは別プロジェクト（スプレッドシート紐づけ・実行＝自分／匿名OK）のまま。
- 認証は `npx @google/clasp login`（済み）。

## まだのこと（次段）

- 写真の複数枚（ギャラリー）・役割/トリミング位置・Images シート連携
- 公開予約（scheduled）・並べ替え
- ChatGPT用メモ／写真相談プロンプトの管理画面内コピー
