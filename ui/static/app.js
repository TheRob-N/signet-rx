// SIGNET-RX v1-beta UI
// - subscribes to /events (SSE)
// - renders: WB RX + WX blocks, ham-style S-meter, BW, modulation stack
// - shows spectrum bars only in WFM_BROADCAST; uses the area for Manual RX controls otherwise

const $ = (id) => document.getElementById(id);

const ui = {
  clock: $("clock"),
  date: $("date"),

  ledStereo: $("led-stereo"),
  ledRds: $("led-rds"),
  ledWx: $("led-wx"),
  ledAlert: $("led-alert"),

  wxFreq: $("wxFreq"),
  wxStatus: $("wxStatus"),
  wxLast: $("wxLast"),
  wxLastTime: $("wxLastTime"),
  wxBw: $("wxBw"),
  wxMod: $("wxMod"),
  wxSMeterFill: $("wxSMeterFill"),
  wxSMeterPeak: $("wxSMeterPeak"),

  rxFreq: $("rxFreq"),
  mode: $("mode"),
  rxMode: $("rxMode"),
  rdsStation: $("rdsStation"),
  rdsText: $("rdsText"),
  rxBw: $("rxBw"),
  rxMod: $("rxMod"),
  rxSMeterFill: $("rxSMeterFill"),
  rxSMeterPeak: $("rxSMeterPeak"),

  vizBlock: $("vizBlock"),
  vizTitle: $("vizTitle"),
  spectrum: $("spectrum"),
  rxControls: $("rxControls"),
  rxStep: $("rxStep"),
  rxSql: $("rxSql"),
  rxProfile: $("rxProfile"),

  volFill: $("volFill"),
  volText: $("volText"),
  out: $("out"),

  modal: $("modal"),
  modalTitle: $("modalTitle"),
  modalBody: $("modalBody"),
  closeModal: $("closeModal"),
};

let state = null;

function pad(n){ return String(n).padStart(2,"0"); }
function fmtDateTime(d = new Date()){
  const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const mons = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return {
    clock: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
    date: `${days[d.getDay()]} ${mons[d.getMonth()]} ${d.getDate()}`
  };
}

function setLed(el, on, kind){
  if (!el) return;
  el.classList.toggle("on", !!on);
  if (kind) el.classList.toggle(kind, true);
}

function setModStack(modContainer, active){
  if (!modContainer) return;
  const items = Array.from(modContainer.querySelectorAll("span"));
  items.forEach((s)=>{
    s.classList.toggle("on", s.textContent.trim().toUpperCase() === String(active).toUpperCase());
  });
}

// Map ham-style S-meter (S1..S9 plus over S9 dB) to a 0..1 fill.
// This is intentionally "receiver-ish" rather than calibrated.
function smeterToFrac(s, overDb){
  const sClamped = Math.min(9, Math.max(1, Number(s || 1)));
  const over = Math.min(30, Math.max(0, Number(overDb || 0)));

  // S1..S9 occupies 0..0.75; over S9 fills 0.75..1.0
  const base = (sClamped - 1) / 8; // 0..1
  let frac = base * 0.75;
  frac += (over / 30) * 0.25;
  return Math.min(1, Math.max(0, frac));
}

function updateSMeter(fillEl, peakEl, frac){
  if (!fillEl || !peakEl) return;
  const pct = Math.round(frac * 100);
  fillEl.style.width = `${pct}%`;

  // peak hold: move up quickly, decay slowly
  const curPeak = Number(peakEl.dataset.peak || 0);
  const nextPeak = Math.max(frac, curPeak - 0.02);
  peakEl.dataset.peak = String(nextPeak);
  peakEl.style.left = `${Math.round(nextPeak * 100)}%`;
}

function setVisible(el, on){
  if (!el) return;
  el.classList.toggle("hidden", !on);
}

function updateUiFromState(s){
  // Top indicators
  setLed(ui.ledWx, true);
  setLed(ui.ledStereo, !!s.stereo);
  setLed(ui.ledRds, !!(s.rds_station && s.rds_station.length));

  const hasAlert = s.last_alert && s.last_alert !== "None";
  ui.ledAlert.classList.toggle("alert", true);
  setLed(ui.ledAlert, !!hasAlert);

  // WX block
  ui.wxFreq.textContent = `${Number(s.wx_freq_mhz || 0).toFixed(3)} MHz`;
  ui.wxStatus.textContent = s.wx_status || "";
  ui.wxLast.textContent = s.last_alert || "None";
  ui.wxLastTime.textContent = s.last_alert_time || "";
  ui.wxBw.textContent = String(s.wx_bw_khz ?? "--");
  setModStack(ui.wxMod, s.wx_mod || "NFM");
  updateSMeter(ui.wxSMeterFill, ui.wxSMeterPeak, smeterToFrac(s.wx_s, s.wx_over_db));

  // WB RX block
  ui.rxFreq.textContent = `${Number(s.rx_freq_mhz || 0).toFixed(1)} MHz`;
  ui.mode.textContent = (s.mode || "--").replace("WB_WX","WB + WX");
  ui.rxMode.textContent = (s.rx_profile === "MANUAL_RX") ? "MANUAL RX" : "WFM BROADCAST";
  ui.rdsStation.textContent = s.rds_station || "";
  ui.rdsText.textContent = s.rds_text || "";
  ui.rxBw.textContent = String(s.rx_bw_khz ?? "--");
  setModStack(ui.rxMod, s.rx_mod || "WFM");
  updateSMeter(ui.rxSMeterFill, ui.rxSMeterPeak, smeterToFrac(s.rx_s, s.rx_over_db));

  // Bottom bar
  ui.out.textContent = s.audio_output || "--";
  const vol = Math.max(0, Math.min(1, Number(s.volume ?? 0)));
  ui.volFill.style.width = `${Math.round(vol * 100)}%`;
  ui.volText.textContent = `${Math.round(vol * 100)}%`;

  // Spectrum vs controls (reclaim space outside broadcast WFM)
  const isBroadcast = (s.rx_profile !== "MANUAL_RX") && String(s.rx_mod || "").toUpperCase() === "WFM";
  setVisible(ui.spectrum, isBroadcast);
  setVisible(ui.rxControls, !isBroadcast);
  ui.vizTitle.textContent = isBroadcast ? "SPECTRUM ANALYZER" : "MANUAL RX CONTROLS";

  ui.rxStep.textContent = `${Number(s.rx_step_khz ?? 0).toFixed(1)} kHz`;
  ui.rxSql.textContent = String(s.rx_sql ?? "--");
  ui.rxProfile.textContent = s.rx_profile || "--";
}

function openModal(title, bodyLines){
  ui.modal.classList.remove("hidden");
  ui.modalTitle.textContent = title;
  ui.modalBody.textContent = bodyLines.join("\n");
}
function closeModal(){ ui.modal.classList.add("hidden"); }

ui.closeModal?.addEventListener("click", closeModal);
ui.modal?.addEventListener("click", (e)=>{ if (e.target === ui.modal) closeModal(); });

$("wxBlock")?.addEventListener("click", ()=>{
  const lines = [
    `WX Frequency: ${ui.wxFreq.textContent}`,
    `Mode: ${state?.wx_mod || "NFM"}`,
    `BW: ${state?.wx_bw_khz ?? "--"} kHz`,
    `Signal: S${state?.wx_s ?? "--"}${(state?.wx_over_db ?? 0) ? "+" + state.wx_over_db : ""}`,
    "",
    `Status: ${state?.wx_status || "--"}`,
    `Last Alert: ${state?.last_alert || "None"}`,
    `Time: ${state?.last_alert_time || ""}`,
    "",
    "(Demo data in v1-beta; SAME decode will populate full alert details later.)"
  ];
  openModal("WX DETAILS", lines);
});

$("rxBlock")?.addEventListener("click", ()=>{
  const lines = [
    `RX Frequency: ${ui.rxFreq.textContent}`,
    `Profile: ${state?.rx_profile || "--"}`,
    `Modulation: ${state?.rx_mod || "--"}`,
    `BW: ${state?.rx_bw_khz ?? "--"} kHz`,
    `Step: ${state?.rx_step_khz ?? "--"} kHz`,
    `Squelch: ${state?.rx_sql ?? "--"}`,
    `Signal: S${state?.rx_s ?? "--"}${(state?.rx_over_db ?? 0) ? "+" + state.rx_over_db : ""}`,
    "",
    ...(state?.rx_mod === "WFM" ? [
      `Stereo: ${state?.stereo ? "LOCK" : "--"}`,
      `RDS: ${state?.rds_station || ""}`,
      `Text: ${state?.rds_text || ""}`,
    ] : []),
    "",
    "(Manual RX/Scanner features will expand in v1.x. This screen shows the intended shape.)"
  ];
  openModal("WB RX DETAILS", lines);
});

// --- SSE subscription (state updates) ---
function connectSse(){
  const es = new EventSource("/events");
  es.addEventListener("state", (msg)=>{
    try{
      const data = JSON.parse(msg.data);
      state = data.state;
      updateUiFromState(state);
    }catch(err){
      console.warn("Bad SSE data", err);
    }
  });
}

// --- Spectrum animation (demo) ---
const ctx = ui.spectrum?.getContext("2d");
const bars = 32;
let levels = new Array(bars).fill(0);
let peaks = new Array(bars).fill(0);

function resizeSpectrum(){
  if (!ui.spectrum || !ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const rect = ui.spectrum.getBoundingClientRect();
  ui.spectrum.width = Math.floor(rect.width * dpr);
  ui.spectrum.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize", resizeSpectrum);
resizeSpectrum();

function stepSpectrum(){
  for(let i=0;i<bars;i++){
    const drift = Math.random()*0.18;
    const target = (Math.sin((performance.now()/600) + i*0.35)*0.5 + 0.5) * (0.35 + drift);
    levels[i] = Math.max(0, Math.min(1, levels[i]*0.86 + target*0.14));
    peaks[i] = Math.max(levels[i], peaks[i] - 0.010);
  }
}

function drawSpectrum(){
  if (!ui.spectrum || !ctx) return;
  const w = ui.spectrum.clientWidth;
  const h = ui.spectrum.clientHeight;
  ctx.clearRect(0,0,w,h);

  // Grid
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 1;
  for(let r=1;r<5;r++){
    const y = Math.round(h*r/5);
    ctx.beginPath();
    ctx.moveTo(0,y);
    ctx.lineTo(w,y);
    ctx.stroke();
  }

  // LED bars
  ctx.globalAlpha = 1;
  const gap = 2;
  const barW = Math.floor((w - (bars-1)*gap) / bars);
  const segH = 6;
  const segGap = 2;
  const segCount = Math.floor((h - 8) / (segH + segGap));

  for(let i=0;i<bars;i++){
    const x = i*(barW+gap);
    const onSegs = Math.floor(levels[i] * segCount);
    const peakSeg = Math.min(segCount-1, Math.floor(peaks[i] * segCount));

    for(let s=0;s<segCount;s++){
      const y = h - 4 - (s+1)*(segH+segGap);
      const isOn = s < onSegs;

      let color = "#1a2a1f";
      if (isOn){
        const t = s/segCount;
        if (t < 0.55) color = "#5bff89";
        else if (t < 0.82) color = "#32d4ff";
        else color = "#ffc857";
      }

      ctx.fillStyle = color;
      ctx.fillRect(x,y,barW,segH);
    }

    // Peak hold
    const yPeak = h - 4 - (peakSeg+1)*(segH+segGap);
    ctx.fillStyle = "#ffc857";
    ctx.globalAlpha = 0.95;
    ctx.fillRect(x, yPeak, barW, 2);
    ctx.globalAlpha = 1;
  }
}

function loop(){
  // clock
  const t = fmtDateTime();
  ui.clock.textContent = t.clock;
  ui.date.textContent = t.date;

  // spectrum only if visible
  if (ui.spectrum && !ui.spectrum.classList.contains("hidden")){
    stepSpectrum();
    drawSpectrum();
  }

  // keep meters animating smoothly
  if (state){
    updateSMeter(ui.rxSMeterFill, ui.rxSMeterPeak, smeterToFrac(state.rx_s, state.rx_over_db));
    updateSMeter(ui.wxSMeterFill, ui.wxSMeterPeak, smeterToFrac(state.wx_s, state.wx_over_db));
  }

  requestAnimationFrame(loop);
}

connectSse();
loop();
