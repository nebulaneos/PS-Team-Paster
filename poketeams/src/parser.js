export function parsePaste(raw) {
  const lines = raw.trim().split("\n");
  const mons = [];
  let cur = null;

  for (const line of lines) {
    const t = line.trim();
    if (!t) {
      if (cur) { mons.push(cur); cur = null; }
      continue;
    }

    if (!cur) {
      cur = {
        name: "", nickname: "", item: "", ability: "", nature: "",
        evs: {}, ivs: {}, moves: [], gender: "", tera: "", level: 100,
      };
      const atIdx = t.indexOf(" @ ");
      let namePart = atIdx > -1 ? t.slice(0, atIdx) : t;
      if (atIdx > -1) cur.item = t.slice(atIdx + 3).trim();

      const parenMatch = namePart.match(/^(.+?)\s*\(([^)]+)\)\s*(?:\(([MF])\))?/);
      if (parenMatch) {
        cur.nickname = parenMatch[1].trim();
        cur.name = parenMatch[2].trim();
        if (parenMatch[3]) cur.gender = parenMatch[3];
      } else {
        const gMatch = namePart.match(/^(.+?)\s*\(([MF])\)\s*$/);
        if (gMatch) { cur.name = gMatch[1].trim(); cur.gender = gMatch[2]; }
        else cur.name = namePart.trim();
      }
      continue;
    }

    if (t.startsWith("Ability:")) { cur.ability = t.slice(8).trim(); continue; }
    if (t.startsWith("Level:")) { cur.level = parseInt(t.slice(6).trim()); continue; }
    if (t.startsWith("Tera Type:")) { cur.tera = t.slice(10).trim(); continue; }
    if (t.startsWith("EVs:")) {
      t.slice(4).trim().split("/").forEach(s => {
        const m = s.trim().match(/(\d+)\s+(\w+)/);
        if (m) cur.evs[m[2]] = parseInt(m[1]);
      });
      continue;
    }
    if (t.startsWith("IVs:")) {
      t.slice(4).trim().split("/").forEach(s => {
        const m = s.trim().match(/(\d+)\s+(\w+)/);
        if (m) cur.ivs[m[2]] = parseInt(m[1]);
      });
      continue;
    }
    if (t.endsWith("Nature")) { cur.nature = t.replace(" Nature", "").trim(); continue; }
    if (t.startsWith("- ")) { cur.moves.push(t.slice(2).trim()); continue; }
  }

  if (cur) mons.push(cur);
  return mons;
}

export function detectFormat(raw) {
  const lower = raw.toLowerCase();
  if (lower.includes("tera type:")) return "Gen 9";
  if (lower.includes("dynamax level") || lower.includes("gigantamax")) return "Gen 8";
  return "Gen 7 or earlier";
}

export function spriteUrl(name) {
  // Use Showdown's home-ani sprites (SV-era animated home sprites)
  const cleaned = name.toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `https://play.pokemonshowdown.com/sprites/home/${cleaned}.png`;
}

export function spriteUrlFallback(name) {
  const cleaned = name.toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `https://play.pokemonshowdown.com/sprites/gen5/${cleaned}.png`;
}

export function itemSpriteUrl(item) {
  const cleaned = item.toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `https://play.pokemonshowdown.com/sprites/itemicons/${cleaned}.png`;
}

export const TYPE_COLORS = {
  Normal:"#A8A878", Bug:"#A8B820", Dark:"#705848", Dragon:"#7038F8",
  Electric:"#F8D030", Fairy:"#EE99AC", Fighting:"#C03028", Fire:"#F08030",
  Flying:"#A890F0", Ghost:"#705898", Grass:"#78C850", Ground:"#E0C068",
  Ice:"#98D8D8", Poison:"#A040A0", Psychic:"#F85888", Rock:"#B8A038",
  Steel:"#B8B8D0", Water:"#6890F0", Stellar:"#40B5A5",
};
