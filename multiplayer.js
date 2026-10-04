// ===== طبقة الشبكة (Multiplayer) لـ KmaKimo =====
// مبنية فوق Firebase Realtime Database (مجاني) - ملف عام بيوفر عمليات بسيطة
// يستخدمها game.js بدون ما يحتاج يعرف تفاصيل Firebase

const MP = (() => {
  const firebaseConfig = {
    apiKey: "AIzaSyBFywXFOst2o8-UH6pSNOvWRSfxkawNV-U",
    authDomain: "kmakimo-44235.firebaseapp.com",
    databaseURL: "https://kmakimo-44235-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "kmakimo-44235",
    storageBucket: "kmakimo-44235.firebasestorage.app",
    messagingSenderId: "396926763869",
    appId: "1:396926763869:web:6753716067c5678c549eb4"
  };

  let app = null;
  let db = null;
  let roomCode = null;
  let myId = null;
  let isHost = false;
  let playersRef = null;
  let worldRef = null;
  let myRef = null;
  let sendInterval = null;
  let connected = false;

  function ensureInit() {
    if (app) return;
    app = firebase.initializeApp(firebaseConfig);
    db = firebase.database();
  }

  function randomCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  // ---- إنشاء غرفة جديدة (اللاعب الأول) ----
  function createRoom(initialData, onReady, onError) {
    ensureInit();
    const tryCode = () => {
      const code = randomCode();
      const roomRef = db.ref('rooms/' + code);
      roomRef.get().then(snap => {
        if (snap.exists()) {
          tryCode();
          return;
        }
        roomCode = code;
        isHost = true;
        playersRef = db.ref('rooms/' + roomCode + '/players');
        worldRef = db.ref('rooms/' + roomCode + '/world');
        const pushRef = playersRef.push();
        myId = pushRef.key;
        myRef = pushRef;
        roomRef.child('createdAt').set(Date.now());
        roomRef.child('hostId').set(myId);
        myRef.set(Object.assign({ role: 'host', joinedAt: Date.now() }, initialData));
        myRef.onDisconnect().remove();
        connected = true;
        onReady(roomCode, myId);
      }).catch(err => onError && onError(err));
    };
    tryCode();
  }

  // ---- الانضمام لغرفة موجودة (اللاعب الثاني) ----
  function joinRoom(code, initialData, onReady, onError) {
    ensureInit();
    const roomRef = db.ref('rooms/' + code);
    roomRef.get().then(snap => {
      if (!snap.exists()) {
        onError && onError('room-not-found');
        return;
      }
      const playersSnap = snap.child('players');
      const count = playersSnap.numChildren();
      if (count >= 2) {
        onError && onError('room-full');
        return;
      }
      roomCode = code;
      isHost = false;
      playersRef = db.ref('rooms/' + roomCode + '/players');
      worldRef = db.ref('rooms/' + roomCode + '/world');
      const pushRef = playersRef.push();
      myId = pushRef.key;
      myRef = pushRef;
      myRef.set(Object.assign({ role: 'guest', joinedAt: Date.now() }, initialData));
      myRef.onDisconnect().remove();
      connected = true;
      onReady(roomCode, myId);
    }).catch(err => onError && onError(err));
  }

  function leaveRoom() {
    if (sendInterval) { clearInterval(sendInterval); sendInterval = null; }
    if (myRef) { myRef.onDisconnect().cancel(); myRef.remove(); }
    playersRef = null;
    worldRef = null;
    myRef = null;
    roomCode = null;
    myId = null;
    connected = false;
  }

  // ---- إرسال حالتي بشكل دوري (مش كل فريم، توفير بيانات) ----
  function startBroadcasting(getStateFn, intervalMs) {
    if (sendInterval) clearInterval(sendInterval);
    sendInterval = setInterval(() => {
      if (!myRef) return;
      myRef.update(getStateFn());
    }, intervalMs || 130);
  }

  function updateMe(data) {
    if (myRef) myRef.update(data);
  }

  // ---- الاستماع للاعب التاني (استبعاد نفسي) ----
  function onOpponentChange(cb) {
    if (!playersRef) return;
    playersRef.on('value', snap => {
      let opponent = null;
      snap.forEach(child => {
        if (child.key !== myId) opponent = Object.assign({ id: child.key }, child.val());
      });
      cb(opponent);
    });
  }

  // ---- عالم الغرفة (بحر، انتقال، تحدي) ----
  function updateWorld(data) {
    if (worldRef) worldRef.update(data);
  }

  function onWorldChange(cb) {
    if (!worldRef) return;
    worldRef.on('value', snap => {
      cb(snap.val() || {});
    });
  }

  // معاملة ذرية (عشان أول واحد يوصل يفوز، مش الاتنين)
  function transactionOnWorldField(field, updateFn, cb) {
    if (!worldRef) return;
    worldRef.child(field).transaction(updateFn, (err, committed, snap) => {
      cb && cb(err, committed, snap ? snap.val() : null);
    });
  }

  function isConnected() { return connected; }
  function getRoomCode() { return roomCode; }
  function getMyId() { return myId; }
  function getIsHost() { return isHost; }

  return {
    createRoom, joinRoom, leaveRoom, startBroadcasting, updateMe,
    onOpponentChange, updateWorld, onWorldChange, transactionOnWorldField,
    isConnected, getRoomCode, getMyId, getIsHost
  };
})();
