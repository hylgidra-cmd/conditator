export type ParsedDevice = {
  browser: string;
  os: string;
  isMobile: boolean;
  label: string;
};

/**
 * User-Agent satridan brauzer va operatsion tizimni xavfsiz ajratib oladi.
 */
export function parseUserAgent(ua: string | null | undefined): ParsedDevice {
  if (!ua || !ua.trim()) {
    return {
      browser: "Web Browser",
      os: "Desktop / Mobile",
      isMobile: false,
      label: "Web Browser",
    };
  }

  const s = ua.slice(0, 300);
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(s);

  let browser = "Browser";
  if (/Edg\//i.test(s)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera/i.test(s)) browser = "Opera";
  else if (/YaBrowser\//i.test(s)) browser = "Yandex Browser";
  else if (/Chrome\//i.test(s) && !/Chromium/i.test(s)) browser = "Google Chrome";
  else if (/Firefox\//i.test(s)) browser = "Mozilla Firefox";
  else if (/Safari\//i.test(s) && !/Chrome/i.test(s)) browser = "Safari";

  let os = "Device";
  if (/iPhone/i.test(s)) os = "iPhone (iOS)";
  else if (/iPad/i.test(s)) os = "iPadOS";
  else if (/Android/i.test(s)) os = "Android";
  else if (/Windows NT/i.test(s)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(s)) os = "macOS";
  else if (/Linux/i.test(s)) os = "Linux";

  return {
    browser,
    os,
    isMobile,
    label: `${browser} · ${os}`,
  };
}
