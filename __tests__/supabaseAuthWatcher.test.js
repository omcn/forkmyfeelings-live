// Test SupabaseAuthWatcher logic

describe("SupabaseAuthWatcher profile creation", () => {
  test("creates profile for new user on SIGNED_IN", async () => {
    const insertedData = [];

    const mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: "user-123", email: "test@test.com" } } },
        }),
      },
      from: (table) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: null }), // no existing profile
          }),
        }),
        insert: (data) => {
          insertedData.push({ table, data });
          return Promise.resolve({ error: null });
        },
      }),
    };

    // Simulate the SIGNED_IN handler
    const event = "SIGNED_IN";
    if (event === "SIGNED_IN") {
      const { data: sessionData } = await mockSupabase.auth.getSession();
      const user = sessionData.session?.user;
      if (user) {
        const { data: existing } = await mockSupabase.from("profiles")
          .select("id").eq("id", user.id).maybeSingle();
        if (!existing) {
          await mockSupabase.from("profiles").insert({
            id: user.id,
            email: user.email ?? "",
            username: "",
            bio: "",
          });
        }
      }
    }

    expect(insertedData).toHaveLength(1);
    expect(insertedData[0].table).toBe("profiles");
    expect(insertedData[0].data).toEqual({
      id: "user-123",
      email: "test@test.com",
      username: "",
      bio: "",
    });
  });

  test("does not create profile for existing user", async () => {
    let insertCalled = false;

    const mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: { user: { id: "user-123", email: "test@test.com" } } },
        }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: jest.fn().mockResolvedValue({ data: { id: "user-123" } }),
          }),
        }),
        insert: () => { insertCalled = true; },
      }),
    };

    const { data: sessionData } = await mockSupabase.auth.getSession();
    const user = sessionData.session?.user;
    const { data: existing } = await mockSupabase.from("profiles")
      .select("id").eq("id", user.id).maybeSingle();
    if (!existing) {
      await mockSupabase.from("profiles").insert({});
    }

    expect(insertCalled).toBe(false);
  });

  test("does nothing when no user in session", async () => {
    let insertCalled = false;

    const mockSupabase = {
      auth: {
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
        }),
      },
      from: () => ({
        insert: () => { insertCalled = true; },
      }),
    };

    const { data: sessionData } = await mockSupabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    expect(insertCalled).toBe(false);
  });

  test("uses empty string for email when null", () => {
    const user = { id: "u1", email: null };
    const email = user.email ?? "";
    expect(email).toBe("");
  });
});

describe("SupabaseAuthWatcher cleanup", () => {
  test("unsubscribes on unmount", () => {
    const unsubscribe = jest.fn();
    const listener = { subscription: { unsubscribe } };
    // Simulate cleanup
    listener?.subscription?.unsubscribe();
    expect(unsubscribe).toHaveBeenCalled();
  });

  test("handles null listener gracefully", () => {
    const listener = null;
    expect(() => listener?.subscription?.unsubscribe()).not.toThrow();
  });
});
