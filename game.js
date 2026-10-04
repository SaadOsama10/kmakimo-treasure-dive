// ===== KmaKimo - الغطس ع الكنز الغريق =====

const loadingScreen = document.getElementById('loading-screen');
const startScreen = document.getElementById('start-screen');
const shopScreen = document.getElementById('shop-screen');
const gameScreen = document.getElementById('game-screen');
const pauseScreen = document.getElementById('pause-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const retryBtn = document.getElementById('retry-btn');
const shopBtn = document.getElementById('shop-btn');
const shopBtnEnd = document.getElementById('shop-btn-end');
const shopBackBtn = document.getElementById('shop-back-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const homeBtnPause = document.getElementById('home-btn-pause');
const homeBtnEnd = document.getElementById('home-btn-end');
const muteBtn = document.getElementById('mute-btn');
const muteBtnGame = document.getElementById('mute-btn-game');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const oxygenBar = document.getElementById('oxygen-bar');
const powerBar = document.getElementById('power-bar');
const scoreDisplay = document.getElementById('score-display');
const finalScore = document.getElementById('final-score');
const finalTime = document.getElementById('final-time');
const finalPearls = document.getElementById('final-pearls');
const endTitle = document.getElementById('end-title');
const heroImgStart = document.getElementById('hero-img-start');
const heroImgEnd = document.getElementById('hero-img-end');
const hudAvatar = document.getElementById('hud-avatar');
const pearlsCountStart = document.getElementById('pearls-count-start');
const pearlsCountShop = document.getElementById('pearls-count-shop');
const skinsGrid = document.getElementById('skins-grid');
const seasGrid = document.getElementById('seas-grid');
const upgradesGrid = document.getElementById('upgrades-grid');
const bestScoreStart = document.getElementById('best-score-start');
const bestScoreStartWrap = document.getElementById('best-score-start-wrap');
const bestScoreEnd = document.getElementById('best-score-end');

// ---- عناصر الملتيبلاير ----
const mpBtn = document.getElementById('mp-btn');
const mpMenuScreen = document.getElementById('mp-menu-screen');
const mpMenuBackBtn = document.getElementById('mp-menu-back-btn');
const mpCreateBtn = document.getElementById('mp-create-btn');
const mpJoinBtn = document.getElementById('mp-join-btn');
const mpCodeInput = document.getElementById('mp-code-input');
const mpMenuError = document.getElementById('mp-menu-error');
const mpWaitingScreen = document.getElementById('mp-waiting-screen');
const mpCodeDisplay = document.getElementById('mp-code-display');
const mpWaitingCancelBtn = document.getElementById('mp-waiting-cancel-btn');
const characterSelectScreen = document.getElementById('character-select-screen');
const characterSelectGrid = document.getElementById('character-select-grid');
const characterConfirmBtn = document.getElementById('character-confirm-btn');
const characterSelectStatus = document.getElementById('character-select-status');
const opponentHud = document.getElementById('opponent-hud');
const opponentMarker = document.getElementById('opponent-marker');
const opponentScoreEl = document.getElementById('opponent-score');
const challengeBanner = document.getElementById('challenge-banner');
const challengeTitleEl = document.getElementById('challenge-title');
const challengeDescEl = document.getElementById('challenge-desc');
const challengeTimerEl = document.getElementById('challenge-timer');
const challengeCenter = document.getElementById('challenge-center');
const challengeCenterIcon = document.getElementById('challenge-center-icon');
const challengeCenterText = document.getElementById('challenge-center-text');
const challengeNextBtn = document.getElementById('challenge-next-btn');

// ---- تحميل صور اللعبة (مسارات من assets.js) ----
let assetsReady = false;
let heroImageReady = false;
const playerSprite = new Image();
const heroImageObj = new Image();

function initAssets() {
  heroImgStart.src = HERO_IMAGE_SRC;
  heroImgEnd.src = HERO_IMAGE_SRC;
  hudAvatar.src = HERO_IMAGE_SRC;
  heroImageObj.onload = () => { heroImageReady = true; };
  heroImageObj.onerror = () => { heroImageReady = false; };
  heroImageObj.src = HERO_IMAGE_SRC;
  playerSprite.onload = () => {
    assetsReady = true;
    showStartScreen();
  };
  playerSprite.onerror = () => {
    console.warn('تعذر تحميل صورة اللاعب، رح نستخدم شكل بديل بسيط.');
    assetsReady = true;
    showStartScreen();
  };
  playerSprite.src = PLAYER_SPRITE_SRC;

  for (const ch of MP_CHARACTERS) {
    const img = new Image();
    img.src = MP_CHARACTER_SPRITES[ch.id];
    mpCharacterImages[ch.id] = img;
  }
}

function showStartScreen() {
  loadingScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  updatePearlsDisplays();
  updateMuteIcons();
  updateBestScoreStart();
  // نحاول نشغّل الموسيقى فورًا؛ لو المتصفح رفض بدون تفاعل، رح تشتغل تلقائيًا أول ما المستخدم يضغط أي شي
  GameAudio.ensureCtx();
  GameAudio.startMusic();
}

// ---- إعدادات عامة ----
const SURFACE_RATIO = 0.2;
const BASE_SPEED = 230;
const MAX_SPEED_MULT = 1.6;
const BASE_MAX_OXYGEN = 100;
const MAX_OXYGEN_CAP = 150;
const OXYGEN_DRAIN_RATE = 7;
const OXYGEN_REFILL_RATE = 32;
const POWER_GROWTH_TIME = 240;

let state = 'loading';
let keys = {};
let player, obstacles, treasures, fish, turtles, bubbles, seaweeds, catchPopups, powerups, decorations, submarines, floorRocks;
let seaTransition = null;

// ================== حالة الملتيبلاير ==================
let mpActive = false;
let mpMyCharacter = null;
let mpMyReady = false;
let mpOpponentState = null;
let mpOpponentPresent = false;
let mpOpponentWasAlive = true;
let mpMyChallengeReady = false;
let mpChallenge = null; // آخر نسخة وصلت من world/challenge
let mpChallengeSeqSeen = -1;
let mpMyWon = false;
let mpLastBroadcastSeaSeq = -1;
let mpTimeoutCheckTimer = null;
// عدادات تقدّم التحدي محليًا بكل جولة
let mpProgress = { coinsStart: 0, fishCount: 0, turtleCount: 0, rareCaught: false, bigTreasureCaught: false, aliveReported: true, maxDepth: 0 };

// ---- 9 أنواع تحديات، أصعب وأطول وأكتر تنوع - كلها برموز بدل كلام ----
// النوع اللي بآخر اسمه race: مش أول وحدة توصل لهدف، لأ مين بيجمع أكتر لما الوقت يخلص
const CHALLENGE_TYPES = [
  () => ({ type: 'coins', target: Math.round(rand(200, 350)), duration: 260, timeBased: false, label: (t) => `🏁 أول واحد يجمع 💰×${t}` }),
  () => ({ type: 'fish_count', target: Math.round(rand(8, 13)), duration: 280, timeBased: false, label: (t) => `🏁 أول واحد يصطاد 🐟×${t}` }),
  () => ({ type: 'survive', target: 0, duration: Math.round(rand(130, 180)), timeBased: true, label: () => `⏳ مين بيصمد أطول 💪` }),
  () => ({ type: 'rare_catch', target: 90, duration: 260, timeBased: false, label: () => `🏁 أول واحد يصطاد سمكة نادرة 🐟⭐` }),
  () => ({ type: 'turtle_rescue', target: Math.round(rand(4, 7)), duration: 240, timeBased: false, label: (t) => `🏁 أول واحد ينقذ 🐢×${t}` }),
  () => ({ type: 'big_treasure', target: 42, duration: 220, timeBased: false, label: () => `🏁 أول واحد يلقط كنز ثمين 💎✨` }),
  () => ({ type: 'coins_race', target: 0, duration: Math.round(rand(60, 90)), timeBased: true, label: () => `⏳ مين بيجمع كنوز أكتر 💰📈` }),
  () => ({ type: 'fish_race', target: 0, duration: Math.round(rand(70, 100)), timeBased: true, label: () => `⏳ مين بيصطاد سمك أكتر 🐟📈` }),
  () => ({ type: 'depth_race', target: 0, duration: Math.round(rand(45, 70)), timeBased: true, label: () => `⏳ مين بينزل أعمق 🔽🌊` })
];

function pickRandomChallenge(prevSeq) {
  const gen = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
  const c = gen();
  return {
    type: c.type,
    target: c.target,
    duration: c.duration,
    timeBased: c.timeBased,
    labelText: c.label(c.target),
    startedAt: Date.now(),
    seq: (typeof prevSeq === 'number' ? prevSeq : (mpChallenge && mpChallenge.seq ? mpChallenge.seq : 0)) + 1,
    winnerId: null,
    winnerName: null
  };
}


let submarineAppearances = 0;

// أول مرة الغواصة بتيجي بوقت قصير نسبيًا، وكل مرة بعدها بتاخد وقت أطول شوي
// بس بسقف أقصى عشان ما توصل لمرحلة نادرة كتير
function nextSubmarineInterval() {
  const base = 26 + submarineAppearances * 11;
  const capped = Math.min(95, base);
  return capped + rand(-6, 6);
}
let elapsedTime = 0;
let lastFrameTime = 0;
let spawnTimers = { jellyfish: 0, shark: 0, snake: 0, coral: 0, treasure: 0, fish: 0, turtle: 0, bubble: 0, powerup: 0, boss: 0, decoration: 0, crocodile: 0, scorpion: 0, hippo: 0, submarine: 0 };

// ---- أنواع السمك القابل للصيد (تشكيلة موسّعة جدًا) ----
const FISH_TYPES = [
  { name: 'سمكة الشعاب', baseSize: 22, required: 0, reward: 4, color: '#7fd8e8', dark: '#3fa8c9', pattern: 'plain' },
  { name: 'سمكة مخططة', baseSize: 30, required: 25, reward: 10, color: '#ffd76a', dark: '#d4a83a', pattern: 'striped' },
  { name: 'سمكة مرقطة', baseSize: 34, required: 55, reward: 16, color: '#ff9a6a', dark: '#d1622f', pattern: 'spotted' },
  { name: 'سمكة الفراشة', baseSize: 38, required: 90, reward: 24, color: '#ff7fc4', dark: '#c94f92', pattern: 'striped' },
  { name: 'سمكة عملاقة', baseSize: 50, required: 140, reward: 34, color: '#8fd67f', dark: '#4f9a3f', pattern: 'spotted' },
  { name: 'سمكة الأعماق', baseSize: 58, required: 210, reward: 48, color: '#6a8fff', dark: '#2f4fc9', pattern: 'plain' },
  { name: 'سمكة ذهبية نادرة', baseSize: 66, required: 320, reward: 75, color: '#ffd76a', dark: '#a9720f', pattern: 'spotted' },
  { name: 'سمكة أسطورية', baseSize: 80, required: 480, reward: 130, color: '#c98bff', dark: '#8e4fd4', pattern: 'striped' },
  { name: 'سمكة الشفق', baseSize: 92, required: 650, reward: 190, color: '#ff6a9a', dark: '#a3245f', pattern: 'striped' },
  { name: 'ملك البحر', baseSize: 105, required: 900, reward: 260, color: '#ffe27a', dark: '#8e6a0f', pattern: 'spotted' }
];

// ---- سلاحف البحر: قابلة للصيد دائمًا (بطيئة وهادئة) ----
const TURTLE_TYPES = [
  { name: 'سلحفاة خضراء', baseSize: 52, reward: 14, shell: '#3f8f5f', shellDark: '#2a5f3f', skin: '#6fae7f' },
  { name: 'سلحفاة صقرية', baseSize: 62, reward: 22, shell: '#a97a3f', shellDark: '#6f4f2a', skin: '#c9a76f' }
];

// ================== المتجر: بدلات، بحار، ترقيات دائمة (نسخة موسّعة) ==================
const SKINS = [
  { id: 'default', name: 'البدلة الأصلية', price: 0, filter: 'none', swatch: '#122b5c' },
  { id: 'gold', name: 'البدلة الذهبية', price: 350, filter: 'hue-rotate(45deg) saturate(1.6) brightness(1.15)', swatch: '#c9922f' },
  { id: 'emerald', name: 'البدلة الزمردية', price: 650, filter: 'hue-rotate(140deg) saturate(1.4)', swatch: '#1f8f6e' },
  { id: 'shadow', name: 'بدلة الظل', price: 1000, filter: 'grayscale(0.75) brightness(0.6)', swatch: '#2a2a2a' },
  { id: 'crimson', name: 'البدلة القرمزية', price: 1400, filter: 'hue-rotate(320deg) saturate(1.7) brightness(1.05)', swatch: '#a3243f' },
  { id: 'arctic', name: 'البدلة الجليدية', price: 1900, filter: 'hue-rotate(190deg) saturate(1.3) brightness(1.3)', swatch: '#bfe9f2' },
  { id: 'volcanic', name: 'بدلة البركان', price: 2400, filter: 'hue-rotate(-20deg) saturate(1.8) brightness(0.95)', swatch: '#7a2a12' },
  { id: 'legend', name: 'البدلة الأسطورية', price: 3000, filter: 'hue-rotate(60deg) saturate(2) brightness(1.25) contrast(1.15)', swatch: '#ffd76a' }
];

const SEAS = [
  { id: 'reef', name: 'الشعاب المرجانية', price: 0, colors: ['#5fd6ec', '#0e6f9e', '#0a4a70', '#041d33'] },
  { id: 'deep', name: 'الأعماق السحيقة', price: 500, colors: ['#2a4a7e', '#0a1f45', '#050f2c', '#01050f'] },
  { id: 'tropical', name: 'المياه الاستوائية', price: 900, colors: ['#7ff0e0', '#1fae9e', '#0b6f66', '#023b36'] },
  { id: 'arctic', name: 'بحر القطب', price: 1400, colors: ['#dff6ff', '#8fc9e0', '#3f6f8f', '#0f2536'] },
  { id: 'volcanic', name: 'البحر البركاني', price: 2000, colors: ['#ff8a5c', '#8f2f1f', '#4a1510', '#150502'] },
  { id: 'abyss', name: 'الهاوية المظلمة', price: 3000, colors: ['#3a2a5e', '#1a1035', '#0a0518', '#020108'] }
];

const UPGRADES = [
  { id: 'oxygen', name: 'خزان أوكسجين أكبر', maxLevel: 6, basePrice: 260, priceStep: 240, effectPerLevel: 12, unit: '+' },
  { id: 'speed', name: 'زعانف أسرع', maxLevel: 6, basePrice: 300, priceStep: 270, effectPerLevel: 0.05, unit: '%' },
  { id: 'magnet', name: 'مغناطيس الكنوز', maxLevel: 5, basePrice: 340, priceStep: 300, effectPerLevel: 12, unit: 'px' },
  { id: 'shield', name: 'دروع حماية دائمة', maxLevel: 3, basePrice: 550, priceStep: 500, effectPerLevel: 1, unit: 'درع' },
  { id: 'regen', name: 'تجديد أوكسجين أسرع', maxLevel: 5, basePrice: 320, priceStep: 280, effectPerLevel: 5, unit: '+' },
  { id: 'luck', name: 'حظ الصياد', maxLevel: 5, basePrice: 400, priceStep: 350, effectPerLevel: 0.08, unit: '%' }
];

function effectiveOxygenRefillRate() {
  return OXYGEN_REFILL_RATE + upgradeByIdEffect('regen');
}

// ================== شخصيات الملتيبلاير (كل واحدة لون مختلف بالكامل، مجانية للجولة) ==================
const MP_CHARACTERS = [
  { id: 'blue', name: 'الأزرق', swatch: '#122b5c' },
  { id: 'crimson', name: 'القرمزي', swatch: '#6a1020' },
  { id: 'emerald', name: 'الزمردي', swatch: '#0f5c3f' },
  { id: 'gold', name: 'الذهبي', swatch: '#8a6a1f' },
  { id: 'violet', name: 'البنفسجي', swatch: '#4a2f8a' },
  { id: 'shadow', name: 'الظل', swatch: '#2e2e2e' }
];

const mpCharacterImages = {};

function effectiveLuckBonus() {
  return upgradeByIdEffect('luck');
}

function upgradeByIdEffect(id) {
  const upg = UPGRADES.find(u => u.id === id);
  const level = saveData[id + 'Level'] || 0;
  return level * upg.effectPerLevel;
}

function loadSave() {
  const defaults = {
    pearls: 0,
    ownedSkins: ['default'],
    ownedSeas: ['reef'],
    equippedSkin: 'default',
    equippedSea: 'reef',
    oxygenLevel: 0,
    speedLevel: 0,
    magnetLevel: 0,
    shieldLevel: 0,
    regenLevel: 0,
    luckLevel: 0,
    bestScore: 0
  };
  try {
    const raw = localStorage.getItem('kmakimo_save');
    if (raw) {
      const parsed = JSON.parse(raw);
      return Object.assign({}, defaults, parsed);
    }
  } catch (e) { /* تجاهل أي خطأ بالتخزين */ }
  return defaults;
}

let saveData = loadSave();

function persistSave() {
  try {
    localStorage.setItem('kmakimo_save', JSON.stringify(saveData));
  } catch (e) { /* تجاهل لو التخزين المحلي غير متاح */ }
}

function currentSkin() {
  return SKINS.find(s => s.id === saveData.equippedSkin) || SKINS[0];
}

function currentSea() {
  return SEAS.find(s => s.id === saveData.equippedSea) || SEAS[0];
}

// البحر الفعلي أثناء الجولة، ممكن يتغير مؤقتًا لو استخدم اللاعب الغواصة
let activeSeaId = null;
let mpCurrentSeaId = null; // آخر بحر مشترك بالملتيبلاير، يضل زي ما هو حتى لو اللاعب مات ورجع
function activeSeaTheme() {
  if (activeSeaId) {
    const found = SEAS.find(s => s.id === activeSeaId);
    if (found) return found;
  }
  return currentSea();
}

function effectiveBaseOxygen() {
  return BASE_MAX_OXYGEN + upgradeByIdEffect('oxygen');
}

function effectiveBaseSpeedMult() {
  return 1 + upgradeByIdEffect('speed');
}

function effectiveMagnetBonus() {
  return upgradeByIdEffect('magnet');
}

function permanentShieldCharges() {
  return saveData.shieldLevel || 0;
}

function upgradePrice(upg, level) {
  return upg.basePrice + level * upg.priceStep;
}

function updatePearlsDisplays() {
  pearlsCountStart.textContent = saveData.pearls;
  pearlsCountShop.textContent = saveData.pearls;
}

function renderShop() {
  updatePearlsDisplays();
  renderSkinsGrid();
  renderSeasGrid();
  renderUpgradesGrid();
}

function rarityClass(price) {
  if (price <= 0) return 'rarity-common';
  if (price < 500) return 'rarity-rare';
  if (price < 1200) return 'rarity-epic';
  return 'rarity-legendary';
}

function renderSkinsGrid() {
  skinsGrid.innerHTML = '';
  for (const skin of SKINS) {
    const owned = saveData.ownedSkins.includes(skin.id);
    const equipped = saveData.equippedSkin === skin.id;
    const card = document.createElement('div');
    card.className = 'shop-item ' + rarityClass(skin.price) + (equipped ? ' equipped' : '');
    const swatch = document.createElement('div');
    swatch.className = 'shop-item-swatch';
    swatch.style.background = skin.swatch;
    const name = document.createElement('div');
    name.className = 'shop-item-name';
    name.textContent = skin.name;
    const desc = document.createElement('div');
    desc.className = 'shop-item-desc';
    desc.textContent = skin.price > 0 ? ('💎 ' + skin.price) : 'مجانية';
    const btn = document.createElement('button');
    if (equipped) {
      btn.className = 'shop-item-btn equipped-label';
      btn.textContent = 'مجهّزة';
      btn.disabled = true;
    } else if (owned) {
      btn.className = 'shop-item-btn equip';
      btn.textContent = 'استخدم';
      btn.onclick = () => {
        GameAudio.playClick();
        saveData.equippedSkin = skin.id;
        persistSave();
        renderSkinsGrid();
      };
    } else {
      const canAfford = saveData.pearls >= skin.price;
      btn.className = 'shop-item-btn buy' + (canAfford ? '' : ' disabled');
      btn.textContent = 'شراء';
      btn.onclick = () => {
        if (saveData.pearls < skin.price) { GameAudio.playDeny(); return; }
        saveData.pearls -= skin.price;
        saveData.ownedSkins.push(skin.id);
        saveData.equippedSkin = skin.id;
        persistSave();
        GameAudio.playPurchase();
        updatePearlsDisplays();
        renderSkinsGrid();
      };
    }
    card.appendChild(swatch);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(btn);
    skinsGrid.appendChild(card);
  }
}

function renderSeasGrid() {
  seasGrid.innerHTML = '';
  for (const sea of SEAS) {
    const owned = saveData.ownedSeas.includes(sea.id);
    const equipped = saveData.equippedSea === sea.id;
    const card = document.createElement('div');
    card.className = 'shop-item ' + rarityClass(sea.price) + (equipped ? ' equipped' : '');
    const swatch = document.createElement('div');
    swatch.className = 'shop-item-swatch';
    swatch.style.background = 'linear-gradient(180deg,' + sea.colors[0] + ',' + sea.colors[2] + ')';
    const name = document.createElement('div');
    name.className = 'shop-item-name';
    name.textContent = sea.name;
    const desc = document.createElement('div');
    desc.className = 'shop-item-desc';
    desc.textContent = sea.price > 0 ? ('💎 ' + sea.price) : 'مجانية';
    const btn = document.createElement('button');
    if (equipped) {
      btn.className = 'shop-item-btn equipped-label';
      btn.textContent = 'مجهّز';
      btn.disabled = true;
    } else if (owned) {
      btn.className = 'shop-item-btn equip';
      btn.textContent = 'استخدم';
      btn.onclick = () => {
        GameAudio.playClick();
        saveData.equippedSea = sea.id;
        persistSave();
        renderSeasGrid();
      };
    } else {
      const canAfford = saveData.pearls >= sea.price;
      btn.className = 'shop-item-btn buy' + (canAfford ? '' : ' disabled');
      btn.textContent = 'شراء';
      btn.onclick = () => {
        if (saveData.pearls < sea.price) { GameAudio.playDeny(); return; }
        saveData.pearls -= sea.price;
        saveData.ownedSeas.push(sea.id);
        saveData.equippedSea = sea.id;
        persistSave();
        GameAudio.playPurchase();
        updatePearlsDisplays();
        renderSeasGrid();
      };
    }
    card.appendChild(swatch);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(btn);
    seasGrid.appendChild(card);
  }
}

function renderUpgradesGrid() {
  upgradesGrid.innerHTML = '';
  for (const upg of UPGRADES) {
    const levelKey = upg.id + 'Level';
    const level = saveData[levelKey] || 0;
    const maxed = level >= upg.maxLevel;
    const price = upgradePrice(upg, level);
    const card = document.createElement('div');
    card.className = 'shop-item';
    const swatch = document.createElement('div');
    swatch.className = 'shop-item-swatch';
    const upgColors = { oxygen: '#4dd8ff', speed: '#ffd76a', magnet: '#c98bff', shield: '#7fe8b0', regen: '#6affc4', luck: '#ff9a3d' };
    swatch.style.background = upgColors[upg.id] || '#a9c9d6';
    const name = document.createElement('div');
    name.className = 'shop-item-name';
    name.textContent = upg.name;
    const desc = document.createElement('div');
    desc.className = 'shop-item-desc';
    const currentEffect = level * upg.effectPerLevel;
    const isPercent = upg.id === 'speed' || upg.id === 'luck';
    const effectText = isPercent ? Math.round(currentEffect * 100) + '%' : (upg.unit === 'درع' ? currentEffect + ' درع' : '+' + Math.round(currentEffect));
    desc.textContent = 'مستوى ' + level + '/' + upg.maxLevel + ' (' + effectText + ')';
    const btn = document.createElement('button');
    if (maxed) {
      btn.className = 'shop-item-btn equipped-label';
      btn.textContent = 'أقصى مستوى';
      btn.disabled = true;
    } else {
      const canAfford = saveData.pearls >= price;
      btn.className = 'shop-item-btn buy' + (canAfford ? '' : ' disabled');
      btn.textContent = 'ترقية 💎' + price;
      btn.onclick = () => {
        if (saveData.pearls < price) { GameAudio.playDeny(); return; }
        saveData.pearls -= price;
        saveData[levelKey] = level + 1;
        persistSave();
        GameAudio.playPurchase();
        updatePearlsDisplays();
        renderUpgradesGrid();
      };
    }
    card.appendChild(swatch);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(btn);
    upgradesGrid.appendChild(card);
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  generateSeaweeds();
}
window.addEventListener('resize', resizeCanvas);

function generateSeaweeds() {
  seaweeds = [];
  const count = Math.floor(canvas.width / 90);
  for (let i = 0; i < count; i++) {
    seaweeds.push({
      x: rand(20, canvas.width - 20),
      h: rand(50, 130),
      sway: Math.random() * Math.PI * 2,
      speed: rand(0.6, 1.2),
      hue: Math.random() < 0.5 ? '#0d6b4f' : '#0a5a42'
    });
  }
  generateFloorRocks();
}

function generateFloorRocks() {
  floorRocks = [];
  const count = Math.floor(canvas.width / 140) + 2;
  for (let i = 0; i < count; i++) {
    floorRocks.push({
      x: rand(10, canvas.width - 10),
      size: rand(14, 34),
      shade: rand(0, 1)
    });
  }
}

function generateDecorations() {
  decorations = [];
}

function spawnDecoration() {
  const kind = Math.random() < 0.5 ? 'poster' : 'bottle';
  const side = Math.random() < 0.5 ? -90 : canvas.width + 90;
  const sy = surfaceLineY();
  if (kind === 'poster') {
    decorations.push({
      type: 'poster',
      x: side,
      y: rand(sy + canvas.height * 0.2, canvas.height - 90),
      w: 68,
      h: 88,
      rot: rand(-0.35, 0.35),
      rotSpeed: rand(-0.4, 0.4),
      vx: (side < 0 ? 1 : -1) * rand(35, 60),
      vy: rand(-8, 8)
    });
  } else {
    decorations.push({
      type: 'bottle',
      x: side,
      y: rand(sy + canvas.height * 0.15, canvas.height - 80),
      w: 32,
      h: 56,
      bob: Math.random() * Math.PI * 2,
      vx: (side < 0 ? 1 : -1) * rand(40, 70),
      vy: rand(-10, 10)
    });
  }
}

function updateDecorations(dt) {
  for (const d of decorations) {
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    if (d.type === 'poster') {
      d.rot += d.rotSpeed * dt;
    } else {
      d.bob += dt * 1.6;
    }
  }
  decorations = decorations.filter(d => d.x > -120 && d.x < canvas.width + 120);
}

function resetGame() {
  const startOxygen = effectiveBaseOxygen();
  player = {
    x: canvas.width / 2,
    y: canvas.height * 0.5,
    size: 64,
    oxygen: startOxygen,
    maxOxygen: startOxygen,
    speedMult: effectiveBaseSpeedMult(),
    score: 0,
    facing: 1,
    bubbleTimer: 0,
    vx: 0,
    vy: 0,
    tilt: 0,
    swimPhase: 0,
    shields: permanentShieldCharges(),
    shieldTimer: 0,
    speedBoostTimer: 0,
    invulnTimer: 0
  };
  obstacles = [];
  treasures = [];
  fish = [];
  turtles = [];
  bubbles = [];
  catchPopups = [];
  powerups = [];
  submarines = [];
  submarineAppearances = 0;
  seaTransition = null;
  activeSeaId = null;
  elapsedTime = 0;
  spawnTimers = { jellyfish: 0, shark: 0, snake: rand(3, 5), coral: 0, treasure: 0, fish: 0, turtle: rand(2, 4), bubble: 0, powerup: rand(8, 14), boss: rand(60, 90), decoration: rand(10, 18), crocodile: rand(20, 30), scorpion: rand(14, 22), hippo: rand(15, 24), submarine: rand(20, 32) };
  scoreDisplay.textContent = '0';
  oxygenBar.style.width = '100%';
  powerBar.style.width = '0%';
  generateDecorations();
}

// ================== التحكم بالكيبورد ==================
window.addEventListener('keydown', (e) => {
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    e.preventDefault();
    keys[e.key] = true;
  }
});
window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

// ================== التحكم باللمس (موبايل) ==================
const touchControls = document.getElementById('touch-controls');
const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (isTouchDevice && touchControls) {
  touchControls.classList.remove('hidden');
}

function bindTouchButton(id, key) {
  const btn = document.getElementById(id);
  if (!btn) return;
  const press = (e) => { e.preventDefault(); keys[key] = true; };
  const release = (e) => { e.preventDefault(); keys[key] = false; };
  btn.addEventListener('touchstart', press, { passive: false });
  btn.addEventListener('touchend', release, { passive: false });
  btn.addEventListener('touchcancel', release, { passive: false });
  btn.addEventListener('mousedown', press);
  btn.addEventListener('mouseup', release);
  btn.addEventListener('mouseleave', release);
}
bindTouchButton('touch-up', 'ArrowUp');
bindTouchButton('touch-down', 'ArrowDown');
bindTouchButton('touch-left', 'ArrowLeft');
bindTouchButton('touch-right', 'ArrowRight');

if (isTouchDevice && fullscreenBtn) {
  fullscreenBtn.classList.remove('hidden');
  fullscreenBtn.addEventListener('click', () => {
    GameAudio.playClick();
    tryEnterFullscreen();
    tryLockLandscape();
  });
}

// ================== تشغيل الموسيقى من أول تفاعل مع الصفحة (شاشة البداية والنهاية كمان) ==================
function startBackgroundMusicOnce() {
  GameAudio.ensureCtx();
  GameAudio.startMusic();
  window.removeEventListener('pointerdown', startBackgroundMusicOnce);
  window.removeEventListener('keydown', startBackgroundMusicOnce);
}
window.addEventListener('pointerdown', startBackgroundMusicOnce);
window.addEventListener('keydown', startBackgroundMusicOnce);

// ================== محاولة قفل الاتجاه أفقي (بيدعمها بعض المتصفحات بالموبايل) ==================
function tryLockLandscape() {
  try {
    if (screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  } catch (e) { /* بعض المتصفحات (خصوصًا آيفون) ما بتدعمها، بنعتمد على تنبيه القلب اليدوي */ }
}

// ================== فتح شاشة كاملة على الموبايل عند بدء اللعب ==================
function tryEnterFullscreen() {
  if (!isTouchDevice) return;
  try {
    const el = document.documentElement;
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (req) {
      const result = req.call(el);
      if (result && result.catch) result.catch(() => {});
    }
  } catch (e) { /* بعض المتصفحات (زي سفاري بالآيفون) ما بتدعمها بره تطبيق مثبت */ }
}

// ================== أزرار الشاشات ==================
startBtn.addEventListener('click', () => {
  GameAudio.ensureCtx();
  GameAudio.playStart();
  GameAudio.startMusic();
  tryEnterFullscreen();
  tryLockLandscape();
  leaveMultiplayerIfActive();
  resizeCanvas();
  resetGame();
  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  state = 'playing';
  lastFrameTime = performance.now();
  requestAnimationFrame(loop);
});

retryBtn.addEventListener('click', () => {
  GameAudio.playStart();
  GameAudio.startMusic();
  resetGame();
  if (mpActive && mpCurrentSeaId) {
    activeSeaId = mpCurrentSeaId;
  }
  endScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  state = 'playing';
  lastFrameTime = performance.now();
  if (mpActive) {
    MP.updateMe({ alive: true, score: 0 });
    opponentHud.classList.remove('hidden');
  }
  requestAnimationFrame(loop);
});

function leaveMultiplayerIfActive() {
  if (!mpActive) return;
  MP.leaveRoom();
  clearInterval(mpTimeoutCheckTimer);
  mpTimeoutCheckTimer = null;
  mpActive = false;
  mpOpponentPresent = false;
  mpOpponentState = null;
  mpChallenge = null;
  opponentHud.classList.add('hidden');
  challengeBanner.classList.add('hidden');
}

function openShop(fromScreen) {
  GameAudio.playClick();
  fromScreen.classList.add('hidden');
  shopScreen.classList.remove('hidden');
  renderShop();
}

shopBtn.addEventListener('click', () => openShop(startScreen));
shopBtnEnd.addEventListener('click', () => openShop(endScreen));

shopBackBtn.addEventListener('click', () => {
  GameAudio.playClick();
  shopScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  updatePearlsDisplays();
});

function updateMuteIcons() {
  const icon = GameAudio.isMuted() ? '🔇' : '🔊';
  muteBtn.textContent = icon;
  muteBtnGame.textContent = icon;
}

muteBtn.addEventListener('click', () => {
  GameAudio.toggleMute();
  updateMuteIcons();
});
muteBtnGame.addEventListener('click', () => {
  GameAudio.toggleMute();
  updateMuteIcons();
});

// ================== واجهة الملتيبلاير ==================
mpBtn.addEventListener('click', () => {
  GameAudio.playClick();
  mpMenuError.classList.add('hidden');
  mpCodeInput.value = '';
  startScreen.classList.add('hidden');
  mpMenuScreen.classList.remove('hidden');
});

mpMenuBackBtn.addEventListener('click', () => {
  GameAudio.playClick();
  mpMenuScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

function showMpError(msg) {
  mpMenuError.textContent = msg;
  mpMenuError.classList.remove('hidden');
}

mpCreateBtn.addEventListener('click', () => {
  GameAudio.playClick();
  mpMenuError.classList.add('hidden');
  MP.createRoom({ score: 0, alive: false, character: null, ready: false }, (code, id) => {
    mpMenuScreen.classList.add('hidden');
    mpWaitingScreen.classList.remove('hidden');
    mpCodeDisplay.textContent = code;
    listenForOpponentPresence();
  }, () => showMpError('صار خطأ، جرب مرة ثانية'));
});

mpJoinBtn.addEventListener('click', () => {
  const code = mpCodeInput.value.trim();
  if (!/^\d{4}$/.test(code)) {
    showMpError('لازم كود من ٤ أرقام');
    return;
  }
  GameAudio.playClick();
  mpMenuError.classList.add('hidden');
  MP.joinRoom(code, { score: 0, alive: false, character: null, ready: false }, () => {
    mpMenuScreen.classList.add('hidden');
    listenForOpponentPresence();
    openCharacterSelect();
  }, (err) => {
    if (err === 'room-not-found') showMpError('ما في غرفة بهالكود');
    else if (err === 'room-full') showMpError('الغرفة مليانة');
    else showMpError('صار خطأ، جرب مرة ثانية');
  });
});

mpWaitingCancelBtn.addEventListener('click', () => {
  GameAudio.playClick();
  MP.leaveRoom();
  mpWaitingScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

function listenForOpponentPresence() {
  MP.onOpponentChange((opponent) => {
    const wasPresent = mpOpponentPresent;
    mpOpponentPresent = !!opponent;
    mpOpponentState = opponent;

    // المضيف: أول ما يوصل الطرف التاني، ننتقل الاثنين لاختيار الشخصية
    if (MP.getIsHost() && !wasPresent && mpOpponentPresent && !mpWaitingScreen.classList.contains('hidden')) {
      mpWaitingScreen.classList.add('hidden');
      openCharacterSelect();
    }

    if (characterSelectScreen && !characterSelectScreen.classList.contains('hidden')) {
      renderCharacterGrid();
      updateCharacterSelectStatus();
    }

    // لو الاتنين جاهزين (اخترنا شخصية وضغطنا جاهز) نبلش الجولة
    if (mpOpponentPresent && opponent.ready && mpMyReady && state !== 'playing') {
      startMultiplayerMatch();
    }

    // لو الخصم فصل بمنتصف اللعب
    if (!mpOpponentPresent && mpActive && state === 'playing') {
      opponentHud.classList.add('hidden');
    }

    // تحدي الصمود: لو الخصم مات وأنا لسا حي، أنا فزت
    if (mpActive && mpChallenge && mpChallenge.type === 'survive' && !mpChallenge.winnerId &&
        opponent && opponent.alive === false && state === 'playing') {
      MP.transactionOnWorldField('challenge', (current) => {
        if (!current || current.winnerId) return;
        current.winnerId = MP.getMyId();
        return current;
      });
    }

    // تنبيه: صاحبك مات بمنتصف تحدي هدف، تقدمه رجع للصفر (بس التحدي نفسه ضل زي ما هو)
    if (mpActive && mpChallenge && !mpChallenge.winnerId && mpChallenge.type !== 'survive' &&
        opponent && opponent.alive === false && mpOpponentWasAlive && state === 'playing') {
      catchPopups.push({ x: canvas.width / 2, y: canvas.height * 0.35, text: '💀 صاحبك مات، تقدمه رجع للصفر!', life: 2.2 });
    }
    if (opponent) mpOpponentWasAlive = opponent.alive !== false;
    tryAdvanceChallenge();

    if (opponentScoreEl && opponent) {
      opponentScoreEl.textContent = opponent.score || 0;
      if (opponent.character && opponentMarker) {
        const oc = MP_CHARACTERS.find(c => c.id === opponent.character);
        if (oc) opponentMarker.style.background = oc.swatch;
      }
    }
  });
}

function openCharacterSelect() {
  mpMyCharacter = null;
  mpMyReady = false;
  characterConfirmBtn.disabled = true;
  characterSelectScreen.classList.remove('hidden');
  renderCharacterGrid();
  updateCharacterSelectStatus();
}

function renderCharacterGrid() {
  characterSelectGrid.innerHTML = '';
  for (const ch of MP_CHARACTERS) {
    const takenByOpponent = mpOpponentState && mpOpponentState.character === ch.id;
    const card = document.createElement('div');
    card.className = 'shop-item' + (takenByOpponent ? ' taken' : '') + (mpMyCharacter === ch.id ? ' selected-mine' : '');
    const swatch = document.createElement('div');
    swatch.className = 'shop-item-swatch';
    swatch.style.background = ch.swatch;
    const name = document.createElement('div');
    name.className = 'shop-item-name';
    name.textContent = ch.name;
    card.appendChild(swatch);
    card.appendChild(name);
    if (!takenByOpponent) {
      card.onclick = () => {
        if (mpMyReady) return;
        GameAudio.playClick();
        mpMyCharacter = ch.id;
        MP.updateMe({ character: ch.id });
        characterConfirmBtn.disabled = false;
        renderCharacterGrid();
      };
    }
    characterSelectGrid.appendChild(card);
  }
}

function updateCharacterSelectStatus() {
  if (mpMyReady) {
    characterSelectStatus.textContent = mpOpponentState && mpOpponentState.ready
      ? 'الاثنين جاهزين، عم نبلش...'
      : 'بانتظار صاحبك يجهز...';
  } else {
    characterSelectStatus.textContent = mpOpponentState
      ? 'اختار شخصيتك ودوس جاهز!'
      : 'بانتظار صاحبك يوصل للعبة...';
  }
}

characterConfirmBtn.addEventListener('click', () => {
  if (!mpMyCharacter) return;
  GameAudio.playClick();
  mpMyReady = true;
  MP.updateMe({ ready: true });
  characterConfirmBtn.disabled = true;
  updateCharacterSelectStatus();
  if (mpOpponentState && mpOpponentState.ready) {
    startMultiplayerMatch();
  }
});

function startMultiplayerMatch() {
  mpActive = true;
  tryEnterFullscreen();
  tryLockLandscape();
  characterSelectScreen.classList.add('hidden');
  mpChallenge = null;
  mpChallengeSeqSeen = -1;
  mpLastBroadcastSeaSeq = -1;
  mpCurrentSeaId = null;
  mpOpponentWasAlive = true;
  mpMyChallengeReady = false;
  mpProgress = { coinsStart: 0, fishCount: 0, turtleCount: 0, rareCaught: false, bigTreasureCaught: false, aliveReported: true, maxDepth: 0 };
  resizeCanvas();
  resetGame();
  startScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  opponentHud.classList.remove('hidden');
  GameAudio.ensureCtx();
  GameAudio.playStart();
  GameAudio.startMusic();
  state = 'playing';
  lastFrameTime = performance.now();

  MP.startBroadcasting(getMyBroadcastState, 130);
  MP.onWorldChange(handleWorldUpdate);

  if (MP.getIsHost()) {
    clearInterval(mpTimeoutCheckTimer);
    mpTimeoutCheckTimer = setInterval(checkChallengeTimeout, 1500);
    setTimeout(() => {
      MP.updateWorld({ challenge: pickRandomChallenge() });
    }, 3000);
  }

  requestAnimationFrame(loop);
}

function getMyBroadcastState() {
  return {
    x: player.x,
    y: player.y,
    facing: player.facing,
    tilt: player.tilt,
    swimPhase: player.swimPhase,
    score: player.score,
    oxygen: player.oxygen,
    maxOxygen: player.maxOxygen,
    alive: state === 'playing',
    character: mpMyCharacter,
    roundCoins: player.score - mpProgress.coinsStart,
    roundFish: mpProgress.fishCount,
    roundDepth: mpProgress.maxDepth,
    roundTurtles: mpProgress.turtleCount
  };
}

function handleWorldUpdate(world) {
  // انتقال بحر مشترك (لو صاحبك ركب الغواصة)
  if (world.seaTransition && world.seaTransition.seq !== mpLastBroadcastSeaSeq) {
    mpLastBroadcastSeaSeq = world.seaTransition.seq;
    if (world.seaTransition.triggeredBy !== MP.getMyId()) {
      applySeaTransitionFromNetwork(world.seaTransition.seaId);
    }
  }
  // تحديث التحدي
  if (world.challenge && world.challenge.seq !== mpChallengeSeqSeen) {
    mpChallengeSeqSeen = world.challenge.seq;
    mpChallenge = world.challenge;
    mpProgress = { coinsStart: player.score, fishCount: 0, turtleCount: 0, rareCaught: false, bigTreasureCaught: false, aliveReported: true, maxDepth: 0 };
    mpMyWon = false;
    mpMyChallengeReady = false;
    showChallengeBanner();
  } else if (world.challenge) {
    mpChallenge = world.challenge;
    if (world.challenge.winnerId && !mpMyWon) {
      onChallengeResolved(world.challenge);
    }
  }
}

function showChallengeBanner() {
  if (!mpChallenge) return;
  // الإعلان الكبير بمنتصف الشاشة أول ما يبلش
  challengeCenter.classList.remove('hidden', 'win', 'lose', 'draw');
  challengeCenterIcon.textContent = '⚔️';
  challengeCenterText.textContent = mpChallenge.labelText;
  challengeNextBtn.classList.add('hidden');

  // البانر الصغير عالجنب بيبين بعد شوي وبيضل طول التحدي
  challengeBanner.classList.add('hidden');
  challengeTitleEl.textContent = '⚔️';
  challengeDescEl.textContent = mpChallenge.labelText;

  setTimeout(() => {
    if (mpChallenge && !mpChallenge.winnerId) {
      challengeCenter.classList.add('hidden');
    }
    challengeBanner.classList.remove('hidden');
  }, 2800);
}

function updateChallengeTimerDisplay() {
  if (!mpActive || !mpChallenge || !challengeTimerEl) return;
  if (mpChallenge.winnerId) return;

  if (mpChallenge.timeBased) {
    const remaining = Math.max(0, Math.round(mpChallenge.duration - (Date.now() - mpChallenge.startedAt) / 1000));
    challengeTimerEl.textContent = '⏱️' + remaining;
    return;
  }

  // تحديات الهدف: نعرض عداد "أنا مقابل صاحبك" بدل الوقت
  const opp = mpOpponentState || {};
  let mine = 0, theirs = 0, icon = '🎯';
  if (mpChallenge.type === 'coins') { mine = Math.max(0, player.score - mpProgress.coinsStart); theirs = opp.roundCoins || 0; icon = '💰'; }
  else if (mpChallenge.type === 'fish_count') { mine = mpProgress.fishCount; theirs = opp.roundFish || 0; icon = '🐟'; }
  else if (mpChallenge.type === 'turtle_rescue') { mine = mpProgress.turtleCount; theirs = opp.roundTurtles || 0; icon = '🐢'; }
  else { challengeTimerEl.textContent = '🔍...'; return; }
  challengeTimerEl.textContent = `🟢${mine}/${mpChallenge.target}  🆚  🟡${theirs}/${mpChallenge.target}`;
}

function onChallengeResolved(challenge) {
  mpMyWon = true;
  mpMyChallengeReady = false;
  const iWon = challenge.winnerId === MP.getMyId();

  challengeBanner.classList.add('hidden');
  challengeCenter.classList.remove('hidden');
  challengeCenter.classList.remove('win', 'lose', 'draw');
  challengeCenter.classList.add(iWon ? 'win' : 'lose');
  challengeCenterIcon.textContent = iWon ? '🏆' : '🥈';
  challengeCenterText.textContent = iWon ? '🏆 فزت بالتحدي! 🎉' : '🥈 صاحبك فاز هالمرة';
  challengeNextBtn.classList.remove('hidden');
  challengeNextBtn.disabled = false;
  challengeNextBtn.querySelector('span').textContent = 'جاهز للتحدي الجاي ✅';

  GameAudio.playPurchase();
  MP.updateMe({ challengeReady: false });
}

// بس لما الاثنين يدوسوا "جاهز"، التحدي الجديد يبلش
function requestNextChallenge() {
  mpMyChallengeReady = true;
  MP.updateMe({ challengeReady: true });
  challengeNextBtn.disabled = true;
  challengeNextBtn.querySelector('span').textContent = 'بانتظار صاحبك... ⏳';
  tryAdvanceChallenge();
}

function tryAdvanceChallenge() {
  if (!mpMyChallengeReady) return;
  if (!mpOpponentState || !mpOpponentState.challengeReady) return;
  MP.transactionOnWorldField('challenge', (current) => {
    if (!current || !current.winnerId) return;
    return pickRandomChallenge(current.seq);
  });
}

challengeNextBtn.addEventListener('click', () => {
  GameAudio.playClick();
  requestNextChallenge();
});

function checkChallengeTimeout() {
  if (!mpChallenge || mpChallenge.winnerId) return;
  const elapsed = (Date.now() - mpChallenge.startedAt) / 1000;
  if (elapsed >= mpChallenge.duration) {
    let myMetric, oppMetric;
    const opp = mpOpponentState || {};
    if (mpChallenge.type === 'coins_race') {
      myMetric = player.score - mpProgress.coinsStart;
      oppMetric = opp.roundCoins || 0;
    } else if (mpChallenge.type === 'fish_race') {
      myMetric = mpProgress.fishCount;
      oppMetric = opp.roundFish || 0;
    } else if (mpChallenge.type === 'depth_race') {
      myMetric = mpProgress.maxDepth;
      oppMetric = opp.roundDepth || 0;
    } else {
      // صمود أو أي تحدي هدف ما تحقق: نقارن السكور الكامل كحكم فاصل
      myMetric = player.score;
      oppMetric = opp.score || 0;
    }
    // دايمًا في فايز حاسم، ما في تعادل - لو تعادل فعلي نحكم بالسكور الكامل، وبعدها المضيف يفوز كحكم أخير
    let winnerId;
    if (myMetric !== oppMetric) {
      winnerId = myMetric > oppMetric ? MP.getMyId() : (mpOpponentState ? mpOpponentState.id : MP.getMyId());
    } else if (player.score !== oppMetric) {
      winnerId = player.score > (opp.score || 0) ? MP.getMyId() : (mpOpponentState ? mpOpponentState.id : MP.getMyId());
    } else {
      winnerId = MP.getIsHost() ? MP.getMyId() : (mpOpponentState ? mpOpponentState.id : MP.getMyId());
    }
    MP.transactionOnWorldField('challenge', (current) => {
      if (!current || current.winnerId) return;
      current.winnerId = winnerId;
      return current;
    });
  }
}

// تتبع التقدّم بالتحدي الحالي، بينادى من نفس أماكن جمع الكنوز/السمك
function trackChallengeProgress(kind, extra) {
  if (!mpActive || !mpChallenge || mpChallenge.winnerId) return;
  const c = mpChallenge;
  let reached = false;
  if (c.type === 'coins' && kind === 'coin') {
    if (player.score - mpProgress.coinsStart >= c.target) reached = true;
  } else if (c.type === 'fish_count' && kind === 'fish') {
    mpProgress.fishCount++;
    if (mpProgress.fishCount >= c.target) reached = true;
  } else if (c.type === 'rare_catch' && kind === 'fish' && extra >= c.target) {
    reached = true;
  } else if (c.type === 'turtle_rescue' && kind === 'turtle') {
    mpProgress.turtleCount++;
    if (mpProgress.turtleCount >= c.target) reached = true;
  } else if (c.type === 'big_treasure' && kind === 'coin' && extra >= c.target) {
    reached = true;
  }
  if (reached) {
    MP.transactionOnWorldField('challenge', (current) => {
      if (!current || current.winnerId) return;
      current.winnerId = MP.getMyId();
      return current;
    });
  }
}

// ================== الإيقاف المؤقت والعودة للشاشة الرئيسية ==================
function pauseGame() {
  if (state !== 'playing') return;
  GameAudio.playClick();
  state = 'paused';
  pauseScreen.classList.remove('hidden');
}

function resumeGame() {
  GameAudio.playClick();
  pauseScreen.classList.add('hidden');
  state = 'playing';
  lastFrameTime = performance.now();
  requestAnimationFrame(loop);
}

function goHome() {
  GameAudio.playClick();
  GameAudio.stopHeartbeat();
  leaveMultiplayerIfActive();
  state = 'start';
  pauseScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
  updatePearlsDisplays();
  updateBestScoreStart();
}

pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);
homeBtnPause.addEventListener('click', goHome);
homeBtnEnd.addEventListener('click', goHome);

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }
});

function endGame() {
  state = 'gameover';
  GameAudio.stopHeartbeat();
  GameAudio.playGameOver();
  gameScreen.classList.add('hidden');
  endScreen.classList.remove('hidden');
  if (mpActive) {
    if (mpChallenge && !mpChallenge.winnerId && mpChallenge.type !== 'survive') {
      // اللي مات بس هو يرجع تقدمه للصفر، نفس التحدي بيضل زي ما هو لصاحبه
      mpProgress.coinsStart = player.score;
      mpProgress.fishCount = 0;
      mpProgress.turtleCount = 0;
      mpProgress.maxDepth = 0;
      MP.updateMe({
        alive: false,
        roundCoins: 0,
        roundFish: 0,
        roundTurtles: 0,
        roundDepth: 0
      });
    } else {
      MP.updateMe({ alive: false });
    }
  }

  const isNewRecord = player.score > (saveData.bestScore || 0);
  if (isNewRecord) saveData.bestScore = player.score;
  endTitle.textContent = isNewRecord ? '🏆 رقم قياسي جديد!' : 'خلصت اللعبة!';
  finalScore.textContent = player.score;
  finalTime.textContent = Math.floor(elapsedTime);
  bestScoreEnd.textContent = saveData.bestScore || player.score;

  const pearlsEarned = Math.max(1, Math.round(player.score * 0.2));
  saveData.pearls += pearlsEarned;
  persistSave();
  finalPearls.textContent = '+' + pearlsEarned;
  updatePearlsDisplays();
  updateBestScoreStart();
}

function updateBestScoreStart() {
  if (saveData.bestScore) {
    bestScoreStart.textContent = saveData.bestScore;
    bestScoreStartWrap.classList.remove('hidden');
  } else {
    bestScoreStartWrap.classList.add('hidden');
  }
}

// ================== أدوات مساعدة ==================
function rand(min, max) { return Math.random() * (max - min) + min; }
function dist(x1, y1, x2, y2) { return Math.hypot(x1 - x2, y1 - y2); }
function surfaceLineY() { return canvas.height * SURFACE_RATIO; }

// الصعوبة بتزيد بشكل تدريجي وبطيء عشان اللعبة تطول وتضل ممتعة لفترة طويلة
function difficultyFactor() {
  return 1 + Math.min(3.2, elapsedTime / 150);
}
function sizeGrowthFactor() {
  return 1 + Math.min(2.0, elapsedTime / 220);
}

// ================== إنشاء الأعداء والكنوز ==================
function spawnJellyfish() {
  const side = Math.random() < 0.5 ? 0 : canvas.width;
  const grow = sizeGrowthFactor();
  obstacles.push({
    type: 'jellyfish',
    x: side,
    y: rand(surfaceLineY() + 60, canvas.height - 60),
    size: rand(32, 48) * grow,
    vx: (side === 0 ? 1 : -1) * rand(30, 60) * difficultyFactor(),
    vy: rand(-20, 20),
    bob: Math.random() * Math.PI * 2,
    hue: Math.random() < 0.5 ? '#d79bff' : '#8fd6ff'
  });
}

function spawnShark() {
  const side = Math.random() < 0.5 ? -100 : canvas.width + 100;
  const grow = sizeGrowthFactor();
  obstacles.push({
    type: 'shark',
    x: side,
    y: rand(surfaceLineY() + 110, canvas.height - 90),
    size: rand(55, 78) * grow,
    vx: (side < 0 ? 1 : -1) * rand(150, 230) * difficultyFactor(),
    vy: 0
  });
}

function spawnHippo() {
  const side = Math.random() < 0.5 ? -120 : canvas.width + 120;
  const grow = sizeGrowthFactor();
  obstacles.push({
    type: 'hippo',
    x: side,
    y: rand(surfaceLineY() + 100, canvas.height - 100),
    size: rand(95, 120) * grow,
    vx: (side < 0 ? 1 : -1) * rand(60, 95) * Math.min(1.7, difficultyFactor()),
    bob: Math.random() * Math.PI * 2
  });
}

function spawnCoral() {
  obstacles.push({
    type: 'coral',
    x: rand(60, canvas.width - 60),
    y: rand(surfaceLineY() + 80, canvas.height - 40),
    size: rand(30, 42) * sizeGrowthFactor(),
    vx: 0,
    vy: 0
  });
}

function spawnSnake() {
  const side = Math.random() < 0.5 ? -80 : canvas.width + 80;
  const grow = sizeGrowthFactor();
  const hues = [
    { body: '#3f9a5f', band: '#1a4a2a' },
    { body: '#c94f3a', band: '#6f1f10' },
    { body: '#d4a83a', band: '#7a5a10' }
  ];
  const hue = hues[Math.floor(Math.random() * hues.length)];
  obstacles.push({
    type: 'snake',
    x: side,
    y: rand(surfaceLineY() + 90, canvas.height - 70),
    size: rand(60, 85) * grow,
    vx: (side < 0 ? 1 : -1) * rand(90, 150) * difficultyFactor(),
    wavePhase: Math.random() * Math.PI * 2,
    body: hue.body,
    band: hue.band
  });
}

// تمساح وعقرب: يعيشوا قريب من سطح الميه بس، عشان اللاعب ما يضل عايم فوق بدون ما ينزل
function spawnCrocodile() {
  const side = Math.random() < 0.5 ? -110 : canvas.width + 110;
  const grow = sizeGrowthFactor();
  const sy = surfaceLineY();
  obstacles.push({
    type: 'crocodile',
    x: side,
    y: rand(sy * 0.25, sy + 18),
    size: rand(75, 95) * grow,
    vx: (side < 0 ? 1 : -1) * rand(110, 160) * difficultyFactor(),
    bob: Math.random() * Math.PI * 2
  });
}

function spawnScorpion() {
  const side = Math.random() < 0.5 ? -50 : canvas.width + 50;
  const grow = sizeGrowthFactor();
  const sy = surfaceLineY();
  obstacles.push({
    type: 'scorpion',
    x: side,
    y: rand(sy * 0.15, sy + 8),
    size: rand(30, 42) * grow,
    vx: (side < 0 ? 1 : -1) * rand(70, 110) * difficultyFactor(),
    legPhase: Math.random() * Math.PI * 2
  });
}

function spawnFish() {
  // كل ما زاد سكور اللاعب، فرصة أعلى تظهر أسماك أكبر وأثمن
  const unlocked = FISH_TYPES.filter(f => player.score >= f.required * 0.4);
  const pool = unlocked.length ? unlocked : [FISH_TYPES[0]];
  const type = pool[Math.floor(Math.random() * pool.length)];
  const side = Math.random() < 0.5 ? -60 : canvas.width + 60;
  const grow = sizeGrowthFactor();
  fish.push({
    typeIndex: FISH_TYPES.indexOf(type),
    x: side,
    y: rand(surfaceLineY() + 70, canvas.height - 70),
    size: type.baseSize * grow,
    vx: (side < 0 ? 1 : -1) * rand(50, 100),
    bob: Math.random() * Math.PI * 2,
    caught: false
  });
}

function spawnTurtle() {
  const type = TURTLE_TYPES[Math.floor(Math.random() * TURTLE_TYPES.length)];
  const side = Math.random() < 0.5 ? -70 : canvas.width + 70;
  turtles.push({
    typeIndex: TURTLE_TYPES.indexOf(type),
    x: side,
    y: rand(surfaceLineY() + 80, canvas.height - 80),
    size: type.baseSize,
    vx: (side < 0 ? 1 : -1) * rand(28, 45),
    paddle: Math.random() * Math.PI * 2,
    caught: false
  });
}

function spawnTreasure() {
  const sy = surfaceLineY();
  const y = rand(sy + 50, canvas.height - 50);
  const depthRatio = (y - sy) / (canvas.height - sy);
  const value = Math.round((18 + Math.round(depthRatio * 32)) * (1 + effectiveLuckBonus()));
  treasures.push({
    x: rand(50, canvas.width - 50),
    y,
    size: 26 + depthRatio * 8,
    value,
    collected: false,
    spin: 0,
    glow: Math.random() * Math.PI * 2,
    life: rand(9, 13),
    fading: false
  });
}

function spawnBubble(x, y, small) {
  bubbles.push({
    x, y,
    size: small ? rand(2, 5) : rand(4, 9),
    vy: rand(40, 90),
    drift: rand(-15, 15),
    life: 1
  });
}

function spawnPowerup() {
  const kind = Math.random() < 0.5 ? 'shield' : 'boost';
  powerups.push({
    kind,
    x: rand(60, canvas.width - 60),
    y: rand(surfaceLineY() + 70, canvas.height - 70),
    size: 30,
    bob: Math.random() * Math.PI * 2,
    collected: false
  });
}

function spawnBoss() {
  const side = Math.random() < 0.5 ? -140 : canvas.width + 140;
  const grow = sizeGrowthFactor();
  obstacles.push({
    type: 'shark',
    boss: true,
    x: side,
    y: rand(surfaceLineY() + 130, canvas.height - 110),
    size: rand(105, 130) * grow,
    vx: (side < 0 ? 1 : -1) * rand(170, 210) * Math.min(1.6, difficultyFactor()),
    vy: 0
  });
}

// غواصة نادرة: صديقة (مش خطر)، لمسها بتنقّل اللاعب لبحر تاني بلقطة حلوة
function spawnSubmarine() {
  const side = Math.random() < 0.5 ? -130 : canvas.width + 130;
  submarines.push({
    x: side,
    y: rand(surfaceLineY() + 120, canvas.height - 120),
    size: 90,
    vx: (side < 0 ? 1 : -1) * rand(45, 65),
    propeller: 0,
    used: false
  });
}

// ================== تحديث اللاعب ==================
function updatePlayer(dt) {
  let dx = 0, dy = 0;
  if (keys['ArrowUp']) dy -= 1;
  if (keys['ArrowDown']) dy += 1;
  if (keys['ArrowLeft']) dx -= 1;
  if (keys['ArrowRight']) dx += 1;

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
    if (dx !== 0) player.facing = dx > 0 ? 1 : -1;
  }

  const speed = BASE_SPEED * player.speedMult;
  player.x += dx * speed * dt;
  player.y += dy * speed * dt;
  player.vx = dx;
  player.vy = dy;

  if (mpActive) {
    const depthRatio = Math.max(0, Math.min(1, (player.y - surfaceLineY()) / (canvas.height - surfaceLineY())));
    if (depthRatio > mpProgress.maxDepth) mpProgress.maxDepth = depthRatio;
  }

  // ميلان الجسم مع اتجاه الحركة (يعطي إحساس واقعي بالسباحة)
  const desiredTilt = dy * (Math.PI / 7);
  player.tilt += (desiredTilt - player.tilt) * Math.min(1, dt * 6);

  // دورة سباحة: نبض بسيط بالحجم لما اللاعب يتحرك، يعطي إحساس بضربات السباحة
  const isMoving = dx !== 0 || dy !== 0;
  if (isMoving) {
    player.swimPhase += dt * 9;
  } else {
    player.swimPhase += dt * 2.2;
  }

  const half = player.size / 2;
  player.x = Math.max(half, Math.min(canvas.width - half, player.x));
  player.y = Math.max(half, Math.min(canvas.height - half, player.y));

  const inSurface = player.y - half < surfaceLineY();
  if (inSurface) {
    player.oxygen = Math.min(player.maxOxygen, player.oxygen + effectiveOxygenRefillRate() * dt);
  } else {
    player.oxygen -= OXYGEN_DRAIN_RATE * dt;
    if (player.oxygen <= 0) {
      player.oxygen = 0;
      endGame();
    }
  }

  player.bubbleTimer -= dt;
  if (player.bubbleTimer <= 0 && !inSurface) {
    spawnBubble(player.x + rand(-10, 10), player.y - half, true);
    player.bubbleTimer = rand(0.25, 0.5);
  }

  const powerProgress = Math.min(1, elapsedTime / POWER_GROWTH_TIME);
  const boostMult = player.speedBoostTimer > 0 ? 1.55 : 1;
  player.speedMult = effectiveBaseSpeedMult() * (1 + powerProgress * (MAX_SPEED_MULT - 1)) * boostMult;
  player.maxOxygen = effectiveBaseOxygen() + powerProgress * (MAX_OXYGEN_CAP - BASE_MAX_OXYGEN);

  if (player.shieldTimer > 0) player.shieldTimer -= dt;
  if (player.speedBoostTimer > 0) player.speedBoostTimer -= dt;
  if (player.invulnTimer > 0) player.invulnTimer -= dt;

  oxygenBar.style.width = (player.oxygen / player.maxOxygen * 100) + '%';
  powerBar.style.width = (powerProgress * 100) + '%';

  // نبضة قلب وتحذير بصري لما الأوكسجين يقرب يخلص
  const oxygenRatio = player.oxygen / player.maxOxygen;
  player.oxygenRatio = oxygenRatio;
  player.lowOxygenWarning = !inSurface && oxygenRatio < 0.35;
  if (!inSurface && oxygenRatio < 0.28) {
    GameAudio.startHeartbeat();
  } else {
    GameAudio.stopHeartbeat();
  }
}

function updateBubbles(dt) {
  for (const b of bubbles) {
    b.y -= b.vy * dt;
    b.x += Math.sin(b.y / 20) * b.drift * dt;
    b.life -= dt * 0.4;
  }
  bubbles = bubbles.filter(b => b.life > 0 && b.y > 0);
}

function updateFish(dt) {
  const magnet = effectiveMagnetBonus();
  for (const f of fish) {
    f.bob += dt * 2.2;
    f.x += f.vx * dt;
    f.y += Math.sin(f.bob) * 12 * dt;
    if (!f.caught) {
      const type = FISH_TYPES[f.typeIndex];
      const canCatch = player.score >= type.required;
      if (canCatch && dist(player.x, player.y, f.x, f.y) < player.size / 2.4 + f.size / 2 + magnet) {
        f.caught = true;
        player.score += type.reward;
        scoreDisplay.textContent = player.score;
        GameAudio.playFishCatch();
        catchPopups.push({ x: f.x, y: f.y, text: '+' + type.reward, life: 1 });
        for (let i = 0; i < 5; i++) spawnBubble(f.x, f.y, true);
        trackChallengeProgress('fish', type.required);
      }
    }
  }
  fish = fish.filter(f => !f.caught && f.x > -140 && f.x < canvas.width + 140);
}

function updateCatchPopups(dt) {
  for (const p of catchPopups) {
    p.y -= 30 * dt;
    p.life -= dt * 0.8;
  }
  catchPopups = catchPopups.filter(p => p.life > 0);
}

function updateTurtles(dt) {
  const magnet = effectiveMagnetBonus();
  for (const t of turtles) {
    t.paddle += dt * 1.4;
    t.x += t.vx * dt;
    t.y += Math.sin(t.paddle * 0.5) * 8 * dt;
    if (!t.caught && dist(player.x, player.y, t.x, t.y) < player.size / 2.4 + t.size / 2 + magnet) {
      const type = TURTLE_TYPES[t.typeIndex];
      t.caught = true;
      player.score += type.reward;
      scoreDisplay.textContent = player.score;
      GameAudio.playFishCatch();
      catchPopups.push({ x: t.x, y: t.y, text: '+' + type.reward, life: 1 });
      for (let i = 0; i < 5; i++) spawnBubble(t.x, t.y, true);
      trackChallengeProgress('turtle');
    }
  }
  turtles = turtles.filter(t => !t.caught && t.x > -160 && t.x < canvas.width + 160);
}

function updateObstacles(dt) {
  for (const o of obstacles) {
    if (o.type === 'jellyfish') {
      o.bob += dt * 2;
      o.x += o.vx * dt;
      o.y += Math.sin(o.bob) * 15 * dt;
    } else if (o.type === 'shark') {
      o.x += o.vx * dt;
    } else if (o.type === 'snake') {
      o.wavePhase += dt * 4;
      o.x += o.vx * dt;
      o.y += Math.sin(o.wavePhase) * 25 * dt;
    } else if (o.type === 'crocodile') {
      o.bob += dt * 1.6;
      o.x += o.vx * dt;
      o.y += Math.sin(o.bob) * 6 * dt;
    } else if (o.type === 'scorpion') {
      o.legPhase += dt * 6;
      o.x += o.vx * dt;
      o.y += Math.sin(o.legPhase * 0.4) * 3 * dt;
    } else if (o.type === 'hippo') {
      o.bob += dt * 1.2;
      o.x += o.vx * dt;
      o.y += Math.sin(o.bob) * 10 * dt;
    }
  }
  obstacles = obstacles.filter(o => o.x > -160 && o.x < canvas.width + 160);
}

function updateTreasures(dt) {
  const magnet = effectiveMagnetBonus();
  for (const t of treasures) {
    t.spin += dt * 2;
    t.glow += dt * 3;
    t.life -= dt;
    t.fading = t.life < 2.5;
    if (!t.collected && dist(player.x, player.y, t.x, t.y) < player.size / 2.4 + t.size / 2 + magnet) {
      t.collected = true;
      player.score += t.value;
      scoreDisplay.textContent = player.score;
      GameAudio.playCoin();
      catchPopups.push({ x: t.x, y: t.y, text: '+' + t.value, life: 1 });
      for (let i = 0; i < 6; i++) spawnBubble(t.x, t.y, true);
      trackChallengeProgress('coin', t.value);
    }
  }
  treasures = treasures.filter(t => !t.collected && t.life > 0);
}

function updatePowerups(dt) {
  for (const p of powerups) {
    p.bob += dt * 2;
  }
  for (const p of powerups) {
    if (!p.collected && dist(player.x, player.y, p.x, p.y) < player.size / 2.2 + p.size / 2) {
      p.collected = true;
      GameAudio.playPurchase();
      if (p.kind === 'shield') {
        player.shieldTimer = 6;
        catchPopups.push({ x: p.x, y: p.y, text: 'درع مؤقت!', life: 1 });
      } else {
        player.speedBoostTimer = 6;
        catchPopups.push({ x: p.x, y: p.y, text: 'اندفاع سرعة!', life: 1 });
      }
    }
  }
  powerups = powerups.filter(p => !p.collected);
}

function triggerSeaTransition(x, y) {
  const candidates = SEAS.filter(s => s.id !== activeSeaTheme().id);
  const newSea = candidates[Math.floor(Math.random() * candidates.length)] || SEAS[0];
  activeSeaId = newSea.id;
  mpCurrentSeaId = newSea.id;
  GameAudio.playTeleport();
  seaTransition = { timer: 0, duration: 1.2, x, y, color: newSea.colors[1] };
  catchPopups.push({ x: canvas.width / 2, y: canvas.height * 0.4, text: '🌊 غطسنا لبحر: ' + newSea.name, life: 2.4 });

  if (mpActive) {
    mpLastBroadcastSeaSeq = (mpLastBroadcastSeaSeq || 0) + 1;
    MP.updateWorld({ seaTransition: { seaId: newSea.id, seq: mpLastBroadcastSeaSeq, triggeredBy: MP.getMyId() } });
    catchPopups.push({ x: canvas.width / 2, y: canvas.height * 0.48, text: '🚢 سحبت صاحبك معك!', life: 2.2 });
  }
}

// لما صاحبك يركب الغواصة، عندي نفس الانتقال بس بدون ما أرسل إشعار تاني (تفادي حلقة لا نهائية)
function applySeaTransitionFromNetwork(seaId) {
  const newSea = SEAS.find(s => s.id === seaId);
  if (!newSea) return;
  activeSeaId = newSea.id;
  mpCurrentSeaId = newSea.id;
  GameAudio.playTeleport();
  seaTransition = { timer: 0, duration: 1.2, x: canvas.width / 2, y: canvas.height / 2, color: newSea.colors[1] };
  catchPopups.push({ x: canvas.width / 2, y: canvas.height * 0.4, text: '🌊 صاحبك ودّاك لبحر: ' + newSea.name, life: 2.4 });
}

function updateSubmarines(dt) {
  for (const s of submarines) {
    s.propeller += dt * 8;
    s.x += s.vx * dt;
    if (!s.used && dist(player.x, player.y, s.x, s.y) < player.size / 2 + s.size / 2.2) {
      s.used = true;
      triggerSeaTransition(s.x, s.y);
    }
  }
  submarines = submarines.filter(s => !s.used && s.x > -160 && s.x < canvas.width + 160);
}

function updateSeaTransition(dt) {
  if (!seaTransition) return;
  seaTransition.timer += dt;
  if (seaTransition.timer >= seaTransition.duration) seaTransition = null;
}

function handleHazardHit(hazard, removeFromList) {
  if (player.shieldTimer > 0 || player.shields > 0) {
    if (player.shieldTimer > 0) {
      player.shieldTimer = 0;
    } else {
      player.shields -= 1;
    }
    player.invulnTimer = 1.2;
    GameAudio.playClick();
    catchPopups.push({ x: player.x, y: player.y - player.size / 2, text: 'امتص الدرع الضربة!', life: 1.2 });
    removeFromList();
    return true;
  }
  GameAudio.playHit();
  endGame();
  return true;
}

function checkCollisions() {
  if (player.invulnTimer > 0) return;
  const half = player.size / 2.6;
  for (const o of obstacles) {
    if (dist(player.x, player.y, o.x, o.y) < half + o.size / 2.3) {
      handleHazardHit(o, () => { obstacles = obstacles.filter(ob => ob !== o); });
      return;
    }
  }
  for (const f of fish) {
    if (f.caught) continue;
    const type = FISH_TYPES[f.typeIndex];
    const canCatch = player.score >= type.required;
    if (!canCatch && dist(player.x, player.y, f.x, f.y) < half + f.size / 2.3) {
      handleHazardHit(f, () => { fish = fish.filter(ff => ff !== f); });
      return;
    }
  }
}

// ================== الرسم ==================
function drawBackground(time) {
  const seaColors = activeSeaTheme().colors;
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
  g.addColorStop(0, seaColors[0]);
  g.addColorStop(SURFACE_RATIO, seaColors[1]);
  g.addColorStop(0.6, seaColors[2]);
  g.addColorStop(1, seaColors[3]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // أشعة ضوء
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const rx = (canvas.width / 5) * i + Math.sin(time / 3 + i) * 20;
    ctx.beginPath();
    ctx.moveTo(rx, 0);
    ctx.lineTo(rx + 60, 0);
    ctx.lineTo(rx - 40, canvas.height * 0.7);
    ctx.lineTo(rx - 100, canvas.height * 0.7);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  drawAmbientLife(time);

  // خط سطح الميه
  const sy = surfaceLineY();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, sy);
  for (let x = 0; x <= canvas.width; x += 20) {
    ctx.lineTo(x, sy + Math.sin(x / 40 + time) * 5);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = 'bold 13px Tahoma';
  ctx.textAlign = 'center';
  ctx.fillText('منطقة التنفس', canvas.width / 2, sy - 10);

  // رمل وأعشاب بحرية بالأسفل
  ctx.fillStyle = '#c9b177';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height);
  ctx.lineTo(0, canvas.height - 18);
  for (let x = 0; x <= canvas.width; x += 40) {
    ctx.lineTo(x, canvas.height - 18 + Math.sin(x / 50) * 6);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.closePath();
  ctx.fill();

  // صخور صغيرة على الرمل
  for (const r of floorRocks) {
    ctx.save();
    ctx.translate(r.x, canvas.height - 14);
    const shade = 40 + Math.round(r.shade * 40);
    ctx.fillStyle = `rgb(${shade + 40}, ${shade + 25}, ${shade})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, r.size, r.size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (const s of seaweeds) {
    ctx.strokeStyle = s.hue;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.x, canvas.height - 14);
    const sway = Math.sin(time * s.speed + s.sway) * 18;
    ctx.quadraticCurveTo(s.x + sway, canvas.height - s.h / 2, s.x + sway * 1.4, canvas.height - s.h);
    ctx.stroke();
  }
}

// أسماك خلفية زخرفية بس، بعيدة وخافتة، تعطي إحساس إنه البحر عامر بالحياة
function drawAmbientLife(time) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.fillStyle = '#04202f';
  const rows = [0.32, 0.48, 0.62];
  for (let r = 0; r < rows.length; r++) {
    const rowY = canvas.height * rows[r];
    const dir = r % 2 === 0 ? 1 : -1;
    const speed = 18 + r * 6;
    for (let i = 0; i < 3; i++) {
      const spacing = canvas.width / 2.4;
      let x = ((time * speed * dir + i * spacing) % (canvas.width + 160)) - 80;
      if (dir < 0) x = canvas.width - x;
      const fy = rowY + Math.sin(time * 1.5 + i + r) * 10;
      const fs = 14 + r * 3;
      ctx.save();
      ctx.translate(x, fy);
      ctx.scale(dir, 1);
      ctx.beginPath();
      ctx.moveTo(-fs, 0);
      ctx.quadraticCurveTo(0, -fs / 2, fs, 0);
      ctx.quadraticCurveTo(0, fs / 2, -fs, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-fs, 0);
      ctx.lineTo(-fs - fs / 2, -fs / 3);
      ctx.lineTo(-fs - fs / 2, fs / 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawBubbles() {
  for (const b of bubbles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, b.life);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawJellyfish(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.fillStyle = o.hue;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(0, 0, o.size / 2, Math.PI, 0);
  ctx.fill();
  ctx.globalAlpha = 0.7;
  ctx.strokeStyle = o.hue;
  ctx.lineWidth = 2.2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * (o.size / 6), 0);
    ctx.quadraticCurveTo(i * (o.size / 6) + Math.sin(o.bob + i) * 6, o.size / 2, i * (o.size / 6), o.size * 1.1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShark(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  const dir = o.vx > 0 ? 1 : -1;
  ctx.scale(dir, 1);
  const bodyGrad = ctx.createLinearGradient(0, -o.size / 2, 0, o.size / 2);
  if (o.boss) {
    bodyGrad.addColorStop(0, '#5a4050');
    bodyGrad.addColorStop(1, '#241018');
  } else {
    bodyGrad.addColorStop(0, '#8393a3');
    bodyGrad.addColorStop(1, '#4c5b6b');
  }
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-o.size / 2, 0);
  ctx.quadraticCurveTo(0, -o.size / 2.4, o.size / 2, 0);
  ctx.quadraticCurveTo(0, o.size / 3, -o.size / 2, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-o.size / 2 + 6, -3);
  ctx.lineTo(-o.size / 2 - 16, -o.size / 2.8);
  ctx.lineTo(-o.size / 2 + 12, 5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -o.size / 2.4);
  ctx.lineTo(6, -o.size / 1.5);
  ctx.lineTo(14, -o.size / 2.6);
  ctx.fill();
  if (o.boss) {
    ctx.save();
    ctx.shadowColor = '#ff2a2a';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ff2a2a';
    ctx.beginPath();
    ctx.arc(o.size / 3, -4, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(o.size / 3, -4, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCoral(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  const g = ctx.createLinearGradient(0, -o.size / 2, 0, o.size / 2);
  g.addColorStop(0, '#f07056');
  g.addColorStop(1, '#c23a2c');
  ctx.fillStyle = g;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * (o.size / 3), o.size / 2);
    ctx.lineTo(i * (o.size / 3) - o.size / 8, -o.size / 2);
    ctx.lineTo(i * (o.size / 3) + o.size / 8, -o.size / 2);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawSnake(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  const dir = o.vx > 0 ? 1 : -1;
  ctx.scale(dir, 1);
  const segments = 6;
  const segLen = o.size / segments;
  ctx.strokeStyle = o.body;
  ctx.lineWidth = o.size / 6.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-o.size / 2, 0);
  for (let i = 1; i <= segments; i++) {
    const px = -o.size / 2 + i * segLen;
    const py = Math.sin(o.wavePhase + i * 0.9) * (o.size / 6);
    ctx.lineTo(px, py);
  }
  ctx.stroke();
  // خطوط/عصابات على جسم الحية
  ctx.strokeStyle = o.band;
  ctx.lineWidth = o.size / 16;
  for (let i = 1; i < segments; i += 2) {
    const px = -o.size / 2 + i * segLen;
    const py = Math.sin(o.wavePhase + i * 0.9) * (o.size / 6);
    ctx.beginPath();
    ctx.moveTo(px, py - o.size / 8);
    ctx.lineTo(px, py + o.size / 8);
    ctx.stroke();
  }
  // راس الحية بعيون خطر
  const headX = o.size / 2;
  const headY = Math.sin(o.wavePhase + segments * 0.9) * (o.size / 6);
  ctx.fillStyle = o.body;
  ctx.beginPath();
  ctx.ellipse(headX, headY, o.size / 7, o.size / 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffe23a';
  ctx.beginPath();
  ctx.arc(headX + o.size / 24, headY - o.size / 24, o.size / 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCrocodile(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  const dir = o.vx > 0 ? 1 : -1;
  ctx.scale(dir, 1);
  const bob = Math.sin(o.bob) * 2;

  // الذيل
  ctx.fillStyle = '#3f6a3a';
  ctx.beginPath();
  ctx.moveTo(-o.size / 2, bob);
  ctx.lineTo(-o.size / 1.15, -o.size / 8 + bob);
  ctx.lineTo(-o.size / 1.15, o.size / 8 + bob);
  ctx.closePath();
  ctx.fill();

  // الجسم
  const bodyGrad = ctx.createLinearGradient(0, -o.size / 5, 0, o.size / 5);
  bodyGrad.addColorStop(0, '#5a8f4f');
  bodyGrad.addColorStop(1, '#2f4a28');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, bob, o.size / 2.1, o.size / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // نتوءات الظهر
  ctx.fillStyle = '#254020';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.arc(i * (o.size / 8), -o.size / 7 + bob, o.size / 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // الفك والراس
  ctx.fillStyle = '#4f7a45';
  ctx.beginPath();
  ctx.moveTo(o.size / 2.4, bob - o.size / 10);
  ctx.lineTo(o.size / 1.05, bob - o.size / 26);
  ctx.lineTo(o.size / 1.05, bob + o.size / 26);
  ctx.lineTo(o.size / 2.4, bob + o.size / 10);
  ctx.closePath();
  ctx.fill();
  // أسنان
  ctx.fillStyle = '#f5f0e0';
  for (let i = 0; i < 3; i++) {
    const tx = o.size / 2.5 + i * (o.size / 10);
    ctx.beginPath();
    ctx.moveTo(tx, bob - o.size / 26);
    ctx.lineTo(tx + o.size / 40, bob);
    ctx.lineTo(tx, bob + o.size / 26);
    ctx.closePath();
    ctx.fill();
  }
  // العين
  ctx.fillStyle = '#ffe23a';
  ctx.beginPath();
  ctx.arc(o.size / 3.2, bob - o.size / 6.5, o.size / 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(o.size / 3.1, bob - o.size / 6.5, o.size / 55, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawScorpion(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  const dir = o.vx > 0 ? 1 : -1;
  ctx.scale(dir, 1);

  // الأرجل (بتتحرك)
  ctx.strokeStyle = '#3a1418';
  ctx.lineWidth = Math.max(1.5, o.size / 18);
  for (let i = -2; i <= 2; i++) {
    const legWiggle = Math.sin(o.legPhase + i) * (o.size / 10);
    ctx.beginPath();
    ctx.moveTo(i * (o.size / 8), 0);
    ctx.lineTo(i * (o.size / 8) + legWiggle * 0.3, o.size / 4 + Math.abs(legWiggle) * 0.3);
    ctx.stroke();
  }

  // الجسم
  const bodyGrad = ctx.createLinearGradient(0, -o.size / 4, 0, o.size / 4);
  bodyGrad.addColorStop(0, '#8a2530');
  bodyGrad.addColorStop(1, '#3a1015');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, o.size / 2.2, o.size / 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // المخالب
  ctx.fillStyle = '#5a161c';
  ctx.beginPath();
  ctx.ellipse(-o.size / 1.9, -o.size / 6, o.size / 6, o.size / 10, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-o.size / 1.9, o.size / 6, o.size / 6, o.size / 10, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // الذيل المعقوف مع الإبرة
  const tailCurl = Math.sin(o.legPhase * 0.5) * 0.2;
  ctx.strokeStyle = '#5a161c';
  ctx.lineWidth = o.size / 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(o.size / 3, 0);
  ctx.quadraticCurveTo(o.size / 1.3, -o.size / 3, o.size / 1.6, -o.size / 1.4 - tailCurl * 10);
  ctx.stroke();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(o.size / 1.6, -o.size / 1.4 - tailCurl * 10, o.size / 16, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHippo(o) {
  ctx.save();
  ctx.translate(o.x, o.y);
  const dir = o.vx > 0 ? 1 : -1;
  ctx.scale(dir, 1);
  const bob = Math.sin(o.bob) * 3;

  // الجسم الكبير
  const bodyGrad = ctx.createLinearGradient(0, -o.size / 2.4, 0, o.size / 2.4);
  bodyGrad.addColorStop(0, '#a892a0');
  bodyGrad.addColorStop(1, '#6a5468');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, bob, o.size / 2, o.size / 2.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // الأرجل القصيرة تحت
  ctx.fillStyle = '#5a4658';
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath();
    ctx.ellipse(i * (o.size / 4), o.size / 3 + bob, o.size / 10, o.size / 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // الراس والفك الكبير المفتوح
  ctx.fillStyle = '#9a8496';
  ctx.beginPath();
  ctx.ellipse(o.size / 2.1, bob - o.size / 12, o.size / 3.6, o.size / 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // الفك المفتوح (خطر)
  ctx.fillStyle = '#7a3838';
  ctx.beginPath();
  ctx.moveTo(o.size / 2.6, bob + o.size / 14);
  ctx.quadraticCurveTo(o.size / 1.15, bob + o.size / 6, o.size / 1.05, bob + o.size / 3.2);
  ctx.quadraticCurveTo(o.size / 1.3, bob + o.size / 6, o.size / 2.9, bob + o.size / 8);
  ctx.closePath();
  ctx.fill();
  // أسنان
  ctx.fillStyle = '#f5f0e0';
  for (let i = 0; i < 3; i++) {
    const tx = o.size / 2.7 + i * (o.size / 11);
    ctx.beginPath();
    ctx.moveTo(tx, bob + o.size / 9);
    ctx.lineTo(tx + o.size / 50, bob + o.size / 5.5);
    ctx.lineTo(tx + o.size / 25, bob + o.size / 9);
    ctx.closePath();
    ctx.fill();
  }

  // الأذنين
  ctx.fillStyle = '#6a5468';
  ctx.beginPath();
  ctx.arc(o.size / 2.6, bob - o.size / 3.4, o.size / 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(o.size / 1.7, bob - o.size / 3.6, o.size / 18, 0, Math.PI * 2);
  ctx.fill();

  // فتحتي الأنف والعين الصغيرة الغاضبة
  ctx.fillStyle = '#3a2838';
  ctx.beginPath();
  ctx.arc(o.size / 1.6, bob - o.size / 8, o.size / 40, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff2a2a';
  ctx.beginPath();
  ctx.arc(o.size / 2.3, bob - o.size / 4.2, o.size / 32, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawTreasure(t) {
  ctx.save();
  ctx.translate(t.x, t.y);
  const flicker = t.fading ? (0.4 + Math.abs(Math.sin(t.life * 10)) * 0.6) : 1;
  ctx.globalAlpha = flicker;
  const glowAlpha = 0.25 + Math.sin(t.glow) * 0.15;
  ctx.beginPath();
  ctx.fillStyle = `rgba(255, 215, 106, ${glowAlpha})`;
  ctx.arc(0, 0, t.size * 1.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(Math.sin(t.spin) * 0.2);
  ctx.fillStyle = '#ffd76a';
  ctx.fillRect(-t.size / 2, -t.size / 2, t.size, t.size);
  ctx.strokeStyle = '#a9720f';
  ctx.lineWidth = 2;
  ctx.strokeRect(-t.size / 2, -t.size / 2, t.size, t.size);
  ctx.fillStyle = '#a9720f';
  ctx.beginPath();
  ctx.arc(0, 0, t.size / 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFish(f) {
  const type = FISH_TYPES[f.typeIndex];
  const canCatch = player.score >= type.required;
  ctx.save();
  ctx.translate(f.x, f.y);
  const dir = f.vx > 0 ? 1 : -1;
  ctx.scale(dir, 1);
  ctx.globalAlpha = canCatch ? 1 : 0.55;

  ctx.fillStyle = type.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, f.size / 2, f.size / 3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (type.pattern === 'striped') {
    ctx.strokeStyle = type.dark;
    ctx.globalAlpha = (canCatch ? 1 : 0.55) * 0.6;
    ctx.lineWidth = Math.max(1.5, f.size / 14);
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * (f.size / 5), -f.size / 3.2);
      ctx.lineTo(i * (f.size / 5), f.size / 3.2);
      ctx.stroke();
    }
    ctx.globalAlpha = canCatch ? 1 : 0.55;
  } else if (type.pattern === 'spotted') {
    ctx.fillStyle = type.dark;
    ctx.globalAlpha = (canCatch ? 1 : 0.55) * 0.7;
    const spotOffsets = [-0.2, 0.35, -0.05];
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-f.size / 5 + i * (f.size / 5), spotOffsets[i] * f.size, f.size / 14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = canCatch ? 1 : 0.55;
  }

  ctx.fillStyle = type.dark;
  ctx.beginPath();
  ctx.moveTo(-f.size / 2, 0);
  ctx.lineTo(-f.size / 2 - f.size / 3, -f.size / 5);
  ctx.lineTo(-f.size / 2 - f.size / 3, f.size / 5);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(0, -f.size / 3.2);
  ctx.lineTo(f.size / 8, -f.size / 1.6);
  ctx.lineTo(f.size / 3, -f.size / 3.4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(f.size / 4, -2, f.size / 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(f.size / 4 + 1, -2, f.size / 26, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // رقم الكوينز المطلوب فوق السمكة (أو تحذير خطر لو ما وصلت الكوينز الكافية)
  ctx.save();
  ctx.translate(f.x, f.y - f.size / 2 - 10);
  ctx.fillStyle = canCatch ? 'rgba(160, 255, 190, 0.95)' : 'rgba(255, 90, 90, 0.95)';
  ctx.font = 'bold 12px Tahoma';
  ctx.textAlign = 'center';
  ctx.fillText(type.required > 0 ? (canCatch ? (type.required + '💰') : ('⚠️ ' + type.required + '💰')) : 'مجاني', 0, 0);
  ctx.restore();
}

function drawTurtle(t) {
  const type = TURTLE_TYPES[t.typeIndex];
  ctx.save();
  ctx.translate(t.x, t.y);
  const dir = t.vx > 0 ? 1 : -1;
  ctx.scale(dir, 1);
  const flap = Math.sin(t.paddle) * 0.5;

  // الزعانف الخلفية
  ctx.fillStyle = type.skin;
  ctx.beginPath();
  ctx.ellipse(-t.size / 3, t.size / 3 + flap * 6, t.size / 6, t.size / 10, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-t.size / 3, -t.size / 3 - flap * 6, t.size / 6, t.size / 10, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // الزعانف الأمامية (بتضرب فوق وتحت زي السباحة)
  ctx.beginPath();
  ctx.ellipse(t.size / 4, t.size / 2.6 + flap * 10, t.size / 5, t.size / 11, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(t.size / 4, -t.size / 2.6 - flap * 10, t.size / 5, t.size / 11, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // الصدفة
  const shellGrad = ctx.createRadialGradient(0, 0, t.size / 8, 0, 0, t.size / 2);
  shellGrad.addColorStop(0, type.shell);
  shellGrad.addColorStop(1, type.shellDark);
  ctx.fillStyle = shellGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, t.size / 2, t.size / 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = type.shellDark;
  ctx.lineWidth = 1.5;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * (t.size / 4), -t.size / 2.6 + 3);
    ctx.lineTo(i * (t.size / 4), t.size / 2.6 - 3);
    ctx.stroke();
  }

  // الراس
  ctx.fillStyle = type.skin;
  ctx.beginPath();
  ctx.ellipse(t.size / 2.1, 0, t.size / 9, t.size / 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1c1c';
  ctx.beginPath();
  ctx.arc(t.size / 1.9, -t.size / 30, t.size / 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // تسمية "آمنة للصيد" فوق السلحفاة
  ctx.save();
  ctx.translate(t.x, t.y - t.size / 2 - 10);
  ctx.fillStyle = 'rgba(160, 255, 190, 0.95)';
  ctx.font = 'bold 12px Tahoma';
  ctx.textAlign = 'center';
  ctx.fillText('+' + type.reward + '💰', 0, 0);
  ctx.restore();
}

function drawCatchPopups() {
  for (const p of catchPopups) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 16px Tahoma';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.restore();
  }
}

function drawPowerup(p) {
  ctx.save();
  ctx.translate(p.x, p.y + Math.sin(p.bob) * 6);
  const glowColor = p.kind === 'shield' ? 'rgba(127,232,176,0.3)' : 'rgba(255,215,106,0.3)';
  ctx.beginPath();
  ctx.fillStyle = glowColor;
  ctx.arc(0, 0, p.size * 1.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = p.kind === 'shield' ? '#7fe8b0' : '#ffd76a';
  ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = (p.size * 0.9) + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(p.kind === 'shield' ? '🛡️' : '⚡', 0, 1);
  ctx.restore();
}

function drawSubmarine(s) {
  ctx.save();
  ctx.translate(s.x, s.y);
  const dir = s.vx > 0 ? 1 : -1;
  ctx.scale(dir, 1);

  // توهج خفيف يلفت الانتباه إنها مميزة (مش خطر)
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255, 215, 106, 0.12)';
  ctx.arc(0, 0, s.size * 0.95, 0, Math.PI * 2);
  ctx.fill();

  // جسم الغواصة
  const bodyGrad = ctx.createLinearGradient(0, -s.size / 4, 0, s.size / 4);
  bodyGrad.addColorStop(0, '#d4a83a');
  bodyGrad.addColorStop(1, '#8a6a1f');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, s.size / 2, s.size / 4.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // نوافذ مستديرة
  ctx.fillStyle = '#7fd8e8';
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.arc(i * (s.size / 4.2), -s.size / 22, s.size / 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3a2a05';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // برج القيادة والبريسكوب
  ctx.fillStyle = '#8a6a1f';
  ctx.fillRect(-s.size / 10, -s.size / 2.3, s.size / 5, s.size / 6);
  ctx.strokeStyle = '#5a4310';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -s.size / 2.3);
  ctx.lineTo(0, -s.size / 1.5);
  ctx.stroke();

  // المروحة الخلفية الدوارة
  ctx.save();
  ctx.translate(-s.size / 2, 0);
  ctx.rotate(s.propeller);
  ctx.strokeStyle = '#3a2a05';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-s.size / 10, 0);
  ctx.lineTo(s.size / 10, 0);
  ctx.moveTo(0, -s.size / 10);
  ctx.lineTo(0, s.size / 10);
  ctx.stroke();
  ctx.restore();

  ctx.restore();

  // تلميح فوقها
  ctx.save();
  ctx.translate(s.x, s.y - s.size / 2 - 12);
  ctx.fillStyle = 'rgba(255, 215, 106, 0.95)';
  ctx.font = 'bold 12px Tahoma';
  ctx.textAlign = 'center';
  ctx.fillText('✨ غواصة سرية!', 0, 0);
  ctx.restore();
}

function drawSeaTransitionEffect() {
  if (!seaTransition) return;
  const t = seaTransition.timer / seaTransition.duration;
  const maxR = Math.hypot(canvas.width, canvas.height) * 0.72;
  const r = t < 0.5 ? (t / 0.5) * maxR : (1 - (t - 0.5) / 0.5) * maxR;
  ctx.save();
  ctx.fillStyle = seaTransition.color;
  ctx.beginPath();
  ctx.arc(seaTransition.x, seaTransition.y, Math.max(0, r), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 7;
  ctx.stroke();
  ctx.restore();
}

function drawDecorations() {
  for (const d of decorations) {
    if (d.type === 'poster') {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.fillStyle = 'rgba(230, 220, 200, 0.9)';
      ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
      ctx.strokeStyle = 'rgba(120, 100, 70, 0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-d.w / 2, -d.h / 2, d.w, d.h);
      if (heroImageReady) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-d.w / 2 + 5, -d.h / 2 + 5, d.w - 10, d.h - 10);
        ctx.clip();
        const ratio = heroImageObj.naturalWidth / heroImageObj.naturalHeight;
        const iw = d.w - 10;
        const ih = iw / ratio;
        ctx.drawImage(heroImageObj, -iw / 2, -d.h / 2 + 5, iw, ih);
        ctx.restore();
      }
      ctx.restore();
    } else if (d.type === 'bottle') {
      ctx.save();
      const by = Math.sin(d.bob) * 8;
      ctx.translate(d.x, d.y + by);
      ctx.fillStyle = 'rgba(140, 200, 160, 0.35)';
      ctx.beginPath();
      ctx.moveTo(-d.w / 2, -d.h / 2 + 10);
      ctx.quadraticCurveTo(-d.w / 2 - 4, d.h / 2, 0, d.h / 2);
      ctx.quadraticCurveTo(d.w / 2 + 4, d.h / 2, d.w / 2, -d.h / 2 + 10);
      ctx.lineTo(d.w / 4, -d.h / 2);
      ctx.lineTo(-d.w / 4, -d.h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(200, 230, 210, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      if (heroImageReady) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 5, d.w / 3.2, 0, Math.PI * 2);
        ctx.clip();
        const ratio = heroImageObj.naturalWidth / heroImageObj.naturalHeight;
        const ih = d.w / 1.6;
        const iw = ih * ratio;
        ctx.drawImage(heroImageObj, -iw / 2, 5 - ih / 2, iw, ih);
        ctx.restore();
      }
      ctx.restore();
    }
  }
}

function drawShieldEffect() {
  if (player.shieldTimer > 0 || player.shields > 0) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.strokeStyle = player.shieldTimer > 0 ? 'rgba(127,232,176,0.85)' : 'rgba(127,216,232,0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, player.size / 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawOxygenWarning(time) {
  if (!player.lowOxygenWarning) return;
  const severity = 1 - Math.max(0, player.oxygenRatio) / 0.35;
  const pulse = 0.35 + Math.abs(Math.sin(time * 3.2)) * 0.4 * (0.5 + severity * 0.5);
  const g = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, canvas.height * 0.28,
    canvas.width / 2, canvas.height / 2, canvas.height * 0.75
  );
  g.addColorStop(0, 'rgba(200, 20, 20, 0)');
  g.addColorStop(1, `rgba(200, 20, 20, ${(0.35 + severity * 0.4) * pulse})`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawPlayer() {
  ctx.save();
  const swimPulse = 1 + Math.sin(player.swimPhase) * 0.035;
  const swimBob = Math.sin(player.swimPhase) * 3;
  ctx.translate(player.x, player.y + swimBob);
  ctx.rotate(player.tilt);
  if (player.facing < 0) ctx.scale(-1, 1);
  ctx.scale(1, swimPulse);
  const s = player.size;
  const myCharImg = mpActive && mpMyCharacter && mpCharacterImages[mpMyCharacter] ? mpCharacterImages[mpMyCharacter] : playerSprite;
  if (assetsReady && myCharImg.naturalWidth > 0) {
    const ratio = myCharImg.naturalWidth / myCharImg.naturalHeight;
    const h = s * 1.6;
    const w = h * ratio;
    if (!mpActive) ctx.filter = currentSkin().filter;
    ctx.drawImage(myCharImg, -w / 2, -h / 2, w, h);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#122b5c';
    ctx.beginPath();
    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d4232c';
    ctx.beginPath();
    ctx.arc(0, -s / 3, s / 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawOpponent() {
  if (!mpActive || !mpOpponentPresent || !mpOpponentState) return;
  if (mpOpponentState.alive === false) return;
  const o = mpOpponentState;
  const oppChar = MP_CHARACTERS.find(c => c.id === o.character) || MP_CHARACTERS[1];
  const oppImg = mpCharacterImages[oppChar.id] || playerSprite;
  ctx.save();
  const swimBob = Math.sin(o.swimPhase || 0) * 3;
  ctx.globalAlpha = 0.92;
  ctx.translate(o.x, o.y + swimBob);
  ctx.rotate(o.tilt || 0);
  if ((o.facing || 1) < 0) ctx.scale(-1, 1);
  const s = player.size;
  if (oppImg.naturalWidth > 0) {
    const ratio = oppImg.naturalWidth / oppImg.naturalHeight;
    const h = s * 1.6;
    const w = h * ratio;
    ctx.drawImage(oppImg, -w / 2, -h / 2, w, h);
  }
  ctx.restore();

  // اسم بسيط فوق راسه يوضح إنه صاحبك
  ctx.save();
  ctx.translate(o.x, o.y - player.size / 1.4);
  ctx.fillStyle = oppChar.swatch;
  ctx.font = 'bold 12px Tahoma';
  ctx.textAlign = 'center';
  ctx.fillText('👤', 0, 0);
  ctx.restore();
}

// ================== حلقة اللعبة ==================
function loop(now) {
  if (state !== 'playing') return;
  const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  elapsedTime += dt;
  const time = now / 1000;

  const diff = difficultyFactor();
  spawnTimers.jellyfish -= dt;
  spawnTimers.shark -= dt;
  spawnTimers.snake -= dt;
  spawnTimers.coral -= dt;
  spawnTimers.treasure -= dt;
  spawnTimers.fish -= dt;
  spawnTimers.turtle -= dt;
  spawnTimers.powerup -= dt;
  spawnTimers.boss -= dt;
  spawnTimers.decoration -= dt;
  spawnTimers.crocodile -= dt;
  spawnTimers.scorpion -= dt;
  spawnTimers.hippo -= dt;
  spawnTimers.submarine -= dt;

  if (spawnTimers.jellyfish <= 0) { spawnJellyfish(); spawnTimers.jellyfish = rand(2.6, 4) / diff; }
  if (spawnTimers.shark <= 0) { spawnShark(); spawnTimers.shark = rand(4, 7) / diff; }
  if (spawnTimers.snake <= 0) { spawnSnake(); spawnTimers.snake = rand(3.5, 6) / diff; }
  if (spawnTimers.coral <= 0 && obstacles.filter(o => o.type === 'coral').length < 6) {
    spawnCoral(); spawnTimers.coral = rand(3, 5) / Math.sqrt(diff);
  }
  if (spawnTimers.treasure <= 0) { spawnTreasure(); spawnTimers.treasure = rand(1.5, 2.5); }
  if (spawnTimers.fish <= 0 && fish.length < 8) { spawnFish(); spawnTimers.fish = rand(1.6, 2.8); }
  if (spawnTimers.turtle <= 0 && turtles.length < 2) { spawnTurtle(); spawnTimers.turtle = rand(9, 15); }
  if (spawnTimers.powerup <= 0 && powerups.length < 2) { spawnPowerup(); spawnTimers.powerup = rand(14, 22); }
  if (spawnTimers.boss <= 0) { spawnBoss(); spawnTimers.boss = rand(70, 100); }
  if (spawnTimers.decoration <= 0 && decorations.length < 2) { spawnDecoration(); spawnTimers.decoration = rand(16, 26); }
  if (spawnTimers.submarine <= 0 && submarines.length < 1) {
    spawnSubmarine();
    submarineAppearances++;
    spawnTimers.submarine = nextSubmarineInterval();
  }
  const maxCrocodiles = Math.min(3, 1 + Math.floor(elapsedTime / 100));
  const maxScorpions = Math.min(4, 1 + Math.floor(elapsedTime / 75));
  const maxHippos = Math.min(2, 1 + Math.floor(elapsedTime / 130));
  if (spawnTimers.crocodile <= 0 && obstacles.filter(o => o.type === 'crocodile').length < maxCrocodiles) {
    spawnCrocodile(); spawnTimers.crocodile = rand(22, 34) / diff;
  }
  if (spawnTimers.scorpion <= 0 && obstacles.filter(o => o.type === 'scorpion').length < maxScorpions) {
    spawnScorpion(); spawnTimers.scorpion = rand(14, 24) / diff;
  }
  if (spawnTimers.hippo <= 0 && obstacles.filter(o => o.type === 'hippo').length < maxHippos) {
    spawnHippo(); spawnTimers.hippo = rand(18, 28) / diff;
  }

  updatePlayer(dt);
  updateBubbles(dt);
  updateObstacles(dt);
  updateTreasures(dt);
  updateFish(dt);
  updateTurtles(dt);
  updatePowerups(dt);
  updateSubmarines(dt);
  updateSeaTransition(dt);
  updateDecorations(dt);
  updateCatchPopups(dt);
  checkCollisions();

  drawBackground(time);
  drawDecorations();
  for (const o of obstacles) {
    if (o.type === 'jellyfish') drawJellyfish(o);
    else if (o.type === 'shark') drawShark(o);
    else if (o.type === 'snake') drawSnake(o);
    else if (o.type === 'coral') drawCoral(o);
    else if (o.type === 'crocodile') drawCrocodile(o);
    else if (o.type === 'scorpion') drawScorpion(o);
    else if (o.type === 'hippo') drawHippo(o);
  }
  for (const t of treasures) drawTreasure(t);
  for (const f of fish) drawFish(f);
  for (const t of turtles) drawTurtle(t);
  for (const p of powerups) drawPowerup(p);
  for (const s of submarines) drawSubmarine(s);
  drawBubbles();
  drawShieldEffect();
  drawOpponent();
  drawPlayer();
  drawCatchPopups();
  drawOxygenWarning(time);
  drawSeaTransitionEffect();
  updateChallengeTimerDisplay();

  requestAnimationFrame(loop);
}

// ================== البدء ==================
resizeCanvas();
initAssets();
