export const INQUIRER_TYPES = [
  "患者本人", "家族", "介護者",
  "PT（理学療法士）", "OT（作業療法士）", "ST（言語聴覚士）",
  "看護師", "医師", "その他"
];

export const ORG_TYPES = [
  "病院（急性期）", "病院（回復期）", "病院（療養期）",
  "老健施設", "特別養護老人ホーム",
  "訪問リハビリ", "訪問看護",
  "行政機関", "教育機関", "その他"
];

export const DISABILITY_TYPES = [
  "運動機能重度障害", "発話困難", "意思伝達困難",
  "視覚障害", "聴覚障害", "重複障害"
];

export const SKILL_LEVELS = [
  { value: 1, label: "1 — ほぼ未経験" },
  { value: 2, label: "2 — 基本操作に支援が必要" },
  { value: 3, label: "3 — 基本操作は可能" },
  { value: 4, label: "4 — 日常的に利用" },
  { value: 5, label: "5 — 応用操作も可能" }
];

export const STEPS = ["受付・投入", "属性設定", "AI生成", "修正・確定", "回答URL"];
