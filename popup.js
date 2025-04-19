// Load the stored CSP logs when the popup opens
document.addEventListener("DOMContentLoaded", function () {
  loadLogs();

  // Add event listener for the clear button
  const clearButton = document.getElementById("clear-log");
  if (clearButton) {
    clearButton.addEventListener("click", function () {
      chrome.storage.local.set({ cspLogs: [] }, function () {
        loadLogs();
      });
    });
  }
});

// Listen for new CSP removals while popup is open
chrome.runtime.onMessage.addListener(function (message) {
  if (message.type === "csp_removed") {
    addLogEntry(message.domain, message.headerName, message.headerValue);
  }
});

// Load logs from storage
function loadLogs() {
  chrome.storage.local.get("cspLogs", function (data) {
    const logs = data.cspLogs || [];
    const logContainer = document.getElementById("csp-log");

    if (!logContainer) return;
    logContainer.innerHTML = "";

    if (logs.length === 0) {
      logContainer.innerHTML =
        '<p class="no-data">No CSP headers have been removed yet.</p>';
      return;
    }

    logs.forEach(function (log) {
      const logEntry = document.createElement("div");
      logEntry.className = "log-entry";

      const domain = document.createElement("div");
      domain.className = "domain";
      domain.textContent = log.domain;

      const header = document.createElement("div");
      header.className = "header-name";
      header.textContent = log.headerName;

      const value = document.createElement("div");
      value.className = "header-value";
      value.textContent =
        log.headerValue.length > 100
          ? log.headerValue.substring(0, 100) + "..."
          : log.headerValue;

      const time = document.createElement("div");
      time.className = "timestamp";
      time.textContent = new Date(log.timestamp).toLocaleString();

      logEntry.appendChild(domain);
      logEntry.appendChild(header);
      logEntry.appendChild(value);
      logEntry.appendChild(time);

      logContainer.appendChild(logEntry);
    });
  });
}

function addLogEntry(domain, headerName, headerValue) {
  chrome.storage.local.get("cspLogs", function (data) {
    const logs = data.cspLogs || [];
    logs.unshift({
      domain: domain,
      headerName: headerName,
      headerValue: headerValue,
      timestamp: Date.now(),
    });

    // Keep only the most recent 100 entries
    if (logs.length > 100) {
      logs.pop();
    }

    chrome.storage.local.set({ cspLogs: logs }, function () {
      loadLogs();
    });
  });
}
