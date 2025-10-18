/**
 * Fetch Interceptor for Debugging Network Requests
 *
 * This utility helps debug unexpected network requests by logging
 * all fetch calls with their stack traces.
 *
 * Usage: Import this file in your root layout or app component
 * Only runs in development mode
 */

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalFetch = window.fetch;
  const requestCounts = new Map<string, number>();

  // @ts-ignore
  window.fetch = function (...args: Parameters<typeof fetch>) {
    const firstArg = args[0];
    let url = "unknown";

    if (typeof firstArg === "string") {
      url = firstArg;
    } else if (firstArg instanceof Request) {
      url = firstArg.url;
    } else if (firstArg instanceof URL) {
      url = firstArg.href;
    }

    // Increment request count
    const count = (requestCounts.get(url) || 0) + 1;
    requestCounts.set(url, count);

    // Log the request
    console.group(`[Fetch #${count}] ${url}`);
    console.log("Arguments:", args);
    console.trace("Stack trace:");
    console.groupEnd();

    // Call original fetch
    return originalFetch.apply(this, args);
  };

  // Expose utility to check request counts
  // @ts-ignore
  window.getRequestCounts = () => {
    console.table(
      Array.from(requestCounts.entries()).map(([url, count]) => ({
        url,
        count,
      }))
    );
  };

  console.log(
    "[Fetch Interceptor] Enabled - Run window.getRequestCounts() to see all requests"
  );
}

export {};
