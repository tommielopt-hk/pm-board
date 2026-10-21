# PM Board

Tommie's Trello-style project board. The sample board is **Mr Lee — Grok Bot 25 Concepts**: a teach → revise → master tracker for the 25 Grok Bot concepts (Nate Herk). All 25 cards start in **Concepts**; drag a card to **Teach** after class, **Revise** while reviewing, and **Master** when it sticks. Vanilla HTML, CSS, and JavaScript — no build step.

**Live site:** https://tommielopt-hk.github.io/pm-board/

**Flashcards:** https://tommielopt-hk.github.io/pm-board/flashcards/

GitHub Pages source: branch `main`, folder `/` (root).

Serve locally from the repository root:

```bash
python3 -m http.server 8765
```

Then open http://127.0.0.1:8765/

## Palette

Chrome follows [Burlington Square Singapore](https://www.burlingtonsquare.com.sg/). Tokens in `styles.css` `:root`:

- Orange `#F97A11` — primary CTAs, focus, header accent, design chips
- Green `#467C45` and `#267A48` — logo and feature / chore chips
- Surfaces `#FFFFFF`, `#F3F3F3`, `#E2E2E2`
- Ink `#000000` titles, `#32373C` body, `#2D3940` charcoal
- Muted text `#777777` and `#4E4E4E`
