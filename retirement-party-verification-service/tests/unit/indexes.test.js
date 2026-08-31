import { jest } from "@jest/globals";
import { setDb } from "../../src/config/database.js";
import { ensureIndexes } from "../../src/repositories/checkin.repository.js";

describe("MongoDB startup index initialization", () => {
  afterEach(() => {
    setDb(null);
  });

  it("does not crash when an existing index has the same name already in MongoDB", async () => {
    const createIndex = jest.fn(async (spec, options) => {
      if (options?.name === "idx_guests_confirmationNumber_unique") {
        const error = new Error("An existing index has the same name as the requested index.");
        error.code = 86;
        error.codeName = "IndexKeySpecsConflict";
        throw error;
      }

      return `created:${options?.name ?? JSON.stringify(spec)}`;
    });

    const collectionFactories = {
      checkins: { createIndex },
      guests: { createIndex },
    };

    setDb({
      collection: jest.fn((name) => collectionFactories[name]),
    });

    await expect(ensureIndexes()).resolves.toBeUndefined();
    expect(createIndex).toHaveBeenCalled();
  });
});
