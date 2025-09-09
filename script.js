document.addEventListener("DOMContentLoaded", () => {
  // DATABASE
  let inventory = [
    { id: 1, name: "Apple", quantity: 10, category: "Fruit" },
    { id: 2, name: "Banana", quantity: 5, category: "Fruit" },
    { id: 3, name: "Carrot", quantity: 8, category: "Vegetable" },
  ];

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
  function updateSelection() {
    const si = selectedIds.size;
    console.log(si);
    if (si > 0) trashbutton.style.display = "inline-flex";
    else trashbutton.style.display = "none";
    inventoryGrid.querySelectorAll(".inventory-item").forEach((item) => {
      const id = Number(item.dataset.id);
      if (selectedIds.has(id)) item.classList.add("selected");
      else item.classList.remove("selected");
    });
  }
  function selectionsmtidk(ee, targetElement) {
    selectedDiv = targetElement.closest(".inventory-item");
    if (selectedDiv) {
      selectedDiv.classList.add("selected");
      selectedIds.add(selectedDiv.dataset.id);
    } else if (!inventoryGrid.contains(targetElement)) {
      updateSelection();
      selectedIds.clear();
      selectedDiv = null;
    }
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
  function additem() {}
  addbutton.addEventListener("click", () => {
    console.log("testttt");
    showaddmenu();
  });
  cancelBtn.addEventListener("click", hideAddMenu);
  addModal.addEventListener("click", (e) => {
    if (!addForm.contains(e.target)) {
      hideAddMenu();
    }
  });

  // LOAD THE INVENTORY
  renderInventory();
});
