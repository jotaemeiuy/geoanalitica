# AGENTS.md — GeomAnal (Astro 7 + CSS por capas + KaTeX)

Sitio estático de Geometría Analítica (Duffour). Astro 7, CSS vanilla con
`@layer`, KaTeX con render en build (cero JS cliente para mates), pnpm.

## Comandos (pnpm — no usar npm/yarn/bun)

| Comando          | Qué hace                              |
| ---------------- | ------------------------------------- |
| `pnpm dev`       | Servidor de desarrollo (`:4321`)      |
| `pnpm build`     | `astro check && astro build`          |
| `pnpm preview`   | Sirve `dist/` para verificar el build |
| `pnpm check`     | Solo chequeo de tipos                 |
| `pnpm approve-builds` | Autorizar scripts de build (esbuild, sharp) |

Requisito: Node ≥ 22.12 (Astro 7 no soporta Node 20), pnpm ≥ 9.

## Notas de Astro 7 (migración desde v5)

1. `compressHTML: true` fijado en `astro.config.mjs`: el default v7 (`'jsx'`)
   pega palabras alrededor de elementos inline y rompería el math inline
   (`<Math display={false} />`) en los párrafos. No quitar sin revisar.
2. `markdown.processor: unified({...})` explícito + dependencia
   `@astrojs/markdown-remark`: Sätteri (default v7) no entiende
   remark/rehype. Reservado para futuro `.md`/`.mdx`.
3. El compilador Rust es estricto: etiquetas sin cerrar = error de build;
   no reordena HTML inválido. Revisar el build, no el navegador.
4. Sin flags `experimental`, sin `@astrojs/db`, sin `src/fetch.ts`
   (nombre reservado por el routing avanzado).

## Arquitectura

```
src/
  pages/          # Una ruta por fichero: index.astro (/),
                  # capitulo-1.astro (/capitulo-1/), practico-puntos-segmentos.astro
  layouts/        # BaseLayout.astro (head, skip-link, .wrap) — sin estilos propios
  components/     # .astro estáticos por defecto (cero JS)
    Math.astro, Formula.astro, FormulaCard.astro, Nota.astro,
    Figura.astro, Split.astro, Masthead.astro, ChipsNav.astro,
    Topbar.astro, Hero.astro, Toc.astro, Seccion.astro, CalculatorShell.astro
    calculators/  # Islas interactivas: Calc*.astro, RevealSolucion.astro
  styles/         # global.css importa tokens → base → components (+ KaTeX);
                  # cada página importa además su tema (formulas.css | capitulo1.css)
public/assets/sprites.svg  # Sprite de figuras; referenciar con <Figura simbolo="…" />
```

 Fuente histórica (no tocar, solo referencia): `practico.pdf`
 (origen del contenido de practico-puntos-segmentos.astro).
 Los HTML/CSS/sprite originales ya se eliminaron al quedar
 reemplazados por `src/` + `public/`.

## Reglas de Astro (buenas prácticas aplicadas)

1. **Cero JS por defecto.** Todo componente es estático. La interactividad
   (calculadoras, reveals) vive en el `<script>` propio de cada componente
   `.astro` — Astro lo emite como JS progresivo mínimo, sin hidratación.
   Las directivas `client:*` son solo para componentes de framework
   (React/Vue/Svelte…); **nunca** en componentes `.astro`.
2. **Sin `Astro.glob()` ni `entry.render()`** (APIs obsoletas). Si se añaden
   capítulos como colección: `src/content.config.ts` con `loader: glob()` y
   `render(entry)` de `astro:content`.
3. **Rutas finas:** las páginas ensamblan layouts + componentes; sin lógica
   pesada en el frontmatter de la página.
4. **Props tipadas** con `interface Props` en cada componente. `set:html` solo
   para salida saneada (KaTeX) o `tituloHtml` interno — nunca con input de usuario.
5. **Imágenes/figuras:** SVG del sprite vía `<Figura>`; `role="img"` +
   `aria-label` siempre. `output[aria-live="polite"]` en calculadoras.

## Reglas de CSS

1. **Orden de cascada fijo:** `@layer tokens, reset, base, components, page`
   (declarado en `global.css`). Los temas solo aportan `@layer page`.
2. **Tokens primero:** colores, espaciados, radios y anchos en `tokens.css`.
   Prohibidos valores mágicos y `!important`.
3. **Especificidad 0 en base:** usar `:where()`, propiedades lógicas
   (`inline-size`, `margin-block`, `padding-inline`), nesting nativo.
4. **Estilos scoped:** el `<style>` dentro de un `.astro` queda scropeado;
   para clases globales usar `:global()` o añadir al fichero de `styles/`.
5. **Responsive mobile-first** con estos breakpoints (rem):
   `40rem` móvil · `48rem` tablet (apilar `.split`/`.row2`, navs con
   scroll-x + snap) · `64rem` desktop (grid 2 col). Tipografías con `clamp()`.
6. **Accesibilidad:** `:focus-visible` visible, `skip-link`, `prefers-reduced-motion`,
   `.katex-display` con `overflow-x: auto` (nunca recortar fórmulas).

## Reglas de mates (KaTeX)

1. Toda fórmula pasa por `<Math tex="…" />` (`display=true` bloque con
   `.formula`, `false` inline). **Sin delimitadores** `$` ni `\(` en `tex`.
   **Un solo backslash** en todo comando: `tex="\frac{a}{b} \boxed{\neq}"`.
   (El compilador Rust de Astro 7 pasa los atributos literales; la vieja
   regla del doble backslash era del compilador Go de Astro ≤ 6.)
   Si una fórmula sale en rojo en `pnpm dev`, revisa el comando LaTeX.
2. KaTeX ≠ MathJax: no existe `\sen` → usar `\operatorname{sen}`;
   `\boxed{}`, `\text{}`, `\overrightarrow{}` sí soportados.
   Ante duda, `throwOnError: false` evita romper el build pero revisa el
   aviso visual (rojo) en `pnpm dev`.
3. El CSS de KaTeX se importa una vez en `global.css`. No añadir CDN de
   MathJax ni scripts globales de mates.
4. `remark-math` + `rehype-katex` en `astro.config.mjs` quedan reservados
   para futuro contenido `.md`/`.mdx`; hoy el render lo hace `Math.astro`
   vía `katex.renderToString` en el build.

## Reglas de JS en islas

1. Sin `onclick` inline ni `<script>` global: cada isla lleva su propio
   `<script>` con `addEventListener("submit")` sobre `form[data-calc]`.
2. `<form>` + `<button type="submit">` (funciona con teclado y Enter);
   `input[type="number"][required]` con `name` estable.
3. Resultado siempre en `<output aria-live="polite">`.

## Búsqueda de código (usar obligatoriamente tgrep en vez de grep/rg)

`tgrep` (github.com/microsoft/tgrep, v1.0.5 instalado vía
`cargo install --path tgrep-cli --locked`) es el buscador estándar del
proyecto: CLI compatible con ripgrep sobre un índice de trigramas en
`.tgrep/` (no commitear; ya en `.gitignore`).

1. **Este directorio no es repo git:** pasar **siempre**
   `--no-require-git` en `index`, `serve` y cada búsqueda; si no, se
   indexa `node_modules/` (301M) y se ignora el `.gitignore`.
   Mantener el índice al día: `tgrep index . --no-require-git`
   (repetir tras crear/borrar ficheros).
2. **Orden de argumentos:** flags primero, `--` después:
   `tgrep --no-require-git -l -F -- "CalcPuntoMedio" .`
   (lo que va tras el path se interpreta como path y falla).
3. **Precisión:** `-F` para símbolos/literales (evita escapes regex);
   `-g '*.astro'` o `--type-add 'astro:*.astro'` + `-t astro` para
   acotar (`.astro` no es tipo nativo); `-l` primero en consultas
   amplias, `-C 2` para contexto.
4. **Exit codes:** `1` = sin resultados (no es fallo), `2` = error.
5. **Frescura:** el índice no ve ediciones posteriores; si el resultado
   debe reflejar el último cambio, añadir `--no-index` a esa búsqueda.

## Skills de agente (autoskills — https://www.autoskills.sh/)

`npx autoskills` detecta el stack desde `package.json` y la config e
instala skills curadas desde su registry auditado (solo se descargan los
ficheros seleccionados y se verifican contra hashes SHA-256 antes de
escribirlos). Opciones: `--dry-run` (ver sin instalar), `-y/--yes` (sin
confirmación), `-a/--agent` (solo para un IDE), `-v/--verbose`.

1. **Estado de este proyecto:** 7 skills instaladas en `.agents/skills/`
   con hashes fijados en `skills-lock.json` (no editar skills ni el lock
   a mano; se regeneran con `npx autoskills`). Detecta Astro + TypeScript
   + Node.js.
2. **Relevantes aquí:** `astro`, `typescript-advanced-types`,
   `frontend-design`, `accessibility`, `seo` (las 2 de Node.js son
   marginales: sitio estático sin backend). Consultarlas al trabajar en
   su área (componentes/páginas Astro, tipos estrictos, a11y, SEO).
3. **Precedencia:** ante conflicto entre una skill genérica y este
   `AGENTS.md`, manda este fichero (p. ej. backslash simple en KaTeX,
   `compressHTML: true`, nunca `client:*` en `.astro`).
4. **Mantenimiento:** tras añadir una dependencia o tecnología, pasar
   `npx autoskills --dry-run` y, si propone skills nuevas, instalarlas;
   el lock registra fuente y hash de cada una.

## Definición de hecho (antes de dar por hecha una tarea)

`pnpm build` en verde + revisar `dist/` (o `pnpm preview`) en móvil
(360px), tablet (768px) y desktop (1280px): sin scroll horizontal de
página, fórmulas con scroll interno si desbordan, y calculadoras
respondiendo por teclado.
