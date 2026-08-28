import { jest } from "@jest/globals";
import { generateUniqueConfirmationNumber } from "../../src/utils/confirmation-number.js";

describe("generateUniqueConfirmationNumber", () => {
  it("returns a 4-digit string with leading zeros preserved", async () => {
    const mockRepo = { existsByConfirmationNumber: jest.fn().mockResolvedValue(false) };
    const code = await generateUniqueConfirmationNumber(mockRepo);

    expect(code).toMatch(/^[0-9]{4}$/);
    expect(code.length).toBe(4);
  });

  it("retries when there is a collision and returns a unique code", async () => {
    let callCount = 0;
    const mockRepo = {
      existsByConfirmationNumber: jest.fn().mockImplementation(() => {
        callCount++;
        // Fail first 3 attempts, succeed on 4th
        return Promise.resolve(callCount < 4);
      }),
    };

    const code = await generateUniqueConfirmationNumber(mockRepo);
    expect(code).toMatch(/^[0-9]{4}$/);
    expect(mockRepo.existsByConfirmationNumber).toHaveBeenCalledTimes(4);
  });

  it("throws after MAX_RETRIES consecutive collisions", async () => {
    const mockRepo = {
      existsByConfirmationNumber: jest.fn().mockResolvedValue(true), // Always exists
    };

    await expect(generateUniqueConfirmationNumber(mockRepo)).rejects.toThrow(
      /Failed to generate a unique confirmation number/
    );
    expect(mockRepo.existsByConfirmationNumber).toHaveBeenCalledTimes(10);
  });

  it("generates a code that always pads to 4 digits (statistical)", async () => {
    const mockRepo = { existsByConfirmationNumber: jest.fn().mockResolvedValue(false) };

    // Run multiple times to verify format consistency
    for (let i = 0; i < 20; i++) {
      const code = await generateUniqueConfirmationNumber(mockRepo);
      expect(code).toMatch(/^[0-9]{4}$/);
      expect(code.length).toBe(4);
    }
  });
});

