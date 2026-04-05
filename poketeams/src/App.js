import { useState, useEffect } from "react";
import { getUsers, saveUsers, getTeams, saveTeams, hashPassword, getSession, saveSession, clearSession } from "./storage";
import { parsePaste, detectFormat, spriteUrl, spriteUrlFallback, itemSpriteUrl, TYPE_COLORS } from "./parser";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Space+Grotesk:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { background: #0a0a0f; color: #fff; font-family: 'Space Grotesk', sans-serif; }
  textarea, input, select { font-family: inherit; }
  textarea:focus, input:focus, select:focus { outline: none; border-color: rgba(230,57,70,0.6) !important; }
  button { cursor: pointer; font-family: inherit; }
  button:hover { opacity: 0.85; }
  ::-webkit-scrollbar { width: 6px; background: #0a0a0f; }
  ::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 3px; }
  @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
  @keyframes fadeIn  { from { opacity:0; transform:translateY(8px);  } to { opacity:1; transform:translateY(0); } }
`;

const S = {
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
    padding: "12px 14px", color: "#fff",
    fontFamily: "'Space Mono', monospace", fontSize: 13,
    transition: "border-color 0.2s",
  },
  primaryBtn: {
    background: "linear-gradient(135deg, #e63946, #c1121f)",
    color: "#fff", border: "none", borderRadius: 10,
    padding: "12px 28px", fontFamily: "'Bebas Neue', cursive",
    fontSize: 18, letterSpacing: "0.1em", transition: "opacity 0.15s",
  },
  ghostBtn: {
    background: "transparent", color: "#aaa",
    border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
    padding: "12px 24px", fontFamily: "'Space Mono', monospace",
    fontSize: 12, letterSpacing: "0.05em", transition: "all 0.15s",
  },
};

const DEFAULT_FOLDERS = ["Gen 9 OU", "Gen 8 OU", "Gen 7 OU", "ADV OU", "DPP OU", "VGC", "Ubers", "Other"];

function TypeBadge({ type }) {
  return (
    <span style={{
      background: TYPE_COLORS[type] || "#888", color: "#fff",
      fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
      letterSpacing: "0.06em", textTransform: "uppercase",
      fontFamily: "'Space Mono', monospace",
    }}>{type}</span>
  );
}

function ItemSprite({ item }) {
  const [err, setErr] = useState(false);
  if (!item) return null;
  if (err) return <span style={{ fontSize: 11, color: "#999", fontFamily: "'Space Mono',monospace" }}>🎒 {item}</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      <img src={itemSpriteUrl(item)} alt={item}
        style={{ width: 24, height: 24, imageRendering: "pixelated" }}
        onError={() => setErr(true)} />
      <span style={{ fontSize: 11, color: "#bbb", fontFamily: "'Space Mono', monospace" }}>{item}</span>
    </span>
  );
}

function PokemonSprite({ name, size = 80 }) {
  const [stage, setStage] = useState(0);
  const src = stage === 0 ? spriteUrl(name) : stage === 1 ? spriteUrlFallback(name) : null;
  if (stage === 2) {
    return (
      <div style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.35 }}>?</div>
    );
  }
  return (
    <img src={src} alt={name}
      style={{ width: size, height: size, imageRendering: "pixelated", objectFit: "contain" }}
      onError={() => setStage(s => s + 1)} />
  );
}

function PokemonCard({ mon }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)",
      borderRadius: 12, padding: "14px 16px", display: "flex", gap: 14,
      alignItems: "flex-start", transition: "background 0.15s",
    }}
    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
    onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
    >
      <div style={{ flexShrink: 0, width: 80, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <PokemonSprite name={mon.name} size={80} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 18, letterSpacing: "0.05em" }}>
            {mon.nickname && mon.nickname !== mon.name ? `${mon.nickname} ` : ""}{mon.name}
          </span>
          {mon.gender && <span style={{ fontSize: 13, color: mon.gender === "M" ? "#7ec8e3" : "#ffb3c1" }}>{mon.gender === "M" ? "♂" : "♀"}</span>}
          {mon.tera && <TypeBadge type={mon.tera} />}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 6, alignItems: "center" }}>
          {mon.item && <ItemSprite item={mon.item} />}
          {mon.ability && <span style={{ fontSize: 11, color: "#777", fontFamily: "'Space Mono',monospace" }}>⚡ {mon.ability}</span>}
          {mon.nature && <span style={{ fontSize: 11, color: "#777", fontFamily: "'Space Mono',monospace" }}>🌀 {mon.nature}</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 10px" }}>
          {mon.moves.map((m, i) => (
            <div key={i} style={{ fontSize: 12, color: "#ccc", fontFamily: "'Space Mono',monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              • {m}
            </div>
          ))}
        </div>
        {Object.keys(mon.evs).length > 0 && (
          <div style={{ marginTop: 5, fontSize: 10, color: "#555", fontFamily: "'Space Mono',monospace" }}>
            EVs: {Object.entries(mon.evs).map(([k, v]) => `${v} ${k}`).join(" / ")}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamCard({ team, onView, onDelete }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", background: open ? "rgba(255,255,255,0.04)" : "transparent" }}
        onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: "0.05em" }}>{team.name}</div>
          <div style={{ fontSize: 11, color: "#444", fontFamily: "'Space Mono',monospace", marginTop: 1 }}>
            {team.pokemon.length} Pokémon · {new Date(team.created).toLocaleDateString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 2 }}>
          {team.pokemon.slice(0, 6).map((p, i) => (
            <div key={i} style={{ width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PokemonSprite name={p.name} size={36} />
            </div>
          ))}
        </div>
        <span style={{ color: "#333", fontSize: 16, display: "inline-block", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </div>
      {open && (
        <div style={{ padding: "0 20px 20px", animation: "fadeIn 0.2s ease" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 10, marginBottom: 14 }}>
            {team.pokemon.map((p, i) => <PokemonCard key={i} mon={p} />)}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => onView(team)} style={{ ...S.ghostBtn, color: "#7ec8e3", borderColor: "#7ec8e344", padding: "8px 16px" }}>View Paste</button>
            <button onClick={() => onDelete(team.id)} style={{ ...S.ghostBtn, color: "#ff6b6b", borderColor: "#ff6b6b44", padding: "8px 16px" }}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderSection({ folder, teams, onView, onDelete }) {
  const [open, setOpen] = useState(true);
  if (teams.length === 0) return null;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer" }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 14, display: "inline-block", transition: "transform 0.2s", transform: open ? "rotate(90deg)" : "none", color: "#444" }}>▶</span>
        <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 26, letterSpacing: "0.08em", color: "#e63946" }}>{folder}</span>
        <span style={{ fontSize: 11, color: "#444", fontFamily: "'Space Mono',monospace" }}>{teams.length} team{teams.length !== 1 ? "s" : ""}</span>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
      </div>
      {open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingLeft: 8 }}>
          {teams.map(t => <TeamCard key={t.id} team={t} onView={onView} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  );
}

function Notif({ notif }) {
  if (!notif) return null;
  const colors = { success: ["#0a2a1a","#5cb85c44","#5cb85c"], error: ["#3a0a0a","#ff6b6b44","#ff6b6b"], info: ["#0a1a3a","#7ec8e344","#7ec8e3"] };
  const [bg, border, color] = colors[notif.type] || colors.success;
  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 1000, background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "12px 20px", fontFamily: "'Space Mono',monospace", fontSize: 12, color, boxShadow: "0 8px 30px rgba(0,0,0,0.4)", animation: "slideIn 0.3s ease" }}>{notif.msg}</div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [folders, setFolders] = useState(DEFAULT_FOLDERS);
  const [notif, setNotif] = useState(null);
  const [authName, setAuthName] = useState("");
  const [authPass, setAuthPass] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [pasteRaw, setPasteRaw] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamFolder, setTeamFolder] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [parsedMons, setParsedMons] = useState(null);
  const [pasteErr, setPasteErr] = useState("");
  const [pasteStep, setPasteStep] = useState(1);
  const [viewingTeam, setViewingTeam] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterFolder, setFilterFolder] = useState("All");

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);
    const session = getSession();
    if (session) {
      setUser(session);
      setTeams(getTeams(session.id));
      const sf = localStorage.getItem(`pt_folders_${session.id}`);
      if (sf) setFolders(JSON.parse(sf));
      setView("dashboard");
    }
    return () => document.head.removeChild(style);
  }, []);

  const notify = (msg, type = "success") => { setNotif({ msg, type }); setTimeout(() => setNotif(null), 3000); };

  const saveFolderList = (uid, f) => localStorage.setItem(`pt_folders_${uid}`, JSON.stringify(f));

  const handleAddFolder = () => {
    const n = newFolderName.trim();
    if (!n) return;
    if (folders.includes(n)) { notify("Folder already exists.", "error"); return; }
    const updated = [...folders, n];
    setFolders(updated);
    saveFolderList(user.id, updated);
    setNewFolderName("");
    notify(`Folder "${n}" created!`);
  };

  const handleLogin = () => {
    setAuthErr("");
    const users = getUsers();
    const u = users[authName.trim()];
    if (!u) { setAuthErr("No account found."); return; }
    if (u.passwordHash !== hashPassword(authPass)) { setAuthErr("Wrong password."); return; }
    const session = { id: authName.trim(), name: authName.trim() };
    setUser(session); saveSession(session);
    setTeams(getTeams(session.id));
    const sf = localStorage.getItem(`pt_folders_${session.id}`);
    if (sf) setFolders(JSON.parse(sf));
    setView("dashboard");
    setAuthName(""); setAuthPass("");
  };

  const handleRegister = () => {
    setAuthErr("");
    const n = authName.trim(), p = authPass.trim();
    if (!n || !p) { setAuthErr("Fill all fields."); return; }
    if (n.length < 3) { setAuthErr("Username must be 3+ chars."); return; }
    if (p.length < 6) { setAuthErr("Password must be 6+ chars."); return; }
    const users = getUsers();
    if (users[n]) { setAuthErr("Username taken."); return; }
    users[n] = { passwordHash: hashPassword(p), created: Date.now() };
    saveUsers(users);
    const session = { id: n, name: n };
    setUser(session); saveSession(session);
    setTeams([]); setView("dashboard");
    notify("Account created! Welcome to PokéTeams. 🎉");
    setAuthName(""); setAuthPass("");
  };

  const handleLogout = () => { clearSession(); setUser(null); setTeams([]); setFolders(DEFAULT_FOLDERS); setView("home"); };

  const handleParsePaste = () => {
    setPasteErr("");
    if (!pasteRaw.trim()) { setPasteErr("Paste your team first!"); return; }
    try {
      const mons = parsePaste(pasteRaw);
      if (mons.length === 0) { setPasteErr("Couldn't parse any Pokémon. Check your paste format."); return; }
      setParsedMons(mons);
      if (!teamName) setTeamName(`My Team ${new Date().toLocaleDateString()}`);
      const fmt = detectFormat(pasteRaw);
      if (!teamFolder) {
        const match = folders.find(f => f.toLowerCase().includes(fmt.toLowerCase().replace("gen ", "gen")));
        setTeamFolder(match || folders[0]);
      }
      setPasteStep(2);
    } catch (e) { setPasteErr("Parse error: " + e.message); }
  };

  const handleSaveTeam = () => {
    if (!user) { notify("Log in to save teams.", "error"); return; }
    if (!teamName.trim()) { setPasteErr("Give your team a name."); return; }
    setSaving(true);
    const newTeam = { id: Date.now().toString(), name: teamName, format: detectFormat(pasteRaw), folder: teamFolder || folders[0], paste: pasteRaw, pokemon: parsedMons, created: Date.now() };
    const updated = [newTeam, ...teams];
    saveTeams(user.id, updated); setTeams(updated); setSaving(false);
    setPasteRaw(""); setTeamName(""); setTeamFolder(""); setParsedMons(null); setPasteStep(1);
    setView("dashboard"); notify("Team saved!");
  };

  const handleDeleteTeam = (id) => {
    const updated = teams.filter(t => t.id !== id);
    saveTeams(user.id, updated); setTeams(updated); notify("Team deleted.", "info");
  };

  const openPaste = () => { setPasteStep(1); setPasteRaw(""); setTeamName(""); setTeamFolder(""); setParsedMons(null); setPasteErr(""); setView("paste"); };

  const teamsByFolder = folders.reduce((acc, f) => { acc[f] = teams.filter(t => t.folder === f); return acc; }, {});
  const unfiled = teams.filter(t => !t.folder || !folders.includes(t.folder));
  const visibleFolders = filterFolder === "All" ? folders : [filterFolder];
  const activeFolders = folders.filter(f => (teamsByFolder[f] || []).length > 0);

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(230,57,70,0.09) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <Notif notif={notif} />

      <nav style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 40px", borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}>
        <div onClick={() => setView(user ? "dashboard" : "home")} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#e63946,#c1121f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>⚡</div>
          <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 24, letterSpacing: "0.1em" }}>PokéTeams</span>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {user ? (
            <>
              <span style={{ fontSize: 12, color: "#444", fontFamily: "'Space Mono',monospace" }}>{user.name}</span>
              <button onClick={openPaste} style={{ ...S.primaryBtn, fontSize: 15, padding: "9px 18px" }}>+ New Team</button>
              <button onClick={handleLogout} style={{ ...S.ghostBtn, padding: "9px 16px" }}>Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => { setAuthErr(""); setView("login"); }} style={{ ...S.ghostBtn, padding: "9px 16px" }}>Log In</button>
              <button onClick={() => { setAuthErr(""); setView("register"); }} style={{ ...S.primaryBtn, fontSize: 15, padding: "9px 18px" }}>Sign Up</button>
            </>
          )}
        </div>
      </nav>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 980, margin: "0 auto", padding: "40px 24px" }}>

        {view === "home" && (
          <div style={{ textAlign: "center", paddingTop: 60, animation: "fadeIn 0.4s ease" }}>
            <div style={{ fontSize: 12, color: "#e63946", fontFamily: "'Space Mono',monospace", letterSpacing: "0.25em", marginBottom: 20 }}>POKÉMON SHOWDOWN TEAM MANAGER</div>
            <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: "clamp(52px,10vw,96px)", letterSpacing: "0.04em", lineHeight: 0.95, marginBottom: 24 }}>
              Your Teams.<br /><span style={{ color: "#e63946" }}>All In One Place.</span>
            </h1>
            <p style={{ color: "#666", maxWidth: 460, margin: "0 auto 40px", lineHeight: 1.7, fontSize: 15 }}>
              Paste any Pokémon Showdown team, see it rendered with Scarlet & Violet sprites, and organize by meta or generation.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => { setAuthErr(""); setView("register"); }} style={{ ...S.primaryBtn, fontSize: 20, padding: "14px 36px" }}>Get Started</button>
              <button onClick={openPaste} style={{ ...S.ghostBtn, fontSize: 14, padding: "14px 28px" }}>Try Without Account</button>
            </div>
            <div style={{ display: "flex", gap: 48, justifyContent: "center", marginTop: 80, flexWrap: "wrap" }}>
              {[["🎮","Any Format","Gen 1–9, VGC, OU, Ubers, and more"],["📁","Organize by Meta","Folders for each gen or format"],["✨","SV Sprites","Scarlet & Violet sprites + real item icons"]].map(([icon,title,desc]) => (
                <div key={title} style={{ maxWidth: 180, textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 20, letterSpacing: "0.05em", marginBottom: 6 }}>{title}</div>
                  <div style={{ fontSize: 12, color: "#444", lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(view === "login" || view === "register") && (
          <div style={{ maxWidth: 400, margin: "0 auto", paddingTop: 40, animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 42, letterSpacing: "0.08em", marginBottom: 6 }}>
              {view === "login" ? "Welcome Back" : "Create Account"}
            </div>
            <div style={{ color: "#444", fontSize: 12, fontFamily: "'Space Mono',monospace", marginBottom: 32 }}>
              {view === "login" ? "Log in to access your saved teams." : "Join and save your teams forever."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input style={S.input} placeholder="Username" value={authName} onChange={e => setAuthName(e.target.value)} onKeyDown={e => e.key === "Enter" && (view === "login" ? handleLogin() : handleRegister())} />
              <input style={S.input} placeholder="Password" type="password" value={authPass} onChange={e => setAuthPass(e.target.value)} onKeyDown={e => e.key === "Enter" && (view === "login" ? handleLogin() : handleRegister())} />
              {authErr && <div style={{ color: "#ff6b6b", fontSize: 12, fontFamily: "'Space Mono',monospace" }}>{authErr}</div>}
              <button onClick={view === "login" ? handleLogin : handleRegister} style={{ ...S.primaryBtn, width: "100%", fontSize: 20 }}>{view === "login" ? "Log In" : "Sign Up"}</button>
              <button onClick={() => { setAuthErr(""); setView(view === "login" ? "register" : "login"); }} style={{ ...S.ghostBtn, width: "100%" }}>{view === "login" ? "No account? Sign up →" : "Have an account? Log in →"}</button>
              <button onClick={() => setView("home")} style={{ ...S.ghostBtn, width: "100%", color: "#333" }}>← Back</button>
            </div>
          </div>
        )}

        {view === "paste" && (
          <div style={{ maxWidth: 720, margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
              {pasteStep === 2 && <button onClick={() => setPasteStep(1)} style={{ ...S.ghostBtn, padding: "8px 14px" }}>← Back</button>}
              <div>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 38, letterSpacing: "0.08em" }}>{pasteStep === 1 ? "New Team" : "Preview Team"}</div>
                <div style={{ color: "#444", fontSize: 11, fontFamily: "'Space Mono',monospace" }}>Step {pasteStep} of 2 — {pasteStep === 1 ? "Paste your Showdown export" : "Review and save"}</div>
              </div>
            </div>
            {pasteStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <textarea style={{ ...S.input, height: 320, resize: "vertical", lineHeight: 1.6, fontSize: 12 }}
                  placeholder={"Paste your Pokémon Showdown team here...\n\nExample:\nGardevoir @ Choice Specs\nAbility: Trace\nTera Type: Psychic\nEVs: 252 SpA / 4 SpD / 252 Spe\nTimid Nature\n- Psychic\n- Moonblast\n- Focus Blast\n- Trick"}
                  value={pasteRaw} onChange={e => setPasteRaw(e.target.value)} />
                {pasteErr && <div style={{ color: "#ff6b6b", fontSize: 12, fontFamily: "'Space Mono',monospace" }}>{pasteErr}</div>}
                <button onClick={handleParsePaste} style={{ ...S.primaryBtn, fontSize: 20 }}>Parse Team →</button>
              </div>
            )}
            {pasteStep === 2 && parsedMons && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <input style={{ ...S.input, flex: 2, minWidth: 180 }} placeholder="Team name..." value={teamName} onChange={e => setTeamName(e.target.value)} />
                  <select style={{ ...S.input, flex: 1, minWidth: 140 }} value={teamFolder} onChange={e => setTeamFolder(e.target.value)}>
                    {folders.map(f => <option key={f} value={f} style={{ background: "#1a1a24" }}>{f}</option>)}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(290px,1fr))", gap: 10 }}>
                  {parsedMons.map((p, i) => <PokemonCard key={i} mon={p} />)}
                </div>
                {pasteErr && <div style={{ color: "#ff6b6b", fontSize: 12, fontFamily: "'Space Mono',monospace" }}>{pasteErr}</div>}
                {user ? (
                  <button onClick={handleSaveTeam} disabled={saving} style={{ ...S.primaryBtn, fontSize: 20, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "💾 Save to My Teams"}</button>
                ) : (
                  <div style={{ background: "rgba(230,57,70,0.07)", border: "1px solid rgba(230,57,70,0.2)", borderRadius: 10, padding: 20, textAlign: "center" }}>
                    <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 22, color: "#e63946", marginBottom: 8 }}>Save this team?</div>
                    <div style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>Create a free account to save and organize all your teams.</div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                      <button onClick={() => { setAuthErr(""); setView("register"); }} style={S.primaryBtn}>Sign Up Free</button>
                      <button onClick={() => { setAuthErr(""); setView("login"); }} style={S.ghostBtn}>Log In</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {view === "dashboard" && user && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 42, letterSpacing: "0.08em" }}>{user.name}'s Teams</div>
                <div style={{ color: "#444", fontSize: 12, fontFamily: "'Space Mono',monospace" }}>{teams.length} team{teams.length !== 1 ? "s" : ""} across {activeFolders.length} folder{activeFolders.length !== 1 ? "s" : ""}</div>
              </div>
              <button onClick={openPaste} style={{ ...S.primaryBtn, fontSize: 17 }}>+ New Team</button>
            </div>

            {teams.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
                {["All", ...activeFolders].map(f => (
                  <button key={f} onClick={() => setFilterFolder(f)} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontFamily: "'Space Mono',monospace", border: "1px solid", cursor: "pointer", transition: "all 0.15s", background: filterFolder === f ? "rgba(230,57,70,0.15)" : "transparent", color: filterFolder === f ? "#e63946" : "#555", borderColor: filterFolder === f ? "rgba(230,57,70,0.4)" : "rgba(255,255,255,0.08)" }}>{f}</button>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginBottom: 32, maxWidth: 400 }}>
              <input style={{ ...S.input, fontSize: 12, padding: "9px 12px" }} placeholder="New folder name..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddFolder()} />
              <button onClick={handleAddFolder} style={{ ...S.ghostBtn, padding: "9px 16px", whiteSpace: "nowrap", color: "#e63946", borderColor: "rgba(230,57,70,0.3)" }}>+ Folder</button>
            </div>

            {teams.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎮</div>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 28, letterSpacing: "0.05em", marginBottom: 8, color: "#444" }}>No teams yet</div>
                <div style={{ fontSize: 13, fontFamily: "'Space Mono',monospace", marginBottom: 24, color: "#333" }}>Paste your first Showdown team to get started.</div>
                <button onClick={openPaste} style={S.primaryBtn}>Add First Team</button>
              </div>
            ) : (
              <div>
                {visibleFolders.map(f => <FolderSection key={f} folder={f} teams={teamsByFolder[f] || []} onView={setViewingTeam} onDelete={handleDeleteTeam} />)}
                {filterFolder === "All" && unfiled.length > 0 && <FolderSection folder="Unfiled" teams={unfiled} onView={setViewingTeam} onDelete={handleDeleteTeam} />}
              </div>
            )}
          </div>
        )}
      </main>

      {viewingTeam && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
          onClick={() => setViewingTeam(null)}>
          <div style={{ background: "#0d0d14", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: 28, maxWidth: 640, width: "100%", maxHeight: "80vh", overflow: "auto" }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 26, letterSpacing: "0.05em" }}>{viewingTeam.name}</div>
                <div style={{ fontSize: 11, color: "#444", fontFamily: "'Space Mono',monospace" }}>{viewingTeam.folder} · {viewingTeam.format}</div>
              </div>
              <button onClick={() => setViewingTeam(null)} style={{ ...S.ghostBtn, padding: "6px 12px" }}>✕</button>
            </div>
            <textarea style={{ ...S.input, height: 360, resize: "none", fontSize: 11, lineHeight: 1.7 }} value={viewingTeam.paste} readOnly />
            <button onClick={() => { navigator.clipboard.writeText(viewingTeam.paste); notify("Copied to clipboard!"); }} style={{ ...S.primaryBtn, width: "100%", marginTop: 12, fontSize: 17 }}>
              Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
