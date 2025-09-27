// src/utils.js
export function redactPII(text = "") {
  // emails
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/g, "[redacted-email]");
  // basic phone numbers (10-15 digits rough)
  text = text.replace(/\+?\d[\d\-\s().]{7,}\d/g, "[redacted-phone]");
  return text;
}

export function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export async function copyToClipboard(text) {
  if (!navigator.clipboard) {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return;
  }
  await navigator.clipboard.writeText(text);
}
