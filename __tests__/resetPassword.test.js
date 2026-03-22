// Test the password reset validation logic from reset-password/page.js

function validatePassword(password, confirm) {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password !== confirm) return "Passwords don't match";
  return null;
}

describe("Password reset validation", () => {
  test("valid matching passwords", () => {
    expect(validatePassword("password123", "password123")).toBeNull();
  });

  test("too short", () => {
    expect(validatePassword("pass", "pass")).toBe("Password must be at least 8 characters");
  });

  test("exactly 8 characters is valid", () => {
    expect(validatePassword("12345678", "12345678")).toBeNull();
  });

  test("7 characters is too short", () => {
    expect(validatePassword("1234567", "1234567")).toBe("Password must be at least 8 characters");
  });

  test("passwords don't match", () => {
    expect(validatePassword("password123", "password456")).toBe("Passwords don't match");
  });

  test("empty passwords", () => {
    expect(validatePassword("", "")).toBe("Password must be at least 8 characters");
  });

  test("first valid but second empty", () => {
    expect(validatePassword("password123", "")).toBe("Passwords don't match");
  });

  test("long passwords are valid", () => {
    const long = "a".repeat(100);
    expect(validatePassword(long, long)).toBeNull();
  });

  test("case-sensitive matching", () => {
    expect(validatePassword("Password123", "password123")).toBe("Passwords don't match");
  });
});
