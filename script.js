document.addEventListener("DOMContentLoaded", () => {
  let inventory = [
    { id: 1, name: "Apple", quantity: 10, category: "Fruit" },
    { id: 2, name: "Banana", quantity: 5, category: "Fruit" },
    { id: 3, name: "Carrot", quantity: 8, category: "Vegetable" },
  ];
  const inventoryGrid = document.getElementById("inventoryGrid");
  const contextMenu = document.getElementById("contextMenu");
  const editContextBtn = document.getElementById("editContextBtn");
  const deleteContextBtn = document.getElementById("deleteContextBtn");
  const searchinput = document.getElementById("search-bar");
  const searchButton = document.getElementById("search-i");
  const longPressThreshold = 700;
  let isLongPress = false;
  let pressTimer;
  let starX, startY;
  let currentContextitemId = null;
  function renderInventory(itemsToRender) {
    inventoryGrid.innerHTML = "";
    itemsToRender.forEach((item) => {
      const itemDiv = document.createElement("div");
      itemDiv.classList.add("inventory-item");
      itemDiv.dataset.id = item.id;
      itemDiv.innerHTML = `
                <img src="placeholder1.png" alt="thumbnail">
                <h3>${item.name}</h3>
            `;
      inventoryGrid.appendChild(itemDiv);
    });
  }
  function searchinventory() {
    const searchTerm = searchinput.ariaValueMax.trim().toLowerCase();
    if (!searchTerm) {
      renderInventory();
      return;
    }
    const filtereditems = inventory.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
    );
    renderInventory(filtereditems);
  }
  function editItem(id) {
    const item = inventory.find((item) => item.id === id);
    if (item) {
      const newName = prompt("Enter new name:", item.name);
      const newQuantity = prompt("Enter new quantity:", item.quantity);
      const newCategory = prompt("Enter new category:", item.category);
      if (newName && newQuantity && newCategory) {
        item.name = newName;
        item.quantity = parseInt(newQuantity);
        item.category = newCategory;
        renderInventory(inventory);
      }
    }
  }

  function deleteItem(id) {
    inventory = inventory.filter((item) => item.id !== id);
    renderInventory(inventory);
  }
  function disableScrolling() {
    document.body.classList.add("no-scroll");
  }
  function enableScrolling() {
    document.body.classList.remove("no-scroll");
  }

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
    if (isLongPress) {
      pass;
    }
    isLongPress = false;
  }
  // event listners
  searchButton.addEventListener("click", searchinventory);
  searchinput.addEventListener("change", searchinventory);
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
  renderInventory(inventory);
});
