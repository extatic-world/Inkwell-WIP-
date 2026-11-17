/* ==========================================================
   APP.JS - how Inkwell behaves.

   Look for the sections marked:   >>> YOUR INPUT <<<
   Those are the places you need to fill in yourself.
   ========================================================== */


/* ==========================================================
   SECTION 1: SETTINGS  >>> YOUR INPUT <<<
   ========================================================== */

// Fonts offered in the font menus. Add a name here AFTER adding it in index.html's Google Fonts link.
const FONTS = ["Lora", "Fraunces", "Inter", "Space Grotesk", "Caveat", "Georgia", "Courier New"];

// Free dictionary services used by the Dictionary tab. These work as they are,
// but check each service's terms of use before launching a public site.
const DICTIONARY_URL = "https://api.dictionaryapi.dev/v2/entries/en/";   // definitions
const SYNONYM_URL = "https://api.datamuse.com/words?rel_syn=";           // synonyms
const ANTONYM_URL = "https://api.datamuse.com/words?rel_ant=";           // antonyms

// >>> YOUR INPUT <<<  Backend details (for Publish + Browse). Fill these in once you pick a service,
// for example Supabase or Firebase. Leave empty for now: the editor works without them.
const BACKEND_URL = "";    // e.g. "https://your-project.supabase.co"
const BACKEND_KEY = "";    // e.g. your project's public "anon" key (NEVER put secret keys in this file)


/* ==========================================================
   SECTION 2: SMALL HELPERS
   ========================================================== */

// $("postTitle") is a shortcut for document.getElementById("postTitle")
const $ = (id) => document.getElementById(id);

// Make a new element with some text. Using textContent (not innerHTML) keeps text safe.
function makeEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

// Remove anything dangerous (scripts, event handlers) from HTML written by OTHER people.
// A real site should ALSO clean on the server, ideally with a library such as DOMPurify.
function cleanHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, iframe, object, embed, style, link, meta").forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of [...el.attributes]) {
      const isEvent = attr.name.startsWith("on");                                   // onclick=...
      const isJs = /^\s*javascript:/i.test(attr.value);                             // href="javascript:..."
      if (isEvent || isJs) el.removeAttribute(attr.name);
    }
  });
  return doc.body.innerHTML;
}

// Fill a <select> menu with the FONTS list.
function fillFontMenu(select, withPlaceholder) {
  if (withPlaceholder) select.appendChild(new Option("Font", ""));
  FONTS.forEach((name) => select.appendChild(new Option(name, name)));
}
fillFontMenu($("fontSelect"), true);
fillFontMenu($("titleFont"), false);
fillFontMenu($("bodyFont"), false);
$("titleFont").value = "Fraunces";
$("bodyFont").value = "Lora";


/* ==========================================================
   SECTION 3: SAVING POSTS (in your browser's localStorage)
   Each post looks like:
   { id, title, html, paper, ink, titleFont, bodyFont, updated, published }
   ========================================================== */

const STORAGE_KEY = "inkwell-posts";
let posts = [];          // every post this person has written
let current = null;      // the post being edited right now

function loadPosts() {
  try { posts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (e) { posts = []; }
}

function savePosts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    $("status").textContent = "Saved";
  } catch (e) {
    // Browsers only allow about 5MB. Big videos can go over the limit.
    $("status").textContent = "Not saved: the post is too big (try smaller videos).";
  }
}

// Called whenever the person types: copy the page into the post object, then save.
let saveTimer;
function onEdit() {
  if (!current) return;
  current.title = $("postTitle").value;
  current.html = $("postBody").innerHTML;
  current.updated = Date.now();
  updateWordCount();
  $("status").textContent = "Saving...";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { savePosts(); renderPostList(); }, 500);   // wait 0.5s after typing stops
}

function newPost() {
  const post = { id: String(Date.now()), title: "", html: "", paper: "", ink: "",
                 titleFont: "Fraunces", bodyFont: "Lora", updated: Date.now(), published: false };
  posts.push(post);
  savePosts();
  showPost(post.id);
  $("postTitle").focus();
}

function deleteCurrentPost() {
  if (!current || !confirm("Delete this post?")) return;
  posts = posts.filter((p) => p !== current);
  current = null;
  savePosts();
  posts.length ? showPost(posts[0].id) : newPost();
}

// Put a post onto the notebook page.
function showPost(id) {
  current = posts.find((p) => p.id === id);
  if (!current) return;
  $("postTitle").value = current.title;
  $("postBody").innerHTML = current.html;
  applyPostStyle(current, $("page"));
  $("paperColor").value = current.paper || "#ffffff";
  $("inkColor").value = current.ink || "#222222";
  $("titleFont").value = current.titleFont;
  $("bodyFont").value = current.bodyFont;
  $("publishBtn").textContent = current.published ? "Unpublish" : "Publish";
  fitTitle();
  updateWordCount();
  renderPostList();
  showSideTab("editor");
}

// Apply a post's colours and fonts to a page element (works for the editor AND the reader).
function applyPostStyle(post, pageEl) {
  setOrClear(pageEl, "--paper", post.paper);
  setOrClear(pageEl, "--ink", post.ink);
  setOrClear(pageEl, "--title-font", post.titleFont && `"${post.titleFont}"`);
  setOrClear(pageEl, "--body-font", post.bodyFont && `"${post.bodyFont}"`);
}
function setOrClear(el, name, value) {
  value ? el.style.setProperty(name, value) : el.style.removeProperty(name);
}

function renderPostList() {
  const list = $("postList");
  list.innerHTML = "";
  [...posts].sort((a, b) => b.updated - a.updated).forEach((post) => {
    const btn = makeEl("button", post === current ? "on" : "", post.title || "Untitled post");
    btn.onclick = () => showPost(post.id);
    list.appendChild(btn);
  });
}

// The title box grows as you type, in steps of 64px so the dotted lines stay lined up.
function fitTitle() {
  const t = $("postTitle");
  t.style.height = "0px";
  t.style.height = Math.max(64, Math.ceil(t.scrollHeight / 64) * 64) + "px";
}

function updateWordCount() {
  const text = $("postBody").innerText.trim();
  const words = text ? text.split(/\s+/).length : 0;
  $("wordCount").textContent = words + (words === 1 ? " word" : " words");
}

$("postTitle").addEventListener("input", () => {
  $("postTitle").value = $("postTitle").value.replace(/\n/g, " ");   // titles stay on one "line" of text
  fitTitle();
  onEdit();
});
$("postTitle").addEventListener("keydown", (e) => {
  if (e.key === "Enter") { e.preventDefault(); $("postBody").focus(); }
});
$("postBody").addEventListener("input", onEdit);
$("newPostBtn").onclick = newPost;
$("deleteBtn").onclick = deleteCurrentPost;


/* ==========================================================
   SECTION 4: FORMATTING TOOLS (bold, fonts, colours...)
   These use document.execCommand: old, but works in every browser and is the simplest option.
   For a bigger project, look at editor libraries such as TipTap.
   ========================================================== */

// Clicking a toolbar button would normally make the text lose its selection.
// So we remember the selection and put it back before each command.
let savedRange = null;
document.addEventListener("selectionchange", () => {
  const sel = getSelection();
  if (sel.rangeCount && $("postBody").contains(sel.anchorNode)) {
    savedRange = sel.getRangeAt(0).cloneRange();
    highlightActiveTools();
  }
});
function restoreSelection() {
  $("postBody").focus();
  if (savedRange) { const sel = getSelection(); sel.removeAllRanges(); sel.addRange(savedRange); }
}
function runCommand(name, value) {
  restoreSelection();
  document.execCommand("styleWithCSS", false, true);   // use style="" instead of old <font> tags
  document.execCommand(name, false, value);
  onEdit();
}

// Bold / italic / underline / align / list buttons
document.querySelectorAll("[data-cmd]").forEach((btn) => {
  btn.onmousedown = (e) => e.preventDefault();          // keeps the text selected
  btn.onclick = () => runCommand(btn.dataset.cmd);
});
$("fontSelect").onchange = (e) => { if (e.target.value) runCommand("fontName", e.target.value); e.target.value = ""; };
$("sizeSelect").onchange = (e) => runCommand("fontSize", e.target.value);
$("textColor").oninput = (e) => runCommand("foreColor", e.target.value);
$("highlightColor").oninput = (e) => runCommand("hiliteColor", e.target.value);
$("textStyle").onchange = (e) => { restoreSelection(); document.execCommand("formatBlock", false, e.target.value); onEdit(); };
$("linkBtn").onmousedown = (e) => e.preventDefault();
$("linkBtn").onclick = () => {
  const url = prompt("Link address (starting with https://)");
  if (url && /^https?:\/\//i.test(url)) runCommand("createLink", url);
};

// Light up the B / I / U buttons when the cursor is inside bold / italic / underlined text.
function highlightActiveTools() {
  document.querySelectorAll("[data-cmd]").forEach((btn) => {
    let active = false;
    try { active = document.queryCommandState(btn.dataset.cmd); } catch (e) {}
    btn.classList.toggle("on", active);
  });
}

// Paper presets and custom colours/fonts (saved on the post)
function changeStyle(changes) {
  if (!current) return;
  Object.assign(current, changes);
  applyPostStyle(current, $("page"));
  onEdit();
}
document.querySelectorAll(".preset").forEach((btn) => {
  btn.onclick = () => {
    changeStyle({ paper: btn.dataset.paper, ink: btn.dataset.ink });
    $("paperColor").value = btn.dataset.paper || "#ffffff";
    $("inkColor").value = btn.dataset.ink || "#222222";
  };
});
$("paperColor").oninput = (e) => changeStyle({ paper: e.target.value });
$("inkColor").oninput = (e) => changeStyle({ ink: e.target.value });
$("titleFont").onchange = (e) => { changeStyle({ titleFont: e.target.value }); fitTitle(); };
$("bodyFont").onchange = (e) => changeStyle({ bodyFont: e.target.value });

// Preview: hides the editing cursor so you can see the post as readers will
$("previewBtn").onclick = () => {
  const previewing = $("postBody").contentEditable === "true";
  $("postBody").contentEditable = previewing ? "false" : "true";
  $("postTitle").readOnly = previewing;
  $("previewBtn").textContent = previewing ? "Back to editing" : "Preview";
};


/* ==========================================================
   SECTION 5: PHOTOS AND VIDEOS
   For simplicity the file is stored inside the post itself.
   That is fine for learning, but a real site should upload files to storage
   (see "YOUR INPUT" in Section 8) and save only the file's web address.
   ========================================================== */

function insertAtCursor(html) {
  restoreSelection();
  document.execCommand("insertHTML", false, html + "<p><br></p>");
  onEdit();
}
function readFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);   // result is the file as a long text string
    reader.readAsDataURL(file);
  });
}
$("addPhoto").onclick = () => $("photoInput").click();
$("addVideo").onclick = () => $("videoInput").click();
$("photoInput").onchange = async (e) => {
  if (e.target.files[0]) insertAtCursor(`<img src="${await readFile(e.target.files[0])}" alt="">`);
  e.target.value = "";
};
$("videoInput").onchange = async (e) => {
  if (e.target.files[0]) insertAtCursor(`<video src="${await readFile(e.target.files[0])}" controls></video>`);
  e.target.value = "";
};


/* ==========================================================
   SECTION 6: DARK MODE AND SIDEBAR
   ========================================================== */

// Dark mode: remember the choice; if none, follow the device's setting.
function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  $("themeBtn").textContent = theme === "dark" ? "Light mode" : "Dark mode";
  try { localStorage.setItem("inkwell-theme", theme); } catch (e) {}
}
let startTheme = null;
try { startTheme = localStorage.getItem("inkwell-theme"); } catch (e) {}
setTheme(startTheme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("themeBtn").onclick = () => {
  setTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
};

// Sidebar tabs: "editor" tools or "posts" list
function showSideTab(name) {
  $("editorPanel").hidden = name !== "editor";
  $("postsPanel").hidden = name !== "posts";
  $("sideTabEditor").classList.toggle("on", name === "editor");
  $("sideTabPosts").classList.toggle("on", name === "posts");
}
$("sideTabEditor").onclick = () => showSideTab("editor");
$("sideTabPosts").onclick = () => showSideTab("posts");

// Collapse / re-open the sidebar
function setCollapsed(collapsed) {
  $("writeView").classList.toggle("collapsed", collapsed);
  $("sideOpen").hidden = !collapsed;
}
$("sideClose").onclick = () => setCollapsed(true);
$("sideOpen").onclick = () => setCollapsed(false);


/* ==========================================================
   SECTION 7: SWITCHING BETWEEN WRITE / BROWSE / DICTIONARY
   ========================================================== */

function showView(name) {
  $("writeView").hidden = name !== "write";
  $("browseView").hidden = name !== "browse";
  $("dictView").hidden = name !== "dict";
  $("sideOpen").hidden = name !== "write" || !$("writeView").classList.contains("collapsed");
  $("tabWrite").classList.toggle("on", name === "write");
  $("tabBrowse").classList.toggle("on", name === "browse");
  $("tabDict").classList.toggle("on", name === "dict");
  if (name === "browse") renderBrowse();
}
$("tabWrite").onclick = () => showView("write");
$("tabBrowse").onclick = () => showView("browse");
$("tabDict").onclick = () => showView("dict");


/* ==========================================================
   SECTION 8: PUBLISHING AND BROWSING  >>> YOUR INPUT <<<
   These three functions are EMPTY on purpose. They are where your own
   database goes (Supabase, Firebase, your own server...).
   Until you fill them in, Publish and Browse show a friendly message.
   ========================================================== */

// >>> YOUR INPUT <<< Save a post so everyone can see it.
// Send the post to your database. Include who wrote it (your login system gives you this).
async function publishPost(post) {
  // Example idea (Supabase), after you have set BACKEND_URL / BACKEND_KEY and made a "posts" table:
  //   await supabase.from("posts").upsert({ id: post.id, title: post.title, html: post.html,
  //                                          paper: post.paper, ink: post.ink,
  //                                          title_font: post.titleFont, body_font: post.bodyFont });
  throw new Error("Publishing isn't connected yet. See Section 8 in app.js.");
}

// >>> YOUR INPUT <<< Remove a post from public view.
async function unpublishPost(post) {
  //   await supabase.from("posts").delete().eq("id", post.id);
  throw new Error("Publishing isn't connected yet. See Section 8 in app.js.");
}

// >>> YOUR INPUT <<< Get every published post.
// Must return a list like: [{ id, title, html, author, paper, ink, titleFont, bodyFont, updated }]
async function loadPublishedPosts() {
  //   const { data } = await supabase.from("posts").select("*").order("updated", { ascending: false });
  //   return data;
  throw new Error("Browsing isn't connected yet. See Section 8 in app.js.");
}

// The Publish / Unpublish button
$("publishBtn").onclick = async () => {
  if (!current) return;
  try {
    if (current.published) { await unpublishPost(current); current.published = false; }
    else { await publishPost(current); current.published = true; }
    $("publishBtn").textContent = current.published ? "Unpublish" : "Publish";
    savePosts();
  } catch (e) {
    $("status").textContent = e.message;
  }
};

// Draw the Browse page
async function renderBrowse() {
  const grid = $("postGrid");
  grid.innerHTML = "";
  $("reader").hidden = true;
  $("browseList").hidden = false;
  let all = [];
  try { all = await loadPublishedPosts(); }
  catch (e) { grid.appendChild(makeEl("p", "", e.message)); return; }

  const search = $("searchBox").value.trim().toLowerCase();
  all.filter((p) => !search || p.title.toLowerCase().includes(search)).forEach((post) => {
    const card = makeEl("button", "card");
    card.append(makeEl("h3", "", post.title || "Untitled post"),
                makeEl("small", "", post.author || "Unknown writer"));
    card.onclick = () => openReader(post);
    grid.appendChild(card);
  });
  if (!grid.children.length) grid.appendChild(makeEl("p", "", "No articles yet."));
}
$("searchBox").oninput = renderBrowse;

// Show one article full-page
function openReader(post) {
  applyPostStyle(post, $("readerPage"));
  $("readerTitle").textContent = post.title;
  $("readerBody").innerHTML = cleanHtml(post.html);   // always clean other people's HTML
  $("browseList").hidden = true;
  $("reader").hidden = false;
}
$("readerBack").onclick = () => { $("reader").hidden = true; $("browseList").hidden = false; };


/* ==========================================================
   SECTION 9: DICTIONARY AND THESAURUS
   Uses the free services from Section 1. No account needed.
   ========================================================== */

let dictMode = "dict";   // "dict" or "thes"

async function lookUp() {
  const word = $("wordInput").value.trim().toLowerCase();
  const out = $("results");
  if (!word) return;
  out.textContent = "Looking up...";
  try {
    dictMode === "dict" ? await showDefinitions(word, out) : await showSynonyms(word, out);
  } catch (e) {
    out.textContent = "Sorry, no result for \"" + word + "\". Check the spelling or your connection.";
  }
}

async function showDefinitions(word, out) {
  const response = await fetch(DICTIONARY_URL + encodeURIComponent(word));
  if (!response.ok) throw new Error("not found");
  const entry = (await response.json())[0];
  out.innerHTML = "";
  out.appendChild(makeEl("h2", "", entry.word));
  if (entry.phonetic) out.appendChild(makeEl("small", "", entry.phonetic));
  entry.meanings.forEach((meaning) => {
    out.appendChild(makeEl("h3", "", meaning.partOfSpeech));
    const list = document.createElement("ol");
    meaning.definitions.slice(0, 3).forEach((d) => {
      const item = makeEl("li", "", d.definition);
      if (d.example) item.append(document.createElement("br"), makeEl("em", "", "\"" + d.example + "\""));
      list.appendChild(item);
    });
    out.appendChild(list);
  });
}

async function showSynonyms(word, out) {
  const [syn, ant] = await Promise.all([
    fetch(SYNONYM_URL + encodeURIComponent(word)).then((r) => r.json()),
    fetch(ANTONYM_URL + encodeURIComponent(word)).then((r) => r.json()),
  ]);
  out.innerHTML = "";
  out.appendChild(makeEl("h2", "", word));
  [["Synonyms", syn], ["Antonyms", ant]].forEach(([title, words]) => {
    if (!words.length) return;
    out.appendChild(makeEl("h3", "", title));
    words.slice(0, 15).forEach((w) => {
      const chip = makeEl("button", "chip", w.word);
      chip.onclick = () => { $("wordInput").value = w.word; lookUp(); };   // click a word to look it up
      out.appendChild(chip);
    });
  });
  if (out.children.length === 1) out.appendChild(makeEl("p", "", "No results found."));
}

$("lookupBtn").onclick = lookUp;
$("wordInput").addEventListener("keydown", (e) => { if (e.key === "Enter") lookUp(); });
$("modeDict").onclick = () => setDictMode("dict");
$("modeThes").onclick = () => setDictMode("thes");
function setDictMode(mode) {
  dictMode = mode;
  $("modeDict").classList.toggle("on", mode === "dict");
  $("modeThes").classList.toggle("on", mode === "thes");
  if ($("wordInput").value.trim()) lookUp();
}


/* ==========================================================
   SECTION 10: START THE APP
   ========================================================== */

loadPosts();
posts.length ? showPost(posts[0].id) : newPost();
showView("write");
