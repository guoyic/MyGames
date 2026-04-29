const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const ui = {
  score: document.querySelector("#score"),
  wave: document.querySelector("#wave"),
  combo: document.querySelector("#combo"),
  health: document.querySelector("#healthBar"),
  energy: document.querySelector("#energyBar"),
  special: document.querySelector("#specialBar"),
  specialLabel: document.querySelector("#specialLabel"),
  enhanceLabel: document.querySelector("#enhanceLabel"),
  enhanceEffect: document.querySelector("#enhanceEffect"),
  overlay: document.querySelector("#overlay"),
  overlayTitle: document.querySelector("#overlayTitle"),
  overlayText: document.querySelector("#overlayText"),
  start: document.querySelector("#startBtn"),
  pause: document.querySelector("#pauseBtn"),
  home: document.querySelector("#homeBtn"),
  fullscreen: document.querySelector("#fullscreenBtn"),
  guide: document.querySelector("#guideBtn"),
  guideModal: document.querySelector("#guideModal"),
  guideClose: document.querySelector("#guideCloseBtn"),
  guideProgress: document.querySelector("#guideProgress"),
  resetProgress: document.querySelector("#resetProgressBtn"),
  modeButtons: [...document.querySelectorAll(".mode-btn")],
  playerSlots: document.querySelector("#playerSlots"),
  slotButtons: [...document.querySelectorAll(".slot-btn")],
  difficultyButtons: [...document.querySelectorAll(".difficulty-btn")],
  characterButtons: [...document.querySelectorAll(".character-btn")],
  skinChoices: document.querySelector("#skinChoices"),
  leaderboard: document.querySelector("#leaderboardList"),
  resetLeaderboard: document.querySelector("#resetLeaderboardBtn"),
  meters: document.querySelector(".meters"),
  health2: document.querySelector("#healthBar2"),
  energy2: document.querySelector("#energyBar2"),
  special2: document.querySelector("#specialBar2"),
  specialLabel2: document.querySelector("#specialLabel2"),
  enhanceLabel2: document.querySelector("#enhanceLabel2"),
  enhanceEffect2: document.querySelector("#enhanceEffect2"),
  duoMeters: [...document.querySelectorAll(".duo-meter")],
  stick: document.querySelector("#stick"),
  slashTouch: document.querySelector("#slashTouch"),
  dashTouch: document.querySelector("#dashTouch"),
  specialTouch: document.querySelector("#specialTouch"),
};

const TAU = Math.PI * 2;
const WORLD = { w: 1280, h: 720 };
const PERF = {
  dprCap: 1.35,
  maxEnemies: 28,
  maxSparks: 130,
  maxFloaters: 18,
  maxPlayerShots: 96,
  uiInterval: 0.08,
};
const BOSS_TYPES = [
  { type: "bossBlade", name: "折光武士", color: "#ff3f7f", accent: "#f8fbff", hp: 680, speed: 1.02, touch: 28, rank: 1 },
  { type: "bossOrbit", name: "环星炮塔", color: "#18d7ff", accent: "#ffca3d", hp: 820, speed: 1, touch: 30, rank: 2 },
  { type: "bossPrism", name: "棱镜女王", color: "#b87cff", accent: "#afff4a", hp: 980, speed: 1.04, touch: 32, rank: 3 },
  { type: "bossWarden", name: "磁暴典狱长", color: "#afff4a", accent: "#18d7ff", hp: 1160, speed: 0.96, touch: 35, rank: 4 },
  { type: "bossLotus", name: "赤莲机巧", color: "#ff6b3d", accent: "#ffca3d", hp: 1360, speed: 1.08, touch: 38, rank: 5 },
  { type: "bossVoid", name: "虚空灯塔", color: "#7d7cff", accent: "#f8fbff", hp: 1600, speed: 1.14, touch: 42, rank: 6 },
];
const CHARACTERS = {
  blade: {
    name: "疾刃",
    hint: "近战斩击 · 快速冲刺",
    color: "#18d7ff",
    speed: 270,
    dashCost: 22,
    maxHp: 100,
  },
  ranger: {
    name: "星弩",
    hint: "远程射击 · 稳定风筝",
    color: "#afff4a",
    speed: 225,
    dashCost: 30,
    maxHp: 92,
  },
  nova: {
    name: "脉冲",
    hint: "范围冲击 · 高生命",
    color: "#ffca3d",
    speed: 205,
    dashCost: 34,
    maxHp: 125,
  },
};
const POWERUP_TYPES = [
  { type: "regen", name: "生命芯片", color: "#afff4a", text: "回血 +1%/秒" },
  { type: "energy", name: "涡轮电池", color: "#18d7ff", text: "能量回复 x2" },
  { type: "special", name: "超载核心", color: "#ffca3d", text: "绝招上限 +1" },
];
const ENHANCE_DROP_RATES = {
  easy: 0.8,
  hard: 0.5,
  hell: 0.33,
};
const MAX_ENHANCE_STACKS_BY_DIFFICULTY = { easy: 3, hard: 3, hell: 4 };
const DUO_TUNING = { enemyHp: 1.5, enemyAttack: 1.2 };
const PROGRESSION_KEY = "neonSlashTideProgression";
const SKIN_UNLOCKS = {
  easy: {
    wave: 20,
    tier: 1,
    label: "街光",
    blade: { name: "街光疾刃", color: "#4de3ff", attackColor: "#afff4a" },
    ranger: { name: "街光星弩", color: "#afff4a", attackColor: "#18d7ff" },
    nova: { name: "街光脉冲", color: "#ffca3d", attackColor: "#ff7aa8" },
  },
  hard: {
    wave: 20,
    tier: 2,
    label: "电弧",
    blade: { name: "电弧疾刃", color: "#ffca3d", attackColor: "#18d7ff" },
    ranger: { name: "电弧星弩", color: "#18d7ff", attackColor: "#b87cff" },
    nova: { name: "电弧脉冲", color: "#ff6b3d", attackColor: "#afff4a" },
  },
  hell: {
    wave: 25,
    tier: 3,
    label: "深霓",
    blade: { name: "深霓疾刃", color: "#b87cff", attackColor: "#ff3f7f" },
    ranger: { name: "深霓星弩", color: "#ff3f7f", attackColor: "#ffca3d" },
    nova: { name: "深霓脉冲", color: "#f8fbff", attackColor: "#7d7cff" },
  },
};
const SKIN_MODE_ORDER = ["hell", "hard", "easy"];
const BOSS_BADGE_THRESHOLDS = [1, 3, 7, 12];
const BOSS_BADGE_NAMES = ["未获得", "铜", "银", "金", "极光"];
const ACHIEVEMENTS = [
  { id: "first_steps", name: "初入霓虹", text: "任意模式到达第 3 波" },
  { id: "first_boss", name: "首领初破", text: "击败任意 1 个 Boss" },
  { id: "first_enhance", name: "第一次增幅", text: "拾取 1 个角色增幅" },
  { id: "double_enhance", name: "双层核心", text: "单局角色增幅达到 2 层" },
  { id: "blade_wave", name: "疾刃破浪", text: "使用疾刃到达第 10 波" },
  { id: "ranger_wave", name: "星弩巡航", text: "使用星弩到达第 10 波" },
  { id: "nova_wave", name: "脉冲扩散", text: "使用脉冲到达第 10 波" },
  { id: "hard_break", name: "困难突破", text: "困难模式到达第 14 波" },
  { id: "hell_gate", name: "地狱开门", text: "地狱模式到达第 10 波" },
  { id: "neon_conqueror", name: "霓虹征服者", text: "地狱模式到达第 20 波或累计击败 12 个 Boss" },
];
const DIFFICULTIES = {
  easy: {
    name: "轻松",
    enemyCap: 0.42,
    spawnDelay: 2.35,
    enemySpeed: 0.52,
    bossSpeed: 0.6,
    bossHp: 0.75,
    openingEnemies: 2,
  },
  hard: {
    name: "困难",
    enemyCap: 0.62,
    spawnDelay: 1.7,
    enemySpeed: 0.72,
    bossSpeed: 0.8,
    bossHp: 1,
    openingEnemies: 3,
  },
  hell: {
    name: "地狱",
    enemyCap: 1,
    spawnDelay: 1,
    enemySpeed: 1,
    bossSpeed: 1,
    bossHp: 1.35,
    openingEnemies: 4,
  },
};
const LEADERBOARD_KEY = "neonSlashTideLeaderboard";
const keys = new Set();
const pointer = { x: WORLD.w / 2, y: WORLD.h / 2, down: false };
const touchMove = { x: 0, y: 0, active: false, id: null, centerX: 0, centerY: 0 };
const background = document.createElement("canvas");
const bg = background.getContext("2d");
const viewport = { scale: 1, x: 0, y: 0, w: WORLD.w, h: WORLD.h };

let lastTime = 0;
let running = false;
let paused = false;
let state = null;
let uiClock = 0;
let uiCache = {};
let selectedDifficulty = "easy";
let selectedGameMode = "solo";
let selectedPlayerSlot = 0;
let selectedCharacters = ["blade", "ranger"];
let fallbackFullscreen = false;

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distSq = (a, b) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
const lerp = (a, b, t) => a + (b - a) * t;

function maxEnhanceStacks() {
  return MAX_ENHANCE_STACKS_BY_DIFFICULTY[state?.difficulty || selectedDifficulty] || 3;
}

function duoHpScale() {
  return state?.mode === "duo" ? DUO_TUNING.enemyHp : 1;
}

function duoAttackScale() {
  return state?.mode === "duo" ? DUO_TUNING.enemyAttack : 1;
}

function selectedCharacter() {
  return selectedCharacters[selectedPlayerSlot] || selectedCharacters[0] || "blade";
}

function makeDefaultProgression() {
  return {
    unlockedSkins: [],
    bossKills: {},
    achievements: {},
    bestWaves: {},
    selectedSkins: {},
  };
}

function loadProgression() {
  try {
    const raw = localStorage.getItem(PROGRESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      ...makeDefaultProgression(),
      ...parsed,
      unlockedSkins: Array.isArray(parsed.unlockedSkins) ? parsed.unlockedSkins : [],
      bossKills: parsed.bossKills && typeof parsed.bossKills === "object" ? parsed.bossKills : {},
      achievements: parsed.achievements && typeof parsed.achievements === "object" ? parsed.achievements : {},
      bestWaves: parsed.bestWaves && typeof parsed.bestWaves === "object" ? parsed.bestWaves : {},
      selectedSkins: parsed.selectedSkins && typeof parsed.selectedSkins === "object" ? parsed.selectedSkins : {},
    };
  } catch {
    return makeDefaultProgression();
  }
}

function storeProgression(progress) {
  try {
    localStorage.setItem(PROGRESSION_KEY, JSON.stringify(progress));
  } catch {
    // Progression is optional; private browsing can block localStorage.
  }
}

function skinId(character, mode) {
  return `${character}:${mode}`;
}

function baseSkinForCharacter(character) {
  const hero = CHARACTERS[character] || CHARACTERS.blade;
  return { id: `${character}:base`, name: "默认", color: hero.color, attackColor: hero.color, tier: 0 };
}

function skinFor(character, mode) {
  const unlock = SKIN_UNLOCKS[mode];
  if (!unlock || !unlock[character]) return baseSkinForCharacter(character);
  return { id: skinId(character, mode), mode, tier: unlock.tier, ...unlock[character] };
}

function activeSkinForCharacter(character, progress = loadProgression()) {
  const selected = progress.selectedSkins?.[character];
  if (selected === `${character}:base`) return baseSkinForCharacter(character);
  if (selected && progress.unlockedSkins.includes(selected)) {
    const mode = selected.split(":")[1];
    return skinFor(character, mode);
  }
  for (const mode of SKIN_MODE_ORDER) {
    const id = skinId(character, mode);
    if (progress.unlockedSkins.includes(id)) return skinFor(character, mode);
  }
  return baseSkinForCharacter(character);
}

function availableSkinsForCharacter(character, progress = loadProgression()) {
  const skins = [baseSkinForCharacter(character)];
  for (const mode of ["easy", "hard", "hell"]) {
    const skin = skinFor(character, mode);
    if (progress.unlockedSkins.includes(skin.id)) skins.push(skin);
  }
  return skins;
}

function selectSkin(character, id) {
  const progress = loadProgression();
  const allowed = id === `${character}:base` || progress.unlockedSkins.includes(id);
  if (!allowed || running || (paused && state && !state.gameOver)) return;
  progress.selectedSkins[character] = id;
  storeProgression(progress);
  renderSkinChoices();
  if (state && !running && !paused && !state.gameOver) {
    state = makeState();
    updateUi(true);
    draw();
  }
}

function playerLabel(player) {
  if (state?.mode !== "duo") return "";
  return player.ai ? "AI" : `P${player.index + 1}`;
}

function badgeLevelForKills(kills) {
  let level = 0;
  for (const threshold of BOSS_BADGE_THRESHOLDS) {
    if (kills >= threshold) level += 1;
  }
  return level;
}

function unlockAchievement(id) {
  const def = ACHIEVEMENTS.find((achievement) => achievement.id === id);
  if (!def) return false;
  const progress = loadProgression();
  if (progress.achievements[id]) return false;
  progress.achievements[id] = Date.now();
  storeProgression(progress);
  if (state && !state.gameOver) addFloater(`成就：${def.name}`, WORLD.w / 2, 156, "#ffca3d");
  return true;
}

function totalBossKills(progress = loadProgression()) {
  return Object.values(progress.bossKills).reduce((sum, count) => sum + (Number.isFinite(count) ? count : 0), 0);
}

function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const grouped = { easy: [], hard: [], hell: [] };
    const source = Array.isArray(parsed)
      ? parsed
      : Object.values(parsed || {}).flat();
    if (!Array.isArray(source)) return grouped;
    const entries = source
      .filter((entry) => Number.isFinite(entry.score) && Number.isFinite(entry.wave) && Number.isFinite(entry.date))
      .map((entry) => ({
        id: String(entry.id || `${entry.date}-${entry.score}`),
        score: Math.max(0, Math.floor(entry.score)),
        wave: Math.max(1, Math.floor(entry.wave)),
        date: Math.max(0, Math.floor(entry.date)),
        difficulty: DIFFICULTIES[entry.difficulty] ? entry.difficulty : "hell",
      }));
    for (const entry of entries) grouped[entry.difficulty].push(entry);
    for (const mode of Object.keys(grouped)) {
      grouped[mode] = grouped[mode]
        .sort((a, b) => b.score - a.score || b.wave - a.wave || a.date - b.date)
        .slice(0, 3);
    }
    return grouped;
  } catch {
    return { easy: [], hard: [], hell: [] };
  }
}

function storeLeaderboard(entries) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
  } catch {
    // Some private browsing modes block localStorage; the game should still run.
  }
}

function resetLeaderboard() {
  const ok = window.confirm("确定要清空本地排行榜吗？局外成长、Boss 徽章和成就会保留。");
  if (!ok) return;
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
  } catch {
    storeLeaderboard({ easy: [], hard: [], hell: [] });
  }
  renderLeaderboard();
}

function resetAllProgress() {
  const first = window.confirm("这会清空排行榜、外观、Boss 徽章和成就。确定要继续吗？");
  if (!first) return;
  const second = window.confirm("二次确认：所有本地进度都会消失，无法恢复。确认清空？");
  if (!second) return;
  try {
    localStorage.removeItem(LEADERBOARD_KEY);
    localStorage.removeItem(PROGRESSION_KEY);
  } catch {
    storeLeaderboard({ easy: [], hard: [], hell: [] });
    storeProgression(makeDefaultProgression());
  }
  if (!running) state = makeState();
  renderLeaderboard();
  renderGuideProgress();
  renderSkinChoices();
  updateUi(true);
  draw();
}

function saveLeaderboardEntry() {
  if (!state || state.scoreSaved) return null;
  state.scoreSaved = true;
  const score = Math.floor(state.score);
  if (score <= 0) return null;
  const entry = {
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    score,
    wave: state.wave,
    difficulty: state.difficulty,
    date: Date.now(),
  };
  const grouped = loadLeaderboard();
  const sorted = [...grouped[state.difficulty], entry].sort((a, b) => b.score - a.score || b.wave - a.wave || a.date - b.date);
  const rank = sorted.findIndex((item) => item.id === entry.id) + 1;
  grouped[state.difficulty] = sorted.slice(0, 3);
  storeLeaderboard(grouped);
  renderLeaderboard();
  return rank <= 3 ? rank : null;
}

function unlockBossSkin(enemy) {
  if (!state || !enemy.isBoss) return null;
  const unlock = SKIN_UNLOCKS[state.difficulty];
  if (!unlock || enemy.bossWave !== unlock.wave) return null;
  const progress = loadProgression();
  const names = [];
  for (const player of state.players) {
    const id = skinId(player.character, state.difficulty);
    if (progress.unlockedSkins.includes(id)) continue;
    const skin = skinFor(player.character, state.difficulty);
    progress.unlockedSkins.push(id);
    names.push(skin.name);
  }
  if (!names.length) return null;
  storeProgression(progress);
  state.unlockedSkins.push(...names);
  addFloater(`解锁外观：${names.join("、")}`, WORLD.w / 2, 154, "#ffca3d");
  renderSkinChoices();
  return names;
}

function checkRunAchievements() {
  if (!state) return;
  if (state.wave >= 3) unlockAchievement("first_steps");
  if (state.players.some((player) => player.enhanceStacks >= 2)) unlockAchievement("double_enhance");
  if (state.players.some((player) => player.character === "blade") && state.wave >= 10) unlockAchievement("blade_wave");
  if (state.players.some((player) => player.character === "ranger") && state.wave >= 10) unlockAchievement("ranger_wave");
  if (state.players.some((player) => player.character === "nova") && state.wave >= 10) unlockAchievement("nova_wave");
  if (state.difficulty === "hard" && state.wave >= 14) unlockAchievement("hard_break");
  if (state.difficulty === "hell" && state.wave >= 10) unlockAchievement("hell_gate");
  if (state.difficulty === "hell" && state.wave >= 20) unlockAchievement("neon_conqueror");
}

function recordBestWave() {
  if (!state) return;
  const progress = loadProgression();
  for (const player of state.players) {
    const key = `${player.character}:${state.difficulty}`;
    progress.bestWaves[key] = Math.max(progress.bestWaves[key] || 0, state.wave);
  }
  storeProgression(progress);
}

function recordBossKill(type) {
  const progress = loadProgression();
  progress.bossKills[type] = (progress.bossKills[type] || 0) + 1;
  storeProgression(progress);
  unlockAchievement("first_boss");
  if (totalBossKills(progress) >= 12) unlockAchievement("neon_conqueror");
}

function formatLeaderboardDate(timestamp) {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${month}/${day} ${hour}:${minute}`;
}

function renderLeaderboard() {
  if (!ui.leaderboard) return;
  const grouped = loadLeaderboard();
  ui.leaderboard.replaceChildren();
  Object.keys(DIFFICULTIES).forEach((mode) => {
    const panel = document.createElement("section");
    const title = document.createElement("h3");
    const list = document.createElement("ol");
    panel.className = "leaderboard-mode";
    title.textContent = DIFFICULTIES[mode].name;
    panel.append(title, list);
    if (grouped[mode].length === 0) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = "暂无记录";
      list.append(empty);
    } else {
      grouped[mode].forEach((entry, index) => {
        const item = document.createElement("li");
        const rank = document.createElement("b");
        const score = document.createElement("strong");
        const meta = document.createElement("small");
        rank.textContent = `#${index + 1}`;
        score.textContent = entry.score.toString();
        meta.textContent = `第 ${entry.wave} 波 · ${formatLeaderboardDate(entry.date)}`;
        item.append(rank, score, meta);
        list.append(item);
      });
    }
    ui.leaderboard.append(panel);
  });
}

function difficulty() {
  return DIFFICULTIES[state?.difficulty || selectedDifficulty] || DIFFICULTIES.easy;
}

function setDifficulty(mode) {
  if (!DIFFICULTIES[mode] || running || (paused && state && !state.gameOver)) return;
  selectedDifficulty = mode;
  for (const button of ui.difficultyButtons) {
    button.classList.toggle("active", button.dataset.difficulty === mode);
  }
}

function setGameMode(mode) {
  if (!["solo", "duo"].includes(mode) || running || (paused && state && !state.gameOver)) return;
  selectedGameMode = mode;
  selectedPlayerSlot = 0;
  syncSetupUi();
  renderSkinChoices();
  if (state && !running && !paused && !state.gameOver) {
    state = makeState();
    updateUi(true);
    draw();
  }
}

function setPlayerSlot(slot) {
  if (running || (paused && state && !state.gameOver)) return;
  selectedPlayerSlot = clamp(slot, 0, selectedGameMode === "duo" ? 1 : 0);
  syncSetupUi();
  renderSkinChoices();
}

function setCharacter(type) {
  if (!CHARACTERS[type] || running || (paused && state && !state.gameOver)) return;
  selectedCharacters[selectedPlayerSlot] = type;
  syncSetupUi();
  renderSkinChoices();
  if (state && !running && !paused && !state.gameOver) {
    state = makeState();
    updateUi(true);
    draw();
  }
}

function syncSetupUi() {
  for (const button of ui.modeButtons) {
    button.classList.toggle("active", button.dataset.mode === selectedGameMode);
  }
  ui.playerSlots?.classList.toggle("hidden", selectedGameMode !== "duo");
  for (const button of ui.slotButtons) {
    const slot = Number(button.dataset.slot || 0);
    button.classList.toggle("active", slot === selectedPlayerSlot);
    const character = selectedCharacters[slot] || "blade";
    button.textContent = `${slot === 1 ? "AI 队友" : "玩家 1"} · ${CHARACTERS[character].name}`;
  }
  for (const button of ui.characterButtons) {
    button.classList.toggle("active", button.dataset.character === selectedCharacter());
  }
  const duo = selectedGameMode === "duo" || state?.mode === "duo";
  ui.meters?.classList.toggle("duo-active", duo);
  for (const meter of ui.duoMeters) {
    meter.classList.toggle("hidden", !duo);
  }
}

function skinSwatch(skin, character, locked = false) {
  const swatch = document.createElement("span");
  swatch.className = `skin-swatch ${character} tier-${skin.tier || 0}${locked ? " locked" : ""}`;
  swatch.style.setProperty("--skin-color", skin.color);
  swatch.style.setProperty("--attack-color", skin.attackColor);
  return swatch;
}

function renderSkinChoices() {
  if (!ui.skinChoices) return;
  const progress = loadProgression();
  const character = selectedCharacter();
  const current = activeSkinForCharacter(character, progress);
  ui.skinChoices.replaceChildren();
  const label = document.createElement("span");
  label.className = "skin-label";
  label.textContent = selectedGameMode === "duo" ? `${selectedPlayerSlot === 1 ? "AI 队友" : "玩家 1"} 外观` : "外观";
  ui.skinChoices.append(label);
  for (const skin of availableSkinsForCharacter(character, progress)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `skin-btn${skin.id === current.id ? " active" : ""}`;
    button.append(skinSwatch(skin, character), document.createTextNode(skin.name));
    button.addEventListener("click", () => selectSkin(character, skin.id));
    ui.skinChoices.append(button);
  }
}

function openGuide() {
  if (running) pauseGame();
  renderGuideProgress();
  ui.guideModal.classList.remove("hidden");
  ui.guideModal.setAttribute("aria-hidden", "false");
}

function closeGuide() {
  ui.guideModal.classList.add("hidden");
  ui.guideModal.setAttribute("aria-hidden", "true");
}

function renderGuideProgress() {
  if (!ui.guideProgress) return;
  const progress = loadProgression();
  ui.guideProgress.replaceChildren();

  const skinsCard = document.createElement("section");
  skinsCard.className = "progress-card";
  skinsCard.innerHTML = "<h3>外观解锁</h3>";
  const skinsList = document.createElement("ul");
  for (const character of Object.keys(CHARACTERS)) {
    const base = baseSkinForCharacter(character);
    const baseItem = document.createElement("li");
    const baseText = document.createElement("span");
    baseItem.className = "skin-entry unlocked";
    baseText.textContent = `${CHARACTERS[character].name} · 默认外观：初始可用`;
    baseItem.append(skinSwatch(base, character), baseText);
    skinsList.append(baseItem);

    for (const mode of ["easy", "hard", "hell"]) {
      const unlock = SKIN_UNLOCKS[mode];
      const skin = skinFor(character, mode);
      const item = document.createElement("li");
      const text = document.createElement("span");
      const unlocked = progress.unlockedSkins.includes(skin.id);
      item.className = `skin-entry ${unlocked ? "unlocked" : "locked"}`;
      text.textContent = `${CHARACTERS[character].name} · ${skin.name}：击败${DIFFICULTIES[mode].name}第 ${unlock.wave} 波 Boss${unlocked ? " 已解锁" : " 未解锁"}`;
      item.append(skinSwatch(skin, character, !unlocked), text);
      skinsList.append(item);
    }
  }
  skinsCard.append(skinsList);

  const badgesCard = document.createElement("section");
  badgesCard.className = "progress-card";
  badgesCard.innerHTML = "<h3>Boss 徽章</h3>";
  const badgesList = document.createElement("ul");
  for (const boss of BOSS_TYPES) {
    const kills = progress.bossKills[boss.type] || 0;
    const level = badgeLevelForKills(kills);
    const item = document.createElement("li");
    item.className = level > 0 ? "unlocked" : "";
    item.textContent = `${boss.name}：击败 ${kills} 次 · ${BOSS_BADGE_NAMES[level]}徽章`;
    badgesList.append(item);
  }
  badgesCard.append(badgesList);

  const achievementsCard = document.createElement("section");
  achievementsCard.className = "progress-card";
  achievementsCard.innerHTML = "<h3>成就</h3>";
  const achievementsList = document.createElement("ul");
  for (const achievement of ACHIEVEMENTS) {
    const item = document.createElement("li");
    const unlocked = Boolean(progress.achievements[achievement.id]);
    item.className = unlocked ? "unlocked" : "";
    item.textContent = `${achievement.name}：${achievement.text}${unlocked ? " 已完成" : ""}`;
    achievementsList.append(item);
  }
  achievementsCard.append(achievementsList);

  ui.guideProgress.append(skinsCard, badgesCard, achievementsCard);
}

function updateFullscreenButton() {
  if (!ui.fullscreen) return;
  ui.fullscreen.textContent = document.fullscreenElement || fallbackFullscreen ? "退出全屏" : "进入全屏";
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement || fallbackFullscreen) {
      fallbackFullscreen = false;
      document.documentElement.classList.remove("app-fullscreen");
      if (document.fullscreenElement) await document.exitFullscreen();
    } else {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (document.fullscreenElement) {
        document.documentElement.classList.add("app-fullscreen");
      } else {
        fallbackFullscreen = true;
        document.documentElement.classList.add("app-fullscreen");
      }
      requestLandscapeLock();
    }
  } catch {
    fallbackFullscreen = true;
    document.documentElement.classList.add("app-fullscreen");
    requestLandscapeLock();
  } finally {
    updateFullscreenButton();
    resizeCanvas();
  }
}

async function requestLandscapeLock() {
  try {
    if (screen.orientation?.lock) await screen.orientation.lock("landscape");
  } catch {
    // iOS may ignore orientation locking for browser-launched pages.
  }
}

function makePlayer(character, index, x, y) {
  const hero = CHARACTERS[character] || CHARACTERS.blade;
  const skin = activeSkinForCharacter(character);
  return {
    index,
    controlIndex: index,
    ai: false,
    character,
    skin,
    x,
    y,
    vx: 0,
    vy: 0,
    r: 18,
    hp: hero.maxHp,
    maxHp: hero.maxHp,
    energy: 100,
    regenStacks: 0,
    energyStacks: 0,
    enhanceStacks: 0,
    special: 0,
    specialCharges: 0,
    maxSpecialCharges: 1,
    slashCooldown: 0,
    dashCooldown: 0,
    invuln: 0,
    spinBurst: 0,
    spinShotTimer: 0,
    facing: -Math.PI / 2,
    dashTrail: [],
    aiThink: 0,
  };
}

function makeState() {
  const mode = selectedGameMode;
  const players = mode === "duo"
    ? [
        makePlayer(selectedCharacters[0] || "blade", 0, WORLD.w / 2 - 58, WORLD.h / 2),
        makePlayer(selectedCharacters[1] || "ranger", 1, WORLD.w / 2 + 58, WORLD.h / 2),
      ]
    : [makePlayer(selectedCharacters[0] || "blade", 0, WORLD.w / 2, WORLD.h / 2)];
  if (players[1]) players[1].ai = true;
  return {
    mode,
    difficulty: selectedDifficulty,
    score: 0,
    wave: 1,
    combo: 1,
    comboTimer: 0,
    time: 0,
    spawnTimer: 0,
    nextPowerupAt: 60,
    bossWaves: new Set(),
    unlockedSkins: [],
    shake: 0,
    hitStop: 0,
    gameOver: false,
    scoreSaved: false,
    players,
    player: players[0],
    enemies: [],
    bullets: [],
    playerShots: [],
    powerups: [],
    slashes: [],
    sparks: [],
    floaters: [],
    pendingBoss: null,
    bossWarning: null,
  };
}

function startGame() {
  if (paused && state && !state.gameOver) {
    resumeGame();
    return;
  }
  requestLandscapeLock();
  state = makeState();
  running = true;
  paused = false;
  uiClock = 0;
  uiCache = {};
  ui.overlay.classList.add("hidden");
  ui.start.textContent = "开始游戏";
  ui.pause.textContent = "暂停";
  for (let i = 0; i < difficulty().openingEnemies; i += 1) spawnEnemy();
  updateUi(true);
}

function endGame() {
  running = false;
  paused = false;
  state.gameOver = true;
  checkRunAchievements();
  recordBestWave();
  const unlockedSkins = state.unlockedSkins || [];
  const rank = saveLeaderboardEntry();
  renderSkinChoices();
  ui.overlayTitle.textContent = "街区暂时失守";
  const rankText = rank ? `本难度排行第 ${rank}。` : "未进入本难度前三。";
  const unlockText = unlockedSkins.length ? ` 解锁外观：${unlockedSkins.join("、")}。` : "";
  ui.overlayText.textContent = `${difficulty().name}难度，最终分数 ${Math.floor(state.score)}，你撑到了第 ${state.wave} 波。${rankText}${unlockText} 再来一次，连击会更离谱。`;
  ui.start.textContent = "再战一局";
  ui.pause.textContent = "暂停";
  ui.overlay.classList.remove("hidden");
}

function pauseGame() {
  if (!running || paused || !state || state.gameOver) return;
  paused = true;
  running = false;
  ui.pause.textContent = "继续";
  ui.overlayTitle.textContent = "已暂停";
  ui.overlayText.textContent = "节奏先按住。点继续回到战斗，或者点主页重新开局。";
  ui.start.textContent = "继续游戏";
  ui.overlay.classList.remove("hidden");
}

function resumeGame() {
  if (!paused || !state || state.gameOver) return;
  paused = false;
  running = true;
  lastTime = performance.now();
  ui.pause.textContent = "暂停";
  ui.overlay.classList.add("hidden");
}

function goHome() {
  running = false;
  paused = false;
  state = makeState();
  keys.clear();
  resetStick();
  ui.pause.textContent = "暂停";
  ui.start.textContent = "开始游戏";
  ui.overlayTitle.textContent = "准备开斩";
  ui.overlayText.textContent = "先选单人/双人，再选角色与外观，最后选难度开战。双人模式下二号角色由 AI 操作。";
  ui.overlay.classList.remove("hidden");
  updateUi(true);
  renderLeaderboard();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, PERF.dprCap);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  viewport.scale = Math.min(canvas.width / WORLD.w, canvas.height / WORLD.h);
  viewport.w = WORLD.w * viewport.scale;
  viewport.h = WORLD.h * viewport.scale;
  viewport.x = (canvas.width - viewport.w) / 2;
  viewport.y = (canvas.height - viewport.h) / 2;
  applyWorldTransform();
  buildBackground();
}

function applyWorldTransform() {
  ctx.setTransform(viewport.scale, 0, 0, viewport.scale, viewport.x, viewport.y);
}

function clearFrame() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#05070c";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  applyWorldTransform();
}

function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scale = Math.min(rect.width / WORLD.w, rect.height / WORLD.h);
  const worldW = WORLD.w * scale;
  const worldH = WORLD.h * scale;
  const offsetX = (rect.width - worldW) / 2;
  const offsetY = (rect.height - worldH) / 2;
  return {
    x: clamp((clientX - rect.left - offsetX) / scale, 0, WORLD.w),
    y: clamp((clientY - rect.top - offsetY) / scale, 0, WORLD.h),
  };
}

function spawnPoint() {
  const edge = Math.floor(rand(0, 4));
  if (edge === 0) return { x: rand(10, WORLD.w - 10), y: -30 };
  if (edge === 1) return { x: WORLD.w + 30, y: rand(10, WORLD.h - 10) };
  if (edge === 2) return { x: rand(10, WORLD.w - 10), y: WORLD.h + 30 };
  return { x: -30, y: rand(10, WORLD.h - 10) };
}

function shooterChanceForWave(wave) {
  if (wave < 6) return 0;
  return clamp(0.05 + (wave - 6) * 0.017, 0.05, 0.32);
}

function spawnEnemy() {
  const p = spawnPoint();
  const level = state.wave;
  const tune = difficulty();
  const roll = Math.random();
  const shooterChance = shooterChanceForWave(level);
  const bruteChance = 0.22;
  const type = roll < shooterChance ? "shooter" : roll < shooterChance + bruteChance ? "brute" : "runner";
  const baseHp = type === "brute" ? 70 + level * 8 : type === "shooter" ? 42 + level * 5 : 32 + level * 4;
  const enemy = {
    ...p,
    vx: 0,
    vy: 0,
    type,
    r: type === "brute" ? 25 : type === "shooter" ? 20 : 17,
    hp: baseHp * duoHpScale(),
    maxHp: 1,
    speed: (type === "brute" ? 88 : type === "shooter" ? 76 : 138 + level * 4) * tune.enemySpeed,
    touchDamage: (type === "brute" ? 20 : 13) * duoAttackScale(),
    shootTimer: rand(0.6, 1.8),
    stun: 0,
    flash: 0,
  };
  enemy.maxHp = enemy.hp;
  state.enemies.push(enemy);
}

function bossTemplateForWave(wave) {
  return BOSS_TYPES[(Math.floor(wave / 5) - 1) % BOSS_TYPES.length];
}

function queueBossWarning(wave) {
  const template = bossTemplateForWave(wave);
  state.pendingBoss = { wave, timer: 2 };
  state.bossWarning = { name: template.name, color: template.color, life: 2, maxLife: 2 };
  state.shake = Math.max(state.shake, 10);
  addFloater(`${template.name} 信号锁定`, WORLD.w / 2, 112, template.color);
}

function spawnBoss(wave) {
  const tune = difficulty();
  const template = bossTemplateForWave(wave);
  const bossNumber = Math.floor(wave / 5) - 1;
  const cycle = Math.floor(bossNumber / BOSS_TYPES.length);
  const baseSpeeds = {
    bossBlade: 118,
    bossOrbit: 76,
    bossPrism: 92,
    bossWarden: 68,
    bossLotus: 84,
    bossVoid: 104,
  };
  const p = {
    x: WORLD.w / 2 + rand(-160, 160),
    y: -72,
  };
  const boss = {
    ...p,
    vx: 0,
    vy: 0,
    type: template.type,
    bossName: template.name,
    color: template.color,
    accent: template.accent,
    isBoss: true,
    bossWave: wave,
    bossCycle: cycle,
    bossRank: template.rank,
    attackScale: (1 + cycle * 0.67) * duoAttackScale(),
    r: 42 + template.rank * 3 + Math.min(14, cycle * 3),
    hp: template.hp * (1 + cycle) * tune.bossHp * duoHpScale(),
    maxHp: 1,
    speed: (baseSpeeds[template.type] || 92) * template.speed * tune.bossSpeed,
    touchDamage: template.touch * (1 + cycle * 0.67) * duoAttackScale(),
    shootTimer: 1.2,
    pulseTimer: 2.2,
    dashTimer: (template.type === "bossBlade" ? 1.8 : 3) / tune.bossSpeed,
    stun: 0,
    flash: 0,
    phase: rand(0, TAU),
  };
  boss.maxHp = boss.hp;
  state.enemies.push(boss);
  state.shake = Math.max(state.shake, 18);
  addFloater(`${template.name} 来袭`, WORLD.w / 2, 112, template.color);
  addSparks(WORLD.w / 2, 96, 44, template.color, 760);
}

function spawnPowerup() {
  const template = POWERUP_TYPES[Math.floor(rand(0, POWERUP_TYPES.length))];
  state.powerups.push({
    ...template,
    x: rand(90, WORLD.w - 90),
    y: rand(90, WORLD.h - 90),
    r: 19,
    life: 15,
    maxLife: 15,
    spin: rand(0, TAU),
  });
  addFloater(`${template.name} 出现`, WORLD.w / 2, 138, template.color);
}

function enhancementText(character, stacks) {
  if (character === "blade") return `疾刃范围 +${stacks}`;
  if (character === "ranger") return `星弩弹数 +${stacks}`;
  return `脉冲伤害 +${stacks * 40}%`;
}

function enhancementStatusText(p) {
  const skinName = p.skin?.name && p.skin.name !== "默认" ? `${p.skin.name} · ` : "";
  if (p.character === "blade") return `${skinName}范围 +${p.enhanceStacks}`;
  if (p.character === "ranger") return `${skinName}弹数 +${p.enhanceStacks}`;
  return `${skinName}伤害 +${p.enhanceStacks * 40}%`;
}

function spawnEnhancePowerup(x, y) {
  const r = 23;
  const dropX = clamp(x, r + 12, WORLD.w - r - 12);
  const dropY = clamp(y, r + 12, WORLD.h - r - 12);
  state.powerups.push({
    type: "enhance",
    name: "角色增幅",
    color: "#f8fbff",
    text: "角色增强 +1",
    x: dropX,
    y: dropY,
    r,
    life: 18,
    maxLife: 18,
    spin: rand(0, TAU),
  });
  addFloater("角色增幅掉落", dropX, dropY - 42, "#f8fbff");
}

function collectPowerup(item, player = state.player) {
  const p = player;
  if (item.type === "regen") {
    p.regenStacks += 1;
  } else if (item.type === "energy") {
    p.energyStacks += 1;
  } else if (item.type === "enhance") {
    if (p.enhanceStacks >= maxEnhanceStacks()) {
      item.text = "增幅已满";
    } else {
      p.enhanceStacks += 1;
      item.text = `${playerLabel(p)} ${enhancementText(p.character, p.enhanceStacks)}`.trim();
      unlockAchievement("first_enhance");
      if (p.enhanceStacks >= 2) unlockAchievement("double_enhance");
    }
  } else {
    p.maxSpecialCharges += 1;
    addSpecial(p, 0);
  }
  item.life = 0;
  state.shake = Math.max(state.shake, 7);
  addFloater(item.text, item.x, item.y - 28, item.color);
  addSparks(item.x, item.y, 26, item.color, 520);
  updateUi(true);
}

function addSparks(x, y, amount, color, speed = 260) {
  amount = Math.min(amount, Math.max(0, PERF.maxSparks - state.sparks.length));
  for (let i = 0; i < amount; i += 1) {
    const a = rand(0, TAU);
    const s = rand(speed * 0.25, speed);
    state.sparks.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: rand(0.22, 0.62),
      maxLife: 0.62,
      size: rand(2, 6),
      color,
    });
  }
}

function addFloater(text, x, y, color = "#f8fbff") {
  if (state.floaters.length >= PERF.maxFloaters) state.floaters.shift();
  state.floaters.push({ text, x, y, vy: -38, life: 0.75, color });
}

function alivePlayers() {
  return state.players.filter((player) => player.hp > 0);
}

function nearestPlayerTo(entity) {
  const players = alivePlayers();
  if (!players.length) return state.player;
  return players.reduce((best, player) => (distSq(entity, player) < distSq(entity, best) ? player : best), players[0]);
}

function nearestEnemyTo(player) {
  const live = state.enemies.filter((enemy) => enemy.hp > 0);
  if (!live.length) return null;
  return live.reduce((best, enemy) => (distSq(player, enemy) < distSq(player, best) ? enemy : best), live[0]);
}

function aiMoveVector(player) {
  const target = nearestEnemyTo(player);
  if (!target) {
    const leader = state.players[0];
    if (!leader || leader === player) return { x: 0, y: 0, mag: 0 };
    const dx = leader.x + 70 - player.x;
    const dy = leader.y - player.y;
    const mag = Math.hypot(dx, dy);
    return mag > 16 ? { x: dx / mag, y: dy / mag, mag: 0.65 } : { x: 0, y: 0, mag: 0 };
  }

  const d = dist(player, target);
  const desired = player.character === "ranger" ? 270 : player.character === "nova" ? 170 : 96;
  if (d < desired * 0.7) {
    const a = angleTo(target, player);
    return { x: Math.cos(a), y: Math.sin(a), mag: 1 };
  }
  if (d > desired * 1.22) {
    const a = angleTo(player, target);
    return { x: Math.cos(a), y: Math.sin(a), mag: 1 };
  }
  const strafe = angleTo(player, target) + Math.PI / 2;
  const drift = Math.sin(state.time * 1.7 + player.index) > 0 ? 1 : -1;
  return { x: Math.cos(strafe) * drift, y: Math.sin(strafe) * drift, mag: 0.55 };
}

function shouldAiSpecial(player, target) {
  if (!target || player.specialCharges <= 0) return false;
  const bossAlive = state.enemies.some((enemy) => enemy.isBoss && enemy.hp > 0);
  if (player.character === "nova") return bossAlive || state.enemies.length >= 7;
  if (player.character === "ranger") return bossAlive || state.enemies.length >= 5;
  return target.isBoss || (state.enemies.length >= 6 && dist(player, target) < 210);
}

function updateAiPlayer(player, dt) {
  if (!player.ai || player.hp <= 0) return;
  player.aiThink = Math.max(0, player.aiThink - dt);
  const target = nearestEnemyTo(player);
  if (target) player.facing = angleTo(player, target);
  if (player.aiThink > 0) return;
  player.aiThink = rand(0.06, 0.16);
  if (!target) return;

  const d = dist(player, target);
  const attackRange = player.character === "ranger" ? 620 : player.character === "nova" ? 190 : 122;
  if (d < attackRange) attack(player);
  if (shouldAiSpecial(player, target)) special(player);
  if (player.dashCooldown <= 0 && player.energy > 45) {
    const dangerClose = d < (player.character === "ranger" ? 150 : 76);
    const chaseBoss = target.isBoss && d > attackRange * 0.9;
    if (dangerClose || chaseBoss) dash(player);
  }
}

function aimAngleFor(player) {
  if (player.character === "blade" || player.character === "ranger") {
    const target = nearestEnemyTo(player);
    if (target) return angleTo(player, target);
  }
  return player?.facing ?? angleTo(player, pointer);
}

function addSpecial(player, amount) {
  const p = player || state.player;
  if (p.character === "ranger" && p.spinBurst > 0) return;
  if (p.specialCharges >= p.maxSpecialCharges) {
    p.special = 100;
    return;
  }
  p.special += amount;
  while (p.special >= 100 && p.specialCharges < p.maxSpecialCharges) {
    p.specialCharges += 1;
    p.special -= 100;
    addFloater("绝招就绪", p.x, p.y - 58, "#ffca3d");
  }
  if (p.specialCharges >= p.maxSpecialCharges) p.special = 100;
}

function damageEnemy(enemy, amount, angle, knock, stun, sparkColor, hitStop = 0.02) {
  enemy.hp -= amount;
  enemy.vx += Math.cos(angle) * knock;
  enemy.vy += Math.sin(angle) * knock;
  enemy.stun = Math.max(enemy.stun, stun);
  enemy.flash = 0.14;
  state.shake = Math.max(state.shake, Math.min(14, 4 + amount * 0.045));
  state.hitStop = Math.max(state.hitStop, hitStop);
  addSparks(enemy.x, enemy.y, enemy.isBoss ? 18 : 10, sparkColor, 520);
}

function rewardHits(player, hits, x, y, color, comboStep = 1, energyStep = 0, specialStep = 8) {
  if (hits <= 0) return;
  const p = player || state.player;
  state.combo = clamp(state.combo + hits * comboStep, 1, 99);
  state.comboTimer = 2.8;
  p.energy = clamp(p.energy + hits * energyStep, 0, 100);
  addSpecial(p, hits * specialStep);
  addFloater(`+${hits} HIT`, x, y, color);
}

function attack(player = state.player, power = 1) {
  if (!state || !running) return;
  if (!player || player.hp <= 0) return;
  if (player.character === "ranger") {
    rangedAttack(player, power);
  } else if (player.character === "nova") {
    pulseAttack(player, power);
  } else {
    slash(player, power);
  }
}

function slash(player = state.player, power = 1) {
  const p = player;
  if (p.slashCooldown > 0 || state.hitStop > 0) return;

  const rangeBoost = 1 + p.enhanceStacks * 0.18;
  const reach = (power > 1 ? 122 : 92) * rangeBoost;
  const arc = (power > 1 ? 1.58 : 1.18) + p.enhanceStacks * 0.08;
  const damage = power > 1 ? 96 : 34;
  p.slashCooldown = power > 1 ? 0.36 : 0.2;
  p.facing = aimAngleFor(p);
  const slashColor = power > 1 ? "#ffca3d" : p.skin.attackColor || "#18d7ff";
  state.slashes.push({ x: p.x, y: p.y, angle: p.facing, reach, arc, life: 0.13, maxLife: 0.13, power, color: slashColor });
  addSparks(p.x + Math.cos(p.facing) * 34, p.y + Math.sin(p.facing) * 34, power > 1 ? 18 : 8, slashColor, 420);

  let hits = 0;
  for (const enemy of state.enemies) {
    const d = dist(p, enemy);
    const diff = Math.atan2(Math.sin(angleTo(p, enemy) - p.facing), Math.cos(angleTo(p, enemy) - p.facing));
    if (d < reach + enemy.r && Math.abs(diff) < arc) {
      hits += 1;
      const knock = power > 1 ? 560 : 360;
      damageEnemy(enemy, damage, p.facing, knock, power > 1 ? 0.28 : 0.16, slashColor, power > 1 ? 0.055 : 0.025);
    }
  }

  rewardHits(p, hits, p.x + Math.cos(p.facing) * 80, p.y + Math.sin(p.facing) * 80, slashColor, power > 1 ? 2 : 1, 9, power > 1 ? 5 : 9);
}

function firePlayerShot(player, angle, options = {}) {
  const p = player || state.player;
  const speed = options.speed || 560;
  if (state.playerShots.length >= PERF.maxPlayerShots) state.playerShots.shift();
  state.playerShots.push({
    x: p.x + Math.cos(angle) * (p.r + 16),
    y: p.y + Math.sin(angle) * (p.r + 16),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: options.r || 6,
    damage: options.damage || 28,
    life: options.life || 1.6,
    color: options.color || p.skin.attackColor || CHARACTERS[p.character].color,
    pierce: options.pierce || 0,
    owner: p,
  });
}

function rangedAttack(player = state.player, power = 1) {
  const p = player;
  const cost = 15;
  if (p.slashCooldown > 0 || state.hitStop > 0) return;
  if (p.energy < cost) {
    addFloater("能量不足", p.x, p.y - 36, "#ff7aa8");
    p.slashCooldown = 0.22;
    return;
  }
  p.energy -= cost;
  p.slashCooldown = power > 1 ? 0.11 : 0.16;
  p.facing = aimAngleFor(p);
  const shotColor = p.skin.attackColor || "#afff4a";
  const shotCount = 1 + p.enhanceStacks;
  const spread = shotCount === 1 ? 0 : 0.12;
  for (let i = 0; i < shotCount; i += 1) {
    const offset = (i - (shotCount - 1) / 2) * spread;
    firePlayerShot(p, p.facing + offset, {
      speed: power > 1 ? 660 : 590,
      damage: power > 1 ? 34 : 27,
      r: power > 1 ? 7 : 6,
      color: shotColor,
      pierce: power > 1 ? 1 : 0,
    });
  }
  addSparks(p.x + Math.cos(p.facing) * 26, p.y + Math.sin(p.facing) * 26, 5, shotColor, 360);
}

function pulseAttack(player = state.player, power = 1) {
  const p = player;
  const cost = 80;
  if (p.slashCooldown > 0 || state.hitStop > 0) return;
  if (p.energy < cost) {
    addFloater("能量不足", p.x, p.y - 36, "#ff7aa8");
    p.slashCooldown = 0.34;
    return;
  }
  p.energy -= cost;
  p.slashCooldown = power > 1 ? 0.55 : 0.42;
  const radius = power > 1 ? 235 : 170;
  const baseDamage = power > 1 ? 74 : 46;
  const damage = baseDamage * (1 + p.enhanceStacks * 0.4);
  const pulseColor = p.skin.attackColor || "#ffca3d";
  state.slashes.push({ x: p.x, y: p.y, angle: 0, reach: radius, arc: Math.PI, life: 0.2, maxLife: 0.2, power: 4, color: pulseColor });
  addSparks(p.x, p.y, 24, pulseColor, 620);
  let hits = 0;
  for (const enemy of state.enemies) {
    const d = dist(p, enemy);
    if (d < radius + enemy.r) {
      hits += 1;
      const a = angleTo(p, enemy);
      damageEnemy(enemy, damage, a, 520, 0.24, pulseColor, 0.035);
    }
  }
  rewardHits(p, hits, p.x, p.y - 46, pulseColor, 1, 0, 8);
}

function dash(player = state.player) {
  const p = player;
  const cost = (CHARACTERS[p.character] || CHARACTERS.blade).dashCost;
  if (p.dashCooldown > 0 || p.energy < cost) return;

  const move = getMoveVector(p);
  const a = move.mag > 0.1 ? Math.atan2(move.y, move.x) : p.facing;
  p.vx += Math.cos(a) * 720;
  p.vy += Math.sin(a) * 720;
  p.energy -= cost;
  p.dashCooldown = 0.52;
  p.invuln = 0.34;
  p.dashTrail.length = 0;
  state.shake = Math.max(state.shake, 5);
  addSparks(p.x, p.y, 14, "#18d7ff", 520);
}

function special(player = state.player) {
  if (!state || !running) return;
  if (!player || player.hp <= 0) return;
  if (player.character === "ranger") {
    rangerSpecial(player);
  } else if (player.character === "nova") {
    novaSpecial(player);
  } else {
    bladeSpecial(player);
  }
}

function bladeSpecial(player = state.player) {
  const p = player;
  if (p.specialCharges <= 0) return;
  p.specialCharges -= 1;
  if (p.special >= 100) p.special = 0;
  p.invuln = Math.max(p.invuln, 0.55);
  state.shake = 18;
  state.hitStop = 0.08;
  const rangeBoost = 1 + p.enhanceStacks * 0.18;
  state.slashes.push({ x: p.x, y: p.y, angle: p.facing, reach: 190 * rangeBoost, arc: Math.PI, life: 0.22, maxLife: 0.22, power: 3, color: p.skin.attackColor || "#ffca3d" });
  for (const enemy of state.enemies) {
    const d = dist(p, enemy);
    if (d < 220 * rangeBoost) {
      const a = angleTo(p, enemy);
      enemy.hp -= 135;
      enemy.vx += Math.cos(a) * 700;
      enemy.vy += Math.sin(a) * 700;
      enemy.stun = 0.38;
      enemy.flash = 0.18;
    }
  }
  for (const bullet of state.bullets) {
    if (dist(p, bullet) < 260) bullet.life = 0;
  }
  addSparks(p.x, p.y, 42, "#ffca3d", 780);
  addFloater("超载斩", p.x, p.y - 42, "#ffca3d");
}

function rangerSpecial(player = state.player) {
  const p = player;
  if (p.specialCharges <= 0) return;
  p.specialCharges -= 1;
  if (p.special >= 100) p.special = 0;
  p.spinBurst = 2;
  p.spinShotTimer = 0;
  p.invuln = Math.max(p.invuln, 0.8);
  state.shake = 12;
  addSparks(p.x, p.y, 36, "#afff4a", 680);
  addFloater("星环连射", p.x, p.y - 42, "#afff4a");
}

function novaSpecial(player = state.player) {
  const p = player;
  if (p.specialCharges <= 0) return;
  p.specialCharges -= 1;
  if (p.special >= 100) p.special = 0;
  p.invuln = Math.max(p.invuln, 0.8);
  state.shake = 24;
  state.hitStop = 0.1;
  state.slashes.push({ x: WORLD.w / 2, y: WORLD.h / 2, angle: 0, reach: WORLD.w, arc: Math.PI, life: 0.34, maxLife: 0.34, power: 5, color: p.skin.attackColor || "#ffca3d" });
  let hits = 0;
  for (const enemy of state.enemies) {
    if (enemy.isBoss) {
      enemy.hp *= 0.85;
    } else {
      enemy.hp = Math.min(enemy.hp, enemy.maxHp * 0.01);
    }
    enemy.flash = 0.26;
    enemy.stun = Math.max(enemy.stun, 0.35);
    hits += 1;
  }
  state.bullets.length = 0;
  addSparks(WORLD.w / 2, WORLD.h / 2, 70, "#ffca3d", 900);
  addFloater(`脉冲清场 x${hits}`, WORLD.w / 2, 112, "#ffca3d");
}

function getMoveVector(player = state.player) {
  if (player?.ai) return aiMoveVector(player);
  let x = 0;
  let y = 0;
  const duo = state?.mode === "duo";
  if (!duo || player.controlIndex === 0) {
    if (keys.has("KeyA")) x -= 1;
    if (keys.has("KeyD")) x += 1;
    if (keys.has("KeyW")) y -= 1;
    if (keys.has("KeyS")) y += 1;
  }
  if (!duo || player.controlIndex === 1) {
    if (keys.has("ArrowLeft")) x -= 1;
    if (keys.has("ArrowRight")) x += 1;
    if (keys.has("ArrowUp")) y -= 1;
    if (keys.has("ArrowDown")) y += 1;
  }
  if (player.controlIndex === 0 && touchMove.active) {
    x += touchMove.x;
    y += touchMove.y;
  }
  const mag = Math.hypot(x, y);
  return mag > 0 ? { x: x / mag, y: y / mag, mag: Math.min(1, mag) } : { x: 0, y: 0, mag: 0 };
}

function damagePlayer(player, amount, x, y) {
  const p = player || state.player;
  if (!p || p.hp <= 0) return;
  if (p.invuln > 0) return;
  const taken = p.character === "ranger" && p.spinBurst > 0 ? amount * 0.33 : amount;
  p.hp -= taken;
  p.invuln = 0.72;
  state.combo = 1;
  state.comboTimer = 0;
  state.shake = Math.max(state.shake, 14);
  const a = Math.atan2(p.y - y, p.x - x);
  p.vx += Math.cos(a) * 430;
  p.vy += Math.sin(a) * 430;
  addSparks(p.x, p.y, 18, "#ff3f7f", 520);
  addFloater(`-${Math.ceil(taken)}`, p.x, p.y - 28, "#ff7aa8");
  if (p.hp <= 0) {
    p.hp = 0;
    if (p.index === 0 || alivePlayers().length === 0) endGame();
  }
}

function fireBossShot(enemy, angle, speed, damage = 14) {
  state.bullets.push({
    x: enemy.x + Math.cos(angle) * enemy.r * 0.65,
    y: enemy.y + Math.sin(angle) * enemy.r * 0.65,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: enemy.type === "bossPrism" ? 8 : 9,
    life: 4.4,
    color: enemy.accent,
    damage: damage * (enemy.attackScale || 1),
  });
}

function updateBoss(enemy, dt, distanceToPlayer, angleToPlayer) {
  enemy.shootTimer -= dt;
  enemy.pulseTimer -= dt;
  enemy.dashTimer -= dt;
  enemy.phase += dt;

  if (enemy.type === "bossBlade") {
    if (enemy.dashTimer <= 0) {
      enemy.dashTimer = rand(2.1, 3.2) / difficulty().bossSpeed;
      enemy.vx += Math.cos(angleToPlayer) * 760 * difficulty().bossSpeed;
      enemy.vy += Math.sin(angleToPlayer) * 760 * difficulty().bossSpeed;
      enemy.stun = 0.16;
      state.shake = Math.max(state.shake, 10);
      addSparks(enemy.x, enemy.y, 22, enemy.color, 680);
    }
    if (enemy.shootTimer <= 0 && distanceToPlayer < 540) {
      enemy.shootTimer = 1.25 / difficulty().bossSpeed;
      for (const spread of [-0.28, 0, 0.28]) fireBossShot(enemy, angleToPlayer + spread, 330, 13);
    }
  } else if (enemy.type === "bossOrbit") {
    if (enemy.shootTimer <= 0) {
      enemy.shootTimer = 1.65 / difficulty().bossSpeed;
      for (let i = 0; i < 8; i += 1) fireBossShot(enemy, enemy.phase + (i / 8) * TAU, 230, 12);
      addSparks(enemy.x, enemy.y, 16, enemy.accent, 360);
    }
  } else if (enemy.type === "bossPrism") {
    if (enemy.shootTimer <= 0) {
      enemy.shootTimer = 0.7 / difficulty().bossSpeed;
      fireBossShot(enemy, angleToPlayer + Math.sin(enemy.phase) * 0.5, 300, 12);
    }
    if (enemy.pulseTimer <= 0) {
      enemy.pulseTimer = 2.6 / difficulty().bossSpeed;
      for (let i = 0; i < 5; i += 1) fireBossShot(enemy, angleToPlayer - 0.8 + i * 0.4, 260, 13);
      addSparks(enemy.x, enemy.y, 18, enemy.color, 520);
    }
  } else if (enemy.type === "bossWarden") {
    if (distanceToPlayer < 520) {
      enemy.vx += Math.cos(angleToPlayer) * 22 * difficulty().bossSpeed;
      enemy.vy += Math.sin(angleToPlayer) * 22 * difficulty().bossSpeed;
    }
    if (enemy.shootTimer <= 0) {
      enemy.shootTimer = 1.9 / difficulty().bossSpeed;
      for (let i = 0; i < 10; i += 1) fireBossShot(enemy, enemy.phase + (i / 10) * TAU, 205, 11);
      addSparks(enemy.x, enemy.y, 20, enemy.accent, 420);
    }
    if (enemy.pulseTimer <= 0) {
      enemy.pulseTimer = 3.2 / difficulty().bossSpeed;
      state.shake = Math.max(state.shake, 10);
      addFloater("磁暴牵引", enemy.x, enemy.y - enemy.r - 24, enemy.color);
    }
  } else if (enemy.type === "bossLotus") {
    if (enemy.shootTimer <= 0) {
      enemy.shootTimer = 1.05 / difficulty().bossSpeed;
      for (let i = 0; i < 6; i += 1) fireBossShot(enemy, angleToPlayer - 0.55 + i * 0.22, 285 + i * 10, 12);
      addSparks(enemy.x, enemy.y, 16, enemy.color, 520);
    }
    if (enemy.pulseTimer <= 0) {
      enemy.pulseTimer = 2.4 / difficulty().bossSpeed;
      for (let i = 0; i < 12; i += 1) fireBossShot(enemy, enemy.phase * 0.8 + (i / 12) * TAU, 180, 10);
    }
  } else if (enemy.type === "bossVoid") {
    if (enemy.dashTimer <= 0) {
      enemy.dashTimer = rand(2.2, 3.4) / difficulty().bossSpeed;
      const target = nearestPlayerTo(enemy);
      enemy.x = clamp(target.x + rand(-260, 260), 80, WORLD.w - 80);
      enemy.y = clamp(target.y + rand(-190, 190), 80, WORLD.h - 80);
      enemy.stun = 0.12;
      state.shake = Math.max(state.shake, 12);
      addSparks(enemy.x, enemy.y, 28, enemy.accent, 720);
    }
    if (enemy.shootTimer <= 0) {
      enemy.shootTimer = 1.15 / difficulty().bossSpeed;
      for (const spread of [-0.42, -0.18, 0.18, 0.42]) fireBossShot(enemy, angleToPlayer + spread, 340, 13);
    }
  }
}

function update(dt) {
  if (!state || !running) return;
  if (state.hitStop > 0) {
    state.hitStop -= dt;
    draw();
    return;
  }

  const players = alivePlayers();
  if (!players.length) {
    endGame();
    return;
  }
  state.time += dt;
  state.spawnTimer -= dt;
  state.shake = Math.max(0, state.shake - dt * 32);
  state.comboTimer -= dt;
  if (state.comboTimer <= 0) state.combo = Math.max(1, Math.floor(state.combo * 0.72));

  for (const p of players) {
    p.slashCooldown = Math.max(0, p.slashCooldown - dt);
    p.dashCooldown = Math.max(0, p.dashCooldown - dt);
    p.invuln = Math.max(0, p.invuln - dt);
    if (p.spinBurst > 0) {
      p.spinBurst = Math.max(0, p.spinBurst - dt);
      p.spinShotTimer -= dt;
      while (p.spinShotTimer <= 0 && p.spinBurst > 0) {
        const base = state.time * 12;
        const spinShotCount = 2 + p.enhanceStacks;
        for (let i = 0; i < spinShotCount; i += 1) {
          firePlayerShot(p, base + (i / spinShotCount) * TAU, {
            speed: 640,
            damage: 27,
            r: 5,
            color: p.skin.attackColor || "#afff4a",
            life: 1.35,
          });
        }
        p.spinShotTimer += 0.075;
      }
    }
    p.hp = clamp(p.hp + dt * p.regenStacks, 0, p.maxHp);
    p.energy = clamp(p.energy + dt * 18 * 2 ** p.energyStacks, 0, 100);
    updateAiPlayer(p, dt);
    p.dashTrail.unshift({ x: p.x, y: p.y, life: 0.24 });
    p.dashTrail = p.dashTrail.filter((t) => (t.life -= dt) > 0).slice(0, 10);

    const move = getMoveVector(p);
    const speed = (CHARACTERS[p.character] || CHARACTERS.blade).speed;
    p.vx = lerp(p.vx, move.x * speed, 1 - Math.exp(-dt * 12));
    p.vy = lerp(p.vy, move.y * speed, 1 - Math.exp(-dt * 12));
    p.x = clamp(p.x + p.vx * dt, p.r + 10, WORLD.w - p.r - 10);
    p.y = clamp(p.y + p.vy * dt, p.r + 10, WORLD.h - p.r - 10);
    if (move.mag > 0.1) p.facing = Math.atan2(move.y, move.x);
  }

  const tune = difficulty();
  const targetCount = Math.max(4, Math.floor(Math.min(7 + state.wave * 2, PERF.maxEnemies) * tune.enemyCap));
  const spawnCadence = Math.max(0.32, 1.05 - state.wave * 0.045) * tune.spawnDelay;
  if (state.spawnTimer <= 0 && state.enemies.length < targetCount) {
    spawnEnemy();
    state.spawnTimer = spawnCadence;
  }

  if (Math.floor(state.time / 22) + 1 > state.wave) {
    state.wave += 1;
    checkRunAchievements();
    addFloater(`第 ${state.wave} 波`, WORLD.w / 2, 90, "#18d7ff");
    const waveBurst = Math.max(1, Math.floor(Math.min(8, 2 + state.wave) * tune.enemyCap));
    for (let i = 0; i < waveBurst; i += 1) spawnEnemy();
    if (state.wave % 5 === 0 && !state.bossWaves.has(state.wave)) {
      state.bossWaves.add(state.wave);
      queueBossWarning(state.wave);
    }
  }

  if (state.time >= state.nextPowerupAt) {
    spawnPowerup();
    state.nextPowerupAt += 60;
  }

  if (state.pendingBoss) {
    state.pendingBoss.timer -= dt;
    if (state.bossWarning) state.bossWarning.life = Math.max(0, state.pendingBoss.timer);
    if (state.pendingBoss.timer <= 0) {
      spawnBoss(state.pendingBoss.wave);
      state.pendingBoss = null;
      state.bossWarning = null;
    }
  }

  for (const enemy of state.enemies) {
    enemy.flash = Math.max(0, enemy.flash - dt);
    enemy.stun = Math.max(0, enemy.stun - dt);
    const targetPlayer = nearestPlayerTo(enemy);
    if (enemy.stun <= 0) {
      const a = angleTo(enemy, targetPlayer);
      const desiredDistance = enemy.type === "shooter" || enemy.type === "bossOrbit" || enemy.type === "bossLotus"
        ? 260
        : enemy.type === "bossPrism" || enemy.type === "bossVoid"
          ? 190
          : enemy.type === "bossWarden"
            ? 150
            : 0;
      const d = dist(enemy, targetPlayer);
      const dir = d < desiredDistance ? -1 : 1;
      enemy.vx = lerp(enemy.vx, Math.cos(a) * enemy.speed * dir, 1 - Math.exp(-dt * 5));
      enemy.vy = lerp(enemy.vy, Math.sin(a) * enemy.speed * dir, 1 - Math.exp(-dt * 5));
      if (enemy.isBoss) updateBoss(enemy, dt, d, a);
      if (enemy.type === "shooter") {
        enemy.shootTimer -= dt;
        if (enemy.shootTimer <= 0 && d < 620) {
          enemy.shootTimer = rand(1.2, 2.2) - state.wave * 0.018;
          const shotAngle = angleTo(enemy, targetPlayer);
          state.bullets.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(shotAngle) * (240 + state.wave * 7),
            vy: Math.sin(shotAngle) * (240 + state.wave * 7),
            r: 7,
            life: 3.8,
            color: "#ffca3d",
            damage: 12 * duoAttackScale(),
          });
          addSparks(enemy.x, enemy.y, 8, "#ffca3d", 260);
        }
      }
    }
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;
    enemy.vx *= 1 - Math.min(0.92, dt * 2.8);
    enemy.vy *= 1 - Math.min(0.92, dt * 2.8);
    for (const player of players) {
      const contact = enemy.r + player.r;
      if (distSq(enemy, player) < contact * contact) damagePlayer(player, enemy.touchDamage, enemy.x, enemy.y);
    }
  }

  for (const bullet of state.bullets) {
    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;
    bullet.life -= dt;
    for (const player of players) {
      const contact = bullet.r + player.r;
      if (distSq(bullet, player) < contact * contact) {
        bullet.life = 0;
        damagePlayer(player, bullet.damage || 12, bullet.x, bullet.y);
        break;
      }
    }
  }

  for (const shot of state.playerShots) {
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.life -= dt;
    for (const enemy of state.enemies) {
      if (enemy.hp <= 0) continue;
      const contact = shot.r + enemy.r;
      if (distSq(shot, enemy) < contact * contact) {
        const a = Math.atan2(shot.vy, shot.vx);
        damageEnemy(enemy, shot.damage, a, enemy.isBoss ? 120 : 260, 0.08, shot.color, 0.01);
        rewardHits(shot.owner || state.player, 1, shot.x, shot.y - 18, shot.color, 1, 0, 6);
        shot.pierce -= 1;
        if (shot.pierce < 0) {
          shot.life = 0;
          break;
        }
      }
    }
  }

  for (const item of state.powerups) {
    item.life -= dt;
    item.spin += dt * 3.2;
    for (const player of players) {
      const contact = item.r + player.r;
      if (distSq(item, player) < contact * contact) {
        collectPowerup(item, player);
        break;
      }
    }
  }

  for (const slashArc of state.slashes) slashArc.life -= dt;
  for (const spark of state.sparks) {
    spark.x += spark.vx * dt;
    spark.y += spark.vy * dt;
    spark.vx *= 1 - Math.min(0.9, dt * 4);
    spark.vy *= 1 - Math.min(0.9, dt * 4);
    spark.life -= dt;
  }
  for (const floater of state.floaters) {
    floater.y += floater.vy * dt;
    floater.life -= dt;
  }

  const before = state.enemies.length;
  state.enemies = state.enemies.filter((enemy) => {
    if (enemy.hp > 0) return true;
    const value = enemy.isBoss ? 1400 + state.wave * 80 : enemy.type === "brute" ? 85 : enemy.type === "shooter" ? 70 : 45;
    const gained = Math.floor(value * state.combo);
    state.score += gained;
    for (const player of alivePlayers()) addSpecial(player, enemy.isBoss ? 45 : 8);
    if (enemy.isBoss) {
      recordBossKill(enemy.type);
      unlockBossSkin(enemy);
      if (Math.random() < (ENHANCE_DROP_RATES[state.difficulty] ?? ENHANCE_DROP_RATES.hell)) spawnEnhancePowerup(enemy.x, enemy.y);
    }
    addSparks(enemy.x, enemy.y, 18, enemy.type === "brute" ? "#ffca3d" : "#18d7ff", 580);
    addFloater(`+${gained}`, enemy.x, enemy.y - 20, "#f8fbff");
    return false;
  });
  if (before !== state.enemies.length && state.enemies.length === 0) {
    for (const player of alivePlayers()) {
      player.hp = clamp(player.hp + 8, 0, player.maxHp);
      player.energy = 100;
    }
  }

  state.bullets = state.bullets.filter((bullet) => bullet.life > 0 && bullet.x > -80 && bullet.x < WORLD.w + 80 && bullet.y > -80 && bullet.y < WORLD.h + 80);
  state.playerShots = state.playerShots.filter((shot) => shot.life > 0 && shot.x > -80 && shot.x < WORLD.w + 80 && shot.y > -80 && shot.y < WORLD.h + 80);
  state.powerups = state.powerups.filter((item) => item.life > 0);
  state.slashes = state.slashes.filter((slashArc) => slashArc.life > 0);
  state.sparks = state.sparks.filter((spark) => spark.life > 0);
  state.floaters = state.floaters.filter((floater) => floater.life > 0);

  uiClock += dt;
  updateUi();
}

function updateUi(force = false) {
  if (!state) return;
  if (!force && uiClock < PERF.uiInterval) return;
  uiClock = 0;
  syncSetupUi();
  const p = state.players[0];
  const p2 = state.players[1];
  const maxStacks = maxEnhanceStacks();
  const next = {
    score: Math.floor(state.score).toString(),
    wave: state.wave.toString(),
    combo: `x${state.combo}`,
    health: `${Math.round((p.hp / p.maxHp) * 100)}%`,
    energy: `${Math.round(p.energy)}%`,
    special: `${Math.round(p.special)}%`,
    specialLabel: `绝招 ${p.specialCharges}/${p.maxSpecialCharges}`,
    enhanceLabel: `增幅 ${p.enhanceStacks}/${maxStacks}`,
    enhanceEffect: enhancementStatusText(p),
    health2: p2 ? `${Math.round((p2.hp / p2.maxHp) * 100)}%` : "0%",
    energy2: p2 ? `${Math.round(p2.energy)}%` : "0%",
    special2: p2 ? `${Math.round(p2.special)}%` : "0%",
    specialLabel2: p2 ? `绝招 AI ${p2.specialCharges}/${p2.maxSpecialCharges}` : "绝招 AI 0/1",
    enhanceLabel2: p2 ? `增幅 AI ${p2.enhanceStacks}/${maxStacks}` : `增幅 AI 0/${maxStacks}`,
    enhanceEffect2: p2 ? enhancementStatusText(p2) : "",
  };
  if (uiCache.score !== next.score) ui.score.textContent = next.score;
  if (uiCache.wave !== next.wave) ui.wave.textContent = next.wave;
  if (uiCache.combo !== next.combo) ui.combo.textContent = next.combo;
  if (uiCache.health !== next.health) ui.health.style.width = next.health;
  if (uiCache.energy !== next.energy) ui.energy.style.width = next.energy;
  if (uiCache.special !== next.special) ui.special.style.width = next.special;
  if (uiCache.specialLabel !== next.specialLabel) ui.specialLabel.textContent = next.specialLabel;
  if (uiCache.enhanceLabel !== next.enhanceLabel) ui.enhanceLabel.textContent = next.enhanceLabel;
  if (uiCache.enhanceEffect !== next.enhanceEffect) ui.enhanceEffect.textContent = next.enhanceEffect;
  if (ui.health2 && uiCache.health2 !== next.health2) ui.health2.style.width = next.health2;
  if (ui.energy2 && uiCache.energy2 !== next.energy2) ui.energy2.style.width = next.energy2;
  if (ui.special2 && uiCache.special2 !== next.special2) ui.special2.style.width = next.special2;
  if (ui.specialLabel2 && uiCache.specialLabel2 !== next.specialLabel2) ui.specialLabel2.textContent = next.specialLabel2;
  if (ui.enhanceLabel2 && uiCache.enhanceLabel2 !== next.enhanceLabel2) ui.enhanceLabel2.textContent = next.enhanceLabel2;
  if (ui.enhanceEffect2 && uiCache.enhanceEffect2 !== next.enhanceEffect2) ui.enhanceEffect2.textContent = next.enhanceEffect2;
  uiCache = next;
}

function buildBackground() {
  background.width = WORLD.w;
  background.height = WORLD.h;
  const grd = bg.createLinearGradient(0, 0, WORLD.w, WORLD.h);
  grd.addColorStop(0, "#070914");
  grd.addColorStop(0.5, "#101018");
  grd.addColorStop(1, "#060910");
  bg.fillStyle = grd;
  bg.fillRect(0, 0, WORLD.w, WORLD.h);
  bg.strokeStyle = "rgba(255,255,255,0.055)";
  bg.lineWidth = 1;
  for (let x = 0; x <= WORLD.w; x += 64) {
    bg.beginPath();
    bg.moveTo(x, 0);
    bg.lineTo(x, WORLD.h);
    bg.stroke();
  }
  for (let y = 0; y <= WORLD.h; y += 64) {
    bg.beginPath();
    bg.moveTo(0, y);
    bg.lineTo(WORLD.w, y);
    bg.stroke();
  }
  bg.strokeStyle = "rgba(24, 215, 255, 0.55)";
  bg.lineWidth = 3;
  bg.strokeRect(12, 12, WORLD.w - 24, WORLD.h - 24);
}

function drawPlayer(p) {
  const hero = CHARACTERS[p.character] || CHARACTERS.blade;
  const skin = p.skin || baseSkinForCharacter(p.character);
  const skinTier = skin.tier || 0;
  for (let i = p.dashTrail.length - 1; i >= 0; i -= 1) {
    const t = p.dashTrail[i];
    const alpha = t.life / 0.24;
    ctx.fillStyle = p.character === "nova" ? `rgba(255, 202, 61, ${alpha * 0.13})` : `rgba(24, 215, 255, ${alpha * 0.14})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, p.r + 10 * alpha, 0, TAU);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.facing);
  ctx.shadowBlur = p.invuln > 0 ? 18 : 10;
  ctx.shadowColor = p.invuln > 0 ? "#ffca3d" : skin.color;

  if (skinTier >= 2) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = skin.attackColor || skin.color;
    ctx.shadowBlur = skinTier >= 3 ? 24 : 14;
    ctx.shadowColor = skin.attackColor || skin.color;
    ctx.globalAlpha = skinTier >= 3 ? 0.58 : 0.42;
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.lineTo(-31, -27);
    ctx.lineTo(-21, -6);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, 12);
    ctx.lineTo(-31, 27);
    ctx.lineTo(-21, 6);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = skin.color || hero.color;
    ctx.lineWidth = skinTier >= 3 ? 3 : 2;
    ctx.globalAlpha = 0.72;
    ctx.beginPath();
    ctx.moveTo(-18, -20);
    ctx.lineTo(6, -24);
    ctx.moveTo(-18, 20);
    ctx.lineTo(6, 24);
    ctx.stroke();
    ctx.restore();
  }

  if (skinTier >= 3) {
    const pulse = 0.72 + Math.sin(state.time * 9) * 0.16;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = skin.attackColor || "#ff3f7f";
    ctx.fillStyle = skin.color || "#b87cff";
    ctx.shadowBlur = 28;
    ctx.shadowColor = skin.attackColor || "#ff3f7f";
    ctx.globalAlpha = 0.36 * pulse;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(-5, 0, 36, 24, 0, 0, TAU);
    ctx.stroke();
    ctx.globalAlpha = 0.44;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(-20, side * 7);
      ctx.lineTo(-42, side * 15);
      ctx.lineTo(-24, side * 20);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(-14, -4);
    ctx.lineTo(-40, 0);
    ctx.lineTo(-14, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  ctx.fillStyle = p.invuln > 0 && Math.floor(state.time * 24) % 2 === 0 ? "#ffca3d" : "#f8fbff";
  ctx.beginPath();
  ctx.moveTo(skinTier >= 3 ? 29 : 25, 0);
  ctx.lineTo(-14, -17);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-14, 17);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = skin.color || hero.color;
  if (p.character === "ranger") {
    ctx.fillRect(-16, -3, 28, 6);
    ctx.fillRect(8, -8, 13, 16);
  } else if (p.character === "nova") {
    ctx.beginPath();
    ctx.arc(-8, 0, 9, 0, TAU);
    ctx.fill();
  } else {
    ctx.fillRect(-18, -4, 18, 8);
  }
  if (skinTier >= 2) {
    ctx.strokeStyle = skin.attackColor || skin.color;
    ctx.lineWidth = skinTier >= 3 ? 3 : 2;
    ctx.globalCompositeOperation = "lighter";
    ctx.beginPath();
    ctx.moveTo(-3, -11);
    ctx.lineTo(17, -3);
    ctx.lineTo(24, 0);
    ctx.lineTo(17, 3);
    ctx.lineTo(-3, 11);
    ctx.stroke();
  }
  if (skinTier >= 3) {
    ctx.fillStyle = skin.attackColor || "#ff3f7f";
    ctx.shadowBlur = 20;
    ctx.shadowColor = skin.attackColor || "#ff3f7f";
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawBoss(enemy) {
  const hpPct = clamp(enemy.hp / enemy.maxHp, 0, 1);
  ctx.save();
  ctx.translate(enemy.x, enemy.y);
  ctx.rotate(enemy.phase * 0.65);
  ctx.shadowBlur = enemy.flash > 0 ? 26 : 14;
  ctx.shadowColor = enemy.flash > 0 ? "#f8fbff" : enemy.color;
  ctx.strokeStyle = enemy.accent;
  ctx.fillStyle = enemy.flash > 0 ? "#f8fbff" : enemy.color;
  ctx.lineWidth = 5;

  if (enemy.type === "bossBlade") {
    ctx.beginPath();
    ctx.moveTo(0, -enemy.r - 28);
    ctx.lineTo(enemy.r * 0.72, -enemy.r * 0.16);
    ctx.lineTo(enemy.r + 22, 0);
    ctx.lineTo(enemy.r * 0.72, enemy.r * 0.16);
    ctx.lineTo(0, enemy.r + 28);
    ctx.lineTo(-enemy.r * 0.72, enemy.r * 0.16);
    ctx.lineTo(-enemy.r - 22, 0);
    ctx.lineTo(-enemy.r * 0.72, -enemy.r * 0.16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = enemy.accent;
    ctx.fillRect(-8, -enemy.r - 34, 16, enemy.r * 2 + 68);
  } else if (enemy.type === "bossOrbit") {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
      const a = enemy.phase * 1.7 + (i / 4) * TAU;
      ctx.fillStyle = i % 2 ? enemy.accent : "#f8fbff";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (enemy.r + 28), Math.sin(a) * (enemy.r + 28), 10, 0, TAU);
      ctx.fill();
    }
  } else if (enemy.type === "bossPrism") {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * TAU;
      const r = i % 2 === 0 ? enemy.r + 22 : enemy.r * 0.62;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = enemy.color;
    ctx.rotate(-enemy.phase * 1.3);
    ctx.strokeRect(-enemy.r * 0.58, -enemy.r * 0.58, enemy.r * 1.16, enemy.r * 1.16);
  } else if (enemy.type === "bossWarden") {
    ctx.fillRect(-enemy.r * 0.82, -enemy.r * 0.82, enemy.r * 1.64, enemy.r * 1.64);
    ctx.strokeRect(-enemy.r * 0.82, -enemy.r * 0.82, enemy.r * 1.64, enemy.r * 1.64);
    ctx.strokeStyle = enemy.color;
    ctx.rotate(-enemy.phase * 1.7);
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.r + 16 + i * 12, i * 0.8, Math.PI + i * 0.8);
      ctx.stroke();
    }
    ctx.fillStyle = enemy.accent;
    ctx.fillRect(-enemy.r * 0.18, -enemy.r - 18, enemy.r * 0.36, enemy.r * 2 + 36);
  } else if (enemy.type === "bossLotus") {
    for (let i = 0; i < 8; i += 1) {
      ctx.save();
      ctx.rotate((i / 8) * TAU);
      ctx.beginPath();
      ctx.ellipse(enemy.r * 0.55, 0, enemy.r * 0.65, enemy.r * 0.24, 0, 0, TAU);
      ctx.fillStyle = i % 2 ? enemy.color : enemy.accent;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#f8fbff";
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.36, 0, TAU);
    ctx.fill();
  } else if (enemy.type === "bossVoid") {
    ctx.beginPath();
    ctx.moveTo(0, -enemy.r - 24);
    ctx.lineTo(enemy.r * 0.95, -enemy.r * 0.22);
    ctx.lineTo(enemy.r * 0.55, enemy.r + 18);
    ctx.lineTo(0, enemy.r * 0.52);
    ctx.lineTo(-enemy.r * 0.55, enemy.r + 18);
    ctx.lineTo(-enemy.r * 0.95, -enemy.r * 0.22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = enemy.accent;
    ctx.rotate(-enemy.phase * 2.2);
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r + 18, 0.2, Math.PI * 1.35);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r * 0.48, 0, TAU);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, enemy.r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.62)";
  ctx.fillRect(WORLD.w / 2 - 220, 28, 440, 15);
  ctx.fillStyle = enemy.color;
  ctx.fillRect(WORLD.w / 2 - 220, 28, 440 * hpPct, 15);
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.strokeRect(WORLD.w / 2 - 220, 28, 440, 15);
  ctx.font = "800 18px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f8fbff";
  ctx.shadowBlur = 10;
  ctx.shadowColor = enemy.color;
  ctx.fillText(enemy.bossName, WORLD.w / 2, 24);
  ctx.restore();
}

function drawEnemies() {
  for (const enemy of state.enemies) {
    if (enemy.isBoss) {
      drawBoss(enemy);
      continue;
    }
    const hpPct = enemy.hp / enemy.maxHp;
    const color = enemy.type === "brute" ? "#ffca3d" : enemy.type === "shooter" ? "#b87cff" : "#ff3f7f";
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    ctx.shadowBlur = enemy.flash > 0 ? 16 : 7;
    ctx.shadowColor = enemy.flash > 0 ? "#f8fbff" : color;
    ctx.fillStyle = enemy.flash > 0 ? "#f8fbff" : color;
    if (enemy.type === "brute") {
      ctx.rotate(state.time * 0.8);
      ctx.fillRect(-enemy.r, -enemy.r, enemy.r * 2, enemy.r * 2);
    } else if (enemy.type === "shooter") {
      ctx.beginPath();
      for (let i = 0; i < 6; i += 1) {
        const a = (i / 6) * TAU + Math.PI / 6;
        const r = i % 2 === 0 ? enemy.r + 4 : enemy.r - 5;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, enemy.r, 0, TAU);
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(0,0,0,0.48)";
    ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 13, enemy.r * 2, 4);
    ctx.fillStyle = hpPct > 0.45 ? "#afff4a" : "#ff3f7f";
    ctx.fillRect(enemy.x - enemy.r, enemy.y - enemy.r - 13, enemy.r * 2 * hpPct, 4);
  }
}

function drawSlashes() {
  for (const slashArc of state.slashes) {
    const t = slashArc.life / slashArc.maxLife;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(slashArc.x, slashArc.y);
    ctx.rotate(slashArc.angle);
    const slashColor = slashArc.color || (slashArc.power >= 4 || slashArc.power > 1 ? "#ffca3d" : "#18d7ff");
    ctx.globalAlpha = t;
    ctx.strokeStyle = slashColor;
    ctx.lineWidth = slashArc.power >= 4 ? 26 : slashArc.power > 1 ? 20 : 13;
    ctx.shadowBlur = 16;
    ctx.shadowColor = slashColor;
    ctx.beginPath();
    ctx.arc(0, 0, slashArc.reach * (1.08 - t * 0.18), -slashArc.arc, slashArc.arc);
    ctx.stroke();
    ctx.restore();
  }
}

function drawPowerups() {
  for (const item of state.powerups) {
    const t = clamp(item.life / item.maxLife, 0, 1);
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.rotate(item.spin);
    ctx.globalAlpha = t < 0.25 ? 0.55 + Math.sin(state.time * 18) * 0.25 : 1;
    ctx.shadowBlur = 22;
    ctx.shadowColor = item.color;
    ctx.fillStyle = item.color;
    ctx.strokeStyle = "#f8fbff";
    ctx.lineWidth = 3;
    if (item.type === "regen") {
      ctx.beginPath();
      ctx.arc(0, 0, item.r, 0, TAU);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#041018";
      ctx.fillRect(-4, -12, 8, 24);
      ctx.fillRect(-12, -4, 24, 8);
    } else if (item.type === "energy") {
      ctx.beginPath();
      ctx.moveTo(0, -item.r - 4);
      ctx.lineTo(item.r, 0);
      ctx.lineTo(2, 0);
      ctx.lineTo(0, item.r + 4);
      ctx.lineTo(-item.r, 0);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (item.type === "enhance") {
      ctx.beginPath();
      ctx.moveTo(0, -item.r - 10);
      ctx.lineTo(item.r + 10, 0);
      ctx.lineTo(0, item.r + 10);
      ctx.lineTo(-item.r - 10, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.rotate(-item.spin * 2);
      ctx.strokeStyle = "#18d7ff";
      ctx.strokeRect(-item.r * 0.54, -item.r * 0.54, item.r * 1.08, item.r * 1.08);
      ctx.fillStyle = "#041018";
      ctx.beginPath();
      ctx.arc(0, 0, item.r * 0.35, 0, TAU);
      ctx.fill();
    } else {
      ctx.beginPath();
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * TAU;
        const r = i % 2 === 0 ? item.r + 8 : item.r * 0.62;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawParticles() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const shot of state.playerShots) {
    const alpha = clamp(shot.life / 1.2, 0.18, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = shot.color;
    ctx.shadowBlur = 16;
    ctx.shadowColor = shot.color;
    ctx.beginPath();
    ctx.arc(shot.x, shot.y, shot.r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#f8fbff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const bullet of state.bullets) {
    ctx.fillStyle = bullet.color || "#ffca3d";
    ctx.shadowBlur = 10;
    ctx.shadowColor = bullet.color || "#ffca3d";
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, bullet.r, 0, TAU);
    ctx.fill();
  }
  for (const spark of state.sparks) {
    const alpha = clamp(spark.life / spark.maxLife, 0, 1);
    ctx.fillStyle = spark.color.replace(")", `, ${alpha})`).replace("rgb", "rgba");
    if (!spark.color.startsWith("rgb")) ctx.fillStyle = spark.color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size * alpha, 0, TAU);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "800 24px Inter, sans-serif";
  for (const floater of state.floaters) {
    ctx.globalAlpha = clamp(floater.life / 0.75, 0, 1);
    ctx.fillStyle = floater.color;
    ctx.shadowBlur = 10;
    ctx.shadowColor = floater.color;
    ctx.fillText(floater.text, floater.x, floater.y);
  }
  ctx.restore();
}

function drawBossWarning() {
  const warning = state.bossWarning;
  if (!warning) return;
  const t = clamp(warning.life / warning.maxLife, 0, 1);
  const pulse = 0.55 + Math.sin(state.time * 18) * 0.25;
  ctx.save();
  ctx.globalAlpha = 0.45 + t * 0.25;
  ctx.strokeStyle = warning.color;
  ctx.lineWidth = 8;
  ctx.shadowBlur = 28;
  ctx.shadowColor = warning.color;
  ctx.strokeRect(24, 24, WORLD.w - 48, WORLD.h - 48);
  ctx.globalAlpha = pulse;
  ctx.fillStyle = warning.color;
  ctx.font = "900 54px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BOSS WARNING", WORLD.w / 2, WORLD.h * 0.42);
  ctx.font = "800 30px Inter, sans-serif";
  ctx.fillStyle = "#f8fbff";
  ctx.fillText(warning.name, WORLD.w / 2, WORLD.h * 0.42 + 48);
  ctx.restore();
}

function draw() {
  if (!state) {
    clearFrame();
    ctx.drawImage(background, 0, 0, WORLD.w, WORLD.h);
    return;
  }

  const sx = rand(-state.shake, state.shake);
  const sy = rand(-state.shake, state.shake);
  clearFrame();
  ctx.save();
  ctx.translate(sx, sy);
  ctx.drawImage(background, -40, -40, WORLD.w + 80, WORLD.h + 80);

  drawPowerups();
  drawSlashes();
  drawEnemies();
  for (const player of state.players) {
    if (player.hp > 0) drawPlayer(player);
  }
  drawParticles();
  drawBossWarning();
  ctx.restore();
}

function loop(time) {
  const dt = Math.min(0.033, (time - lastTime) / 1000 || 0);
  lastTime = time;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function bindInput() {
  window.addEventListener("keydown", (event) => {
    keys.add(event.code);
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code) && (running || paused || selectedGameMode === "duo")) {
      event.preventDefault();
    }
    if (event.code === "Space") {
      event.preventDefault();
      if (running) attack(state.players[0]);
    }
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") {
      event.preventDefault();
      if (running) dash(state.players[0]);
    }
    if (event.code === "KeyE") {
      event.preventDefault();
      if (running) special(state.players[0]);
    }
    if (event.code === "KeyP" || event.code === "Escape") {
      event.preventDefault();
      if (event.code === "Escape" && !ui.guideModal.classList.contains("hidden")) {
        closeGuide();
      } else if (paused) resumeGame();
      else pauseGame();
    }
    if (event.code === "Enter" && !running) startGame();
  });
  window.addEventListener("keyup", (event) => keys.delete(event.code));
  canvas.addEventListener("pointermove", (event) => {
    const pos = screenToWorld(event.clientX, event.clientY);
    pointer.x = pos.x;
    pointer.y = pos.y;
  });
  canvas.addEventListener("pointerdown", (event) => {
    const pos = screenToWorld(event.clientX, event.clientY);
    pointer.x = pos.x;
    pointer.y = pos.y;
    pointer.down = true;
    if (event.pointerType === "touch" && event.clientX < window.innerWidth * 0.5) {
      startDynamicStick(event);
    }
    if (running && event.pointerType !== "touch" && state.mode !== "duo") attack(state.players[0]);
  });
  window.addEventListener("pointermove", (event) => {
    if (touchMove.id === event.pointerId) updateStick(event);
  });
  window.addEventListener("pointerup", (event) => {
    pointer.down = false;
    resetStick(event);
  });
  ui.start.addEventListener("click", startGame);
  ui.pause.addEventListener("click", () => {
    if (paused) resumeGame();
    else pauseGame();
  });
  ui.home.addEventListener("click", goHome);
  ui.fullscreen.addEventListener("click", toggleFullscreen);
  ui.guide.addEventListener("click", openGuide);
  ui.guideClose.addEventListener("click", closeGuide);
  ui.resetLeaderboard.addEventListener("click", resetLeaderboard);
  ui.resetProgress.addEventListener("click", resetAllProgress);
  ui.guideModal.addEventListener("click", (event) => {
    if (event.target === ui.guideModal) closeGuide();
  });
  document.addEventListener("fullscreenchange", () => {
    if (document.fullscreenElement) {
      document.documentElement.classList.add("app-fullscreen");
    } else if (!fallbackFullscreen) {
      document.documentElement.classList.remove("app-fullscreen");
    }
    updateFullscreenButton();
    resizeCanvas();
  });
  for (const button of ui.difficultyButtons) {
    button.addEventListener("click", () => setDifficulty(button.dataset.difficulty));
  }
  for (const button of ui.modeButtons) {
    button.addEventListener("click", () => setGameMode(button.dataset.mode));
  }
  for (const button of ui.slotButtons) {
    button.addEventListener("click", () => setPlayerSlot(Number(button.dataset.slot || 0)));
  }
  for (const button of ui.characterButtons) {
    button.addEventListener("click", () => setCharacter(button.dataset.character));
  }

  window.addEventListener("pointercancel", resetStick);
  ui.slashTouch.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (running) attack(state.players[0]);
  });
  ui.dashTouch.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (running) dash(state.players[0]);
  });
  ui.specialTouch.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    if (running) special(state.players[0]);
  });
  document.addEventListener("touchmove", (event) => {
    if (event.target.closest("canvas, .ios-touch-ui")) event.preventDefault();
  }, { passive: false });
}

function startDynamicStick(event) {
  if (!running || touchMove.active) return;
  event.preventDefault();
  touchMove.active = true;
  touchMove.id = event.pointerId;
  touchMove.centerX = event.clientX;
  touchMove.centerY = event.clientY;
  ui.stick.classList.add("active");
  ui.stick.style.setProperty("--stick-left", `${touchMove.centerX}px`);
  ui.stick.style.setProperty("--stick-top", `${touchMove.centerY}px`);
  canvas.setPointerCapture?.(event.pointerId);
  updateStick(event);
}

function updateStick(event) {
  if (!touchMove.active) return;
  const dx = event.clientX - touchMove.centerX;
  const dy = event.clientY - touchMove.centerY;
  const mag = Math.hypot(dx, dy);
  const max = 44;
  const amt = Math.min(max, mag);
  const nx = mag > 0 ? dx / mag : 0;
  const ny = mag > 0 ? dy / mag : 0;
  touchMove.x = nx * (amt / max);
  touchMove.y = ny * (amt / max);
  ui.stick.style.setProperty("--stick-x", `${nx * amt}px`);
  ui.stick.style.setProperty("--stick-y", `${ny * amt}px`);
}

function resetStick(event) {
  if (event && touchMove.id !== event.pointerId) return;
  if (event && canvas.releasePointerCapture) {
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already be released by the browser.
    }
  }
  touchMove.active = false;
  touchMove.id = null;
  touchMove.x = 0;
  touchMove.y = 0;
  touchMove.centerX = 0;
  touchMove.centerY = 0;
  ui.stick.classList.remove("active");
  ui.stick.style.setProperty("--stick-x", "0px");
  ui.stick.style.setProperty("--stick-y", "0px");
}

window.addEventListener("resize", resizeCanvas);
bindInput();
resizeCanvas();
syncSetupUi();
state = makeState();
updateFullscreenButton();
updateUi(true);
renderSkinChoices();
renderLeaderboard();
draw();
requestAnimationFrame(loop);
