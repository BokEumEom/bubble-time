"use strict";

const CONFIG = LAUNDRY_CONFIG;
const GAME_SECONDS = CONFIG.gameSeconds;
const MAX_QUEUE = CONFIG.maxQueue;
const STORAGE_KEY = "bubbleTime75.bestRecord.v1";
const PROGRESSION_KEY = "bubbleTime75.progression.v1";
const SEEN_VERSION_KEY = "bubbleTime75.seenVersion";
const APP_VERSION = "2.5.0";
const DATA_SCHEMA_VERSION = 6;

const DIFFICULTIES = {
  calm: { label: "여유 영업", risk: "낮음", guestInterval: 1.18, patience: 1.28, cycle: 0.94, dirtInterval: 1.2, eventInterval: 1.22, groupBonus: -1, dirtyBonus: -2 },
  standard: { label: "표준 영업", risk: "보통", guestInterval: 1, patience: 1, cycle: 1, dirtInterval: 1, eventInterval: 1, groupBonus: 0, dirtyBonus: 0 },
  rush: { label: "피크 타임", risk: "높음", guestInterval: 0.86, patience: 0.82, cycle: 1.08, dirtInterval: 0.86, eventInterval: 0.84, groupBonus: 1, dirtyBonus: 1 },
};

const WEEKLY_GOALS = [
  { id: "clean_30", kind: "clean", title: "오염 30개 청소", target: 30, reward: 110 },
  { id: "serve_35", kind: "serve", title: "손님 35명 응대", target: 35, reward: 120 },
  { id: "happy_25", kind: "happy", title: "만족 손님 25명", target: 25, reward: 130 },
  { id: "events_8", kind: "event", title: "매장 사건 8회 해결", target: 8, reward: 120 },
  { id: "shifts_4", kind: "shift", title: "영업 4회 완주", target: 4, reward: 140 },
  { id: "combo_10_week", kind: "combo", title: "10콤보 달성", target: 10, reward: 130, mode: "max" },
];

const PACE_MILESTONES = [
  { days: 1, reward: 25 },
  { days: 3, reward: 55 },
  { days: 5, reward: 100 },
];

const MANAGER_LEVELS = [
  { level: 1, xp: 0, title: "신입 점장", unlock: "Lv.2 · 아쿠아 타일과 꽃화분" },
  { level: 2, xp: 180, title: "동네 점장", unlock: "Lv.3 · 오션 벽지와 희귀 평론가" },
  { level: 3, xp: 450, title: "숙련 점장", unlock: "Lv.4 · 선셋 체크 바닥" },
  { level: 4, xp: 850, title: "인기 점장", unlock: "Lv.5 · 명성 보너스 칭호" },
  { level: 5, xp: 1350, title: "스타 점장", unlock: "Lv.6 · 버블타임 마스터" },
  { level: 6, xp: 2000, title: "버블 마스터", unlock: "모든 점장 콘텐츠 해금" },
];

const MANAGEMENT_SCREENS = [
  { id: "shop-modal", icon: "⚙", label: "강화" },
  { id: "achievements-modal", icon: "♛", label: "업적" },
  { id: "codex-modal", icon: "▤", label: "도감" },
  { id: "decor-modal", icon: "✿", label: "꾸미기" },
  { id: "stats-modal", icon: "▥", label: "기록" },
  { id: "settings-modal", icon: "☼", label: "설정" },
];

const STORE_CONDITIONS = {
  rain: { icon: "☂", title: "비 오는 세탁일", copy: "물때가 자주 생기고 손님이 조금 더 찾아옵니다.", guestInterval: 0.94, dirtInterval: 0.92, reward: 1, limescaleBias: 0.62 },
  weekend: { icon: "%", title: "주말 할인 행사", copy: "손님이 빠르게 몰리지만 모든 응대 점수가 20% 증가합니다.", guestInterval: 0.88, dirtInterval: 1, reward: 1.2, limescaleBias: 0 },
  inspection: { icon: "◆", title: "위생 점검일", copy: "감사관과 위생 검사가 등장합니다. 오염 없는 매장을 유지하세요.", guestInterval: 1, dirtInterval: 1.04, reward: 1.08, limescaleBias: 0 },
};

const WEEKLY_EVENT_RULES = [
  { id: "mechanical", label: "설비 점검 주간", bonus: "breakdown" },
  { id: "utilities", label: "공급 불안정 주간", bonus: "detergent" },
  { id: "crowds", label: "단체 예약 주간", bonus: "group" },
  { id: "hygiene", label: "위생 강화 주간", bonus: "inspection" },
];

const DECORATIONS = [
  { id: "sign_classic", type: "sign", icon: "OPEN", title: "클래식 간판", description: "버블타임의 기본 민트 간판", price: 0 },
  { id: "sign_gold", type: "sign", icon: "★", title: "황금 점장 간판", description: "주간 목표 3개를 모두 달성한 증표", unlock: "weekly" },
  { id: "floor_classic", type: "floor", icon: "▦", title: "클래식 타일", description: "차분한 회백색 매장 바닥", price: 0 },
  { id: "floor_aqua", type: "floor", icon: "≈", title: "아쿠아 타일", description: "물결처럼 시원한 민트 타일", price: 180, unlockLevel: 2 },
  { id: "floor_checker", type: "floor", icon: "▥", title: "선셋 체크", description: "산뜻한 코랄 체크 바닥", price: 260, unlockLevel: 4 },
  { id: "wall_cream", type: "wall", icon: "□", title: "크림 벽지", description: "포근하고 밝은 기본 벽지", price: 0 },
  { id: "wall_ocean", type: "wall", icon: "≋", title: "오션 벽지", description: "깊고 깨끗한 바다색 벽지", price: 220, unlockLevel: 3 },
  { id: "plant_green", type: "plant", icon: "♣", title: "초록 화분", description: "익숙한 행운의 초록 식물", price: 0 },
  { id: "plant_bloom", type: "plant", icon: "✿", title: "버블 꽃화분", description: "매장에 색을 더하는 작은 꽃", price: 160, unlockLevel: 2 },
];

const TUTORIAL_STEPS = [
  { id: "limescale", action: "clean", icon: "💧", kicker: "기본 청소", title: "물때를 닦아볼까요?", copy: "스퀴지를 선택하고 반짝이는 세탁기를 눌러주세요.", tool: "squeegee", machineId: "washer-1" },
  { id: "dust", action: "clean", icon: "☁", kicker: "기본 청소", title: "먼지를 털어내세요", copy: "먼지털이를 선택하고 먼지가 쌓인 건조기를 눌러주세요.", tool: "duster", machineId: "dryer-1" },
  { id: "laundry", action: "clean", icon: "🧦", kicker: "남은 세탁물", title: "빨래를 정리하세요", copy: "빨래 바구니를 선택하고 놓고 간 빨래를 담아주세요.", tool: "basket", machineId: "washer-2" },
  { id: "breakdown", action: "event", icon: "⚙", kicker: "매장 사건", title: "고장 난 기계를 수리하세요", copy: "정비 렌치를 선택하고 톱니 표시가 난 기계를 눌러주세요.", tool: "wrench", machineId: "dryer-2" },
  { id: "blackout", action: "event", icon: "ϟ", kicker: "매장 사건", title: "정전을 복구하세요", copy: "모든 기계가 멈췄어요. 매장 아래쪽 차단기를 눌러주세요." },
  { id: "detergent", action: "event", icon: "▰", kicker: "매장 사건", title: "세제를 채워주세요", copy: "세제 보충통을 선택하고 빈 세제 탱크를 눌러주세요.", tool: "detergent" },
];

const TOOL_INFO = {
  squeegee: { name: "스퀴지", dirt: "limescale" },
  duster: { name: "먼지털이", dirt: "dust" },
  basket: { name: "빨래 바구니", dirt: "laundry" },
  spray: { name: "얼룩 제거제", dirt: "stain" },
  wrench: { name: "정비 렌치", dirt: "breakdown" },
  detergent: { name: "세제 보충통", dirt: "detergent" },
};

const DIRT_INFO = {
  limescale: { name: "물때", icon: "💧", tool: "squeegee" },
  dust: { name: "먼지", icon: "☁", tool: "duster" },
  laundry: { name: "놓고 간 빨래", icon: "🧦", tool: "basket" },
};

const GUEST_COLORS = ["#ff826b", "#5ebfbe", "#efb54a", "#8e9ed8", "#df83ad", "#65aa76"];
const SKIN_COLORS = ["#f2c29c", "#dda778", "#a96f4d", "#f1b989"];
const HAIR_COLORS = ["#3d3532", "#704633", "#212e33", "#b26e3f"];
const WAIT_BUBBLES = ["빨리요!", "기다릴게요", "세탁 부탁!", "오늘도 왔어요", "깨끗하게!", "흠…"];
const CUSTOMER_BUBBLES = {
  impatient: ["빨리 부탁해요!", "시간이 없어요!", "금방 되죠?"],
  regular: ["늘 하던 대로요!", "오늘도 왔어요 ★", "여기가 최고예요"],
  bulk: ["빨래가 아주 많아요", "이것도 전부 부탁해요", "큰 세탁이에요!"],
  collector: ["오늘의 세탁소는?", "평가하러 왔어요 ◆", "깨끗함을 보여주세요"],
};

const ACHIEVEMENTS = [
  { id: "first_shift", icon: "OPEN", title: "첫 영업", description: "영업을 한 번 완주하기", reward: 40 },
  { id: "spotless", icon: "✦", title: "무환불 점장", description: "환불 없이 영업을 완주하기", reward: 80 },
  { id: "combo_10", icon: "⚡", title: "번개 청소", description: "10콤보 달성하기", reward: 90 },
  { id: "clean_50", icon: "✓", title: "청결 달인", description: "오염을 누적 50개 청소하기", reward: 70 },
  { id: "regular_10", icon: "★", title: "단골 맛집", description: "단골 손님 10명 응대하기", reward: 60 },
  { id: "bulk_10", icon: "▦", title: "대량 세탁 전문가", description: "대량 세탁 손님 10명 응대하기", reward: 70 },
  { id: "earn_1000", icon: "◈", title: "알뜰한 경영자", description: "영업 수익을 누적 1,000 모으기", reward: 120 },
];

const DAILY_CHALLENGES = [
  { id: "clean_12", kind: "clean", title: "오염 12개 청소하기", target: 12 },
  { id: "regular_4", kind: "regular", title: "단골 손님 4명 응대하기", target: 4 },
  { id: "bulk_3", kind: "bulk", title: "대량 세탁 손님 3명 응대하기", target: 3 },
  { id: "combo_6", kind: "combo", title: "6콤보 달성하기", target: 6, mode: "max" },
  { id: "happy_10", kind: "happy", title: "만족 손님 10명 만들기", target: 10 },
];

const SHIFT_OBJECTIVES = [
  { id: "clean_6", icon: "✦", title: "오염 6개 청소", copy: "오염을 발견하는 즉시 정리하세요.", kind: "cleaned", target: 6, coins: 35, xp: 20 },
  { id: "combo_6", icon: "⚡", title: "6콤보 달성", copy: "오염 발생 후 빠르게 이어서 청소하세요.", kind: "combo", target: 6, coins: 40, xp: 25 },
  { id: "happy_6", icon: "♥", title: "만족 손님 6명", copy: "깨끗한 빈 기계를 꾸준히 확보하세요.", kind: "happy", target: 6, coins: 40, xp: 25 },
  { id: "fast_event", icon: "ϟ", title: "사건 3초 내 해결", copy: "사건 예고를 보고 필요한 위치를 준비하세요.", kind: "fastEvent", target: 1, coins: 45, xp: 30 },
  { id: "refundless", icon: "↩", title: "환불 없이 완주", copy: "오염된 기계가 손님을 받지 않도록 관리하세요.", kind: "refundless", target: 1, coins: 55, xp: 35, endOnly: true },
  { id: "queue_control", icon: "♟", title: "대기 3명 이하 완주", copy: "단체 손님 전후로 빈 기계를 확보하세요.", kind: "queueControl", target: 1, coins: 50, xp: 30, endOnly: true },
];

const EVENT_INFO = {
  breakdown: { icon: "⚙", title: "기계 고장!", copy: "정비 렌치를 선택하고 고장 난 기계를 눌러 수리하세요." },
  blackout: { icon: "ϟ", title: "매장 정전!", copy: "기계가 모두 멈췄어요. 매장 차단기를 눌러 전기를 복구하세요." },
  detergent: { icon: "▰", title: "세제 부족!", copy: "세제 보충통을 선택하고 빈 세제 탱크를 눌러 채우세요." },
  group: { icon: "♟", title: "단체 손님 도착!", copy: "손님 세 명이 한꺼번에 들어옵니다. 빈 기계를 빠르게 확보하세요." },
  inspection: { icon: "◆", title: "위생 검사!", copy: "검사 시간이 끝나기 전에 매장의 오염을 모두 정리하세요." },
};

const CODEX_CONTENT = {
  customers: [
    { id: "normal", icon: "●", title: "일반 손님", tag: "BALANCED", description: "기본 인내심과 작업 시간을 가진 가장 익숙한 손님입니다." },
    { id: "impatient", icon: "⚡", title: "성격 급한 손님", tag: "FAST", description: "인내심이 42% 짧지만 작업이 빠르고 보상이 15% 높습니다." },
    { id: "regular", icon: "★", title: "단골 손님", tag: "LOYAL", description: "오래 기다려 주며 작업이 조금 빠르고 보상이 30% 높습니다." },
    { id: "bulk", icon: "▦", title: "대량 세탁 손님", tag: "HEAVY", description: "기계를 55% 오래 사용하지만 보상이 65% 높습니다." },
    { id: "collector", icon: "◆", title: "세탁소 평론가", tag: "RARE", description: "드물게 방문하는 손님입니다. 인내심은 짧지만 만족시키면 큰 보상을 줍니다." },
  ],
  dirt: [
    { id: "limescale", icon: "💧", title: "물때", tag: "스퀴지", description: "기계 문에 남은 물때입니다. 스퀴지로 닦아내세요." },
    { id: "dust", icon: "☁", title: "먼지", tag: "먼지털이", description: "기계 안팎에 쌓인 먼지입니다. 먼지털이로 제거하세요." },
    { id: "laundry", icon: "🧦", title: "놓고 간 빨래", tag: "빨래 바구니", description: "손님이 두고 간 세탁물입니다. 빨래 바구니에 담아 정리하세요." },
    { id: "stain", icon: "◆", title: "수상한 얼룩", tag: "얼룩 제거제", description: "일부 손님 옷에 나타납니다. 제거하면 무지개 셔츠와 보너스를 얻습니다." },
  ],
  events: [
    { id: "breakdown", icon: "⚙", title: "기계 고장", tag: "정비 렌치", description: "수리 전까지 해당 기계가 멈춥니다. 정비 렌치로 고장 기계를 누르세요." },
    { id: "blackout", icon: "ϟ", title: "정전", tag: "차단기", description: "모든 기계가 멈춥니다. 매장 차단기를 눌러 즉시 복구하세요." },
    { id: "detergent", icon: "▰", title: "세제 부족", tag: "세제 보충통", description: "새 작업을 받을 수 없습니다. 보충통을 선택해 세제 탱크를 채우세요." },
    { id: "group", icon: "♟", title: "단체 손님", tag: "3명 동시", description: "손님 세 명이 한꺼번에 도착해 대기 줄을 빠르게 늘립니다." },
    { id: "inspection", icon: "◆", title: "위생 검사", tag: "매장 전체", description: "제한 시간 안에 모든 오염을 제거하면 보너스를 받고, 실패하면 점수가 차감됩니다." },
  ],
  upgrades: [
    { id: "machine", icon: "◎", title: "고속 모터", tag: "MACHINE", description: "레벨마다 모든 기계 작업 시간이 8% 짧아집니다." },
    { id: "tool", icon: "✦", title: "프로 청소 키트", tag: "TOOLS", description: "레벨마다 청소 점수 12%, 콤보 판정 시간이 0.35초 늘어납니다." },
  ],
};

const state = {
  running: false,
  paused: false,
  pausedAt: 0,
  seconds: GAME_SECONDS,
  score: 0,
  refunds: 0,
  cleaned: 0,
  served: 0,
  combo: 0,
  maxCombo: 0,
  totalWaitMs: 0,
  waitSamples: 0,
  satisfactionTotal: 0,
  satisfactionCount: 0,
  happyGuests: 0,
  typeCounts: { normal: 0, impatient: 0, regular: 0, bulk: 0, collector: 0 },
  shiftCoins: 0,
  shiftXp: 0,
  shiftReputation: 0,
  shiftObjectives: [],
  objectiveResults: [],
  objectiveRewardCoins: 0,
  objectiveRewardXp: 0,
  lastShiftPlan: null,
  resultUnlockTarget: null,
  resultLeveledUp: false,
  activeEvent: null,
  eventDeck: [],
  lastEventType: null,
  eventTimerScheduled: false,
  queuedEventType: null,
  powerOut: false,
  detergentEmpty: false,
  eventsHandled: { breakdown: 0, blackout: 0, detergent: 0, group: 0, inspection: 0 },
  eventResponseTimes: [],
  dirtCleanCounts: { limescale: 0, dust: 0, laundry: 0, stain: 0 },
  refundCauses: { limescale: 0, dust: 0, laundry: 0 },
  peakQueue: 0,
  selectedTool: "squeegee",
  machines: [],
  queue: [],
  guestSequence: 0,
  timers: new Set(),
  startedAt: 0,
  sound: false,
  audioContext: null,
  musicTimer: null,
  musicStep: 0,
  best: loadBestRecord(),
  progression: loadProgression(),
  returnModal: "intro-modal",
  codexTab: "customers",
  installPrompt: null,
  difficulty: "standard",
  updateRegistration: null,
  reloadForUpdate: false,
  lastFocusedElement: null,
  tutorialActive: false,
  tutorialStep: 0,
  decorTab: "sign",
  condition: null,
  firstShiftHintStep: 0,
};

state.sound = state.progression.preferences.soundEnabled;
state.difficulty = state.progression.preferences.lastDifficulty;

const els = {
  washerGrid: document.querySelector("#washer-grid"),
  dryerGrid: document.querySelector("#dryer-grid"),
  machineTemplate: document.querySelector("#machine-template"),
  guestTemplate: document.querySelector("#guest-template"),
  queueLane: document.querySelector("#queue-lane"),
  emptyQueue: document.querySelector("#empty-queue"),
  movingGuests: document.querySelector("#moving-guests"),
  tools: document.querySelector("#tools"),
  toolButtons: [...document.querySelectorAll(".tool")],
  selectedToolName: document.querySelector("#selected-tool-name"),
  time: document.querySelector("#time-value"),
  timerCard: document.querySelector("#timer-card"),
  score: document.querySelector("#score-value"),
  bestScore: document.querySelector("#best-score-value"),
  bestRank: document.querySelector("#best-rank-value"),
  refunds: document.querySelector("#refund-value"),
  queue: document.querySelector("#queue-value"),
  comboMeter: document.querySelector("#combo-meter"),
  combo: document.querySelector("#combo-value"),
  comboMultiplier: document.querySelector("#combo-multiplier"),
  satisfactionMeter: document.querySelector("#satisfaction-meter"),
  satisfaction: document.querySelector("#satisfaction-value"),
  pips: [...document.querySelectorAll("#guest-pips i")],
  toastRegion: document.querySelector("#toast-region"),
  scorePopRegion: document.querySelector("#score-pop-region"),
  playArea: document.querySelector("#play-area"),
  introModal: document.querySelector("#intro-modal"),
  pauseModal: document.querySelector("#pause-modal"),
  resultModal: document.querySelector("#result-modal"),
  resultCard: document.querySelector("#result-modal .result-card"),
  startButton: document.querySelector("#start-button"),
  confirmStartButton: document.querySelector("#confirm-start-button"),
  restartButton: document.querySelector("#restart-button"),
  resumeButton: document.querySelector("#resume-button"),
  pauseRestartButton: document.querySelector("#pause-restart-button"),
  pauseTime: document.querySelector("#pause-time"),
  pauseScore: document.querySelector("#pause-score"),
  soundButton: document.querySelector("#sound-button"),
  settingsButton: document.querySelector("#settings-button"),
  introSettingsButton: document.querySelector("#intro-settings-button"),
  pauseButton: document.querySelector("#pause-button"),
  shopModal: document.querySelector("#shop-modal"),
  achievementsModal: document.querySelector("#achievements-modal"),
  shopButton: document.querySelector("#shop-button"),
  achievementsButton: document.querySelector("#achievements-button"),
  resultShopButton: document.querySelector("#result-shop-button"),
  resultAchievementsButton: document.querySelector("#result-achievements-button"),
  shopCloseButton: document.querySelector("#shop-close-button"),
  achievementsCloseButton: document.querySelector("#achievements-close-button"),
  buyMachineUpgrade: document.querySelector("#buy-machine-upgrade"),
  buyToolUpgrade: document.querySelector("#buy-tool-upgrade"),
  achievementList: document.querySelector("#achievement-list"),
  detergentStation: document.querySelector("#detergent-station"),
  detergentLevel: document.querySelector("#detergent-level"),
  detergentGauge: document.querySelector("#detergent-gauge"),
  breakerPanel: document.querySelector("#breaker-panel"),
  powerOverlay: document.querySelector("#power-overlay"),
  eventAlert: document.querySelector("#event-alert"),
  eventAlertIcon: document.querySelector("#event-alert-icon"),
  eventAlertTitle: document.querySelector("#event-alert-title"),
  eventAlertCopy: document.querySelector("#event-alert-copy"),
  eventForecast: document.querySelector("#event-forecast"),
  eventForecastIcon: document.querySelector("#event-forecast-icon"),
  eventForecastTitle: document.querySelector("#event-forecast-title"),
  eventForecastCopy: document.querySelector("#event-forecast-copy"),
  eventForecastSeconds: document.querySelector("#event-forecast-seconds"),
  firstShiftGuide: document.querySelector("#first-shift-guide"),
  firstShiftGuideTitle: document.querySelector("#first-shift-guide-title"),
  firstShiftGuideClose: document.querySelector("#first-shift-guide-close"),
  codexModal: document.querySelector("#codex-modal"),
  codexButton: document.querySelector("#codex-button"),
  resultCodexButton: document.querySelector("#result-codex-button"),
  codexCloseButton: document.querySelector("#codex-close-button"),
  codexGrid: document.querySelector("#codex-grid"),
  codexTabs: [...document.querySelectorAll("[data-codex-tab]")],
  settingsModal: document.querySelector("#settings-modal"),
  prepModal: document.querySelector("#prep-modal"),
  helpModal: document.querySelector("#help-modal"),
  updatesModal: document.querySelector("#updates-modal"),
  settingsCloseButton: document.querySelector("#settings-close-button"),
  helpCloseButton: document.querySelector("#help-close-button"),
  updatesCloseButton: document.querySelector("#updates-close-button"),
  helpButton: document.querySelector("#help-button"),
  updatesButton: document.querySelector("#updates-button"),
  resultSettingsButton: document.querySelector("#result-settings-button"),
  bgmVolume: document.querySelector("#bgm-volume"),
  sfxVolume: document.querySelector("#sfx-volume"),
  vibrationSetting: document.querySelector("#vibration-setting"),
  screenShakeSetting: document.querySelector("#screen-shake-setting"),
  reducedMotionSetting: document.querySelector("#reduced-motion-setting"),
  colorAssistSetting: document.querySelector("#color-assist-setting"),
  fullscreenButton: document.querySelector("#fullscreen-button"),
  installButtons: [...document.querySelectorAll(".install-button")],
  installStatus: document.querySelector("#install-status"),
  resetDataButton: document.querySelector("#reset-data-button"),
  prepCloseButton: document.querySelector("#prep-close-button"),
  shiftPlans: [...document.querySelectorAll("[data-difficulty]")],
  prepWeeklyGoals: document.querySelector("#prep-weekly-goals"),
  exportDataButton: document.querySelector("#export-data-button"),
  importDataButton: document.querySelector("#import-data-button"),
  importDataInput: document.querySelector("#import-data-input"),
  saveDataStatus: document.querySelector("#save-data-status"),
  appUpdateBanner: document.querySelector("#app-update-banner"),
  applyUpdateButton: document.querySelector("#apply-update-button"),
  dismissUpdateButton: document.querySelector("#dismiss-update-button"),
  tutorialButton: document.querySelector("#tutorial-button"),
  helpTutorialButton: document.querySelector("#help-tutorial-button"),
  tutorialOverlay: document.querySelector("#tutorial-overlay"),
  tutorialExitButton: document.querySelector("#tutorial-exit-button"),
  tutorialFinishButton: document.querySelector("#tutorial-finish-button"),
  decorModal: document.querySelector("#decor-modal"),
  decorButton: document.querySelector("#decor-button"),
  resultDecorButton: document.querySelector("#result-decor-button"),
  decorCloseButton: document.querySelector("#decor-close-button"),
  decorGrid: document.querySelector("#decor-grid"),
  decorTabs: [...document.querySelectorAll("[data-decor-tab]")],
  statsModal: document.querySelector("#stats-modal"),
  statsCloseButton: document.querySelector("#stats-close-button"),
  managerButton: document.querySelector("#manager-button"),
  resultStatsButton: document.querySelector("#result-stats-button"),
  skipOnboardingButton: document.querySelector("#skip-onboarding-button"),
  screenReaderLive: document.querySelector("#screen-reader-live"),
  highContrastSetting: document.querySelector("#high-contrast-setting"),
  textSizeSetting: document.querySelector("#text-size-setting"),
  shiftObjectivesHud: document.querySelector("#shift-objectives-hud"),
  shiftObjectivesHudList: document.querySelector("#shift-objectives-hud-list"),
  shiftObjectiveList: document.querySelector("#shift-objective-list"),
  resultObjectiveList: document.querySelector("#result-objective-list"),
  resultCelebration: document.querySelector("#result-celebration"),
  newPlanButton: document.querySelector("#new-plan-button"),
  nextDifficultyButton: document.querySelector("#next-difficulty-button"),
  resultUnlockButton: document.querySelector("#result-unlock-button"),
  weatherLayer: document.querySelector("#weather-layer"),
};

function createMachines() {
  state.machines = [];
  els.washerGrid.innerHTML = "";
  els.dryerGrid.innerHTML = "";

  ["washer", "dryer"].forEach((type) => {
    const target = type === "washer" ? els.washerGrid : els.dryerGrid;
    for (let index = 0; index < 6; index += 1) {
      const id = `${type}-${index + 1}`;
      const node = els.machineTemplate.content.firstElementChild.cloneNode(true);
      node.dataset.id = id;
      node.setAttribute("aria-label", `${type === "washer" ? "세탁기" : "건조기"} ${index + 1}, 비어 있음`);
      node.querySelector(".machine-label b").textContent = `${type === "washer" ? "W" : "D"}-${String(index + 1).padStart(2, "0")}`;
      node.addEventListener("click", () => handleMachineClick(id));
      target.appendChild(node);

      state.machines.push({
        id,
        type,
        index,
        el: node,
        dirt: null,
        dirtCreatedAt: 0,
        broken: false,
        brokenAt: 0,
        guest: null,
        cycleStarted: 0,
        cycleDuration: 0,
        cycleTimer: null,
      });
    }
  });
}

function resetGame(options = {}) {
  clearGameTimers();
  stopBgm();
  state.running = false;
  state.paused = false;
  state.pausedAt = 0;
  state.seconds = GAME_SECONDS;
  state.score = 0;
  state.refunds = 0;
  state.cleaned = 0;
  state.served = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.totalWaitMs = 0;
  state.waitSamples = 0;
  state.satisfactionTotal = 0;
  state.satisfactionCount = 0;
  state.happyGuests = 0;
  state.typeCounts = { normal: 0, impatient: 0, regular: 0, bulk: 0, collector: 0 };
  state.shiftCoins = 0;
  state.shiftXp = 0;
  state.shiftReputation = 0;
  state.objectiveResults = [];
  state.objectiveRewardCoins = 0;
  state.objectiveRewardXp = 0;
  state.resultUnlockTarget = null;
  state.resultLeveledUp = false;
  state.activeEvent = null;
  state.eventDeck = [];
  state.lastEventType = null;
  state.eventTimerScheduled = false;
  state.queuedEventType = null;
  state.powerOut = false;
  state.detergentEmpty = false;
  state.eventsHandled = { breakdown: 0, blackout: 0, detergent: 0, group: 0, inspection: 0 };
  state.eventResponseTimes = [];
  state.dirtCleanCounts = { limescale: 0, dust: 0, laundry: 0, stain: 0 };
  state.refundCauses = { limescale: 0, dust: 0, laundry: 0 };
  state.peakQueue = 0;
  state.tutorialActive = false;
  state.tutorialStep = 0;
  state.firstShiftHintStep = 0;
  state.condition = options.condition || currentStoreCondition();
  state.queue = [];
  state.guestSequence = 0;
  state.startedAt = 0;
  els.queueLane.querySelectorAll(".guest").forEach((guest) => guest.remove());
  els.movingGuests.innerHTML = "";
  els.toastRegion.innerHTML = "";
  els.scorePopRegion.innerHTML = "";
  els.timerCard.classList.remove("danger");
  els.powerOverlay.classList.remove("active");
  els.breakerPanel.classList.remove("active");
  els.breakerPanel.setAttribute("aria-label", "전기 차단기");
  document.querySelector("#shop").classList.remove("blackout");
  els.detergentStation.classList.remove("empty", "target-ready");
  els.detergentLevel.textContent = "100%";
  els.detergentGauge.style.width = "100%";
  els.detergentStation.setAttribute("aria-label", "세제 탱크, 현재 100퍼센트");
  els.eventAlert.hidden = true;
  hideEventForecast();
  els.firstShiftGuide.hidden = true;
  els.shiftObjectivesHud.hidden = true;
  els.resultCelebration.innerHTML = "";
  els.resultCelebration.className = "result-celebration";
  els.resultCard.classList.remove("rank-s", "spotless", "level-up");
  els.tutorialOverlay.hidden = true;
  els.pauseModal.classList.remove("open");
  els.pauseModal.setAttribute("aria-hidden", "true");
  els.pauseButton.disabled = true;
  createMachines();
  selectTool("squeegee");
  updateHud();
  updateRecordUi();
  updateProgressionUi();
  applyPreferences();
  applyDecorations();
  applyStoreCondition();
}

function startGame(options = {}) {
  if (!state.shiftObjectives.length) prepareShiftObjectives(true);
  resetGame({ condition: options.condition });
  state.running = true;
  state.startedAt = performance.now();
  els.pauseButton.disabled = false;
  els.introModal.classList.remove("open");
  els.resultModal.classList.remove("open");
  els.resultModal.setAttribute("aria-hidden", "true");
  playTone(520, 0.08, "sine", 0.05);
  showToast("영업 시작! 오염 표시를 잘 살펴보세요.", "good", "✦", 1700);
  renderShiftObjectiveHud();
  scheduleGameLoops(true);
  startBgm();
  showFirstShiftGuide("오염 아이콘을 확인한 뒤 같은 도구를 선택하세요", 0);
}

function startTutorial() {
  resetGame();
  state.running = true;
  state.tutorialActive = true;
  state.tutorialStep = 0;
  state.seconds = GAME_SECONDS;
  els.pauseButton.disabled = true;
  [els.introModal, els.helpModal, els.prepModal, els.resultModal].forEach((modal) => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
  els.tutorialOverlay.hidden = false;
  els.tutorialOverlay.classList.remove("complete");
  els.tutorialExitButton.hidden = false;
  els.tutorialFinishButton.hidden = true;
  prepareTutorialStep();
}

function prepareTutorialStep() {
  const step = TUTORIAL_STEPS[state.tutorialStep];
  if (!step) {
    completeTutorial();
    return;
  }
  state.machines.forEach((machine) => machine.el.classList.remove("tutorial-target"));
  els.detergentStation.classList.remove("tutorial-target");
  els.breakerPanel.classList.remove("tutorial-target");
  document.querySelector("#tutorial-step-number").textContent = String(state.tutorialStep + 1);
  document.querySelector("#tutorial-progress-bar").style.width = `${((state.tutorialStep + 1) / TUTORIAL_STEPS.length) * 100}%`;
  document.querySelector("#tutorial-step-icon").textContent = step.icon;
  document.querySelector("#tutorial-step-kicker").textContent = step.kicker;
  document.querySelector("#tutorial-step-title").textContent = step.title;
  document.querySelector("#tutorial-step-copy").textContent = step.copy;

  if (step.action === "clean") {
    const machine = state.machines.find((item) => item.id === step.machineId);
    makeDirty(machine, step.id);
    machine.el.classList.add("tutorial-target");
  } else if (step.id === "breakdown") {
    const machine = state.machines.find((item) => item.id === step.machineId);
    state.activeEvent = { type: "breakdown", startedAt: performance.now(), targetId: machine.id };
    machine.broken = true;
    machine.brokenAt = performance.now();
    machine.el.classList.add("broken", "tutorial-target");
    machine.el.setAttribute("aria-label", machineAriaLabel(machine));
    showEventAlert("breakdown");
  } else if (step.id === "blackout") {
    state.activeEvent = { type: "blackout", startedAt: performance.now(), targetId: null };
    state.powerOut = true;
    els.powerOverlay.classList.add("active");
    els.breakerPanel.classList.add("active", "tutorial-target");
    els.breakerPanel.setAttribute("aria-label", "전기 차단기, 정전 복구 필요");
    document.querySelector("#shop").classList.add("blackout");
    showEventAlert("blackout");
  } else if (step.id === "detergent") {
    state.activeEvent = { type: "detergent", startedAt: performance.now(), targetId: null };
    state.detergentEmpty = true;
    els.detergentLevel.textContent = "0%";
    els.detergentGauge.style.width = "0%";
    els.detergentStation.classList.add("empty", "target-ready", "tutorial-target");
    els.detergentStation.setAttribute("aria-label", "세제 탱크, 세제 부족, 보충 필요");
    showEventAlert("detergent");
  }
}

function tutorialDidAction(action, id) {
  if (!state.tutorialActive) return;
  const step = TUTORIAL_STEPS[state.tutorialStep];
  if (!step || step.action !== action || step.id !== id) return;
  state.tutorialStep += 1;
  playSuccessJingle();
  scheduleTimeout(prepareTutorialStep, 520);
}

function completeTutorial() {
  state.running = false;
  state.tutorialActive = false;
  state.activeEvent = null;
  hideEventAlert();
  const tutorial = state.progression.tutorial;
  const firstCompletion = !tutorial.rewarded;
  tutorial.completed = true;
  if (!tutorial.rewarded) {
    tutorial.rewarded = true;
    state.progression.wallet += 100;
  }
  saveProgression();
  updateProgressionUi();
  els.tutorialOverlay.classList.add("complete");
  document.querySelector("#tutorial-step-number").textContent = String(TUTORIAL_STEPS.length);
  document.querySelector("#tutorial-progress-bar").style.width = "100%";
  document.querySelector("#tutorial-step-icon").textContent = "★";
  document.querySelector("#tutorial-step-kicker").textContent = "실습 완료";
  document.querySelector("#tutorial-step-title").textContent = "점장 준비가 끝났어요!";
  document.querySelector("#tutorial-step-copy").textContent = firstCompletion ? "모든 기본 업무를 익혔습니다. 첫 완료 보상 100 수익이 지급됐어요." : "모든 기본 업무를 다시 연습했습니다.";
  els.tutorialExitButton.hidden = true;
  els.tutorialFinishButton.hidden = false;
  els.tutorialFinishButton.focus();
}

function exitTutorial() {
  resetGame();
  els.tutorialOverlay.hidden = true;
  els.introModal.classList.add("open");
  els.introModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => els.tutorialButton.focus(), 100);
}

function shiftObjectiveById(id) {
  return SHIFT_OBJECTIVES.find((objective) => objective.id === id);
}

function prepareShiftObjectives(force = false) {
  if (!force && state.shiftObjectives.length) return;
  const liveObjectives = shuffle(SHIFT_OBJECTIVES.filter((objective) => !objective.endOnly));
  const remaining = shuffle(SHIFT_OBJECTIVES.filter((objective) => objective.id !== liveObjectives[0].id));
  state.shiftObjectives = [liveObjectives[0], remaining[0]];
  state.objectiveResults = [];
}

function shiftObjectiveProgress(objective, success = null) {
  const values = {
    cleaned: state.cleaned,
    combo: state.maxCombo,
    happy: state.happyGuests,
    fastEvent: state.eventResponseTimes.filter((item) => item.ms <= 3000).length,
    refundless: success === true && state.refunds === 0 ? 1 : 0,
    queueControl: success === true && state.peakQueue <= 3 ? 1 : 0,
  };
  return Math.min(objective.target, Math.max(0, Number(values[objective.kind]) || 0));
}

function shiftObjectiveStatus(objective, success = null) {
  const progress = shiftObjectiveProgress(objective, success);
  const completed = progress >= objective.target;
  let label = `${progress} / ${objective.target}`;
  if (objective.kind === "refundless" && success === null) label = state.refunds === 0 ? "유지 중" : "실패";
  if (objective.kind === "queueControl" && success === null) label = state.peakQueue <= 3 ? "유지 중" : "실패";
  if (success !== null && objective.endOnly) label = completed ? "완료" : "실패";
  return { objective, progress, completed, label };
}

function evaluateShiftObjectives(success) {
  state.objectiveResults = state.shiftObjectives.map((objective) => shiftObjectiveStatus(objective, success));
  state.objectiveRewardCoins = state.objectiveResults.reduce((sum, result) => sum + (result.completed ? result.objective.coins : 0), 0);
  state.objectiveRewardXp = state.objectiveResults.reduce((sum, result) => sum + (result.completed ? result.objective.xp : 0), 0);
}

function renderShiftObjectiveBriefing() {
  els.shiftObjectiveList.innerHTML = state.shiftObjectives.map((objective) => `<article><span>${objective.icon}</span><div><strong>${objective.title}</strong><small>${objective.copy}</small></div><em>◈ ${objective.coins}<small>+${objective.xp} XP</small></em></article>`).join("");
}

function renderShiftObjectiveHud() {
  const visible = state.running && !state.tutorialActive && state.shiftObjectives.length > 0;
  els.shiftObjectivesHud.hidden = !visible;
  if (!visible) return;
  els.shiftObjectivesHudList.innerHTML = state.shiftObjectives.map((objective) => {
    const status = shiftObjectiveStatus(objective);
    return `<span class="${status.completed ? "completed" : status.label === "실패" ? "failed" : ""}"><i>${objective.icon}</i><b>${objective.title}</b><em>${status.completed ? "완료" : status.label}</em></span>`;
  }).join("");
}

function updatePrepUi() {
  ensureCurrentDaily();
  ensureCurrentWeekly();
  state.condition = currentStoreCondition();
  applyStoreCondition();
  const difficulty = DIFFICULTIES[state.difficulty];
  const averageEventInterval = ((CONFIG.events.intervalMin + CONFIG.events.intervalMax) / 2) * difficulty.eventInterval;
  const expectedEvents = Math.max(1, Math.round((GAME_SECONDS * 1000 - CONFIG.events.initialDelay * difficulty.eventInterval) / averageEventInterval) + 1);
  const dailyDefinition = currentDailyDefinition();
  const daily = state.progression.daily;
  els.shiftPlans.forEach((plan) => {
    const selected = plan.dataset.difficulty === state.difficulty;
    plan.classList.toggle("selected", selected);
    plan.querySelector("input").checked = selected;
  });
  document.querySelector("#prep-risk").textContent = difficulty.risk;
  document.querySelector("#prep-event-count").textContent = String(expectedEvents);
  document.querySelector("#prep-machine-level").textContent = String(state.progression.upgrades.machine);
  document.querySelector("#prep-tool-level").textContent = String(state.progression.upgrades.tool);
  document.querySelector("#prep-daily-title").textContent = dailyDefinition.title;
  document.querySelector("#prep-daily-progress").textContent = daily.completed ? "완료!" : `${daily.progress} / ${dailyDefinition.target}`;
  document.querySelector("#prep-active-days").textContent = String(Math.min(5, state.progression.weekly.activeDays.length));
  document.querySelector("#prep-condition-icon").textContent = state.condition.icon;
  document.querySelector("#prep-condition-title").textContent = state.condition.title;
  document.querySelector("#prep-condition-copy").textContent = state.condition.copy;
  document.querySelector("#prep-weekly-rule").textContent = currentWeeklyEventRule().label;
  renderShiftObjectiveBriefing();
  renderWeeklyGoals();
}

function openPrepModal(fromRestart = false, rerollObjectives = true) {
  state.lastFocusedElement = document.activeElement;
  if (state.running || fromRestart) resetGame();
  prepareShiftObjectives(rerollObjectives || !state.shiftObjectives.length);
  state.returnModal = els.resultModal.classList.contains("open") ? "result-modal" : "intro-modal";
  [els.introModal, els.resultModal, els.pauseModal].forEach((modal) => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  });
  els.prepModal.classList.add("open");
  els.prepModal.setAttribute("aria-hidden", "false");
  updatePrepUi();
  window.setTimeout(() => {
    els.prepModal.querySelector(".modal").scrollTop = 0;
    document.querySelector("#prep-title").focus({ preventScroll: true });
  }, 120);
}

function closePrepModal() {
  els.prepModal.classList.remove("open");
  els.prepModal.setAttribute("aria-hidden", "true");
  const target = document.querySelector(`#${state.returnModal}`) || els.introModal;
  target.classList.add("open");
  target.setAttribute("aria-hidden", "false");
  if (state.lastFocusedElement instanceof HTMLElement) window.setTimeout(() => state.lastFocusedElement.focus(), 80);
}

function confirmPreparedShift() {
  prepareShiftObjectives(false);
  state.progression.preferences.lastDifficulty = state.difficulty;
  saveProgression();
  els.prepModal.classList.remove("open");
  els.prepModal.setAttribute("aria-hidden", "true");
  startGame();
}

function scheduleGameLoops(initial = false) {
  const difficulty = DIFFICULTIES[state.difficulty];
  const condition = state.condition || currentStoreCondition();
  scheduleInterval(tickClock, 250);
  scheduleInterval(processQueue, 420);
  scheduleInterval(updateCycles, 160);
  scheduleTimeout(spawnGuest, (initial ? CONFIG.guest.initialDelay : 900) * difficulty.guestInterval * condition.guestInterval);
  scheduleTimeout(spawnDirt, (initial ? CONFIG.dirt.initialDelay : 1350) * difficulty.dirtInterval * condition.dirtInterval);
  if (!state.activeEvent) scheduleNextEvent((initial ? CONFIG.events.initialDelay : CONFIG.events.resumeDelay) * difficulty.eventInterval);
  else if (state.activeEvent.type === "inspection") scheduleInspectionDeadline();
}

function scheduleInterval(callback, delay) {
  const id = window.setInterval(callback, delay);
  state.timers.add({ id, type: "interval" });
  return id;
}

function scheduleTimeout(callback, delay) {
  const token = { id: 0, type: "timeout" };
  token.id = window.setTimeout(() => {
    state.timers.delete(token);
    callback();
  }, delay);
  state.timers.add(token);
  return token.id;
}

function clearGameTimers() {
  state.timers.forEach((timer) => {
    if (timer.type === "interval") window.clearInterval(timer.id);
    else window.clearTimeout(timer.id);
  });
  state.timers.clear();
  state.eventTimerScheduled = false;
}

function tickClock() {
  if (!state.running || state.paused) return;
  const elapsed = (performance.now() - state.startedAt) / 1000;
  state.seconds = Math.max(0, Math.ceil(GAME_SECONDS - elapsed));
  els.timerCard.classList.toggle("danger", state.seconds <= 10);
  updateHud();
  if (elapsed >= GAME_SECONDS) endGame(true, "time");
}

function scheduleNextEvent(delay = null) {
  if (!state.running || state.paused || state.tutorialActive || state.activeEvent || state.eventTimerScheduled) return;
  const eventDelay = delay ?? randomBetween(CONFIG.events.intervalMin, CONFIG.events.intervalMax) * DIFFICULTIES[state.difficulty].eventInterval;
  const warningDuration = Math.min(CONFIG.events.warningDuration, Math.max(900, eventDelay - 500));
  const eventType = state.queuedEventType || nextEventType();
  state.queuedEventType = eventType;
  state.eventTimerScheduled = true;
  scheduleTimeout(() => {
    if (!state.running || state.paused) return;
    showEventForecast(eventType, warningDuration);
    scheduleTimeout(() => {
      state.eventTimerScheduled = false;
      triggerRandomEvent(eventType);
    }, warningDuration);
  }, Math.max(0, eventDelay - warningDuration));
}

function nextEventType() {
  if (!state.eventDeck.length) {
    const weeklyRule = currentWeeklyEventRule();
    const eventPool = ["breakdown", "blackout", "detergent", "group", "inspection", weeklyRule.bonus];
    if (state.condition?.id === "inspection") eventPool.push("inspection");
    state.eventDeck = shuffle(eventPool);
  }
  const alternateIndex = state.eventDeck.findIndex((type) => type !== state.lastEventType);
  const index = alternateIndex >= 0 ? alternateIndex : 0;
  const [type] = state.eventDeck.splice(index, 1);
  state.lastEventType = type;
  return type;
}

function triggerRandomEvent(forcedType = null) {
  if (!state.running || state.paused || state.activeEvent) return;
  const type = forcedType || state.queuedEventType || nextEventType();
  state.queuedEventType = null;
  hideEventForecast();
  discoverEntry("events", type);

  if (type === "group") {
    showEventAlert(type);
    const groupSize = Math.max(2, CONFIG.events.groupSize + DIFFICULTIES[state.difficulty].groupBonus);
    const safeSlots = Math.max(0, MAX_QUEUE - 1 - state.queue.length);
    const arrivingGuests = Math.min(groupSize, safeSlots);
    for (let index = 0; index < arrivingGuests && state.running; index += 1) enqueueGuest();
    if (arrivingGuests < groupSize) showToast("혼잡해 일부 단체 손님은 다음 차례로 안내했어요.", "good", "♟", 1400);
    state.eventsHandled.group += 1;
    advanceWeeklyGoal("event", 1);
    scheduleTimeout(hideEventAlert, 2300);
    scheduleNextEvent();
    return;
  }

  state.activeEvent = { type, startedAt: performance.now(), targetId: null };
  showEventAlert(type);

  if (type === "breakdown") {
    const available = state.machines.filter((machine) => !machine.broken);
    const busy = available.filter((machine) => machine.guest);
    const machine = pick(busy.length ? busy : available);
    if (!machine) {
      state.activeEvent = null;
      hideEventAlert();
      scheduleNextEvent(1200);
      return;
    }
    state.activeEvent.targetId = machine.id;
    machine.broken = true;
    machine.brokenAt = performance.now();
    machine.el.classList.add("broken");
    machine.el.setAttribute("aria-label", machineAriaLabel(machine));
  } else if (type === "blackout") {
    state.powerOut = true;
    els.powerOverlay.classList.add("active");
    els.breakerPanel.classList.add("active");
    els.breakerPanel.setAttribute("aria-label", "전기 차단기, 정전 복구 필요");
    document.querySelector("#shop").classList.add("blackout");
  } else if (type === "detergent") {
    state.detergentEmpty = true;
    els.detergentLevel.textContent = "0%";
    els.detergentGauge.style.width = "0%";
    els.detergentStation.classList.add("empty", "target-ready");
    els.detergentStation.setAttribute("aria-label", "세제 탱크, 세제 부족, 보충 필요");
  } else if (type === "inspection") {
    const candidates = shuffle(state.machines.filter((machine) => !machine.dirt && !machine.broken));
    candidates.slice(0, Math.max(0, 2 - dirtyMachineCount())).forEach((machine, index) => {
      makeDirty(machine, index % 2 === 0 ? "dust" : "limescale");
    });
    scheduleInspectionDeadline();
  }
  playEventAlarm(type);
}

function scheduleInspectionDeadline() {
  if (!state.activeEvent || state.activeEvent.type !== "inspection") return;
  const inspectionStartedAt = state.activeEvent.startedAt;
  const remaining = Math.max(0, 7000 - (performance.now() - inspectionStartedAt));
  scheduleTimeout(() => {
    if (!state.activeEvent || state.activeEvent.type !== "inspection" || state.activeEvent.startedAt !== inspectionStartedAt) return;
    state.activeEvent = null;
    changeScore(-260);
    hideEventAlert();
    showToast("위생 검사에 실패해 260점이 차감됐어요!", "bad", "◆", 1600);
    playRefundSound();
    shakePlayArea();
    scheduleNextEvent();
  }, remaining);
}

function checkInspectionCompletion() {
  if (!state.activeEvent || state.activeEvent.type !== "inspection" || dirtyMachineCount() > 0) return;
  finishStoreEvent("inspection", 280, document.querySelector("#shop-floor").getBoundingClientRect(), "위생 검사 통과!");
}

function showEventAlert(type) {
  const info = EVENT_INFO[type];
  els.eventAlertIcon.textContent = info.icon;
  els.eventAlertTitle.textContent = info.title;
  els.eventAlertCopy.textContent = info.copy;
  els.eventAlert.dataset.event = type;
  els.eventAlert.hidden = false;
  els.eventAlert.classList.remove("arrive");
  void els.eventAlert.offsetWidth;
  els.eventAlert.classList.add("arrive");
}

function showEventForecast(type, duration) {
  const info = EVENT_INFO[type];
  if (!info) return;
  const seconds = Math.max(1, Math.ceil(duration / 1000));
  els.eventForecastIcon.textContent = info.icon;
  els.eventForecastTitle.textContent = info.title.replace("!", " 예고");
  els.eventForecastCopy.textContent = info.copy;
  els.eventForecastSeconds.textContent = String(seconds);
  els.eventForecast.dataset.event = type;
  els.eventForecast.hidden = false;
  els.eventForecast.style.setProperty("--forecast-duration", `${duration}ms`);
  els.eventForecast.classList.remove("arrive");
  void els.eventForecast.offsetWidth;
  els.eventForecast.classList.add("arrive");
  for (let remaining = seconds - 1; remaining >= 1; remaining -= 1) {
    const delay = duration - remaining * 1000;
    if (delay > 0) scheduleTimeout(() => {
      if (!els.eventForecast.hidden) els.eventForecastSeconds.textContent = String(remaining);
    }, delay);
  }
  announce(`${seconds}초 뒤 ${info.title} ${info.copy}`);
  showFirstShiftGuide("사건 예고를 보고 필요한 도구와 위치를 미리 확인하세요", 3);
}

function hideEventForecast() {
  els.eventForecast.hidden = true;
  els.eventForecast.classList.remove("arrive");
  els.eventForecast.removeAttribute("data-event");
}

function announce(message) {
  if (!els.screenReaderLive) return;
  els.screenReaderLive.textContent = "";
  window.setTimeout(() => { els.screenReaderLive.textContent = message; }, 30);
}

function showFirstShiftGuide(title, step = 0) {
  const onboarding = state.progression.onboarding;
  if (!state.running || state.tutorialActive || onboarding.firstShiftComplete || onboarding.hintsDismissed || step < state.firstShiftHintStep) return;
  state.firstShiftHintStep = step;
  els.firstShiftGuideTitle.textContent = title;
  els.firstShiftGuide.hidden = false;
}

function dismissFirstShiftGuide() {
  els.firstShiftGuide.hidden = true;
  state.progression.onboarding.hintsDismissed = true;
  saveProgression();
}

function hideEventAlert() {
  els.eventAlert.hidden = true;
  els.eventAlert.removeAttribute("data-event");
}

function resolveBreakdown(machine) {
  if (!state.activeEvent || state.activeEvent.type !== "breakdown" || state.activeEvent.targetId !== machine.id) return;
  const downtime = performance.now() - machine.brokenAt;
  if (machine.guest) machine.cycleStarted += downtime;
  if (machine.dirt) machine.dirtCreatedAt += downtime;
  machine.broken = false;
  machine.brokenAt = 0;
  machine.el.classList.remove("broken");
  machine.el.setAttribute("aria-label", machineAriaLabel(machine));
  finishStoreEvent("breakdown", CONFIG.events.repairScore, machine.el.getBoundingClientRect(), "기계 수리 완료!");
}

function handleBreakerClick() {
  if (!state.running || state.paused) return;
  if (!state.powerOut || !state.activeEvent || state.activeEvent.type !== "blackout") {
    showToast("전기는 정상이에요.", "good", "ϟ", 850);
    return;
  }
  const downtime = performance.now() - state.activeEvent.startedAt;
  state.machines.forEach((machine) => {
    if (machine.guest) machine.cycleStarted += downtime;
    if (machine.dirt) machine.dirtCreatedAt += downtime;
  });
  state.powerOut = false;
  els.powerOverlay.classList.remove("active");
  els.breakerPanel.classList.remove("active");
  els.breakerPanel.setAttribute("aria-label", "전기 차단기");
  document.querySelector("#shop").classList.remove("blackout");
  finishStoreEvent("blackout", CONFIG.events.powerScore, els.breakerPanel.getBoundingClientRect(), "전기 복구 완료!");
}

function handleDetergentClick() {
  if (!state.running || state.paused) return;
  if (!state.detergentEmpty || !state.activeEvent || state.activeEvent.type !== "detergent") {
    showToast("세제 탱크가 이미 가득 차 있어요.", "good", "▰", 900);
    return;
  }
  if (state.selectedTool !== "detergent") {
    showToast("세제 보충통을 선택한 뒤 탱크를 눌러주세요!", "bad", "!", 1300);
    return;
  }
  state.detergentEmpty = false;
  els.detergentLevel.textContent = "100%";
  els.detergentGauge.style.width = "100%";
  els.detergentStation.classList.remove("empty", "target-ready");
  els.detergentStation.setAttribute("aria-label", "세제 탱크, 현재 100퍼센트");
  finishStoreEvent("detergent", CONFIG.events.refillScore, els.detergentStation.getBoundingClientRect(), "세제 보충 완료!");
}

function finishStoreEvent(type, points, rect, message) {
  if (state.activeEvent?.type === type) {
    state.eventResponseTimes.push({ type, ms: performance.now() - state.activeEvent.startedAt });
  }
  state.eventsHandled[type] += 1;
  advanceWeeklyGoal("event", 1);
  state.activeEvent = null;
  changeScore(points);
  scorePop(rect, `+${points}`);
  cleanBurst(rect, type);
  hideEventAlert();
  showToast(message, "good", "✓", 1150);
  playCleanSound(type, state.combo);
  scheduleNextEvent();
  tutorialDidAction("event", type);
}

function playEventAlarm(type) {
  vibrate(type === "group" ? [18, 25, 18] : [35, 35, 35]);
  shakePlayArea();
  if (type === "group") {
    playTone(480, 0.08, "sine", 0.04);
    playTone(620, 0.1, "sine", 0.035, 0.09);
    return;
  }
  playTone(type === "blackout" ? 115 : 190, 0.16, "square", 0.032);
  playTone(type === "detergent" ? 330 : 150, 0.19, "sawtooth", 0.026, 0.15);
}

function spawnGuest() {
  if (!state.running || state.paused) return;

  const progress = 1 - state.seconds / GAME_SECONDS;
  enqueueGuest();

  if (!state.running) return;
  const base = CONFIG.guest.spawnStart + (CONFIG.guest.spawnEnd - CONFIG.guest.spawnStart) * progress;
  const conditionInterval = state.condition?.guestInterval || 1;
  const nextDelay = Math.max(900, (base + randomBetween(-CONFIG.guest.spawnJitter, CONFIG.guest.spawnJitter)) * DIFFICULTIES[state.difficulty].guestInterval * conditionInterval);
  scheduleTimeout(spawnGuest, nextDelay);
}

function enqueueGuest() {
  if (!state.running || state.paused) return null;
  const guest = makeGuest();
  state.queue.push(guest);
  els.emptyQueue.hidden = true;
  els.queueLane.appendChild(guest.el);
  updateQueueVisuals();
  if (state.queue.length >= 3) showFirstShiftGuide("대기 손님이 3명입니다. 깨끗한 빈 기계를 먼저 확보하세요", 2);
  playTone(330, 0.035, "sine");

  if (state.queue.length >= MAX_QUEUE) {
    endGame(false, "queue");
    return guest;
  }
  return guest;
}

function makeGuest() {
  const id = ++state.guestSequence;
  const el = els.guestTemplate.content.firstElementChild.cloneNode(true);
  const type = chooseCustomerType();
  const typeInfo = CONFIG.customerTypes[type];
  const stained = Math.random() < CONFIG.guest.stainedChance;
  const shirt = pick(GUEST_COLORS);
  const skin = pick(SKIN_COLORS);
  const hair = pick(HAIR_COLORS);
  const arrivedAt = performance.now();

  discoverEntry("customers", type);
  if (stained) discoverEntry("dirt", "stain");

  el.dataset.id = String(id);
  el.dataset.customerType = type;
  el.classList.add(`guest-${type}`);
  el.style.setProperty("--shirt", shirt);
  el.style.setProperty("--skin", skin);
  el.style.setProperty("--hair", hair);
  el.classList.toggle("stained", stained);
  el.querySelector(".guest-type-badge").textContent = typeInfo.icon;
  el.querySelector(".guest-type-badge").setAttribute("title", typeInfo.label);
  el.querySelector(".guest-bubble").textContent = stained
    ? "이 얼룩… 뭘까?"
    : CUSTOMER_BUBBLES[type]
      ? pick(CUSTOMER_BUBBLES[type])
      : pick(WAIT_BUBBLES);
  el.setAttribute("aria-label", stained ? `옷에 수상한 얼룩이 있는 ${typeInfo.label}` : `대기 중인 ${typeInfo.label}`);
  el.addEventListener("click", () => handleGuestClick(id));

  return {
    id,
    el,
    type,
    stained,
    cleaned: false,
    shirt,
    skin,
    hair,
    arrivedAt,
    patienceMs: CONFIG.guest.patience * typeInfo.patience * DIFFICULTIES[state.difficulty].patience,
    cycleMultiplier: typeInfo.cycle,
    rewardMultiplier: typeInfo.reward,
  };
}

function chooseCustomerType() {
  const weeklyRule = currentWeeklyEventRule();
  const collectorUnlocked = managerLevelInfo().level >= 3;
  const collectorChance = collectorUnlocked ? (state.condition?.id === "inspection" ? 0.055 : weeklyRule.id === "hygiene" ? 0.03 : 0.012) : 0;
  if (Math.random() < collectorChance) return "collector";
  const roll = Math.random();
  let cumulative = 0;
  for (const [type, info] of Object.entries(CONFIG.customerTypes)) {
    cumulative += info.weight;
    if (roll <= cumulative) return type;
  }
  return "normal";
}

function processQueue() {
  if (!state.running || state.paused) return;

  const now = performance.now();
  state.queue.forEach((guest) => {
    const waited = (now - guest.arrivedAt) / 1000;
    const patience = Math.max(0, 1 - (waited * 1000) / guest.patienceMs);
    const bar = guest.el.querySelector(".guest-patience i");
    bar.style.transform = `scaleX(${patience})`;
    guest.el.classList.toggle("impatient", patience < 0.36);
    if (patience < 0.36 && !guest.stained) guest.el.querySelector(".guest-bubble").textContent = "아직 멀었나요?";
  });

  if (state.powerOut || state.detergentEmpty) return;

  const freeMachines = state.machines.filter((machine) => !machine.guest && !machine.dirt && !machine.broken);
  const readyGuests = state.queue.filter((guest) => now - guest.arrivedAt >= CONFIG.guest.minimumWait);
  if (!freeMachines.length || !readyGuests.length) return;

  const guest = state.queue.shift();
  const machine = pick(freeMachines);
  guest.waitMs = now - guest.arrivedAt;
  guest.satisfaction = calculateGuestSatisfaction(guest.waitMs, guest.cleaned, guest.patienceMs);
  state.totalWaitMs += guest.waitMs;
  state.waitSamples += 1;
  guest.el.remove();
  updateQueueVisuals();
  beginCycle(machine, guest);
}

function beginCycle(machine, guest) {
  machine.guest = guest;
  machine.cycleStarted = performance.now();
  const machineSpeed = 1 - state.progression.upgrades.machine * CONFIG.upgrades.machineSpeedPerLevel;
  machine.cycleDuration = randomBetween(CONFIG.machine.cycleMin, CONFIG.machine.cycleMax) * guest.cycleMultiplier * machineSpeed * DIFFICULTIES[state.difficulty].cycle;
  machine.el.classList.add("busy");
  machine.el.querySelector(".machine-label small").textContent = guest.type === "bulk" ? "대량 세탁 중" : "작동 중";
  machine.el.classList.toggle("bulk-cycle", guest.type === "bulk");
  machine.el.setAttribute("aria-label", machineAriaLabel(machine));
  animateWalker(guest, machine, "in");
}

function updateCycles() {
  if (!state.running || state.paused || state.powerOut) return;
  const now = performance.now();
  state.machines.forEach((machine) => {
    if (!machine.guest || machine.broken) return;
    const progress = Math.min(1, (now - machine.cycleStarted) / machine.cycleDuration);
    machine.el.querySelector(".cycle-bar i").style.width = `${progress * 100}%`;
    if (progress >= 1) finishCycle(machine);
  });
}

function finishCycle(machine) {
  if (!machine.guest) return;
  const guest = machine.guest;
  const hadDirt = Boolean(machine.dirt);
  machine.guest = null;
  machine.cycleStarted = 0;
  machine.cycleDuration = 0;
  machine.el.classList.remove("busy", "bulk-cycle");
  machine.el.querySelector(".cycle-bar i").style.width = "0%";
  machine.el.querySelector(".machine-label small").textContent = hadDirt ? DIRT_INFO[machine.dirt].name : "비어 있음";
  machine.el.setAttribute("aria-label", machineAriaLabel(machine));

  if (hadDirt) {
    state.refundCauses[machine.dirt] += 1;
    state.refunds += 1;
    recordSatisfaction(0);
    breakCombo();
    changeScore(-300);
    showToast(`${machineName(machine)}가 더러워 환불했어요!`, "bad", "↩");
    playRefundSound();
    vibrate([45, 35, 70]);
    shakePlayArea();
  } else {
    state.served += 1;
    advanceWeeklyGoal("serve", 1);
    state.typeCounts[guest.type] += 1;
    recordSatisfaction(guest.satisfaction);
    const satisfactionBonus = Math.round(guest.satisfaction * 0.6);
    const conditionReward = state.condition?.reward || 1;
    const servicePoints = Math.round((160 + satisfactionBonus + (guest.cleaned ? 120 : 0)) * guest.rewardMultiplier * conditionReward);
    changeScore(servicePoints);
    if (guest.satisfaction >= CONFIG.satisfaction.happyThreshold) {
      advanceDailyChallenge("happy", 1);
      advanceWeeklyGoal("happy", 1);
    }
    if (guest.type === "regular" || guest.type === "bulk") advanceDailyChallenge(guest.type, 1);
    const guestMessage = guest.type === "collector"
      ? "세탁소 평론가가 높은 점수를 남겼어요!"
      : guest.type === "regular"
      ? "단골 손님이 다음에도 오겠다고 했어요!"
      : guest.type === "bulk"
        ? "대량 세탁 완료! 수익이 크게 올랐어요."
        : guest.cleaned
      ? "반짝 손님이 만족하고 돌아갔어요!"
      : guest.satisfaction >= CONFIG.satisfaction.happyThreshold
        ? "아주 만족한 손님이 돌아갔어요!"
        : "조금 기다렸지만 세탁을 마쳤어요.";
    const guestIcon = guest.type === "collector" ? "◆" : guest.type === "regular" ? "★" : guest.type === "bulk" ? "▦" : guest.cleaned ? "✦" : guest.satisfaction >= CONFIG.satisfaction.happyThreshold ? "♥" : "☺";
    showToast(guestMessage, "good", guestIcon, 1150);
    playTone(650, 0.08, "sine", 0.035);
  }

  animateWalker(guest, machine, "out");
  updateHud();

  if (Math.random() < CONFIG.dirt.leftoverChance && !machine.dirt && dirtyMachineCount() < maximumDirtyMachines()) {
    scheduleTimeout(() => {
      if (state.running && !machine.dirt) makeDirty(machine, "laundry");
    }, CONFIG.dirt.leftoverDelay);
  }
}

function spawnDirt() {
  if (!state.running || state.paused) return;
  const cleanMachines = state.machines.filter((machine) => !machine.dirt && !machine.broken);
  const dirtyCount = state.machines.length - cleanMachines.length;

  if (cleanMachines.length && dirtyCount < maximumDirtyMachines()) {
    const machine = pick(cleanMachines);
    const rainBias = state.condition?.id === "rain" && Math.random() < state.condition.limescaleBias;
    const types = rainBias ? ["limescale"] : machine.guest && Math.random() < 0.5 ? ["limescale", "dust"] : Object.keys(DIRT_INFO);
    makeDirty(machine, pick(types));
  }

  const progress = 1 - state.seconds / GAME_SECONDS;
  const base = CONFIG.dirt.spawnStart + (CONFIG.dirt.spawnEnd - CONFIG.dirt.spawnStart) * progress;
  const conditionInterval = state.condition?.dirtInterval || 1;
  const delay = Math.max(2500, (base + randomBetween(-CONFIG.dirt.spawnJitterEarly, CONFIG.dirt.spawnJitterLate)) * DIFFICULTIES[state.difficulty].dirtInterval * conditionInterval);
  scheduleTimeout(spawnDirt, delay);
}

function dirtyMachineCount() {
  return state.machines.reduce((count, machine) => count + (machine.dirt ? 1 : 0), 0);
}

function maximumDirtyMachines() {
  return Math.max(5, CONFIG.dirt.maxDirty + DIFFICULTIES[state.difficulty].dirtyBonus);
}

function makeDirty(machine, dirt) {
  if (!state.running || state.paused || machine.dirt || dirtyMachineCount() >= maximumDirtyMachines()) return;
  machine.dirt = dirt;
  machine.dirtCreatedAt = performance.now();
  discoverEntry("dirt", dirt);
  const info = DIRT_INFO[dirt];
  machine.el.classList.add("dirty");
  machine.el.dataset.dirt = dirt;
  machine.el.querySelector(".contamination b").textContent = info.icon;
  machine.el.querySelector(".contamination small").textContent = dirtDisplayLabel(dirt);
  machine.el.querySelector(".machine-label small").textContent = info.name;
  machine.el.setAttribute("aria-label", machineAriaLabel(machine));
  playTone(240, 0.04, "square");
  showFirstShiftGuide(`${info.name}에는 ${TOOL_INFO[info.tool].name}를 사용하세요`, 1);
}

function handleMachineClick(id) {
  if (!state.running || state.paused) return;
  const machine = state.machines.find((item) => item.id === id);
  if (!machine) return;

  if (state.powerOut) {
    showToast("정전 중에는 기계를 사용할 수 없어요. 차단기를 확인하세요!", "bad", "ϟ", 1300);
    return;
  }

  if (machine.broken) {
    if (state.selectedTool === "wrench") resolveBreakdown(machine);
    else penalizeWrong(machine.el, "고장 난 기계에는 정비 렌치가 필요해요!", 100);
    return;
  }

  if (!machine.dirt) {
    penalizeWrong(machine.el, "깨끗한 기계예요. 다른 곳을 확인하세요!", 60);
    return;
  }

  const dirt = DIRT_INFO[machine.dirt];
  if (dirt.tool !== state.selectedTool) {
    penalizeWrong(machine.el, `${dirt.name}에는 ${TOOL_INFO[dirt.tool].name}가 필요해요!`, 100);
    return;
  }

  const rect = machine.el.getBoundingClientRect();
  const cleanElapsed = performance.now() - machine.dirtCreatedAt;
  const combo = registerCleanCombo(cleanElapsed);
  const toolBonus = 1 + state.progression.upgrades.tool * CONFIG.upgrades.toolScorePerLevel;
  const earnedPoints = Math.round(140 * toolBonus * combo.multiplier);
  state.dirtCleanCounts[machine.dirt] += 1;
  machine.dirt = null;
  machine.dirtCreatedAt = 0;
  delete machine.el.dataset.dirt;
  machine.el.classList.remove("dirty");
  machine.el.classList.add("clean-hit");
  machine.el.querySelector(".machine-label small").textContent = machine.guest ? "작동 중" : "비어 있음";
  machine.el.setAttribute("aria-label", machineAriaLabel(machine));
  window.setTimeout(() => machine.el.classList.remove("clean-hit"), 480);
  state.cleaned += 1;
  advanceDailyChallenge("clean", 1);
  advanceWeeklyGoal("clean", 1);
  changeScore(earnedPoints);
  scorePop(rect, `+${earnedPoints}`);
  if (combo.fast) comboPop(rect, combo.multiplier);
  cleanBurst(rect, dirt.tool);
  showToast(combo.fast && state.combo >= 2 ? `${dirt.name} 제거 · ${state.combo} COMBO!` : `${dirt.name} 제거 완료!`, "good", "✓", 950);
  playCleanSound(dirt.tool, state.combo);
  vibrate(12);
  tutorialDidAction("clean", dirt.tool === "squeegee" ? "limescale" : dirt.tool === "duster" ? "dust" : "laundry");
  checkInspectionCompletion();
}

function handleGuestClick(id) {
  if (!state.running || state.paused) return;
  const guest = state.queue.find((item) => item.id === id);
  if (!guest) return;

  if (state.selectedTool === "spray" && guest.stained && !guest.cleaned) {
    guest.cleaned = true;
    guest.stained = false;
    guest.el.classList.remove("stained");
    guest.el.classList.add("sparkled");
    guest.el.querySelector(".guest-bubble").textContent = "우와, 무지개 셔츠!";
    guest.el.setAttribute("aria-label", "얼룩을 지워 반짝이는 손님");
    state.dirtCleanCounts.stain += 1;
    const rect = guest.el.getBoundingClientRect();
    const combo = registerCleanCombo(performance.now() - guest.arrivedAt);
    const earnedPoints = Math.round(450 * combo.multiplier);
    changeScore(earnedPoints);
    scorePop(rect, `+${earnedPoints}`);
    if (combo.fast) comboPop(rect, combo.multiplier);
    cleanBurst(rect, "rainbow");
    showToast("이스터 에그! 얼룩이 무지개로 변했어요 ✦", "secret", "🌈", 2300);
    playSecretJingle();
    return;
  }

  if (state.selectedTool === "spray" && guest.cleaned) {
    showToast("이미 반짝반짝한 손님이에요!", "good", "✦", 900);
    return;
  }

  penalizeWrong(guest.el, guest.stained ? "얼룩에는 얼룩 제거제를 써보세요!" : "일반 손님에게 청소 도구를 쓰면 벌금이에요!", 120);
}

function penalizeWrong(element, message, amount) {
  element.classList.remove("wrong-hit");
  void element.offsetWidth;
  element.classList.add("wrong-hit");
  window.setTimeout(() => element.classList.remove("wrong-hit"), 420);
  const rect = element.getBoundingClientRect();
  breakCombo();
  changeScore(-amount);
  scorePop(rect, `-${amount}`, true);
  showToast(message, "bad", "!", 1400);
  playTone(165, 0.08, "square");
  vibrate([20, 30, 20]);
  shakePlayArea();
}

function animateWalker(guest, machine, direction) {
  const walker = document.createElement("span");
  walker.className = "walker";
  walker.style.setProperty("--shirt", guest.shirt);
  walker.style.setProperty("--skin", guest.skin);
  walker.style.setProperty("--hair", guest.hair);
  walker.innerHTML = "<i></i><b></b>";
  els.movingGuests.appendChild(walker);

  const floorRect = document.querySelector("#shop-floor").getBoundingClientRect();
  const machineRect = machine.el.getBoundingClientRect();
  const targetX = machineRect.left - floorRect.left + machineRect.width / 2 - 28;
  const targetY = floorRect.bottom - machineRect.bottom + 12;

  if (direction === "in") {
    walker.style.setProperty("--walk-x", `${targetX}px`);
    walker.style.setProperty("--walk-y", `${-targetY}px`);
    requestAnimationFrame(() => walker.classList.add("go-in"));
    window.setTimeout(() => walker.remove(), 920);
  } else {
    walker.style.left = `${targetX + 16}px`;
    walker.style.bottom = `${targetY + 35}px`;
    requestAnimationFrame(() => walker.classList.add("go-out"));
    window.setTimeout(() => walker.remove(), 920);
  }
}

function machineAriaLabel(machine) {
  const type = machine.type === "washer" ? "세탁기" : "건조기";
  const number = machine.index + 1;
  const status = machine.broken
    ? "고장, 정비 필요"
    : machine.dirt
      ? `${DIRT_INFO[machine.dirt].name} 오염`
      : machine.guest
        ? "작동 중, 깨끗함"
        : "비어 있음, 깨끗함";
  return `${type} ${number}, ${status}`;
}

function machineName(machine) {
  return `${machine.type === "washer" ? "세탁기" : "건조기"} ${machine.index + 1}번`;
}

function calculateGuestSatisfaction(waitMs, cleaned, patienceMs = CONFIG.guest.patience) {
  const waitRatio = Math.min(1, waitMs / patienceMs);
  const waitPenalty = Math.round(waitRatio * CONFIG.satisfaction.maximumWaitPenalty);
  const stainedBonus = cleaned ? CONFIG.satisfaction.stainedBonus : 0;
  return Math.min(100, Math.max(CONFIG.satisfaction.minimumServed, 100 - waitPenalty + stainedBonus));
}

function recordSatisfaction(value) {
  state.satisfactionTotal += value;
  state.satisfactionCount += 1;
  if (value >= CONFIG.satisfaction.happyThreshold) state.happyGuests += 1;
}

function averageSatisfaction() {
  return state.satisfactionCount ? Math.round(state.satisfactionTotal / state.satisfactionCount) : 100;
}

function happyGuestRate() {
  return state.satisfactionCount ? Math.round((state.happyGuests / state.satisfactionCount) * 100) : 100;
}

function comboMultiplier(combo = state.combo) {
  if (combo >= CONFIG.combo.tierFour) return 3;
  if (combo >= CONFIG.combo.tierThree) return 2;
  if (combo >= CONFIG.combo.tierTwo) return 1.5;
  return 1;
}

function registerCleanCombo(elapsedMs) {
  const comboWindow = CONFIG.combo.fastWindow + state.progression.upgrades.tool * CONFIG.upgrades.comboWindowPerLevel;
  const fast = elapsedMs <= comboWindow;
  if (fast) {
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    setDailyChallengeMaximum("combo", state.maxCombo);
    setWeeklyGoalMaximum("combo", state.maxCombo);
  } else {
    breakCombo();
  }
  updateHud();
  return { fast, multiplier: comboMultiplier() };
}

function breakCombo() {
  if (!state.combo) return;
  state.combo = 0;
  els.comboMeter.classList.remove("combo-break");
  void els.comboMeter.offsetWidth;
  els.comboMeter.classList.add("combo-break");
  window.setTimeout(() => els.comboMeter.classList.remove("combo-break"), 420);
  updateHud();
}

function updateQueueVisuals() {
  const count = state.queue.length;
  state.peakQueue = Math.max(state.peakQueue, count);
  els.queue.textContent = String(count);
  els.emptyQueue.hidden = count > 0;
  els.pips.forEach((pip, index) => {
    pip.classList.toggle("active", index < count);
    pip.classList.toggle("danger", index < count && count >= 5);
  });
}

function updateHud() {
  els.time.textContent = String(state.seconds);
  els.score.textContent = state.score.toLocaleString("ko-KR");
  els.refunds.textContent = String(state.refunds);
  const multiplier = comboMultiplier();
  const satisfaction = averageSatisfaction();
  els.combo.textContent = String(state.combo);
  els.comboMultiplier.textContent = `×${multiplier.toFixed(1)}`;
  els.comboMeter.dataset.tier = multiplier >= 3 ? "4" : multiplier >= 2 ? "3" : multiplier >= 1.5 ? "2" : "1";
  els.comboMeter.classList.toggle("active", state.combo > 0);
  els.satisfaction.textContent = `${satisfaction}%`;
  els.satisfactionMeter.classList.toggle("warning", satisfaction < 80);
  els.satisfactionMeter.classList.toggle("danger", satisfaction < 60);
  updateQueueVisuals();
  renderShiftObjectiveHud();
}

function changeScore(amount) {
  state.score = Math.max(0, state.score + amount);
  els.score.textContent = state.score.toLocaleString("ko-KR");
}

function selectTool(tool) {
  if (!TOOL_INFO[tool]) return;
  state.selectedTool = tool;
  els.toolButtons.forEach((button) => {
    const selected = button.dataset.tool === tool;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  els.selectedToolName.textContent = TOOL_INFO[tool].name;
  playTone(430 + Object.keys(TOOL_INFO).indexOf(tool) * 60, 0.025, "sine");
}

function showToast(message, type = "good", icon = "✓", duration = 1500) {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span>${message}</span>`;
  els.toastRegion.prepend(toast);
  while (els.toastRegion.children.length > 3) els.toastRegion.lastElementChild.remove();
  window.setTimeout(() => {
    toast.classList.add("out");
    window.setTimeout(() => toast.remove(), 260);
  }, duration);
}

function scorePop(rect, text, minus = false) {
  const areaRect = els.playArea.getBoundingClientRect();
  const pop = document.createElement("span");
  pop.className = `score-pop${minus ? " minus" : ""}`;
  pop.textContent = text;
  pop.style.left = `${rect.left - areaRect.left + rect.width / 2 - 18}px`;
  pop.style.top = `${rect.top - areaRect.top + rect.height / 2}px`;
  els.scorePopRegion.appendChild(pop);
  window.setTimeout(() => pop.remove(), 850);
}

function comboPop(rect, multiplier) {
  const areaRect = els.playArea.getBoundingClientRect();
  const pop = document.createElement("span");
  pop.className = `combo-pop${state.combo >= CONFIG.combo.tierThree ? " hot" : ""}`;
  pop.innerHTML = `<b>${state.combo}</b><span>COMBO</span><em>×${multiplier.toFixed(1)}</em>`;
  pop.style.left = `${rect.left - areaRect.left + rect.width / 2 + 18}px`;
  pop.style.top = `${rect.top - areaRect.top + rect.height / 2 - 18}px`;
  els.scorePopRegion.appendChild(pop);
  window.setTimeout(() => pop.remove(), 900);
}

function cleanBurst(rect, theme) {
  const areaRect = els.playArea.getBoundingClientRect();
  const burst = document.createElement("span");
  burst.className = `clean-burst clean-${theme}`;
  burst.style.left = `${rect.left - areaRect.left + rect.width / 2}px`;
  burst.style.top = `${rect.top - areaRect.top + rect.height / 2}px`;

  const symbol = document.createElement("b");
  const symbols = { rainbow: "🌈", basket: "✓", breakdown: "⚙", blackout: "ϟ", detergent: "▰" };
  symbol.textContent = symbols[theme] || "✦";
  burst.appendChild(symbol);

  for (let index = 0; index < 12; index += 1) {
    const particle = document.createElement("i");
    const angle = (Math.PI * 2 * index) / 12 + randomBetween(-0.18, 0.18);
    const distance = randomBetween(34, 72);
    particle.style.setProperty("--particle-x", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--particle-y", `${Math.sin(angle) * distance}px`);
    particle.style.setProperty("--particle-delay", `${randomBetween(0, 90)}ms`);
    particle.style.setProperty("--particle-size", `${randomBetween(5, 12)}px`);
    burst.appendChild(particle);
  }

  els.scorePopRegion.appendChild(burst);
  window.setTimeout(() => burst.remove(), 900);
}

function pauseGame(autoPaused = false) {
  if (!state.running || state.paused) return;
  state.paused = true;
  state.pausedAt = performance.now();
  clearGameTimers();
  hideEventForecast();
  stopBgm();
  els.pauseButton.disabled = true;
  els.pauseTime.textContent = String(state.seconds);
  els.pauseScore.textContent = state.score.toLocaleString("ko-KR");
  els.pauseModal.classList.add("open");
  els.pauseModal.setAttribute("aria-hidden", "false");
  document.querySelector("#pause-title").textContent = autoPaused ? "자리를 비워 자동으로 멈췄어요" : "잠시 쉬어갈까요?";
  if (!document.hidden) window.setTimeout(() => els.resumeButton.focus(), 120);
}

function resumeGame() {
  if (!state.running || !state.paused) return;
  const pausedDuration = performance.now() - state.pausedAt;
  state.startedAt += pausedDuration;
  state.machines.forEach((machine) => {
    if (machine.guest) machine.cycleStarted += pausedDuration;
    if (machine.dirt) machine.dirtCreatedAt += pausedDuration;
    if (machine.broken) machine.brokenAt += pausedDuration;
  });
  if (state.activeEvent) state.activeEvent.startedAt += pausedDuration;
  state.paused = false;
  state.pausedAt = 0;
  els.pauseModal.classList.remove("open");
  els.pauseModal.setAttribute("aria-hidden", "true");
  els.pauseButton.disabled = false;
  scheduleGameLoops(false);
  startBgm();
  showToast("다시 영업을 시작합니다!", "good", "▶", 950);
}

function endGame(success, reason) {
  if (!state.running) return;
  state.running = false;
  state.paused = false;
  clearGameTimers();
  stopBgm();
  els.pauseButton.disabled = true;
  els.pauseModal.classList.remove("open");
  els.pauseModal.setAttribute("aria-hidden", "true");
  hideEventAlert();
  hideEventForecast();
  els.firstShiftGuide.hidden = true;
  els.powerOverlay.classList.remove("active");
  els.breakerPanel.classList.remove("active");
  els.detergentStation.classList.remove("target-ready");
  document.querySelector("#shop").classList.remove("blackout");
  state.machines.forEach((machine) => {
    machine.el.classList.remove("busy", "broken");
    machine.el.querySelector(".cycle-bar i").style.width = "0%";
  });
  els.timerCard.classList.remove("danger");

  const finalSuccess = success && state.queue.length < MAX_QUEUE;
  const rank = getRank(finalSuccess);
  evaluateShiftObjectives(finalSuccess);
  state.lastShiftPlan = {
    difficulty: state.difficulty,
    condition: state.condition?.id || null,
    objectiveIds: state.shiftObjectives.map((objective) => objective.id),
  };
  const progressionResult = finalizeProgression(finalSuccess, rank, reason);
  const unlockedAchievements = progressionResult.achievements;
  state.resultLeveledUp = progressionResult.currentLevel.level > progressionResult.previousLevel;
  const isNewRecord = saveBestRecord(finalSuccess, rank);
  const card = els.resultCard;
  card.classList.toggle("failed", !finalSuccess);
  document.querySelector("#result-badge").textContent = finalSuccess ? "영업 완료" : "영업 종료";
  document.querySelector("#result-face").textContent = finalSuccess ? "✦" : "!";
  document.querySelector("#result-title").textContent = finalSuccess ? "오늘 영업, 성공!" : "대기 줄이 꽉 찼어요!";
  document.querySelector("#result-message").textContent = finalSuccess
    ? "75초 동안 가게를 멋지게 지켜냈어요."
    : reason === "queue"
      ? "대기 손님이 6명에 도달했어요. 더 빠르게 기계를 관리해 보세요."
      : "다시 한 번 도전해 보세요.";
  document.querySelector("#result-score").textContent = state.score.toLocaleString("ko-KR");
  document.querySelector("#result-cleaned").textContent = String(state.cleaned);
  document.querySelector("#result-refunds").textContent = String(state.refunds);
  document.querySelector("#result-served").textContent = String(state.served);
  document.querySelector("#result-max-combo").textContent = String(state.maxCombo);
  document.querySelector("#result-average-wait").textContent = (state.waitSamples ? state.totalWaitMs / state.waitSamples / 1000 : 0).toFixed(1);
  document.querySelector("#result-happy-rate").textContent = String(happyGuestRate());
  document.querySelector("#result-rank").textContent = rank.letter;
  document.querySelector("#rank-copy").textContent = rank.copy;
  document.querySelector("#new-record-banner").hidden = !isNewRecord;
  document.querySelector("#result-coins").textContent = String(state.shiftCoins);
  document.querySelector("#result-wallet").textContent = state.progression.wallet.toLocaleString("ko-KR");
  document.querySelector("#result-xp").textContent = String(state.shiftXp);
  document.querySelector("#result-reputation").textContent = `명성 ${state.shiftReputation >= 0 ? "+" : ""}${state.shiftReputation}`;
  const nextLevel = nextManagerLevel();
  document.querySelector("#result-next-level").textContent = nextLevel ? `다음 레벨까지 ${Math.max(0, nextLevel.xp - state.progression.manager.xp)} XP` : "최고 점장 레벨 달성";
  document.querySelector("#result-impatient").textContent = String(state.typeCounts.impatient);
  document.querySelector("#result-regular").textContent = String(state.typeCounts.regular);
  document.querySelector("#result-bulk").textContent = String(state.typeCounts.bulk);
  document.querySelector("#result-difficulty").textContent = DIFFICULTIES[state.difficulty].label;
  renderResultObjectives();
  updateResultAnalysis();
  const unlockBanner = document.querySelector("#achievement-unlock-banner");
  unlockBanner.hidden = unlockedAchievements.length === 0;
  document.querySelector("#achievement-unlock-text").textContent = unlockedAchievements.length
    ? `${unlockedAchievements.map((item) => item.title).join(" · ")} 달성!`
    : "새 업적 달성!";
  configureResultActions(progressionResult, isNewRecord);
  updateRecordUi();
  updateProgressionUi();
  els.resultModal.classList.add("open");
  els.resultModal.setAttribute("aria-hidden", "false");
  playResultCelebration({ finalSuccess, rank, isNewRecord, progressionResult });
  window.setTimeout(() => {
    els.resultCard.scrollTop = 0;
    document.querySelector("#result-title").focus({ preventScroll: true });
  }, 350);
}

function renderResultObjectives() {
  const completedCount = state.objectiveResults.filter((result) => result.completed).length;
  els.resultObjectiveList.innerHTML = state.objectiveResults.map((result) => `<article class="${result.completed ? "completed" : "failed"}"><span>${result.completed ? "✓" : "×"}</span><div><strong>${result.objective.title}</strong><small>${result.completed ? `◈ ${result.objective.coins} · +${result.objective.xp} XP` : "다음 영업에서 다시 도전"}</small></div><em>${result.completed ? "완료" : result.label}</em></article>`).join("");
  document.querySelector("#result-objective-reward").textContent = `${completedCount} / ${state.objectiveResults.length} 완료 · 보상 ◈ ${state.objectiveRewardCoins} · ${state.objectiveRewardXp} XP`;
}

function configureResultActions(progressionResult, isNewRecord) {
  const difficultyOrder = ["calm", "standard", "rush"];
  const nextDifficulty = difficultyOrder[difficultyOrder.indexOf(state.difficulty) + 1] || null;
  els.nextDifficultyButton.hidden = !nextDifficulty;
  if (nextDifficulty) els.nextDifficultyButton.querySelector("span").textContent = `${DIFFICULTIES[nextDifficulty].label} 도전`;

  state.resultUnlockTarget = null;
  if (progressionResult.currentLevel.level > progressionResult.previousLevel) {
    const decorLevel = [2, 3, 4].includes(progressionResult.currentLevel.level);
    state.resultUnlockTarget = decorLevel ? "decor-modal" : "stats-modal";
    els.resultUnlockButton.querySelector("span").textContent = `★ Lv.${progressionResult.currentLevel.level} 해금 콘텐츠 보기`;
  } else if (progressionResult.achievements.length) {
    state.resultUnlockTarget = "achievements-modal";
    els.resultUnlockButton.querySelector("span").textContent = `♛ 새 업적 ${progressionResult.achievements.length}개 보기`;
  } else if (isNewRecord) {
    state.resultUnlockTarget = "stats-modal";
    els.resultUnlockButton.querySelector("span").textContent = "▥ 최고 기록 흐름 보기";
  }
  els.resultUnlockButton.hidden = !state.resultUnlockTarget;
}

function retrySameShift() {
  const plan = state.lastShiftPlan;
  if (!plan) {
    openPrepModal(true, false);
    return;
  }
  state.difficulty = DIFFICULTIES[plan.difficulty] ? plan.difficulty : "standard";
  state.shiftObjectives = plan.objectiveIds.map(shiftObjectiveById).filter(Boolean);
  const condition = plan.condition && STORE_CONDITIONS[plan.condition] ? { id: plan.condition, ...STORE_CONDITIONS[plan.condition] } : currentStoreCondition();
  startGame({ condition });
}

function openFreshShiftPlan(higherDifficulty = false) {
  if (higherDifficulty) {
    const order = ["calm", "standard", "rush"];
    state.difficulty = order[Math.min(order.length - 1, order.indexOf(state.difficulty) + 1)] || "standard";
  }
  openPrepModal(true, true);
}

function openResultUnlock() {
  if (!state.resultUnlockTarget) return;
  const target = document.querySelector(`#${state.resultUnlockTarget}`);
  if (target) openProgressionModal(target);
}

function playResultCelebration({ finalSuccess, rank, isNewRecord, progressionResult }) {
  const spotless = finalSuccess && state.refunds === 0;
  const levelUp = progressionResult.currentLevel.level > progressionResult.previousLevel;
  const sRank = finalSuccess && rank.letter === "S";
  els.resultCard.classList.toggle("rank-s", sRank);
  els.resultCard.classList.toggle("spotless", spotless);
  els.resultCard.classList.toggle("level-up", levelUp);
  els.resultCelebration.classList.toggle("active", finalSuccess);
  els.resultCelebration.classList.toggle("rank-s", sRank);
  els.resultCelebration.classList.toggle("level-up", levelUp);

  if (finalSuccess) {
    const colors = ["#ffd65a", "#57d3bd", "#ff765e", "#8ad8e8", "#ffffff"];
    els.resultCelebration.innerHTML = Array.from({ length: levelUp || sRank ? 38 : 24 }, (_, index) => `<i style="--celebrate-x:${5 + Math.random() * 90}%;--celebrate-delay:${Math.random() * .65}s;--celebrate-drift:${-45 + Math.random() * 90}px;--celebrate-color:${colors[index % colors.length]}"></i>`).join("");
  }

  if (levelUp) {
    document.querySelector("#result-face").textContent = "↑";
    playLevelUpJingle();
    announce(`점장 레벨 ${progressionResult.currentLevel.level} 달성. 새 콘텐츠가 해금되었습니다.`);
  } else if (sRank) {
    document.querySelector("#result-badge").textContent = "S RANK · PERFECT SHIFT";
    document.querySelector("#result-face").textContent = "★";
    playSGradeJingle();
    announce("S등급 영업을 달성했습니다.");
  } else if (spotless) {
    document.querySelector("#result-face").textContent = "✧";
    playSpotlessJingle();
    announce("환불 없는 깨끗한 영업을 달성했습니다.");
  } else if (finalSuccess) {
    playSuccessJingle();
  } else {
    playRefundSound();
  }
  if (isNewRecord && !levelUp && !sRank) scheduleTimeout(playSecretJingle, 420);
  if (finalSuccess) vibrate(levelUp || sRank ? [30, 35, 45, 35, 70] : [24, 30, 42]);
}

function mostFrequentEntry(counts) {
  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0] || [null, 0];
}

function updateResultAnalysis() {
  const responseAverage = state.eventResponseTimes.length
    ? state.eventResponseTimes.reduce((sum, item) => sum + item.ms, 0) / state.eventResponseTimes.length / 1000
    : null;
  const [refundDirt, refundCount] = mostFrequentEntry(state.refundCauses);
  const remainingCounts = state.machines.reduce((counts, machine) => {
    if (machine.dirt) counts[machine.dirt] += 1;
    return counts;
  }, { limescale: 0, dust: 0, laundry: 0 });
  const missedCounts = { ...remainingCounts };
  Object.keys(missedCounts).forEach((type) => { missedCounts[type] += state.refundCauses[type]; });
  const [missedDirt, missedCount] = mostFrequentEntry(missedCounts);

  document.querySelector("#result-event-response").textContent = responseAverage === null ? "사건 없음" : `${responseAverage.toFixed(1)}초`;
  document.querySelector("#result-missed-dirt").textContent = missedCount ? `${DIRT_INFO[missedDirt].name} ${missedCount}건` : "없음";
  document.querySelector("#result-refund-cause").textContent = refundCount ? `${DIRT_INFO[refundDirt].name} ${refundCount}건` : "환불 없음";
  document.querySelector("#result-peak-queue").textContent = String(state.peakQueue);
  document.querySelector("#result-advice").textContent = resultAdvice(responseAverage, refundDirt, refundCount);
}

function resultAdvice(responseAverage, refundDirt, refundCount) {
  if (state.peakQueue >= MAX_QUEUE) return "대기 줄이 4명일 때부터 깨끗한 빈 기계를 먼저 확보해 보세요.";
  if (state.peakQueue >= 5) return "대기 손님이 5명까지 늘었어요. 단체 손님 알림이 뜨면 오염부터 정리하세요.";
  if (refundCount >= 2) return `${DIRT_INFO[refundDirt].name} 표시를 놓쳤어요. ${TOOL_INFO[DIRT_INFO[refundDirt].tool].name} 위치를 기억해 두세요.`;
  if (responseAverage !== null && responseAverage > 4) return "매장 사건 대응이 조금 늦었어요. 렌치·세제 보충통과 차단기 위치를 먼저 확인하세요.";
  if (happyGuestRate() < 80) return "손님 대기 시간이 길었어요. 오염 없는 빈 기계를 빠르게 유지해 보세요.";
  if (state.maxCombo < 6) return "영업은 안정적이었어요. 다음에는 오염 발생 직후 처리해 6콤보에 도전해 보세요.";
  return "환불과 대기 줄을 잘 관리했어요. 다음 영업에서는 최고 점수 갱신을 노려보세요!";
}

function getRank(success) {
  if (!success) return { letter: "F", copy: "다시 정리해 볼까요?" };
  const satisfaction = averageSatisfaction();
  if (state.refunds === 0 && state.score >= 3600 && satisfaction >= 90 && state.maxCombo >= 6) return { letter: "S", copy: "빨래방의 전설" };
  if (state.refunds <= 1 && state.score >= 2500 && satisfaction >= 82 && state.maxCombo >= 3) return { letter: "A", copy: "믿음직한 점장님" };
  if (state.refunds <= 3 && satisfaction >= 70) return { letter: "B", copy: "제법 능숙한 운영자" };
  return { letter: "C", copy: "오늘도 성장 중" };
}

function loadBestRecord() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || !Number.isFinite(saved.score) || typeof saved.rank !== "string") throw new Error("invalid record");
    return { score: Math.max(0, saved.score), rank: saved.rank, achievedAt: saved.achievedAt || null };
  } catch (error) {
    return { score: 0, rank: "–", achievedAt: null };
  }
}

function saveBestRecord(success, rank) {
  if (!success || state.score <= state.best.score) return false;
  state.best = {
    score: state.score,
    rank: rank.letter,
    achievedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.best));
  } catch (error) {
    showToast("기록을 브라우저에 저장하지 못했어요.", "bad", "!", 1800);
  }
  return true;
}

function updateRecordUi() {
  const score = state.best.score.toLocaleString("ko-KR");
  els.bestScore.textContent = score;
  els.bestRank.textContent = state.best.rank;
  document.querySelector("#intro-best-score").textContent = score;
  document.querySelector("#intro-best-rank").textContent = state.best.rank;
  document.querySelector("#intro-best-record").classList.toggle("empty", state.best.score === 0);
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function seedFromKey(key) {
  return [...key].reduce((sum, character) => sum + character.charCodeAt(0), 0);
}

function currentStoreCondition(date = new Date()) {
  const entries = Object.entries(STORE_CONDITIONS);
  const [id, condition] = entries[seedFromKey(localDateKey(date)) % entries.length];
  return { id, ...condition };
}

function currentWeeklyEventRule(date = new Date()) {
  return WEEKLY_EVENT_RULES[seedFromKey(localWeekKey(date)) % WEEKLY_EVENT_RULES.length];
}

function applyStoreCondition() {
  const shop = document.querySelector("#shop");
  const condition = state.condition || currentStoreCondition();
  state.condition = condition;
  [...shop.classList].filter((name) => name.startsWith("condition-")).forEach((name) => shop.classList.remove(name));
  shop.classList.add(`condition-${condition.id}`);
  els.weatherLayer.dataset.condition = condition.id;
  if (condition.id === "rain") {
    els.weatherLayer.innerHTML = Array.from({ length: 15 }, (_, index) => `<i style="--drop:${index}"></i>`).join("");
  } else if (condition.id === "weekend") {
    els.weatherLayer.innerHTML = "<strong>20% SCORE BONUS</strong><i></i><i></i><i></i>";
  } else {
    els.weatherLayer.innerHTML = "<strong>HYGIENE CHECK</strong><i></i>";
  }
}

function dailyDefinitionFor(dateKey) {
  const seed = seedFromKey(dateKey);
  return DAILY_CHALLENGES[seed % DAILY_CHALLENGES.length];
}

function freshDailyState() {
  const date = localDateKey();
  const definition = dailyDefinitionFor(date);
  return { date, id: definition.id, progress: 0, completed: false, rewarded: false };
}

function localWeekKey(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
  const daysFromMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysFromMonday);
  return localDateKey(monday);
}

function weeklyDefinitionsFor(weekKey) {
  const seed = seedFromKey(weekKey);
  const start = seed % WEEKLY_GOALS.length;
  return [0, 2, 4].map((offset) => WEEKLY_GOALS[(start + offset) % WEEKLY_GOALS.length]);
}

function freshWeeklyState() {
  const week = localWeekKey();
  return {
    week,
    goals: weeklyDefinitionsFor(week).map((definition) => ({ id: definition.id, progress: 0, completed: false, rewarded: false })),
    activeDays: [],
    paceRewards: [],
    allGoalsRewarded: false,
  };
}

function defaultProgression() {
  return {
    schemaVersion: DATA_SCHEMA_VERSION,
    wallet: 0,
    upgrades: { machine: 0, tool: 0 },
    stats: { shifts: 0, cleaned: 0, served: 0, happy: 0, regular: 0, bulk: 0, impatient: 0, earnings: 0, maxCombo: 0, objectives: 0 },
    achievements: [],
    discovery: { customers: ["normal"], dirt: [], events: [], upgrades: ["machine", "tool"] },
    preferences: {
      soundEnabled: false,
      bgmVolume: 45,
      sfxVolume: 70,
      vibration: true,
      screenShake: true,
      reducedMotion: false,
      colorAssist: false,
      highContrast: false,
      textSize: "normal",
      lastDifficulty: "standard",
    },
    daily: freshDailyState(),
    weekly: freshWeeklyState(),
    cosmetics: { weeklyBadges: [] },
    tutorial: { completed: false, rewarded: false },
    onboarding: { firstShiftComplete: false, hintsDismissed: false },
    manager: { xp: 0, reputation: 0 },
    recentShifts: [],
    decor: {
      owned: ["sign_classic", "floor_classic", "wall_cream", "plant_green"],
      equipped: { sign: "sign_classic", floor: "floor_classic", wall: "wall_cream", plant: "plant_green" },
    },
  };
}

function migrateProgressionData(saved) {
  const version = Math.max(1, Number(saved.schemaVersion) || 1);
  const migrated = { ...saved };
  if (version < 2) {
    migrated.preferences = { ...(saved.preferences || {}) };
  }
  if (version < 4) {
    migrated.tutorial = { ...(saved.tutorial || {}) };
    migrated.decor = { ...(saved.decor || {}) };
  }
  if (version < 5) {
    const stats = saved.stats || {};
    migrated.manager = {
      xp: Math.max(0, (Number(stats.shifts) || 0) * 90 + (Number(stats.cleaned) || 0) * 3 + (Number(stats.served) || 0) * 4),
      reputation: Math.max(0, (Number(stats.shifts) || 0) * 2),
    };
    migrated.onboarding = {
      firstShiftComplete: (Number(stats.shifts) || 0) > 0,
      hintsDismissed: (Number(stats.shifts) || 0) > 0,
    };
    migrated.recentShifts = [];
  }
  if (version < 6) {
    migrated.stats = { ...(saved.stats || {}), objectives: Math.max(0, Number(saved.stats?.objectives) || 0) };
  }
  migrated.schemaVersion = Math.max(version, DATA_SCHEMA_VERSION);
  return migrated;
}

function normalizePreferences(saved, fallback) {
  const source = saved && typeof saved === "object" ? saved : {};
  const percentage = (value, defaultValue) => Math.min(100, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : defaultValue));
  return {
    soundEnabled: Boolean(source.soundEnabled),
    bgmVolume: percentage(source.bgmVolume, fallback.bgmVolume),
    sfxVolume: percentage(source.sfxVolume, fallback.sfxVolume),
    vibration: source.vibration !== false,
    screenShake: source.screenShake !== false,
    reducedMotion: Boolean(source.reducedMotion),
    colorAssist: Boolean(source.colorAssist),
    highContrast: Boolean(source.highContrast),
    textSize: ["normal", "large", "largest"].includes(source.textSize) ? source.textSize : fallback.textSize,
    lastDifficulty: DIFFICULTIES[source.lastDifficulty] ? source.lastDifficulty : fallback.lastDifficulty,
  };
}

function loadProgression() {
  const fallback = defaultProgression();
  try {
    const stored = JSON.parse(localStorage.getItem(PROGRESSION_KEY));
    if (!stored || typeof stored !== "object") return fallback;
    const saved = migrateProgressionData(stored);
    const progression = {
      schemaVersion: saved.schemaVersion,
      wallet: Math.max(0, Number(saved.wallet) || 0),
      upgrades: { ...fallback.upgrades, ...(saved.upgrades || {}) },
      stats: { ...fallback.stats, ...(saved.stats || {}) },
      achievements: Array.isArray(saved.achievements) ? saved.achievements.filter((id) => ACHIEVEMENTS.some((item) => item.id === id)) : [],
      discovery: { ...fallback.discovery },
      preferences: normalizePreferences(saved.preferences, fallback.preferences),
      daily: saved.daily && saved.daily.date === localDateKey() ? { ...fallback.daily, ...saved.daily } : fallback.daily,
      weekly: saved.weekly && saved.weekly.week === localWeekKey() ? { ...fallback.weekly, ...saved.weekly } : fallback.weekly,
      cosmetics: { ...fallback.cosmetics, ...(saved.cosmetics || {}) },
      tutorial: { ...fallback.tutorial, ...(saved.tutorial || {}) },
      onboarding: { ...fallback.onboarding, ...(saved.onboarding || {}) },
      manager: {
        xp: Math.max(0, Number(saved.manager?.xp) || 0),
        reputation: Math.max(0, Number(saved.manager?.reputation) || 0),
      },
      recentShifts: Array.isArray(saved.recentShifts) ? saved.recentShifts.slice(0, 10).map((item) => ({
        timestamp: typeof item?.timestamp === "string" ? item.timestamp : new Date().toISOString(),
        success: Boolean(item?.success),
        reason: ["time", "queue"].includes(item?.reason) ? item.reason : "time",
        score: Math.max(0, Number(item?.score) || 0),
        rank: ["S", "A", "B", "C", "F"].includes(item?.rank) ? item.rank : "F",
        refunds: Math.max(0, Number(item?.refunds) || 0),
        served: Math.max(0, Number(item?.served) || 0),
        cleaned: Math.max(0, Number(item?.cleaned) || 0),
        peakQueue: Math.max(0, Number(item?.peakQueue) || 0),
        satisfaction: Math.max(0, Math.min(100, Number(item?.satisfaction) || 0)),
        difficulty: DIFFICULTIES[item?.difficulty] ? item.difficulty : "standard",
        condition: Object.hasOwn(STORE_CONDITIONS, item?.condition) ? item.condition : null,
        xp: Math.max(0, Number(item?.xp) || 0),
        reputation: Number(item?.reputation) || 0,
        objectivesCompleted: Math.max(0, Number(item?.objectivesCompleted) || 0),
        objectiveCount: Math.max(0, Number(item?.objectiveCount) || 0),
      })) : [],
      decor: { ...fallback.decor, ...(saved.decor || {}), equipped: { ...fallback.decor.equipped, ...(saved.decor?.equipped || {}) } },
    };
    Object.keys(fallback.discovery).forEach((category) => {
      const validIds = CODEX_CONTENT[category].map((item) => item.id);
      const savedIds = Array.isArray(saved.discovery?.[category]) ? saved.discovery[category] : fallback.discovery[category];
      progression.discovery[category] = [...new Set(savedIds.filter((id) => validIds.includes(id)))];
    });
    progression.discovery.customers = [...new Set(["normal", ...progression.discovery.customers])];
    progression.discovery.upgrades = ["machine", "tool"];
    progression.upgrades.machine = Math.min(CONFIG.upgrades.maxLevel, Math.max(0, Number(progression.upgrades.machine) || 0));
    progression.upgrades.tool = Math.min(CONFIG.upgrades.maxLevel, Math.max(0, Number(progression.upgrades.tool) || 0));
    const weeklyDefinitions = weeklyDefinitionsFor(progression.weekly.week);
    progression.weekly.goals = weeklyDefinitions.map((definition) => {
      const goal = Array.isArray(progression.weekly.goals) ? progression.weekly.goals.find((item) => item.id === definition.id) : null;
      const progress = Math.min(definition.target, Math.max(0, Number(goal?.progress) || 0));
      return { id: definition.id, progress, completed: progress >= definition.target || Boolean(goal?.completed), rewarded: Boolean(goal?.rewarded) };
    });
    progression.weekly.activeDays = Array.isArray(progression.weekly.activeDays) ? [...new Set(progression.weekly.activeDays.filter((day) => typeof day === "string"))] : [];
    progression.weekly.paceRewards = Array.isArray(progression.weekly.paceRewards) ? progression.weekly.paceRewards.filter((days) => PACE_MILESTONES.some((item) => item.days === days)) : [];
    progression.cosmetics.weeklyBadges = Array.isArray(progression.cosmetics.weeklyBadges) ? [...new Set(progression.cosmetics.weeklyBadges.filter((week) => typeof week === "string"))] : [];
    const validDecorIds = DECORATIONS.map((item) => item.id);
    progression.decor.owned = Array.isArray(progression.decor.owned) ? [...new Set([...fallback.decor.owned, ...progression.decor.owned.filter((id) => validDecorIds.includes(id))])] : [...fallback.decor.owned];
    if (progression.cosmetics.weeklyBadges.length && !progression.decor.owned.includes("sign_gold")) progression.decor.owned.push("sign_gold");
    Object.keys(fallback.decor.equipped).forEach((type) => {
      const equipped = progression.decor.equipped[type];
      if (!progression.decor.owned.includes(equipped) || !DECORATIONS.some((item) => item.id === equipped && item.type === type)) progression.decor.equipped[type] = fallback.decor.equipped[type];
    });
    if (progression.daily.id !== dailyDefinitionFor(progression.daily.date).id) progression.daily = freshDailyState();
    if ((Number(stored.schemaVersion) || 1) < DATA_SCHEMA_VERSION) {
      localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progression));
    }
    return progression;
  } catch (error) {
    return fallback;
  }
}

function saveProgression() {
  try {
    state.progression.schemaVersion = Math.max(Number(state.progression.schemaVersion) || 1, DATA_SCHEMA_VERSION);
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(state.progression));
  } catch (error) {
    showToast("진행 상황을 브라우저에 저장하지 못했어요.", "bad", "!", 1800);
  }
}

function discoverEntry(category, id) {
  const entries = CODEX_CONTENT[category];
  if (!entries || !entries.some((item) => item.id === id)) return;
  const discovered = state.progression.discovery[category];
  if (discovered.includes(id)) return;
  discovered.push(id);
  saveProgression();
  updateCodexUi();
}

function codexEntries(category) {
  if (category !== "achievements") return CODEX_CONTENT[category] || [];
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    tag: `보상 ◈ ${achievement.reward}`,
  }));
}

function codexEntryIsUnlocked(category, id) {
  if (category === "achievements") return state.progression.achievements.includes(id);
  return state.progression.discovery[category]?.includes(id) || false;
}

function codexDiscoveredCount() {
  const discovered = Object.values(state.progression.discovery).reduce((total, ids) => total + ids.length, 0);
  return discovered + state.progression.achievements.length;
}

function renderCodex() {
  const category = state.codexTab;
  const entries = codexEntries(category);
  els.codexGrid.innerHTML = "";
  entries.forEach((entry) => {
    const unlocked = codexEntryIsUnlocked(category, entry.id);
    const showDetails = unlocked || category === "achievements";
    const card = document.createElement("article");
    card.className = `codex-entry${unlocked ? " unlocked" : " locked"}`;
    const upgradeLevel = category === "upgrades" ? `<small>현재 Lv.${state.progression.upgrades[entry.id]} / ${CONFIG.upgrades.maxLevel}</small>` : "";
    const achievementProgressText = category === "achievements"
      ? (() => {
          const [value, target] = achievementProgress(entry);
          return `<small>${unlocked ? "달성 완료" : `${Math.min(value, target)} / ${target}`}</small>`;
        })()
      : "";
    card.innerHTML = `
      <span class="codex-entry-icon">${showDetails ? entry.icon : "?"}</span>
      <div>
        <small class="codex-entry-tag">${showDetails ? entry.tag : "UNKNOWN"}</small>
        <h3>${showDetails ? entry.title : "미발견"}</h3>
        <p>${showDetails ? entry.description : "영업 중 직접 발견하면 자세한 정보가 열립니다."}</p>
        ${upgradeLevel || achievementProgressText}
      </div>
      <em>${unlocked ? "발견" : "LOCK"}</em>
    `;
    els.codexGrid.appendChild(card);
  });
}

function updateCodexUi() {
  const total = Object.values(CODEX_CONTENT).reduce((sum, entries) => sum + entries.length, 0) + ACHIEVEMENTS.length;
  const count = codexDiscoveredCount();
  document.querySelector("#codex-count").textContent = String(count);
  document.querySelector("#codex-progress-count").textContent = String(count);
  document.querySelector("#codex-progress-bar").style.width = `${(count / total) * 100}%`;
  els.codexTabs.forEach((tab) => {
    const active = tab.dataset.codexTab === state.codexTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  renderCodex();
}

function ensureCurrentDaily() {
  if (state.progression.daily.date === localDateKey()) return;
  state.progression.daily = freshDailyState();
  saveProgression();
}

function ensureCurrentWeekly() {
  if (state.progression.weekly.week === localWeekKey()) return;
  state.progression.weekly = freshWeeklyState();
  saveProgression();
}

function weeklyDefinition(goalId) {
  return WEEKLY_GOALS.find((definition) => definition.id === goalId);
}

function advanceWeeklyGoal(kind, amount = 1) {
  if (state.tutorialActive) return;
  ensureCurrentWeekly();
  let changed = false;
  state.progression.weekly.goals.forEach((goal) => {
    const definition = weeklyDefinition(goal.id);
    if (!definition || definition.kind !== kind || definition.mode === "max" || goal.completed) return;
    goal.progress = Math.min(definition.target, goal.progress + amount);
    changed = true;
    completeWeeklyGoal(goal, definition);
  });
  if (changed) saveProgression();
}

function setWeeklyGoalMaximum(kind, value) {
  if (state.tutorialActive) return;
  ensureCurrentWeekly();
  state.progression.weekly.goals.forEach((goal) => {
    const definition = weeklyDefinition(goal.id);
    if (!definition || definition.kind !== kind || definition.mode !== "max" || goal.completed) return;
    goal.progress = Math.min(definition.target, Math.max(goal.progress, value));
    completeWeeklyGoal(goal, definition);
    saveProgression();
  });
}

function completeWeeklyGoal(goal, definition) {
  if (goal.progress < definition.target) return;
  goal.completed = true;
  if (!goal.rewarded) {
    goal.rewarded = true;
    state.progression.wallet += definition.reward;
    showToast(`주간 목표 완료! 수익 ${definition.reward} 획득`, "secret", "◆", 1900);
  }
  rewardWeeklyCompletionIfReady();
}

function rewardWeeklyCompletionIfReady() {
  const weekly = state.progression.weekly;
  if (weekly.allGoalsRewarded || !weekly.goals.every((goal) => goal.completed)) return;
  weekly.allGoalsRewarded = true;
  if (!state.progression.cosmetics.weeklyBadges.includes(weekly.week)) state.progression.cosmetics.weeklyBadges.push(weekly.week);
  if (!state.progression.decor.owned.includes("sign_gold")) state.progression.decor.owned.push("sign_gold");
  showToast("이번 주 목표 완성! 황금 간판 장식을 획득했어요.", "secret", "★", 2500);
}

function recordWeeklyPace() {
  ensureCurrentWeekly();
  const weekly = state.progression.weekly;
  const today = localDateKey();
  if (!weekly.activeDays.includes(today)) weekly.activeDays.push(today);
  PACE_MILESTONES.forEach((milestone) => {
    if (weekly.activeDays.length < milestone.days || weekly.paceRewards.includes(milestone.days)) return;
    weekly.paceRewards.push(milestone.days);
    state.progression.wallet += milestone.reward;
    showToast(`주간 페이스 ${milestone.days}일! 수익 ${milestone.reward} 획득`, "secret", "☀", 2100);
  });
}

function currentDailyDefinition() {
  ensureCurrentDaily();
  return DAILY_CHALLENGES.find((item) => item.id === state.progression.daily.id) || dailyDefinitionFor(localDateKey());
}

function advanceDailyChallenge(kind, amount = 1) {
  if (state.tutorialActive) return;
  const definition = currentDailyDefinition();
  if (definition.kind !== kind || state.progression.daily.completed) return;
  state.progression.daily.progress = Math.min(definition.target, state.progression.daily.progress + amount);
  completeDailyChallengeIfReady(definition);
}

function setDailyChallengeMaximum(kind, value) {
  if (state.tutorialActive) return;
  const definition = currentDailyDefinition();
  if (definition.kind !== kind || state.progression.daily.completed) return;
  state.progression.daily.progress = Math.min(definition.target, Math.max(state.progression.daily.progress, value));
  completeDailyChallengeIfReady(definition);
}

function completeDailyChallengeIfReady(definition) {
  const daily = state.progression.daily;
  if (daily.progress < definition.target) {
    saveProgression();
    updateProgressionUi();
    return;
  }
  daily.completed = true;
  if (!daily.rewarded) {
    daily.rewarded = true;
    state.progression.wallet += CONFIG.economy.dailyReward;
    showToast(`오늘의 도전 완료! 수익 ${CONFIG.economy.dailyReward} 획득`, "secret", "☀", 2200);
    playSuccessJingle();
  }
  saveProgression();
  updateProgressionUi();
}

function managerLevelInfo(xp = state.progression.manager.xp) {
  return [...MANAGER_LEVELS].reverse().find((item) => xp >= item.xp) || MANAGER_LEVELS[0];
}

function nextManagerLevel(xp = state.progression.manager.xp) {
  return MANAGER_LEVELS.find((item) => item.xp > xp) || null;
}

function managerProgressValues() {
  const current = managerLevelInfo();
  const next = nextManagerLevel();
  const start = current.xp;
  const end = next?.xp ?? current.xp;
  const percent = next ? Math.min(100, Math.max(0, ((state.progression.manager.xp - start) / (end - start)) * 100)) : 100;
  return { current, next, percent };
}

function reputationDelta(success, rank) {
  if (!success) return -1;
  const rankBonus = { S: 3, A: 2, B: 1 }[rank.letter] || 0;
  return Math.max(0, 2 + rankBonus - Math.min(2, state.refunds));
}

function recordShiftHistory(success, rank, reason) {
  const entry = {
    timestamp: new Date().toISOString(),
    success,
    reason,
    score: state.score,
    rank: rank.letter,
    refunds: state.refunds,
    served: state.served,
    cleaned: state.cleaned,
    peakQueue: state.peakQueue,
    satisfaction: happyGuestRate(),
    difficulty: state.difficulty,
    condition: state.condition?.id || null,
    xp: state.shiftXp,
    reputation: state.shiftReputation,
    objectivesCompleted: state.objectiveResults.filter((result) => result.completed).length,
    objectiveCount: state.objectiveResults.length,
  };
  state.progression.recentShifts = [entry, ...state.progression.recentShifts].slice(0, 10);
}

function finalizeProgression(success, rank, reason) {
  const progression = state.progression;
  const previousLevel = managerLevelInfo().level;
  state.shiftCoins = Math.max(
    0,
    state.served * CONFIG.economy.servedCoins
      + state.happyGuests * CONFIG.economy.happyCoins
      + (success ? CONFIG.economy.successBonus : 0)
      - state.refunds * CONFIG.economy.refundPenalty
      + state.objectiveRewardCoins,
  );
  progression.wallet += state.shiftCoins;
  progression.stats.shifts += success ? 1 : 0;
  progression.stats.cleaned += state.cleaned;
  progression.stats.served += state.served;
  progression.stats.happy += state.happyGuests;
  progression.stats.regular += state.typeCounts.regular;
  progression.stats.bulk += state.typeCounts.bulk;
  progression.stats.impatient += state.typeCounts.impatient;
  progression.stats.earnings += state.shiftCoins;
  progression.stats.maxCombo = Math.max(progression.stats.maxCombo, state.maxCombo);
  progression.stats.objectives += state.objectiveResults.filter((result) => result.completed).length;
  const rankXp = { S: 75, A: 55, B: 35, C: 20, F: 5 }[rank.letter] || 0;
  state.shiftXp = 25 + state.cleaned * 4 + state.served * 5 + state.maxCombo * 2 + (success ? 60 : 10) + rankXp + state.objectiveRewardXp;
  state.shiftReputation = reputationDelta(success, rank);
  progression.manager.xp += state.shiftXp;
  progression.manager.reputation = Math.max(0, progression.manager.reputation + state.shiftReputation);
  progression.onboarding.firstShiftComplete = true;
  recordShiftHistory(success, rank, reason);
  recordWeeklyPace();
  if (success) advanceWeeklyGoal("shift", 1);

  const newlyUnlocked = unlockAchievements(success);
  saveProgression();
  const currentLevel = managerLevelInfo();
  if (currentLevel.level > previousLevel) {
    showToast(`점장 Lv.${currentLevel.level} 달성 · ${currentLevel.title}`, "secret", "★", 2600);
    announce(`점장 레벨 ${currentLevel.level}, ${currentLevel.title}을 달성했습니다.`);
  }
  return { achievements: newlyUnlocked, previousLevel, currentLevel };
}

function achievementIsComplete(id, success) {
  const stats = state.progression.stats;
  const rules = {
    first_shift: stats.shifts >= 1,
    spotless: success && state.refunds === 0,
    combo_10: stats.maxCombo >= 10,
    clean_50: stats.cleaned >= 50,
    regular_10: stats.regular >= 10,
    bulk_10: stats.bulk >= 10,
    earn_1000: stats.earnings >= 1000,
  };
  return Boolean(rules[id]);
}

function unlockAchievements(success) {
  const unlocked = [];
  ACHIEVEMENTS.forEach((achievement) => {
    if (state.progression.achievements.includes(achievement.id) || !achievementIsComplete(achievement.id, success)) return;
    state.progression.achievements.push(achievement.id);
    state.progression.wallet += achievement.reward;
    unlocked.push(achievement);
  });
  return unlocked;
}

function achievementProgress(achievement) {
  const stats = state.progression.stats;
  const values = {
    first_shift: [stats.shifts, 1],
    spotless: [state.progression.achievements.includes("spotless") ? 1 : 0, 1],
    combo_10: [stats.maxCombo, 10],
    clean_50: [stats.cleaned, 50],
    regular_10: [stats.regular, 10],
    bulk_10: [stats.bulk, 10],
    earn_1000: [stats.earnings, 1000],
  };
  return values[achievement.id] || [0, 1];
}

function updateProgressionUi() {
  ensureCurrentDaily();
  ensureCurrentWeekly();
  const progression = state.progression;
  const dailyDefinition = currentDailyDefinition();
  const dailyProgress = progression.daily.progress;
  const dailyLabel = progression.daily.completed ? "완료!" : `${dailyProgress} / ${dailyDefinition.target}`;

  document.querySelector("#wallet-value").textContent = progression.wallet.toLocaleString("ko-KR");
  document.querySelector("#shop-wallet-value").textContent = progression.wallet.toLocaleString("ko-KR");
  document.querySelector("#upgrade-summary").textContent = `기계 ${progression.upgrades.machine} · 도구 ${progression.upgrades.tool}`;
  document.querySelector("#achievement-count").textContent = String(progression.achievements.length);
  document.querySelector("#decor-summary").textContent = `${progression.decor.owned.length}개 보유`;
  document.querySelector("#daily-challenge-text").textContent = dailyDefinition.title;
  document.querySelector("#daily-challenge-progress").textContent = dailyLabel;
  document.querySelector("#intro-daily-title").textContent = dailyDefinition.title;
  document.querySelector("#intro-daily-progress").textContent = dailyLabel;
  document.querySelector("#achievement-daily-title").textContent = dailyDefinition.title;
  document.querySelector("#achievement-daily-progress").textContent = dailyLabel;
  document.querySelector("#achievement-daily-bar").style.width = `${Math.min(100, (dailyProgress / dailyDefinition.target) * 100)}%`;
  document.querySelector("#intro-daily-card").classList.toggle("completed", progression.daily.completed);
  document.querySelector("#daily-detail").classList.toggle("completed", progression.daily.completed);
  updateUpgradeCards();
  renderAchievements();
  updateCodexUi();
  renderWeeklyGoals();
  updateManagerUi();
  updateOnboardingUi();
  if (els.statsModal.classList.contains("open")) renderShiftHistory();
  if (els.decorModal.classList.contains("open")) renderDecorations();
  document.documentElement.classList.toggle("weekly-shine", progression.weekly.allGoalsRewarded);
}

function updateManagerUi() {
  const { current, next, percent } = managerProgressValues();
  const progression = state.progression;
  const currentXp = progression.manager.xp;
  const targetXp = next?.xp ?? "MAX";
  const values = {
    "manager-level": current.level,
    "manager-title": current.title,
    "manager-reputation": progression.manager.reputation,
    "manager-xp": currentXp,
    "manager-next-xp": targetXp,
    "manager-badge": current.level,
    "stats-manager-level": current.level,
    "stats-manager-title": current.title,
    "stats-manager-reputation": progression.manager.reputation,
    "stats-manager-xp": currentXp,
    "stats-manager-next-xp": targetXp,
    "stats-manager-unlock": next ? `다음 해금 · ${current.unlock}` : "모든 점장 콘텐츠를 해금했습니다",
  };
  Object.entries(values).forEach(([id, value]) => {
    const element = document.querySelector(`#${id}`);
    if (element) element.textContent = String(value);
  });
  document.querySelector("#manager-xp-bar").style.width = `${percent}%`;
  document.querySelector("#stats-manager-xp-bar").style.width = `${percent}%`;
}

function updateOnboardingUi() {
  const firstVisit = !state.progression.onboarding.firstShiftComplete;
  const needsPractice = !state.progression.tutorial.completed;
  const introCard = els.introModal.querySelector(".intro-card");
  introCard.classList.toggle("new-manager", firstVisit);
  els.startButton.querySelector("span").textContent = needsPractice ? "실습부터 시작하기" : "영업 준비하기";
  els.skipOnboardingButton.hidden = !needsPractice;
  els.tutorialButton.innerHTML = needsPractice ? "<span>▶</span>실습 튜토리얼" : "<span>↻</span>튜토리얼 다시 보기";
}

function renderShiftHistory() {
  const shifts = state.progression.recentShifts;
  const successCount = shifts.filter((item) => item.success).length;
  const sum = (key) => shifts.reduce((total, item) => total + (Number(item[key]) || 0), 0);
  document.querySelector("#history-success-rate").textContent = shifts.length ? `${Math.round((successCount / shifts.length) * 100)}%` : "–";
  document.querySelector("#history-average-score").textContent = shifts.length ? Math.round(sum("score") / shifts.length).toLocaleString("ko-KR") : "–";
  document.querySelector("#history-average-refunds").textContent = shifts.length ? (sum("refunds") / shifts.length).toFixed(1) : "–";
  document.querySelector("#history-best-score").textContent = shifts.length ? Math.max(...shifts.map((item) => Number(item.score) || 0)).toLocaleString("ko-KR") : "–";

  const chart = document.querySelector("#history-chart");
  const maxScore = Math.max(1, ...shifts.map((item) => Number(item.score) || 0));
  chart.innerHTML = shifts.length
    ? [...shifts].reverse().map((item, index) => `<i class="${item.success ? "success" : "failed"}" style="--history-height:${Math.max(8, ((Number(item.score) || 0) / maxScore) * 100)}%" title="${index + 1}번째 · ${(Number(item.score) || 0).toLocaleString("ko-KR")}점"><b></b></i>`).join("")
    : "<p>첫 영업을 완료하면 점수 흐름이 표시됩니다.</p>";

  const list = document.querySelector("#history-list");
  list.innerHTML = shifts.length
    ? shifts.map((item) => {
      const date = new Date(item.timestamp);
      const dateLabel = Number.isNaN(date.getTime()) ? "최근" : new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
      const difficulty = DIFFICULTIES[item.difficulty]?.label || "표준 영업";
      const objectiveCopy = Number(item.objectiveCount) ? ` · 목표 ${Number(item.objectivesCompleted) || 0}/${Number(item.objectiveCount)}` : "";
      return `<article class="${item.success ? "success" : "failed"}"><span>${item.success ? item.rank : "F"}</span><div><strong>${item.success ? "영업 완주" : "대기 초과"}</strong><small>${dateLabel} · ${difficulty}${objectiveCopy}</small></div><em><b>${(Number(item.score) || 0).toLocaleString("ko-KR")}</b>점<small>환불 ${Number(item.refunds) || 0} · +${Number(item.xp) || 0} XP</small></em></article>`;
    }).join("")
    : "<p class=\"history-empty\">아직 저장된 영업 기록이 없습니다.</p>";

  let insight = "첫 영업에서는 오염 표시와 도구 모양을 먼저 연결해 보세요.";
  if (shifts.length >= 2) {
    const averageRefunds = sum("refunds") / shifts.length;
    const averagePeak = sum("peakQueue") / shifts.length;
    if (successCount / shifts.length < 0.6) insight = "완주율을 높이려면 대기 줄이 4명일 때 오염 없는 빈 기계를 먼저 확보하세요.";
    else if (averageRefunds >= 2) insight = "최근 환불이 잦습니다. 사건 예고가 뜨면 먼저 기계 오염을 정리해 빈 자리를 만드세요.";
    else if (averagePeak >= 4) insight = "대기 줄이 자주 길어집니다. 단체 손님 예고 직전에 기계 가동 상태를 확인하세요.";
    else insight = "운영이 안정적입니다. 피크 타임 또는 무환불 S등급에 도전해 보세요.";
  }
  document.querySelector("#history-insight").textContent = insight;
}

function renderWeeklyGoals() {
  if (!els.prepWeeklyGoals) return;
  els.prepWeeklyGoals.innerHTML = "";
  state.progression.weekly.goals.forEach((goal) => {
    const definition = weeklyDefinition(goal.id);
    const card = document.createElement("article");
    card.className = goal.completed ? "completed" : "";
    card.innerHTML = `<span>${goal.completed ? "✓" : "◆"}</span><div><small>WEEKLY</small><strong>${definition.title}</strong><i><b style="width:${Math.min(100, (goal.progress / definition.target) * 100)}%"></b></i></div><em>${goal.completed ? "완료" : `${goal.progress} / ${definition.target}`}<small>◈ ${definition.reward}</small></em>`;
    els.prepWeeklyGoals.appendChild(card);
  });
}

function decorationById(id) {
  return DECORATIONS.find((item) => item.id === id);
}

function decorationIsUnlocked(decoration) {
  const weeklyUnlocked = decoration.unlock !== "weekly" || state.progression.cosmetics.weeklyBadges.length > 0;
  const levelUnlocked = !decoration.unlockLevel || managerLevelInfo().level >= decoration.unlockLevel;
  return weeklyUnlocked && levelUnlocked;
}

function renderDecorations() {
  const progression = state.progression;
  els.decorGrid.innerHTML = "";
  document.querySelector("#decor-wallet-value").textContent = progression.wallet.toLocaleString("ko-KR");
  document.querySelector("#decor-owned-count").textContent = `${progression.decor.owned.length} / ${DECORATIONS.length} 보유`;
  document.querySelector("#decor-summary").textContent = `${progression.decor.owned.length}개 보유`;
  els.decorTabs.forEach((tab) => {
    const active = tab.dataset.decorTab === state.decorTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
  DECORATIONS.filter((item) => item.type === state.decorTab).forEach((decoration) => {
    const owned = progression.decor.owned.includes(decoration.id);
    const equipped = progression.decor.equipped[decoration.type] === decoration.id;
    const unlocked = decorationIsUnlocked(decoration);
    const card = document.createElement("article");
    card.className = `decor-item${owned ? " owned" : ""}${equipped ? " equipped" : ""}${unlocked ? "" : " locked"}`;
    const lockLabel = decoration.unlock === "weekly" ? "주간 목표 완성 필요" : `점장 Lv.${decoration.unlockLevel} 필요`;
    const lockCopy = decoration.unlock === "weekly" ? "주간 목표 3개를 모두 달성하면 해금됩니다." : `점장 레벨 ${decoration.unlockLevel}에서 해금됩니다.`;
    const action = equipped ? "장착 중" : owned ? "장착하기" : unlocked ? `◈ ${decoration.price}` : lockLabel;
    card.innerHTML = `<span>${unlocked ? decoration.icon : "?"}</span><div><small>${decoration.type.toUpperCase()}</small><h3>${unlocked ? decoration.title : "잠긴 장식"}</h3><p>${unlocked ? decoration.description : lockCopy}</p></div><button type="button" data-decor-action="${decoration.id}" ${equipped || !unlocked || (!owned && progression.wallet < decoration.price) ? "disabled" : ""}>${action}</button>`;
    card.querySelector("button").addEventListener("click", () => buyOrEquipDecoration(decoration.id));
    els.decorGrid.appendChild(card);
  });
  updateDecorPreview();
}

function buyOrEquipDecoration(id) {
  const decoration = decorationById(id);
  if (!decoration || !decorationIsUnlocked(decoration) || state.running) return;
  const progression = state.progression;
  if (!progression.decor.owned.includes(id)) {
    if (progression.wallet < decoration.price) return;
    progression.wallet -= decoration.price;
    progression.decor.owned.push(id);
    showToast(`${decoration.title} 구입 완료!`, "good", "✿", 1500);
  }
  progression.decor.equipped[decoration.type] = id;
  saveProgression();
  applyDecorations();
  updateProgressionUi();
  renderDecorations();
}

function applyDecorations() {
  const shop = document.querySelector("#shop");
  const equipped = state.progression.decor.equipped;
  [...shop.classList].filter((name) => name.startsWith("decor-")).forEach((name) => shop.classList.remove(name));
  Object.values(equipped).forEach((id) => shop.classList.add(`decor-${id}`));
  document.querySelector(".open-sign").textContent = equipped.sign === "sign_gold" ? "GOLD" : "OPEN";
  document.querySelector(".center-aisle .plant").textContent = equipped.plant === "plant_bloom" ? "✿" : "♣";
  updateDecorPreview();
}

function updateDecorPreview() {
  const preview = document.querySelector("#decor-preview");
  if (!preview) return;
  const equipped = state.progression.decor.equipped;
  preview.className = `decor-preview preview-${equipped.sign} preview-${equipped.floor} preview-${equipped.wall} preview-${equipped.plant}`;
  preview.querySelector(".preview-sign").textContent = equipped.sign === "sign_gold" ? "GOLD" : "OPEN";
}

function updateUpgradeCards() {
  ["machine", "tool"].forEach((type) => {
    const level = state.progression.upgrades[type];
    const costs = type === "machine" ? CONFIG.upgrades.machineCosts : CONFIG.upgrades.toolCosts;
    const card = document.querySelector(`.upgrade-card[data-upgrade="${type}"]`);
    const button = type === "machine" ? els.buyMachineUpgrade : els.buyToolUpgrade;
    card.querySelectorAll(".level-pips i").forEach((pip, index) => pip.classList.toggle("active", index < level));
    card.classList.toggle("maxed", level >= CONFIG.upgrades.maxLevel);
    if (level >= CONFIG.upgrades.maxLevel) {
      button.disabled = true;
      button.innerHTML = "<span>최고 레벨</span><strong>MAX</strong>";
      return;
    }
    const cost = costs[level];
    button.disabled = state.progression.wallet < cost;
    button.innerHTML = `<span>Lv.${level + 1} 강화</span><strong>◈ <b>${cost}</b></strong>`;
  });
}

function renderAchievements() {
  els.achievementList.innerHTML = "";
  ACHIEVEMENTS.forEach((achievement) => {
    const unlocked = state.progression.achievements.includes(achievement.id);
    const [value, target] = achievementProgress(achievement);
    const card = document.createElement("article");
    card.className = `achievement-item${unlocked ? " unlocked" : ""}`;
    card.innerHTML = `
      <span class="achievement-icon">${achievement.icon}</span>
      <div><h3>${achievement.title}</h3><p>${achievement.description}</p><i><b style="width:${Math.min(100, (value / target) * 100)}%"></b></i></div>
      <em>${unlocked ? "완료" : `${Math.min(value, target)} / ${target}`}<small>◈ ${achievement.reward}</small></em>
    `;
    els.achievementList.appendChild(card);
  });
}

function buyUpgrade(type) {
  if (state.running || !["machine", "tool"].includes(type)) return;
  const level = state.progression.upgrades[type];
  if (level >= CONFIG.upgrades.maxLevel) return;
  const costs = type === "machine" ? CONFIG.upgrades.machineCosts : CONFIG.upgrades.toolCosts;
  const cost = costs[level];
  if (state.progression.wallet < cost) {
    showToast("수익이 부족해요. 영업을 더 해주세요!", "bad", "◈", 1500);
    return;
  }
  state.progression.wallet -= cost;
  state.progression.upgrades[type] += 1;
  saveProgression();
  updateProgressionUi();
  showToast(`${type === "machine" ? "고속 모터" : "프로 청소 키트"} Lv.${level + 1} 완료!`, "good", "⚙", 1600);
  playSuccessJingle();
}

function dirtDisplayLabel(type) {
  const info = DIRT_INFO[type];
  return state.progression.preferences.colorAssist ? `${info.name} · ${TOOL_INFO[info.tool].name}` : info.name;
}

function updateSettingsUi() {
  const preferences = state.progression.preferences;
  els.bgmVolume.value = String(preferences.bgmVolume);
  els.sfxVolume.value = String(preferences.sfxVolume);
  document.querySelector("#bgm-volume-value").textContent = `${preferences.bgmVolume}%`;
  document.querySelector("#sfx-volume-value").textContent = `${preferences.sfxVolume}%`;
  els.vibrationSetting.checked = preferences.vibration;
  els.screenShakeSetting.checked = preferences.screenShake;
  els.reducedMotionSetting.checked = preferences.reducedMotion;
  els.colorAssistSetting.checked = preferences.colorAssist;
  els.highContrastSetting.checked = preferences.highContrast;
  els.textSizeSetting.value = preferences.textSize;
  document.querySelector("#save-version-label").textContent = `DATA v${state.progression.schemaVersion} · 자동 저장`;
}

function applyPreferences() {
  const preferences = state.progression.preferences;
  document.documentElement.classList.toggle("reduce-motion", preferences.reducedMotion);
  document.documentElement.classList.toggle("color-assist", preferences.colorAssist);
  document.documentElement.classList.toggle("high-contrast", preferences.highContrast);
  document.documentElement.classList.toggle("text-large", preferences.textSize === "large");
  document.documentElement.classList.toggle("text-largest", preferences.textSize === "largest");
  state.sound = preferences.soundEnabled;
  els.soundButton.setAttribute("aria-pressed", String(state.sound));
  els.soundButton.setAttribute("aria-label", state.sound ? "배경음과 효과음 끄기" : "배경음과 효과음 켜기");
  state.machines.forEach((machine) => {
    if (machine.dirt) machine.el.querySelector(".contamination small").textContent = dirtDisplayLabel(machine.dirt);
  });
  updateSettingsUi();
}

function updatePreference(key, value) {
  state.progression.preferences[key] = value;
  saveProgression();
  applyPreferences();
}

function vibrate(pattern) {
  if (!state.progression.preferences.vibration || typeof navigator.vibrate !== "function") return;
  navigator.vibrate(pattern);
}

function shakePlayArea() {
  if (!state.progression.preferences.screenShake || state.progression.preferences.reducedMotion) return;
  els.playArea.classList.remove("screen-shake");
  void els.playArea.offsetWidth;
  els.playArea.classList.add("screen-shake");
  window.setTimeout(() => els.playArea.classList.remove("screen-shake"), 420);
}

function openProgressionModal(modal) {
  if (state.running) return;
  const current = managementModalElements().find((item) => item.classList.contains("open"));
  if (!current) {
    state.lastFocusedElement = document.activeElement;
    state.returnModal = els.resultModal.classList.contains("open") ? "result-modal" : "intro-modal";
    [els.introModal, els.resultModal].forEach((item) => {
      item.classList.remove("open");
      item.setAttribute("aria-hidden", "true");
    });
  } else if (current !== modal) {
    current.classList.remove("open");
    current.setAttribute("aria-hidden", "true");
  }
  els.settingsModal.classList.remove("during-shift");
  modal.classList.add("open");
  modal.classList.add("switching-in");
  modal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => modal.classList.remove("switching-in"), 260);
  updateManagementNavigation(modal.id);
  updateProgressionUi();
  if (modal === els.decorModal) renderDecorations();
  if (modal === els.statsModal) renderShiftHistory();
  if (modal === els.settingsModal) updateSettingsUi();
  focusFirstInModal(modal);
}

function closeProgressionModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  const target = document.querySelector(`#${state.returnModal}`) || els.introModal;
  target.classList.add("open");
  target.setAttribute("aria-hidden", "false");
  if (state.lastFocusedElement instanceof HTMLElement) window.setTimeout(() => state.lastFocusedElement.focus(), 80);
}

function managementModalElements() {
  return MANAGEMENT_SCREENS.map((screen) => document.querySelector(`#${screen.id}`)).filter(Boolean);
}

function setupManagementNavigation() {
  managementModalElements().forEach((modal) => {
    const section = modal.querySelector(".modal");
    const description = section.querySelector(":scope > p");
    if (!description || section.querySelector(".management-nav")) return;
    const nav = document.createElement("nav");
    nav.className = "management-nav";
    nav.setAttribute("aria-label", "관리 화면");
    nav.innerHTML = MANAGEMENT_SCREENS.map((screen) => `<button type="button" data-management-target="${screen.id}"><span aria-hidden="true">${screen.icon}</span>${screen.label}</button>`).join("");
    description.insertAdjacentElement("afterend", nav);
    nav.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        if (state.running) return;
        const target = document.querySelector(`#${button.dataset.managementTarget}`);
        if (target) openProgressionModal(target);
      });
    });
  });
}

function updateManagementNavigation(activeId) {
  document.querySelectorAll(".management-nav button").forEach((button) => {
    const active = button.dataset.managementTarget === activeId;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

function openUtilityModal(modal) {
  state.lastFocusedElement = document.activeElement;
  if (state.running) {
    if (!state.paused) pauseGame(false);
    state.returnModal = "pause-modal";
  } else {
    state.returnModal = els.resultModal.classList.contains("open") ? "result-modal" : "intro-modal";
  }
  [els.introModal, els.resultModal, els.pauseModal].forEach((item) => {
    item.classList.remove("open");
    item.setAttribute("aria-hidden", "true");
  });
  modal.classList.add("open");
  modal.classList.toggle("during-shift", state.running);
  modal.setAttribute("aria-hidden", "false");
  updateSettingsUi();
  focusFirstInModal(modal);
}

function closeUtilityModal(modal) {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  modal.classList.remove("during-shift");
  const target = document.querySelector(`#${state.returnModal}`) || els.introModal;
  target.classList.add("open");
  target.setAttribute("aria-hidden", "false");
  if (state.lastFocusedElement instanceof HTMLElement) window.setTimeout(() => state.lastFocusedElement.focus(), 80);
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen({ navigationUI: "hide" });
  } catch (error) {
    showToast("이 브라우저에서는 전체 화면을 시작할 수 없어요.", "bad", "!", 1500);
  }
}

function updateInstallButtons(available) {
  els.installButtons.forEach((button) => {
    button.hidden = false;
    button.disabled = !available;
  });
  els.installStatus.textContent = available ? "홈 화면에 바로 추가" : "브라우저 메뉴에서도 설치 가능";
}

async function installApp() {
  if (!state.installPrompt) {
    showToast("브라우저 메뉴의 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 이용해 주세요.", "good", "＋", 1900);
    return;
  }
  state.installPrompt.prompt();
  await state.installPrompt.userChoice;
  state.installPrompt = null;
  updateInstallButtons(false);
}

function resetSavedData() {
  const accepted = window.confirm("최고 기록, 수익, 업그레이드, 업적과 도감 정보를 모두 초기화할까요? 이 작업은 되돌릴 수 없습니다.");
  if (!accepted) return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PROGRESSION_KEY);
  window.location.reload();
}

function exportSavedData() {
  const payload = {
    format: "bubbleTime75-save",
    appVersion: APP_VERSION,
    schemaVersion: state.progression.schemaVersion,
    exportedAt: new Date().toISOString(),
    best: state.best,
    progression: state.progression,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `bubble-time-75-save-${localDateKey()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  els.saveDataStatus.textContent = "저장 파일을 내보냈습니다. 안전한 곳에 보관해 주세요.";
}

async function importSavedData(file) {
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (payload?.format !== "bubbleTime75-save" || !payload.progression || typeof payload.progression !== "object") throw new Error("invalid save");
    const confirmed = window.confirm("이 파일의 기록과 진행 정보로 현재 저장 데이터를 교체할까요?");
    if (!confirmed) return;
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(payload.progression));
    if (payload.best && Number.isFinite(payload.best.score) && typeof payload.best.rank === "string") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.best));
    }
    els.saveDataStatus.textContent = "저장 데이터를 가져왔습니다. 화면을 다시 불러옵니다.";
    window.setTimeout(() => window.location.reload(), 450);
  } catch (error) {
    els.saveDataStatus.textContent = "올바른 버블타임 75 저장 파일이 아닙니다.";
    showToast("저장 파일을 읽지 못했어요.", "bad", "!", 1600);
  } finally {
    els.importDataInput.value = "";
  }
}

function initializeVersionNotice() {
  document.querySelector("#app-version-label").textContent = APP_VERSION;
  const unseen = localStorage.getItem(SEEN_VERSION_KEY) !== APP_VERSION;
  els.updatesButton.classList.toggle("has-update", unseen);
  els.updatesButton.setAttribute("aria-label", unseen ? `업데이트 ${APP_VERSION} 새 소식 보기` : "업데이트 보기");
}

function markVersionSeen() {
  localStorage.setItem(SEEN_VERSION_KEY, APP_VERSION);
  els.updatesButton.classList.remove("has-update");
  els.updatesButton.setAttribute("aria-label", "업데이트 보기");
}

function showAppUpdate(registration) {
  state.updateRegistration = registration;
  els.appUpdateBanner.hidden = false;
}

function focusFirstInModal(modal) {
  const target = modal.querySelector("button:not(:disabled), input:not(:disabled), [tabindex='0']");
  if (target) window.setTimeout(() => target.focus(), 80);
}

function getAudioContext() {
  if (!state.audioContext) {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine) throw new Error("Web Audio is not supported");
    state.audioContext = new AudioEngine();
  }
  if (state.audioContext.state === "suspended") state.audioContext.resume();
  return state.audioContext;
}

function playTone(frequency, duration, wave = "sine", volume = 0.045, delay = 0, channel = "sfx") {
  if (!state.sound) return;
  const channelVolume = state.progression.preferences[channel === "bgm" ? "bgmVolume" : "sfxVolume"] / 100;
  if (channelVolume <= 0) return;
  try {
    const audio = getAudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const startsAt = audio.currentTime + delay;
    oscillator.type = wave;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume * channelVolume, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + duration);
  } catch (error) {
    state.sound = false;
    stopBgm();
    els.soundButton.setAttribute("aria-pressed", "false");
  }
}

function startBgm() {
  if (!state.sound || !state.running || state.paused || state.musicTimer) return;
  state.musicStep = 0;
  playMusicStep();
  state.musicTimer = window.setInterval(playMusicStep, 720);
}

function stopBgm() {
  if (!state.musicTimer) return;
  window.clearInterval(state.musicTimer);
  state.musicTimer = null;
}

function playMusicStep() {
  if (!state.sound || !state.running || state.paused) return;
  const melody = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
  const note = melody[state.musicStep % melody.length];
  playTone(note, 0.58, "triangle", 0.009, 0, "bgm");
  if (state.musicStep % 4 === 0) playTone(note / 2, 0.8, "sine", 0.0055, 0, "bgm");
  if (state.musicStep % 8 === 7) playTone(note * 2, 0.22, "sine", 0.004, 0.18, "bgm");
  state.musicStep += 1;
}

function playCleanSound(tool, combo = 0) {
  const roots = { squeegee: 620, duster: 700, basket: 520 };
  const root = (roots[tool] || 640) + Math.min(combo, 10) * 14;
  playTone(root, 0.08, "sine", 0.04);
  playTone(root * 1.25, 0.1, "sine", 0.032, 0.055);
  playTone(root * 1.5, 0.13, "triangle", 0.024, 0.12);
  if ([CONFIG.combo.tierTwo, CONFIG.combo.tierThree, CONFIG.combo.tierFour].includes(combo)) {
    playTone(root * 2, 0.22, "sine", 0.038, 0.19);
  }
}

function playRefundSound() {
  playTone(190, 0.18, "sawtooth", 0.035);
  playTone(135, 0.24, "sawtooth", 0.028, 0.12);
}

function playSuccessJingle() {
  [523.25, 659.25, 783.99, 1046.5].forEach((tone, index) => {
    playTone(tone, 0.2, "sine", 0.035, index * 0.11);
  });
}

function playSpotlessJingle() {
  [659.25, 783.99, 987.77, 1174.66].forEach((tone, index) => {
    playTone(tone, 0.24, index % 2 ? "triangle" : "sine", 0.034, index * 0.1);
  });
}

function playSGradeJingle() {
  [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((tone, index) => {
    playTone(tone, 0.28, index < 3 ? "triangle" : "sine", 0.04, index * 0.09);
  });
  playTone(261.63, 0.72, "sine", 0.018, 0.12);
}

function playLevelUpJingle() {
  [392, 523.25, 659.25, 783.99, 1046.5].forEach((tone, index) => {
    playTone(tone, 0.22, "square", 0.024, index * 0.085);
    playTone(tone * 1.5, 0.18, "sine", 0.018, index * 0.085 + 0.04);
  });
}

function playSecretJingle() {
  [520, 660, 780, 1040].forEach((tone, index) => {
    playTone(tone, 0.14, "sine", 0.038, index * 0.09);
  });
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function shuffle(list) {
  const result = [...list];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

els.toolButtons.forEach((button) => {
  button.dataset.label = TOOL_INFO[button.dataset.tool].name;
  button.addEventListener("click", () => selectTool(button.dataset.tool));
});

els.startButton.addEventListener("click", () => {
  if (!state.progression.tutorial.completed) startTutorial();
  else openPrepModal(false);
});
els.skipOnboardingButton.addEventListener("click", () => openPrepModal(false));
els.tutorialButton.addEventListener("click", startTutorial);
els.helpTutorialButton.addEventListener("click", startTutorial);
els.tutorialExitButton.addEventListener("click", exitTutorial);
els.tutorialFinishButton.addEventListener("click", exitTutorial);
els.restartButton.addEventListener("click", retrySameShift);
els.newPlanButton.addEventListener("click", () => openFreshShiftPlan(false));
els.nextDifficultyButton.addEventListener("click", () => openFreshShiftPlan(true));
els.resultUnlockButton.addEventListener("click", openResultUnlock);
els.pauseRestartButton.addEventListener("click", () => openPrepModal(true, false));
els.confirmStartButton.addEventListener("click", confirmPreparedShift);
els.prepCloseButton.addEventListener("click", closePrepModal);
els.shiftPlans.forEach((plan) => {
  plan.querySelector("input").addEventListener("change", () => {
    state.difficulty = plan.dataset.difficulty;
    updatePrepUi();
  });
});
els.pauseButton.addEventListener("click", () => pauseGame(false));
els.resumeButton.addEventListener("click", resumeGame);
els.shopButton.addEventListener("click", () => openProgressionModal(els.shopModal));
els.resultShopButton.addEventListener("click", () => openProgressionModal(els.shopModal));
els.achievementsButton.addEventListener("click", () => openProgressionModal(els.achievementsModal));
els.resultAchievementsButton.addEventListener("click", () => openProgressionModal(els.achievementsModal));
els.codexButton.addEventListener("click", () => openProgressionModal(els.codexModal));
els.resultCodexButton.addEventListener("click", () => openProgressionModal(els.codexModal));
els.decorButton.addEventListener("click", () => openProgressionModal(els.decorModal));
els.resultDecorButton.addEventListener("click", () => openProgressionModal(els.decorModal));
els.settingsButton.addEventListener("click", () => openUtilityModal(els.settingsModal));
els.introSettingsButton.addEventListener("click", () => openProgressionModal(els.settingsModal));
els.resultSettingsButton.addEventListener("click", () => openProgressionModal(els.settingsModal));
els.managerButton.addEventListener("click", () => openProgressionModal(els.statsModal));
els.resultStatsButton.addEventListener("click", () => openProgressionModal(els.statsModal));
els.helpButton.addEventListener("click", () => openUtilityModal(els.helpModal));
els.updatesButton.addEventListener("click", () => {
  markVersionSeen();
  openUtilityModal(els.updatesModal);
});
els.shopCloseButton.addEventListener("click", () => closeProgressionModal(els.shopModal));
els.achievementsCloseButton.addEventListener("click", () => closeProgressionModal(els.achievementsModal));
els.codexCloseButton.addEventListener("click", () => closeProgressionModal(els.codexModal));
els.decorCloseButton.addEventListener("click", () => closeProgressionModal(els.decorModal));
els.statsCloseButton.addEventListener("click", () => closeProgressionModal(els.statsModal));
els.settingsCloseButton.addEventListener("click", () => {
  if (els.settingsModal.classList.contains("during-shift")) closeUtilityModal(els.settingsModal);
  else closeProgressionModal(els.settingsModal);
});
els.helpCloseButton.addEventListener("click", () => closeUtilityModal(els.helpModal));
els.updatesCloseButton.addEventListener("click", () => closeUtilityModal(els.updatesModal));
els.codexTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.codexTab = tab.dataset.codexTab;
    updateCodexUi();
  });
});
els.decorTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    state.decorTab = tab.dataset.decorTab;
    renderDecorations();
  });
});
els.detergentStation.addEventListener("click", handleDetergentClick);
els.breakerPanel.addEventListener("click", handleBreakerClick);
els.buyMachineUpgrade.addEventListener("click", () => buyUpgrade("machine"));
els.buyToolUpgrade.addEventListener("click", () => buyUpgrade("tool"));
els.bgmVolume.addEventListener("input", () => updatePreference("bgmVolume", Number(els.bgmVolume.value)));
els.sfxVolume.addEventListener("input", () => updatePreference("sfxVolume", Number(els.sfxVolume.value)));
els.vibrationSetting.addEventListener("change", () => updatePreference("vibration", els.vibrationSetting.checked));
els.screenShakeSetting.addEventListener("change", () => updatePreference("screenShake", els.screenShakeSetting.checked));
els.reducedMotionSetting.addEventListener("change", () => updatePreference("reducedMotion", els.reducedMotionSetting.checked));
els.colorAssistSetting.addEventListener("change", () => updatePreference("colorAssist", els.colorAssistSetting.checked));
els.highContrastSetting.addEventListener("change", () => updatePreference("highContrast", els.highContrastSetting.checked));
els.textSizeSetting.addEventListener("change", () => updatePreference("textSize", els.textSizeSetting.value));
els.firstShiftGuideClose.addEventListener("click", dismissFirstShiftGuide);
els.fullscreenButton.addEventListener("click", toggleFullscreen);
els.installButtons.forEach((button) => button.addEventListener("click", installApp));
els.resetDataButton.addEventListener("click", resetSavedData);
els.exportDataButton.addEventListener("click", exportSavedData);
els.importDataButton.addEventListener("click", () => els.importDataInput.click());
els.importDataInput.addEventListener("change", () => importSavedData(els.importDataInput.files[0]));
els.applyUpdateButton.addEventListener("click", () => {
  const waiting = state.updateRegistration?.waiting;
  if (waiting) waiting.postMessage({ type: "SKIP_WAITING" });
  else window.location.reload();
});
els.dismissUpdateButton.addEventListener("click", () => { els.appUpdateBanner.hidden = true; });
els.soundButton.addEventListener("click", () => {
  updatePreference("soundEnabled", !state.sound);
  if (state.sound) {
    playTone(600, 0.09, "sine", 0.04);
    startBgm();
  } else {
    stopBgm();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.repeat) return;
  if (event.key === "Escape" && !els.tutorialOverlay.hidden) {
    event.preventDefault();
    exitTutorial();
    return;
  }
  const openModal = document.querySelector(".modal-backdrop.open");
  if (event.key === "Tab" && openModal) {
    const focusable = [...openModal.querySelectorAll("button:not(:disabled), input:not(:disabled), [tabindex='0']")].filter((element) => element.offsetParent !== null);
    if (focusable.length) {
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  if (els.prepModal.classList.contains("open")) {
    if (event.key === "Escape") { event.preventDefault(); closePrepModal(); }
    else if (event.key === "Enter" && !["INPUT", "BUTTON"].includes(document.activeElement?.tagName)) { event.preventDefault(); confirmPreparedShift(); }
    return;
  }
  const tablist = document.activeElement?.closest?.(".management-nav, .codex-tabs, .decor-tabs");
  if (tablist && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
    const tabs = [...tablist.querySelectorAll("button:not(:disabled)")];
    const currentIndex = Math.max(0, tabs.indexOf(document.activeElement));
    const targetIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : event.key === "ArrowLeft" ? (currentIndex - 1 + tabs.length) % tabs.length : (currentIndex + 1) % tabs.length;
    event.preventDefault();
    tabs[targetIndex]?.focus();
    tabs[targetIndex]?.click();
    return;
  }
  const openProgressionModalElement = managementModalElements().find((modal) => modal.classList.contains("open") && !modal.classList.contains("during-shift"));
  if (event.key === "Escape" && openProgressionModalElement) {
    event.preventDefault();
    closeProgressionModal(openProgressionModalElement);
    return;
  }
  const openUtilityModalElement = [els.settingsModal, els.helpModal, els.updatesModal].find((modal) => modal.classList.contains("open"));
  if (event.key === "Escape" && openUtilityModalElement) {
    event.preventDefault();
    if (openUtilityModalElement === els.settingsModal && !openUtilityModalElement.classList.contains("during-shift")) closeProgressionModal(openUtilityModalElement);
    else closeUtilityModal(openUtilityModalElement);
    return;
  }
  if ((event.key.toLowerCase() === "p" || event.key === "Escape") && state.running && !state.tutorialActive) {
    event.preventDefault();
    if (state.paused) resumeGame();
    else pauseGame(false);
    return;
  }
  if (!state.paused && ["1", "2", "3", "4", "5", "6"].includes(event.key)) {
    selectTool(Object.keys(TOOL_INFO)[Number(event.key) - 1]);
  }
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.running && !state.paused && !state.tutorialActive) pauseGame(true);
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  state.installPrompt = event;
  updateInstallButtons(true);
});

window.addEventListener("appinstalled", () => {
  state.installPrompt = null;
  updateInstallButtons(false);
  showToast("버블타임 75가 앱으로 설치됐어요!", "good", "✓", 1800);
});

if ("serviceWorker" in navigator) {
  const hadActiveServiceWorker = Boolean(navigator.serviceWorker.controller);
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").then((registration) => {
      if (registration.waiting) showAppUpdate(registration);
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) showAppUpdate(registration);
        });
      });
    }).catch(() => document.documentElement.classList.add("service-worker-unavailable"));
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadActiveServiceWorker) return;
    if (state.reloadForUpdate) return;
    state.reloadForUpdate = true;
    window.location.reload();
  });
}

setupManagementNavigation();
resetGame();
initializeVersionNotice();
