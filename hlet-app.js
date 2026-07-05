const PASSWORD = "HLET2025";
const STORAGE_KEY = "hlet-hub-v1";
const SESSION_KEY = "hlet-session-v1";
const PAGE_SIZE = 120;
const EMPTY_TAG_STATE = { object: [], item: [], vehicle: [], weapon: [] };
const DEFAULT_TEAM_MEMBERS = ["Licora", "Kai", "Maya", "Jax", "Aria", "Ryn", "Nova"];
const DEFAULT_MEETINGS = [
  { id: "meeting:halloween", name: "Halloween Event Planning", date: "2025-05-30", time: "19:00", location: "Event Room 1", notes: "Discuss themes, activities, and staff roles.", status: "upcoming" },
  { id: "meeting:summer-kickoff", name: "Summer Event Kickoff", date: "2025-05-18", time: "19:00", location: "Event Room 1", notes: "", status: "attended" },
  { id: "meeting:event-sync", name: "Event Team Sync", date: "2025-05-11", time: "19:00", location: "Event Room 1", notes: "", status: "attended" },
  { id: "meeting:charity", name: "Charity Event Planning", date: "2025-05-04", time: "19:00", location: "Event Room 1", notes: "", status: "missed" },
  { id: "meeting:easter", name: "Easter Event Debrief", date: "2025-04-27", time: "19:00", location: "Event Room 1", notes: "", status: "attended" },
  { id: "meeting:brainstorm", name: "Event Brainstorm", date: "2025-04-20", time: "19:00", location: "Event Room 1", notes: "", status: "unavailable" }
];
const DEFAULT_TASKS = [
  { id: "task:venue", name: "Book Halloween venue", description: "", dueDate: "2025-05-25", meetingId: "meeting:halloween", owner: "mine", status: "overdue", complete: false },
  { id: "task:budget", name: "Create event budget", description: "", dueDate: "2025-05-26", meetingId: "meeting:halloween", owner: "team", status: "progress", complete: false },
  { id: "task:vendors", name: "Confirm vendors", description: "", dueDate: "2025-05-27", meetingId: "meeting:summer-kickoff", owner: "mine", status: "todo", complete: false },
  { id: "task:socials", name: "Design social media graphics", description: "", dueDate: "2025-05-28", meetingId: "meeting:halloween", owner: "team", status: "todo", complete: false }
];
const ITEM_CATEGORIES = [
  "Ammo",
  "Blueprints",
  "Drinks",
  "Drugs",
  "Event & Misc",
  "Fishing",
  "Food",
  "Heist",
  "Loot Containers",
  "Lumber",
  "Medical",
  "Mining",
  "Pawn Values",
  "Property",
  "Shrooms",
  "Tools",
  "Valuables",
  "Weapon Mods",
  "Weapon Parts",
  "Weed"
];
const WEAPON_CATEGORIES = ["HEAVY", "SMGS", "THROWABLES", "MELEE", "OTHER", "PISTOLS", "SHOTGUNS", "RIFLES"];
const CRIMINAL_ITEM_TAGS = new Set(["blueprints", "drugs", "heist", "shrooms", "weed"]);
const VEHICLE_CATEGORIES = [
  "BCSO",
  "LSPD",
  "DOA",
  "FIB",
  "EMS",
  "G6",
  "Event",
  "News",
  "Taxi",
  "Muscle",
  "Sport",
  "SUV",
  "Sedan",
  "Utility",
  "Van",
  "Motorcycle",
  "Commercial",
  "Boat",
  "Plane",
  "Helicopter",
  "Law Enforcement",
  "Military",
  "Coupe",
  "Industrial",
  "Service",
  "Weapon",
  "Offroad"
];
const SEEDED_LIST_NAMES = new Set(["4th of July", "Birthday bash", "World Cup", "Carwash"]);

const seed = window.HLET_SEED_DATA || { items: [] };
const IMAGE_DB_NAME = "hlet-image-store-v1";
const IMAGE_STORE_NAME = "images";
const state = loadState();
let activeTab = "objects";
let activeCategory = "All";
let activeListId = state.lists[0]?.id || "";
let renderLimit = PAGE_SIZE;
let editingTagItemId = "";
let editingTags = [];
let editingItemId = "";
let pendingImageData = "";
let storedImages = {};
let meetingView = "dashboard";

const els = {
  loginView: document.querySelector("[data-login-view]"),
  loginForm: document.querySelector("[data-login-form]"),
  loginStatus: document.querySelector("[data-login-status]"),
  app: document.querySelector("[data-app]"),
  userName: document.querySelector("[data-user-name]"),
  logout: document.querySelector("[data-logout]"),
  tabs: document.querySelectorAll("[data-tab]"),
  toolbar: document.querySelector("[data-toolbar]"),
  browser: document.querySelector("[data-browser]"),
  favoritesView: document.querySelector("[data-favorites-view]"),
  favoriteMenu: document.querySelector("[data-favorite-menu]"),
  favoriteTitle: document.querySelector("[data-favorite-title]"),
  favoriteResults: document.querySelector("[data-favorite-results]"),
  favoriteSearch: document.querySelector("[data-favorite-search]"),
  favoriteItems: document.querySelector("[data-favorite-items]"),
  lists: document.querySelector("[data-lists]"),
  meetings: document.querySelector("[data-meetings]"),
  meetingDashboard: document.querySelector("[data-meeting-dashboard]"),
  teamDirectory: document.querySelector("[data-team-directory]"),
  teamDirectoryGrid: document.querySelector("[data-team-directory-grid]"),
  teamMemberForm: document.querySelector("[data-team-member-form]"),
  teamMemberCount: document.querySelector("[data-team-member-count]"),
  meetingForm: document.querySelector("[data-meeting-form]"),
  meetingDialog: document.querySelector("[data-meeting-dialog]"),
  taskForm: document.querySelector("[data-task-form]"),
  taskDialog: document.querySelector("[data-task-dialog]"),
  taskMeetingSelect: document.querySelector("[data-task-meeting-select]"),
  upcomingMeeting: document.querySelector("[data-upcoming-meeting]"),
  recentMeetings: document.querySelector("[data-recent-meetings]"),
  taskList: document.querySelector("[data-task-list]"),
  settings: document.querySelector("[data-settings]"),
  search: document.querySelector("[data-search]"),
  categories: document.querySelector("[data-categories]"),
  categoryChips: document.querySelector("[data-category-chips]"),
  title: document.querySelector("[data-title]"),
  results: document.querySelector("[data-results]"),
  grid: document.querySelector("[data-grid]"),
  itemDialog: document.querySelector("[data-item-dialog]"),
  itemForm: document.querySelector("[data-item-form]"),
  itemTitle: document.querySelector("[data-item-title]"),
  itemDelete: document.querySelector("[data-delete-current-item]"),
  customCategory: document.querySelector("[data-custom-category]"),
  imageDrop: document.querySelector("[data-image-drop]"),
  imageFileName: document.querySelector("[data-image-file-name]"),
  tagDialog: document.querySelector("[data-tag-dialog]"),
  tagForm: document.querySelector("[data-tag-form]"),
  tagTitle: document.querySelector("[data-tag-title]"),
  tagEditor: document.querySelector("[data-tag-editor]"),
  tagInput: document.querySelector("[data-tag-input]"),
  tagAddRow: document.querySelector("[data-tag-add-row]"),
  tagAdd: document.querySelector("[data-tag-add]"),
  tagCancel: document.querySelector("[data-tag-cancel]"),
  rewardDialog: document.querySelector("[data-reward-dialog]"),
  rewardForm: document.querySelector("[data-reward-form]"),
  rewardSummary: document.querySelector("[data-reward-summary]"),
  listMenu: document.querySelector("[data-list-menu]"),
  listTitle: document.querySelector("[data-list-title]"),
  listSubtitle: document.querySelector("[data-list-subtitle]"),
  listSearch: document.querySelector("[data-list-search]"),
  listItems: document.querySelector("[data-list-items]"),
  settingsPanels: document.querySelector("[data-settings-panels]")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      parsed.favoritesByUser = parsed.favoritesByUser || {};
      parsed.deletedItemIds = parsed.deletedItemIds || [];
      parsed.customItems = parsed.customItems || (parsed.items || []).filter((item) => String(item.id || "").startsWith("custom:"));
      parsed.itemOverrides = parsed.itemOverrides || {};
      parsed.customTags = { ...EMPTY_TAG_STATE, ...(parsed.customTags || {}) };
      parsed.deletedTags = { ...EMPTY_TAG_STATE, ...(parsed.deletedTags || {}) };
      parsed.teamMembers = normalizeTeamMembers(parsed.teamMembers || DEFAULT_TEAM_MEMBERS);
      parsed.meetings = normalizeMeetings(parsed.meetings || DEFAULT_MEETINGS);
      parsed.tasks = normalizeTasks(parsed.tasks || DEFAULT_TASKS);
      parsed.lists = removeSeededLists(parsed.lists || []);
      return mergeSeedItems(parsed);
    } catch (error) {
      console.error("Could not read saved Events Team Hub data.", error);
    }
  }

  return {
    items: seed.items || [],
    customItems: [],
    itemOverrides: {},
    customTags: { ...EMPTY_TAG_STATE },
    deletedTags: { ...EMPTY_TAG_STATE },
    favoritesByUser: {},
    deletedItemIds: [],
    teamMembers: [...DEFAULT_TEAM_MEMBERS],
    meetings: normalizeMeetings(DEFAULT_MEETINGS),
    tasks: normalizeTasks(DEFAULT_TASKS),
    lists: []
  };
}

function normalizeTeamMembers(members = []) {
  return [...new Set(members.map((name) => String(name || "").trim()).filter(Boolean))]
    .sort((a, b) => sortText(a, b));
}

function normalizeMeetings(meetings = []) {
  return meetings
    .map((meeting) => ({
      id: meeting.id || `meeting:${crypto.randomUUID()}`,
      name: String(meeting.name || "").trim(),
      date: meeting.date || "",
      time: meeting.time || "",
      location: meeting.location || "",
      notes: meeting.notes || "",
      status: meeting.status || "upcoming"
    }))
    .filter((meeting) => meeting.name)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

function normalizeTasks(tasks = []) {
  return tasks
    .map((task) => ({
      id: task.id || `task:${crypto.randomUUID()}`,
      name: String(task.name || "").trim(),
      description: task.description || "",
      dueDate: task.dueDate || "",
      meetingId: task.meetingId || "",
      owner: task.owner || "mine",
      status: task.status || "todo",
      complete: Boolean(task.complete)
    }))
    .filter((task) => task.name)
    .sort((a, b) => String(a.dueDate || "9999-99-99").localeCompare(String(b.dueDate || "9999-99-99")));
}

function removeSeededLists(lists = []) {
  return lists.filter((list) => !(SEEDED_LIST_NAMES.has(list.name) && list.createdBy === "Kizzy"));
}

function mergeSeedItems(savedState) {
  const deleted = new Set(savedState.deletedItemIds || []);
  const merged = new Map();

  (seed.items || []).forEach((item) => {
    if (!deleted.has(item.id)) {
      merged.set(item.id, {
        ...item,
        ...(savedState.itemOverrides?.[item.id] || {})
      });
    }
  });

  (savedState.customItems || []).forEach((item) => {
    if (!deleted.has(item.id)) merged.set(item.id, item);
  });

  return {
    ...savedState,
    items: [...merged.values()].map(removeDeletedTagsFromItem)
  };
}

function compactSavedImage(id, image) {
  const imageValue = String(image || "");
  if (!imageValue.startsWith("data:")) return image || "";
  return storedImages[id] ? `idb:${id}` : "";
}

function compactSavedItem(item) {
  const copy = { ...item };
  copy.image = compactSavedImage(copy.id, copy.image);
  return copy;
}

function compactSavedOverrides(overrides = {}) {
  return Object.fromEntries(Object.entries(overrides).map(([id, override]) => {
    const copy = { ...override };
    if (Object.prototype.hasOwnProperty.call(copy, "image")) {
      copy.image = compactSavedImage(id, copy.image);
    }
    return [id, copy];
  }));
}

function saveState() {
  const savedState = {
    customItems: (state.customItems || []).map(compactSavedItem),
    itemOverrides: compactSavedOverrides(state.itemOverrides || {}),
    customTags: { ...EMPTY_TAG_STATE, ...(state.customTags || {}) },
    deletedTags: { ...EMPTY_TAG_STATE, ...(state.deletedTags || {}) },
    favoritesByUser: state.favoritesByUser || {},
    deletedItemIds: state.deletedItemIds || [],
    teamMembers: normalizeTeamMembers(state.teamMembers || DEFAULT_TEAM_MEMBERS),
    meetings: normalizeMeetings(state.meetings || DEFAULT_MEETINGS),
    tasks: normalizeTasks(state.tasks || DEFAULT_TASKS),
    lists: state.lists || []
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
    return true;
  } catch (error) {
    console.error("Could not save Events Team Hub data.", error);
    alert("This change could not be saved in your browser, so it was not applied. Try refreshing once, then make the change again.");
    return false;
  }
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function openImageStore() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("IndexedDB is not available."));
      return;
    }
    const request = indexedDB.open(IMAGE_DB_NAME, 1);
    request.addEventListener("upgradeneeded", () => {
      request.result.createObjectStore(IMAGE_STORE_NAME);
    });
    request.addEventListener("success", () => resolve(request.result));
    request.addEventListener("error", () => reject(request.error));
  });
}

function runImageStore(mode, callback) {
  return openImageStore().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_STORE_NAME, mode);
    const store = transaction.objectStore(IMAGE_STORE_NAME);
    transaction.addEventListener("complete", () => {
      db.close();
      resolve();
    });
    transaction.addEventListener("abort", () => {
      db.close();
      reject(transaction.error);
    });
    callback(store, resolve, reject);
  }));
}

async function loadStoredImages() {
  try {
    const images = {};
    await runImageStore("readonly", (store, resolve) => {
      const request = store.openCursor();
      request.addEventListener("success", () => {
        const cursor = request.result;
        if (!cursor) {
          storedImages = images;
          resolve();
          return;
        }
        images[cursor.key] = cursor.value;
        cursor.continue();
      });
      request.addEventListener("error", resolve);
    });
    renderAll();
  } catch (error) {
    console.warn("Uploaded image storage is unavailable.", error);
  }
}

async function migrateEmbeddedImages() {
  const itemsWithImages = state.items.filter((item) => String(item.image || "").startsWith("data:"));
  if (!itemsWithImages.length) return;
  for (const item of itemsWithImages) {
    const saved = await saveStoredImage(item.id, item.image);
    if (!saved) continue;
    item.image = `idb:${item.id}`;
    saveItemOverride(item);
  }
  saveState();
  renderAll();
}

async function saveStoredImage(id, imageData) {
  if (!id || !imageData || !String(imageData).startsWith("data:")) return false;
  try {
    await runImageStore("readwrite", (store) => store.put(imageData, id));
    storedImages[id] = imageData;
    return true;
  } catch (error) {
    console.error("Could not save uploaded image.", error);
    alert("The image could not be saved in this browser. Try a smaller image.");
    return false;
  }
}

async function deleteStoredImage(id) {
  if (!id) return;
  delete storedImages[id];
  try {
    await runImageStore("readwrite", (store) => store.delete(id));
  } catch (error) {
    console.warn("Could not delete stored image.", error);
  }
}

function imageSourceFor(item) {
  if (String(item.image || "").startsWith("idb:")) return storedImages[item.id] || "";
  return item.image || "";
}

function itemType(tab = activeTab) {
  return { objects: "object", items: "item", vehicles: "vehicle", weapons: "weapon" }[tab];
}

function sortText(a, b) {
  return String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });
}

function sortItemsByName(items) {
  return [...items].sort((a, b) => sortText(a.name, b.name) || sortText(a.code, b.code));
}

function currentUser() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
  } catch (error) {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function currentUserKey() {
  return String(currentUser()?.name || "guest").trim().toLowerCase() || "guest";
}

function favoriteIds() {
  const key = currentUserKey();
  state.favoritesByUser[key] = state.favoritesByUser[key] || [];
  return state.favoritesByUser[key];
}

function isFavorite(itemId) {
  return favoriteIds().includes(itemId);
}

function toggleFavorite(itemId) {
  const favorites = favoriteIds();
  const index = favorites.indexOf(itemId);
  if (index === -1) {
    favorites.push(itemId);
  } else {
    favorites.splice(index, 1);
  }
  saveState();
}

function saveItemOverride(item) {
  if (String(item.id || "").startsWith("custom:")) {
    state.customItems = (state.customItems || []).map((customItem) => customItem.id === item.id ? item : customItem);
    return;
  }

  state.itemOverrides = state.itemOverrides || {};
  state.itemOverrides[item.id] = {
    ...(state.itemOverrides[item.id] || {}),
    name: item.name,
    code: item.code,
    image: item.image || "",
    kind: item.kind,
    tags: item.tags || [],
    blacklisted: Boolean(item.blacklisted),
    price: item.price || "",
    notes: item.notes || ""
  };
}

function showApp() {
  const user = currentUser();
  if (!user) return;
  els.loginView.classList.add("is-hidden");
  els.app.classList.remove("is-hidden");
  els.userName.textContent = user.name;
  renderAll();
}

function getUsefulCategory(item) {
  if (item.kind === "weapon") {
    return getWeaponCategory(item);
  }

  const tags = item.tags || [];
  if (item.kind === "vehicle" && tags.some((tag) => normalizeTag(item.kind, tag) === "Offroad")) {
    return "Offroad";
  }

  const preferred = tags.find((tag) => !isMetadataTag(tag));
  return preferred ? normalizeTag(item.kind, preferred) : item.dlc || "Unsorted";
}

function isMetadataTag(tag) {
  return /^(roleplay|size|gray|white|black|silver|red|blue|green|yellow|orange|brown|transparent|metal|wood|glass|plastic|concrete|fabric|leather|stone|scriptable|external|lod|created|release|version|online|gtav|base game|diffuse|normal|specular|embedded collision|responsive object|dont cast shadows|proxy object|texture variation|time controlled|fragment|cloth)/i.test(tag);
}

function normalizeTag(kind, tag) {
  if (kind === "vehicle" && /^offroad wheels$/i.test(String(tag))) return "Offroad";
  return tag;
}

function editableTagsFor(item) {
  return (item.tags || [])
    .map((tag) => normalizeTag(item.kind, tag))
    .filter((tag, index, tags) => tags.indexOf(tag) === index)
    .filter((tag) => !isMetadataTag(tag))
    .sort(sortText);
}

function customTagsFor(kind) {
  state.customTags = { ...EMPTY_TAG_STATE, ...(state.customTags || {}) };
  state.customTags[kind] = state.customTags[kind] || [];
  return state.customTags[kind];
}

function deletedTagsFor(kind) {
  state.deletedTags = { ...EMPTY_TAG_STATE, ...(state.deletedTags || {}) };
  state.deletedTags[kind] = state.deletedTags[kind] || [];
  return state.deletedTags[kind];
}

function rememberDeletedTag(kind, tag) {
  const cleaned = normalizeTag(kind, tag);
  const tags = deletedTagsFor(kind);
  if (!tags.some((entry) => entry.toLowerCase() === cleaned.toLowerCase())) tags.push(cleaned);
}

function forgetDeletedTag(kind, tag) {
  state.deletedTags = { ...EMPTY_TAG_STATE, ...(state.deletedTags || {}) };
  state.deletedTags[kind] = deletedTagsFor(kind).filter((entry) => entry.toLowerCase() !== normalizeTag(kind, tag).toLowerCase());
}

function tagWasDeleted(kind, tag) {
  const target = normalizeTag(kind, tag).toLowerCase();
  return deletedTagsFor(kind).some((entry) => entry.toLowerCase() === target);
}

function removeDeletedTagsFromItem(item) {
  if (!item?.tags?.length) return item;
  return {
    ...item,
    tags: item.tags.filter((tag) => !tagWasDeleted(item.kind, tag))
  };
}

function addCustomTag(kind, tag) {
  const cleaned = String(tag || "").trim();
  if (!cleaned) return false;
  forgetDeletedTag(kind, cleaned);
  const tags = customTagsFor(kind);
  if (tags.some((entry) => entry.toLowerCase() === cleaned.toLowerCase())) return false;
  tags.push(cleaned);
  tags.sort(sortText);
  return true;
}

function removeTagFromItem(item, tag) {
  const target = String(tag).toLowerCase();
  const before = item.tags || [];
  const after = before.filter((entry) => normalizeTag(item.kind, entry).toLowerCase() !== target);
  item.tags = after;
  if (after.length !== before.length) saveItemOverride(item);
}

function deleteTagEverywhere(kind, tag) {
  rememberDeletedTag(kind, tag);
  state.items = state.items.map((item) => item.kind === kind ? removeDeletedTagsFromItem(item) : item);
  state.customTags[kind] = customTagsFor(kind).filter((entry) => entry.toLowerCase() !== String(tag).toLowerCase());
}

function applySettingsTagDelete(kind, tag) {
  rememberDeletedTag(kind, tag);
  state.customTags[kind] = customTagsFor(kind).filter((entry) => entry.toLowerCase() !== String(tag).toLowerCase());
  state.items = state.items.map((item) => item.kind === kind ? removeDeletedTagsFromItem(item) : item);
  return saveState();
}

function submitSettingsTag(form) {
  const kind = form.dataset.addSettingsTag;
  const input = form.elements.tag;
  if (!kind || !input) return;
  const added = addCustomTag(kind, input.value);
  if (!added) return;
  if (!saveState()) return;
  input.value = "";
  renderAll();
}

function getWeaponCategory(item) {
  const text = `${item.name} ${item.code} ${(item.tags || []).join(" ")}`.toLowerCase();
  const manualCategory = (item.tags || []).find((tag) => WEAPON_CATEGORIES.includes(String(tag).toUpperCase()));
  if (manualCategory) return manualCategory.toUpperCase();
  if (/\b(knife|bat|club|hammer|hatchet|machete|wrench|crowbar|bottle|knuckle|nightstick|battleaxe|pool cue|golf club|dagger|axe|brick|candy cane|sledgehammer|flashlight)\b/.test(text)) return "MELEE";
  if (/\b(grenade|molotov|sticky|pipe bomb|pipebomb|mine|bz gas|tear gas|snowball|ball)\b/.test(text)) return "THROWABLES";
  if (/\b(rpg|rocket|launcher|minigun|railgun|widowmaker|cannon|missile|mg|machine gun|combat mg|pkm|rpk)\b/.test(text)) return "HEAVY";
  if (/\b(shotgun|mossberg|remington|sawn|sawed|winchester|bean bag)\b/.test(text)) return "SHOTGUNS";
  if (/\b(smg|pdw|p90|mp5|mp40|tec-9|tec9|uzi|mac-10|mac-11|skorpion|ump)\b/.test(text)) return "SMGS";
  if (/\b(pistol|revolver|glock|beretta|deagle|five seven|fn 509|m1911|tokarev|python|colt|p226|p88|m9)\b/.test(text)) return "PISTOLS";
  if (/\b(rifle|carbine|ak|m4|m16|mk18|g36|scar|fal|l96|mosin|sniper|marksman|gusenberg|m14)\b/.test(text)) return "RIFLES";
  return "OTHER";
}

function categoriesFor(type) {
  if (activeTab === "favorites") {
    return [
      ["Objects", favoriteItems().filter((item) => item.kind === "object").length],
      ["Items", favoriteItems().filter((item) => item.kind === "item").length],
      ["Vehicles", favoriteItems().filter((item) => item.kind === "vehicle").length],
      ["Weapons", favoriteItems().filter((item) => item.kind === "weapon").length]
    ].filter(([, count]) => count > 0);
  }

  if (type === "item" || type === "weapon") {
    const baseCategories = (type === "item" ? ITEM_CATEGORIES : WEAPON_CATEGORIES).filter((category) => !tagWasDeleted(type, category));
    const base = baseCategories
      .map((category) => [category, state.items.filter((item) => item.kind === type && getUsefulCategory(item) === category).length])
      .filter(([, count]) => type === "item" || count > 0)
      .sort(([a], [b]) => sortText(displayCategory(type, a), displayCategory(type, b)));
    customTagsFor(type).forEach((tag) => {
      if (tagWasDeleted(type, tag)) return;
      if (!base.some(([category]) => category.toLowerCase() === tag.toLowerCase())) base.push([tag, 0]);
    });
    return base.sort(([a], [b]) => sortText(displayCategory(type, a), displayCategory(type, b)));
  }

  const counts = new Map();
  state.items.filter((item) => item.kind === type).forEach((item) => {
    const category = getUsefulCategory(item);
    if (tagWasDeleted(type, category)) return;
    counts.set(category, (counts.get(category) || 0) + 1);
  });
  customTagsFor(type).forEach((tag) => {
    if (tagWasDeleted(type, tag)) return;
    if (!counts.has(tag)) counts.set(tag, 0);
  });
  return [...counts.entries()].sort(([a], [b]) => sortText(a, b));
}

function addItemCategoriesFor(kind) {
  const categoryNames = allTagCountsFor(kind).map(([category]) => category);
  if (!categoryNames.length) return ["Unsorted"];

  if (kind === "weapon") {
    return categoryNames.sort((a, b) => sortText(displayWeaponCategory(a), displayWeaponCategory(b)));
  }

  return categoryNames.sort(sortText);
}

function renderCustomCategorySelect(selectedTag = "") {
  const kind = els.itemForm.elements.kind.value;
  const categories = addItemCategoriesFor(kind);
  els.customCategory.innerHTML = categories.map((category) => {
    return `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
  }).join("");
  els.customCategory.value = selectedTag && categories.includes(selectedTag) ? selectedTag : categories[0] || "";
}

function resetImageUploadLabel(text = "Drop an image here, paste one, or choose from your computer") {
  if (els.imageFileName) els.imageFileName.textContent = text;
}

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const image = new Image();
      image.addEventListener("load", () => {
        const maxSize = 520;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      });
      image.addEventListener("error", () => resolve(reader.result));
      image.src = reader.result;
    });
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function attachImageFile(file, source = "Selected") {
  if (!file || !file.type.startsWith("image/")) return;
  pendingImageData = await readImageFile(file);
  els.itemForm.elements.image.value = "";
  resetImageUploadLabel(`${source}: ${file.name || "clipboard image"}`);
}

function openAddItemDialog() {
  editingItemId = "";
  pendingImageData = "";
  els.itemTitle.textContent = "Add custom item";
  els.itemForm.reset();
  els.itemForm.elements.kind.disabled = false;
  els.itemDelete.classList.add("is-hidden");
  resetImageUploadLabel();
  renderCustomCategorySelect();
  els.itemDialog.showModal();
}

function openItemEditor(item) {
  editingItemId = item.id;
  pendingImageData = "";
  const currentImage = imageSourceFor(item);
  els.itemTitle.textContent = `Edit ${item.name}`;
  els.itemForm.reset();
  els.itemForm.elements.name.value = item.name || "";
  els.itemForm.elements.code.value = item.code || "";
  els.itemForm.elements.kind.value = item.kind || "object";
  els.itemForm.elements.kind.disabled = false;
  els.itemForm.elements.image.value = currentImage && !String(currentImage).startsWith("data:") ? currentImage : "";
  els.itemForm.elements.price.value = item.price || "";
  els.itemForm.elements.notes.value = item.notes || "";
  els.itemDelete.classList.remove("is-hidden");
  resetImageUploadLabel(currentImage ? "Current image saved. Drop, paste, or choose to replace it." : undefined);
  renderCustomCategorySelect(getUsefulCategory(item));
  els.itemDialog.showModal();
}

async function deleteItemById(itemId) {
  const item = state.items.find((entry) => entry.id === itemId);
  if (!item || !confirm(`Delete ${item.name}?`)) return false;

  const deletedCategory = getUsefulCategory(item);
  const previousItems = state.items;
  const previousCustomItems = state.customItems || [];
  const previousOverrides = { ...(state.itemOverrides || {}) };
  const previousDeletedItemIds = [...(state.deletedItemIds || [])];
  const previousLists = state.lists.map((list) => ({ ...list, itemIds: [...list.itemIds] }));
  const previousFavoritesByUser = Object.fromEntries(Object.entries(state.favoritesByUser || {}).map(([key, ids]) => [key, [...ids]]));

  state.deletedItemIds = state.deletedItemIds || [];
  if (!state.deletedItemIds.includes(item.id)) state.deletedItemIds.push(item.id);
  state.items = state.items.filter((entry) => entry.id !== item.id);
  state.customItems = (state.customItems || []).filter((entry) => entry.id !== item.id);
  if (state.itemOverrides) delete state.itemOverrides[item.id];
  state.lists.forEach((list) => list.itemIds = list.itemIds.filter((id) => id !== item.id));
  Object.values(state.favoritesByUser || {}).forEach((ids) => {
    const favoriteIndex = ids.indexOf(item.id);
    if (favoriteIndex !== -1) ids.splice(favoriteIndex, 1);
  });

  if (!saveState()) {
    state.items = previousItems;
    state.customItems = previousCustomItems;
    state.itemOverrides = previousOverrides;
    state.deletedItemIds = previousDeletedItemIds;
    state.lists = previousLists;
    state.favoritesByUser = previousFavoritesByUser;
    return false;
  }

  await deleteStoredImage(item.id);
  renderAll({ keepMissingCategory: activeCategory === deletedCategory });
  return true;
}

function filteredItems() {
  const type = itemType();
  const search = els.search.value.trim().toLowerCase();
  const source = activeTab === "favorites" ? favoriteItems() : state.items;
  return sortItemsByName(source.filter((item) => {
    if (activeTab !== "favorites" && item.kind !== type) return false;
    if (activeTab === "favorites" && activeCategory !== "All" && `${item.kind}s` !== activeCategory.toLowerCase()) return false;
    if (activeTab !== "favorites" && activeCategory !== "All" && getUsefulCategory(item) !== activeCategory) return false;
    if (!search) return true;
    return `${item.name} ${item.code} ${(item.tags || []).join(" ")} ${item.notes || ""}`.toLowerCase().includes(search);
  }));
}

function favoriteItems() {
  const ids = favoriteIds();
  return ids.map((id) => state.items.find((item) => item.id === id)).filter(Boolean);
}

function renderCategories(options = {}) {
  const type = itemType();
  const categories = categoriesFor(type);
  const availableCategories = categories.map(([category]) => category);
  if (!options.keepMissingCategory && activeCategory !== "All" && !availableCategories.includes(activeCategory)) {
    activeCategory = "All";
  }

  const chipMode = activeTab === "items" || activeTab === "vehicles" || activeTab === "weapons";
  els.categories.classList.toggle("is-hidden", chipMode);
  els.categoryChips.classList.toggle("is-hidden", !chipMode);

  if (chipMode) {
    els.categoryChips.innerHTML = [
      `<button class="${activeCategory === "All" ? "active" : ""}" data-category-chip="All" type="button">All</button>`,
      ...categories.map(([category]) => {
        return `<button class="${activeCategory === category ? "active" : ""}" data-category-chip="${escapeHtml(category)}" type="button">${escapeHtml(displayCategory(type, category))}</button>`;
      })
    ].join("");
    return;
  }

  els.categories.innerHTML = [
    `<option value="All">All categories</option>`,
    ...(activeCategory !== "All" && !availableCategories.includes(activeCategory)
      ? [`<option value="${escapeHtml(activeCategory)}">${escapeHtml(activeCategory)} (0)</option>`]
      : []),
    ...categories.map(([category, count]) => {
      return `<option value="${escapeHtml(category)}">${escapeHtml(category)} (${count})</option>`;
    })
  ].join("");
  els.categories.value = activeCategory;
}

function displayWeaponCategory(category) {
  return {
    HEAVY: "Heavy",
    SMGS: "SMGs",
    THROWABLES: "Throwables",
    MELEE: "Melee",
    OTHER: "Other",
    PISTOLS: "Pistols",
    SHOTGUNS: "Shotguns",
    RIFLES: "Rifles"
  }[category] || category;
}

function displayCategory(kind, category) {
  return kind === "weapon" ? displayWeaponCategory(category) : category;
}

function renderCard(item, options = {}) {
  const listButton = state.lists.length
    ? `<button data-add-to-list="${escapeHtml(item.id)}" type="button">+ List</button>`
    : "";
  const editTagsButton = item.kind === "object" || item.kind === "item" || item.kind === "vehicle" || item.kind === "weapon"
    ? `<button data-edit-item="${escapeHtml(item.id)}" type="button">Edit</button>`
    : "";
  const thumb = renderThumb(item);
  const price = item.kind === "item" && item.price ? `<span class="card-price">$${escapeHtml(item.price)}</span>` : "";
  return `
    <article class="card ${item.kind === "weapon" ? "weapon-card" : ""} ${item.kind === "item" ? "item-card" : ""} ${item.blacklisted ? "is-blacklisted" : ""}" data-item-id="${escapeHtml(item.id)}">
      <button class="favorite-button ${isFavorite(item.id) ? "active" : ""}" data-toggle-favorite="${escapeHtml(item.id)}" type="button" aria-label="${isFavorite(item.id) ? "Remove favorite" : "Add favorite"}">&#9733;</button>
      ${thumb}
      <h3>${escapeHtml(item.name)}</h3>
      <div class="card-code">${escapeHtml(item.code)}</div>
      <div class="tag-row">
        ${visibleTags(item).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        ${price}
      </div>
      ${options.removeFromList ? `<div class="card-actions"><button class="card-remove" data-remove-from-list="${escapeHtml(item.id)}" type="button">Remove</button></div>` : ""}
      <div class="card-bottom-actions">
        <button class="flag-button ${item.blacklisted ? "active" : ""}" data-toggle-blacklist="${escapeHtml(item.id)}" type="button" aria-label="${item.blacklisted ? "Remove blacklist" : "Mark blacklisted"}">⚑</button>
        ${editTagsButton}
        ${options.removeFromList ? "" : listButton}
      </div>
    </article>
  `;
}

function visibleTags(item) {
  if (item.kind === "weapon") {
    const category = getWeaponCategory(item);
    return tagWasDeleted(item.kind, category) ? [] : [category];
  }

  if (item.kind === "item") {
    const category = getUsefulCategory(item);
    return tagWasDeleted(item.kind, category) ? [] : [category];
  }

  return editableTagsFor(item).slice(0, 3);
}

function renderThumb(item) {
  if (item.kind === "weapon" || item.kind === "item") {
    return "";
  }

  const image = imageSourceFor(item);
  if (image) {
    return `<img class="thumb" src="${escapeHtml(image)}" alt="${escapeHtml(item.name)}" loading="lazy" />`;
  }

  return `<div class="thumb no-thumb">No image</div>`;
}

function openTagEditor(item) {
  editingTagItemId = item.id;
  editingTags = item.kind === "item" || item.kind === "weapon" || item.kind === "vehicle" ? [getUsefulCategory(item)] : editableTagsFor(item);
  els.tagTitle.textContent = `Edit tags - ${item.name}`;

  if (item.kind === "item" || item.kind === "weapon" || item.kind === "vehicle") {
    els.tagAddRow.classList.add("is-hidden");
    els.tagAdd.classList.add("is-hidden");
  } else {
    els.tagAddRow.classList.remove("is-hidden");
    els.tagAdd.classList.remove("is-hidden");
    els.tagInput.value = "";
  }

  renderTagEditor();
  els.tagDialog.showModal();
}

function renderTagEditor() {
  const item = state.items.find((entry) => entry.id === editingTagItemId);
  if (item?.kind === "item" || item?.kind === "weapon" || item?.kind === "vehicle") {
    const categories = item.kind === "weapon" ? WEAPON_CATEGORIES : item.kind === "item" ? ITEM_CATEGORIES : VEHICLE_CATEGORIES;
    const selected = editingTags[0] || categories[0];
    els.tagEditor.innerHTML = categories.map((category) => {
      return `<button class="tag-choice ${category === selected ? "active" : ""}" data-pick-category-tag="${escapeHtml(category)}" type="button">${escapeHtml(displayCategory(item.kind, category))}</button>`;
    }).join("");
    return;
  }

  if (!editingTags.length) {
    els.tagEditor.innerHTML = `<span class="muted">No tags yet</span>`;
    return;
  }

  els.tagEditor.innerHTML = editingTags.map((tag) => {
    return `
      <span class="editable-tag">
        ${escapeHtml(tag)}
        <button data-remove-tag="${escapeHtml(tag)}" type="button" aria-label="Remove ${escapeHtml(tag)}">x</button>
      </span>
    `;
  }).join("");
}

function addEditingTag() {
  const tag = els.tagInput.value.trim();
  if (!tag || editingTags.some((entry) => entry.toLowerCase() === tag.toLowerCase())) return;
  editingTags.push(tag);
  els.tagInput.value = "";
  renderTagEditor();
}

function saveEditedTags() {
  const item = state.items.find((entry) => entry.id === editingTagItemId);
  if (!item) return;
  item.tags = item.kind === "weapon" ? [editingTags[0] || "OTHER"] : item.kind === "item" ? [editingTags[0] || ITEM_CATEGORIES[0]] : item.kind === "vehicle" ? [editingTags[0] || VEHICLE_CATEGORIES[0]] : [...editingTags];
  saveItemOverride(item);
  saveState();
  renderAll();
}

function renderBrowser() {
  const items = filteredItems();
  const visible = items.slice(0, renderLimit);
  els.title.textContent = activeTab[0].toUpperCase() + activeTab.slice(1);
  els.results.textContent = `${items.length.toLocaleString()} items`;
  els.grid.innerHTML = visible.map((item) => renderCard(item)).join("");
  if (items.length > visible.length) {
    els.grid.insertAdjacentHTML("beforeend", `<button class="load-more-card" data-load-more type="button">Load more (${(items.length - visible.length).toLocaleString()} left)</button>`);
  }
}

function renderCounts() {
  ["object", "item", "vehicle", "weapon"].forEach((kind) => {
    const target = document.querySelector(`[data-count="${kind}"]`);
    if (target) target.textContent = state.items.filter((item) => item.kind === kind).length.toLocaleString();
  });
  document.querySelector("[data-count='favorites']").textContent = favoriteItems().length.toLocaleString();
  document.querySelector("[data-count='lists']").textContent = state.lists.length;
}

function ensureActiveList() {
  if (activeListId && state.lists.some((list) => list.id === activeListId)) return;
  activeListId = state.lists[0]?.id || "";
}

function renderLists() {
  ensureActiveList();
  els.listMenu.innerHTML = [...state.lists].sort((a, b) => sortText(a.name, b.name)).map((list) => {
    return `<button class="list-row ${list.id === activeListId ? "active" : ""}" data-select-list="${list.id}" type="button"><span>${escapeHtml(list.name)}</span><span>${list.itemIds.length}</span></button>`;
  }).join("");

  const list = state.lists.find((entry) => entry.id === activeListId);
  if (!list) {
    els.listTitle.textContent = "No list selected";
    els.listSubtitle.textContent = "Create or select a list";
    els.listItems.innerHTML = "";
    return;
  }

  const search = els.listSearch.value.trim().toLowerCase();
  const items = sortItemsByName(list.itemIds
    .map((id) => state.items.find((item) => item.id === id))
    .filter(Boolean)
    .filter((item) => !search || `${item.name} ${item.code} ${(item.tags || []).join(" ")}`.toLowerCase().includes(search)));

  els.listTitle.textContent = list.name;
  els.listSubtitle.textContent = `${list.itemIds.length} items - created by ${list.createdBy || "Events Team"}`;
  els.listItems.innerHTML = items.map((item) => renderCard(item, { removeFromList: true })).join("");
}

function itemPrice(item) {
  return Number(String(item.price || "").replace(/[^\d]/g, "")) || 0;
}

function isCriminalItem(item) {
  return (item.tags || []).some((tag) => CRIMINAL_ITEM_TAGS.has(String(tag).trim().toLowerCase()));
}

function rewardCandidates(allowCriminal) {
  return state.items
    .filter((item) => item.kind === "item" && !item.blacklisted && itemPrice(item) > 0)
    .filter((item) => allowCriminal || !isCriminalItem(item))
    .map((item) => ({ item, price: itemPrice(item) }))
    .sort((a, b) => sortText(a.item.name, b.item.name));
}

function pickRewardItems(targetValue, allowCriminal) {
  const candidates = rewardCandidates(allowCriminal);
  if (!candidates.length) return { items: [], total: 0 };

  let best = [];
  let bestTotal = 0;
  const upperLimit = Math.max(targetValue * 1.12, targetValue + 100);
  const attempts = Math.min(240, Math.max(60, candidates.length * 4));

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const picked = [];
    let total = 0;

    shuffled.forEach((entry) => {
      if (total + entry.price <= upperLimit && (total < targetValue || Math.random() > 0.55)) {
        picked.push(entry.item);
        total += entry.price;
      }
    });

    if (!best.length || Math.abs(targetValue - total) < Math.abs(targetValue - bestTotal)) {
      best = picked;
      bestTotal = total;
    }
  }

  if (!best.length) {
    const closest = candidates.reduce((winner, entry) => Math.abs(entry.price - targetValue) < Math.abs(winner.price - targetValue) ? entry : winner, candidates[0]);
    best = [closest.item];
    bestTotal = closest.price;
  }

  return { items: sortItemsByName(best), total: bestTotal };
}

function createRewardBox(targetValue, allowCriminal) {
  const picked = pickRewardItems(targetValue, allowCriminal);
  if (!picked.items.length) {
    alert("No priced items are available for that reward box.");
    return;
  }

  const user = currentUser();
  const list = {
    id: crypto.randomUUID(),
    name: `Reward Box $${targetValue.toLocaleString()}`,
    createdBy: user?.name || "Events Team",
    itemIds: picked.items.map((item) => item.id)
  };

  state.lists.unshift(list);
  activeListId = list.id;
  saveState();
  setTab("lists");
  els.rewardSummary.textContent = `${picked.items.length} items picked - total $${picked.total.toLocaleString()}`;
}

function renderFavorites() {
  if (activeTab !== "favorites") return;

  const groups = [
    ["Objects", "object"],
    ["Items", "item"],
    ["Vehicles", "vehicle"],
    ["Weapons", "weapon"]
  ];
  const favorites = favoriteItems();
  const activeGroup = groups.some(([label]) => label === activeCategory) ? activeCategory : "Objects";
  if (activeCategory !== activeGroup) activeCategory = activeGroup;

  els.favoriteMenu.innerHTML = groups.map(([label, kind]) => {
    const count = favorites.filter((item) => item.kind === kind).length;
    return `<button class="list-row ${label === activeCategory ? "active" : ""}" data-favorite-category="${label}" type="button"><span>${label}</span><span>${count}</span></button>`;
  }).join("");

  const selectedKind = groups.find(([label]) => label === activeCategory)?.[1] || "object";
  const search = els.favoriteSearch.value.trim().toLowerCase();
  const items = favorites
    .filter((item) => item.kind === selectedKind)
    .filter((item) => !search || `${item.name} ${item.code} ${(item.tags || []).join(" ")} ${visibleTags(item).join(" ")}`.toLowerCase().includes(search));
  const sortedItems = sortItemsByName(items);

  els.favoriteTitle.textContent = activeCategory;
  els.favoriteResults.textContent = `${sortedItems.length.toLocaleString()} items`;
  els.favoriteItems.innerHTML = sortedItems.map((item) => renderCard(item)).join("");
}

function allTagCountsFor(kind) {
  const counts = new Map();
  if (kind === "item") {
    ITEM_CATEGORIES.filter((category) => !tagWasDeleted("item", category)).forEach((category) => {
      counts.set(category, state.items.filter((item) => item.kind === "item" && getUsefulCategory(item) === category).length);
    });
    customTagsFor("item").forEach((tag) => {
      if (tagWasDeleted("item", tag)) return;
      if (!counts.has(tag)) counts.set(tag, 0);
    });
    return [...counts.entries()]
      .filter(([tag, count]) => count > 0 || customTagsFor("item").some((entry) => entry.toLowerCase() === tag.toLowerCase()))
      .sort(([a], [b]) => sortText(a, b));
  }

  if (kind === "weapon") {
    WEAPON_CATEGORIES.filter((category) => !tagWasDeleted("weapon", category)).forEach((category) => {
      counts.set(category, state.items.filter((item) => item.kind === "weapon" && getWeaponCategory(item) === category).length);
    });
    customTagsFor("weapon").forEach((tag) => {
      if (tagWasDeleted("weapon", tag)) return;
      if (!counts.has(tag)) counts.set(tag, 0);
    });
    return [...counts.entries()]
      .filter(([tag, count]) => count > 0 || customTagsFor("weapon").some((entry) => entry.toLowerCase() === tag.toLowerCase()))
      .sort(([a], [b]) => sortText(displayWeaponCategory(a), displayWeaponCategory(b)));
  }

  state.items.filter((item) => item.kind === kind).forEach((item) => {
    (item.tags || []).forEach((tag) => {
      const normalizedTag = normalizeTag(kind, tag);
      if (tagWasDeleted(kind, normalizedTag)) return;
      if (!isMetadataTag(normalizedTag)) counts.set(normalizedTag, (counts.get(normalizedTag) || 0) + 1);
    });
  });
  customTagsFor(kind).forEach((tag) => {
    if (tagWasDeleted(kind, tag)) return;
    if (!counts.has(tag)) counts.set(tag, 0);
  });
  return [...counts.entries()].sort(([a], [b]) => sortText(a, b));
}

function renderSettings() {
  const sections = [
    ["object", "Objects"],
    ["item", "Items"],
    ["vehicle", "Vehicles"],
    ["weapon", "Weapons"]
  ];

  els.settingsPanels.innerHTML = sections.map(([kind, label]) => {
    const activeTags = allTagCountsFor(kind);
    return `
      <section class="settings-panel">
        <h3>${label}</h3>
        <form class="settings-add-tag" data-add-settings-tag="${kind}">
          <input name="tag" placeholder="Add tag..." />
          <button data-add-settings-tag-button type="button">Add tag</button>
        </form>
        <div class="settings-tags">
          ${activeTags.length ? activeTags.map(([tag, count]) => `
            <span class="settings-tag">
              ${escapeHtml(kind === "weapon" ? displayWeaponCategory(tag) : tag)}
              <small>${count.toLocaleString()}</small>
              <button data-delete-settings-tag="${escapeHtml(tag)}" data-tag-kind="${kind}" type="button" aria-label="Delete ${escapeHtml(tag)}">x</button>
            </span>
          `).join("") : `<span class="muted">No active tags</span>`}
        </div>
      </section>
    `;
  }).join("");
}

function renderAll(options = {}) {
  state.items = state.items.map(removeDeletedTagsFromItem);
  renderCounts();
  renderCategories(options);
  renderBrowser();
  renderFavorites();
  renderLists();
  renderSettings();
  renderTeamDirectory();
  renderMeetingDashboard();
}

function setTab(tab) {
  activeTab = tab;
  renderLimit = PAGE_SIZE;
  activeCategory = tab === "favorites" ? "Objects" : "All";
  els.tabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  els.search.placeholder = {
    objects: "Search objects...",
    items: "Search items...",
    vehicles: "Search vehicles...",
    weapons: "Search weapons...",
    favorites: "Search favorites..."
  }[tab] || "Search names, spawn codes, categories...";
  const listMode = tab === "lists";
  const settingsMode = tab === "settings";
  const favoriteMode = tab === "favorites";
  const meetingsMode = tab === "meetings";
  els.toolbar.classList.toggle("is-hidden", listMode || settingsMode || favoriteMode || meetingsMode);
  els.browser.classList.toggle("is-hidden", listMode || settingsMode || favoriteMode || meetingsMode);
  els.favoritesView.classList.toggle("is-hidden", !favoriteMode);
  els.lists.classList.toggle("is-hidden", !listMode);
  els.meetings.classList.toggle("is-hidden", !meetingsMode);
  els.settings.classList.toggle("is-hidden", !settingsMode);
  if (meetingsMode) showMeetingView(meetingView);
  renderAll();
}

function setActiveButton(button, selector) {
  button.closest(".meeting-panel")?.querySelectorAll(selector).forEach((entry) => {
    entry.classList.toggle("active", entry === button);
  });
}

function filterMeetingRows(filter) {
  els.meetings.querySelectorAll("[data-meeting-status]").forEach((row) => {
    row.classList.toggle("is-hidden", filter !== "all" && row.dataset.meetingStatus !== filter);
  });
}

function filterTaskRows(filter) {
  els.meetings.querySelectorAll("[data-task-status]").forEach((row) => {
    const show = filter === "all" || (filter === "mine" && row.dataset.taskOwner === "mine") || (filter === "overdue" && row.dataset.taskStatus === "overdue");
    row.classList.toggle("is-hidden", !show);
  });
}

function formatMeetingDate(meeting) {
  const date = meeting.date ? new Date(`${meeting.date}T${meeting.time || "00:00"}`) : null;
  const dateText = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })
    : "No date";
  return `${dateText}${meeting.time ? ` - ${meeting.time}` : ""}`;
}

function meetingById(id) {
  return (state.meetings || []).find((meeting) => meeting.id === id);
}

function taskPill(status, complete = false) {
  if (complete) return `<span class="pill good">Done</span>`;
  if (status === "overdue") return `<span class="pill bad">Overdue</span>`;
  if (status === "progress") return `<span class="pill warn">In Progress</span>`;
  return `<span class="pill todo">To Do</span>`;
}

function renderMeetingSelect() {
  const meetings = normalizeMeetings(state.meetings || DEFAULT_MEETINGS);
  els.taskMeetingSelect.innerHTML = `<option value="">No linked meeting</option>${meetings.map((meeting) => (
    `<option value="${escapeHtml(meeting.id)}">${escapeHtml(meeting.name)}</option>`
  )).join("")}`;
}

function renderMeetingDashboard() {
  state.meetings = normalizeMeetings(state.meetings || DEFAULT_MEETINGS);
  state.tasks = normalizeTasks(state.tasks || DEFAULT_TASKS);
  const upcoming = state.meetings.find((meeting) => meeting.status === "upcoming") || state.meetings[0];

  els.upcomingMeeting.innerHTML = upcoming ? `
    <div class="upcoming-card">
      <div class="meeting-art"></div>
      <div>
        <h4>${escapeHtml(upcoming.name)}</h4>
        <p>${escapeHtml(formatMeetingDate(upcoming))}</p>
        <p>${escapeHtml(upcoming.location || "No location set")}</p>
        <small>${escapeHtml(upcoming.notes || "No notes yet.")}</small>
      </div>
      <div class="meeting-status">
        <span>Your Status <strong>Attending</strong></span>
        <span>Tasks <strong>${state.tasks.filter((task) => task.meetingId === upcoming.id).length}</strong></span>
        <button data-meeting-note="${escapeHtml(upcoming.id)}" type="button">View Meeting</button>
      </div>
    </div>
  ` : `<p class="muted">No meetings yet.</p>`;

  els.recentMeetings.innerHTML = state.meetings.map((meeting) => {
    const linkedTasks = state.tasks.filter((task) => task.meetingId === meeting.id);
    const doneTasks = linkedTasks.filter((task) => task.complete).length;
    const statusClass = meeting.status === "missed" ? "bad" : meeting.status === "unavailable" ? "warn" : "good";
    return `
      <tr data-meeting-status="${escapeHtml(meeting.status)}">
        <td>${escapeHtml(meeting.name)}</td>
        <td>${escapeHtml(formatMeetingDate(meeting))}</td>
        <td><span class="pill ${statusClass}">${escapeHtml(meeting.status === "upcoming" ? "Upcoming" : meeting.status)}</span></td>
        <td>-</td>
        <td>${doneTasks} / ${linkedTasks.length}</td>
        <td><button data-meeting-note="${escapeHtml(meeting.id)}" type="button">View</button></td>
      </tr>
    `;
  }).join("");

  els.taskList.innerHTML = state.tasks.map((task) => {
    const meeting = meetingById(task.meetingId);
    return `
      <li data-task-id="${escapeHtml(task.id)}" data-task-owner="${escapeHtml(task.owner)}" data-task-status="${escapeHtml(task.status)}" class="${task.complete ? "is-complete" : ""}">
        <input type="checkbox" ${task.complete ? "checked" : ""} />
        <span>${escapeHtml(task.name)}</span>
        ${taskPill(task.status, task.complete)}
        ${meeting ? `<small>${escapeHtml(meeting.name)}</small>` : ""}
      </li>
    `;
  }).join("");

  renderMeetingSelect();
}

function showMeetingView(view) {
  meetingView = view;
  els.meetingDashboard.classList.toggle("is-hidden", view !== "dashboard");
  els.teamDirectory.classList.toggle("is-hidden", view !== "team-directory");
  renderTeamDirectory();
  renderMeetingDashboard();
}

function renderTeamDirectory() {
  state.teamMembers = normalizeTeamMembers(state.teamMembers || DEFAULT_TEAM_MEMBERS);
  els.teamMemberCount.textContent = `${state.teamMembers.length} member${state.teamMembers.length === 1 ? "" : "s"}`;
  els.teamDirectoryGrid.innerHTML = state.teamMembers.map((name) => `
    <article class="team-member-card">
      <span>${escapeHtml(name)}</span>
      <button data-remove-team-member="${escapeHtml(name)}" type="button" aria-label="Remove ${escapeHtml(name)}">Remove</button>
    </article>
  `).join("");
}

function handleMeetingAction(action) {
  const user = currentUser()?.name || "you";
  const messages = {
    "view-upcoming": "Halloween Event Planning\nFriday, 30 May 2025 at 7:00 PM (BST)\nLocation: Event Room 1\nNotes: Discuss themes, activities, and staff roles.",
    "event-calendar": "Event Calendar view is ready for the next build. For now, upcoming meetings and recent meetings are shown on this page.",
    templates: "Templates & Resources\nMeeting notes, event plan checklist, attendance sheet, and task tracker.",
    "attendance-dashboard": "Attendance Dashboard\nLicora 96%, Kai 88%, Maya 83%, Jax 75%, Aria 63%, Ryn 50%, Nova 38%.",
    "full-archive": "Meeting Archive\n2025: 12 meetings\n2024: 18 meetings\n2023: 9 meetings"
  };

  if (action === "team-directory") {
    showMeetingView("team-directory");
    return;
  }

  if (action === "dashboard") {
    showMeetingView("dashboard");
    return;
  }

  if (action === "new-meeting") {
    els.meetingForm.reset();
    els.meetingDialog.showModal();
    return;
  }

  if (action === "new-task") {
    renderMeetingSelect();
    els.taskForm.reset();
    els.taskDialog.showModal();
    return;
  }

  if (action === "log-attendance") {
    const status = prompt("Attendance status", "Attended");
    if (!status) return;
    alert(`Attendance logged for ${user}: ${status}`);
    return;
  }

  alert(messages[action] || "This meeting tool is ready.");
}

els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(els.loginForm);
  if (String(formData.get("password") || "").trim() !== PASSWORD) {
    els.loginStatus.textContent = "Wrong password.";
    return;
  }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ name: formData.get("name") || "Events Team" }));
  showApp();
});

els.logout.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  location.reload();
});

els.tabs.forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.tab));
});

els.categories.addEventListener("change", () => {
  activeCategory = els.categories.value;
  renderLimit = PAGE_SIZE;
  renderAll();
});

els.categoryChips.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-category-chip]");
  if (!chip) return;
  activeCategory = chip.dataset.categoryChip;
  renderLimit = PAGE_SIZE;
  renderAll();
});

els.favoriteMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-favorite-category]");
  if (!button) return;
  activeCategory = button.dataset.favoriteCategory;
  renderAll();
});

els.settingsPanels.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-settings-tag-button]");
  if (addButton) {
    const form = addButton.closest("[data-add-settings-tag]");
    if (form) submitSettingsTag(form);
    return;
  }

  const deleteButton = event.target.closest("[data-delete-settings-tag]");
  if (deleteButton) {
    const kind = deleteButton.dataset.tagKind;
    const tag = deleteButton.dataset.deleteSettingsTag;
    if (!confirm(`Delete tag ${tag} from all ${kind}s?`)) return;
    if (!applySettingsTagDelete(kind, tag)) return;
    if (activeCategory === tag) activeCategory = "All";
    renderAll();
  }
});

els.settingsPanels.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-add-settings-tag]");
  if (!form) return;
  event.preventDefault();
  submitSettingsTag(form);
});

els.meetings.addEventListener("click", (event) => {
  const removeMember = event.target.closest("[data-remove-team-member]");
  if (removeMember) {
    const name = removeMember.dataset.removeTeamMember;
    if (!confirm(`Remove ${name} from the team directory?`)) return;
    state.teamMembers = normalizeTeamMembers((state.teamMembers || []).filter((member) => member !== name));
    saveState();
    renderTeamDirectory();
    return;
  }

  const meetingFilter = event.target.closest("[data-meeting-filter]");
  if (meetingFilter) {
    setActiveButton(meetingFilter, "[data-meeting-filter]");
    filterMeetingRows(meetingFilter.dataset.meetingFilter);
    return;
  }

  const taskFilter = event.target.closest("[data-task-filter]");
  if (taskFilter) {
    setActiveButton(taskFilter, "[data-task-filter]");
    filterTaskRows(taskFilter.dataset.taskFilter);
    return;
  }

  const action = event.target.closest("[data-meeting-action]");
  if (action) {
    handleMeetingAction(action.dataset.meetingAction);
    return;
  }

  const note = event.target.closest("[data-meeting-note]");
  if (note) {
    const meeting = meetingById(note.dataset.meetingNote);
    if (meeting) alert(`${meeting.name}\n${formatMeetingDate(meeting)}\n${meeting.location || "No location set"}\n\n${meeting.notes || "No notes yet."}`);
    return;
  }

  const archive = event.target.closest("[data-meeting-archive]");
  if (archive) {
    alert(`${archive.dataset.meetingArchive} archive selected.`);
  }
});

els.teamMemberForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = String(new FormData(els.teamMemberForm).get("name") || "").trim();
  if (!name) return;
  state.teamMembers = normalizeTeamMembers([...(state.teamMembers || []), name]);
  saveState();
  els.teamMemberForm.reset();
  renderTeamDirectory();
});

document.querySelector("[data-close-meeting-dialog]").addEventListener("click", () => {
  els.meetingDialog.close();
});

document.querySelector("[data-close-task-dialog]").addEventListener("click", () => {
  els.taskDialog.close();
});

els.meetingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(els.meetingForm).entries());
  const meeting = {
    id: `meeting:${crypto.randomUUID()}`,
    name: String(form.name || "").trim(),
    date: form.date || "",
    time: form.time || "",
    location: form.location || "",
    notes: form.notes || "",
    status: "upcoming"
  };
  if (!meeting.name) return;
  state.meetings = normalizeMeetings([...(state.meetings || []), meeting]);
  saveState();
  els.meetingDialog.close();
  renderMeetingDashboard();
});

els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(els.taskForm).entries());
  const task = {
    id: `task:${crypto.randomUUID()}`,
    name: String(form.name || "").trim(),
    description: form.description || "",
    dueDate: form.dueDate || "",
    meetingId: form.meetingId || "",
    owner: "mine",
    status: "todo",
    complete: false
  };
  if (!task.name) return;
  state.tasks = normalizeTasks([...(state.tasks || []), task]);
  saveState();
  els.taskDialog.close();
  renderMeetingDashboard();
});

els.meetings.addEventListener("change", (event) => {
  const checkbox = event.target.closest(".task-list input[type='checkbox']");
  if (!checkbox) return;
  const task = checkbox.closest("li");
  task?.classList.toggle("is-complete", checkbox.checked);
  const savedTask = state.tasks.find((entry) => entry.id === task?.dataset.taskId);
  if (savedTask) {
    savedTask.complete = checkbox.checked;
    saveState();
    renderMeetingDashboard();
  }
});

[els.search, els.listSearch, els.favoriteSearch].forEach((input) => {
  input.addEventListener("input", () => {
    renderLimit = PAGE_SIZE;
    renderAll();
  });
});

document.addEventListener("click", async (event) => {
  const loadMore = event.target.closest("[data-load-more]");
  if (loadMore) {
    event.preventDefault();
    event.stopPropagation();
    const itemCount = filteredItems().length;
    renderLimit = Math.min(itemCount, renderLimit + PAGE_SIZE);
    renderAll();
    return;
  }

  const card = event.target.closest("[data-item-id]");
  const action = event.target.closest("button, input, select, textarea, a");
  if (card && !action) {
    const item = state.items.find((entry) => entry.id === card.dataset.itemId);
    if (!item) return;
    await navigator.clipboard.writeText(item.code);
    card.classList.add("copied");
    setTimeout(() => card.classList.remove("copied"), 700);
    return;
  }

  const favorite = event.target.closest("[data-toggle-favorite]");
  if (favorite) {
    toggleFavorite(favorite.dataset.toggleFavorite);
    renderAll();
    return;
  }

  const blacklist = event.target.closest("[data-toggle-blacklist]");
  if (blacklist) {
    const item = state.items.find((entry) => entry.id === blacklist.dataset.toggleBlacklist);
    if (!item) return;
    item.blacklisted = !item.blacklisted;
    saveItemOverride(item);
    saveState();
    renderAll();
    return;
  }

  const deleteItem = event.target.closest("[data-delete-item]");
  if (deleteItem) {
    await deleteItemById(deleteItem.dataset.deleteItem);
    return;
  }

  const editItem = event.target.closest("[data-edit-item]");
  if (editItem) {
    const item = state.items.find((entry) => entry.id === editItem.dataset.editItem);
    if (!item) return;
    openItemEditor(item);
    return;
  }

  const addToList = event.target.closest("[data-add-to-list]");
  if (addToList) {
    ensureActiveList();
    const list = state.lists.find((entry) => entry.id === activeListId);
    if (list && !list.itemIds.includes(addToList.dataset.addToList)) list.itemIds.push(addToList.dataset.addToList);
    saveState();
    renderAll();
    return;
  }

  const removeFromList = event.target.closest("[data-remove-from-list]");
  if (removeFromList) {
    const list = state.lists.find((entry) => entry.id === activeListId);
    if (list) list.itemIds = list.itemIds.filter((id) => id !== removeFromList.dataset.removeFromList);
    saveState();
    renderAll();
    return;
  }

});

document.querySelector("[data-open-add]").addEventListener("click", openAddItemDialog);
document.querySelector("[data-close-dialog]").addEventListener("click", () => els.itemDialog.close());
els.itemDelete.addEventListener("click", async () => {
  if (!editingItemId) return;
  const deleted = await deleteItemById(editingItemId);
  if (!deleted) return;
  editingItemId = "";
  pendingImageData = "";
  els.itemDialog.close();
});
els.itemForm.elements.kind.addEventListener("change", () => renderCustomCategorySelect());
els.itemForm.elements.imageFile.addEventListener("change", async () => {
  await attachImageFile(els.itemForm.elements.imageFile.files?.[0], "Uploaded");
});

["dragenter", "dragover"].forEach((eventName) => {
  els.imageDrop.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.imageDrop.classList.add("drag-over");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  els.imageDrop.addEventListener(eventName, (event) => {
    event.preventDefault();
    els.imageDrop.classList.remove("drag-over");
  });
});

els.imageDrop.addEventListener("drop", async (event) => {
  await attachImageFile(event.dataTransfer.files?.[0], "Dropped");
});

document.addEventListener("paste", async (event) => {
  if (!els.itemDialog.open) return;
  const file = [...(event.clipboardData?.files || [])].find((entry) => entry.type.startsWith("image/"));
  if (!file) return;
  event.preventDefault();
  await attachImageFile(file, "Pasted");
});

els.tagCancel.addEventListener("click", () => els.tagDialog.close());
els.tagAdd.addEventListener("click", addEditingTag);
els.tagInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addEditingTag();
  }
});
els.tagEditor.addEventListener("click", (event) => {
  const categoryChoice = event.target.closest("[data-pick-category-tag]");
  if (categoryChoice) {
    editingTags = [categoryChoice.dataset.pickCategoryTag];
    renderTagEditor();
    return;
  }

  const removeButton = event.target.closest("[data-remove-tag]");
  if (!removeButton) return;
  editingTags = editingTags.filter((tag) => tag !== removeButton.dataset.removeTag);
  renderTagEditor();
});
els.tagForm.addEventListener("submit", (event) => {
  event.preventDefault();
  saveEditedTags();
  els.tagDialog.close();
});

els.itemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(els.itemForm).entries());
  const existingItem = editingItemId ? state.items.find((item) => item.id === editingItemId) : null;
  const uploadedFile = els.itemForm.elements.imageFile.files?.[0];
  if (uploadedFile) await attachImageFile(uploadedFile, "Uploaded");

  if (existingItem) {
    existingItem.kind = form.kind;
    existingItem.name = form.name;
    existingItem.code = form.code;
    if (pendingImageData) {
      existingItem.image = await saveStoredImage(existingItem.id, pendingImageData) ? `idb:${existingItem.id}` : "";
    } else if (form.image) {
      existingItem.image = form.image;
      await deleteStoredImage(existingItem.id);
    } else {
      existingItem.image = existingItem.image || "";
    }
    existingItem.tags = form.tags ? [form.tags] : [];
    existingItem.price = form.price ? String(form.price).replace(/[^\d]/g, "") : "";
    existingItem.notes = form.notes || "";
    saveItemOverride(existingItem);
  } else {
    const id = `custom:${crypto.randomUUID()}`;
    let image = form.image || "";
    if (pendingImageData) image = await saveStoredImage(id, pendingImageData) ? `idb:${id}` : "";
    const item = {
      id,
      kind: form.kind,
      name: form.name,
      code: form.code,
      dlc: "Custom",
      image,
      tags: form.tags ? [form.tags] : [],
      blacklisted: false,
      price: form.price ? String(form.price).replace(/[^\d]/g, "") : "",
      notes: form.notes || ""
    };
    state.items.unshift(item);
    state.customItems = state.customItems || [];
    state.customItems.unshift(item);
  }

  saveState();
  const targetTab = { object: "objects", item: "items", vehicle: "vehicles", weapon: "weapons" }[form.kind];
  els.itemForm.reset();
  editingItemId = "";
  pendingImageData = "";
  resetImageUploadLabel();
  renderCustomCategorySelect();
  els.itemDialog.close();
  setTab(targetTab);
});

document.querySelector("[data-new-list]").addEventListener("click", () => {
  const name = prompt("List name");
  if (!name) return;
  const user = currentUser();
  const list = { id: crypto.randomUUID(), name, createdBy: user?.name || "Events Team", itemIds: [] };
  state.lists.unshift(list);
  activeListId = list.id;
  saveState();
  setTab("lists");
});

document.querySelector("[data-open-reward-box]").addEventListener("click", () => {
  els.rewardForm.reset();
  els.rewardSummary.textContent = "Uses priced items only.";
  els.rewardDialog.showModal();
});

document.querySelector("[data-close-reward-dialog]").addEventListener("click", () => {
  els.rewardDialog.close();
});

els.rewardForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(els.rewardForm).entries());
  const targetValue = Number(String(form.value || "").replace(/[^\d]/g, "")) || 0;
  if (targetValue <= 0) {
    els.rewardSummary.textContent = "Enter a value higher than $0.";
    return;
  }

  createRewardBox(targetValue, Boolean(form.criminal));
  els.rewardDialog.close();
});

els.listMenu.addEventListener("click", (event) => {
  const button = event.target.closest("[data-select-list]");
  if (!button) return;
  activeListId = button.dataset.selectList;
  renderLists();
});

document.querySelector("[data-copy-list]").addEventListener("click", async () => {
  const list = state.lists.find((entry) => entry.id === activeListId);
  if (!list) return;
  const lines = list.itemIds.map((id) => state.items.find((item) => item.id === id)).filter(Boolean).map((item) => item.code);
  await navigator.clipboard.writeText(lines.join("\n"));
});

document.querySelector("[data-delete-list]").addEventListener("click", () => {
  const list = state.lists.find((entry) => entry.id === activeListId);
  if (!list || !confirm(`Delete list ${list.name}?`)) return;
  state.lists = state.lists.filter((entry) => entry.id !== list.id);
  activeListId = state.lists[0]?.id || "";
  saveState();
  renderAll();
});

loadStoredImages().then(migrateEmbeddedImages);
if (currentUser()) showApp();
