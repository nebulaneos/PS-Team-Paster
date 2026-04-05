import { useState, useEffect } from "react";
import {
  getUsers, saveUsers, getTeams, saveTeams,
  hashPassword, getSession, saveSession, clearSession
} from "./storage";
import { parsePaste, detectFormat, itemSpriteUrl, TYPE_COLORS } from "./parser";

/* ---------------- GLOBAL CSS (WHITE THEME) ---------------- */

const GLOBAL_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }

  body {
    background: #ffffff;
    color: #111;
    font-family: 'Space Grotesk', sans-serif;
  }

  textarea, input, select {
    font-family: inherit;
    background: #fff;
    color: #111;
  }

  textarea:focus, input:focus, select:focus {
    outline: none;
    border-color: #e63946 !important;
  }

  button { cursor: pointer; }
  button:hover { opacity: 0.9; }
`;

/* ---------------- SPRITE LOGIC ---------------- */

function getSprite(name, isShiny, mode) {
  const formatted = name.toLowerCase().replace(/ /g, "-");

  if (mode === "home") {
    return `https://img.pokemondb.net/sprites/home/${isShiny ? "shiny" : "normal"}/${formatted}.png`;
  }

  return `https://img.pokemondb.net/sprites/scarlet-violet/${isShiny ? "shiny" : "normal"}/${formatted}.png`;
}

function PokemonSprite({ name, isShiny, size = 80, mode }) {
  const [err, setErr] = useState(false);
  const src = getSprite(name, isShiny, mode);

  if (err) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>?</div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      style={{ width: size, height: size, objectFit: "contain" }}
      onError={() => setErr(true)}
    />
  );
}

/* ---------------- COMPONENTS ---------------- */

function PokemonCard({ mon, spriteMode }) {
  return (
    <div style={{
      background: "#f9f9f9",
      border: "1px solid #ddd",
      borderRadius: 10,
      padding: 12,
      display: "flex",
      gap: 10
    }}>
      <PokemonSprite
        name={mon.name}
        isShiny={mon.shiny}
        size={80}
        mode={spriteMode}
      />

      <div>
        <div style={{ fontWeight: "bold" }}>
          {mon.name} {mon.shiny && "✨"}
        </div>

        {mon.item && (
          <div style={{ fontSize: 12 }}>
            <img src={itemSpriteUrl(mon.item)} style={{ width: 20 }} />
            {mon.item}
          </div>
        )}

        <div style={{ fontSize: 12 }}>
          {mon.moves.map((m, i) => (
            <div key={i}>• {m}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- MAIN APP ---------------- */

export default function App() {
  const [spriteMode, setSpriteMode] = useState("home");

  const [view, setView] = useState("home");
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);

  const [authName, setAuthName] = useState("");
  const [authPass, setAuthPass] = useState("");

  const [paste, setPaste] = useState("");
  const [parsedMons, setParsedMons] = useState([]);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = GLOBAL_CSS;
    document.head.appendChild(style);

    const session = getSession();
    if (session) {
      setUser(session);
      setTeams(getTeams(session.id));
      setView("dashboard");
    }
  }, []);

  /* -------- AUTH -------- */

  const handleLogin = () => {
    const users = getUsers();
    const u = users[authName];

    if (!u) return alert("No account");

    if (u.passwordHash !== hashPassword(authPass)) {
      return alert("Wrong password");
    }

    const session = { id: authName };
    setUser(session);
    saveSession(session);
    setTeams(getTeams(session.id));
    setView("dashboard");
  };

  const handleRegister = () => {
    const users = getUsers();

    users[authName] = {
      passwordHash: hashPassword(authPass)
    };

    saveUsers(users);

    const session = { id: authName };
    setUser(session);
    saveSession(session);
    setView("dashboard");
  };

  /* -------- PARSE -------- */

  const handleParse = () => {
    const mons = parsePaste(paste);
    setParsedMons(mons);
  };

  /* -------- SAVE -------- */

  const handleSave = () => {
    const newTeam = {
      id: Date.now(),
      pokemon: parsedMons,
      paste
    };

    const updated = [newTeam, ...teams];
    setTeams(updated);
    saveTeams(user.id, updated);
  };

  /* ---------------- UI ---------------- */

  return (
    <div style={{ padding: 20 }}>
      <h1>PokéTeams</h1>

      {/* SPRITE TOGGLE */}
      <select
        value={spriteMode}
        onChange={(e) => setSpriteMode(e.target.value)}
      >
        <option value="home">HOME</option>
        <option value="sv">SV</option>
      </select>

      {!user && (
        <div>
          <input
            placeholder="username"
            value={authName}
            onChange={e => setAuthName(e.target.value)}
          />
          <input
            placeholder="password"
            type="password"
            value={authPass}
            onChange={e => setAuthPass(e.target.value)}
          />
          <button onClick={handleLogin}>Login</button>
          <button onClick={handleRegister}>Register</button>
        </div>
      )}

      {user && (
        <>
          <textarea
            value={paste}
            onChange={e => setPaste(e.target.value)}
            style={{ width: "100%", height: 200 }}
          />

          <button onClick={handleParse}>Parse</button>
          <button onClick={handleSave}>Save</button>

          <div>
            {parsedMons.map((m, i) => (
              <PokemonCard
                key={i}
                mon={m}
                spriteMode={spriteMode}
              />
            ))}
          </div>

          <hr />

          <h2>Saved Teams</h2>

          {teams.map(t => (
            <div key={t.id}>
              {t.pokemon.map((p, i) => (
                <PokemonCard
                  key={i}
                  mon={p}
                  spriteMode={spriteMode}
                />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
