import { getStore } from "@netlify/blobs";

// Contenu de départ, basé sur les informations publiques connues du restaurant.
// Le propriétaire peut tout modifier depuis /admin.html -> /dashboard.html,
// ce qui écrase ces valeurs dans Netlify Blobs.
export const DEFAULT_CONTENT = {
  identite: {
    nom: "La Baie du Dragon",
    tagline: "Spécialités d'Asie du Sud-Est, dont une carte 100% vegan",
    description:
      "La Baie du Dragon propose des spécialités de l'Asie du Sud-Est, dont une carte vegan complète et variée. Les gourmands non-végétariens ne sont pas en reste : ils trouveront eux aussi de quoi se régaler. Une cuisine soignée, une ambiance chaleureuse, et un patron reconnu pour son accueil convivial et son humour."
  },
  contact: {
    telephone: "+33491927478",
    telephone_affiche: "04 91 92 74 78",
    adresse: "8 Place Notre Dame du Mont",
    code_postal: "13006",
    ville: "Marseille",
    google_maps_url:
      "https://www.google.com/maps/search/?api=1&query=8+Place+Notre+Dame+du+Mont+13006+Marseille"
  },
  horaires: {
    lundi: "Fermé",
    mardi: "12h00–14h00 / 19h00–22h30",
    mercredi: "12h00–14h00 / 19h00–22h30",
    jeudi: "12h00–14h00 / 19h00–22h30",
    vendredi: "12h00–14h00 / 19h00–22h30",
    samedi: "12h00–14h00 / 19h00–22h30",
    dimanche: "Fermé"
  },
  reseaux: {
    instagram: "",
    facebook: ""
  },
  highlights: [
    { titre: "Carte vegan complète", texte: "Une carte 100% végétale aussi riche que la carte traditionnelle.", image: "" },
    { titre: "Note Google 4.8/5", texte: "Plus de 500 avis très positifs sur la qualité et l'accueil.", image: "" },
    { titre: "Spécialités signature", texte: "Pho, curry vert, curry saïgonnais, rouleaux de printemps.", image: "" }
  ],
  media: {
    hero_image: "",
    hero_video: "",
    galerie: []
  },
  carte: {
    note:
      "Carte d'exemple, à ajuster : les catégories, plats, photos et prix ci-dessous sont indicatifs et peuvent être modifiés à tout moment depuis l'espace propriétaire.",
    categories: [
      {
        nom: "Entrées",
        image: "",
        sous_categories: [
          {
            nom: "",
            plats: [
              { nom: "Rouleaux de printemps", description: "Rouleaux frais, légumes et vermicelles, sauce maison", prix: "7,50 €", image: "" },
              { nom: "Nems au choix", description: "Nems croustillants, poulet ou légumes (vegan)", prix: "7,00 €", image: "" }
            ]
          }
        ]
      },
      {
        nom: "Soupes",
        image: "",
        sous_categories: [
          {
            nom: "",
            plats: [
              { nom: "Pho", description: "Soupe vietnamienne, bouillon parfumé (le riz est servi à part)", prix: "12,50 €", image: "" }
            ]
          }
        ]
      },
      {
        nom: "Curry & Plats",
        image: "",
        sous_categories: [
          {
            nom: "",
            plats: [
              { nom: "Curry vert", description: "Curry doux et parfumé, légumes de saison", prix: "13,50 €", image: "" },
              { nom: "Curry saïgonnais", description: "Curry relevé, plus prononcé en goût", prix: "13,50 €", image: "" }
            ]
          }
        ]
      },
      {
        nom: "Carte Vegan",
        image: "",
        sous_categories: [
          {
            nom: "Plats",
            plats: [
              { nom: "Nouilles sautées vegan", description: "Nouilles, légumes et protéines végétales", prix: "12,50 €", image: "" },
              { nom: "Pho vegan", description: "Version 100% végétale du pho traditionnel", prix: "12,50 €", image: "" }
            ]
          },
          {
            nom: "Desserts vegan",
            plats: [
              { nom: "Riz gluant à la mangue", description: "Dessert vegan traditionnel", prix: "6,50 €", image: "" }
            ]
          }
        ]
      },
      {
        nom: "Desserts",
        image: "",
        sous_categories: [
          {
            nom: "",
            plats: [
              { nom: "Tiramisu au spéculoos", description: "Dessert maison, spécialité de la maison", prix: "6,50 €", image: "" }
            ]
          }
        ]
      },
      {
        nom: "Boissons",
        image: "",
        sous_categories: [
          {
            nom: "",
            plats: [
              { nom: "Cocktail maison", description: "La spécialité en boisson de la maison", prix: "8,00 €", image: "" }
            ]
          }
        ]
      }
    ]
  }
};

export default async () => {
  try {
    const store = getStore("site-content");
    const data = await store.get("data", { type: "json" });
    return respond(data || DEFAULT_CONTENT);
  } catch {
    // Si Blobs n'est pas encore initialisé, on renvoie simplement les valeurs par défaut.
    return respond(DEFAULT_CONTENT);
  }
};

function respond(obj) {
  return new Response(JSON.stringify(obj), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store"
    }
  });
}
