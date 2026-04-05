// All data is stored in localStorage under namespaced keys.
// Users: { [username]: { passwordHash, created } }
// Teams: { [username]: Team[] }

function hash(str) {
  // Simple deterministic hash — good enough for local storage demo
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h.toString(36);
}

export function getUsers() {
  try { return JSON.parse(localStorage.getItem("pt_users") || "{}"); }
  catch { return {}; }
}

export function saveUsers(u) {
  localStorage.setItem("pt_users", JSON.stringify(u));
}

export function getTeams(uid) {
  try { return JSON.parse(localStorage.getItem(`pt_teams_${uid}`) || "[]"); }
  catch { return []; }
}

export function saveTeams(uid, teams) {
  localStorage.setItem(`pt_teams_${uid}`, JSON.stringify(teams));
}

export function hashPassword(pw) {
  return hash(pw + "poketeams_salt");
}

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem("pt_session") || "null"); }
  catch { return null; }
}

export function saveSession(user) {
  sessionStorage.setItem("pt_session", JSON.stringify(user));
}

export function clearSession() {
  sessionStorage.removeItem("pt_session");
}
