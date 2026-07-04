const PASSWORD = "HLET2025";
const STORAGE_KEY = "hlet-hub-v1";
const SESSION_KEY = "hlet-session-v1";
const PAGE_SIZE = 120;
const WEAPON_CATEGORIES = ["HEAVY", "SMGS", "THROWABLES", "MELEE", "OTHER", "PISTOLS", "SHOTGUNS", "RIFLES"];
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

const seed = window.HLET_SEED_DATA || { items: [] };
const state = loadState();
let activeTab = "objects";
let activeCategory = "All";
let activeListId = state.lists[0]?.id || "";
let renderLimit = PAGE_SIZE;
let editingTagItemId = "";
let editingTags = [];
let editingItemId = "";
let pendingImageData = "";

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
    const parsed = JSON.parse(saved);
    parsed.favoritesByUser = parsed.favoritesByUser || {};
    parsed.deletedItemIds = parsed.deletedItemIds || [];
    parsed.customItems = parsed.customItems || (parsed.items || []).filter((item) => String(item.id || "").startsWith("custom:"));
    parsed.itemOverrides = parsed.itemOverrides || {};
    parsed.customTags = parsed.customTags || { object: [], vehicle: [], weapon: [] };
    return mergeSeedItems(parsed);
  }

  return {
    items: seed.items || [],
    customItems: [],
    itemOverrides: {},
    customTags: { object: [], vehicle: [], weapon: [] },
    favoritesByUser: {},
    deletedItemIds: [],
    lists: [
      { id: crypto.randomUUID(), name: "4th of July", createdBy: "Kizzy", itemIds: [] },
      { id: crypto.randomUUID(), name: "Birthday bash", createdBy: "Kizzy", itemIds: [] },
      { id: crypto.randomUUID(), name: "World Cup", createdBy: "Kizzy", itemIds: [] },
      { id: crypto.randomUUID(), name: "Carwash", createdBy: "Kizzy", itemIds: [] }
    ]
  };
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
    items: [...merged.values()]
  };
}

function saveState() {
  const savedState = {
    customItems: state.customItems || [],
    itemOverrides: state.itemOverrides || {},
    customTags: state.customTags || { object: [], vehicle: [], weapon: [] },
    favoritesByUser: state.favoritesByUser || {},
    deletedItemIds: state.deletedItemIds || [],
    lists: state.lists || []
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
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

function itemType(tab = activeTab) {
  return { objects: "object", vehicles: "vehicle", weapons: "weapon" }[tab];
}

function sortText(a, b) {
  return String(a || "").localeCompare(String(b || ""), undefined, { numeric: true, sensitivity: "base" });
}

function sortItemsByName(items) {
  return [...items].sort((a, b) => sortText(a.name, b.name) || sortText(a.code, b.code));
}

function currentUser() {
  return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
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
  state.customTags = state.customTags || { object: [], vehicle: [], weapon: [] };
  state.customTags[kind] = state.customTags[kind] || [];
  return state.customTags[kind];
}

function addCustomTag(kind, tag) {
  const cleaned = String(tag || "").trim();
  if (!cleaned) return;
  const tags = customTagsFor(kind);
  if (!tags.some((entry) => entry.toLowerCase() === cleaned.toLowerCase())) tags.push(cleaned);
  tags.sort(sortText);
}

function removeTagFromItem(item, tag) {
  const target = String(tag).toLowerCase();
  const before = item.tags || [];
  const after = before.filter((entry) => normalizeTag(item.kind, entry).toLowerCase() !== target);
  item.tags = after;
  if (after.length !== before.length) saveItemOverride(item);
}

function deleteTagEverywhere(kind, tag) {
  state.items.filter((item) => item.kind === kind).forEach((item) => removeTagFromItem(item, tag));
  state.customTags[kind] = customTagsFor(kind).filter((entry) => entry.toLowerCase() !== String(tag).toLowerCase());
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
      ["Vehicles", favoriteItems().filter((item) => item.kind === "vehicle").length],
      ["Weapons", favoriteItems().filter((item) => item.kind === "weapon").length]
    ].filter(([, count]) => count > 0);
  }

  if (type === "weapon") {
    const base = WEAPON_CATEGORIES
      .map((category) => [category, state.items.filter((item) => item.kind === "weapon" && getWeaponCategory(item) === category).length])
      .filter(([, count]) => count > 0)
      .sort(([a], [b]) => sortText(displayWeaponCategory(a), displayWeaponCategory(b)));
    customTagsFor("weapon").forEach((tag) => {
      if (!base.some(([category]) => category.toLowerCase() === tag.toLowerCase())) base.push([tag, 0]);
    });
    return base.sort(([a], [b]) => sortText(displayWeaponCategory(a), displayWeaponCategory(b)));
  }

  const counts = new Map();
  state.items.filter((item) => item.kind === type).forEach((item) => {
    const category = getUsefulCategory(item);
    counts.set(category, (counts.get(category) || 0) + 1);
  });
  customTagsFor(type).forEach((tag) => {
    if (!counts.has(tag)) counts.set(tag, 0);
  });
  return [...counts.entries()].sort(([a], [b]) => sortText(a, b));
}

function addItemCategoriesFor(kind) {
  if (kind === "weapon") {
    return [...new Set([...WEAPON_CATEGORIES, ...customTagsFor("weapon")])].sort((a, b) => sortText(displayWeaponCategory(a), displayWeaponCategory(b)));
  }
  if (kind === "vehicle") {
    return [...new Set([...VEHICLE_CATEGORIES, ...customTagsFor("vehicle")])].sort(sortText);
  }

  const categories = categoriesFor(kind);
  const categoryNames = categories.length ? categories.map(([category]) => category) : ["Unsorted"];
  return [...new Set([...categoryNames, ...customTagsFor(kind)])].sort(sortText);
}

function renderCustomCategorySelect(selectedTag = "") {
  const kind = els.itemForm.elements.kind.value;
  const categories = [...addItemCategoriesFor(kind)];
  if (selectedTag && !categories.includes(selectedTag)) categories.unshift(selectedTag);
  els.customCategory.innerHTML = categories.map((category) => {
    return `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
  }).join("");
  if (selectedTag && categories.includes(selectedTag)) {
    els.customCategory.value = selectedTag;
  }
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
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.84));
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
  resetImageUploadLabel();
  renderCustomCategorySelect();
  els.itemDialog.showModal();
}

function openItemEditor(item) {
  editingItemId = item.id;
  pendingImageData = "";
  els.itemTitle.textContent = `Edit ${item.name}`;
  els.itemForm.reset();
  els.itemForm.elements.name.value = item.name || "";
  els.itemForm.elements.code.value = item.code || "";
  els.itemForm.elements.kind.value = item.kind || "object";
  els.itemForm.elements.kind.disabled = false;
  els.itemForm.elements.image.value = item.image && !String(item.image).startsWith("data:") ? item.image : "";
  els.itemForm.elements.notes.value = item.notes || "";
  resetImageUploadLabel(item.image ? "Current image saved. Drop, paste, or choose to replace it." : undefined);
  renderCustomCategorySelect(getUsefulCategory(item));
  els.itemDialog.showModal();
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

  const chipMode = activeTab === "weapons";
  els.categories.classList.toggle("is-hidden", chipMode);
  els.categoryChips.classList.toggle("is-hidden", !chipMode);

  if (chipMode) {
    els.categoryChips.innerHTML = [
      `<button class="${activeCategory === "All" ? "active" : ""}" data-category-chip="All" type="button">All</button>`,
      ...categories.map(([category]) => {
        return `<button class="${activeCategory === category ? "active" : ""}" data-category-chip="${escapeHtml(category)}" type="button">${escapeHtml(displayWeaponCategory(category))}</button>`;
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

function renderCard(item, options = {}) {
  const listButton = state.lists.length
    ? `<button data-add-to-list="${escapeHtml(item.id)}" type="button">+ List</button>`
    : "";
  const editTagsButton = item.kind === "object" || item.kind === "vehicle" || item.kind === "weapon"
    ? `<button data-edit-item="${escapeHtml(item.id)}" type="button">Edit</button>`
    : "";
  const thumb = renderThumb(item);
  return `
    <article class="card ${item.kind === "weapon" ? "weapon-card" : ""}" data-item-id="${escapeHtml(item.id)}">
      <button class="favorite-button ${isFavorite(item.id) ? "active" : ""}" data-toggle-favorite="${escapeHtml(item.id)}" type="button" aria-label="${isFavorite(item.id) ? "Remove favorite" : "Add favorite"}">&#9733;</button>
      ${thumb}
      <h3>${escapeHtml(item.name)}</h3>
      <div class="card-code">${escapeHtml(item.code)}</div>
      <div class="tag-row">
        ${visibleTags(item).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="card-actions">
        ${options.removeFromList ? `<button class="card-remove" data-remove-from-list="${escapeHtml(item.id)}" type="button">Remove</button>` : listButton}
      </div>
      <div class="card-bottom-actions">
        ${editTagsButton}
        <button class="delete-corner" data-delete-item="${escapeHtml(item.id)}" type="button" aria-label="Delete ${escapeHtml(item.name)}">x</button>
      </div>
    </article>
  `;
}

function visibleTags(item) {
  if (item.kind === "weapon") {
    const category = getWeaponCategory(item);
    return [category];
  }

  return editableTagsFor(item).slice(0, 3);
}

function renderThumb(item) {
  if (item.kind === "weapon") {
    return "";
  }

  if (item.image) {
    return `<img class="thumb" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" />`;
  }

  return `<div class="thumb no-thumb">No image</div>`;
}

function openTagEditor(item) {
  editingTagItemId = item.id;
  editingTags = item.kind === "weapon" || item.kind === "vehicle" ? [getUsefulCategory(item)] : editableTagsFor(item);
  els.tagTitle.textContent = `Edit tags - ${item.name}`;

  if (item.kind === "weapon" || item.kind === "vehicle") {
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
  if (item?.kind === "weapon" || item?.kind === "vehicle") {
    const categories = item.kind === "weapon" ? WEAPON_CATEGORIES : VEHICLE_CATEGORIES;
    const selected = editingTags[0] || categories[0];
    els.tagEditor.innerHTML = categories.map((category) => {
      return `<button class="tag-choice ${category === selected ? "active" : ""}" data-pick-category-tag="${escapeHtml(category)}" type="button">${escapeHtml(item.kind === "weapon" ? displayWeaponCategory(category) : category)}</button>`;
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
  item.tags = item.kind === "weapon" ? [editingTags[0] || "OTHER"] : item.kind === "vehicle" ? [editingTags[0] || VEHICLE_CATEGORIES[0]] : [...editingTags];
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
  ["object", "vehicle", "weapon"].forEach((kind) => {
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

function renderFavorites() {
  const groups = [
    ["Objects", "object"],
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
  if (kind === "weapon") {
    WEAPON_CATEGORIES.forEach((category) => {
      counts.set(category, state.items.filter((item) => item.kind === "weapon" && getWeaponCategory(item) === category).length);
    });
    customTagsFor("weapon").forEach((tag) => {
      if (!counts.has(tag)) counts.set(tag, 0);
    });
    return [...counts.entries()]
      .filter(([tag, count]) => count > 0 || customTagsFor("weapon").some((entry) => entry.toLowerCase() === tag.toLowerCase()))
      .sort(([a], [b]) => sortText(displayWeaponCategory(a), displayWeaponCategory(b)));
  }

  state.items.filter((item) => item.kind === kind).forEach((item) => {
    (item.tags || []).forEach((tag) => {
      const normalizedTag = normalizeTag(kind, tag);
      if (!isMetadataTag(normalizedTag)) counts.set(normalizedTag, (counts.get(normalizedTag) || 0) + 1);
    });
  });
  customTagsFor(kind).forEach((tag) => {
    if (!counts.has(tag)) counts.set(tag, 0);
  });
  return [...counts.entries()].sort(([a], [b]) => sortText(a, b));
}

function renderSettings() {
  const sections = [
    ["object", "Objects"],
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
          <button type="submit">Add tag</button>
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
  renderCounts();
  renderCategories(options);
  renderBrowser();
  renderFavorites();
  renderLists();
  renderSettings();
}

function setTab(tab) {
  activeTab = tab;
  renderLimit = PAGE_SIZE;
  activeCategory = tab === "favorites" ? "Objects" : "All";
  els.tabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  els.search.placeholder = {
    objects: "Search objects...",
    vehicles: "Search vehicles...",
    weapons: "Search weapons...",
    favorites: "Search favorites..."
  }[tab] || "Search names, spawn codes, categories...";
  const listMode = tab === "lists";
  const settingsMode = tab === "settings";
  const favoriteMode = tab === "favorites";
  els.toolbar.classList.toggle("is-hidden", listMode || settingsMode || favoriteMode);
  els.browser.classList.toggle("is-hidden", listMode || settingsMode || favoriteMode);
  els.favoritesView.classList.toggle("is-hidden", !favoriteMode);
  els.lists.classList.toggle("is-hidden", !listMode);
  els.settings.classList.toggle("is-hidden", !settingsMode);
  renderAll();
}

els.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(els.loginForm);
  if (formData.get("password") !== PASSWORD) {
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
  const deleteButton = event.target.closest("[data-delete-settings-tag]");
  if (deleteButton) {
    const kind = deleteButton.dataset.tagKind;
    const tag = deleteButton.dataset.deleteSettingsTag;
    if (!confirm(`Delete tag ${tag} from all ${kind}s?`)) return;
    deleteTagEverywhere(kind, tag);
    if (activeCategory === tag) activeCategory = "All";
    saveState();
    renderAll();
  }
});

els.settingsPanels.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-add-settings-tag]");
  if (!form) return;
  event.preventDefault();
  const kind = form.dataset.addSettingsTag;
  const tag = new FormData(form).get("tag");
  addCustomTag(kind, tag);
  saveState();
  form.reset();
  renderAll();
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

  const deleteItem = event.target.closest("[data-delete-item]");
  if (deleteItem) {
    const item = state.items.find((entry) => entry.id === deleteItem.dataset.deleteItem);
    if (item && confirm(`Delete ${item.name}?`)) {
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
      saveState();
      renderAll({ keepMissingCategory: true });
    }
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
    existingItem.image = pendingImageData || form.image || existingItem.image || "";
    existingItem.tags = form.tags ? [form.tags] : [];
    existingItem.notes = form.notes || "";
    saveItemOverride(existingItem);
  } else {
    const item = {
      id: `custom:${crypto.randomUUID()}`,
      kind: form.kind,
      name: form.name,
      code: form.code,
      dlc: "Custom",
      image: pendingImageData || form.image || "",
      tags: form.tags ? [form.tags] : [],
      blacklisted: false,
      notes: form.notes || ""
    };
    state.items.unshift(item);
    state.customItems = state.customItems || [];
    state.customItems.unshift(item);
  }

  saveState();
  const targetTab = { object: "objects", vehicle: "vehicles", weapon: "weapons" }[form.kind];
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

if (currentUser()) showApp();
