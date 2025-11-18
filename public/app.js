(() => {
  const BASE = '';

  const els = {
    healthBtn: document.getElementById('btn-health'),
    healthStatus: document.getElementById('health-status'),
    healthOut: document.getElementById('health-output'),

    email: document.getElementById('inp-email'),
    name: document.getElementById('inp-name'),
    createUserBtn: document.getElementById('btn-create-user'),
    userId: document.getElementById('user-id'),
    userOut: document.getElementById('user-output'),

    createSessionBtn: document.getElementById('btn-create-session'),
    loadHistoryBtn: document.getElementById('btn-load-history'),
    sessionId: document.getElementById('session-id'),
    sessionOut: document.getElementById('session-output'),

    agentSel: document.getElementById('sel-agent'),
    streamChk: document.getElementById('chk-stream'),
    msgInput: document.getElementById('inp-message'),
    sendBtn: document.getElementById('btn-send'),
    abortBtn: document.getElementById('btn-abort'),
    chatLog: document.getElementById('chat-log'),

    historyList: document.getElementById('history-list')
  };

  // Storage keys
  const STORAGE = { userId: 'vb_user_id', sessionId: 'vb_session_id' };

  // State
  let streamController = null;

  // Helpers
  const setStatus = (el, ok, text) => {
    el.textContent = text || (ok ? 'OK' : 'ERROR');
    el.className = 'status ' + (ok ? 'ok' : 'err');
  };

  const saveLocal = (key, value) => localStorage.setItem(key, value || '');
  const getLocal = (key) => localStorage.getItem(key) || '';

  const authHeader = () => {
    const uid = getLocal(STORAGE.userId);
    return uid ? { Authorization: `Bearer ${uid}` } : {};
  };

  const json = (res) => res.json();
  const text = (res) => res.text();

  const api = {
    health: () => fetch(`${BASE}/api/health`).then(json),
    createUser: (email, name) => fetch(`${BASE}/api/users`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: name || undefined })
    }).then(json),
    createSession: () => fetch(`${BASE}/api/chat/sessions`, {
      method: 'POST', headers: { ...authHeader() }
    }).then(json),
    sendMessage: ({ sessionId, message, agent }) => fetch(`${BASE}/api/chat/message`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message, agent: agent || undefined })
    }).then(json),
    streamMessage: async ({ sessionId, message, agent }, onChunk, onDone, onError) => {
      try {
        // Using fetch + ReadableStream for SSE-like consumption
        const res = await fetch(`${BASE}/api/chat/stream`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, message, agent: agent || undefined })
        });
        if (!res.ok || !res.body) throw new Error('Stream failed');
        const reader = res.body.getReader();
        streamController = reader;
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split('\n\n');
          buffer = parts.pop();
          for (const p of parts) {
            if (!p.startsWith('data:')) continue;
            const payload = p.replace(/^data:\s*/, '');
            try {
              const obj = JSON.parse(payload);
              if (obj.chunk) onChunk(obj.chunk);
              if (obj.done) onDone && onDone();
              if (obj.error) onError && onError(obj.error);
            } catch {}
          }
        }
        onDone && onDone();
      } catch (e) {
        onError && onError(e.message || String(e));
      } finally {
        streamController = null;
      }
    },
    history: (sessionId) => fetch(`${BASE}/api/chat/history/${encodeURIComponent(sessionId)}`, {
      headers: { ...authHeader() }
    }).then(json)
  };

  // UI helpers
  const appendMsg = (role, text) => {
    const wrap = document.createElement('div');
    wrap.className = `msg ${role}`;
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = `${role}`;
    const body = document.createElement('div');
    body.textContent = text;
    wrap.appendChild(meta);
    wrap.appendChild(body);
    els.chatLog.appendChild(wrap);
    els.chatLog.scrollTop = els.chatLog.scrollHeight;
  };

  const setSessionId = (id) => {
    saveLocal(STORAGE.sessionId, id || '');
    els.sessionId.textContent = id || '';
  };

  const setUserId = (id) => {
    saveLocal(STORAGE.userId, id || '');
    els.userId.textContent = id || '';
  };

  // Wire events
  els.healthBtn.addEventListener('click', async () => {
    els.healthOut.textContent = '';
    setStatus(els.healthStatus, true, 'Checking...');
    try {
      const data = await api.health();
      setStatus(els.healthStatus, true, 'OK');
      els.healthOut.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      setStatus(els.healthStatus, false, 'Error');
      els.healthOut.textContent = String(e);
    }
  });

  els.createUserBtn.addEventListener('click', async () => {
    const email = (els.email.value || '').trim();
    const name = (els.name.value || '').trim();
    els.userOut.textContent = '';
    if (!email) { els.userOut.textContent = 'Email is required'; return; }
    try {
      const res = await api.createUser(email, name);
      if (!res.success) throw new Error(res.error || 'Failed');
      const id = res.user?.id || '';
      setUserId(id);
      els.userOut.textContent = JSON.stringify(res, null, 2);
    } catch (e) {
      els.userOut.textContent = String(e);
    }
  });

  els.createSessionBtn.addEventListener('click', async () => {
    els.sessionOut.textContent = '';
    if (!getLocal(STORAGE.userId)) { els.sessionOut.textContent = 'Create a user first.'; return; }
    try {
      const res = await api.createSession();
      if (!res.success) throw new Error(res.error || 'Failed');
      const id = res.session?.id || '';
      setSessionId(id);
      els.sessionOut.textContent = JSON.stringify(res, null, 2);
    } catch (e) {
      els.sessionOut.textContent = String(e);
    }
  });

  els.loadHistoryBtn.addEventListener('click', async () => {
    els.historyList.innerHTML = '';
    const sid = getLocal(STORAGE.sessionId);
    if (!sid) { els.sessionOut.textContent = 'Create a session first.'; return; }
    try {
      const res = await api.history(sid);
      if (!res.success) throw new Error(res.error || 'Failed');
      (res.messages || []).forEach(m => {
        const li = document.createElement('li');
        li.innerHTML = `<div class="meta">${m.role} • ${new Date(m.created_at).toLocaleString()}</div><div>${(m.content || '')}</div>`;
        els.historyList.appendChild(li);
      });
    } catch (e) {
      els.sessionOut.textContent = String(e);
    }
  });

  els.sendBtn.addEventListener('click', async () => {
    const sid = getLocal(STORAGE.sessionId);
    const msg = (els.msgInput.value || '').trim();
    const agent = els.agentSel.value || undefined;
    if (!sid) { appendMsg('system', 'Create a session first.'); return; }
    if (!msg) { return; }
    appendMsg('user', msg);
    els.msgInput.value = '';

    if (els.streamChk.checked) {
      els.sendBtn.disabled = true;
      els.abortBtn.disabled = false;
      let acc = '';
      await api.streamMessage({ sessionId: sid, message: msg, agent }, (chunk) => {
        acc += chunk;
        // live preview: update last assistant bubble or append new on first chunk
        if (!els.chatLog.lastAssistant) {
          const wrap = document.createElement('div');
          wrap.className = 'msg assistant';
          const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = 'assistant';
          const body = document.createElement('div'); body.textContent = chunk;
          wrap.appendChild(meta); wrap.appendChild(body);
          els.chatLog.appendChild(wrap);
          els.chatLog.lastAssistant = body;
        } else {
          els.chatLog.lastAssistant.textContent = acc;
        }
        els.chatLog.scrollTop = els.chatLog.scrollHeight;
      }, () => {
        els.sendBtn.disabled = false;
        els.abortBtn.disabled = true;
        els.chatLog.lastAssistant = null;
      }, (err) => {
        appendMsg('system', `Stream error: ${err}`);
        els.sendBtn.disabled = false;
        els.abortBtn.disabled = true;
        els.chatLog.lastAssistant = null;
      });
    } else {
      try {
        const res = await api.sendMessage({ sessionId: sid, message: msg, agent });
        if (!res.success) throw new Error(res.error || 'Failed');
        appendMsg('assistant', res.response || '[empty]');
      } catch (e) {
        appendMsg('system', String(e));
      }
    }
  });

  els.abortBtn.addEventListener('click', async () => {
    try { await streamController?.cancel(); } catch {}
    els.abortBtn.disabled = true; els.sendBtn.disabled = false; els.chatLog.lastAssistant = null;
  });

  // Init
  setUserId(getLocal(STORAGE.userId));
  setSessionId(getLocal(STORAGE.sessionId));
})();


