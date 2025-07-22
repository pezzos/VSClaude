/**
 * Environment detection utilities for distinguishing browser vs VSCode webview
 */

// Check if we're running in a VSCode webview vs browser
export const isVSCodeWebview = (): boolean => {
  // VSCode webview has acquireVsCodeApi function
  return typeof (window as any).acquireVsCodeApi !== 'undefined';
};

// Check if we're in development mode (browser)
export const isBrowserDev = (): boolean => {
  return !isVSCodeWebview() && window.location.hostname === 'localhost';
};

// Environment info for debugging
export const getEnvironmentInfo = () => {
  return {
    isVSCodeWebview: isVSCodeWebview(),
    isBrowserDev: isBrowserDev(),
    hostname: window.location.hostname,
    port: window.location.port,
    userAgent: navigator.userAgent
  };
};