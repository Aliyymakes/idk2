document.addEventListener("DOMContentLoaded", () => {
  // DATABASE
  let inventory = [
    { id: 1, name: "Apple", quantity: 10, category: "Fruit" },
    { id: 2, name: "Banana", quantity: 5, category: "Fruit" },
    { id: 3, name: "Carrot", quantity: 8, category: "Vegetable" },
  ];

  function categorySet(source = inventory) {
    let categories = new Set();
    source.forEach((item) => {
      categories.add(item.category);
    });
    return categories;
  }

  // GENERAL: SCROLL
  function disableScrolling() {
    document.body.classList.add("no-scroll");
  }
  function enableScrolling() {
    document.body.classList.remove("no-scroll");
  }

  // RENDER INVENTORY
  let selectedIds = new Set();
  let selectedDiv = null;
  const inventoryGrid = document.getElementById("inventoryGrid");

  function renderInventory(itemsToRender = inventory) {
    inventoryGrid.innerHTML = "";
    itemsToRender.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("inventory-item");
      itemDiv.dataset.id = item.id;
      // if (selectedIds.has(item.id)) itemDiv.classList.add("selected");
      itemDiv.innerHTML = `
                <img src="placeholder1.png" alt="thumbnail">
                <h3>${item.name}</h3>
            `;
      inventoryGrid.appendChild(itemDiv);
    });
    updateSelection();
  }

  // SELeCT
  const trashbutton = document.getElementById("trashh");
  function toggleSelect(id) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
  }
  //another delet
  function deleteitems() {
    selectedIds.forEach((id) => {
      inventory = inventory.filter((item) => item.id != id);
      selectedIds.delete(id);
    });
    renderInventory();
  }
  trashbutton.addEventListener("click", () => {
    deleteitems();
  });
  async function updateSelection() {
    const si = selectedIds.size;
    console.log("size:" + si);
    if (si > 0) trashbutton.style.display = "inline-flex";
    else trashbutton.style.display = "none";
  }
  function selectionsmtidk(ee, targetElement) {
    selectedDiv = targetElement.closest(".inventory-item");
    if (selectedDiv) {
      selectedDiv.classList.add("selected");
      selectedIds.add(Number(selectedDiv.dataset.id));
    } else if (!inventoryGrid.contains(targetElement)) {
      inventoryGrid.querySelectorAll(".inventory-item").forEach((item) => {
        const id = Number(item.dataset.id);
        if (selectedIds.has(id)) item.classList.remove("selected");
        toggleSelect(id);
      });
      selectedIds.clear();
      selectedDiv = null;
    }
    updateSelection();
  }
  inventoryGrid.addEventListener("click", (e) => {
    selectionsmtidk(e, e.target);
  });
  document.addEventListener("click", (e) => {
    selectionsmtidk(e, e.target);
  });

  // SEARCH INVENTORY
  const searchinput = document.getElementById("search-bar");
  const searchButton = document.getElementById("search-btn");
  const SEARCH_DEBOUNCE_DELAY = 300;
  let searchTimeout;
  function searchinventory() {
    const searchTerm = searchinput.value.trim().toLowerCase();
    if (!searchTerm) {
      renderInventory();
      return;
    }
    const filtereditems = inventory.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
    );
    renderInventory(filtereditems);
  }
  searchButton.addEventListener("click", searchinventory);
  searchinput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchinventory();
    }, SEARCH_DEBOUNCE_DELAY);
  });
  searchinput.addEventListener("keyup", (event) => {
    if (event.key == "Enter") {
      searchinventory();
    } else if (searchinput.value.trim() === "") {
      renderInventory();
    }
  });

  // CONTEXT MENU
  const contextMenu = document.getElementById("contextMenu");
  const longPressThreshold = 700;
  let isLongPress = false;
  let pressTimer;
  let starX, startY;
  let currentContextitemId = null;
  const editContextBtn = document.getElementById("editContextBtn");
  const deleteContextBtn = document.getElementById("deleteContextBtn");

  function showContextMenu(e, targetElement) {
    e.preventDefault();
    const itemDiv = targetElement.closest(".inventory-item");
    if (itemDiv) {
      currentContextitemId = itemDiv.dataset.id;
      contextMenu.style.display = "block";
      contextMenu.style.left = `${e.pageX + 5}px`;
      contextMenu.style.top = `${e.pageY + 5}px`;
      disableScrolling();
    } else {
      hideContextMenu();
    }
  }
  function hideContextMenu() {
    contextMenu.style.display = "none";
    currentContextitemId = null;
    enableScrolling();
  }
  function handlePressStart(e) {
    if (e.type === "touchstart") {
      isLongPress = false;
      starX = e.touches && e.touches[0] ? e.touches[0].clientX : 0;
      startY = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
      pressTimer = setTimeout(() => {
        isLongPress = true;
        showContextMenu(e, e.target);
      }, longPressThreshold);
    }
  }
  function handlePressEnd() {
    clearTimeout(pressTimer);
    isLongPress = false;
  }
  inventoryGrid.addEventListener("contextmenu", (e) =>
    showContextMenu(e, e.target)
  );
  inventoryGrid.addEventListener("touchstart", handlePressStart);
  inventoryGrid.addEventListener("touchend", handlePressEnd);
  inventoryGrid.addEventListener("touchcancel", handlePressEnd);
  document.addEventListener("click", (e) => {
    if (!contextMenu.contains(e.target)) {
      hideContextMenu();
    }
  });

  // DELETE
  async function handleContextAction(action) {
    if (!currentContextitemId) return;
    if (action === "delete") {
      if (confirm("are you sure you want to delete this item?'")) {
        inventory = inventory.filter((item) => item.id != currentContextitemId);
        alert("item deleted succesfully!");
        renderInventory();
      }
    }
    hideContextMenu();
  }
  deleteContextBtn.addEventListener("click", () =>
    handleContextAction("delete")
  );

  // ADD ITEM
  const suggestionsBox = document.getElementById("suggestions");
  const categoryinput = document.getElementById("itemcategory");

  let categories = categorySet();

  function showSuggestions(value) {
    suggestionsBox.innerHTML = "";
    if (!value) {
      suggestionsBox.style.display = "none";
      return;
    }

    const matches = [...categories].filter((cat) =>
      cat.toLowerCase().startsWith(value.toLowerCase())
    );

    if (matches.length === 0) {
      suggestionsBox.style.display = "none";
      return;
    }
    matches.forEach((cat) => {
      const div = document.createElement("div");
      div.textContent = cat;
      div.classList.add("suggestion");
      div.addEventListener("click", () => {
        categoryinput.value = cat;
        suggestionsBox.style.display = "none";
      });
      suggestionsBox.appendChild(div);
    });
    suggestionsBox.style.display = "block";
  }
  categoryinput.addEventListener("input", () => {
    showSuggestions(categoryinput.value.trim());
  });

  // ADD MODAL MENU
  const cancelbutton = document.getElementById("cancelBtn");
  const addbutton = document.getElementById("addd");
  const addModal = document.getElementById("modal-overlay");
  const addForm = document.getElementById("add-form");

  function showaddmenu() {
    addModal.style.display = "flex";
    addForm.reset();
    disableScrolling();
  }
  function hideAddMenu() {
    addModal.style.display = "none";
    enableScrolling();
  }
  addbutton.addEventListener("click", () => {
    showaddmenu();
  });
  cancelbutton.addEventListener("click", hideAddMenu);
  addModal.addEventListener("click", (e) => {
    if (!addForm.contains(e.target)) {
      hideAddMenu();
    }
  });

  // ADD ITEM REAL

  let nextId =
    inventory.length > 0
      ? Math.max(...inventory.map((item) => item.id)) + 1
      : 1;
  const modalTitle = document.getElementById("modalTitle");
  const displaySelect = document.getElementById("displaySelect");
  const imageUpload = document.getElementById("imageUpload");
  const iconName = document.getElementById("iconName");
  const typeRadios = Array.from(
    document.querySelectorAll('input[name="type"]')
  );
  const itemNameInput = document.getElementById("itemname");
  const itemQuantityInput = document.getElementById("itemquantity");
  const quantityRow = document.getElementById("quantityRow");
  const categoryRow = document.getElementById("categoryRow");

  function additem() {
    const name = itemNameInput.value.trim();
    const quantity = itemQuantityInput.value.trim();
    const category = categoryinput.value.trim();

    if (!name || !category || isNaN(quantity) || quantity < 1) {
      alert("Please fill all the required fields with walid data.");
      return;
    }

    const newItem = {
      id: nextId,
      name: name,
      quantity: quantity,
      category: category,
    };
    inventory.push(newItem);
    alert("Item added successfully");
    addForm.reset();
    hideAddMenu();
    renderInventory();
  }
  addForm.addEventListener("submit", additem);
  // LOAD THE INVENTORY
  renderInventory();
});
