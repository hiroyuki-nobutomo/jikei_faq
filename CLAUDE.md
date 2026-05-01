# CLAUDE.md — プロジェクト記憶

このファイルは Claude Code 用のプロジェクト前提メモ。新しいセッション・別マシンでも同じ前提で作業継続できるよう、設計判断・規約・現状を要約する。詳細は `README.md` を参照（**必読**）。

## システム概要

慈恵医科大学アクセシビリティ支援チーム向けの ICT アクセシビリティ相談 AI 支援システム。React 18 + Vite 5（JSX、TypeScript なし） + Vercel Serverless Functions + OpenAI（gpt-4o-mini） + Google Sheets で構成される。

- **GitHub**: <https://github.com/hiroyuki-nobutomo/jikei_faq>
- **package.json name**: `jikei-accessibility-system`

## 主要依存

| パッケージ | 用途 |
|---|---|
| `react` / `react-dom` 18 | UI |
| `vite` 5 | 開発サーバ＆ビルド |
| `openai` ^6 | `/api/generate` で `gpt-4o-mini` 呼出 |
| `googleapis` ^171 | サービスアカウントで Sheets API v4 |

## アーキテクチャ要点

### 5ステップワークフロー
`src/App.jsx` がメインコンテナ。`step` ステートで以下を遷移：

| Step | 内容 |
|---|---|
| 0. 受付・投入 | 相談文の貼り付け |
| 1. 属性設定 | 相談者タイプ / 所属 / 障害種別（複数可） / ICT 習熟度（1–5） |
| 2. AI生成 | `services/aiService.generateAIDraft` → `/api/generate`（OpenAI） |
| 3. 修正・確定 | 担当者編集 → `editHistory` に v1（AI）／v2（担当者）として記録 |
| 4. 回答URL | ハッシュベースの公開 URL を発行、任意でナレッジ登録 |

ワークフロー以外に **ナレッジ登録** と **履歴管理** のタブが上部に並ぶ（`adminMode`）。

### 公開ビューとハッシュルーティング
`useHashRouting` フックが `#/reply/{caseId}` を監視。`viewMode === "public"` のとき `PublicReplyPage` を表示。担当者がコピーして相談者に渡す URL もこの形式（`services/threadService.generateReplyUrl`）。

### データソース階層
1. **Google Sheets**（サービスアカウント経由）が一次ソース
   - タブ: `ナレッジ`（id/disability/topic/content） / `案件`（id/requesterName/inquiry/fullInquiry/inquirer/org/disabilities/skill/finalResponse/timestamp）
2. **`src/data/knowledgeBase.js`** の `INITIAL_KNOWLEDGE_BASE`（5件）が Sheets 空または取得失敗時のフォールバック
3. **`src/data/demoCases.js`** はデモ用案件データ（プロダクション動線では未使用、参照のみ）

スレッドは `requesterName` キーで `api/cases.js` 側がサーバ集約して返す（クライアント側にも `addCaseToThreads` ヘルパが残っているが、確定後はサーバから再取得する流れ）。

### API エンドポイント
- `POST /api/setup` — シート（`ナレッジ`/`案件`）とヘッダーを初期化
- `GET/POST/PUT/DELETE /api/knowledge` — ナレッジ CRUD（id 列でマッチ）
- `GET/POST /api/cases` — GET は `{cases, threads}` を返す
- `POST /api/generate` — OpenAI を呼び、`{draft}` を返す

`api/_sheets.js` に `readSheet` / `appendRow` / `updateRow` / `deleteRow` / `ensureSheet` を集約。1 行目をヘッダー、`id` 列を主キーとする。

## ファイル責務

### api/
- `_sheets.js` — Sheets API 共通層（`google.auth.GoogleAuth` をモジュール内でメモ化）
- `setup.js` — `ナレッジ`/`案件` の `ensureSheet`
- `knowledge.js` — ナレッジ CRUD
- `cases.js` — 案件追加 + GET 時にスレッド集約
- `generate.js` — `SYSTEM_PROMPT` を保持し OpenAI を呼出

### src/
- `App.jsx` — 画面ステート + ライフサイクル（起動時 `setupSheets` → `fetchKnowledge` + `fetchCasesAndThreads`）
- `components/Header.jsx` — ナビ + ロゴ。グラデーション `#0f3460 → #1a5276 → #1a6b4a`
- `components/StepIndicator.jsx` — 5 ステップのインジケータ
- `components/Badge.jsx` / `KnowledgePanel.jsx` / `HistoryPanel.jsx` / `PublicReplyPage.jsx`
- `data/constants.js` — `INQUIRER_TYPES` / `ORG_TYPES` / `DISABILITY_TYPES`(6種) / `SKILL_LEVELS` / `STEPS`
- `data/knowledgeBase.js` — 初期ナレッジ（KB001–KB005）
- `services/aiService.js` — ナレッジを `disabilities` 一致で前段フィルタしてから `/api/generate` に送る
- `services/sheetService.js` — `/api/*` ラッパ
- `services/threadService.js` — 案件 ID 採番（`CASE-${base36}`）／公開 URL 生成／スレッド集約
- `hooks/useHashRouting.js` — `#/reply/{id}` 監視
- `styles/glassStyles.js` — Liquid Glass 風スタイル定数

## 規約・鉄則

### コードの作法
- ビルド前に `npm run lint`（`--max-warnings 0`）と `npm run build` を通す
- 機能追加・仕様変更時は `README.md` の該当章も更新する
- コミットメッセージは英語と日本語が混在しているが、**意味（WHY）を明示** する点は共通

### AI プロンプト（`api/generate.js`）
- `SYSTEM_PROMPT` で「相談者立場に応じた言葉遣い」「習熟度に応じた専門用語調整」「`■` での項目区切り」「補装具費支給制度などの公的支援への言及」を指示済
- 該当ナレッジが無い場合は「担当者による確認をお勧めします」と注記する仕様。クライアントは原案にこの文字列が含まれるかでエスカレーションを判定（`needsEscalation`）
- ブラウザから直接 OpenAI を叩かない（API キー露出を避ける）

### Sheets 連携
- ヘッダーは `setup.js` の `KNOWLEDGE_HEADERS` / `CASES_HEADERS` が単一ソース
- `disabilities` は **カンマ区切り文字列** で永続化、サーバ側で配列に復元
- `id` 列を主キーとする更新・削除ロジックなので **`id` 列をシート上で消さない**

### UI 規約
- スタイリングはインラインスタイル + `src/styles/glassStyles.js` の Liquid Glass 風定数を組み合わせる
- 主色: ヘッダー濃紺グラデーション、アクセント `#2563eb`（ブルー）、成功 `#1a6b4a`（グリーン）
- フォントは `'Noto Sans JP', 'Hiragino Sans'`

## 直近の主要な意思決定

- 永続化を Google Sheets に統一（OpenAI 連携・モジュール分割と並ぶ大きな移行）
- 自動ナレッジ表示は廃止し、Step4 で **担当者が明示的にナレッジ登録** するボタン方式に変更
- AI モデルは `gpt-4o-mini` で固定（コスト/レイテンシ優先）
- ハッシュルーティング（`#/reply/{caseId}`）。React Router を入れずに 1 ファイルフックで運用
- スレッドは `requesterName` をキーにサーバ側集約。同名異人の混入リスクを承知のうえで採用

## 環境変数

| 変数 | 必須 | 用途 |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | `/api/generate`（gpt-4o-mini） |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ | Sheets API 認証 |
| `GOOGLE_PRIVATE_KEY` | ✅ | Sheets API 認証（改行は `\n` エスケープ） |
| `GOOGLE_SHEETS_ID` | ✅ | 書き込み対象スプレッドシートの ID |

サービスアカウントには対象シートの編集権限を共有しておくこと。

## やってはいけないこと

- ブラウザから直接 OpenAI / Google Sheets API を呼ばない（必ず `/api/*` 経由）
- `案件` シートの `id` 列・ヘッダー行を消さない（CRUD 全体が破綻する）
- `disabilities` 列を JSON 文字列に変えない（CSV 互換のためカンマ区切りで運用中）
- `SYSTEM_PROMPT` から「担当者による確認をお勧めします」相当の注記指示を外さない（`needsEscalation` 判定が壊れる）
- 公開ビューの URL 形式 `#/reply/{caseId}` を変更する場合は、既に共有済みの URL が無効化される点を必ず確認する
