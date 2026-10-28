// Normaliza los atributos tex="..." de los .astro: dobla cada
// backslash para que sobrevivan al escaping del compilador (regla
// del AGENTS.md). Uso: node scripts/normalize-tex.mjs [--check]
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";

const check = process.argv.includes("--check");
const archivos = globSync("src/**/*.astro");
let cambios = 0;

for (const archivo of archivos) {
  const original = readFileSync(archivo, "utf8");
  const normalizado = original.replace(/tex="([^"]*)"/g, (m, tex) => {
    const doblado = tex.replace(/\\/g, "\\\\");
    return doblado === tex ? m : `tex="${doblado}"`;
  });
  if (normalizado !== original) {
    cambios++;
    if (check) {
      console.log(`PENDIENTE: ${archivo}`);
    } else {
      writeFileSync(archivo, normalizado);
      console.log(`normalizado: ${archivo}`);
    }
  }
}
console.log(cambios === 0 ? "Todo normalizado." : `${cambios} fichero(s).`);
