"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const browserCandidates = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const browserPath = browserCandidates.find((candidate) => fs.existsSync(candidate));

if (!browserPath) throw new Error("Chrome 또는 Edge를 찾지 못했습니다. BROWSER_PATH를 지정해 주세요.");
if (typeof WebSocket !== "function") throw new Error("UI 회귀 검사는 WebSocket을 제공하는 Node.js 22 이상이 필요합니다.");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const target = path.resolve(root, relative);
  if (!target.startsWith(`${root}${path.sep}`) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": contentTypes[path.extname(target)] || "application/octet-stream", "cache-control": "no-store" });
  fs.createReadStream(target).pipe(response);
});

let browserProcess;
let socket;
let profileDirectory;
let messageSequence = 0;
const pending = new Map();

function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++messageSequence;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

async function evaluate(expression) {
  const response = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || "Browser evaluation failed");
  return response.result.value;
}

async function waitFor(expression, timeout = 7000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await wait(80);
  }
  throw new Error(`UI 대기 시간 초과: ${expression}`);
}

async function connectToBrowser(port) {
  let pages = [];
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      pages = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
      if (pages.length) break;
    } catch (error) {
      // Browser is still starting.
    }
    await wait(100);
  }
  const page = pages.find((entry) => entry.type === "page");
  if (!page) throw new Error("헤드리스 브라우저 탭에 연결하지 못했습니다.");
  socket = new WebSocket(page.webSocketDebuggerUrl);
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const operation = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) operation.reject(new Error(message.error.message));
    else operation.resolve(message.result);
  });
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
}

async function run() {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const appUrl = `http://127.0.0.1:${address.port}/`;
  profileDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "bubble-time-ui-"));
  browserProcess = spawn(browserPath, [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-background-networking",
    "--remote-debugging-port=0",
    `--user-data-dir=${profileDirectory}`,
    "--window-size=1280,1000",
    appUrl,
  ], { stdio: "ignore", windowsHide: true });

  const portFile = path.join(profileDirectory, "DevToolsActivePort");
  for (let attempt = 0; attempt < 100 && !fs.existsSync(portFile); attempt += 1) await wait(100);
  if (!fs.existsSync(portFile)) throw new Error("브라우저 디버깅 포트가 열리지 않았습니다.");
  const port = Number(fs.readFileSync(portFile, "utf8").split(/\r?\n/)[0]);
  await connectToBrowser(port);
  await cdp("Runtime.enable");
  await cdp("Page.enable");
  await waitFor("document.readyState === 'complete' && typeof state !== 'undefined'");

  console.log("UI 회귀: 데스크톱 핵심 흐름 확인");
  const firstScreen = await evaluate(`({
    intro: document.querySelector('#intro-modal').classList.contains('open'),
    role: document.querySelector('#intro-modal').getAttribute('role'),
    modalBackdrops: document.querySelectorAll('.modal-backdrop').length,
    screenViews: document.querySelectorAll('.screen-view').length,
    start: document.querySelector('#start-button').innerText,
    skipVisible: !document.querySelector('#skip-onboarding-button').hidden
  })`);
  assert.equal(firstScreen.intro, true, "첫 화면이 열려야 합니다.");
  assert.equal(firstScreen.role, "region", "홈은 팝업 대화상자가 아닌 전용 화면이어야 합니다.");
  assert.equal(firstScreen.modalBackdrops, 3, "실제 모달은 도움말·업데이트·일시정지 세 개만 유지해야 합니다.");
  assert.equal(firstScreen.screenViews, 9, "홈·준비·결과와 관리 기능은 전용 화면이어야 합니다.");
  assert.match(firstScreen.start, /실습부터 시작하기/, "첫 이용자는 실습으로 안내해야 합니다.");
  assert.equal(firstScreen.skipVisible, true, "튜토리얼 건너뛰기 선택지가 필요합니다.");

  await evaluate("document.querySelector('#skip-onboarding-button').click()");
  await waitFor("document.querySelector('#prep-modal').classList.contains('open')");
  await waitFor("document.querySelectorAll('#shift-objective-list article').length === 2");
  await wait(180);
  assert.equal(await evaluate("document.querySelector('#prep-modal .modal').scrollTop"), 0, "준비 화면은 맨 위에서 시작해야 합니다.");
  assert.equal(await evaluate("document.querySelectorAll('#shift-objective-list article').length"), 2, "영업 목표 두 개가 표시되어야 합니다.");
  const modeOptions = await evaluate(`({
    count: document.querySelectorAll('#shift-modes [data-mode]').length,
    durations: Object.values(GAME_MODES).map((mode) => mode.seconds)
  })`);
  assert.equal(modeOptions.count, 4, "영업 모드 네 개가 모두 표시되어야 합니다.");
  assert.deepEqual(modeOptions.durations, [45, 75, 120, null], "45초·75초·120초·무한 영업 시간이 정확해야 합니다.");

  await evaluate("document.querySelector('[data-mode=quick] input').click()");
  const quickMode = await evaluate(`({ mode: state.mode, label: document.querySelector('#prep-mode').textContent, time: currentGameMode().seconds, objectives: state.shiftObjectives.map((item) => item.target) })`);
  assert.equal(quickMode.mode, "quick", "45초 빠른 영업을 선택할 수 있어야 합니다.");
  assert.equal(quickMode.time, 45, "빠른 영업은 45초여야 합니다.");
  assert.match(quickMode.label, /45초/, "준비 요약에 선택한 모드가 표시되어야 합니다.");
  await evaluate("document.querySelector('[data-mode=standard] input').click()");

  await evaluate(`
    state.progression.tutorial.completed = true;
    state.progression.onboarding.firstShiftComplete = true;
    updateProgressionUi();
    closePrepModal();
    document.querySelector('#manager-button').click();
  `);
  await waitFor("document.querySelector('#stats-modal').classList.contains('open')");
  assert.equal(await evaluate("document.querySelectorAll('#stats-modal .management-nav button').length"), 4, "관리 센터는 네 그룹으로 정리되어야 합니다.");
  assert.equal(await evaluate("document.querySelector('#stats-modal').getAttribute('role')"), "region", "관리 센터는 팝업이 아닌 전용 화면이어야 합니다.");
  await evaluate("document.querySelector('#stats-modal [data-management-group=\"collection\"]').click()");
  await waitFor("document.querySelector('#codex-modal').classList.contains('open')");
  assert.equal(await evaluate("document.querySelectorAll('#codex-modal .management-subnav button').length"), 2, "컬렉션 그룹에서 도감과 꾸미기를 바로 전환할 수 있어야 합니다.");
  await wait(350);
  await evaluate("document.querySelector('#codex-modal [data-management-group=\"settings\"]').click()");
  await waitFor("document.querySelector('#settings-modal').classList.contains('open')");
  assert.equal(await evaluate("document.querySelector('#settings-modal').getAttribute('role')"), "region", "영업 전 설정은 관리 센터 화면이어야 합니다.");

  await evaluate(`
    closeProgressionModal(els.settingsModal);
    state.shiftObjectives = [shiftObjectiveById('clean_6'), shiftObjectiveById('refundless')];
    startGame();
    document.querySelector('#settings-button').click();
  `);
  await waitFor("document.querySelector('#settings-modal').classList.contains('during-shift')");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('#settings-modal .management-nav')).display"), "none", "영업 중 설정에서는 관리 탭을 숨겨야 합니다.");
  assert.equal(await evaluate("document.querySelector('#settings-modal').getAttribute('role')"), "dialog", "영업 중 빠른 설정만 실제 모달이어야 합니다.");
  await evaluate("document.querySelector('#settings-close-button').click()");
  await waitFor("document.querySelector('#pause-modal').classList.contains('open')");

  await evaluate(`
    resumeGame();
    clearGameTimers();
    const washer = state.machines.find((item) => item.id === 'washer-1');
    makeDirty(washer, 'limescale');
    selectTool('squeegee');
    washer.el.click();
    triggerRandomEvent('breakdown');
    const broken = state.machines.find((item) => item.broken);
    selectTool('wrench');
    broken.el.click();
    triggerRandomEvent('blackout');
    document.querySelector('#breaker-panel').click();
    triggerRandomEvent('detergent');
    selectTool('detergent');
    document.querySelector('#detergent-station').click();
    clearGameTimers();
  `);
  const operations = await evaluate(`({ cleaned: state.cleaned, breakdown: state.eventsHandled.breakdown, blackout: state.eventsHandled.blackout, detergent: state.eventsHandled.detergent })`);
  assert.equal(operations.cleaned, 1, "올바른 도구로 실제 오염을 청소해야 합니다.");
  assert.equal(operations.breakdown, 1, "렌치로 고장 사건을 처리해야 합니다.");
  assert.equal(operations.blackout, 1, "차단기로 정전을 복구해야 합니다.");
  assert.equal(operations.detergent, 1, "보충통으로 세제 부족을 처리해야 합니다.");

  await evaluate(`
    const dryer = state.machines.find((item) => item.id === 'dryer-1');
    makeDirty(dryer, 'dust');
    enqueueGuest();
    state.score = 1234;
    state.elapsedSeconds = 22;
    state.seconds = 53;
    saveShiftCheckpoint();
    location.reload();
  `);
  await waitFor("document.readyState === 'complete' && typeof state !== 'undefined' && !document.querySelector('#resume-shift-card').hidden");
  await evaluate("document.querySelector('#resume-shift-button').click()");
  await waitFor("state.running === true && state.paused === true && document.querySelector('#pause-modal').classList.contains('open')");
  const restored = await evaluate(`({ score: state.score, queue: state.queue.length, dirt: state.machines.find((item) => item.id === 'dryer-1').dirt, mode: state.mode })`);
  assert.equal(restored.score, 1234, "중단 전 점수를 복구해야 합니다.");
  assert.equal(restored.queue, 1, "대기 손님을 복구해야 합니다.");
  assert.equal(restored.dirt, "dust", "기계 오염을 복구해야 합니다.");
  assert.equal(restored.mode, "standard", "선택한 영업 모드를 복구해야 합니다.");

  await evaluate(`
    resumeGame();
    clearGameTimers();
    state.score = 4200;
    state.refunds = 0;
    state.cleaned = 8;
    state.served = 8;
    state.maxCombo = 7;
    state.happyGuests = 8;
    state.satisfactionCount = 8;
    state.satisfactionTotal = 760;
    endGame(true, 'time');
  `);
  await waitFor("document.querySelector('#result-modal').classList.contains('open')");
  await wait(420);
  assert.equal(await evaluate("document.querySelector('#result-modal .modal').scrollTop"), 0, "결과 화면은 맨 위에서 시작해야 합니다.");
  const resultScreen = await evaluate(`({
    objectives: document.querySelectorAll('#result-objective-list article').length,
    completed: document.querySelectorAll('#result-objective-list article.completed').length,
    retry: document.querySelector('#restart-button').innerText,
    home: document.querySelector('#result-home-button').innerText,
    next: document.querySelector('#next-difficulty-button').innerText,
    detailsOpen: document.querySelector('#result-details').open,
    celebration: document.querySelectorAll('#result-celebration i').length,
    levelUp: document.querySelector('.result-card').classList.contains('level-up'),
    unlockVisible: !document.querySelector('#result-unlock-button').hidden
  })`);
  assert.deepEqual(resultScreen.objectives, 2, "결과에 목표 두 개가 표시되어야 합니다.");
  assert.deepEqual(resultScreen.completed, 2, "충족한 목표는 완료 처리되어야 합니다.");
  assert.match(resultScreen.retry, /같은 조건/, "같은 조건 재도전 버튼이 필요합니다.");
  assert.match(resultScreen.home, /홈으로/, "결과에서 홈으로 돌아가는 버튼이 필요합니다.");
  assert.equal(resultScreen.detailsOpen, true, "데스크톱 결과 화면은 상세 기록을 바로 보여야 합니다.");
  assert.match(resultScreen.next, /피크 타임/, "다음 난이도를 제안해야 합니다.");
  assert.ok(resultScreen.celebration >= 24, "성과 축하 입자가 표시되어야 합니다.");
  assert.equal(resultScreen.levelUp, true, "첫 우수 영업은 레벨업 연출을 보여야 합니다.");
  assert.equal(resultScreen.unlockVisible, true, "새 해금 콘텐츠 이동 버튼이 필요합니다.");
  assert.equal(await evaluate("resultShareCanvas().toDataURL('image/png').startsWith('data:image/png')"), true, "결과 공유 카드를 PNG로 만들 수 있어야 합니다.");
  assert.equal(await evaluate("state.progression.records.standard.score"), 4200, "75초 최고 기록은 모드별로 저장되어야 합니다.");

  const retryIds = await evaluate("state.lastShiftPlan.objectiveIds.join(',')");
  await evaluate("document.querySelector('#result-home-button').click()");
  await waitFor("document.querySelector('#intro-modal').classList.contains('open') && !document.querySelector('#result-modal').classList.contains('open')");
  assert.equal(await evaluate("state.running"), false, "결과에서 홈으로 이동하면 영업 상태가 안전하게 초기화되어야 합니다.");
  await evaluate(`
    document.querySelector('#intro-modal').classList.remove('open');
    document.querySelector('#result-modal').classList.add('open');
    document.querySelector('#result-modal').setAttribute('aria-hidden', 'false');
    document.querySelector('#restart-button').click();
  `);
  await waitFor("state.running === true && !document.querySelector('#result-modal').classList.contains('open')");
  assert.equal(await evaluate("state.shiftObjectives.map((item) => item.id).join(',')"), retryIds, "재도전은 같은 목표를 유지해야 합니다.");
  console.log("UI 회귀: 모바일 관리 화면 확인");
  await evaluate("resetGame(); state.progression.onboarding.firstShiftComplete = true; updateProgressionUi(); openProgressionModal(els.statsModal)");
  await waitFor("document.querySelector('#stats-modal').classList.contains('open')");
  await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  const mobileNavigation = await evaluate(`({
    columns: getComputedStyle(document.querySelector('#stats-modal .management-nav')).gridTemplateColumns.split(' ').length,
    buttons: [...document.querySelectorAll('#stats-modal .management-nav button')].filter((button) => button.offsetWidth > 0).length,
    position: getComputedStyle(document.querySelector('#stats-modal .management-nav')).position
  })`);
  assert.equal(mobileNavigation.columns, 4, "모바일 관리 메뉴는 네 그룹 한 줄이어야 합니다.");
  assert.equal(mobileNavigation.buttons, 4, "모바일 관리 센터 그룹 네 개가 보여야 합니다.");
  assert.equal(mobileNavigation.position, "fixed", "모바일 관리 메뉴는 긴 화면에서도 아래에 고정되어야 합니다.");

  await evaluate("closeProgressionModal(els.statsModal)");
  await waitFor("document.querySelector('#intro-modal').classList.contains('open')");
  const mobileHome = await evaluate(`({
    hubDisplay: getComputedStyle(document.querySelector('#mobile-manager-button')).display,
    legacyActions: getComputedStyle(document.querySelector('.progression-actions')).display,
    startFont: parseFloat(getComputedStyle(document.querySelector('#start-button')).fontSize),
    utilityFont: parseFloat(getComputedStyle(document.querySelector('#tutorial-button')).fontSize),
    fitsViewport: document.querySelector('#intro-modal').scrollHeight <= document.querySelector('#intro-modal').clientHeight + 2
  })`);
  assert.equal(mobileHome.hubDisplay, "grid", "모바일 홈에는 통합 관리 센터 진입 카드가 보여야 합니다.");
  assert.equal(mobileHome.legacyActions, "none", "모바일 홈에서는 네 개 관리 버튼을 한꺼번에 노출하지 않아야 합니다.");
  assert.ok(mobileHome.startFont >= 15, "모바일 시작 버튼 글자는 15px 이상이어야 합니다.");
  assert.ok(mobileHome.utilityFont >= 11, "모바일 보조 버튼 글자는 11px 이상이어야 합니다.");
  assert.equal(mobileHome.fitsViewport, true, "모바일 홈 핵심 행동은 첫 화면 안에 들어와야 합니다.");

  console.log("UI 회귀: 모바일 페이지 슬라이드 확인");
  const helpEntering = await evaluate(`(() => {
    document.querySelector('#help-button').click();
    const modal = document.querySelector('#help-modal');
    return {
      entering: modal.classList.contains('mobile-page-entering'),
      role: modal.getAttribute('role'),
      homeStillOpen: document.querySelector('#intro-modal').classList.contains('open')
    };
  })()`);
  assert.equal(helpEntering.entering, true, "모바일 도움말은 오른쪽에서 들어오는 페이지 전환을 시작해야 합니다.");
  assert.equal(helpEntering.role, "region", "모바일 도움말은 팝업이 아닌 독립 페이지로 안내되어야 합니다.");
  assert.equal(helpEntering.homeStillOpen, true, "슬라이드 중에는 홈이 뒤쪽 페이지로 남아 있어야 합니다.");
  await waitFor("document.querySelector('#help-modal').classList.contains('open') && !document.querySelector('#help-modal').classList.contains('mobile-page-entering') && !document.querySelector('#intro-modal').classList.contains('open')");
  const helpPage = await evaluate(`({
    borderRadius: getComputedStyle(document.querySelector('#help-modal .modal')).borderRadius,
    backdropFilter: getComputedStyle(document.querySelector('#help-modal')).backdropFilter,
    ariaModal: document.querySelector('#help-modal').getAttribute('aria-modal')
  })`);
  assert.equal(helpPage.borderRadius, "0px", "모바일 도움말은 카드 모서리가 없는 전체 페이지여야 합니다.");
  assert.ok(helpPage.backdropFilter === "none" || helpPage.backdropFilter === "", "모바일 도움말 뒤에는 팝업 블러가 없어야 합니다.");
  assert.equal(helpPage.ariaModal, null, "모바일 도움말은 모달로 노출되지 않아야 합니다.");
  const helpLeaving = await evaluate(`(() => {
    document.querySelector('#help-close-button').click();
    return document.querySelector('#help-modal').classList.contains('mobile-page-leaving');
  })()`);
  assert.equal(helpLeaving, true, "모바일 도움말의 홈 버튼은 왼쪽으로 돌아가는 전환을 시작해야 합니다.");
  await waitFor("document.querySelector('#intro-modal').classList.contains('open') && !document.querySelector('#help-modal').classList.contains('open')");

  const updatesEntering = await evaluate(`(() => {
    document.querySelector('#updates-button').click();
    return document.querySelector('#updates-modal').classList.contains('mobile-page-entering');
  })()`);
  assert.equal(updatesEntering, true, "모바일 업데이트 안내도 페이지 슬라이드로 열려야 합니다.");
  await waitFor("document.querySelector('#updates-modal').classList.contains('open') && !document.querySelector('#updates-modal').classList.contains('mobile-page-entering') && !document.querySelector('#intro-modal').classList.contains('open')");
  const updatesPage = await evaluate(`({
    role: document.querySelector('#updates-modal').getAttribute('role'),
    borderRadius: getComputedStyle(document.querySelector('#updates-modal .modal')).borderRadius
  })`);
  assert.equal(updatesPage.role, "region", "모바일 업데이트 안내는 독립 페이지여야 합니다.");
  assert.equal(updatesPage.borderRadius, "0px", "모바일 업데이트 안내는 팝업 카드처럼 보이지 않아야 합니다.");
  await evaluate("document.querySelector('#updates-close-button').click()");
  await waitFor("document.querySelector('#intro-modal').classList.contains('open') && !document.querySelector('#updates-modal').classList.contains('open')");

  const settingsEntering = await evaluate(`(() => {
    document.querySelector('#intro-settings-button').click();
    return document.querySelector('#settings-modal').classList.contains('mobile-page-entering');
  })()`);
  assert.equal(settingsEntering, true, "모바일 설정도 페이지 슬라이드로 열려야 합니다.");
  await waitFor("document.querySelector('#settings-modal').classList.contains('open') && !document.querySelector('#settings-modal').classList.contains('mobile-page-entering') && !document.querySelector('#intro-modal').classList.contains('open')");
  const settingsPage = await evaluate(`({
    role: document.querySelector('#settings-modal').getAttribute('role'),
    position: getComputedStyle(document.querySelector('#settings-modal')).position,
    borderRadius: getComputedStyle(document.querySelector('#settings-modal .modal')).borderRadius
  })`);
  assert.equal(settingsPage.role, "region", "모바일 설정은 모달이 아닌 독립 페이지여야 합니다.");
  assert.equal(settingsPage.position, "fixed", "모바일 설정은 화면 전체를 차지해야 합니다.");
  assert.equal(settingsPage.borderRadius, "0px", "모바일 설정의 바깥 카드는 제거되어야 합니다.");
  await evaluate("document.querySelector('#settings-close-button').click()");
  await waitFor("document.querySelector('#intro-modal').classList.contains('open') && !document.querySelector('#settings-modal').classList.contains('open')");

  console.log("UI 회귀: 모바일 한 화면 영업 확인");
  await evaluate(`
    state.shiftObjectives = [shiftObjectiveById('clean_6'), shiftObjectiveById('refundless')];
    startGame();
    clearGameTimers();
  `);
  const mobileGame = await evaluate(`({
    toolColumns: getComputedStyle(document.querySelector('#tools')).gridTemplateColumns.split(' ').length,
    toolLabelFont: parseFloat(getComputedStyle(document.querySelector('.tool'), '::before').fontSize),
    hudLabelFont: parseFloat(getComputedStyle(document.querySelector('.hud-card small')).fontSize),
    bestVisible: getComputedStyle(document.querySelector('.best-card')).display,
    dockPosition: getComputedStyle(document.querySelector('.tool-dock')).position,
    bodyFits: document.body.scrollHeight <= innerHeight + 1,
    topbarHeight: document.querySelector('.topbar').getBoundingClientRect().height,
    dockBottom: document.querySelector('.tool-dock').getBoundingClientRect().bottom,
    playBottom: document.querySelector('.play-area').getBoundingClientRect().bottom,
    dockTop: document.querySelector('.tool-dock').getBoundingClientRect().top,
    machineCount: document.querySelectorAll('.machine').length,
    allMachinesVisible: [...document.querySelectorAll('.machine')].every((machine) => {
      const rect = machine.getBoundingClientRect();
      return rect.top >= 0 && rect.bottom <= innerHeight;
    }),
    visibleHeaderActions: [...document.querySelectorAll('.header-actions button')]
      .filter((button) => button.offsetWidth > 0)
      .map((button) => button.getAttribute('aria-label'))
  })`);
  assert.equal(mobileGame.toolColumns, 3, "모바일 도구판은 읽기 쉬운 3열 2행이어야 합니다.");
  assert.ok(mobileGame.toolLabelFont >= 11, "모바일 도구 이름은 11px 이상이어야 합니다.");
  assert.ok(mobileGame.hudLabelFont >= 9, "모바일 HUD 라벨은 압축 레이아웃에서도 9px 이상이어야 합니다.");
  assert.equal(mobileGame.bestVisible, "none", "영업 중 모바일 HUD에서는 최고 기록을 숨겨야 합니다.");
  assert.equal(mobileGame.dockPosition, "relative", "모바일 도구판은 한 화면 그리드의 마지막 행이어야 합니다.");
  assert.equal(mobileGame.bodyFits, true, "모바일 영업 화면은 세로 스크롤 없이 한 화면에 들어와야 합니다.");
  assert.ok(mobileGame.topbarHeight <= 46, "모바일 상단 HUD는 기계 공간을 위해 46px 이하여야 합니다.");
  assert.ok(mobileGame.playBottom <= mobileGame.dockTop + 1, "매장과 도구판은 겹치지 않아야 합니다.");
  assert.ok(mobileGame.dockBottom <= 844, "도구판 전체가 모바일 화면 안에 보여야 합니다.");
  assert.equal(mobileGame.machineCount, 12, "세탁기와 건조기 12대가 렌더링되어야 합니다.");
  assert.equal(mobileGame.allMachinesVisible, true, "세탁기와 건조기 12대가 모두 첫 화면에 보여야 합니다.");
  assert.deepEqual(mobileGame.visibleHeaderActions, ["게임 일시정지"], "모바일 헤더에는 일시정지 한 개만 남겨야 합니다.");

  await evaluate("state.score = 900; state.cleaned = 2; endGame(true, 'time')");
  await waitFor("document.querySelector('#result-modal').classList.contains('open')");
  assert.equal(await evaluate("document.querySelector('#result-details').open"), false, "모바일 결과의 상세 기록은 기본적으로 접혀야 합니다.");
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.result-secondary-actions')).display"), "none", "모바일 결과에서는 보조 관리 버튼 묶음을 숨겨야 합니다.");

  await evaluate(`
    localStorage.setItem('bubbleTime75.progression.v1', JSON.stringify({ schemaVersion: 5, stats: { shifts: 1 }, preferences: {}, tutorial: { completed: true } }));
    location.reload();
  `);
  await waitFor("document.readyState === 'complete' && typeof state !== 'undefined'");
  console.log("UI 회귀: 저장 데이터 이전 확인");
  const migrated = await evaluate("({ version: state.progression.schemaVersion, objectives: state.progression.stats.objectives, standardRecord: state.progression.records.standard.score, lastMode: state.progression.preferences.lastMode })");
  assert.equal(migrated.version, 7, "v5 저장 데이터는 v7으로 이전되어야 합니다.");
  assert.equal(migrated.objectives, 0, "이전 데이터의 목표 통계 기본값은 0이어야 합니다.");
  assert.equal(migrated.standardRecord, 4200, "기존 최고 기록은 75초 기본 모드 기록으로 이전되어야 합니다.");
  assert.equal(migrated.lastMode, "standard", "이전 데이터는 75초 기본 영업을 유지해야 합니다.");

  if (process.env.CAPTURE_PWA_ASSETS === "1") {
    await evaluate("clearShiftCheckpoint(); updateCheckpointUi()");
    await cdp("Emulation.setDeviceMetricsOverride", { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
    await wait(250);
    const wideScreenshot = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    fs.writeFileSync(path.join(root, "assets", "screenshot-wide.png"), Buffer.from(wideScreenshot.data, "base64"));
    await cdp("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await wait(250);
    const mobileScreenshot = await cdp("Page.captureScreenshot", { format: "png", fromSurface: true, captureBeyondViewport: false });
    fs.writeFileSync(path.join(root, "assets", "screenshot-mobile.png"), Buffer.from(mobileScreenshot.data, "base64"));
  }

  console.log("자동 UI 회귀 검사를 통과했습니다.");
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
}).finally(async () => {
  if (socket?.readyState === WebSocket.OPEN) socket.close();
  if (browserProcess && !browserProcess.killed) browserProcess.kill();
  await new Promise((resolve) => server.close(resolve));
  if (profileDirectory && path.resolve(profileDirectory).startsWith(path.resolve(os.tmpdir()))) {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        fs.rmSync(profileDirectory, { recursive: true, force: true });
        break;
      } catch (error) {
        await wait(100);
      }
    }
  }
});
