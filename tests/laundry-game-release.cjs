"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const html = read("index.html");
const script = read("script.js");
const styles = read("styles.css");
const worker = read("sw.js");
const manifest = JSON.parse(read("manifest.webmanifest"));

[
  "result-event-response",
  "result-missed-dirt",
  "result-refund-cause",
  "result-peak-queue",
  "result-advice",
  "settings-modal",
  "help-modal",
  "updates-modal",
  "fullscreen-button",
  "prep-modal",
  "prep-weekly-goals",
  "export-data-button",
  "import-data-button",
  "app-update-banner",
  "tutorial-overlay",
  "tutorial-button",
  "decor-modal",
  "decor-grid",
  "shift-condition-card",
  "prep-weekly-rule",
].forEach((id) => assert.match(html, new RegExp(`id=["']${id}["']`), `${id} UI가 필요합니다.`));

assert.equal(manifest.display, "standalone", "PWA는 독립 실행형으로 열려야 합니다.");
assert.equal(manifest.start_url, "./", "PWA 시작 주소는 배포 경로에 상대적이어야 합니다.");
assert.ok(manifest.icons.some((icon) => icon.purpose.includes("maskable")), "마스커블 앱 아이콘이 필요합니다.");
["index.html", "styles.css", "game-config.js", "script.js", "manifest.webmanifest", "icon.svg"]
  .forEach((asset) => assert.match(worker, new RegExp(asset.replace(".", "\\.")), `${asset}이 오프라인 캐시에 포함되어야 합니다.`));

assert.match(script, /DATA_SCHEMA_VERSION\s*=\s*4/, "저장 데이터 스키마 버전 4가 필요합니다.");
assert.match(script, /migrateProgressionData/, "기존 저장 데이터 마이그레이션 함수가 필요합니다.");
assert.match(script, /resultAdvice/, "영업 결과 맞춤 조언 함수가 필요합니다.");
assert.match(script, /weeklyDefinitionsFor/, "주간 목표 생성 함수가 필요합니다.");
assert.match(script, /recordWeeklyPace/, "부담 없는 주간 페이스 보상이 필요합니다.");
assert.match(script, /exportSavedData/, "저장 데이터 내보내기가 필요합니다.");
assert.match(script, /importSavedData/, "저장 데이터 가져오기가 필요합니다.");
assert.match(script, /startTutorial/, "실습 튜토리얼 시작 함수가 필요합니다.");
assert.match(script, /buyOrEquipDecoration/, "꾸미기 구매와 장착 함수가 필요합니다.");
assert.match(script, /currentStoreCondition/, "일일 매장 조건 생성 함수가 필요합니다.");
assert.match(script, /currentWeeklyEventRule/, "주간 사건 규칙 생성 함수가 필요합니다.");
assert.match(script, /inspection/, "위생 검사 사건이 필요합니다.");
assert.match(script, /collector/, "희귀 평론가 손님이 필요합니다.");
assert.match(script, /MAX_QUEUE\s*-\s*1\s*-\s*state\.queue\.length/, "단체 손님 사건은 즉시 패배를 만들지 않아야 합니다.");
assert.match(worker, /SKIP_WAITING/, "서비스 워커 업데이트 적용 메시지가 필요합니다.");
assert.match(styles, /@media \(max-width: 520px\)/, "모바일 레이아웃 기준이 필요합니다.");
assert.match(styles, /\.reduce-motion/, "모션 감소 스타일이 필요합니다.");
assert.match(styles, /\.color-assist/, "색각 보조 스타일이 필요합니다.");
assert.match(styles, /\.tutorial-coach/, "튜토리얼 코치 스타일이 필요합니다.");
assert.match(styles, /\.decor-preview/, "매장 꾸미기 미리 보기 스타일이 필요합니다.");

console.log("출시 완성도 정적 검사를 통과했습니다.");
