const PASSWORD = "HLET2025";
const STORAGE_KEY = "hlet-hub-v1";
const SESSION_KEY = "hlet-session-v1";
const PAGE_SIZE = 120;

const seed = window.HLET_SEED_DATA || { items: [] };
const state = loadState();
let activeTab = "objects";
let activeCategory = "All";
let activeListId = state.lists[0]?.id || "";
let renderLimit = PAGE_SIZE;

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
    return mergeSeedItems(parsed);
  }

  return {
    items: seed.items || [],
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
    if (!deleted.has(item.id)) merged.set(item.id, item);
  });

  (savedState.items || []).forEach((item) => {
    if (!deleted.has(item.id)) merged.set(item.id, item);
  });

  return {
    ...savedState,
    items: [...merged.values()]
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
  if (/\b(knife|bat|club|hammer|hatchet|machete|wrench|crowbar|bottle|knuckle|nightstick|battleaxe|pool cue|golf club|dagger|axe|brick|candy cane|sledgehammer|flashlight)\b/.test(text)) return "Melee";
  if (/\b(grenade|molotov|sticky|pipe bomb|pipebomb|mine|bz gas|tear gas|snowball|ball)\b/.test(text)) return "Throwables";
  if (/\b(rpg|rocket|launcher|minigun|railgun|widowmaker|cannon|missile|mg|machine gun|combat mg|pkm|rpk)\b/.test(text)) return "Heavy";
  if (/\b(shotgun|mossberg|remington|sawn|sawed|winchester|bean bag)\b/.test(text)) return "Shotguns";
  if (/\b(smg|pdw|p90|mp5|mp40|tec-9|tec9|uzi|mac-10|mac-11|skorpion|ump)\b/.test(text)) return "SMGs";
  if (/\b(pistol|revolver|glock|beretta|deagle|five seven|fn 509|m1911|tokarev|python|colt|p226|p88|m9)\b/.test(text)) return "Pistols";
  if (/\b(rifle|carbine|ak|m4|m16|mk18|g36|scar|fal|l96|mosin|sniper|marksman|gusenberg|m14)\b/.test(text)) return "Rifles";
  return "Other";
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
    const weaponCategories = ["Pistols", "SMGs", "Rifles", "Shotguns", "Melee", "Heavy", "Throwables", "Other"];
    return weaponCategories
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
  const editTagsButton = item.kind === "object"
    ? `<button data-edit-tags="${escapeHtml(item.id)}" type="button">Edit tags</button>`
    : "";
  const thumb = item.kind === "weapon"
    ? renderWeaponArt(item)
    : item.image
      ? `<img class="thumb" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy" />`
      : `<div class="thumb no-thumb">No image</div>`;
  return `
    <article class="card ${item.blacklisted ? "blacklisted" : ""} ${item.kind === "weapon" ? "weapon-card" : ""}" data-item-id="${escapeHtml(item.id)}">
      <button class="favorite-button ${isFavorite(item.id) ? "active" : ""}" data-toggle-favorite="${escapeHtml(item.id)}" type="button" aria-label="${isFavorite(item.id) ? "Remove favorite" : "Add favorite"}">★</button>
      ${thumb}
      <h3>${escapeHtml(item.name)}</h3>
      <div class="card-code">${escapeHtml(item.code)}</div>
      <div class="tag-row">
        ${item.blacklisted ? `<span class="blacklist-tag">Blacklisted</span>` : ""}
        ${(item.tags || []).filter((tag) => !isHiddenTag(tag)).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
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

function renderWeaponArt(item) {
  const category = getWeaponCategory(item);
  const key = category.toLowerCase();
  const art = {
    Pistols: `
      <g transform="translate(35 54) rotate(-10)">
        <rect x="0" y="0" width="86" height="26" rx="7" fill="#15191b" stroke="#596167" stroke-width="3"/>
        <rect x="13" y="-7" width="48" height="10" rx="4" fill="#252b2d" stroke="#697278" stroke-width="2"/>
        <rect x="59" y="6" width="28" height="9" rx="4" fill="#0a0c0d"/>
        <path d="M29 23 L48 23 L40 67 L21 67 Z" fill="#c65d2f" stroke="#382018" stroke-width="3"/>
        <circle cx="35" cy="36" r="3" fill="#f1b36d"/>
        <circle cx="31" cy="52" r="3" fill="#f1b36d"/>
        <path d="M18 24 q15 18 1 35" fill="none" stroke="#0a0c0d" stroke-width="7" stroke-linecap="round"/>
      </g>
    `,
    SMGs: `
      <g transform="translate(24 50) rotate(-12)">
        <rect x="0" y="0" width="140" height="24" rx="6" fill="#131719" stroke="#5e676d" stroke-width="3"/>
        <rect x="20" y="-13" width="54" height="12" rx="4" fill="#252c2f" stroke="#667077" stroke-width="2"/>
        <rect x="103" y="7" width="42" height="10" rx="4" fill="#080a0b"/>
        <path d="M42 23 L61 23 L57 72 L38 72 Z" fill="#171c1e" stroke="#586168" stroke-width="3"/>
        <path d="M11 19 L-17 34 L-10 45 L21 24 Z" fill="#20272a" stroke="#5f6970" stroke-width="3"/>
        <path d="M80 24 L98 24 L96 54 L82 54 Z" fill="#111416" stroke="#566067" stroke-width="3"/>
      </g>
    `,
    Rifles: `
      <g transform="translate(17 51) rotate(-12)">
        <rect x="21" y="0" width="145" height="22" rx="6" fill="#15191b" stroke="#626c72" stroke-width="3"/>
        <rect x="64" y="-19" width="42" height="16" rx="3" fill="#101315" stroke="#616b72" stroke-width="3"/>
        <path d="M20 8 L-20 30 L-11 46 L36 22 Z" fill="#1e2528" stroke="#687279" stroke-width="3"/>
        <path d="M68 22 L90 22 L85 74 L62 74 Z" fill="#20272a" stroke="#687279" stroke-width="3"/>
        <rect x="150" y="6" width="43" height="9" rx="4" fill="#090b0c"/>
        <rect x="108" y="18" width="25" height="38" rx="2" fill="#2f241b" stroke="#7b6042" stroke-width="3"/>
        <path d="M46 -2 h30 M113 3 h24" stroke="#d6a75f" stroke-width="3" stroke-linecap="round"/>
      </g>
    `,
    Shotguns: `
      <g transform="translate(14 53) rotate(-12)">
        <rect x="38" y="1" width="132" height="20" rx="6" fill="#111517" stroke="#626b72" stroke-width="3"/>
        <rect x="111" y="-7" width="67" height="8" rx="4" fill="#080a0b"/>
        <path d="M39 7 L-9 31 L-1 48 L50 21 Z" fill="#6d351d" stroke="#9a6137" stroke-width="3"/>
        <path d="M76 22 L99 22 L94 66 L74 66 Z" fill="#15191b" stroke="#626b72" stroke-width="3"/>
        <circle cx="125" cy="10" r="10" fill="#2b3033" stroke="#747e85" stroke-width="3"/>
      </g>
    `,
    Melee: `
      <g transform="translate(51 20) rotate(42)">
        <path d="M60 0 C72 22 73 48 60 88 C47 48 48 22 60 0 Z" fill="#cdd3d6" stroke="#7d878d" stroke-width="4"/>
        <path d="M56 78 h8 v88 h-8 Z" fill="#5a321f" stroke="#22140e" stroke-width="4"/>
        <rect x="40" y="74" width="40" height="12" rx="5" fill="#1d2225" stroke="#69737a" stroke-width="3"/>
        <circle cx="60" cy="112" r="4" fill="#c7924e"/>
      </g>
    `,
    Heavy: `
      <g transform="translate(8 48) rotate(-9)">
        <rect x="10" y="2" width="157" height="28" rx="8" fill="#131719" stroke="#657077" stroke-width="3"/>
        <rect x="132" y="9" width="68" height="12" rx="6" fill="#07090a"/>
        <path d="M10 19 L-2 45 L30 39 L44 29 Z" fill="#2d351f" stroke="#667057" stroke-width="3"/>
        <path d="M61 29 L83 29 L77 85 L53 85 Z" fill="#111517" stroke="#626c72" stroke-width="3"/>
        <rect x="95" y="31" width="44" height="22" rx="5" fill="#46512b" stroke="#7e8a56" stroke-width="3"/>
        <path d="M31 2 h44 M89 3 h34" stroke="#c99b51" stroke-width="3" stroke-linecap="round"/>
      </g>
    `,
    Throwables: `
      <g transform="translate(75 22)">
        <path d="M34 11 h34 v20 h-34 Z" fill="#1a2022" stroke="#677179" stroke-width="3"/>
        <path d="M23 30 C11 45 6 78 15 103 C24 129 78 129 88 103 C97 78 91 45 79 30 Z" fill="#3e4f34" stroke="#798970" stroke-width="4"/>
        <path d="M31 51 C47 43 65 43 78 53" fill="none" stroke="#9aad86" stroke-width="4" opacity=".75"/>
        <path d="M53 8 C78 3 86 20 92 31" fill="none" stroke="#b88a4e" stroke-width="5" stroke-linecap="round"/>
      </g>
    `,
    Other: `
      <g transform="translate(55 30)">
        <rect x="11" y="16" width="96" height="92" rx="12" fill="#1a2225" stroke="#69737a" stroke-width="4"/>
        <rect x="28" y="34" width="59" height="28" rx="4" fill="#5a7f57" stroke="#95bb82" stroke-width="3"/>
        <circle cx="32" cy="82" r="6" fill="#d74d37"/>
        <circle cx="54" cy="82" r="6" fill="#d3b348"/>
        <circle cx="76" cy="82" r="6" fill="#4aa765"/>
        <path d="M70 16 C80 -2 104 -2 115 11" fill="none" stroke="#20272a" stroke-width="7" stroke-linecap="round"/>
      </g>
    `
  };
  return `
    <div class="thumb weapon-art weapon-art-${escapeHtml(key)}" aria-label="${escapeHtml(item.name)} weapon art">
      <svg viewBox="0 0 220 140" role="img" aria-hidden="true">
        <defs>
          <filter id="weapon-shadow-${escapeHtml(item.id).replace(/[^a-z0-9]/gi, "-")}" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="6" stdDeviation="3" flood-color="#000" flood-opacity=".65"/>
          </filter>
        </defs>
        <rect x="1" y="1" width="218" height="138" rx="18" fill="url(#weapon-bg)" opacity="0"/>
        <g filter="url(#weapon-shadow-${escapeHtml(item.id).replace(/[^a-z0-9]/gi, "-")})">
          ${art[category] || art.Other}
        </g>
      </svg>
    </div>
  `;
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
      state.lists.forEach((list) => list.itemIds = list.itemIds.filter((id) => id !== item.id));
      Object.values(state.favoritesByUser || {}).forEach((ids) => {
        const favoriteIndex = ids.indexOf(item.id);
        if (favoriteIndex !== -1) ids.splice(favoriteIndex, 1);
      });
      saveState();
      renderAll();
    }
    return;
  }

  const editTags = event.target.closest("[data-edit-tags]");
  if (editTags) {
    const item = state.items.find((entry) => entry.id === editTags.dataset.editTags);
    if (!item) return;
    const nextTags = prompt("Edit tags, separated by commas", (item.tags || []).join(", "));
    if (nextTags === null) return;
    item.tags = nextTags.split(",").map((tag) => tag.trim()).filter(Boolean);
    saveState();
    renderAll();
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
