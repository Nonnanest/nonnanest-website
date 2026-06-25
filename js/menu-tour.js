/*
  Nonnanest SightAware — Bottom Menu Tour + Buttons Guide
  Self-contained component for the Quick Start page.
  Requires React + ReactDOM loaded globally (see <script> tags in <head>).
  Renders into <div id="nonnanest-menu-tour"></div>.
  No build step. Edit this file and commit to update.

  Regulatory: skin-temperature / wellness language only. Alert Red is
  used solely on the skin-temperature alert value, never decoratively.
*/
(function () {
  if (typeof React === "undefined" || typeof ReactDOM === "undefined") {
    console.warn("[Nonnanest tour] React not found; skipping interactive guide.");
    return;
  }
  var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef, useCallback = React.useCallback;

/*
  Nonnanest SightAware — Bottom Menu Tour
  ---------------------------------------
  Auto-playing walkthrough of the parent display's bottom menu. Steps
  left to right through all 8 icons, opening each submenu on the screen
  while a caption strip below the handheld explains what the icon does
  and what you can set inside it.

  Controls: play/pause, prev/next, and clickable icon chips to jump.

  Regulatory: "skin temperature" framing only. Alert Red (#C45B4A) is
  used only on an elevated skin-temperature reading, never decoratively.
  Feeding reminder is described plainly (it is on the deprecation list),
  not promoted.
*/

const C = {
  softTeal: "#559092",
  deepTeal: "#3D6B6D",
  paleAqua: "#C8E3DF",
  tealMist: "#E4EFEE",
  warmWhite: "#FAF8F5",
  cream: "#F5F0EA",
  linen: "#EDE7DF",
  warmSand: "#D4CCC2",
  charcoal: "#2C2520",
  earth: "#5C4F43",
  bark: "#8C7B6B",
  alertRed: "#C45B4A"
};
const S = {
  barBg: "#5fa8aa",
  submenuBg: "#67b0b2",
  submenuSel: "#8fd0d0",
  red: "#C45B4A",
  redDot: "#d6452e"
};

// ---- icons (white stroke, device style) ----
const IconBottle = ({
  s = 22,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: c,
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M9 2h6M10 2l-.5 2.5M14 2l.5 2.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9.2 5h5.6c.4 0 .7.4.6.8l-.5 2.2H9.1L8.6 5.8c-.1-.4.2-.8.6-.8z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8.8 8h6.4v11a2 2 0 0 1-2 2h-2.4a2 2 0 0 1-2-2V8z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 12h2M9 15h2"
}));
const IconNote = ({
  s = 22,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: c,
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M9 18V5l10-2v13"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "6",
  cy: "18",
  r: "3"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "16",
  cy: "16",
  r: "3"
}));
const IconClock = ({
  s = 22,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: c,
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 7v5l3 2"
}));
const IconThermo = ({
  s = 22,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: c,
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0z"
}));
const IconCam = ({
  s = 22,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: c,
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("rect", {
  x: "4",
  y: "8",
  width: "16",
  height: "11",
  rx: "2"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "13.5",
  r: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 8l1.2-2h3.6L15 8"
}));
const IconBabyFace = ({
  s = 22,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: c,
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M9 14c.8 1 2.2 1 3 1s2.2 0 3-1"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8.5 10h.01M15.5 10h.01"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 3c-1 1.2-1 2.4 0 3"
}));
const IconZoom = ({
  s = 22,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: c,
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "7"
}), /*#__PURE__*/React.createElement("path", {
  d: "M21 21l-4.3-4.3M8 11h6M11 8v6"
}));
const IconDistance = ({
  s = 22,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: s * 1.35,
  height: s,
  viewBox: "0 0 34 24",
  fill: "none",
  stroke: c,
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("rect", {
  x: "2",
  y: "5.5",
  width: "11",
  height: "9",
  rx: "2"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "7.5",
  cy: "10",
  r: "2.4",
  fill: "none"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "7.5",
  cy: "10",
  r: "0.6",
  fill: c,
  stroke: "none"
}), /*#__PURE__*/React.createElement("path", {
  d: "M5 5.5l.6-1.4h3.8L10 5.5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M14.5 10h5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M16 8.4 14.3 10l1.7 1.6"
}), /*#__PURE__*/React.createElement("path", {
  d: "M18 8.4 19.7 10l-1.7 1.6"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "26",
  cy: "7.5",
  r: "3.2",
  fill: c,
  stroke: "none"
}), /*#__PURE__*/React.createElement("path", {
  d: "M20.5 19c0-3.6 2.5-6 5.5-6s5.5 2.4 5.5 6z",
  fill: c,
  stroke: "none"
}));
const IconHouse = ({
  s = 15,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: s,
  height: s,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: c,
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, /*#__PURE__*/React.createElement("path", {
  d: "M4 11l8-7 8 7v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"
}));
const VoxGlyph = ({
  s = 15,
  c = "#fff"
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    fontWeight: 700,
    fontSize: s,
    color: c,
    letterSpacing: 0.5,
    lineHeight: 1
  }
}, "VOX");
const SignalBars = ({
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: "20",
  height: "14",
  viewBox: "0 0 22 16",
  fill: c
}, [0, 1, 2, 3].map(i => /*#__PURE__*/React.createElement("rect", {
  key: i,
  x: i * 5,
  y: 11 - i * 3,
  width: "3.2",
  height: 4 + i * 3,
  rx: "0.5"
})));
const Battery = ({
  c = "#fff"
}) => /*#__PURE__*/React.createElement("svg", {
  width: "24",
  height: "14",
  viewBox: "0 0 26 16",
  fill: "none",
  stroke: c,
  strokeWidth: "1.4"
}, /*#__PURE__*/React.createElement("rect", {
  x: "1",
  y: "3",
  width: "20",
  height: "10",
  rx: "2"
}), /*#__PURE__*/React.createElement("rect", {
  x: "22",
  y: "6",
  width: "2.5",
  height: "4",
  rx: "1",
  fill: c
}), /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "5",
  width: "14",
  height: "6",
  rx: "1",
  fill: c,
  stroke: "none"
}));

// ---- tour definition: one stop per bottom-menu icon, left -> right ----
const STOPS = [{
  key: "bottle",
  Icon: IconBottle,
  name: "Feeding reminder",
  what: "An optional countdown timer that reminds you when the next feed is due.",
  settings: ["4:00", "3:00", "2:00", "1:00", "0:30", "OFF"],
  def: 5,
  settingLabel: "Reminder interval"
}, {
  key: "music",
  Icon: IconNote,
  name: "Lullabies",
  what: "Plays one of eight soft melodies through the camera to help settle your baby.",
  settings: ["♪1", "♪2", "♪3", "♪4", "♪5", "♪6", "♪7", "♪8", "OFF"],
  def: 8,
  settingLabel: "Melody"
}, {
  key: "clock",
  Icon: IconClock,
  name: "Clock",
  what: "Sets the time shown in the top status bar.",
  settings: ["02 : 47 : 44 PM"],
  def: 0,
  settingLabel: "Set time"
}, {
  key: "temp",
  Icon: IconThermo,
  name: "Temperature",
  what: "Choose your units, then set a skin temperature alert. Pick the baby icon, highlight Set, and use the left and right keys to choose the temperature that triggers the alert.",
  settings: ["°F", "°C", "Skin temp alert"],
  def: 0,
  settingLabel: "Options",
  note: "If you do not set your own value, the default alert temperature is 102.2°F."
}, {
  key: "camera",
  Icon: IconCam,
  name: "Camera",
  what: "Manage the paired camera. Add another camera, remove one, or re-pair the display and camera.",
  settings: ["Add camera", "Delete", "Re-pair"],
  def: 0,
  settingLabel: "Camera options"
}, {
  key: "vox",
  Icon: VoxGlyph,
  name: "Sound-activated wake",
  what: "When this is on, the screen rests to save power and turns itself on the moment the camera hears your baby. Low, Mid, and High set how easily sound wakes it.",
  settings: ["HIGH", "MID", "LOW", "OFF"],
  def: 2,
  settingLabel: "Sensitivity"
}, {
  key: "zoom",
  Icon: IconZoom,
  name: "Zoom",
  what: "Zooms the live view in closer.",
  settings: ["x1", "x2", "x4"],
  def: 0,
  settingLabel: "Zoom level"
}, {
  key: "distance",
  Icon: IconDistance,
  name: "Camera distance",
  what: "Tell the display how far the camera sits above the mattress. Matching this to your real measurement keeps skin temperature readings accurate.",
  settings: ["60-80 cm  (2.0-2.6 ft)", "80-100 cm  (2.6-3.3 ft)", "100-120 cm  (3.3-3.9 ft)", "120-150 cm  (3.9-4.9 ft)"],
  def: 2,
  screenSettings: ["120-150cm", "100-120cm", "80-100cm", "60-80cm"],
  screenDef: 1,
  settingLabel: "Distance range",
  note: "The display shows these ranges in centimeters. Use the conversions above to match feet. Pediatric guidance: keep the camera at least 3 ft (1 m) from the mattress."
}];
const STEP_MS = 10000;
function MenuTour() {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [subSel, setSubSel] = useState(0);
  const [tempPhase, setTempPhase] = useState(0); // 0:units 1:picked F 2:highlight set 3:toggling value 4:done
  const [alertVal, setAlertVal] = useState(102.2);
  const timer = useRef(null);
  const subTimer = useRef(null);
  const phaseTimers = useRef([]);
  const stop = STOPS[idx];

  // advance through stops
  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => setIdx(i => (i + 1) % STOPS.length), STEP_MS);
    return () => clearTimeout(timer.current);
  }, [idx, playing]);

  // within a stop, animate the submenu highlight to its default (non-temp stops)
  useEffect(() => {
    phaseTimers.current.forEach(clearTimeout);
    phaseTimers.current = [];
    clearInterval(subTimer.current);
    setSubSel(0);
    setTempPhase(0);
    setAlertVal(102.2);
    if (stop.key === "temp") {
      // scripted alert flow across the 10s window
      const T = phaseTimers.current;
      T.push(setTimeout(() => setTempPhase(1), 1600)); // pick °F, alert rows appear
      T.push(setTimeout(() => setTempPhase(2), 3200)); // highlight "set"
      T.push(setTimeout(() => setTempPhase(3), 4400)); // begin toggling value
      // toggle the value down then settle
      [101.5, 101.0, 100.4].forEach((v, i) => T.push(setTimeout(() => setAlertVal(v), 4800 + i * 700)));
      T.push(setTimeout(() => setTempPhase(4), 7200)); // settled
      return () => {
        T.forEach(clearTimeout);
      };
    }
    const screenList = stop.screenSettings || stop.settings;
    const target = stop.screenDef != null ? stop.screenDef : stop.def;
    let step = 0;
    subTimer.current = setInterval(() => {
      step++;
      setSubSel(s => s >= target ? (clearInterval(subTimer.current), target) : s + 1);
      if (step > screenList.length) clearInterval(subTimer.current);
    }, 320);
    return () => clearInterval(subTimer.current);
  }, [idx]);
  const go = useCallback(n => {
    setIdx((n + STOPS.length) % STOPS.length);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Outfit',system-ui,sans-serif",
      background: C.warmWhite,
      color: C.earth,
      padding: "22px 16px",
      minHeight: "100%"
    }
  }, /*#__PURE__*/React.createElement("style", null, `
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Outfit:wght@300;400;500;600&family=Oswald:wght@600&display=swap');
        .chip{cursor:pointer;transition:all .15s ease;}
        .chip:hover{transform:translateY(-2px);}
        .tctrl{cursor:pointer;transition:transform .12s ease;}
        .tctrl:active{transform:scale(.92);}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        @media (prefers-reduced-motion: reduce){.chip,.tctrl{transition:none;}}
      `), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      textAlign: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Oswald',sans-serif",
      letterSpacing: 2,
      textTransform: "uppercase",
      fontSize: 12,
      color: C.deepTeal
    }
  }, "Nonnanest"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "'Fraunces',serif",
      fontWeight: 400,
      fontSize: 26,
      color: C.charcoal,
      margin: "3px 0 2px"
    }
  }, "Your menu, explained"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: C.bark,
      margin: 0
    }
  }, "A quick tour of every setting on the display.")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#1a1714",
      borderRadius: 14,
      padding: 12,
      boxShadow: "0 16px 44px rgba(44,37,32,0.18)",
      maxWidth: 480,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement(TourScreen, {
    stop: stop,
    subSel: subSel,
    tempPhase: tempPhase,
    alertVal: alertVal
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 6,
      margin: "14px 0 12px"
    }
  }, STOPS.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.key,
    style: {
      width: i === idx ? 22 : 7,
      height: 7,
      borderRadius: 4,
      background: i === idx ? C.softTeal : C.warmSand,
      transition: "all .3s ease"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    key: idx,
    style: {
      background: C.cream,
      border: `1px solid ${C.linen}`,
      borderRadius: 16,
      padding: 18,
      animation: "fadeUp .35s ease"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 44,
      borderRadius: 12,
      background: C.deepTeal,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement(stop.Icon, {
    s: stop.key === "vox" ? 13 : 22,
    c: "#fff"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: C.bark,
      fontFamily: "'Oswald',sans-serif"
    }
  }, idx + 1, " of ", STOPS.length), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Fraunces',serif",
      fontWeight: 500,
      fontSize: 20,
      color: C.charcoal,
      margin: 0
    }
  }, stop.name))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.6,
      color: C.earth,
      margin: "0 0 12px"
    }
  }, stop.what), /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.warmWhite,
      border: `1px solid ${C.linen}`,
      borderRadius: 10,
      padding: "10px 12px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      color: C.bark,
      marginBottom: 6
    }
  }, stop.settingLabel), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, stop.settings.map((opt, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: 12.5,
      padding: "4px 10px",
      borderRadius: 7,
      background: i === stop.def ? C.tealMist : C.cream,
      border: `1px solid ${i === stop.def ? C.paleAqua : C.linen}`,
      color: i === stop.def ? C.deepTeal : C.earth,
      fontWeight: i === stop.def ? 500 : 400
    }
  }, opt, i === stop.def && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      marginLeft: 5,
      opacity: 0.8
    }
  }, "default"))))), stop.note && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      lineHeight: 1.5,
      color: C.bark,
      margin: "10px 2px 0"
    }
  }, stop.note)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      margin: "16px 0 12px"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go(idx - 1),
    className: "tctrl",
    style: ctrlStyle()
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: C.deepTeal,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "15 18 9 12 15 6"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setPlaying(p => !p),
    className: "tctrl",
    style: {
      ...ctrlStyle(),
      width: 50,
      height: 50,
      background: C.deepTeal,
      borderColor: C.deepTeal
    }
  }, playing ? /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "#fff"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "5",
    width: "4",
    height: "14",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "5",
    width: "4",
    height: "14",
    rx: "1"
  })) : /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "#fff"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "7 4 20 12 7 20 7 4"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: () => go(idx + 1),
    className: "tctrl",
    style: ctrlStyle()
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: C.deepTeal,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "9 18 15 12 9 6"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "center",
      gap: 6,
      flexWrap: "wrap"
    }
  }, STOPS.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s.key,
    className: "chip",
    onClick: () => {
      setIdx(i);
    },
    title: s.name,
    style: {
      width: 42,
      height: 42,
      borderRadius: 10,
      border: `1.5px solid ${i === idx ? C.softTeal : C.linen}`,
      background: i === idx ? C.softTeal : C.warmWhite,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(s.Icon, {
    s: s.key === "vox" ? 11 : 19,
    c: i === idx ? "#fff" : C.deepTeal
  })))), /*#__PURE__*/React.createElement(ButtonsGuide, null), /*#__PURE__*/React.createElement("p", {
    style: {
      textAlign: "center",
      fontSize: 11.5,
      color: C.bark,
      marginTop: 18,
      lineHeight: 1.5
    }
  }, "Wellness device. Not a medical device. See nonnanest.com for details.")));
}
function ctrlStyle() {
  return {
    width: 42,
    height: 42,
    borderRadius: "50%",
    border: `1.5px solid ${C.warmSand}`,
    background: C.warmWhite,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 5px rgba(44,37,32,0.1)"
  };
}

// ============ SCREEN ============
function TourScreen({
  stop,
  subSel,
  tempPhase,
  alertVal
}) {
  const W = 456,
    H = 256;
  const MENU = STOPS;
  const activeIdx = STOPS.findIndex(s => s.key === stop.key);
  const leftPct = (activeIdx + 0.5) / MENU.length * 100;
  const isTemp = stop.key === "temp";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      maxWidth: W,
      aspectRatio: `${W}/${H}`,
      position: "relative",
      borderRadius: 7,
      overflow: "hidden",
      background: "#2a2f33",
      margin: "0 auto",
      userSelect: "none",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(135deg,#5b6166,#3d4348 40%,#4a5055 70%,#363b3f)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "radial-gradient(ellipse at 55% 58%, rgba(200,210,215,0.32), transparent 55%)"
    }
  }), /*#__PURE__*/React.createElement("svg", {
    viewBox: `0 0 ${W} ${H}`,
    preserveAspectRatio: "none",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      opacity: 0.4
    }
  }, [36, 84, 140, 196].map((y, i) => /*#__PURE__*/React.createElement("path", {
    key: i,
    d: `M0 ${y} C ${W * 0.3} ${y - 20}, ${W * 0.6} ${y + 18}, ${W} ${y - 8}`,
    stroke: "rgba(255,255,255,0.18)",
    fill: "none",
    strokeWidth: "13"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "52%",
      top: "44%",
      transform: "translate(-50%,-50%)",
      color: S.red,
      fontSize: 24,
      fontWeight: 300
    }
  }, "+"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "11.5%",
      minHeight: 26,
      background: S.barBg,
      display: "flex",
      alignItems: "center",
      padding: "0 8px",
      gap: 10,
      fontSize: 13,
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 3,
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(IconHouse, {
    s: 14,
    c: "#fff"
  }), "72°"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 3,
      color: "#fff",
      fontWeight: 400
    }
  }, /*#__PURE__*/React.createElement(IconBabyFace, {
    s: 14,
    c: "#fff"
  }), "98.2°"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "#fff"
    }
  }, "02:47 PM"), /*#__PURE__*/React.createElement(SignalBars, {
    c: "#fff"
  }), /*#__PURE__*/React.createElement(Battery, {
    c: "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "15%",
      minHeight: 34,
      background: S.barBg,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-around",
      padding: "0 4px"
    }
  }, MENU.map((m, i) => {
    const sel = i === activeIdx;
    const Icon = m.Icon;
    return /*#__PURE__*/React.createElement("div", {
      key: m.key,
      style: {
        width: "11%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: sel ? S.submenuSel : "transparent",
        borderRadius: sel ? 6 : 0,
        transition: "background .25s"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      s: m.key === "vox" ? 12 : 19,
      c: sel ? C.deepTeal : "#fff"
    }));
  })), isTemp ? /*#__PURE__*/React.createElement(TempAlertPanel, {
    leftPct: leftPct,
    tempPhase: tempPhase,
    alertVal: alertVal
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: "15%",
      left: `${leftPct}%`,
      transform: "translateX(-50%)",
      background: S.submenuBg,
      borderRadius: 6,
      overflow: "hidden",
      minWidth: 56,
      maxHeight: "74%",
      boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
    }
  }, renderSubItems(stop, subSel)));
}

// Faithful recreation of the temperature alert flow (per device photo):
// units column (°C / °F), then alarm row "102.2°F < 🌡🔊 >", then "set < value >"
function TempAlertPanel({
  leftPct,
  tempPhase,
  alertVal
}) {
  const fSel = tempPhase >= 1; // °F chosen
  const setHi = tempPhase >= 2; // "set" row highlighted
  const valActive = tempPhase >= 3; // value toggling
  const cell = {
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      bottom: "15%",
      left: `${leftPct}%`,
      transform: "translateX(-46%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
      boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
      borderRadius: 6,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: S.submenuBg
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cell,
      padding: "5px 14px",
      fontSize: 12
    }
  }, "°C"), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cell,
      padding: "5px 14px",
      fontSize: 12,
      background: fSel ? "transparent" : "transparent",
      position: "relative"
    }
  }, "°F", fSel && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 3,
      top: "50%",
      transform: "translateY(-50%)",
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: S.redDot
    }
  }))), fSel && /*#__PURE__*/React.createElement("div", {
    style: {
      background: S.submenuBg,
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "0 10px",
      alignSelf: "flex-end",
      height: "50%"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      fontSize: 12
    }
  }, "102.2°F"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      opacity: 0.8
    }
  }, "<"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(IconThermo, {
    s: 13,
    c: "#fff"
  }), /*#__PURE__*/React.createElement(Spk, null)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "#fff",
      opacity: 0.8
    }
  }, ">"))), fSel && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      background: setHi ? S.submenuSel : S.submenuBg,
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cell,
      padding: "5px 10px"
    }
  }, /*#__PURE__*/React.createElement(IconBabyFace, {
    s: 15,
    c: setHi ? "#1a3a3a" : "#fff"
  }), /*#__PURE__*/React.createElement(IconThermo, {
    s: 13,
    c: setHi ? "#1a3a3a" : "#fff"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "5px 14px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: setHi ? "#1a3a3a" : "#fff"
    }
  }, "set"), /*#__PURE__*/React.createElement("span", {
    style: {
      color: valActive ? S.red : "#fff",
      opacity: 0.85
    }
  }, "<"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600,
      color: S.red,
      letterSpacing: 1
    }
  }, alertVal.toFixed(1)), /*#__PURE__*/React.createElement("span", {
    style: {
      color: valActive ? S.red : "#fff",
      opacity: 0.85
    }
  }, ">"))));
}
function Spk() {
  return /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "12",
    viewBox: "0 0 24 16",
    fill: "#fff"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "3,6 6,6 9,3 9,13 6,10 3,10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11 5a4 4 0 0 1 0 6",
    stroke: "#fff",
    strokeWidth: "1.3",
    fill: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 3a7 7 0 0 1 0 10",
    stroke: "#fff",
    strokeWidth: "1.3",
    fill: "none"
  }));
}
function renderSubItems(stop, subSel) {
  const list = stop.screenSettings || stop.settings;
  const def = stop.screenDef != null ? stop.screenDef : stop.def;
  return list.map((it, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "5px 12px",
      textAlign: "center",
      fontSize: 12.5,
      color: i === subSel ? "#1a3a3a" : "#fff",
      background: i === subSel ? S.submenuSel : "transparent",
      position: "relative",
      transition: "background .2s",
      whiteSpace: "nowrap"
    }
  }, it, i === def && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 4,
      top: "50%",
      transform: "translateY(-50%)",
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: S.redDot
    }
  })));
}

// ============ PHYSICAL BUTTONS GUIDE ============
const BUTTONS = [{
  key: "mic",
  name: "Talk",
  what: "Press and hold to talk through to the camera. Your baby hears your voice from the nursery."
}, {
  key: "music",
  name: "Lullaby",
  what: "Plays a soft melody through the camera. Press again to stop."
}, {
  key: "bright",
  name: "Brightness",
  what: "The sun keys raise and lower screen brightness. Inside a menu, they scroll a list up and down."
}, {
  key: "volume",
  name: "Volume",
  what: "The speaker keys turn the sound up and down. Inside a menu, they move left and right across the options."
}, {
  key: "ok",
  name: "OK / M",
  what: "Opens the bottom menu, and confirms whatever is highlighted. Your main button for getting into settings."
}, {
  key: "move",
  name: "Move / Back",
  what: "Enters camera move mode, then the sun and speaker keys aim the lens up, down, left, and right. Inside a menu it steps back."
}];
function ButtonsGuide() {
  const [sel, setSel] = useState("ok");
  const active = BUTTONS.find(b => b.key === sel);
  const ring = k => sel === k;
  const armBase = {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 9,
    background: C.warmWhite,
    border: `1.5px solid ${C.warmSand}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: C.deepTeal,
    cursor: "pointer"
  };
  const armSel = {
    boxShadow: `0 0 0 3px ${C.paleAqua}`,
    borderColor: C.softTeal
  };
  const sun = filled => /*#__PURE__*/React.createElement("svg", {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: C.deepTeal,
    strokeWidth: "1.7",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: filled ? 4 : 3.2,
    fill: filled ? C.deepTeal : "none"
  }), [0, 45, 90, 135, 180, 225, 270, 315].map(a => {
    const r = a * Math.PI / 180;
    return /*#__PURE__*/React.createElement("line", {
      key: a,
      x1: 12 + Math.cos(r) * 6.5,
      y1: 12 + Math.sin(r) * 6.5,
      x2: 12 + Math.cos(r) * 8.5,
      y2: 12 + Math.sin(r) * 8.5
    });
  }));
  const spk = /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "14",
    viewBox: "0 0 24 16",
    fill: C.deepTeal,
    stroke: C.deepTeal,
    strokeWidth: "1.1"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "4,6 7,6 11,3 11,13 7,10 4,10"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 5a4 4 0 0 1 0 6",
    fill: "none"
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "'Fraunces',serif",
      fontWeight: 400,
      fontSize: 23,
      color: C.charcoal,
      margin: "0 0 2px"
    }
  }, "The buttons"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13.5,
      color: C.bark,
      margin: 0
    }
  }, "Tap a button to see what it does.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 20,
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: C.warmWhite,
      border: `1px solid ${C.linen}`,
      borderRadius: 18,
      padding: "20px 26px",
      boxShadow: "0 8px 26px rgba(44,37,32,0.10)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "'Oswald',sans-serif",
      color: C.deepTeal,
      letterSpacing: 1.5,
      fontSize: 12
    }
  }, "NONNANEST"), /*#__PURE__*/React.createElement("button", {
    className: "tctrl",
    onClick: () => setSel("mic"),
    style: {
      width: 46,
      height: 46,
      borderRadius: "50%",
      background: C.warmWhite,
      border: `1.5px solid ${C.warmSand}`,
      ...(ring("mic") ? {
        boxShadow: `0 0 0 3px ${C.paleAqua}`,
        borderColor: C.softTeal
      } : {}),
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "20",
    height: "20",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: C.deepTeal,
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "3",
    width: "6",
    height: "11",
    rx: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 11a6 6 0 0 0 12 0M12 17v3"
  }))), /*#__PURE__*/React.createElement("button", {
    className: "tctrl",
    onClick: () => setSel("music"),
    style: {
      width: 46,
      height: 46,
      borderRadius: "50%",
      background: C.warmWhite,
      border: `1.5px solid ${C.warmSand}`,
      ...(ring("music") ? {
        boxShadow: `0 0 0 3px ${C.paleAqua}`,
        borderColor: C.softTeal
      } : {}),
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(IconNote, {
    s: 20,
    c: C.deepTeal
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: 120,
      height: 120,
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "50%",
      border: `1.5px solid ${C.linen}`,
      background: C.cream
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "tctrl",
    onClick: () => setSel("bright"),
    style: {
      ...armBase,
      top: 0,
      left: 41,
      ...(ring("bright") ? armSel : {})
    }
  }, sun(true)), /*#__PURE__*/React.createElement("button", {
    className: "tctrl",
    onClick: () => setSel("bright"),
    style: {
      ...armBase,
      bottom: 0,
      left: 41,
      ...(ring("bright") ? armSel : {})
    }
  }, sun(false)), /*#__PURE__*/React.createElement("button", {
    className: "tctrl",
    onClick: () => setSel("volume"),
    style: {
      ...armBase,
      left: 0,
      top: 41,
      ...(ring("volume") ? armSel : {})
    }
  }, spk), /*#__PURE__*/React.createElement("button", {
    className: "tctrl",
    onClick: () => setSel("volume"),
    style: {
      ...armBase,
      right: 0,
      top: 41,
      ...(ring("volume") ? armSel : {})
    }
  }, spk), /*#__PURE__*/React.createElement("button", {
    className: "tctrl",
    onClick: () => setSel("ok"),
    style: {
      position: "absolute",
      top: 36,
      left: 36,
      width: 48,
      height: 48,
      borderRadius: "50%",
      background: C.deepTeal,
      color: "#fff",
      border: "none",
      ...(ring("ok") ? {
        boxShadow: `0 0 0 3px ${C.paleAqua}`
      } : {}),
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      lineHeight: 1,
      fontFamily: "'Oswald',sans-serif",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 600
    }
  }, "OK"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 9,
      opacity: 0.85,
      borderTop: "1px solid rgba(255,255,255,.4)",
      marginTop: 1,
      paddingTop: 1
    }
  }, "M"))), /*#__PURE__*/React.createElement("button", {
    className: "tctrl",
    onClick: () => setSel("move"),
    style: {
      width: 46,
      height: 46,
      borderRadius: "50%",
      background: C.warmWhite,
      border: `1.5px solid ${C.warmSand}`,
      ...(ring("move") ? {
        boxShadow: `0 0 0 3px ${C.paleAqua}`,
        borderColor: C.softTeal
      } : {}),
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "22",
    height: "22",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: C.deepTeal,
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M12 3v5M12 3l-2 2M12 3l2 2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 12h5M3 12l2-2M3 12l2 2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 12h-5M21 12l-2-2M21 12l-2 2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M9 20h7a2 2 0 0 0 2-2v-3M9 20l2-2M9 20l2 2"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 280,
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("div", {
    key: sel,
    style: {
      background: C.cream,
      border: `1px solid ${C.linen}`,
      borderRadius: 16,
      padding: 18,
      animation: "fadeUp .3s ease"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "'Fraunces',serif",
      fontWeight: 500,
      fontSize: 19,
      color: C.charcoal,
      margin: "0 0 6px"
    }
  }, active.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      lineHeight: 1.6,
      color: C.earth,
      margin: 0
    }
  }, active.what)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6,
      marginTop: 12
    }
  }, BUTTONS.map(b => /*#__PURE__*/React.createElement("button", {
    key: b.key,
    className: "chip",
    onClick: () => setSel(b.key),
    style: {
      fontSize: 12,
      padding: "6px 12px",
      borderRadius: 8,
      border: `1.5px solid ${sel === b.key ? C.softTeal : C.linen}`,
      background: sel === b.key ? C.softTeal : C.warmWhite,
      color: sel === b.key ? "#fff" : C.deepTeal,
      cursor: "pointer",
      fontFamily: "inherit"
    }
  }, b.name))))));
}
  function mount() {
    var el = document.getElementById("nonnanest-menu-tour");
    if (!el) return;
    el.style.display = "block";
    if (ReactDOM.createRoot) {
      ReactDOM.createRoot(el).render(React.createElement(MenuTour));
    } else {
      ReactDOM.render(React.createElement(MenuTour), el);
    }
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
