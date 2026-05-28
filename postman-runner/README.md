# Postman Collection Runner

React + Node app that runs Postman collections based on a natural-language scenario you type in.

## Scenarios

| Scenario | Keywords | API | Collection |
|----------|----------|-----|------------|
| **Users CRUD** | user, users, profile, account | [JSONPlaceholder Users](https://jsonplaceholder.typicode.com/users) | `server/collections/users-crud.postman_collection.json` |
| **Todos CRUD** | todo, todos, task, checklist | [JSONPlaceholder Todos](https://jsonplaceholder.typicode.com/todos) | `server/collections/todos-crud.postman_collection.json` |
| **Posts Workflow** | post, posts, blog, article | [JSONPlaceholder Posts](https://jsonplaceholder.typicode.com/posts) | `server/collections/posts-workflow.postman_collection.json` |

Example inputs: `run user crud`, `todo checklist api`, `blog posts workflow`.

## Quick start

```bash
cd postman-runner
npm run install:all
npm run dev
```

- **UI:** http://localhost:5173  
- **API:** http://localhost:3001  

## API

- `GET /api/scenarios` — list available scenarios  
- `POST /api/run` — body: `{ "scenario": "your text here" }`  

## Production

```bash
npm run build
npm start
```

Serves the built React app from the Node server on port 3001.

## Import collections into Postman

Open any file under `server/collections/` in Postman (Import → file) to edit or run manually.
