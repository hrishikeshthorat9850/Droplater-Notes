// test/integration/worker.integration.test.js
import request from "supertest";
import app from "../../api/index.js";
import queue from "../../api/queue.js";
import { vi, describe, it, expect, beforeAll, afterAll } from "vitest";
import { startWorker } from "../../worker/worker.js";

// --------------------
// Mock axios at module level
// --------------------
vi.mock("axios", () => ({
  default: { post: vi.fn().mockResolvedValue({ status: 200 }) },
}));

import axios from "axios";

describe("Integration → create note + worker calls sink", () => {
  let worker;

  beforeAll(async () => {
    // Start the worker AFTER mocking axios
    worker = await startWorker();
  });

  afterAll(async () => {
    // Close worker and queue
    await worker.close();
    await queue.close();
  });

  it("should add to queue and trigger axios.post twice (webhook + fallback sink)", async () => {
    // 1️⃣ Create a note with a webhook that will "fail" (simulate fallback)
    const notePayload = {
      title: "Integration Test Note",
      body: "Lorem ipsum",
      releaseAt: new Date().toISOString(),
      webhookUrl: "http://localhost:4000/fake-webhook", // simulate failure
    };

    // 2️⃣ Mock first call to fail to trigger fallback
    axios.post.mockImplementationOnce(() => Promise.reject(new Error("Webhook failed")));

    await request(app)
      .post("/api/notes")
      .send(notePayload)
      .expect(200);

    // 3️⃣ Wait until all jobs are processed
    while ((await queue.getActiveCount()) > 0 || (await queue.getWaitingCount()) > 0) {
      await new Promise((r) => setTimeout(r, 50));
    }

    // 4️⃣ Assert axios.post called twice: webhook + fallback
    expect(axios.post).toHaveBeenCalledTimes(2);

    // Optionally check arguments
    expect(axios.post.mock.calls[0][0]).toBe(notePayload.webhookUrl); // first call = webhook
    expect(axios.post.mock.calls[1][0]).toBe("http://localhost:4000/sink"); // second call = fallback sink
  });
});
