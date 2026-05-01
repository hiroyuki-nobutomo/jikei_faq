# アクセシビリティAI相談支援（jikei_faq）

慈恵医科大学アクセシビリティ支援チーム向けの **AI相談回答ジェネレータ + ナレッジ管理システム**。

メールやメッセンジャーで届いた ICT アクセシビリティ相談を、相談者属性（相談者タイプ／所属／障害種別／ICT 習熟度）と社内ナレッジを踏まえて AI で下書きし、担当者が修正・確定したうえで **共有 URL** として相談者に返す運用を支援する。

- **GitHub**: <https://github.com/hiroyuki-nobutomo/jikei_faq>
- **想定デプロイ先**: Vercel（Serverless Functions + 静的ホスティング）

## 主要機能

| 画面 | 役割 |
|---|---|
| **相談ワークフロー** | 5ステップ（受付 → 属性設定 → AI生成 → 修正・確定 → 回答URL）で1案件を処理 |
| **ナレッジ登録** | 障害種別 × トピック × 内容 で社内ナレッジを CRUD。AI 回答時の参照対象 |
| **履歴管理** | 同一問い合わせ者の案件をスレッド集約して時系列表示 |
| **回答ページプレビュー** | `#/reply/{caseId}` で公開ビューを表示。共有 URL として相談者に渡す |

### ワークフローの流れ（5ステップ）

1. **受付・投入**: メールなどから相談文を貼り付け
2. **属性設定**: 相談者タイプ／所属／障害種別（複数選択可）／ICT 習熟度（1–5）を選択
3. **AI生成**: `/api/generate` 経由で OpenAI を呼び出し、関連ナレッジを参照した回答原案を生成
4. **修正・確定**: 担当者が原案を編集し、修正履歴を記録して確定
5. **回答URL**: ハッシュベースの公開 URL を発行。任意でナレッジに登録可能

ナレッジに該当が無い回答には「担当者による確認をお勧めします」が混入し、ワークフロー側で **エスカレーション通知** が点灯する。

## 技術スタック

| 領域 | 採用 |
|---|---|
| フロントエンド | React 18 + Vite 5（JSX、TypeScript なし） |
| ルーティング | ハッシュルーティング（`useHashRouting` フック） |
| スタイリング | インラインスタイル中心、Liquid Glass 風（`src/styles/glassStyles.js`） |
| バックエンド | Vercel Serverless Functions（`api/*.js`） |
| AI | OpenAI `gpt-4o-mini`（`/api/generate`） |
| データ永続化 | Google Sheets（`googleapis` SDK + サービスアカウント） |

ブラウザから直接 OpenAI / Sheets を叩かず、必ず `/api/*` 経由でサーバサイド処理する。

## ディレクトリ構成

```
jikei_faq/
├── api/                    Vercel Serverless Functions
│   ├── _sheets.js          Google Sheets 共通アクセス層
│   ├── setup.js            シート初期化（POST /api/setup）
│   ├── knowledge.js        ナレッジ CRUD（GET/POST/PUT/DELETE）
│   ├── cases.js            案件 CRUD + スレッド集約（GET/POST）
│   └── generate.js         OpenAI 呼び出し（POST）
├── src/
│   ├── App.jsx             ルート画面（ワークフロー / ナレッジ / 履歴 / 公開ビュー）
│   ├── components/         Header / StepIndicator / Badge / KnowledgePanel / HistoryPanel / PublicReplyPage
│   ├── data/
│   │   ├── constants.js    相談者タイプ／所属／障害種別／習熟度／STEPS
│   │   ├── knowledgeBase.js シート未設定時のフォールバックナレッジ（5件）
│   │   └── demoCases.js    デモ用案件データ
│   ├── hooks/useHashRouting.js
│   ├── services/
│   │   ├── aiService.js    /api/generate ラッパ + ナレッジ前段フィルタ
│   │   ├── sheetService.js /api/{setup,knowledge,cases} ラッパ
│   │   └── threadService.js 案件 ID 採番／公開 URL 生成／スレッド集約
│   └── styles/glassStyles.js
├── index.html
├── vite.config.js
├── vercel.json             SPA リライト + /api 透過
└── package.json
```

## Google Sheets スキーマ

`/api/setup` を叩くと、対象スプレッドシートに以下 2 タブが（無ければ）作成される。

### `ナレッジ` タブ
| 列 | 内容 |
|---|---|
| `id` | `KB-XXXXXX`（採番） |
| `disability` | 障害種別 |
| `topic` | トピック名 |
| `content` | 本文 |

### `案件` タブ
| 列 | 内容 |
|---|---|
| `id` | `CASE-XXXXXX`（採番） |
| `requesterName` | 問い合わせ者名（未入力時は `未入力`） |
| `inquiry` | 相談内容の要約（先頭60文字） |
| `fullInquiry` | 相談内容の全文 |
| `inquirer` | 相談者タイプ |
| `org` | 所属 |
| `disabilities` | 障害種別（カンマ区切り） |
| `skill` | ICT 習熟度（1–5） |
| `finalResponse` | 確定回答本文 |
| `timestamp` | ISO 8601 |

スレッドは `requesterName` をキーにサーバ側 (`api/cases.js`) で集約して返す。

## API 仕様

| メソッド & パス | 役割 |
|---|---|
| `POST /api/setup` | 必要なシートとヘッダーを初期化 |
| `GET /api/knowledge` | ナレッジ一覧を取得 |
| `POST /api/knowledge` | ナレッジ追加（`{disability, topic, content}`） |
| `PUT /api/knowledge` | ナレッジ更新（`{id, ...}`） |
| `DELETE /api/knowledge?id=...` | ナレッジ削除 |
| `GET /api/cases` | 案件一覧 + スレッド集約（`{cases, threads}`） |
| `POST /api/cases` | 案件追加 |
| `POST /api/generate` | OpenAI 呼び出しで回答原案を生成（`{inquiry, meta, knowledgeEntries}` → `{draft}`） |

## 環境変数

| 変数 | 用途 |
|---|---|
| `OPENAI_API_KEY` | OpenAI API キー（`/api/generate` 用） |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | サービスアカウントのメール |
| `GOOGLE_PRIVATE_KEY` | サービスアカウントの秘密鍵（改行は `\n` でエスケープ） |
| `GOOGLE_SHEETS_ID` | 書き込み対象スプレッドシートの ID |

サービスアカウントには対象スプレッドシートの **編集権限** を共有しておくこと。

## ローカル開発

```bash
npm install
npm run dev          # Vite 開発サーバ（フロントのみ）
npm run build        # 本番ビルド
npm run lint         # ESLint
```

`/api/*` は Vercel 環境（または `vercel dev`）で実行する前提。Vite 単独では API ルートは動かないので、AI 生成・Sheets 連携をローカル検証する場合は `vercel dev` を利用する。

## デプロイ

`vercel.json` で SPA リライトと `/api` 透過を定義済み。Vercel に環境変数を設定し、リポジトリを連携すればそのままデプロイできる。初回起動時にフロントが `/api/setup` を呼んでシートを自動初期化する。

## ライセンス

社内ツール（未公開ライセンス）。
