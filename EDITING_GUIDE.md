# Tammy Goodwater Portfolio: How to Edit and Publish

This folder holds everything for your portfolio website.

| File or folder | What it is |
| --- | --- |
| `index.html` | The whole portfolio page. Open it in Chrome to preview. |
| `images/` | Every project image, named by project (for example, `troutfin-laptop.jpg`). |
| `Tammy_Goodwater_Resume.pdf` | The résumé your Download buttons point to. |
| `Figma_Import_Tammy_Goodwater_Portfolio.html` | A single-file copy with images built in, for importing into Figma. |

---

## Publish it (get a real link)

**Option A: Netlify Drop (fastest)**
1. Go to app.netlify.com/drop.
2. Drag the site folder onto the page. You get a live link right away.
3. Sign up for a free account right away to keep the site. Netlify deletes unclaimed sites quickly.
4. To update later, open your site in Netlify and drag the new `website` folder onto **Production deploys**.

**Option B: GitHub Pages (Claude can update it for you)**
1. Make a free GitHub account and a public repository named `yourusername.github.io`.
2. Connect GitHub in claude.ai **Settings → Connectors**.
3. Tell Claude the repository name, and Claude will upload the site and publish it.

---

## Make quick changes yourself

Open `index.html` in a plain text editor. Use **TextEdit** on Mac (Format → Make Plain Text) or **Notepad** on Windows. **VS Code** (free) is even better because it color-codes everything.

**Find a section:** every part of the page starts with a labeled line like this:
`<!-- ==================== PROJECT 05: MISSOURI RIVER OUTDOOR EXPO ==================== -->`
Search (Ctrl+F or Cmd+F) for the project name to jump straight there.

**Change words:** edit the text between the tags. Leave everything inside `< >` alone.

**Swap an image (easiest):** save your new image into `images/` with the **same file name** as the old one. That replaces it everywhere, with no code changes.

**Use a new image file name:** find the old name in `index.html` (for example `images/expo-poster.jpg`) and change it to your new file name. Also update the `alt="..."` text next to it so screen readers describe the new image.

**Change brand colors:** near the top of `index.html`, look for **EDIT YOUR BRAND COLORS HERE**. Change a hex code once, like `--teal:#00B2BD;`, and it updates across the whole page. The angled shapes behind the hero and contact sections have their own colors in `fill="..."`.

**Replace your résumé:** save the new PDF into this folder as `Tammy_Goodwater_Resume.pdf`.

**Tips**
- Save a copy of the folder before big edits, so you can always go back.
- Keep images under about 1,600 pixels on the long side so the site loads fast.
- After editing, open `index.html` in Chrome and refresh to check your change.

---

## Redesign it visually in Figma

1. Install the **html.to.design** plugin in Figma and its Chrome extension.
2. Open `Figma_Import_Tammy_Goodwater_Portfolio.html` in Chrome.
3. Click the html.to.design extension icon, choose **Desktop** (and **Mobile** if you want it), choose **Send to Figma plugin**, and click **Capture**.
4. Open the plugin in Figma to bring the page in as editable layers.

Figma is for designing. To put Figma changes on the live site, send Claude screenshots of your updated design and Claude will update `index.html` to match.

---

## Still on the to-do list

- [ ] Expo social graphic: the web address was corrected to OUTDOORNEBRASKA.GOV on the website copy only. Fix it in the original design file too.
