import { jest } from "@jest/globals";
import { VerificationService } from "../../src/services/verification.service.js";


describe("Single-Flight Request Coalescing (Cache Stampede Protection)", () => {
  let verificationService;

  beforeEach(() => {
    verificationService = new VerificationService();
  });

  it("should coalesce 100 concurrent requests for the same key into a single underlying loader execution", async () => {
    let loaderCallCount = 0;
    const testKey = "verification:v1:guest:confirmation:0142";
    const expectedGuest = {
      id: "guest-123",
      name: "Pavan Kumar",
      confirmationNumber: "0142",
      phone: "9876543210",
    };

    const loaderFn = jest.fn(async () => {
      loaderCallCount++;
      // Simulate slight async network delay
      await new Promise((resolve) => setTimeout(resolve, 25));
      return expectedGuest;
    });

    // Launch 100 concurrent requests
    const promises = Array.from({ length: 100 }, () =>
      verificationService._loadWithSingleFlight(testKey, loaderFn)
    );

    const results = await Promise.all(promises);

    // Assert: Underlying loader was invoked exactly ONCE
    expect(loaderCallCount).toBe(1);
    expect(loaderFn).toHaveBeenCalledTimes(1);

    // Assert: All 100 callers received the identical valid guest data
    expect(results.length).toBe(100);
    results.forEach((res) => {
      expect(res).toEqual(expectedGuest);
    });

    // Assert: Map is cleaned up after execution (O(K) memory safety)
    expect(verificationService.inFlightRequests.size).toBe(0);
    expect(verificationService.inFlightRequests.has(testKey)).toBe(false);
  });

  it("should cleanly propagate errors to all awaiting callers and clean the map on rejection", async () => {
    let loaderCallCount = 0;
    const testKey = "verification:v1:guest:confirmation:9999";
    const simulatedError = new Error("Downstream service unreachable");

    const failingLoader = jest.fn(async () => {
      loaderCallCount++;
      await new Promise((resolve) => setTimeout(resolve, 20));
      throw simulatedError;
    });

    const promises = Array.from({ length: 50 }, () =>
      verificationService._loadWithSingleFlight(testKey, failingLoader)
    );

    const settled = await Promise.allSettled(promises);

    expect(loaderCallCount).toBe(1);
    expect(settled.length).toBe(50);
    settled.forEach((result) => {
      expect(result.status).toBe("rejected");
      expect(result.reason.message).toBe("Downstream service unreachable");
    });

    // Map must be cleaned even after error
    expect(verificationService.inFlightRequests.size).toBe(0);

    // Subsequent request must be able to retry
    const retryLoader = jest.fn(async () => ({ success: true }));
    const retryResult = await verificationService._loadWithSingleFlight(testKey, retryLoader);
    expect(retryResult).toEqual({ success: true });
    expect(retryLoader).toHaveBeenCalledTimes(1);
  });

  it("should process different cache keys concurrently without blocking each other", async () => {
    const keyA = "verification:v1:guest:confirmation:0001";
    const keyB = "verification:v1:guest:confirmation:0002";

    const loaderA = jest.fn(async () => ({ id: "A" }));
    const loaderB = jest.fn(async () => ({ id: "B" }));

    const [resA, resB] = await Promise.all([
      verificationService._loadWithSingleFlight(keyA, loaderA),
      verificationService._loadWithSingleFlight(keyB, loaderB),
    ]);

    expect(resA).toEqual({ id: "A" });
    expect(resB).toEqual({ id: "B" });
    expect(loaderA).toHaveBeenCalledTimes(1);
    expect(loaderB).toHaveBeenCalledTimes(1);
  });
});
