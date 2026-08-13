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
const pngSize = (file) => {
  const buffer = fs.readFileSync(path.join(root, file));
  assert.equal(buffer.toString("hex", 0, 8), "89504e470d0a1a0a", `${file}은 올바른 PNG여야 합니다.`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
};

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
  "event-forecast",
  "manager-button",
  "stats-modal",
  "history-chart",
  "skip-onboarding-button",
  "high-contrast-setting",
  "text-size-setting",
  "shift-objective-list",
  "shift-objectives-hud",
  "result-objective-list",
  "new-plan-button",
  "next-difficulty-button",
  "result-unlock-button",
  "result-celebration",
  "shift-modes",
  "resume-shift-card",
  "endless-cashout-button",
  "share-result-button",
  "mobile-manager-button",
  "result-home-button",
  "result-details",
  "pause-settings-button",
].forEach((id) => assert.match(html, new RegExp(`id=["']${id}["']`), `${id} UI가 필요합니다.`));

assert.equal(manifest.display, "standalone", "PWA는 독립 실행형으로 열려야 합니다.");
assert.equal(manifest.start_url, "./", "PWA 시작 주소는 배포 경로에 상대적이어야 합니다.");
assert.ok(manifest.icons.some((icon) => icon.purpose.includes("maskable")), "마스커블 앱 아이콘이 필요합니다.");
assert.ok(manifest.screenshots.some((item) => item.form_factor === "wide"), "와이드 PWA 설치 스크린샷이 필요합니다.");
assert.ok(manifest.screenshots.some((item) => item.form_factor === "narrow"), "모바일 PWA 설치 스크린샷이 필요합니다.");
["index.html", "styles.css", "game-config.js", "script.js", "manifest.webmanifest", "icon.svg", "icon-maskable.svg", "assets/icon-192.png", "assets/icon-512.png", "assets/icon-maskable-512.png", "assets/share-card.png", "assets/screenshot-wide.png", "assets/screenshot-mobile.png"]
  .forEach((asset) => assert.match(worker, new RegExp(asset.replace(".", "\\.")), `${asset}이 오프라인 캐시에 포함되어야 합니다.`));

assert.match(script, /DATA_SCHEMA_VERSION\s*=\s*7/, "저장 데이터 스키마 버전 7이 필요합니다.");
assert.match(script, /APP_VERSION\s*=\s*"2\.9\.0"/, "모바일 한 화면 영업 업데이트 버전 2.9.0이 필요합니다.");
assert.match(script, /const GAME_MODES/, "네 가지 영업 모드 정의가 필요합니다.");
assert.match(script, /const MANAGEMENT_GROUPS/, "관리 센터 네 그룹 정의가 필요합니다.");
assert.match(script, /saveShiftCheckpoint/, "영업 체크포인트 저장 함수가 필요합니다.");
assert.match(script, /restoreShiftCheckpoint/, "영업 체크포인트 복구 함수가 필요합니다.");
assert.match(script, /resultShareCanvas/, "결과 공유 카드 생성 함수가 필요합니다.");
assert.doesNotMatch(`${html}\n${script}`, /\/api\/cloud|cloud-sync|leaderboard/i, "이번 버전에는 온라인 순위·클라우드 저장을 포함하지 않습니다.");
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
assert.match(script, /showEventForecast/, "사건 사전 예고 함수가 필요합니다.");
assert.match(script, /managerLevelInfo/, "점장 레벨 계산 함수가 필요합니다.");
assert.match(script, /recordShiftHistory/, "최근 영업 기록 함수가 필요합니다.");
assert.match(script, /setupManagementNavigation/, "관리 화면 공통 탐색이 필요합니다.");
assert.match(script, /prepareShiftObjectives/, "영업별 목표 배정 함수가 필요합니다.");
assert.match(script, /evaluateShiftObjectives/, "영업 목표 평가 함수가 필요합니다.");
assert.match(script, /retrySameShift/, "같은 조건 재도전 함수가 필요합니다.");
assert.match(script, /playResultCelebration/, "성과별 결과 연출 함수가 필요합니다.");
assert.match(script, /returnHomeFromResult/, "결과에서 홈으로 돌아가는 전환 함수가 필요합니다.");
assert.match(script, /usesMobilePageSlide/, "모바일 보조 화면 슬라이드 전환 함수가 필요합니다.");
assert.match(script, /closeWithMobilePageSlide/, "모바일 보조 화면의 뒤로가기 전환 함수가 필요합니다.");
assert.match(script, /MAX_QUEUE\s*-\s*1\s*-\s*state\.queue\.length/, "단체 손님 사건은 즉시 패배를 만들지 않아야 합니다.");
assert.match(worker, /SKIP_WAITING/, "서비스 워커 업데이트 적용 메시지가 필요합니다.");
assert.match(styles, /@media \(max-width: 520px\)/, "모바일 레이아웃 기준이 필요합니다.");
assert.match(styles, /\.reduce-motion/, "모션 감소 스타일이 필요합니다.");
assert.match(styles, /\.color-assist/, "색각 보조 스타일이 필요합니다.");
assert.match(styles, /\.tutorial-coach/, "튜토리얼 코치 스타일이 필요합니다.");
assert.match(styles, /\.decor-preview/, "매장 꾸미기 미리 보기 스타일이 필요합니다.");
assert.match(styles, /\.high-contrast/, "고대비 화면 스타일이 필요합니다.");
assert.match(styles, /\.management-nav/, "관리 화면 공통 탐색 스타일이 필요합니다.");
assert.match(styles, /\.screen-view/, "팝업이 아닌 전용 화면 스타일이 필요합니다.");
assert.match(styles, /\.management-subnav/, "관리 그룹 내부 탐색 스타일이 필요합니다.");
assert.match(styles, /\.management-screen\.during-shift/, "영업 중 설정만 모달로 표시해야 합니다.");
assert.match(styles, /\.result-celebration/, "결과 축하 연출 스타일이 필요합니다.");
assert.match(styles, /\.shift-modes/, "영업 모드 선택 스타일이 필요합니다.");
assert.match(styles, /\.mobile-manager-entry/, "모바일 홈의 통합 관리 진입 UI가 필요합니다.");
assert.match(styles, /\.result-details/, "모바일 결과 상세 접기 UI가 필요합니다.");
assert.match(styles, /@keyframes mobile-page-forward/, "모바일 화면 진입 슬라이드가 필요합니다.");
assert.match(styles, /@keyframes mobile-page-back/, "모바일 화면 복귀 슬라이드가 필요합니다.");
assert.ok(fs.existsSync(path.join(root, "tests", "laundry-game-ui.cjs")), "자동 UI 회귀 검사 파일이 필요합니다.");
["icon-192.png", "icon-512.png", "icon-maskable-512.png", "share-card.png", "screenshot-wide.png", "screenshot-mobile.png"]
  .forEach((asset) => assert.ok(fs.existsSync(path.join(root, "assets", asset)), `${asset} 파일이 필요합니다.`));
Object.entries({
  "assets/icon-192.png": [192, 192],
  "assets/icon-512.png": [512, 512],
  "assets/icon-maskable-512.png": [512, 512],
  "assets/share-card.png": [1200, 630],
  "assets/screenshot-wide.png": [1280, 720],
  "assets/screenshot-mobile.png": [390, 844],
}).forEach(([asset, [width, height]]) => assert.deepEqual(pngSize(asset), { width, height }, `${asset} 크기가 manifest와 일치해야 합니다.`));

assert.equal((html.match(/class=["'][^"']*modal-backdrop/g) || []).length, 3, "도움말·업데이트·일시정지만 상시 모달 구조여야 합니다.");
assert.equal((html.match(/class=["'][^"']*screen-view/g) || []).length, 9, "홈·준비·결과와 여섯 관리 기능은 전용 화면이어야 합니다.");

console.log("출시 완성도 정적 검사를 통과했습니다.");
