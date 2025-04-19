console.log("CSP Remover extension loaded");

// Initialize storage for logs if not already done
chrome.storage.local.get("cspLogs", function (data) {
  if (!data.cspLogs) {
    chrome.storage.local.set({ cspLogs: [] });
    console.log("CSP logs initialized");
  }
});

// Set up a listener to capture and log CSP headers before they're removed
chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    // Skip if there are no responseHeaders
    if (!details.responseHeaders) {
      return { responseHeaders: details.responseHeaders };
    }

    const url = new URL(details.url);
    const domain = url.hostname;

    // Look for CSP headers in the response
    const cspHeaders = details.responseHeaders.filter(
      (header) =>
        header.name.toLowerCase() === "content-security-policy" ||
        header.name.toLowerCase() === "content-security-policy-report-only"
    );

    // If CSP headers are found, log them
    if (cspHeaders.length > 0) {
      console.log(`Found ${cspHeaders.length} CSP headers on ${domain}`);

      cspHeaders.forEach((header) => {
        console.log(`Removing ${header.name} from ${domain}`);

        // Store in persistent storage
        chrome.storage.local.get("cspLogs", function (data) {
          const logs = data.cspLogs || [];
          logs.unshift({
            domain: domain,
            headerName: header.name,
            headerValue: header.value,
            timestamp: Date.now(),
          });

          // Keep only the most recent 100 entries
          if (logs.length > 100) {
            logs.pop();
          }

          chrome.storage.local.set({ cspLogs: logs });
          console.log(`Saved log entry for ${domain}`);
        });

        // Send to the popup if it's open
        try {
          chrome.runtime.sendMessage({
            type: "csp_removed",
            domain: domain,
            headerName: header.name,
            headerValue: header.value,
          });
        } catch (error) {
          // Ignore errors when popup is not open
          console.log("Could not send message to popup (might not be open)");
        }
      });
    }

    // This listener is only for logging, not modifying
    return { responseHeaders: details.responseHeaders };
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);
