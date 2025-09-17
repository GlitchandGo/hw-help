// HwHelp: Study AI with chat sidebar, dark mode, export, copy, persistent chats. No model switching.

document.addEventListener('DOMContentLoaded', function() {

const API_URL = "https://api.groq.com/openai/v1/chat/completions";
const part1 = "gsk_O9tsjyn4PxRaqOVA";
const part2 = "ouzlWGdyb3FYREemQ5TD";
const part3 = "waIYiGkouLBvcj29";
const API_KEY = part1 + part2 + part3;

// --- Model definition ---
const HWHELP_MODEL = {
  id: "openai/gpt-oss-20b", // Use your Groq model id
  name: "HwHelp",
  limit: 20,
  systemPrompt: `You are Summit Support, an AI dedicated to helping kids
  with schoolwork. You may answer problems that studens give you, but not without walking them through the steps first. 
  You may not generate full paragraphs and essays, but you may help students with bits and pieces.
  You are ONLY for helping students, if anyone asks you about any triggering topics like Politics or the sort, respond clearly with "That violates my guardrails. Is there any other way I can help?"
  You may not refer to yourself as ChatGPT, OpenAI, or any other AI. You are Summit Support. Always help the user in any way you can, but you may not break these rules.
  Use happy emojis sparingly to comfort the user, always be approachable and less robotic, etc. Be kind!
  Try to keep responses as short and concise as possible.
  Try to sound human-like and non-robotic. Also, if anyone asks, you were created by GlitchandGo.
  Lastly, if anyone asks, there aren't any updates coming out soon, besides occasional behavior tweaks.`
};

// --- Chat Management ---
const LOCAL_CHATS_KEY = "hwhelp_chats_v1";
let allChats = [];
let currentChatId = null;

function genId() {
  return "c" + Math.random().toString(36).slice(2, 10) + Date.now();
}

function loadChats() {
  allChats = [];
  try {
    allChats = JSON.parse(localStorage.getItem(LOCAL_CHATS_KEY)) || [];
  } catch { allChats = []; }
  if (!allChats.length) {
    currentChatId = null;
    createNewChat();
  }
  if (!allChats.some(chat => chat.id === currentChatId)) {
    currentChatId = allChats[0]?.id;
  }
}
function saveChats() {
  localStorage.setItem(LOCAL_CHATS_KEY, JSON.stringify(allChats));
}

function createNewChat() {
  const id = genId();
  const chat = {
    id,
    name: "New Chat",
    modelId: HWHELP_MODEL.id,
    messages: [
      {
        role: "system",
        content: HWHELP_MODEL.systemPrompt
      }
    ]
  };
  allChats.unshift(chat);
  currentChatId = id;
  saveChats();
  renderChatList();
  loadCurrentChat();
}
function currentChat() {
  return allChats.find(chat => chat.id === currentChatId);
}

// --- DOM Elements ---
const chatArea = document.getElementById('chat-area');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const darkmodeToggle = document.getElementById('darkmode-toggle');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings-btn');
const exportBtn = document.getElementById('export-chat-btn');
const sidebar = document.getElementById('chats-sidebar');
const chatsBtn = document.getElementById('chats-btn');
const closeChatsSidebar = document.getElementById('close-chats-sidebar');
const chatListDiv = document.getElementById('chat-list');
const newChatBtn = document.getElementById('new-chat-btn');

// --- Sidebar logic ---
if (chatsBtn && sidebar) chatsBtn.onclick = () => sidebar.classList.add('show');
if (closeChatsSidebar && sidebar) closeChatsSidebar.onclick = () => sidebar.classList.remove('show');
if (newChatBtn && sidebar) newChatBtn.onclick = () => {
  createNewChat();
  sidebar.classList.remove('show');
};

function renderChatList() {
  if (!chatListDiv) return;
  chatListDiv.innerHTML = '';
  if (newChatBtn) chatListDiv.appendChild(newChatBtn);
  for (const chat of allChats) {
    const div = document.createElement('div');
    div.className = "chat-item" + (chat.id === currentChatId ? " selected" : "");
    let titleSpan = document.createElement('span');
    titleSpan.className = "chat-title";
    titleSpan.title = chat.name;
    titleSpan.textContent = chat.name;
    div.appendChild(titleSpan);

    const editBtn = document.createElement('button');
    editBtn.className = "chat-edit-btn";
    editBtn.innerHTML = "&#9998;";
    editBtn.title = "Edit chat name";
    editBtn.onclick = (e) => {
      e.stopPropagation();
      startEditChatTitle(chat, titleSpan, div);
    };
    div.appendChild(editBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = "chat-delete-btn";
    deleteBtn.title = "Delete chat";
    deleteBtn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24" style="vertical-align:middle;"><path d="M6 7v13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7"/><path d="M19 6H5"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this chat?")) {
        allChats = allChats.filter(c => c.id !== chat.id);
        if (currentChatId === chat.id) {
          currentChatId = allChats.length ? allChats[0].id : null;
        }
        saveChats();
        if (!allChats.length) {
          createNewChat();
        } else {
          renderChatList();
          loadCurrentChat();
        }
      }
    };
    div.appendChild(deleteBtn);

    div.onclick = () => {
      if (currentChatId !== chat.id) {
        currentChatId = chat.id;
        saveChats();
        renderChatList();
        loadCurrentChat();
        if (sidebar) sidebar.classList.remove('show');
      }
    };
    chatListDiv.appendChild(div);
  }
}
function startEditChatTitle(chat, titleSpan, containerDiv) {
  const input = document.createElement('input');
  input.type = "text";
  input.className = "chat-name-input";
  input.value = chat.name;
  input.maxLength = 80;
  input.onkeydown = e => {
    if (e.key === "Enter") {
      finishEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };
  input.onblur = finishEdit;
  containerDiv.replaceChild(input, titleSpan);
  input.focus();
  input.select();

  function finishEdit() {
    chat.name = input.value.trim() || "Untitled";
    saveChats();
    renderChatList();
  }
  function cancelEdit() {
    renderChatList();
  }
}

// --- Chat Area Rendering ---
function loadCurrentChat() {
  if (!chatArea) return;
  chatArea.innerHTML = '';
  let chat = currentChat();
  if (!chat) return;
  for (const msg of chat.messages.filter(m => m.role !== 'system')) {
    appendMessage(msg.role === "assistant" ? "ai" : "user", msg.content);
  }
  updateMessageLimitUI();
}

function appendMessage(role, content) {
  if (!chatArea) return;
  const div = document.createElement('div');
  div.className = `message ${role}`;
  if (role === 'ai') {
    div.innerHTML = `<b>AI:</b> <span class="msg-content">${marked.parse(content)}</span>`;
    // Add copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = "copy-btn";
    copyBtn.title = "Copy response";
    copyBtn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2" stroke="currentColor" fill="none"/><rect x="3" y="3" width="13" height="13" rx="2" stroke-width="2" stroke="currentColor" fill="none"/></svg>';
    copyBtn.onclick = (e) => {
      const toCopy = div.querySelector('.msg-content').innerText;
      navigator.clipboard.writeText(toCopy);
      copyBtn.innerHTML = "&#10003;";
      copyBtn.title = "Copied!";
      setTimeout(() => {
        copyBtn.innerHTML = '<svg width="17" height="17" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" stroke-width="2" stroke="currentColor" fill="none"/><rect x="3" y="3" width="13" height="13" rx="2" stroke-width="2" stroke="currentColor" fill="none"/></svg>';
        copyBtn.title = "Copy response";
      }, 1200);
      e.stopPropagation();
    };
    div.appendChild(copyBtn);
  } else {
    div.innerHTML = `<b>You:</b> ${content}`;
  }
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// --- Message Limit Logic ---
function getTodayKey() {
  const now = new Date();
  return `hwhelp_message_count_${now.getUTCFullYear()}_${now.getUTCMonth()}_${now.getUTCDate()}`;
}
function getMessageCount() {
  return parseInt(localStorage.getItem(getTodayKey()) || "0", 10);
}
function incrementMessageCount() {
  const key = getTodayKey();
  const count = getMessageCount() + 1;
  localStorage.setItem(key, count);
  return count;
}
function updateMessageLimitUI() {
  if (!chatArea) return;
  const count = getMessageCount();
  let info = document.getElementById('limit-info');
  let limit = HWHELP_MODEL.limit;
  if (!info) {
    info = document.createElement('div');
    info.id = 'limit-info';
    info.style.marginBottom = '8px';
    info.style.color = '#555';
    chatArea.parentElement.insertBefore(info, chatArea);
  }
  info.textContent = `Daily messages: ${count} / ${limit}`;
  if (count >= limit) {
    if(userInput) userInput.disabled = true;
    if(sendBtn) sendBtn.disabled = true;
    info.style.color = "red";
    info.textContent += " (limit reached)";
  } else {
    if(userInput) userInput.disabled = false;
    if(sendBtn) sendBtn.disabled = false;
    info.style.color = "#555";
  }
}

// --- Floating Bubble
function showFloatingBubble(text) {
  let bubble = document.createElement('div');
  bubble.className = "floating-bubble";
  bubble.textContent = text;
  Object.assign(bubble.style, {
    position: "fixed",
    right: "30px",
    bottom: "110px",
    background: "#333",
    color: "#fff",
    padding: "12px 22px",
    borderRadius: "16px",
    fontSize: "1.03rem",
    boxShadow: "0 2px 12px #0003",
    zIndex: 5000,
    opacity: 0,
    transition: "opacity 0.3s"
  });
  document.body.appendChild(bubble);
  setTimeout(() => bubble.style.opacity = 1, 20);
  setTimeout(() => {
    bubble.style.opacity = 0;
    setTimeout(() => bubble.remove(), 300);
  }, 5000);
}

// --- Sending Message ---
async function sendMessage() {
  if (!API_KEY || API_KEY.startsWith("PASTE_YOUR_GROQ_API_KEY_HERE")) {
    alert("You must set your API key in hw.js first!");
    return;
  }
  const msgCount = getMessageCount();
  let chat = currentChat();
  let limit = HWHELP_MODEL.limit;

  if (msgCount >= limit) {
    updateMessageLimitUI();
    alert("Daily message limit reached. Try again tomorrow!");
    return;
  }
  if (!userInput) return;
  const msg = userInput.value.trim();
  if (!msg) return;

  // Append to messages with timestamp for local use
  chat.messages.push({ role: "user", content: msg, timestamp: Date.now() });
  appendMessage('user', msg);
  userInput.value = '';
  if(sendBtn) sendBtn.disabled = true;
  appendMessage('ai', '<i>Thinking...</i>');

  // Auto-name if first user message
  if (chat.name === "New Chat" && chat.messages.filter(m => m.role === "user").length === 1) {
    chat.name = msg.length > 40 ? msg.slice(0, 37) + "..." : msg;
    saveChats();
    renderChatList();
  }

  try {
    // --- STRIP TIMESTAMP FOR API ---
    const apiMessages = chat.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: HWHELP_MODEL.id,
        messages: apiMessages,
        temperature: 1,
        max_tokens: 512,
        top_p: 1
      })
    });
    const data = await response.json();
    if (data.error) {
      chatArea.removeChild(chatArea.lastChild);
      appendMessage('ai', "API Error: " + data.error.message);
      return;
    }
    const aiMsg = data.choices?.[0]?.message?.content?.trim() || "No response.";
    chatArea.removeChild(chatArea.lastChild);
    chat.messages.push({ role: "assistant", content: aiMsg, timestamp: Date.now() });
    appendMessage('ai', aiMsg);
    incrementMessageCount();
    saveChats();
    updateMessageLimitUI();
  } catch (err) {
    chatArea.removeChild(chatArea.lastChild);
    appendMessage('ai', "Error: " + err.message);
  } finally {
    if(sendBtn) sendBtn.disabled = false;
    if(userInput) userInput.focus();
  }
}

// --- User interaction ---
if(sendBtn) sendBtn.onclick = sendMessage;
if(userInput) userInput.onkeydown = e => { if (e.key === "Enter") sendMessage(); };

// --- Settings modal ---
if(settingsBtn && settingsModal) settingsBtn.onclick = () => settingsModal.classList.add('show');
if(closeSettingsBtn && settingsModal) closeSettingsBtn.onclick = () => settingsModal.classList.remove('show');

// --- Dark mode ---
const body = document.body;
const DARK_KEY = "hwhelp_dark";
function setDarkMode(on) {
  if (on) {
    body.classList.add("dark");
    localStorage.setItem(DARK_KEY, "1");
    if(darkmodeToggle) darkmodeToggle.checked = true;
  } else {
    body.classList.remove("dark");
    localStorage.setItem(DARK_KEY, "");
    if(darkmodeToggle) darkmodeToggle.checked = false;
  }
}
if(darkmodeToggle) {
  darkmodeToggle.onchange = e => setDarkMode(e.target.checked);
}
if (localStorage.getItem(DARK_KEY) === "1") setDarkMode(true);
else setDarkMode(false);

// --- Export Chat as Markdown ---
if (exportBtn) {
  exportBtn.onclick = function() {
    let chat = currentChat();
    if (!chat) return alert("No chat selected!");
    let modelName = HWHELP_MODEL.name;
    let md = `# HwHelp Chat Export\n\n**Model:** ${modelName}\n\n`;
    for (const m of chat.messages) {
      if (m.role === "system") continue;
      let ts = m.timestamp ? new Date(m.timestamp).toLocaleString() : '';
      let who = m.role === "user" ? "**You:**" : "**AI:**";
      md += `\n---\n`;
      if (ts) md += `*${ts}*\n`;
      md += `${who}\n\n${m.content.trim()}\n`;
    }
    md += `\n---\n*Exported on ${new Date().toLocaleString()}*\n`;
    let fname = (chat.name || "chat") + ".md";
    let blob = new Blob([md], {type: "text/markdown"});
    let a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname.replace(/[\\\/:*?"<>|]/g, "_");
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); }, 100);
  };
}

// --- INIT ---
loadChats();
renderChatList();
loadCurrentChat();

});
