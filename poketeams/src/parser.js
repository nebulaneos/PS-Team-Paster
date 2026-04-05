import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { parsePaste } from "./parser";

/* ---------- SPRITES ---------- */

function getSprite(name, isShiny, mode) {
  const formatted = name.toLowerCase().replace(/ /g, "-");

  if (mode === "home") {
    return `https://img.pokemondb.net/sprites/home/${isShiny ? "shiny" : "normal"}/${formatted}.png`;
  }

  return `https://img.pokemondb.net/sprites/scarlet-violet/${isShiny ? "shiny" : "normal"}/${formatted}.png`;
}

function Pokemon({ mon, mode }) {
  return (
    <div style={{ border: "1px solid #ddd", padding: 10, marginBottom: 8 }}>
      <img src={getSprite(mon.name, mon.shiny, mode)} width={80} />
      <div>
        {mon.name} {mon.shiny && "✨"}
      </div>
      {mon.moves.map((m, i) => <div key={i}>• {m}</div>)}
    </div>
  );
}

/* ---------- APP ---------- */

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const [paste, setPaste] = useState("");
  const [mons, setMons] = useState([]);
  const [teams, setTeams] = useState([]);

  const [spriteMode, setSpriteMode] = useState("home");

  /* ---------- AUTH ---------- */

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) loadTeams(data.user.id);
  };

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
    });
    if (error) alert(error.message);
    else alert("Check your email!");
  };

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) alert(error.message);
    else checkUser();
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setTeams([]);
  };

  /* ---------- TEAMS ---------- */

  const saveTeam = async () => {
    if (!user) return alert("Login first");

    await supabase.from("teams").insert({
      user_id: user.id,
      paste,
      pokemon: mons
    });

    loadTeams(user.id);
  };

  const loadTeams = async (uid) => {
    const { data } = await supabase
      .from("teams")
      .select("*")
      .eq("user_id", uid);

    setTeams(data || []);
  };

  /* ---------- PARSE ---------- */

  const handleParse = () => {
    const parsed = parsePaste(paste);
    setMons(parsed);
  };

  /* ---------- UI ---------- */

  return (
    <div style={{ padding: 20, background: "#fff", color: "#111", minHeight: "100vh" }}>
      <h1>PokéTeams</h1>

      {/* SPRITE MODE */}
      <select value={spriteMode} onChange={e => setSpriteMode(e.target.value)}>
        <option value="home">HOME</option>
        <option value="sv">SV</option>
      </select>

      {/* AUTH */}
      {!user ? (
        <>
          <input placeholder="email" onChange={e => setEmail(e.target.value)} />
          <input type="password" placeholder="password" onChange={e => setPass(e.target.value)} />
          <button onClick={login}>Login</button>
          <button onClick={signUp}>Sign Up</button>
        </>
      ) : (
        <>
          <div>Logged in as {user.email}</div>
          <button onClick={logout}>Logout</button>

          <hr />

          {/* PASTE */}
          <textarea
            value={paste}
            onChange={e => setPaste(e.target.value)}
            style={{ width: "100%", height: 200 }}
          />

          <button onClick={handleParse}>Parse</button>
          <button onClick={saveTeam}>Save Team</button>

          <h2>Preview</h2>
          {mons.map((m, i) => (
            <Pokemon key={i} mon={m} mode={spriteMode} />
          ))}

          <h2>Saved Teams</h2>
          {teams.map(t => (
            <div key={t.id}>
              {t.pokemon.map((p, i) => (
                <Pokemon key={i} mon={p} mode={spriteMode} />
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
