"use strict";

const LAUNDRY_CONFIG = Object.freeze({
  gameSeconds: 75,
  maxQueue: 6,
  combo: Object.freeze({
    fastWindow: 3600,
    tierTwo: 3,
    tierThree: 6,
    tierFour: 10,
  }),
  satisfaction: Object.freeze({
    happyThreshold: 80,
    minimumServed: 35,
    maximumWaitPenalty: 65,
    stainedBonus: 5,
  }),
  customerTypes: Object.freeze({
    normal: Object.freeze({ weight: 0.35, label: "일반 손님", icon: "●", patience: 1, cycle: 1, reward: 1 }),
    impatient: Object.freeze({ weight: 0.25, label: "성격 급한 손님", icon: "⚡", patience: 0.58, cycle: 0.9, reward: 1.15 }),
    regular: Object.freeze({ weight: 0.22, label: "단골 손님", icon: "★", patience: 1.3, cycle: 0.95, reward: 1.3 }),
    bulk: Object.freeze({ weight: 0.18, label: "대량 세탁 손님", icon: "▦", patience: 1.05, cycle: 1.55, reward: 1.65 }),
    collector: Object.freeze({ weight: 0, label: "세탁소 평론가", icon: "◆", patience: 0.72, cycle: 0.88, reward: 2.2 }),
  }),
  upgrades: Object.freeze({
    maxLevel: 8,
    machineCosts: Object.freeze([90, 190, 330, 520, 760, 1050, 1400, 1800]),
    toolCosts: Object.freeze([80, 170, 300, 480, 700, 960, 1250, 1600]),
    machineSpeedBonuses: Object.freeze([0, 0.08, 0.16, 0.24, 0.31, 0.37, 0.42, 0.46, 0.5]),
    toolScoreBonuses: Object.freeze([0, 0.12, 0.24, 0.36, 0.47, 0.58, 0.68, 0.77, 0.84]),
    comboWindowBonuses: Object.freeze([0, 350, 700, 1050, 1350, 1600, 1850, 2050, 2200]),
    master: Object.freeze({
      maxLevel: 3,
      costs: Object.freeze([2200, 3200, 4400]),
      firstPurchaseDiscount: 0.5,
      resetCost: 800,
      machineTurbo: Object.freeze([0, 0.03, 0.06, 0.09]),
      machineService: Object.freeze([0, 0.05, 0.1, 0.15]),
      toolPrecision: Object.freeze([0, 0.1, 0.2, 0.3]),
      toolRhythm: Object.freeze([0, 400, 800, 1200]),
    }),
  }),
  economy: Object.freeze({
    servedCoins: 12,
    happyCoins: 5,
    successBonus: 50,
    refundPenalty: 8,
    rankBonuses: Object.freeze({ S: 90, A: 60, B: 35, C: 15, F: 0 }),
    refundlessBonus: 40,
    allObjectivesBonus: 30,
    dailyReward: 100,
  }),
  events: Object.freeze({
    initialDelay: 5200,
    resumeDelay: 4200,
    warningDuration: 2800,
    intervalMin: 9000,
    intervalMax: 12500,
    groupSize: 3,
    repairScore: 220,
    refillScore: 180,
    powerScore: 160,
  }),
  guest: Object.freeze({
    initialDelay: 650,
    minimumWait: 1400,
    spawnStart: 2450,
    spawnEnd: 1400,
    spawnJitter: 320,
    patience: 18500,
    stainedChance: 0.18,
  }),
  machine: Object.freeze({
    cycleMin: 10000,
    cycleMax: 13500,
  }),
  dirt: Object.freeze({
    initialDelay: 2600,
    spawnStart: 4900,
    spawnEnd: 3400,
    spawnJitterEarly: 550,
    spawnJitterLate: 650,
    maxDirty: 8,
    leftoverChance: 0.18,
    leftoverDelay: 650,
  }),
});

if (typeof module !== "undefined" && module.exports) {
  module.exports = LAUNDRY_CONFIG;
}
