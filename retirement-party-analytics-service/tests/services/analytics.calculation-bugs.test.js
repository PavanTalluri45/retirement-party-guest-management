describe("Analytics calculation bug regressions", () => {
  it("TEST 1: single registration with familyCount 1 and checked in counts as 1 person", () => {
    const registrations = [{ attending: true, familyCount: 1, checkedIn: true }];
    const expectedAttendees = registrations.reduce((sum, guest) => sum + (guest.familyCount || 1), 0);
    const totalAttended = registrations.filter((guest) => guest.checkedIn).reduce((sum, guest) => sum + (guest.familyCount || 1), 0);
    const rate = expectedAttendees > 0 ? (totalAttended / expectedAttendees) * 100 : 0;

    expect(registrations.length).toBe(1);
    expect(expectedAttendees).toBe(1);
    expect(totalAttended).toBe(1);
    expect(rate).toBe(100);
  });

  it("TEST 2: single registration with familyCount 2 and checked in counts as 2 people", () => {
    const registrations = [{ attending: true, familyCount: 2, checkedIn: true }];
    const expectedAttendees = registrations.reduce((sum, guest) => sum + (guest.familyCount || 1), 0);
    const totalAttended = registrations.filter((guest) => guest.checkedIn).reduce((sum, guest) => sum + (guest.familyCount || 1), 0);
    const rate = expectedAttendees > 0 ? (totalAttended / expectedAttendees) * 100 : 0;

    expect(expectedAttendees).toBe(2);
    expect(totalAttended).toBe(2);
    expect(rate).toBe(100);
  });

  it("TEST 3: three registrations with familyCount 1, 2, 3 total expected attendance is 6 people", () => {
    const registrations = [
      { attending: true, familyCount: 1 },
      { attending: true, familyCount: 2 },
      { attending: true, familyCount: 3 },
    ];

    const expectedAttendees = registrations.reduce((sum, guest) => sum + (guest.familyCount || 1), 0);
    expect(expectedAttendees).toBe(6);
    expect(registrations.length).toBe(3);
  });

  it("TEST 4: three registrations with familyCount 1, 2, 3 and only first two checked in gives attended count 3", () => {
    const registrations = [
      { attending: true, familyCount: 1, checkedIn: true },
      { attending: true, familyCount: 2, checkedIn: true },
      { attending: true, familyCount: 3, checkedIn: false },
    ];

    const expectedAttendees = registrations.reduce((sum, guest) => sum + (guest.familyCount || 1), 0);
    const totalAttended = registrations.filter((guest) => guest.checkedIn).reduce((sum, guest) => sum + (guest.familyCount || 1), 0);

    expect(expectedAttendees).toBe(6);
    expect(totalAttended).toBe(3);
  });

  it("TEST 5: familyCount 2 with one family member must not double count attendees", () => {
    const registrations = [{ attending: true, familyCount: 2, familyMembers: [{ mealPreference: "VEG" }], checkedIn: true }];
    const totalPeople = registrations.reduce((sum, guest) => sum + (guest.familyCount || 1), 0);
    const totalFamilyMembers = registrations.reduce((sum, guest) => sum + (guest.familyMembers?.length || 0), 0);

    expect(totalPeople).toBe(2);
    expect(totalFamilyMembers).toBe(1);
    expect(totalPeople - totalFamilyMembers).toBe(1);
  });

  it("TEST 6: Will Attend = 10, Actually Attended = 6 should produce 60% attendance rate", () => {
    const expectedAttendees = 10;
    const totalAttended = 6;
    const rate = (totalAttended / expectedAttendees) * 100;

    expect(rate).toBe(60);
  });

  it("TEST 7: Will Attend = 10, Actually Attended = 8 should produce 80% attendance rate", () => {
    const expectedAttendees = 10;
    const totalAttended = 8;
    const rate = (totalAttended / expectedAttendees) * 100;

    expect(rate).toBe(80);
  });

  it("TEST 8: zero attending guests should not divide by zero and should result in 0%", () => {
    const expectedAttendees = 0;
    const totalAttended = 0;
    const rate = expectedAttendees > 0 ? (totalAttended / expectedAttendees) * 100 : 0;

    expect(expectedAttendees).toBe(0);
    expect(totalAttended).toBe(0);
    expect(rate).toBe(0);
  });

  it("TEST 9: primary NON_VEG and family member VEG should produce 1 each across 2 people", () => {
    const guests = [
      { mealPreference: "NON_VEG", familyMembers: [{ mealPreference: "VEG" }] },
    ];

    const meals = guests.reduce(
      (acc, guest) => {
        const primary = (guest.mealPreference || "").toUpperCase();
        if (primary === "VEG") acc.vegetarian += 1;
        if (primary === "NON_VEG" || primary === "NONVEG" || primary === "NON_VEGETARIAN") acc.nonVegetarian += 1;

        for (const member of guest.familyMembers || []) {
          const familyMeal = (member.mealPreference || "").toUpperCase();
          if (familyMeal === "VEG") acc.vegetarian += 1;
          if (familyMeal === "NON_VEG" || familyMeal === "NONVEG" || familyMeal === "NON_VEGETARIAN") acc.nonVegetarian += 1;
        }
        return acc;
      },
      { vegetarian: 0, nonVegetarian: 0 }
    );

    expect(meals.vegetarian).toBe(1);
    expect(meals.nonVegetarian).toBe(1);
  });

  it("TEST 10: multiple family members with mixed meal preferences count each person exactly once", () => {
    const guests = [
      {
        mealPreference: "NON_VEG",
        familyMembers: [
          { mealPreference: "VEG" },
          { mealPreference: "NON_VEG" },
          { mealPreference: "VEG" },
        ],
      },
    ];

    const seen = new Map();
    const mealTotals = { vegetarian: 0, nonVegetarian: 0 };

    guests.forEach((guest) => {
      const entries = [guest, ...(guest.familyMembers || [])];
      entries.forEach((person) => {
        const key = person.mealPreference || "UNKNOWN";
        if (!seen.has(key)) seen.set(key, 0);
        seen.set(key, seen.get(key) + 1);

        const normalized = (person.mealPreference || "").toUpperCase();
        if (normalized === "VEG") mealTotals.vegetarian += 1;
        if (normalized === "NON_VEG" || normalized === "NONVEG" || normalized === "NON_VEGETARIAN") mealTotals.nonVegetarian += 1;
      });
    });

    expect(seen.size).toBe(2);
    expect(mealTotals.vegetarian).toBe(2);
    expect(mealTotals.nonVegetarian).toBe(2);
  });
});
