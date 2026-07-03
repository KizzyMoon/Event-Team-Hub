const PASSWORD = "HLET2025";
const STORAGE_KEY = "hlet-hub-v1";
const SESSION_KEY = "hlet-session-v1";
const PAGE_SIZE = 120;
const WEAPON_CATEGORIES = ["HEAVY", "SMGS", "THROWABLES", "MELEE", "OTHER", "PISTOLS", "SHOTGUNS", "RIFLES"];

const seed = window.HLET_SEED_DATA || { items: [] };
const state = loadState();
let activeTab = "objects";
let activeCategory = "All";
let activeListId = state.lists[0]?.id || "";
let renderLimit = PAGE_SIZE;
let editingTagItemId = "";
let editingTags = [];

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
  lists: document.querySelector("[data-lists]"),
  search: document.querySelector("[data-search]"),
  blacklistFilter: document.querySelector("[data-blacklist-filter]"),
  categories: document.querySelector("[data-categories]"),
  targetList: document.querySelector("[data-target-list]"),
  title: document.querySelector("[data-title]"),
  results: document.querySelector("[data-results]"),
  grid: document.querySelector("[data-grid]"),
  itemDialog: document.querySelector("[data-item-dialog]"),
  itemForm: document.querySelector("[data-item-form]"),
  tagDialog: document.querySelector("[data-tag-dialog]"),
  tagForm: document.querySelector("[data-tag-form]"),
  tagTitle: document.querySelector("[data-tag-title]"),
  tagEditor: document.querySelector("[data-tag-editor]"),
  tagInput: document.querySelector("[data-tag-input]"),
  tagAddRow: document.querySelector("[data-tag-add-row]"),
  tagAdd: document.querySelector("[data-tag-add]"),
  tagCancel: document.querySelector("[data-tag-cancel]"),
  weaponTagRow: document.querySelector("[data-weapon-tag-row]"),
  weaponTag: document.querySelector("[data-weapon-tag]"),
  listMenu: document.querySelector("[data-list-menu]"),
  listTitle: document.querySelector("[data-list-title]"),
  listSubtitle: document.querySelector("[data-list-subtitle]"),
  listSearch: document.querySelector("[data-list-search]"),
  listItems: document.querySelector("[data-list-items]")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    parsed.favoritesByUser = parsed.favoritesByUser || {};
    parsed.deletedItemIds = parsed.deletedItemIds || [];
    parsed.customItems = parsed.customItems || (parsed.items || []).filter((item) => String(item.id || "").startsWith("custom:"));
    parsed.itemOverrides = parsed.itemOverrides || {};
    return mergeSeedItems(parsed);
  }

  return {
    items: seed.items || [],
    customItems: [],
    itemOverrides: {},
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
  const preferred = tags.find((tag) => {
    return !isHiddenTag(tag);
  });
  return preferred || item.dlc || "Unsorted";
}

function isHiddenTag(tag) {
  return /^(roleplay|size|gray|white|black|silver|red|blue|green|yellow|orange|brown|transparent|scriptable|external|lod|created|release|version|online|gtav|base game)/i.test(tag);
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
    return WEAPON_CATEGORIES
      .map((category) => [category, state.items.filter((item) => item.kind === "weapon" && getWeaponCategory(item) === category).length])
      .filter(([, count]) => count > 0);
  }

  const counts = new Map();
  state.items.filter((item) => item.kind === type).forEach((item) => {
    const category = getUsefulCategory(item);
    counts.set(category, (counts.get(category) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 28);
}

function filteredItems() {
  const type = itemType();
  const search = els.search.value.trim().toLowerCase();
  const blacklist = els.blacklistFilter.value;
  const source = activeTab === "favorites" ? favoriteItems() : state.items;
  return source.filter((item) => {
    if (activeTab !== "favorites" && item.kind !== type) return false;
    if (activeTab === "favorites" && activeCategory !== "All" && `${item.kind}s` !== activeCategory.toLowerCase()) return false;
    if (activeTab !== "favorites" && activeCategory !== "All" && getUsefulCategory(item) !== activeCategory) return false;
    if (blacklist === "available" && item.blacklisted) return false;
    if (blacklist === "blacklisted" && !item.blacklisted) return false;
    if (!search) return true;
    return `${item.name} ${item.code} ${(item.tags || []).join(" ")} ${item.notes || ""}`.toLowerCase().includes(search);
  });
}

function favoriteItems() {
  const ids = favoriteIds();
  return ids.map((id) => state.items.find((item) => item.id === id)).filter(Boolean);
}

function renderCategories() {
  const type = itemType();
  const categories = categoriesFor(type);
  const availableCategories = categories.map(([category]) => category);
  if (activeCategory !== "All" && !availableCategories.includes(activeCategory)) {
    activeCategory = "All";
  }

  els.categories.innerHTML = [
    `<option value="All">All categories</option>`,
    ...categories.map(([category, count]) => {
      return `<option value="${escapeHtml(category)}">${escapeHtml(category)} (${count})</option>`;
    })
  ].join("");
  els.categories.value = activeCategory;
}

function renderCard(item, options = {}) {
  const listButton = state.lists.length
    ? `<button data-add-to-list="${escapeHtml(item.id)}" type="button">+ List</button>`
    : "";
  const editTagsButton = item.kind === "object" || item.kind === "weapon"
    ? `<button data-edit-tags="${escapeHtml(item.id)}" type="button">Edit tags</button>`
    : "";
  const thumb = renderThumb(item);
  return `
    <article class="card ${item.blacklisted ? "blacklisted" : ""} ${item.kind === "weapon" ? "weapon-card" : ""}" data-item-id="${escapeHtml(item.id)}">
      <button class="favorite-button ${isFavorite(item.id) ? "active" : ""}" data-toggle-favorite="${escapeHtml(item.id)}" type="button" aria-label="${isFavorite(item.id) ? "Remove favorite" : "Add favorite"}">&#9733;</button>
      ${thumb}
      <h3>${escapeHtml(item.name)}</h3>
      <div class="card-code">${escapeHtml(item.code)}</div>
      <div class="tag-row">
        ${item.blacklisted ? `<span class="blacklist-tag">Blacklisted</span>` : ""}
        ${visibleTags(item).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
      </div>
      <div class="meta">${escapeHtml(item.dlc || "Pleb Masters")}</div>
      <div class="card-actions">
        <button data-copy="${escapeHtml(item.code)}" type="button">Copy</button>
        ${options.removeFromList ? `<button class="card-remove" data-remove-from-list="${escapeHtml(item.id)}" type="button">Remove</button>` : listButton}
        ${editTagsButton}
        <button data-toggle-blacklist="${escapeHtml(item.id)}" type="button">${item.blacklisted ? "Unblacklist" : "Blacklist"}</button>
        <button class="card-remove" data-delete-item="${escapeHtml(item.id)}" type="button">Delete</button>
      </div>
    </article>
  `;
}

function visibleTags(item) {
  if (item.kind === "weapon") {
    return [getWeaponCategory(item)];
  }

  return (item.tags || []).filter((tag) => !isHiddenTag(tag)).slice(0, 3);
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
  editingTags = item.kind === "weapon" ? [getWeaponCategory(item)] : [...(item.tags || [])];
  els.tagTitle.textContent = `Edit tags - ${item.name}`;

  if (item.kind === "weapon") {
    els.tagAddRow.classList.add("is-hidden");
    els.tagAdd.classList.add("is-hidden");
    els.weaponTagRow.classList.remove("is-hidden");
    els.weaponTag.innerHTML = WEAPON_CATEGORIES.map((category) => {
      return `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`;
    }).join("");
    els.weaponTag.value = editingTags[0] || "OTHER";
  } else {
    els.tagAddRow.classList.remove("is-hidden");
    els.tagAdd.classList.remove("is-hidden");
    els.weaponTagRow.classList.add("is-hidden");
    els.tagInput.value = "";
  }

  renderTagEditor();
  els.tagDialog.showModal();
}

function renderTagEditor() {
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
  item.tags = item.kind === "weapon" ? [els.weaponTag.value] : [...editingTags];
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
    els.grid.insertAdjacentHTML("beforeend", `<button class="card" data-load-more type="button">Load more (${(items.length - visible.length).toLocaleString()} left)</button>`);
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

function renderTargetListSelect() {
  if (!els.targetList) return;
  if (activeListId && !state.lists.some((list) => list.id === activeListId)) {
    activeListId = state.lists[0]?.id || "";
  }

  els.targetList.innerHTML = state.lists.length
    ? state.lists.map((list) => `<option value="${escapeHtml(list.id)}">${escapeHtml(`Add to: ${list.name}`)}</option>`).join("")
    : `<option value="">No lists yet</option>`;
  els.targetList.value = activeListId;
}

function renderLists() {
  els.listMenu.innerHTML = state.lists.map((list) => {
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
  const items = list.itemIds
    .map((id) => state.items.find((item) => item.id === id))
    .filter(Boolean)
    .filter((item) => !search || `${item.name} ${item.code} ${(item.tags || []).join(" ")}`.toLowerCase().includes(search));

  els.listTitle.textContent = list.name;
  els.listSubtitle.textContent = `${list.itemIds.length} items - created by ${list.createdBy || "Events Team"}`;
  els.listItems.innerHTML = items.map((item) => renderCard(item, { removeFromList: true })).join("");
}

function renderAll() {
  renderCounts();
  renderCategories();
  renderTargetListSelect();
  renderBrowser();
  renderLists();
}

function setTab(tab) {
  activeTab = tab;
  renderLimit = PAGE_SIZE;
  activeCategory = "All";
  els.tabs.forEach((button) => button.classList.toggle("active", button.dataset.tab === tab));
  const listMode = tab === "lists";
  els.toolbar.classList.toggle("is-hidden", listMode);
  els.browser.classList.toggle("is-hidden", listMode);
  els.lists.classList.toggle("is-hidden", !listMode);
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

[els.search, els.blacklistFilter, els.listSearch].forEach((input) => {
  input.addEventListener("input", () => {
    renderLimit = PAGE_SIZE;
    renderAll();
  });
});

els.targetList.addEventListener("change", () => {
  activeListId = els.targetList.value;
  renderLists();
});

document.addEventListener("click", async (event) => {
  const copy = event.target.closest("[data-copy]");
  if (copy) {
    await navigator.clipboard.writeText(copy.dataset.copy);
    copy.textContent = "Copied";
    setTimeout(() => copy.textContent = "Copy", 900);
    return;
  }

  const blacklist = event.target.closest("[data-toggle-blacklist]");
  if (blacklist) {
    const item = state.items.find((entry) => entry.id === blacklist.dataset.toggleBlacklist);
    if (item) item.blacklisted = !item.blacklisted;
    if (item) saveItemOverride(item);
    saveState();
    renderAll();
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
      location.reload();
    }
    return;
  }

  const editTags = event.target.closest("[data-edit-tags]");
  if (editTags) {
    const item = state.items.find((entry) => entry.id === editTags.dataset.editTags);
    if (!item) return;
    openTagEditor(item);
    return;
  }

  const addToList = event.target.closest("[data-add-to-list]");
  if (addToList) {
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

  if (event.target.closest("[data-load-more]")) {
    renderLimit += PAGE_SIZE;
    renderBrowser();
  }
});

document.querySelector("[data-open-add]").addEventListener("click", () => els.itemDialog.showModal());
document.querySelector("[data-close-dialog]").addEventListener("click", () => els.itemDialog.close());

els.tagCancel.addEventListener("click", () => els.tagDialog.close());
els.tagAdd.addEventListener("click", addEditingTag);
els.tagInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addEditingTag();
  }
});
els.tagEditor.addEventListener("click", (event) => {
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

els.itemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = Object.fromEntries(new FormData(els.itemForm).entries());
  const item = {
    id: `custom:${crypto.randomUUID()}`,
    kind: form.kind,
    name: form.name,
    code: form.code,
    dlc: "Custom",
    image: form.image,
    tags: String(form.tags || "").split(",").map((tag) => tag.trim()).filter(Boolean),
    blacklisted: Boolean(form.blacklisted),
    notes: form.notes || ""
  };
  state.items.unshift(item);
  state.customItems = state.customItems || [];
  state.customItems.unshift(item);
  saveState();
  els.itemForm.reset();
  els.itemDialog.close();
  setTab({ object: "objects", vehicle: "vehicles", weapon: "weapons" }[form.kind]);
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
