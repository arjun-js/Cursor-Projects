import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const collectionsDir = path.join(__dirname, "collections");

export const scenarios = [
  {
    id: "users-crud",
    name: "Users CRUD",
    description: "List, read, create, update, and delete users via JSONPlaceholder",
    keywords: ["user", "users", "profile", "account", "member"],
    collection: path.join(collectionsDir, "users-crud.postman_collection.json"),
    examples: ["run user crud", "test users api", "user profile workflow"],
  },
  {
    id: "todos-crud",
    name: "Todos CRUD",
    description: "Full CRUD workflow on todos using JSONPlaceholder",
    keywords: ["todo", "todos", "task", "tasks", "checklist", "item"],
    collection: path.join(collectionsDir, "todos-crud.postman_collection.json"),
    examples: ["todo crud tests", "run tasks api", "checklist scenario"],
  },
  {
    id: "posts-workflow",
    name: "Posts Workflow",
    description: "Read, filter, create, and patch blog posts via JSONPlaceholder",
    keywords: ["post", "posts", "blog", "article", "content", "publish"],
    collection: path.join(collectionsDir, "posts-workflow.postman_collection.json"),
    examples: ["posts workflow", "blog api smoke test", "publish article flow"],
  },
];

export function matchScenario(input) {
  const text = input.trim().toLowerCase();
  if (!text) return null;

  let best = null;
  let bestScore = 0;

  for (const scenario of scenarios) {
    let score = 0;
    if (text.includes(scenario.id.replace(/-/g, " "))) score += 10;
    if (text.includes(scenario.id)) score += 10;

    for (const keyword of scenario.keywords) {
      if (text.includes(keyword)) score += 3;
    }

    for (const word of text.split(/\s+/)) {
      if (scenario.keywords.some((k) => k === word || k.startsWith(word))) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = scenario;
    }
  }

  return bestScore > 0 ? best : null;
}
