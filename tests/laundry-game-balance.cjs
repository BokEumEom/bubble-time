"use strict";

const assert = require("node:assert/strict");
const config = require("../game-config.js");

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function between(random, min, max) {
  return min + random() * (max - min);
}

function chooseCustomerType(random) {
  const roll = random();
  let cumulative = 0;
  for (const [type, info] of Object.entries(config.customerTypes)) {
    cumulative += info.weight;
    if (roll <= cumulative) return { type, ...info };
  }
  return { type: "normal", ...config.customerTypes.normal };
}

function simulateShift(seed, reactionMs) {
  const random = seededRandom(seed);
  const machines = Array.from({ length: 12 }, () => ({
    busyUntil: 0,
    dirt: false,
    cleanAt: Number.POSITIVE_INFINITY,
  }));
  const queue = [];
  const endAt = config.gameSeconds * 1000;
  let nextGuest = config.guest.initialDelay;
  let nextDirt = config.dirt.initialDelay;
  let nextAssignment = 0;
  let refunds = 0;
  let served = 0;
  let cleaned = 0;
  let peakQueue = 0;

  const dirtyCount = () => machines.reduce((sum, machine) => sum + (machine.dirt ? 1 : 0), 0);
  const scheduleCleaning = (machine, now) => {
    if (!Number.isFinite(reactionMs)) return;
    machine.cleanAt = now + reactionMs * between(random, 0.72, 1.32);
  };
  const makeDirty = (machine, now) => {
    if (machine.dirt || dirtyCount() >= config.dirt.maxDirty) return;
    machine.dirt = true;
    scheduleCleaning(machine, now);
  };

  for (let now = 0; now <= endAt; now += 100) {
    for (const machine of machines) {
      if (machine.dirt && machine.cleanAt <= now) {
        machine.dirt = false;
        machine.cleanAt = Number.POSITIVE_INFINITY;
        cleaned += 1;
      }

      if (machine.busyUntil && machine.busyUntil <= now) {
        if (machine.dirt) refunds += 1;
        else served += 1;
        machine.busyUntil = 0;

        if (!machine.dirt && random() < config.dirt.leftoverChance && dirtyCount() < config.dirt.maxDirty) {
          makeDirty(machine, now + config.dirt.leftoverDelay);
        }
      }
    }

    if (now >= nextDirt) {
      const cleanMachines = machines.filter((machine) => !machine.dirt);
      if (cleanMachines.length && dirtyCount() < config.dirt.maxDirty) {
        makeDirty(cleanMachines[Math.floor(random() * cleanMachines.length)], now);
      }
      const progress = now / endAt;
      const base = config.dirt.spawnStart + (config.dirt.spawnEnd - config.dirt.spawnStart) * progress;
      nextDirt = now + Math.max(
        2500,
        base + between(random, -config.dirt.spawnJitterEarly, config.dirt.spawnJitterLate),
      );
    }

    if (now >= nextGuest) {
      queue.push({ arrivedAt: now, customer: chooseCustomerType(random) });
      peakQueue = Math.max(peakQueue, queue.length);
      if (queue.length >= config.maxQueue) {
        return { survived: false, failAt: now / 1000, refunds, served, cleaned, peakQueue };
      }
      const progress = now / endAt;
      const base = config.guest.spawnStart + (config.guest.spawnEnd - config.guest.spawnStart) * progress;
      nextGuest = now + Math.max(
        900,
        base + between(random, -config.guest.spawnJitter, config.guest.spawnJitter),
      );
    }

    if (now >= nextAssignment) {
      const next = queue[0];
      const freeMachine = machines.find((machine) => !machine.busyUntil && !machine.dirt);
      if (next && freeMachine && now - next.arrivedAt >= config.guest.minimumWait) {
        queue.shift();
        freeMachine.busyUntil = now + between(random, config.machine.cycleMin, config.machine.cycleMax) * next.customer.cycle;
      }
      nextAssignment = now + 420;
    }
  }

  return { survived: true, failAt: null, refunds, served, cleaned, peakQueue };
}

function runScenario(label, reactionMs, trials = 1000) {
  const results = Array.from({ length: trials }, (_, index) => simulateShift(index + 1, reactionMs));
  const survived = results.filter((result) => result.survived);
  const failed = results.filter((result) => !result.survived);
  return {
    label,
    survivalRate: survived.length / trials,
    averageRefunds: results.reduce((sum, result) => sum + result.refunds, 0) / trials,
    averagePeakQueue: results.reduce((sum, result) => sum + result.peakQueue, 0) / trials,
    averageFailAt: failed.length ? failed.reduce((sum, result) => sum + result.failAt, 0) / failed.length : null,
  };
}

const scenarios = [
  runScenario("빠른 대응 (0.8초)", 800),
  runScenario("보통 대응 (2.5초)", 2500),
  runScenario("느린 대응 (5초)", 5000),
  runScenario("청소하지 않음", Number.POSITIVE_INFINITY),
];

const customerWeightTotal = Object.values(config.customerTypes).reduce((sum, customer) => sum + customer.weight, 0);
assert.ok(Math.abs(customerWeightTotal - 1) < 0.0001, "손님 유형 등장 확률의 합은 1이어야 합니다.");
assert.ok(config.customerTypes.impatient.patience < config.customerTypes.normal.patience, "성격 급한 손님은 인내심이 더 짧아야 합니다.");
assert.ok(config.customerTypes.bulk.cycle > config.customerTypes.normal.cycle, "대량 세탁 손님은 작업 시간이 더 길어야 합니다.");
assert.ok(config.customerTypes.regular.reward > config.customerTypes.normal.reward, "단골 손님은 보상이 더 높아야 합니다.");
assert.ok(config.events.initialDelay >= 4000, "첫 사건 전에 기본 조작을 익힐 시간이 있어야 합니다.");
assert.ok(config.events.intervalMin >= 8000, "사건이 연속으로 너무 빠르게 발생하면 안 됩니다.");
assert.ok(config.events.intervalMax <= 15000, "75초 영업에서 여러 사건을 경험할 수 있어야 합니다.");
assert.ok(config.events.groupSize > 1 && config.events.groupSize < config.maxQueue, "단체 손님은 긴장감을 주되 즉시 대기 한계에 도달하면 안 됩니다.");
assert.ok(config.events.repairScore > config.events.powerScore, "대상 기계를 찾아야 하는 고장 사건의 보상이 더 높아야 합니다.");

console.table(scenarios.map((scenario) => ({
  scenario: scenario.label,
  survival: `${(scenario.survivalRate * 100).toFixed(1)}%`,
  refunds: scenario.averageRefunds.toFixed(2),
  peakQueue: scenario.averagePeakQueue.toFixed(2),
  failAt: scenario.averageFailAt ? `${scenario.averageFailAt.toFixed(1)}초` : "–",
})));

assert.ok(scenarios[0].survivalRate >= 0.98, "빠른 플레이어는 거의 항상 완주해야 합니다.");
assert.ok(scenarios[1].survivalRate >= 0.8, "보통 플레이어의 완주율은 80% 이상이어야 합니다.");
assert.ok(scenarios[2].survivalRate >= 0.75, "느린 플레이어도 학습 가능한 여지가 있어야 합니다.");
assert.ok(scenarios[2].averageRefunds >= scenarios[1].averageRefunds * 1.6, "느린 대응은 보통 대응보다 환불 위험이 뚜렷해야 합니다.");
assert.ok(scenarios[3].survivalRate <= 0.15, "청소를 완전히 무시하면 대부분 실패해야 합니다.");

console.log("밸런스 기준을 통과했습니다.");
