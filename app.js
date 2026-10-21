/**
 * Trello-inspired PM Board — vanilla JS, localStorage persistence.
 * Sample board: Mr Lee — Grok Bot 25 Concepts (teach → revise → master).
 */
(function () {
  "use strict";

  const STORAGE_KEY = "pm-board-v4-mrlee";
  const DEFAULT_TITLE = "Mr Lee — Grok Bot 25 Concepts";

  const LABEL_NAMES = {
    feature: "Feature",
    bug: "Bug",
    chore: "Chore",
    design: "Design",
  };

  const DEFAULT_DATA = {
    title: DEFAULT_TITLE,
    lists: [
      {
        id: "list-concepts",
        title: "Concepts",
        cards: [
          {
            id: "card-1",
            title: "1. Single bot",
            description: "One named bot with a job title and description; each chat is its own specialist.",
            label: "feature",
          },
          {
            id: "card-2",
            title: "2. Bot descriptions",
            description: "Clear descriptions let bots know when to take work or hand off to a teammate.",
            label: "feature",
          },
          {
            id: "card-3",
            title: "3. Bot templates",
            description: "Import or share bots (skills/memories/structure); reconnect your own accounts.",
            label: "feature",
          },
          {
            id: "card-4",
            title: "4. Context & memory",
            description: "Context = current chat + inputs; memory = lasting facts. Global memory vs per-bot memory.",
            label: "feature",
          },
          {
            id: "card-5",
            title: "5. Compaction",
            description: "Each bot auto-summarises old chat so the context window does not rot; you do not control the moment.",
            label: "feature",
          },
          {
            id: "card-6",
            title: "6. Agent computer",
            description: "Every bot has a desktop/screen it can drive; bots share one underlying computer.",
            label: "chore",
          },
          {
            id: "card-7",
            title: "7. Browser",
            description: "Bot browser with saved logins for sites you signed into.",
            label: "chore",
          },
          {
            id: "card-8",
            title: "8. File explorer (shared workspace)",
            description: "All bots see the same shared workspace files on the agent computer.",
            label: "chore",
          },
          {
            id: "card-9",
            title: "9. Terminal",
            description: "Bots can run shell commands and scripts like a normal computer.",
            label: "chore",
          },
          {
            id: "card-10",
            title: "10. Local file access",
            description: "With approval; bots can read/rename/move files on your own machine.",
            label: "chore",
          },
          {
            id: "card-11",
            title: "11. Plugins",
            description: "Connect Slack/Gmail/Docs/etc. by adding a plugin and signing in; multi-account OK.",
            label: "design",
          },
          {
            id: "card-12",
            title: "12. Skills",
            description: "Reusable recipes (when to use / steps / failure handling); editable and improvable with feedback.",
            label: "design",
          },
          {
            id: "card-13",
            title: "13. Teach a task",
            description: "Record yourself in the browser; bot watches and turns the demo into a Skill.",
            label: "design",
          },
          {
            id: "card-14",
            title: "14. Routines",
            description: "Schedule or interval triggers that can run a Skill automatically.",
            label: "design",
          },
          {
            id: "card-15",
            title: "15. Webhooks / event triggers",
            description: "Event doorbells (form/Slack/email/CRM) wake a bot with a payload.",
            label: "design",
          },
          {
            id: "card-16",
            title: "16. Group chats",
            description: "Multi-bot rooms where specialists discuss and you oversee.",
            label: "feature",
          },
          {
            id: "card-17",
            title: "17. Mentions",
            description: "@Name steers a teammate; good descriptions also let bots self-delegate.",
            label: "feature",
          },
          {
            id: "card-18",
            title: "18. Handoffs",
            description: "Bots assign work to other bots; you can open their private handoff threads.",
            label: "feature",
          },
          {
            id: "card-19",
            title: "19. Replies",
            description: "Reply-to a specific message to pin context (like Slack).",
            label: "feature",
          },
          {
            id: "card-20",
            title: "20. Approvals",
            description: "Pause for allow-once / always-allow on computer and risky actions.",
            label: "chore",
          },
          {
            id: "card-21",
            title: "21. Human takeover",
            description: "Bot stops for sign-in/sensitive steps; enter secrets on screen not in chat.",
            label: "chore",
          },
          {
            id: "card-22",
            title: "22. Weekly usage",
            description: "Subscription usage resets weekly; group chats cost more than 1:1.",
            label: "chore",
          },
          {
            id: "card-23",
            title: "23. Run history",
            description: "See that routines/webhooks fired (success/fail); limited drill-down today.",
            label: "chore",
          },
          {
            id: "card-24",
            title: "24. Notifications",
            description: "Per-bot finish/needs-input alerts; desktop + phone stay synced.",
            label: "chore",
          },
          {
            id: "card-25",
            title: "25. Managing bots",
            description: "Pin / move sections / hide / delete / share template / duplicate (clears chat history) / copy conversation ID.",
            label: "chore",
          },
        ],
      },
      {
        id: "list-teach",
        title: "Teach",
        cards: [],
      },
      {
        id: "list-revise",
        title: "Revise",
        cards: [],
      },
      {
        id: "list-master",
        title: "Master",
        cards: [],
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
    titleEl.textContent = state.title || DEFAULT_TITLE;
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
    const next = titleEl.textContent.trim() || DEFAULT_TITLE;
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
    if (!confirm("Reset the board to the Mr Lee concept tracker? Your changes will be lost.")) return;
    state = cloneDefault();
    save();
    render();
  });

  // Boot
  state = load();
  // A new STORAGE_KEY loads DEFAULT_DATA for visitors who still have the old campaign board.
  // Reset restores this same concept tracker.
  save();
  render();
})();
