const MESSAGES_API = "https://67d243f890e0670699bcd5e4.mockapi.io/api/messages";
const STORAGE_KEYS = {
  name: "birthdayVisitorName",
  musicEnabled: "birthdayMusicEnabledV1",
};
const FALLBACK_KEYS = {
  wishes: "birthdayWishesV1",
  hearts: "birthdayHeartCountV1",
  heartVoters: "birthdayHeartVotersV1",
};

const defaultWishes = [];

const entryGate = document.getElementById("entryGate");
const entryForm = document.getElementById("entryForm");
const nameInput = document.getElementById("nameInput");
const musicToggle = document.getElementById("musicToggle");
const bgAudio = document.getElementById("bgAudio");
const appShell = document.getElementById("appShell");
const welcomeLine = document.getElementById("welcomeLine");
const wishTrigger = document.getElementById("wishTrigger");
const giftButton = document.getElementById("giftButton");
const wishSheet = document.getElementById("wishSheet");
const wishSheetBackdrop = document.getElementById("wishSheetBackdrop");
const wishSheetClose = document.getElementById("wishSheetClose");
const giftSheet = document.getElementById("giftSheet");
const giftSheetBackdrop = document.getElementById("giftSheetBackdrop");
const giftSheetClose = document.getElementById("giftSheetClose");
const wishForm = document.getElementById("wishForm");
const wishText = document.getElementById("wishText");
const wishes = document.getElementById("wishes");
const heartButton = document.getElementById("heartButton");
const heartCount = document.getElementById("heartCount");

let currentName = "";
let wishList = [];
let heartTotal = 0;
let heartVoters = [];

function fallbackLoadState() {
  const rawWishes = localStorage.getItem(FALLBACK_KEYS.wishes);
  const rawHearts = localStorage.getItem(FALLBACK_KEYS.hearts);
  const rawVoters = localStorage.getItem(FALLBACK_KEYS.heartVoters);

  let wishes = [];
  let voters = [];

  try {
    const parsedWishes = JSON.parse(rawWishes || "null");
    if (Array.isArray(parsedWishes)) {
      wishes = parsedWishes;
    }
  } catch (error) {
    wishes = [];
  }

  try {
    const parsedVoters = JSON.parse(rawVoters || "[]");
    if (Array.isArray(parsedVoters)) {
      voters = parsedVoters;
    }
  } catch (error) {
    voters = [];
  }

  return {
    wishes,
    heartTotal: Number.parseInt(rawHearts || "0", 10) || 0,
    heartVoters: voters,
  };
}

function fallbackSaveState() {
  localStorage.setItem(FALLBACK_KEYS.wishes, JSON.stringify(wishList));
  localStorage.setItem(FALLBACK_KEYS.hearts, String(heartTotal));
  localStorage.setItem(FALLBACK_KEYS.heartVoters, JSON.stringify(heartVoters));
}

function applyState(state) {
  wishList = Array.isArray(state.wishes) ? state.wishes : [];
  heartTotal = Number.parseInt(String(state.heartTotal || 0), 10) || 0;
  heartVoters = Array.isArray(state.heartVoters) ? state.heartVoters : [];
  renderWishes();
  updateHeartUI();
}

async function fetchAllMessages() {
  const response = await fetch(MESSAGES_API, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Khong the tai du lieu");
  }

  return response.json();
}

async function postMessageToServer(payload) {
  const response = await fetch(MESSAGES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Khong the luu du lieu");
  }

  return response.json();
}

function mapMessagesToState(messages) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const sorted = [...safeMessages].sort((a, b) => {
    const idA = Number.parseInt(String(a.id || "0"), 10) || 0;
    const idB = Number.parseInt(String(b.id || "0"), 10) || 0;
    return idB - idA;
  });

  const mapped = {
    wishes: [],
    heartTotal: 0,
    heartVoters: [],
  };

  sorted.forEach((item) => {
    const liked = Number.parseInt(String(item.isLiked || 0), 10) === 1;
    const name = String(item.name || "Ẩn danh").trim() || "Ẩn danh";
    const message = String(item.message || "").trim();

    if (liked) {
      mapped.heartTotal += 1;
      if (!mapped.heartVoters.includes(name)) {
        mapped.heartVoters.push(name);
      }
      return;
    }

    if (message) {
      mapped.wishes.push({ name, message });
    }
  });

  return mapped;
}

async function hydrateState() {
  try {
    const messages = await fetchAllMessages();
    const state = mapMessagesToState(messages);
    applyState(state);
    fallbackSaveState();
    return state;
  } catch (error) {
    const fallbackState = fallbackLoadState();
    applyState(fallbackState);
    return fallbackState;
  }
}

async function createWishOnServer(wish) {
  await postMessageToServer({
    message: wish.message,
    name: wish.name,
    isLiked: 0,
  });
  return hydrateState();
}

async function sendHeartToServer(name) {
  await postMessageToServer({
    message: "Da tha tym",
    name,
    isLiked: 1,
  });
  return hydrateState();
}

function updateHeartUI() {
  heartCount.textContent = String(heartTotal);
  const hasLiked = currentName ? heartVoters.includes(currentName) : false;
  heartButton.classList.toggle("is-liked", hasLiked);
  heartButton.disabled = !currentName || hasLiked;
  heartButton.setAttribute("aria-pressed", hasLiked ? "true" : "false");
  heartButton.title = hasLiked ? "Bạn đã thả tym rồi" : "Thả tym cho Mei";
}

function openWishSheet() {
  closeGiftSheet();
  wishSheet.hidden = false;
  wishSheetBackdrop.hidden = false;
  requestAnimationFrame(() => {
    wishSheet.classList.add("is-open");
    wishSheetBackdrop.classList.add("is-open");
    wishSheet.setAttribute("aria-hidden", "false");
    wishText.focus();
  });
}

function closeWishSheet(options = {}) {
  const { focusTrigger = true } = options;
  wishSheet.classList.remove("is-open");
  wishSheetBackdrop.classList.remove("is-open");
  wishSheet.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    wishSheet.hidden = true;
    wishSheetBackdrop.hidden = true;
  }, 220);
  if (focusTrigger) {
    wishTrigger.focus();
  }
}

function openGiftSheet() {
  closeWishSheet({ focusTrigger: false });
  giftSheet.hidden = false;
  giftSheetBackdrop.hidden = false;
  requestAnimationFrame(() => {
    giftSheet.classList.add("is-open");
    giftSheetBackdrop.classList.add("is-open");
    giftSheet.setAttribute("aria-hidden", "false");
  });
}

function closeGiftSheet(options = {}) {
  const { focusTrigger = false } = options;
  giftSheet.classList.remove("is-open");
  giftSheetBackdrop.classList.remove("is-open");
  giftSheet.setAttribute("aria-hidden", "true");
  setTimeout(() => {
    giftSheet.hidden = true;
    giftSheetBackdrop.hidden = true;
  }, 220);
  if (focusTrigger) {
    wishTrigger.focus();
  }
}

function createWishElement(wish, delayMs) {
  const item = document.createElement("article");
  item.className = "wish";
  item.style.setProperty("--wish-delay", delayMs + "ms");

  const author = document.createElement("strong");
  author.textContent = wish.name + ":";

  item.append(author);
  item.append(" " + wish.message);
  return item;
}

function renderWishes() {
  wishes.innerHTML = "";
  const stepMs = 380;
  const cycleMs = 4000;
  wishList.forEach((wish, index) => {
    const delay = (index * stepMs) % cycleMs;
    wishes.append(createWishElement(wish, delay));
  });
}

function enterInvitation(name) {
  currentName = name;
  localStorage.setItem(STORAGE_KEYS.name, name);
  localStorage.setItem(
    STORAGE_KEYS.musicEnabled,
    musicToggle.checked ? "1" : "0",
  );
  welcomeLine.textContent =
    "Xin chào " + name + ", để lại lời chúc cho Mei nhé!";
  updateHeartUI();

  if (musicToggle.checked) {
    bgAudio.volume = 0.4;
    bgAudio.play().catch(() => {
      // Playback can fail on some devices; UI remains usable.
    });
  } else {
    bgAudio.pause();
    bgAudio.currentTime = 0;
  }

  document.body.classList.remove("is-locked");
  entryGate.classList.add("hide");
  appShell.classList.add("is-ready");
  appShell.setAttribute("aria-hidden", "false");

  setTimeout(() => {
    entryGate.style.display = "none";
    wishText.focus();
  }, 280);
}

applyState({ wishes: [], heartTotal: 0, heartVoters: [] });
hydrateState();

const savedName = localStorage.getItem(STORAGE_KEYS.name);
if (savedName) {
  nameInput.value = savedName;
}

musicToggle.checked = localStorage.getItem(STORAGE_KEYS.musicEnabled) === "1";

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = nameInput.value.trim();

  if (!name) {
    nameInput.focus();
    return;
  }

  enterInvitation(name);
});

wishForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = wishText.value.trim();

  if (!message) {
    wishText.focus();
    return;
  }

  const wish = { name: currentName || "Bạn", message };
  try {
    const state = await createWishOnServer(wish);
    applyState(state);
  } catch (error) {
    wishList.unshift(wish);
    fallbackSaveState();
    renderWishes();
  }

  wishText.value = "";
  closeWishSheet();
});

wishTrigger.addEventListener("click", openWishSheet);
wishSheetBackdrop.addEventListener("click", closeWishSheet);
wishSheetClose.addEventListener("click", closeWishSheet);
giftButton.addEventListener("click", openGiftSheet);
giftSheetBackdrop.addEventListener("click", closeGiftSheet);
giftSheetClose.addEventListener("click", closeGiftSheet);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && wishSheet.classList.contains("is-open")) {
    closeWishSheet();
  }

  if (event.key === "Escape" && giftSheet.classList.contains("is-open")) {
    closeGiftSheet();
  }
});

heartButton.addEventListener("click", async () => {
  if (!currentName || heartVoters.includes(currentName)) {
    return;
  }

  try {
    const state = await sendHeartToServer(currentName);
    applyState(state);
  } catch (error) {
    heartTotal += 1;
    heartVoters.unshift(currentName);
    fallbackSaveState();
    updateHeartUI();
  }

  heartButton.classList.remove("pulse");
  void heartButton.offsetWidth;
  heartButton.classList.add("pulse");
});
