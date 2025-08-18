const { Worker } = require("bullmq");

const worker = new Worker(
  "emailQueue",
  async (job) => {
    console.log("👷 Processing job:", job.name);
    console.log(job.data);

    // (do your actual work here, e.g., send email)
  },
  {
    connection: {
      host: "127.0.0.1",
      port: 6379
    }
  }
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});
