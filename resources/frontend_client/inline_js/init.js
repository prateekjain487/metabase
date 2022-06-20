const content = [
  ["drill-through-img", "Click on your charts to dive deeper."],
  ["metabot-img shadow", "Bring your charts and data into Slack."],
  ["calendar-img", "Dashboard filters let you filter all your charts at once."],
  ["charts-img shadow", "Easily create and share beautiful dashboards."],
  [
    "column-heading-img",
    "Click on column headings in your tables to explore them.",
  ],
];

const featureImage = document.getElementById("feature-image");
const heading = document.getElementById("heading");

let counter = 0;

function switcher() {
  setInterval(function() {
    counter++;
    if (counter === content.length) {
      counter = 0;
    }
    featureImage.className =
      featureImage.className.replace(" opaque", "") + " transparent";
    heading.className = "transparent";

    // Need to somehow wait here for a sec before fading things back in
    setTimeout(function() {
      featureImage.className = content[counter][0] + " opaque";
      heading.innerHTML = content[counter][1];
      heading.className = "opaque";
    }, 200);
  }, 4000);
}

const messages = [
  "Polishing tables…",
  "Scaling scalars…",
  "Straightening columns…",
  "Embiggening data…",
  "Reticulating splines…",
];
const progressElement = document.getElementById("progress");
const statusElement = document.getElementById("status");

function poll() {
  const req = new XMLHttpRequest();
  req.open("GET", "api/health", true);
  req.onreadystatechange = function() {
    if (req.readyState === 4) {
      if (req.status === 200) {
        window.location.reload();
      } else {
        try {
          const health = JSON.parse(req.responseText);
          if (typeof health.progress === "number") {
            const newValue = health.progress * 100;
            if (newValue !== progressElement.value) {
              progressElement.value = newValue;
              statusElement.textContent =
                messages[Math.floor(Math.random() * messages.length)];
            }
          }
        } catch (e) {}
        setTimeout(poll, 500);
      }
    }
  };
  req.send();
}

// switcher();
// poll();
