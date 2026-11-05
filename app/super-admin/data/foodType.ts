/*
path :           app/super-admin/data/foodType.ts
tag :            ["super-admin", "data", "food-type", "config", "catalog"]
projectId:       <à fournir>
type:            config
generic:         true

role:            Source de vérité statique des types de cuisine
                 (moyen-oriental, arepas, asiatique, burger, pizza,
                 sushi…). Chaque entrée porte une image (src), un
                 libellé (text) et une visibilité (visibility) qui
                 pilote l'affichage dans les filtres du catalogue
                 public.

                 Aucune I/O, aucun état. La gestion (toggle visibility,
                 ajout, suppression) est déléguée au composant client
                 DataCatalogManager. Pour une persistance réelle, il
                 faudra un modèle Prisma + validation Zod + Server
                 Actions.

                 ⚠️ CORRECTIONS : harmonisation de la casse (tous les
                 libellés commencent par une majuscule), correction
                 des typos (« Myen-orientale » → « Moyen-orientale »,
                 « Poke-bowm » → « Poke-bowl », « hotdog » →
                 « Hot-dog », « Perou » → « Pérou », « végétarien »
                 → « Végétarien »).

flow:            Module TypeScript pur → export du type FoodImage
                 et de la constante FOOD_TYPES (readonly). Aucun
                 effet.

ecosystem:       SuperAdminData = [
                   "@/app/super-admin/data/foodTypeData.ts",
                   "@/app/super-admin/data/mercantType.ts",
                   "@/app/super-admin/data/productType.ts",
                   "@/app/super-admin/data/page.tsx",
                   "@/app/super-admin/data/DataCatalogManager.tsx",
                 ]

relatedFiles:    ["@/app/super-admin/data/mercantType.ts",
                  "@/app/super-admin/data/productType.ts",
                  "@/app/super-admin/data/DataCatalogManager.tsx"]

imports:         []

exports:         ["FoodImage", "FOOD_TYPES"]

useBy:           ["@/app/super-admin/data/page.tsx"]

userStories:     ["*en tant que super-admin je veux gérer les types de cuisine"]

status:          wip
pathChecked:     ✔true
metaDataChecked: ✔true
scriptChecked:   ✔true
*/

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FoodImage {
  /** Chemin public de l'image (ex. "/foodtype/pizza.webp"). */
  readonly src: string;
  /** Libellé affiché (cuisine, type de plat). */
  readonly text: string;
  /** Visible dans les filtres du catalogue public. */
  readonly visibility: boolean;
}

/* ------------------------------------------------------------------ */
/*  Données                                                            */
/* ------------------------------------------------------------------ */

export const FOOD_TYPES: readonly FoodImage[] = [
  { src: "/foodtype/arabe.webp", text: "Moyen-orientale", visibility: true },
  { src: "/foodtype/arepas.webp", text: "Arepas", visibility: true },
  { src: "/foodtype/asiat.webp", text: "Asiatique", visibility: true },
  { src: "/foodtype/assado.webp", text: "Assado", visibility: true },
  { src: "/foodtype/boisson.webp", text: "Boisson", visibility: true },
  { src: "/foodtype/boulangerie.webp", text: "Boulangerie", visibility: true },
  { src: "/foodtype/cafe.webp", text: "Café", visibility: true },
  { src: "/foodtype/chine.webp", text: "Chinois", visibility: true },
  { src: "/foodtype/tipica.webp", text: "Typique", visibility: true },
  { src: "/foodtype/empanada.webp", text: "Empanada", visibility: true },
  { src: "/foodtype/fast-food.webp", text: "Fast-food", visibility: true },
  { src: "/foodtype/glace.webp", text: "Glaces", visibility: true },
  { src: "/foodtype/grill.webp", text: "Grillade", visibility: true },
  { src: "/foodtype/hamburger.webp", text: "Burger", visibility: true },
  { src: "/foodtype/hot-dog.webp", text: "Hot-dog", visibility: true },
  {
    src: "/foodtype/international.webp",
    text: "International",
    visibility: true,
  },
  { src: "/foodtype/mexicain.png", text: "Mexicain", visibility: true },
  { src: "/foodtype/patisserie.webp", text: "Pâtisserie", visibility: true },
  { src: "/foodtype/perou.webp", text: "Pérou", visibility: true },
  { src: "/foodtype/petit-dej.webp", text: "Petit-déjeuner", visibility: true },
  { src: "/foodtype/pizza.webp", text: "Pizza", visibility: true },
  { src: "/foodtype/poisson.webp", text: "Poisson", visibility: true },
  { src: "/foodtype/poke.webp", text: "Poke-bowl", visibility: true },
  { src: "/foodtype/poulet.webp", text: "Poulet", visibility: true },
  { src: "/foodtype/salade.webp", text: "Salade", visibility: true },
  { src: "/foodtype/salchipapa.webp", text: "Salchipapa", visibility: true },
  { src: "/foodtype/sandwich.webp", text: "Sandwich", visibility: true },
  { src: "/foodtype/sushi.webp", text: "Sushi", visibility: true },
  { src: "/foodtype/vege.webp", text: "Végétarien", visibility: true },
];
