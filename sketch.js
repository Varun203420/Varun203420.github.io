// HCDE 439 – Assignment 6
// Varun Hariharan
// LDR + Button → p5 visual; SPACE key → LED on Arduino

const BAUD_RATE = 9600; // must match Serial.begin in Arduino

let port;
let connectBtn;
let latestLine = "0,0"; // "light,button"
let lightVal = 0;
let buttonVal = 0;
let ledOn = false;      // our idea of LED state

function setup() {
  createCanvas(640, 400);
  textFont("system-ui");
  textAlign(LEFT, TOP);

  setupSerial(); // create port + connect button
  updateStatus("Not connected");
}

function draw() {
  background(10);

  // Try to read from serial if port is open
  const isOpen = checkPort();
  if (isOpen) {
    readSerial();
  }

  // ----- Visualize light + button -----
  // Map light value to background tint
  const bgLevel = map(lightVal, 0, 1023, 20, 220);
  background(bgLevel * 0.08, bgLevel * 0.2, bgLevel * 0.35);

  // Text info
  fill(255);
  noStroke();
  textSize(18);
  text(`Light (A0): ${lightVal}`, 20, 20);
  text(`Button (2): ${buttonVal === 1 ? "PRESSED" : "not pressed"}`, 20, 50);
  text(`LED (pin 9) from webpage: ${ledOn ? "ON" : "OFF"}`, 20, 80);

  textSize(14);
  fill(220);
  text("Press SPACE to toggle LED. Cover LDR / shine phone light to change visuals.", 20, height - 30);

  // Light bar on the right
  const barHeight = map(lightVal, 0, 1023, 0, height - 120);
  noStroke();
  fill(255, 240);
  rect(width - 80, height - barHeight - 40, 40, barHeight);

  // Button indicator circle in the center
  stroke(255);
  strokeWeight(2);
  if (buttonVal === 1) {
    fill(255, 200, 80);
    circle(width / 2, height / 2, 120);
  } else {
    fill(30);
    circle(width / 2, height / 2, 60);
  }
}

// ----------------------
// Serial helpers (based on class slide patterns)
// ----------------------

function setupSerial() {
  port = createSerial();

  // auto-reconnect if browser remembers a port
  const usedPorts = usedSerialPorts();
  if (usedPorts.length > 0) {
    port.open(usedPorts[0], BAUD_RATE);
    updateStatus("Reconnecting to last used port…");
  }

  // make a connect button (like in the slides)
  connectBtn = createButton("Connect");
  connectBtn.position(20, 120);
  connectBtn.mousePressed(onConnectButtonClicked);
}

function onConnectButtonClicked() {
  if (!port.opened()) {
    // ask user to choose a port
    port.open(BAUD_RATE);
    updateStatus("Connecting…");
  } else {
    port.close();
    updateStatus("Disconnected");
  }
}

function checkPort() {
  if (!port) return false;
  if (!port.opened()) return false;
  return true;
}

function readSerial() {
  // read a full line "light,button\n"
  let line = port.readUntil("\n");
  if (!line || line.length === 0) return;

  latestLine = line.trim();
  // parse "123,0" → [123, 0]
  const parts = latestLine.split(",");
  if (parts.length === 2) {
    const l = Number(parts[0]);
    const b = Number(parts[1]);

    if (!Number.isNaN(l)) lightVal = l;
    if (!Number.isNaN(b)) buttonVal = b;
  }
}

// ----------------------
// Keyboard → Arduino (web talks back)
// ----------------------

function keyPressed() {
  // SPACE toggles LED and sends '1'/'0' to Arduino
  if (key === " ") {
    ledOn = !ledOn;

    if (checkPort()) {
      const msg = ledOn ? "1" : "0";
      // send a single character, slides recommend single-byte commands
      port.write(msg);
      updateStatus(`Sent '${msg}' to Arduino (LED ${ledOn ? "ON" : "OFF"})`);
    } else {
      updateStatus("Cannot send – not connected");
    }
  }
}

// ----------------------
// UI helper
// ----------------------

function updateStatus(msg) {
  const el = document.getElementById("status");
  if (el) el.textContent = msg;
}
