const request = require("supertest");
const axios = require("axios");
const app = require("../../api/index");            // Export your Express instance from index.js
const myQueue = require("../../api/queue");
const { vi, describe, it, expect, beforeAll, afterAll } = require("vitest");

describe("Integration → create note + worker calls sink", () => {
  let axiosSpy;

  beforeAll(async () => {
    // Spy on axios.post
    axiosSpy = vi.spyOn(axios, "post").mockResolvedValue({ status: 200 });
    await myQueue.obliterate({ force: true }); // clear queue
  });

  afterAll(async () => {
    axiosSpy.mockRestore();
    await myQueue.close();
  });

  it("should add to queue and trigger sink once", async () => {
    // 🔹 create a note with a past releaseAt so the worker triggers immediately
    const pastDate = new Date(Date.now() - 1000).toISOString();

    await request(app)
      .post("/api/notes")
      .send({
        title: "Integration Test Note",
        body: "This is a test",
        webhookUrl: "http://localhost:4000/sink",
        releaseAt: pastDate,
      })
      .expect(200);

    // ⏳ wait a bit for worker to run
    await new Promise((res) => setTimeout(res, 1500));

    expect(axiosSpy).toHaveBeenCalledTimes(1);
  });
});
