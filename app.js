/**
 * Trello-inspired PM Board — vanilla JS, localStorage persistence
 */
(function () {
  "use strict";

  const STORAGE_KEY = "pm-board-v2";

  const LABEL_NAMES = {
    feature: "Feature",
    bug: "Bug",
    chore: "Chore",
    design: "Design",
  };

  const DEFAULT_DATA = {
    title: "My Projects",
    lists: [
      {
        id: "list-backlog",
        title: "Backlog",
        cards: [
          {
            id: "card-1",
            title: "Research competitor PM tools",
            description: "Compare Trello, Asana, and Linear feature sets.",
            label: "chore",
          },
          {
            id: "card-2",
            title: "Sketch mobile board layout",
            description: "Rough wireframes for phone viewport.",
            label: "feature",
          },
          {
            id: "card-3",
            title: "Define MVP acceptance criteria",
            description: "",
            label: "feature",
          },
        ],
      },
      {
        id: "list-todo",
        title: "To Do",
        cards: [
          {
            id: "card-4",
            title: "Set up project repo and README",
            description: "Init git, add license, basic docs.",
            label: "chore",
          },
          {
            id: "card-5",
            title: "Design color tokens for dark mode",
            description: "Extend palette beyond the teal board.",
            label: "feature",
          },
          {
            id: "card-6",
            title: "Add keyboard shortcuts for cards",
            description: "N for new, Del to remove focused card.",
            label: "feature",
          },
        ],
      },
      {
        id: "list-progress",
        title: "In Progress",
        cards: [
          {
            id: "card-7",
            title: "Build drag-and-drop between lists",
            description: "HTML5 DnD with drop indicators.",
            label: "feature",
          },
          {
            id: "card-8",
            title: "Fix card shadow on Safari",
            description: "Subtle clipping on list overflow.",
            label: "bug",
          },
        ],
      },
      {
        id: "list-done",
        title: "Done",
        cards: [
          {
            id: "card-9",
            title: "Create initial board shell",
            description: "Header, lists, and sample cards.",
            label: "feature",
          },
          {
            id: "card-10",
            title: "Wire localStorage persistence",
            description: "Save title, lists, and card order.",
            label: "chore",
          },
        ],
      },
    ],
  };

  let state = null;
  let pendingListId = null;
  let dragCardId = null;
  let dragFromListId = null;

  const boardEl = document.getElementById("board");
  const titleEl = document.getElementById("board-title");
  const tplList = document.getElementById("tpl-list");
  const tplCard = document.getElementById("tpl-card");
  const dialog = document.getElementById("add-card-dialog");
  const form = document.getElementById("add-card-form");
  const btnReset = document.getElementById("btn-reset");
  const btnCancel = document.getElementById("add-card-cancel");

  function uid(prefix) {
    return prefix + "-" + Math.random().toString(36).slice(2, 10);
  }

  function cloneDefault() {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return cloneDefault();
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.lists)) return cloneDefault();
      return parsed;
    } catch {
      return cloneDefault();
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function findList(listId) {
    return state.lists.find((l) => l.id === listId);
  }

  function findCard(cardId) {
    for (const list of state.lists) {
      const idx = list.cards.findIndex((c) => c.id === cardId);
      if (idx !== -1) return { list, idx, card: list.cards[idx] };
    }
    return null;
  }


  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function observeCardReveal(root) {
    if (prefersReducedMotion()) return;
    const cards = root.querySelectorAll(".card:not(.card-enter-active)");
    if (!cards.length) return;
    cards.forEach((el) => el.classList.add("card-enter"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          // next frame so transition runs from card-enter state
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.classList.add("card-enter-active");
              el.classList.remove("card-enter");
            });
          });
          io.unobserve(el);
        });
      },
      { root: null, threshold: 0.08, rootMargin: "0px 0px -8px 0px" }
    );
    cards.forEach((el) => io.observe(el));
  }

  function render() {
    titleEl.textContent = state.title || "My Projects";
    boardEl.replaceChildren();

    for (const list of state.lists) {
      const listNode = tplList.content.firstElementChild.cloneNode(true);
      listNode.dataset.listId = list.id;
      listNode.querySelector(".list-title").textContent = list.title;
      listNode.querySelector(".card-count").textContent = String(list.cards.length);

      const zone = listNode.querySelector("[data-drop-zone]");
      for (const card of list.cards) {
        zone.appendChild(renderCard(card));
      }

      bindListEvents(listNode, list.id);
      boardEl.appendChild(listNode);
    }
    observeCardReveal(boardEl);
  }

  function renderCard(card) {
    const node = tplCard.content.firstElementChild.cloneNode(true);
    node.dataset.cardId = card.id;
    node.querySelector(".card-title").textContent = card.title;

    const descEl = node.querySelector(".card-desc");
    if (card.description && card.description.trim()) {
      descEl.textContent = card.description;
      descEl.hidden = false;
    } else {
      descEl.hidden = true;
    }

    const labelsEl = node.querySelector(".card-labels");
    if (card.label && LABEL_NAMES[card.label]) {
      const chip = document.createElement("span");
      chip.className = "label-chip " + card.label;
      chip.title = LABEL_NAMES[card.label];
      chip.setAttribute("aria-label", LABEL_NAMES[card.label]);
      labelsEl.appendChild(chip);
      labelsEl.hidden = false;
    } else {
      labelsEl.hidden = true;
    }

    bindCardEvents(node, card.id);
    return node;
  }

  function bindListEvents(listNode, listId) {
    const title = listNode.querySelector(".list-title");
    title.addEventListener("blur", () => {
      const list = findList(listId);
      if (!list) return;
      const next = title.textContent.trim() || list.title;
      title.textContent = next;
      if (next !== list.title) {
        list.title = next;
        save();
      }
    });
    title.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        title.blur();
      }
    });

    listNode.querySelector(".add-card-btn").addEventListener("click", () => {
      pendingListId = listId;
      form.reset();
      dialog.showModal();
      form.elements.title.focus();
    });

    const zone = listNode.querySelector("[data-drop-zone]");
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", (e) => {
      if (!zone.contains(e.relatedTarget)) {
        zone.classList.remove("drag-over");
      }
    });
    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.classList.remove("drag-over");
      const cardId = e.dataTransfer.getData("text/plain") || dragCardId;
      if (!cardId) return;
      moveCard(cardId, listId, getDropIndex(zone, e.clientY));
    });
  }

  function getDropIndex(zone, clientY) {
    const cards = [...zone.querySelectorAll(".card:not(.dragging)")];
    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY < mid) return i;
    }
    return cards.length;
  }

  function bindCardEvents(node, cardId) {
    node.addEventListener("dragstart", (e) => {
      dragCardId = cardId;
      const found = findCard(cardId);
      dragFromListId = found ? found.list.id : null;
      node.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", cardId);
    });
    node.addEventListener("dragend", () => {
      node.classList.remove("dragging");
      dragCardId = null;
      dragFromListId = null;
      boardEl.querySelectorAll(".drag-over").forEach((el) => el.classList.remove("drag-over"));
    });

    node.querySelector(".card-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      deleteCard(cardId);
    });
  }

  function moveCard(cardId, toListId, toIndex) {
    const found = findCard(cardId);
    const toList = findList(toListId);
    if (!found || !toList) return;

    const [card] = found.list.cards.splice(found.idx, 1);
    let insertAt = typeof toIndex === "number" ? toIndex : toList.cards.length;

    // If moving within same list and removing an earlier index, adjust
    if (found.list.id === toListId && found.idx < insertAt) {
      insertAt -= 1;
    }
    insertAt = Math.max(0, Math.min(insertAt, toList.cards.length));
    toList.cards.splice(insertAt, 0, card);
    save();
    render();
  }

  function deleteCard(cardId) {
    const found = findCard(cardId);
    if (!found) return;
    found.list.cards.splice(found.idx, 1);
    save();
    render();
  }

  function addCard(listId, title, description, label) {
    const list = findList(listId);
    if (!list) return;
    list.cards.push({
      id: uid("card"),
      title: title.trim(),
      description: (description || "").trim(),
      label: label || "",
    });
    save();
    render();
  }

  titleEl.addEventListener("blur", () => {
    const next = titleEl.textContent.trim() || "My Projects";
    titleEl.textContent = next;
    if (next !== state.title) {
      state.title = next;
      save();
    }
  });
  titleEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      titleEl.blur();
    }
  });

  form.addEventListener("submit", (e) => {
    // method=dialog closes on submit; we handle add ourselves
    const submitter = e.submitter;
    if (submitter && submitter.value === "cancel") return;
    e.preventDefault();
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim();
    if (!title || !pendingListId) {
      dialog.close();
      return;
    }
    addCard(
      pendingListId,
      title,
      String(data.get("description") || ""),
      String(data.get("label") || "")
    );
    pendingListId = null;
    dialog.close();
  });

  btnCancel.addEventListener("click", () => {
    pendingListId = null;
    dialog.close();
  });

  btnReset.addEventListener("click", () => {
    if (!confirm("Reset the board to the sample 10 cards? Your changes will be lost.")) return;
    state = cloneDefault();
    save();
    render();
  });

  // Boot
  state = load();
  // If stored board has wrong card count from older experiments, keep user data;
  // first visit uses DEFAULT_DATA with exactly 10 cards.
  save();
  render();
})();
