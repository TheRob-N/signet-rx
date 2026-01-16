// SIGNET-RX v1-alpha UI
// - subscribes to /events (SSE)
// - animates a retro hi-fi spectrum (demo)

const $ = (id) => document.getElementById(id);

const ui = {
  clock: $("clock"),
  date: $("date"),
  mode: $("mode"),
  out: $("out"),
  vol: $("vol"),
  fmFreq: $("fmFreq"),
  fmStation: $("fmStation"),
  fmText: $("fmText"),
  wxFreq: $("wxFreq"),
  wxStatus: $("wxStatus"),
  lastAlert: $("lastAlert"),
  lastAlertTime: $("lastAlertTime"),
  ledStereo: $("ledStereo"),
  ledRds: $("ledRds"),
  ledWx: $("ledWx"),
  ledAlert: $("ledAlert"),
  alertBanner: $("alertBanner"),
  alertBannerText: $("alertBannerText"),
  details: $("details"),
  detailsTitle: $("detailsTitle"),
  detailsBody: $("detailsBody"),
  btnClose: $("btnClose"),
  btnToggleViz: $("btnToggleViz"),
  spectrum: $("spectrum"),
  viz: $("viz")
};

let state = null;
let vizMode = "panel"; // panel | fullscreen

function fmtDateTime(d = new Date()){
  const pad = (n)=> String(n).padStart(2,"0");
  const days = ["SUN","MON","TUE","WED","THU","FRI","SAT"];
  const mons = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const clock = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const date = `${days[d.getDay()]} ${mons[d.getMonth()]} ${d.getDate()}`;
  return {clock, date};
}

function setLed(el, on){
  el.classList.toggle("on", !!on);
}

function updateUiFromState(s){
  ui.mode.textContent = s.mode || "--";
  ui.out.textContent = s.audio_output || "--";
  ui.vol.textContent = Math.round((s.volume ?? 0.0) * 100);

  ui.fmFreq.textContent = `${(s.fm_freq_mhz ?? 0).toFixed(1)} MHz`;
  ui.fmStation.textContent = s.rds_station || "";
  ui.fmText.textContent = s.rds_text || "";

  ui.wxFreq.textContent = `${(s.wx_freq_mhz ?? 0).toFixed(3)} MHz`;
  ui.wxStatus.textContent = s.wx_status || "";
  ui.lastAlert.textContent = s.last_alert || "None";
  ui.lastAlertTime.textContent = s.last_alert_time || "";

  setLed(ui.ledStereo, !!s.stereo);
  setLed(ui.ledRds, !!(s.rds_station && s.rds_station.length));
  setLed(ui.ledWx, true);

  const hasAlert = s.last_alert && s.last_alert !== "None";
  setLed(ui.ledAlert, !!hasAlert);

  ui.alertBanner.classList.toggle("show", !!hasAlert);
  ui.alertBannerText.textContent = hasAlert ? `${s.last_alert} ${s.last_alert_time ? "• " + s.last_alert_time : ""}` : "";
}

function openDetails(which){
  ui.details.classList.remove("hidden");
  if (which === "fm"){
    ui.detailsTitle.textContent = "FM Station Details";
    const lines = [
      `Frequency: ${ui.fmFreq.textContent}`,
      `Station: ${ui.fmStation.textContent || "(none)"}`,
      "",
      "Radio Text:",
      ui.fmText.textContent || "(none)"
    ];
    ui.detailsBody.textContent = lines.join("\n");
  } else {
    ui.detailsTitle.textContent = "Weather Alert Details";
    const lines = [
      `NOAA: ${ui.wxFreq.textContent}`,
      `Status: ${ui.wxStatus.textContent}`,
      "",
      `Last Alert: ${ui.lastAlert.textContent}`,
      `Time: ${ui.lastAlertTime.textContent || "(unknown)"}`,
      "",
      "(In v1-alpha this is demo data. In later versions, this panel will include decoded SAME fields: event, originator, areas, issued, expires, and raw header.)"
    ];
    ui.detailsBody.textContent = lines.join("\n");
  }
}

function closeDetails(){
  ui.details.classList.add("hidden");
}

ui.btnClose.addEventListener("click", closeDetails);
ui.details.addEventListener("click", (e)=>{
  if (e.target === ui.details) closeDetails();
});

$("fmPanel").addEventListener("click", ()=>openDetails("fm"));
$("wxPanel").addEventListener("click", ()=>openDetails("wx"));

ui.btnToggleViz.addEventListener("click", ()=>{
  vizMode = (vizMode === "panel") ? "fullscreen" : "panel";
  ui.viz.classList.toggle("fullscreen", vizMode === "fullscreen");
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
  es.onerror = ()=>{
    // let EventSource reconnect; UI keeps animating.
  };
}

// --- Spectrum animation (demo) ---
const ctx = ui.spectrum.getContext("2d");
let bars = 32;
let levels = new Array(bars).fill(0);
let peaks = new Array(bars).fill(0);

function resizeSpectrum(){
  const dpr = window.devicePixelRatio || 1;
  const rect = ui.spectrum.getBoundingClientRect();
  ui.spectrum.width = Math.floor(rect.width * dpr);
  ui.spectrum.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
window.addEventListener("resize", resizeSpectrum);
resizeSpectrum();

function stepSpectrum(){
  // Gentle fake "audio" movement; later this can be driven by real audio FFT.
  for(let i=0;i<bars;i++){
    const drift = Math.random()*0.18;
    const target = (Math.sin((performance.now()/600) + i*0.35)*0.5 + 0.5) * (0.35 + drift);
    levels[i] = Math.max(0, Math.min(1, levels[i]*0.86 + target*0.14));
    peaks[i] = Math.max(levels[i], peaks[i] - 0.010);
  }
}

function drawSpectrum(){
  const w = ui.spectrum.clientWidth;
  const h = ui.spectrum.clientHeight;
  ctx.clearRect(0,0,w,h);

  // Background grid
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = "#1b2430";
  ctx.lineWidth = 1;
  const rows = 5;
  for(let r=1;r<rows;r++){
    const y = Math.round(h*r/rows);
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

      // Color: green low, cyan mid, amber high
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

    // Peak hold dot
    const yPeak = h - 4 - (peakSeg+1)*(segH+segGap);
    ctx.fillStyle = "#ffc857";
    ctx.globalAlpha = 0.95;
    ctx.fillRect(x, yPeak, barW, 2);
    ctx.globalAlpha = 1;
  }
}

function loop(){
  stepSpectrum();
  drawSpectrum();
  const t = fmtDateTime();
  ui.clock.textContent = t.clock;
  ui.date.textContent = t.date;
  requestAnimationFrame(loop);
}

connectSse();
loop();
