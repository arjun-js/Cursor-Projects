export const upsHosts = [
  {
    id: "ups-1",
    name: "UPS 1",
    baseUrl: "http://192.173.62.45",
    // Adjust these per your UPS web UI:
    login: {
      path: "/login",
      method: "POST",
      usernameField: "username",
      passwordField: "password",
      extraFields: {},
    },
    status: {
      path: "/status",
      method: "GET",
    },
  },
  {
    id: "ups-2",
    name: "UPS 2",
    baseUrl: "http://192.173.98.46",
    login: {
      path: "/login",
      method: "POST",
      usernameField: "username",
      passwordField: "password",
      extraFields: {},
    },
    status: { path: "/status", method: "GET" },
  },
  { id: "ups-3", name: "UPS 3", baseUrl: "http://192.173.0.3", login: { path: "/login", method: "POST", usernameField: "username", passwordField: "password", extraFields: {} }, status: { path: "/status", method: "GET" } },
  { id: "ups-4", name: "UPS 4", baseUrl: "http://192.173.0.4", login: { path: "/login", method: "POST", usernameField: "username", passwordField: "password", extraFields: {} }, status: { path: "/status", method: "GET" } },
  { id: "ups-5", name: "UPS 5", baseUrl: "http://192.173.0.5", login: { path: "/login", method: "POST", usernameField: "username", passwordField: "password", extraFields: {} }, status: { path: "/status", method: "GET" } },
];

