# うんなん暮らしの学び帖 Markdown一式

JAしまね雲南地区本部の講座・活動記録サイト「うんなん暮らしの学び帖」用のMarkdown資料です。

## ファイル一覧

1. `01_site_design.md`  
   サイト全体の設計書。目的、講座構成、公開サイト、管理画面、運用ルールを整理。

2. `02_wireframe.md`  
   トップページ、講座ページ、記事ページ、管理画面の画面設計・ワイヤーフレーム。

3. `03_html_prototype_spec.md`  
   HTML試作品を作るための仕様書。画面、サンプルデータ、UI、優先順位を整理。

4. `04_gas_implementation_prompt.md`  
   CodexやChatGPTにGAS実装を依頼するためのプロンプト。

5. `05_spreadsheet_schema.md`  
   Googleスプレッドシート構成、列定義、初期データ案。

6. `06_chatgpt_article_prompt.md`  
   職員がChatGPTに貼り付けて、Web記事文・Instagram文を生成するためのプロンプト。

7. `wireframe.html`  
   ブラウザで確認できる公開サイト・管理画面の低忠実度ワイヤーフレーム。

8. `../index.html`（+ `../style.css` / `../app.js`）  
   実際のデザイン寄りHTML試作品。リポジトリ直下にある。公開サイトと管理画面を画面切替で確認できる。

9. `../data.js`  
   サイトのデータ層。スキーマ（`05_spreadsheet_schema.md`）準拠の素データ（`SOURCE`）と、それを表示用モデルへ変換するアダプタを持つ。初期表示は同梱データ、`window.LEARNING_DATA_URL` が設定されていれば `window.loadSiteData()` でGASのJSONを取得して差し替える。

10. `../gas/`  
    公開データを供給するGASウェブアプリ。`Code.gs` が Sheets を読んで `SOURCE` と同じ形のJSONを返す。`sheets/*.csv` は取り込み用ひな形（現行サンプルデータ入り）。手順は `gas/README.md`。

## 現状と正の関係

このdocs一式は当初の設計資料だが、現在は**リポジトリ直下のHTML試作品（`index.html` / `style.css` / `app.js`）が最新の仕様の正**である。docsは、その試作品の方向性に合わせて更新している。当初設計から変わった主な点：

- 差し色を3トーン（主色・淡い背景色・文字色）の落ち着いた配色に変更、講座カテゴリと手描き風SVGアイコンを追加
- トップは「次回のご案内」を控えめに見せ、講座を1つの一覧にまとめる構成
- 活動レポート一覧に講座フィルター・キーワード検索・年の絞り込みを実装
- 記事詳細にサブタイトル・開催場所・共有ボタンを追加
- お問い合わせページを追加
- 写真管理を撮影ガイド＋AI相談プロンプト＋写真ごとの役割/トリミング設定へ拡張、公開前チェックを3点必須に
- 管理画面はドラッグ可能なフローティング「Phone View」プレビュー
- データを `app.js` 直書きから `data.js`（スキーマ準拠の素データ＋アダプタ）へ分離済み。描画と切り離し、GASのJSONへ差し替えやすくした（Phase 1）
- 公開サイトの fetch 化と、Sheets→JSONを返すGASウェブアプリ（`gas/Code.gs`）を用意。URLを設定すれば本物のデータで表示、未設定なら同梱データで動く（Phase 2）
- 管理画面をGAS配信＋Googleログインで機能化（`gas/Admin.html`）。許可メールの職員だけが記事を作成・編集し、下書き保存／公開（写真＋3点チェックが揃うまで公開不可）ができる。書き込みは Articles シート→公開データAPI経由で公開サイトに反映（Phase 3）
- 写真アップロード：ブラウザ側で縮小し、Drive の「うんなん暮らしの学び帖」フォルダ配下（`images/reports`）に保存。関連ファイルはすべてこのフォルダに集約。公開サイトは Google CDN 経由で表示（Phase 3b）

## 推奨する進め方

1. リポジトリ直下の `index.html` をブラウザで開き、最新の試作品を確認する
2. `01_site_design.md` で全体方針、`02_wireframe.md` で画面構成、`03_html_prototype_spec.md` で試作仕様を確認する
3. `05_spreadsheet_schema.md` をもとにスプレッドシート雛形を作る（`data.js` の `SOURCE` と列がそろっている）
4. `04_gas_implementation_prompt.md` を使ってGAS実装に入る。まず `data.js` の `SOURCE` と同じ形のJSONを返す `doGet` を作り、公開サイトを `fetch` へ差し替える
5. 運用開始後、`06_chatgpt_article_prompt.md` を記事・写真の相談に使う
