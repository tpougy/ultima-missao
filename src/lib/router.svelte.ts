/**
 * Minimal hash router: #/cardapio (default), #/cardapio/admin, #/bebidas,
 * #/bebidas/admin, #/data (closed date voting). Hash URLs need no server rewrites on Cloudflare Pages and
 * keep the back button and shareable links working.
 */

export type Section = "cardapio" | "bebidas" | "data";

const SECTIONS: Section[] = ["cardapio", "bebidas", "data"];

interface Route {
  section: Section;
  admin: boolean;
}

function parse(hash: string): Route {
  const [section, sub] = hash.replace(/^#\/?/, "").split("/");
  return {
    section: SECTIONS.includes(section as Section)
      ? (section as Section)
      : "cardapio",
    admin: sub === "admin",
  };
}

export const router = $state<Route>(parse(location.hash));

window.addEventListener("hashchange", () => {
  Object.assign(router, parse(location.hash));
});

export function routeHref(section: Section, admin = false): string {
  return `#/${section}${admin ? "/admin" : ""}`;
}

export function navigate(section: Section, admin = false): void {
  location.hash = routeHref(section, admin);
}
