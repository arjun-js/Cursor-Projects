import express from "express";
import cors from "cors";
import newman from "newman";
import path from "path";
import { fileURLToPath } from "url";
import { matchScenario, scenarios } from "./scenarios.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/scenarios", (_req, res) => {
  res.json(
    scenarios.map(({ id, name, description, examples }) => ({
      id,
      name,
      description,
      examples,
    }))
  );
});

app.post("/api/run", async (req, res) => {
  const { scenario: scenarioText } = req.body ?? {};

  if (!scenarioText || typeof scenarioText !== "string") {
    return res.status(400).json({
      success: false,
      error: "Please enter a scenario description in the text box.",
    });
  }

  const matched = matchScenario(scenarioText);

  if (!matched) {
    return res.status(404).json({
      success: false,
      error: `No collection matched "${scenarioText}". Try keywords like user, todo, or post.`,
      availableScenarios: scenarios.map((s) => ({
        id: s.id,
        name: s.name,
        examples: s.examples,
      })),
    });
  }

  try {
    const result = await runCollection(matched.collection);
    res.json({
      success: result.failures.length === 0,
      matchedScenario: {
        id: matched.id,
        name: matched.name,
        description: matched.description,
      },
      input: scenarioText,
      summary: result.summary,
      executions: result.executions,
      failures: result.failures,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || "Failed to run collection",
      matchedScenario: { id: matched.id, name: matched.name },
    });
  }
});

function runCollection(collectionPath) {
  return new Promise((resolve, reject) => {
    const executions = [];
    const failures = [];

    newman.run(
      {
        collection: collectionPath,
        reporters: [],
        timeoutRequest: 15000,
        bail: false,
      },
      (err, summary) => {
        if (err) {
          reject(err);
          return;
        }

        summary.run.executions.forEach((exec) => {
          const itemName = exec.item?.name ?? "Unknown request";
          const response = exec.response;
          const assertions = exec.assertions ?? [];

          const failedAssertions = assertions
            .filter((a) => a.error)
            .map((a) => a.error?.message ?? "Assertion failed");

          if (failedAssertions.length > 0) {
            failures.push({ request: itemName, errors: failedAssertions });
          }

          executions.push({
            request: itemName,
            method: exec.request?.method,
            url: exec.request?.url?.toString(),
            status: response?.code,
            statusText: response?.status,
            timeMs: response?.responseTime,
            passed: failedAssertions.length === 0,
            assertionCount: assertions.length,
            failedAssertions,
          });
        });

        resolve({
          summary: {
            totalRequests: summary.run.stats.requests.total,
            failedRequests: summary.run.stats.requests.failed,
            totalAssertions: summary.run.stats.assertions.total,
            failedAssertions: summary.run.stats.assertions.failed,
            totalTimeMs: summary.run.timings.completed - summary.run.timings.started,
          },
          executions,
          failures,
        });
      }
    );
  });
}

const clientDist = path.join(__dirname, "../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(clientDist, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`Postman runner API listening on http://localhost:${PORT}`);
});
