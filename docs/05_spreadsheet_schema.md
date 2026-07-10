# Googleスプレッドシート設計

## 1. 目的

Googleスプレッドシートは、「うんなん暮らしの学び帖」の記事データ、講座情報、写真情報、サイト設定を管理するために使用する。

GASから読み書きしやすいように、シート名と列名は英数字のスネークケースで統一する。

## 2. シート一覧

| シート名 | 役割 |
|---|---|
| Articles | 記事本体を管理 |
| Courses | 講座マスタを管理 |
| Images | 写真情報を管理 |
| Settings | サイト設定を管理 |

## 3. Articles シート

記事本体を管理するシート。

### 対象記事

- 活動レポート
- 募集案内
- お知らせ

### 列定義

| 列名 | 内容 | 必須 | 備考 |
|---|---|---:|---|
| article_id | 記事ID | ○ | 自動採番。例：article_0001 |
| post_type | 投稿タイプ | ○ | report / recruit / notice |
| course_id | 講座ID | ○ | Coursesのcourse_id |
| title | タイトル | ○ | 表示タイトル |
| subtitle | サブタイトル |  | タイトル下のリード見出し。例：発酵食品を、毎日の食卓へ |
| slug | URL用文字列 |  | 将来用。初期はarticle_idでも可 |
| event_date | 開催日 | ○ | YYYY-MM-DD |
| place | 開催場所 |  | 例：雲南市 木次町。記事・一覧のメタ表示に使う |
| publish_date | 公開日 |  | YYYY-MM-DD |
| publish_start_at | 公開開始日時 |  | 公開予約用 |
| publish_end_at | 公開終了日時 |  | 募集カード非表示用に使用可 |
| status | 状態 | ○ | draft / scheduled / published / private |
| excerpt | 抜粋文 |  | 一覧表示用 |
| body | 本文 |  | Web記事本文 |
| content_memo | 内容メモ |  | ChatGPT用素材 |
| instructor_name | 講師名 |  | 任意。入力は名前・肩書きを分けて持つ |
| instructor_title | 講師肩書き |  | 任意 |
| instructor_instagram_url | 講師Instagram URL |  | 任意 |
| main_image_file_id | メイン写真File ID |  | Drive file_id |
| image_path | 暫定画像パス |  | 写真パイプライン導入前の代替。例：assets/images/karin.png |
| menu_items | メニュー |  | 改行区切りまたはJSON。表示では activity_items に統合 |
| activity_items | 今回の内容 |  | 改行区切りまたはJSON。メニュー・制作物・体験内容をまとめた「今回の内容」リスト |
| participant_voice_main | 代表の参加者の声 |  | 引用カード用 |
| participant_voices | その他の参加者の声 |  | 改行区切りまたはJSON |
| application_start_date | 申込開始日 |  | 募集記事用 |
| application_deadline | 申込締切日 |  | 募集記事用 |
| application_url | 申込URL |  | Forms等外部リンク |
| event_time | 開催時間 |  | 募集記事用。例：10:00から13:00 |
| fee | 参加費 |  | 募集記事用。例：1,000円 |
| related_report_id | 関連活動レポートID |  | 募集終了後のリンク用 |
| instagram_caption | Instagram本文 |  | コピー用 |
| hashtags | ハッシュタグ |  | Instagram用 |
| photo_confirmed | 写真掲載確認済み | ○ | TRUE / FALSE。掲載可否の確認 |
| privacy_confirmed | 個人情報確認済み | ○ | TRUE / FALSE。顔や個人情報が写りすぎていないかの確認 |
| permission_confirmed | 掲載許可確認済み | ○ | TRUE / FALSE。必要に応じた掲載許可の確認 |
| created_by | 作成者 |  | メールアドレス |
| created_at | 作成日時 |  | ISO形式 |
| updated_by | 最終更新者 |  | メールアドレス |
| updated_at | 最終更新日時 |  | ISO形式 |

### post_type の値

| 値 | 表示名 | 用途 |
|---|---|---|
| report | 活動レポート | 基本の投稿 |
| recruit | 募集案内 | 募集がある時のみ |
| notice | お知らせ | 変更・連絡など |

### status の値

| 値 | 表示名 | 用途 |
|---|---|---|
| draft | 下書き | 非公開の作成中記事 |
| scheduled | 公開予約 | publish_start_at以降に公開扱い |
| published | 公開 | 公開サイトに表示 |
| private | 非公開 | 一時的に非表示 |

### Articles サンプル行

```csv
article_id,post_type,course_id,title,subtitle,slug,event_date,place,publish_date,publish_start_at,publish_end_at,status,excerpt,body,content_memo,instructor_name,instructor_title,instructor_instagram_url,main_image_file_id,menu_items,activity_items,participant_voice_main,participant_voices,application_start_date,application_deadline,application_url,related_report_id,instagram_caption,hashtags,photo_confirmed,privacy_confirmed,permission_confirmed,created_by,created_at,updated_by,updated_at
article_0001,report,karin,からだ想いのやさしい食事 手軽に簡単！発酵食品の魅力,発酵食品を、毎日の食卓へ,karin-hakko,2026-01-27,雲南市 木次町,2026-07-08,,,published,味噌やヨーグルト、塩麹など、身近な発酵食品を使いながら、からだにやさしい食事づくりを学びました。,この日は発酵食品をテーマにした料理教室を開催しました。,発酵食品の料理教室メモ,飯塚生美子,島根県家の光講師,,,味噌とヨーグルトで和風炊き込みご飯\nヨーグルト味噌汁,味噌とヨーグルトで和風炊き込みご飯\nヨーグルト味噌汁\n鶏肉の塩麹焼き,ヨーグルトの新しい利用法が勉強になりました。,とても美味しくいただきました。,,,,,Instagram文,#JAしまね #雲南 #華凜,TRUE,TRUE,TRUE,user@example.com,2026-07-08T10:00:00+09:00,user@example.com,2026-07-08T10:00:00+09:00
```

## 4. Courses シート

講座マスタを管理するシート。初期段階では固定値でもよいが、将来の編集機能追加を想定してシート化する。

### 列定義

| 列名 | 内容 | 必須 | 備考 |
|---|---|---:|---|
| course_id | 講座ID | ○ | cooking / karin / agri / baby / yoga |
| course_name | 講座名 | ○ | 表示名 |
| category | カテゴリ名 | ○ | カード上部の小見出し。例：暮らしのキッチン |
| copy | 説明コピー | ○ | 講座カードに表示。文末は句点あり |
| description | 講座紹介文 |  | 講座ページ用 |
| accent_color | 差し色（主色） | ○ | HEXカラー。線・見出しに使う濃い色 |
| accent_soft | 差し色（背景） | ○ | HEXカラー。カード背景などの淡い色 |
| accent_ink | 差し色（文字） | ○ | HEXカラー。差し色の上に置く文字色 |
| icon_type | アイコン種別 | ○ | 手描き風SVG線画のキー。bowl / flower / leaf / moon など |
| instagram_url | Instagram URL |  | 任意 |
| activity_months | 活動時期 |  | 例：5月・7月・9月・10月ごろ |
| photo_notice | 写真掲載注意文 | ○ | 講座ごとの注意文 |
| is_main_course | メイン講座か | ○ | TRUE / FALSE |
| display_order | 表示順 | ○ | 数値 |

差し色は、旧設計の単色（差し色1つ）から、現行プロトタイプの3トーン構成に変更した。1講座につき「主色（accent_color）／淡い背景色（accent_soft）／文字色（accent_ink）」の3色を持ち、全体に彩度を落とした落ち着いた配色にしている。アイコンは絵文字ではなく、`icon_type` のキーに対応する手描き風のSVG線画を表示する。

### Courses 初期データ

```csv
course_id,course_name,category,copy,description,accent_color,accent_soft,accent_ink,icon_type,instagram_url,activity_months,photo_notice,is_main_course,display_order
cooking,おしゃべりクッキング,暮らしのキッチン,食べて、話して、暮らしを楽しむ料理教室。,季節の食材を使った料理を囲みながら、楽しく学び合う時間です。,#c9824a,#f5e4d5,#9f5f35,bowl,,5月・7月・9月・10月ごろ,参加者の顔が分かる写真を掲載する場合は、掲載許可を確認してください。料理、調理中の手元、完成品中心の写真を推奨します。,TRUE,1
karin,華凜,暮らしの花,学びと交流を重ねる、大人の女性のための時間。,料理、手芸、ものづくり、健康教室、日帰り旅行など。暮らしを楽しむ学びを、同じ仲間と重ねています。,#b9788e,#f4e4e9,#965f72,flower,,10月・12月・1月・4月・6月ごろ,参加者の顔が分かる写真を掲載する場合は、掲載許可を確認してください。作品、料理、講師の手元、会場風景中心の写真を推奨します。,TRUE,2
agri,アグリスクール,アグリスタイル,親子で食と農にふれる、わくわく体験教室。,料理や体験を通して、食べものや地域の農に親子でふれる時間です。,#7f9b73,#e8efe3,#5e7a55,leaf,,6月・8月ごろ,赤ちゃん・子ども・保護者の顔が分かる写真は原則避けてください。料理、手元、後ろ姿、会場風景中心の写真を推奨します。,TRUE,3
baby,赤ちゃん食堂,食育,赤ちゃんと保護者が、ほっとできる食と交流の場。,あたたかい食事と交流を通して、子育て中のひとときに寄り添います。,#d6b766,#f6edcf,#9f8140,bowl,,8月・12月ごろ,赤ちゃんや保護者の顔が分かる写真は原則避けてください。料理、手元、会場、配膳、後ろ姿中心の写真を推奨します。,TRUE,4
yoga,ヨガ講座,心とからだ,からだをゆるめて、心を整えるやさしい時間。,無理なくからだを動かしながら、日々の暮らしを少し軽やかにする講座です。,#7fa8a0,#e4efed,#5d827b,moon,,2か月に1回程度,参加者の顔が分かる写真を掲載する場合は、掲載許可を確認してください。後ろ姿、足元、マット、会場の雰囲気中心の写真を推奨します。,FALSE,5
```

## 5. Images シート

記事写真を管理するシート。

### 列定義

| 列名 | 内容 | 必須 | 備考 |
|---|---|---:|---|
| image_id | 画像ID | ○ | 自動採番 |
| article_id | 記事ID | ○ | Articlesと紐づけ |
| file_id | Drive File ID | ○ | 元画像 |
| thumbnail_file_id | サムネイルFile ID |  | 将来用 |
| role | 役割 | ○ | main / body / gallery / unused |
| trim_position | トリミング位置 | ○ | center / top / bottom / left / right |
| caption | キャプション |  | 任意 |
| alt_text | altテキスト |  | 画像の代替テキスト |
| ai_advice | AI写真アドバイス |  | ChatGPT等の助言メモ。自動反映はしない |
| approved | 写真掲載チェック | ○ | TRUE / FALSE。写真1枚ごとの確認 |
| sort_order | 表示順 | ○ | 数値 |
| is_main | メイン写真か | ○ | TRUE / FALSE。role=main と対応 |
| created_at | 作成日時 |  | ISO形式 |

現行プロトタイプでは、写真ごとに「役割（メイン／本文中／ギャラリー／使わない）」「トリミング位置」「altテキスト」「キャプション」「AI写真アドバイスのメモ」「写真掲載チェック」を持たせている。管理画面では、選択した写真を公開サイトと同じ加工（トリミング位置反映）で確認できる「掲載イメージ／元写真」の切り替えプレビューを備える。

### Images サンプル行

```csv
image_id,article_id,file_id,thumbnail_file_id,role,trim_position,caption,alt_text,ai_advice,approved,sort_order,is_main,created_at
image_0001,article_0001,xxxxxxxxxxxx,,main,center,講座の雰囲気が伝わる一枚,発酵食品の料理教室の様子,,TRUE,1,TRUE,2026-07-08T10:00:00+09:00
image_0002,article_0001,yyyyyyyyyyyy,,gallery,top,完成した料理,完成した発酵食品の料理,,TRUE,2,FALSE,2026-07-08T10:01:00+09:00
```

## 6. Settings シート

サイト全体の設定を管理する。

### 列定義

| 列名 | 内容 | 必須 | 備考 |
|---|---|---:|---|
| key | 設定キー | ○ | 英数字 |
| value | 設定値 |  | 文字列 |

### Settings 初期データ

```csv
key,value
site_name,うんなん暮らしの学び帖
organization_name,JAしまね雲南地区本部
site_introduction,JAでひらく、講座と活動の記録。
top_copy,食べて、つくって、話して。暮らしを少し楽しく。
site_description,料理教室、JA女性大学、親子体験、赤ちゃん食堂など。雲南の暮らしに寄り添う小さな活動を、写真とことばで記録しています。
contact_department,ふれあい課
contact_tel,0854-xx-xxxx
contact_hours,平日 9:00から17:00
contact_text,講座・活動に関するお問い合わせは、JAしまね雲南地区本部までご連絡ください。
instagram_url,
```

## 7. 日付の扱い

### 管理画面

管理画面では西暦入力。

例：

```text
2026-01-27
```

### 公開サイト

公開サイトでは令和表記。

例：

```text
令和8年1月27日
```

### 令和変換ルール

- 2019年5月1日以降：令和
- 令和年 = 西暦年 - 2018
- 令和1年は「令和元年」と表示してもよい

## 8. 募集表示の判定

トップページの募集カードに表示する条件：

- post_type = recruit
- status = published または scheduledで公開開始日時を過ぎている
- application_deadline が空でない
- application_deadline が今日以降

締切後：

- トップページからは非表示
- 募集記事詳細では「募集は終了しました」と表示

## 9. 公開状態の判定

公開サイトに表示する条件：

- status = published
- または status = scheduled かつ publish_start_at <= 現在日時

非表示：

- status = draft
- status = private
- status = scheduled かつ publish_start_at > 現在日時

## 10. 必須チェック

公開時に確認する条件：

- course_id がある
- title がある
- event_date がある
- post_type がある
- reportの場合、本文または内容メモがある
- 写真が1枚以上ある
- 掲載前チェック3点がすべてTRUE
  - photo_confirmed = TRUE（写真掲載に問題がないことを確認）
  - privacy_confirmed = TRUE（顔や個人情報が写りすぎていないことを確認）
  - permission_confirmed = TRUE（必要に応じて掲載許可を確認）

現行プロトタイプでは、旧設計の写真掲載チェック1点から、上記3点の必須チェックに拡張している。3点すべてにチェックが入るまで公開ボタンは押せない。

過去記事登録モードでも、写真1枚以上と掲載前チェック3点は必要とする。

## 11. Drive構成

「うんなん暮らしの学び帖」に関して Drive につくるものは、**すべて Drive 直下の
「うんなん暮らしの学び帖」フォルダの中に入れる**（写真・サムネイル・バックアップ・
エクスポート・スプレッドシート本体も含む）。GAS の `setupDriveFolders()` を一度
実行すると、この構成を作り、スプレッドシートもフォルダ内へ移動する。

```text
うんなん暮らしの学び帖   ← Drive直下のルート。関連ファイルは全部この中
├─ （スプレッドシート本体）
├─ images
│  ├─ reports
│  ├─ courses
│  └─ thumbnails
├─ backups
└─ exports
```

記事ごとにフォルダを作る場合：

```text
images/reports/2026/article_0001
```

## 12. バックアップ方針

初期段階では手動バックアップでもよい。

将来的には以下を検討する。

- ArticlesシートをCSVエクスポート
- Images情報をCSVエクスポート
- Driveフォルダをバックアップ
- 更新履歴ログシートを追加
