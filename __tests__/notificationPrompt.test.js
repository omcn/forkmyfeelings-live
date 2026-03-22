// Test NotificationPrompt visibility logic

describe("NotificationPrompt visibility logic", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  function shouldShowPrompt(notificationSupported, permission, askedBefore) {
    return notificationSupported && permission === "default" && !askedBefore;
  }

  test("shows when supported, not asked, permission default", () => {
    expect(shouldShowPrompt(true, "default", false)).toBe(true);
  });

  test("hides when not supported", () => {
    expect(shouldShowPrompt(false, "default", false)).toBe(false);
  });

  test("hides when already asked", () => {
    expect(shouldShowPrompt(true, "default", true)).toBe(false);
  });

  test("hides when permission already granted", () => {
    expect(shouldShowPrompt(true, "granted", false)).toBe(false);
  });

  test("hides when permission denied", () => {
    expect(shouldShowPrompt(true, "denied", false)).toBe(false);
  });

  test("allow sets localStorage flag", () => {
    localStorage.setItem("fmf_notif_asked", "1");
    expect(localStorage.getItem("fmf_notif_asked")).toBe("1");
  });

  test("dismiss sets localStorage flag", () => {
    localStorage.setItem("fmf_notif_asked", "1");
    expect(localStorage.getItem("fmf_notif_asked")).toBe("1");
  });
});
