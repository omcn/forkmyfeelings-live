// Test the username validation logic from UsernamePrompt.js

function validateUsername(username) {
  const trimmed = username.trim();
  if (!trimmed) return "Please enter a username";
  if (trimmed.length < 3) return "Must be at least 3 characters";
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return "Letters, numbers and underscores only";
  return null; // valid
}

describe("Username validation", () => {
  test("rejects empty string", () => {
    expect(validateUsername("")).toBe("Please enter a username");
  });

  test("rejects whitespace-only string", () => {
    expect(validateUsername("   ")).toBe("Please enter a username");
  });

  test("rejects 1 character", () => {
    expect(validateUsername("a")).toBe("Must be at least 3 characters");
  });

  test("rejects 2 characters", () => {
    expect(validateUsername("ab")).toBe("Must be at least 3 characters");
  });

  test("accepts 3 characters", () => {
    expect(validateUsername("abc")).toBeNull();
  });

  test("accepts long username", () => {
    expect(validateUsername("this_is_a_valid_username_123")).toBeNull();
  });

  test("rejects spaces in username", () => {
    expect(validateUsername("hello world")).toBe("Letters, numbers and underscores only");
  });

  test("rejects special characters", () => {
    expect(validateUsername("user@name")).toBe("Letters, numbers and underscores only");
    expect(validateUsername("user!name")).toBe("Letters, numbers and underscores only");
    expect(validateUsername("user.name")).toBe("Letters, numbers and underscores only");
    expect(validateUsername("user-name")).toBe("Letters, numbers and underscores only");
  });

  test("accepts underscores", () => {
    expect(validateUsername("hello_world")).toBeNull();
    expect(validateUsername("___")).toBeNull();
  });

  test("accepts numbers", () => {
    expect(validateUsername("user123")).toBeNull();
    expect(validateUsername("123")).toBeNull();
  });

  test("accepts mixed case", () => {
    expect(validateUsername("HelloWorld")).toBeNull();
    expect(validateUsername("ALLCAPS")).toBeNull();
  });

  test("trims leading/trailing whitespace before validation", () => {
    expect(validateUsername("  abc  ")).toBeNull();
    expect(validateUsername("  ab  ")).toBe("Must be at least 3 characters");
  });

  test("rejects emoji", () => {
    expect(validateUsername("user🍕")).toBe("Letters, numbers and underscores only");
  });

  test("rejects unicode characters", () => {
    expect(validateUsername("café")).toBe("Letters, numbers and underscores only");
    expect(validateUsername("用户名")).toBe("Letters, numbers and underscores only");
  });
});
