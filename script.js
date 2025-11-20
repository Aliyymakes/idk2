document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "keyFlowinventory";
  const SEARCH_DEBOUNCE_DELAY = 300;
  const LONG_PRESS_DELAY = 700;

  const dom = {
    breadcrumb: document.getElementById("breadcrumb"),
    inventoryGrid: document.getElementById("inventoryGrid"),
    trashButton: document.getElementById("trashh"),
    searchInput: document.getElementById("search-bar"),
    searchButton: document.getElementById("search-btn"),
    contextMenu: document.getElementById("contextMenu"),
    deleteContextBtn: document.getElementById("deleteContextBtn"),
    suggestionsBox: document.getElementById("suggestions"),
    categoryInput: document.getElementById("itemcategory"),
    addModal: document.getElementById("modal-overlay"),
    addButton: document.getElementById("addd"),
    cancelButton: document.getElementById("cancelBtn"),
    addForm: document.getElementById("add-form"),
    displaySelect: document.getElementById("displaySelect"),
    imageUpload: document.getElementById("imageUpload"),
    iconName: document.getElementById("iconName"),
    itemName: document.getElementById("itemname"),
    itemQuantity: document.getElementById("itemquantity"),
    quantityRow: document.getElementById("quantityRow"),
    categoryRow: document.getElementById("categoryRow"),
  };
  const typeRadios = Array.from(
    document.querySelectorAll('input[name="type"]')
  );

  const state = {
    inventory: normalizeInventory(
      JSON.parse(localStorage.getItem(STORAGE_KEY)) || defaultInventory()
    ),
    currentPath: [],
    selectedIds: new Set(),
    contextItemId: null,
    searchTimer: null,
    longPressTimer: null,
  };

  let nextId = getNextId(state.inventory);
  let categories = buildCategorySet(state.inventory);

  function defaultInventory() {
    return [
      { id: 1, type: "item", name: "Apple", quantity: 10, category: "Fruit" },
      { id: 2, type: "item", name: "Banana", quantity: 5, category: "Fruit" },
      {
        id: 3,
        type: "item",
        name: "Carrot",
        quantity: 8,
        category: "Vegetable",
      },
      {
        id: 4,
        type: "folder",
        name: "Gadgets",
        children: [
          {
            id: 5,
            type: "item",
            name: "Wireless Mouse",
            quantity: 2,
            category: "Accessories",
          },
        ],
      },
    ];
  }

  function normalizeInventory(list = []) {
    return list.map((item) => {
      const isFolder = item.type === "folder" || item.type === "container";
      const normalized = {
        ...item,
        type: isFolder ? "folder" : "item",
      };
      if (isFolder) {
        normalized.children = normalizeInventory(item.children || []);
      } else {
        delete normalized.children;
      }
      return normalized;
    });
  }

  function flatten(list = []) {
    return list.flatMap((item) =>
      item.type === "folder" ? [item, ...flatten(item.children || [])] : [item]
    );
  }

  function getNextId(list = []) {
    const ids = flatten(list).map((item) => item.id);
    return ids.length ? Math.max(...ids) + 1 : 1;
  }

  function buildCategorySet(source = []) {
    return new Set(
      flatten(source)
        .map((item) => item.category)
        .filter(Boolean)
    );
  }

  function persistInventory() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.inventory));
  }

  function disableScrolling() {
    document.body.classList.add("no-scroll");
  }
  function enableScrolling() {
    document.body.classList.remove("no-scroll");
  }

  function getCurrentItems() {
    if (state.currentPath.length === 0) return state.inventory;
    return state.currentPath[state.currentPath.length - 1].children || [];
  }

  function render() {
    renderBreadcrumb();
    renderInventory();
    updateSelectionControls();
  }

  function renderBreadcrumb() {
    dom.breadcrumb.innerHTML = "";

    const home = document.createElement("button");
    home.className =
      "breadcrumb-item" + (state.currentPath.length === 0 ? " active" : "");
    home.textContent = "Home";
    home.addEventListener("click", () => {
      state.currentPath = [];
      clearSelection();
      render();
    });
    dom.breadcrumb.appendChild(home);

    state.currentPath.forEach((folder, index) => {
      const crumb = document.createElement("button");
      crumb.className =
        "breadcrumb-item" +
        (index === state.currentPath.length - 1 ? " active" : "");
      crumb.textContent = folder.name;
      crumb.addEventListener("click", () => {
        state.currentPath = state.currentPath.slice(0, index + 1);
        clearSelection();
        render();
      });
      dom.breadcrumb.appendChild(crumb);
    });
  }

  function renderInventory(items = getCurrentItems()) {
    dom.inventoryGrid.innerHTML = "";
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "inventory-item";
      card.dataset.id = item.id;
      card.dataset.type = item.type;
      card.innerHTML = `
        <img src="${
          item.type === "folder" ? "folder.svg" : "image.svg"
        }" alt="thumbnail">
        <h3>${item.name}</h3>
      `;
      if (state.selectedIds.has(item.id)) card.classList.add("selected");
      card.addEventListener("click", () => handleItemClick(item.id, item.type));
      dom.inventoryGrid.appendChild(card);
    });
  }

  function handleItemClick(id, type) {
    if (type === "folder") {
      const folder = getCurrentItems().find((entry) => entry.id === id);
      if (folder) {
        state.currentPath.push(folder);
        clearSelection();
        render();
      }
      return;
    }
    toggleSelection(id);
  }

  function syncSelectionUI() {
    dom.inventoryGrid.querySelectorAll(".inventory-item").forEach((card) => {
      const id = Number(card.dataset.id);
      card.classList.toggle("selected", state.selectedIds.has(id));
    });
  }

  function updateSelectionControls() {
    dom.trashButton.style.display = state.selectedIds.size
      ? "inline-flex"
      : "none";
  }

  function toggleSelection(id) {
    if (state.selectedIds.has(id)) state.selectedIds.delete(id);
    else state.selectedIds.add(id);
    syncSelectionUI();
    updateSelectionControls();
  }

  function clearSelection() {
    state.selectedIds.clear();
    syncSelectionUI();
    updateSelectionControls();
  }

  function removeByIds(ids) {
    if (!ids.size) return;
    const list = getCurrentItems();
    const remaining = list.filter((item) => !ids.has(item.id));
    list.length = 0;
    remaining.forEach((item) => list.push(item));
    persistInventory();
    clearSelection();
    renderInventory();
  }

  dom.trashButton.addEventListener("click", () =>
    removeByIds(state.selectedIds)
  );

  const searchInventory = () => {
    const term = dom.searchInput.value.trim().toLowerCase();
    if (!term) {
      renderInventory();
      return;
    }
    clearSelection();
    const filtered = getCurrentItems().filter((item) =>
      item.name.toLowerCase().includes(term)
    );
    renderInventory(filtered);
  };

  dom.searchButton.addEventListener("click", searchInventory);
  dom.searchInput.addEventListener("input", () => {
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(searchInventory, SEARCH_DEBOUNCE_DELAY);
  });
  dom.searchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") searchInventory();
    else if (!dom.searchInput.value.trim()) renderInventory();
  });

  function showContextMenu(event, target) {
    const itemDiv = target.closest(".inventory-item");
    if (!itemDiv) return;
    event.preventDefault();
    state.contextItemId = Number(itemDiv.dataset.id);
    dom.contextMenu.style.display = "block";
    dom.contextMenu.style.left = `${event.pageX + 5}px`;
    dom.contextMenu.style.top = `${event.pageY + 5}px`;
    disableScrolling();
  }

  function hideContextMenu() {
    dom.contextMenu.style.display = "none";
    state.contextItemId = null;
    enableScrolling();
  }

  dom.inventoryGrid.addEventListener("contextmenu", (e) =>
    showContextMenu(e, e.target)
  );
  dom.inventoryGrid.addEventListener("touchstart", (e) => {
    clearTimeout(state.longPressTimer);
    state.longPressTimer = setTimeout(
      () => showContextMenu(e, e.target),
      LONG_PRESS_DELAY
    );
  });
  dom.inventoryGrid.addEventListener("touchend", () =>
    clearTimeout(state.longPressTimer)
  );
  dom.inventoryGrid.addEventListener("touchcancel", () =>
    clearTimeout(state.longPressTimer)
  );

  document.addEventListener("click", (e) => {
    const clickedInsideMenu = dom.contextMenu.contains(e.target);
    const clickedInventory = dom.inventoryGrid.contains(e.target);
    if (!clickedInsideMenu) hideContextMenu();
    if (!clickedInventory) clearSelection();
  });

  dom.deleteContextBtn.addEventListener("click", () => {
    if (!state.contextItemId) return;
    const confirmed = confirm("Are you sure you want to delete this item?");
    if (confirmed) removeByIds(new Set([state.contextItemId]));
    hideContextMenu();
  });

  function showSuggestions(value) {
    dom.suggestionsBox.innerHTML = "";
    if (!value) {
      dom.suggestionsBox.style.display = "none";
      return;
    }

    const matches = [...categories].filter((cat) =>
      cat.toLowerCase().startsWith(value.toLowerCase())
    );

    if (!matches.length) {
      dom.suggestionsBox.style.display = "none";
      return;
    }

    matches.forEach((cat) => {
      const div = document.createElement("div");
      div.textContent = cat;
      div.className = "suggestion";
      div.addEventListener("click", () => {
        dom.categoryInput.value = cat;
        dom.suggestionsBox.style.display = "none";
      });
      dom.suggestionsBox.appendChild(div);
    });
    dom.suggestionsBox.style.display = "block";
  }
  dom.categoryInput.addEventListener("input", () =>
    showSuggestions(dom.categoryInput.value.trim())
  );

  function showAddMenu() {
    dom.addModal.style.display = "flex";
    dom.addForm.reset();
    updateTypeRows();
    disableScrolling();
  }

  function hideAddMenu() {
    dom.addModal.style.display = "none";
    enableScrolling();
  }

  dom.addButton.addEventListener("click", showAddMenu);
  dom.cancelButton.addEventListener("click", hideAddMenu);
  dom.addModal.addEventListener("click", (e) => {
    if (!dom.addForm.contains(e.target)) hideAddMenu();
  });

  function updateTypeRows() {
    const selected = typeRadios.find((radio) => radio.checked);
    const isItem = !selected || selected.value === "item";
    dom.quantityRow.style.display = isItem ? "flex" : "none";
    dom.categoryRow.style.display = isItem ? "flex" : "none";
  }

  typeRadios.forEach((radio) =>
    radio.addEventListener("change", updateTypeRows)
  );

  dom.displaySelect.addEventListener("change", (e) => {
    const val = e.target.value;
    dom.imageUpload.style.display = val === "upload" ? "block" : "none";
    dom.iconName.style.display = val === "icon" ? "block" : "none";
  });

  dom.addForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = dom.itemName.value.trim();
    const selectedRadio = typeRadios.find((radio) => radio.checked);
    const typeValue = selectedRadio ? selectedRadio.value : "item";
    const type = typeValue === "container" ? "folder" : typeValue;
    const quantity = parseInt(dom.itemQuantity.value.trim(), 10);
    const category = dom.categoryInput.value.trim();

    if (
      type === "item" &&
      (!name || !category || Number.isNaN(quantity) || quantity < 1)
    ) {
      alert("Please fill all the required fields with valid data.");
      return;
    }
    if (type === "folder" && !name) {
      alert("Please fill all the required fields with valid data.");
      return;
    }

    const newItem =
      type === "item"
        ? {
            id: nextId,
            name,
            type,
            quantity,
            category,
          }
        : {
            id: nextId,
            name,
            type: "folder",
            children: [],
          };

    const targetList = getCurrentItems();
    targetList.push(newItem);
    nextId += 1;
    persistInventory();
    categories = buildCategorySet(state.inventory);
    alert("Item added successfully");
    dom.addForm.reset();
    hideAddMenu();
    renderInventory();
  });

  render();
});
