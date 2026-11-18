/* Security Console: uses the signed-in HA connection and installed WebRTC card. */
class SecurityConsole extends HTMLElement {
  setConfig(config) {
    this.config = config;
    if (!this.shadowRoot) this.attachShadow({mode: 'open'});
    this.built = false;
    this.reviews = [];
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.built && this.config) this.build();
    if (!this.built) return;
    for (const card of this.cards) card.hass = hass;
    this.updateStatus();
    if (this.isConnected && !this.timer) this.start();
  }

  connectedCallback() { if (this.built) this.start(); }
  disconnectedCallback() { clearInterval(this.timer); this.timer = null; }
  getCardSize() { return 12; }

  el(tag, text, cls) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (cls) el.className = cls;
    return el;
  }

  button(text, action, cls = '') {
    const b = this.el('button', text, cls);
    b.type = 'button';
    b.addEventListener('click', action);
    return b;
  }

  moreInfo(entity) {
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: {entityId: entity}, bubbles: true, composed: true,
    }));
  }

  build() {
    this.built = true;
    this.cards = [];
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;container-type:inline-size;--sc-control-radius:999px;--sc-bg:#10171e;--sc-panel:#18222c;--sc-line:#2a3946;--sc-text:#ecf2f7;--sc-dim:#94a7b7;--sc-good:#77d4b3;--sc-warn:#f3bc6b;color:var(--sc-text);font-family:var(--paper-font-body1_-_font-family,system-ui)}
      *{box-sizing:border-box}button,a{-webkit-tap-highlight-color:transparent}button{font:inherit;cursor:pointer;color:inherit}button:focus-visible,a:focus-visible{outline:2px solid #8acbff;outline-offset:3px}button:hover{filter:brightness(1.16)}
      .console{height:calc(100dvh - 88px);min-height:540px;padding:12px;background:radial-gradient(ellipse at top left,#1c303a 0,transparent 50%),var(--sc-bg);border-radius:16px;border:1px solid var(--sc-line);display:flex;flex-direction:column;gap:12px;overflow:hidden}
      .top{display:flex;align-items:center;gap:18px;flex-wrap:wrap;min-height:58px}.identity{margin-right:auto}.eyebrow{font-size:10px;letter-spacing:1.8px;font-weight:700;color:var(--sc-dim);text-transform:uppercase}.title{font-size:22px;font-weight:650;letter-spacing:-.5px;margin-top:3px}.alarm{display:flex;align-items:center;gap:12px;border-left:1px solid var(--sc-line);padding-left:18px}.alarm-label{font-size:12px;color:var(--sc-dim)}.alarm-state{font-size:14px;font-weight:650;margin-top:3px;color:var(--sc-good)}
      .modes{display:flex;gap:4px;padding:4px;border:1px solid var(--sc-line);background:#0d151d;border-radius:var(--sc-control-radius)}.mode{border:0;background:transparent;color:var(--sc-dim);border-radius:var(--sc-control-radius);padding:8px 12px;font-size:12px;font-weight:650}.mode.active{background:#25443f;color:#a3edcf}.entry-summary{max-width:300px;border:1px solid var(--sc-line);border-radius:999px;background:var(--sc-panel);padding:10px 14px;text-align:left;display:flex;align-items:center;gap:8px}.entry-summary::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--sc-good);flex:none}.entry-summary.warning::before{background:var(--sc-warn)}.entry-summary strong{display:block;font-size:12px;color:var(--sc-good)}.entry-summary span{display:none;font-size:11px;color:var(--sc-dim);margin-top:4px;white-space:normal}.entry-summary.warning strong{color:var(--sc-warn)}
      .body{display:grid;grid-template-columns:minmax(0,2.8fr) minmax(260px,1fr);gap:12px;flex:1;min-height:0}.cameras{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:10px;min-height:0;min-width:0}.camera{border:1px solid var(--sc-line);border-radius:11px;overflow:hidden;background:#080d12;display:flex;flex-direction:column;min-width:0;min-height:0}.camera-head{height:34px;flex:none;display:flex;align-items:center;gap:7px;padding:0 10px;background:#19242e;font-size:12px;font-weight:600}.dot{width:6px;height:6px;border-radius:50%;background:var(--sc-good);flex:none}.camera-head .muted{font-size:10px;color:var(--sc-dim);font-weight:400;margin-left:auto}.expand{border-radius:var(--sc-control-radius);width:26px;height:26px;background:#23333f;border:0;color:#c9d8e4;font-size:16px;padding:3px 6px;line-height:1}.camera-host{flex:1;min-height:0;overflow:hidden;display:flex;align-items:center;justify-content:center}.camera-host>*{width:100%;max-height:100%}.camera-error{padding:18px;color:var(--sc-warn);font-size:12px}
      .events{display:flex;flex-direction:column;min-height:0;border:1px solid var(--sc-line);border-radius:11px;background:var(--sc-panel);overflow:hidden}.events-head{padding:13px 13px 10px;border-bottom:1px solid var(--sc-line)}.events-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:650}.count{font-size:11px;color:var(--sc-warn);border-radius:var(--sc-control-radius);background:#443827;padding:2px 6px;margin-left:auto}.events-sub{font-size:10px;line-height:1.5;color:var(--sc-dim);margin-top:5px}.event-list{flex:1;min-height:0;overflow:auto;scrollbar-width:thin}.event{width:100%;border:0;border-bottom:1px solid var(--sc-line);padding:10px;display:grid;grid-template-columns:92px 1fr;gap:10px;text-align:left;background:transparent}.thumb{width:92px;height:66px;object-fit:cover;background:#0d151d;border-radius:6px}.event-label{font-size:12px;font-weight:650;line-height:1.4}.event-location{font-size:11px;color:var(--sc-dim);margin-top:4px}.event-time{font-size:10px;color:var(--sc-dim);margin-top:5px}.unreviewed{font-size:9px;color:var(--sc-warn);margin-top:4px}.empty{padding:20px 14px;font-size:12px;color:var(--sc-dim);line-height:1.6}.error{color:var(--sc-warn)}.events-foot{padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px;border-top:1px solid var(--sc-line);font-size:10px;color:var(--sc-dim)}a{color:#a4cce8;text-decoration:none}.refresh{border-radius:var(--sc-control-radius);background:#23333f;border:1px solid var(--sc-line);padding:5px 10px;color:#a4cce8;font-size:11px}
      dialog{background:var(--sc-bg);color:var(--sc-text);border:1px solid var(--sc-line);border-radius:14px;width:min(960px,94vw);max-height:90dvh;padding:14px}dialog::backdrop{background:#000a;backdrop-filter:blur(5px)}.dialog-head{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px;font-size:16px;font-weight:650}.close{border:1px solid var(--sc-line);border-radius:var(--sc-control-radius);background:var(--sc-panel);padding:6px 12px;font-size:12px}.dialog-body{overflow:auto;max-height:76dvh}.dialog-body video{display:block;width:100%;max-height:65dvh;background:#000}.sensor-row{width:100%;display:flex;justify-content:space-between;gap:16px;padding:13px 10px;border:0;border-bottom:1px solid var(--sc-line);background:transparent;text-align:left;font-size:13px}.sensor-row span:last-child{color:var(--sc-dim)}.sensor-row.open span:last-child{color:var(--sc-warn)}.dialog-note{font-size:12px;color:var(--sc-dim);line-height:1.6;margin-top:12px}.alarm-dialog{max-width:410px}
      .camera-host>webrtc-camera{height:100%}.dialog-body>webrtc-camera{display:block;height:65dvh}.alarm-actions{display:flex;gap:8px;margin:16px 0}.alarm-action{background:#25443f;border:1px solid #477469;border-radius:var(--sc-control-radius);padding:10px 16px;color:#b7f2db}.alarm-action:disabled{opacity:.5;cursor:wait}
      @container(max-width:1000px){.top{gap:10px}.alarm{gap:8px;padding-left:10px}.mode{padding:8px}.entry-summary{max-width:240px}.identity .title{font-size:19px}}
      @container(max-width:840px){.console{height:auto;min-height:0}.body{grid-template-columns:1fr;flex:none}.cameras{height:clamp(360px,60dvh,660px)}.events{height:310px}.identity{flex:1}.alarm{border:0}.entry-summary{max-width:none;flex:1}.top{gap:10px}.camera-head{font-size:11px}}
      @container(max-width:480px){.alarm{padding:0}.modes{margin-left:auto}.camera-head .muted{display:none}.cameras{height:400px}.title{font-size:18px}}
    </style><section class="console" aria-label="Security console"><header class="top"><div class="identity"><div class="eyebrow">Home security</div><div class="title">Security console</div></div><div class="alarm"><div><div class="alarm-state"></div></div><div class="modes"></div></div></header><div class="body"><main class="cameras" aria-label="Live cameras"></main><aside class="events"><header class="events-head"><div class="events-title">Attention <span class="count">…</span></div><div class="events-sub">Frigate alerts · last 24 hours</div></header><div class="event-list" aria-live="polite"><div class="empty">Loading Frigate alerts…</div></div><footer class="events-foot"><span class="sync">Connecting…</span><button class="refresh" type="button">Refresh</button><a href="https://frigate.leonmachado.com/review" target="_blank" rel="noopener">All alerts ↗</a></footer></aside></div></section><dialog><div class="dialog-head"><span></span><button class="close" type="button">Close</button></div><div class="dialog-body"></div></dialog>`;
    this.dialog = this.shadowRoot.querySelector('dialog');
    this.shadowRoot.querySelector('.close').onclick = () => this.dialog.close();
    this.dialog.addEventListener('close', () => { this.restoreCamera?.(); this.restoreCamera = null; this.shadowRoot.querySelector('.dialog-body').replaceChildren(); });
    this.dialog.addEventListener('click', e => { if (e.target === this.dialog) { const r = this.dialog.getBoundingClientRect(); if(e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.dialog.close(); } });
    const modes = this.shadowRoot.querySelector('.modes');
    for (const [label, state] of [['Home','armed_home'],['Away','armed_away'],['Disarm','disarmed']]) {
      const b = this.button(label, () => this.openAlarm(state)); b.className = 'mode'; b.dataset.state = state; modes.append(b);
    }
    this.entryButton = this.button('', () => this.openEntries(), 'entry-summary');
    this.entryButton.append(this.el('strong'), this.el('span'));
    this.shadowRoot.querySelector('.top').append(this.entryButton);
    this.shadowRoot.querySelector('.refresh').onclick = () => this.refresh();
    const grid = this.shadowRoot.querySelector('.cameras');
    for (const c of this.config.cameras) {
      const frame = this.el('section', undefined, 'camera');
      const head = this.el('div', undefined, 'camera-head');
      const dot = this.el('span', undefined, 'dot');
      dot.dataset.entity = c.entity;
      head.append(dot, this.el('span', c.name), this.el('span', 'MUTED', 'muted'));
      const host = this.el('div', undefined, 'camera-host');
      const expand = this.button('⛶', () => {
        const card = host.firstElementChild;
        if (!card) return;
        this.openDialog(c.name, card);
        this.restoreCamera = () => host.append(card);
      }, 'expand');
      expand.setAttribute('aria-label', `Expand ${c.name}`);
      head.append(expand); frame.append(head, host); grid.append(frame);
      this.createCamera(c, host);
    }
  }

  async createCamera(c, host) {
    try {
      await customElements.whenDefined('webrtc-camera');
      const card = document.createElement('webrtc-camera');
      card.setConfig({type:'custom:webrtc-camera',url:c.stream,ui:true,muted:true,media:'video,audio',digital_ptz:false,style:':host { display: block; height: 100%; } ha-card { border: 0; border-radius: 0; } video { display: block; width: 100%; height: 100%; object-fit: contain; } .controls { gap: 3px; } .controls ha-icon { border-radius: 999px; background: rgba(16,23,30,.8); padding: 5px; width: 18px; height: 18px; --mdc-icon-size: 18px; flex-shrink: 0; }'});
      card.hass = this._hass; this.cards.push(card); host.append(card);
      if (card.video) {
        const dot = host.parentElement.querySelector('.dot');
        dot.dataset.playing = 'false';
        const status = () => {
          const playing = !card.video.paused && card.video.readyState >= 2;
          dot.dataset.playing = String(playing);
          dot.style.background = playing ? 'var(--sc-good)' : 'var(--sc-warn)';
          dot.title = playing ? 'Live video playing' : 'Video connecting or paused';
        };
        for (const event of ['playing','pause','waiting','error','emptied']) card.video.addEventListener(event,status);
        card.video.addEventListener('volumechange', () => {
          host.parentElement?.querySelector('.muted')?.replaceChildren(document.createTextNode(card.video.muted ? 'MUTED' : 'AUDIO ON'));
        });
      }
    } catch (e) { host.append(this.el('div', `Camera unavailable: ${e.message}`, 'camera-error')); }
  }

  entries() {
    return this.config.entries.map(e => ({...e, state:this._hass.states[e.entity]?.state ?? 'unavailable'}));
  }

  updateStatus() {
    const alarm = this._hass.states[this.config.alarm];
    const label = alarm ? alarm.state.replaceAll('_',' ') : 'unavailable';
    const stateEl = this.shadowRoot.querySelector('.alarm-state');
    stateEl.textContent = 'SimpliSafe';
    stateEl.title = label.charAt(0).toUpperCase() + label.slice(1);
    stateEl.setAttribute('aria-label', `SimpliSafe: ${label}`);
    stateEl.style.color = ['triggered','pending','unavailable','unknown'].includes(alarm?.state) || !alarm ? 'var(--sc-warn)' : 'var(--sc-good)';
    for (const b of this.shadowRoot.querySelectorAll('.mode')) b.classList.toggle('active', b.dataset.state === alarm?.state);
    const entries = this.entries();
    const open = entries.filter(e => ['on','open','opening','closing'].includes(e.state));
    const unknown = entries.filter(e => ['unknown','unavailable'].includes(e.state));
    this.entryButton.classList.toggle('warning', !!(open.length || unknown.length));
    this.entryButton.querySelector('strong').textContent = open.length === 1 ? `${open[0].name} open` : open.length ? `${open.length} entries open` : unknown.length ? `${unknown.length} sensor${unknown.length===1?'':'s'} unavailable` : 'All closed';
    this.entryButton.querySelector('span').textContent = [...open.map(e=>e.name), ...unknown.map(e=>`${e.name} unavailable`)].join(' · ') || `${entries.length} monitored · View sensors`;
    this.entryButton.title = this.entryButton.querySelector('span').textContent;
    this.entryButton.setAttribute('aria-label', `${this.entryButton.querySelector('strong').textContent}. ${this.entryButton.title}. View doors, windows and covers`);
    for (const dot of this.shadowRoot.querySelectorAll('.dot[data-entity]')) {
      const s = this._hass.states[dot.dataset.entity]?.state;
      if (dot.dataset.playing === undefined) {
        dot.style.background = !s || ['unavailable','unknown'].includes(s) ? 'var(--sc-warn)' : 'var(--sc-good)';
        dot.title = `Camera entity: ${s ?? 'unavailable'}`;
      }
    }
  }

  openDialog(title, content, small = false) {
    if (this.dialog.open) this.dialog.close();
    this.dialog.classList.toggle('alarm-dialog', small);
    this.shadowRoot.querySelector('.dialog-head span').textContent = title;
    this.shadowRoot.querySelector('.dialog-body').replaceChildren(content);
    this.dialog.showModal();
  }

  openAlarm(mode) {
    const disarm = mode === 'disarmed';
    const name = mode === 'armed_home' ? 'Home' : 'Away';
    const body = this.el('div');
    const note = this.el('p', disarm ? 'Disarm the security system?' : `Set the security system to ${name} mode?`, 'dialog-note');
    const actions = this.el('div', undefined, 'alarm-actions');
    const confirm = this.button(disarm ? 'Disarm' : `Arm ${name}`, async () => {
      confirm.disabled = true;
      try {
        const service = disarm ? 'alarm_disarm' : mode === 'armed_home' ? 'alarm_arm_home' : 'alarm_arm_away';
        await this._hass.callService('alarm_control_panel', service, {entity_id:this.config.alarm});
        this.dialog.close();
      } catch(e) { note.textContent = e.message || 'Unable to set alarm mode.'; confirm.disabled = false; }
    }, 'alarm-action');
    actions.append(confirm); body.append(note,actions);
    this.openDialog('Alarm controls',body,true);
  }

  openEntries() {
    const list = this.el('div');
    for (const e of this.entries()) {
      const b = this.button('', () => { this.dialog.close(); this.moreInfo(e.entity); }, 'sensor-row');
      b.classList.toggle('open', ['on','open','opening','closing'].includes(e.state));
      b.append(this.el('span',e.name),this.el('span',e.state === 'on' ? 'Open' : e.state === 'off' ? 'Closed' : e.state)); list.append(b);
    }
    this.openDialog('Doors, windows & covers', list);
  }

  start() {
    if (this.timer || !this._hass) return;
    this.refresh();
    this.timer = setInterval(() => { if (!document.hidden) this.refresh(); }, 20000);
  }

  async sign(path) {
    const r = await this._hass.callWS({type:'auth/sign_path',path,expires:120});
    return r.path;
  }

  async refresh() {
    if (this.loading) return;
    this.loading = true;
    try {
      let data = await this._hass.callWS({type:'frigate/reviews/get',instance_id:this.config.frigate_instance || 'frigate',severity:'alert',after:Date.now()/1000-86400,limit:40});
      if (typeof data === 'string') data = JSON.parse(data);
      if (!Array.isArray(data)) throw new Error('Unexpected alert response');
      this.reviews = data.sort((a,b)=>b.start_time-a.start_time);
      const fingerprint = JSON.stringify(this.reviews);
      if (fingerprint !== this.reviewFingerprint || Date.now() - (this.lastRendered || 0) > 80000) {
        await this.renderReviews();
        this.reviewFingerprint = fingerprint;
        this.lastRendered = Date.now();
      }
      this.shadowRoot.querySelector('.sync').textContent = `Updated ${new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`;
    } catch(e) {
      this.reviewFingerprint = null;
      const list = this.shadowRoot.querySelector('.event-list');
      list.replaceChildren(this.el('div', `Unable to load Frigate alerts. ${e.message || e.code || 'Check the Frigate integration.'}`, 'empty error'));
      this.shadowRoot.querySelector('.count').textContent = '!';
      this.shadowRoot.querySelector('.sync').textContent = 'Connection error · retrying';
    } finally { this.loading = false; }
  }

  cameraName(camera) { return this.config.cameras.find(c=>c.stream===camera)?.name || camera.replaceAll('-',' '); }

  async renderReviews() {
    const fragment = document.createDocumentFragment();
    if (!this.reviews.length) fragment.append(this.el('div','No Frigate alerts in the last 24 hours.','empty'));
    const instance = encodeURIComponent(this.config.frigate_instance || 'frigate');
    await Promise.all(this.reviews.map(async r => {
      r.signedThumb = null;
      if (r.thumb_path?.startsWith('/media/frigate/clips/')) {
        const path = r.thumb_path.slice('/media/frigate/clips/'.length).split('/').map(encodeURIComponent).join('/');
        try { r.signedThumb = await this.sign(`/api/frigate/${instance}/clips/${path}`); } catch { /* Text remains usable if thumbnail signing fails. */ }
      }
    }));
    for (const r of this.reviews) {
      const row = this.button('', () => this.openReview(r), 'event');
      const img = this.el('img',undefined,'thumb'); img.alt = `${this.cameraName(r.camera)} alert`; img.loading = 'lazy';
      if (r.signedThumb) img.src = r.signedThumb;
      const text = this.el('div');
      const labels = [...(r.data?.objects || []), ...(r.data?.audio || [])];
      const label = labels.join(', ').replaceAll('_',' ') || 'Security alert';
      text.append(this.el('div',label.charAt(0).toUpperCase()+label.slice(1),'event-label'),this.el('div',this.cameraName(r.camera),'event-location'),this.el('div',new Date(r.start_time*1000).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}),'event-time'));
      if (!r.has_been_reviewed) text.append(this.el('div','UNREVIEWED','unreviewed'));
      row.append(img,text);fragment.append(row);
    }
    const list = this.shadowRoot.querySelector('.event-list');
    const scroll = list.scrollTop; list.replaceChildren(fragment); list.scrollTop = scroll;
    this.shadowRoot.querySelector('.count').textContent = this.reviews.length === 40 ? '40+' : String(this.reviews.length);
  }

  async openReview(r) {
    const body = this.el('div');
    const note = this.el('p','Loading recording…','dialog-note'); body.append(note);
    this.openDialog(`${this.cameraName(r.camera)} · ${new Date(r.start_time*1000).toLocaleString()}`, body);
    try {
      const start = Math.max(0, Math.floor(r.start_time)-5);
      const end = Math.floor(r.end_time ?? Date.now()/1000)+5;
      const instance = encodeURIComponent(this.config.frigate_instance || 'frigate');
      const url = await this.sign(`/api/frigate/${instance}/recording/${encodeURIComponent(r.camera)}/start/${start}/end/${end}`);
      if (!body.isConnected) return;
      const video = this.el('video'); video.controls = true; video.muted = true; video.playsInline = true; video.preload = 'metadata'; video.src = url;
      video.addEventListener('error', () => { note.textContent = 'Recording unavailable. Open this event in Frigate to inspect it.'; });
      note.textContent = `Frigate alert · ${(r.data?.objects || []).join(', ') || 'Activity'}${r.data?.zones?.length ? ` · ${r.data.zones.join(', ')}` : ''}`;
      body.prepend(video);
      const link = this.el('a','Open event in Frigate ↗');
      link.href = `https://frigate.leonmachado.com/review?id=${encodeURIComponent(r.id)}`; link.target='_blank'; link.rel='noopener'; body.append(link);
    } catch(e) { note.textContent = `Recording unavailable: ${e.message || e.code || 'Unable to sign playback URL'}`; }
  }
}

if (!customElements.get('security-console')) customElements.define('security-console', SecurityConsole);
