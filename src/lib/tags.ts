import type { TagId } from "@/lib/types";

export const TAGS: { id: TagId; plain: string; hint: string; patterns: RegExp[] }[] = [
  {
    id: "ultra-processed",
    plain: "Ultra-processed",
    hint: "Packaged food with a long ingredient list",
    patterns: [/macaroni/i, /cracker/i, /instant/i, /ramen/i, /frozen pizza/i, /soda/i, /chips/i, /nugget/i, /hot dog/i, /processed cheese/i],
  },
  {
    id: "high-sodium",
    plain: "High sodium",
    hint: "Salty, brined, or broth-heavy",
    patterns: [/salt/i, /soy sauce/i, /broth/i, /deli/i, /bacon/i, /cracker/i, /canned soup/i, /ramen/i, /chips/i],
  },
  {
    id: "added-sugar",
    plain: "Added sugar",
    hint: "Sweets, soda, or sugary sauces",
    patterns: [/soda/i, /candy/i, /cookie/i, /cake/i, /syrup/i, /sweet/i, /sugar/i, /ice cream/i],
  },
  {
    id: "alcohol",
    plain: "Alcohol",
    hint: "Beer, wine, or spirits",
    patterns: [/beer/i, /wine/i, /cocktail/i, /vodka/i, /whiskey/i, /alcohol/i],
  },
  {
    id: "caffeine",
    plain: "Caffeine",
    hint: "Coffee, tea, or energy drinks",
    patterns: [/coffee/i, /espresso/i, /caffeine/i, /energy drink/i, /\btea\b/i],
  },
  {
    id: "dairy",
    plain: "Dairy",
    hint: "Milk, cheese, or yogurt",
    patterns: [/milk/i, /cheese/i, /yogurt/i, /cream/i, /butter/i],
  },
  {
    id: "gluten-containing grains",
    plain: "Gluten-containing grains",
    hint: "Wheat, barley, or rye",
    patterns: [/wheat/i, /bread/i, /pasta/i, /macaroni/i, /cracker/i, /ramen/i, /barley/i, /flour/i],
  },
  {
    id: "nightshade vegetables",
    plain: "Nightshade vegetables",
    hint: "Tomato, potato, pepper, or eggplant",
    patterns: [/tomato/i, /potato/i, /pepper/i, /eggplant/i, /salsa/i, /paprika/i],
  },
  {
    id: "high-fiber",
    plain: "High fiber",
    hint: "Beans, oats, vegetables, or fruit",
    patterns: [/oat/i, /bean/i, /broccoli/i, /lentil/i, /berr/i, /apple/i, /rice/i, /lettuce/i, /salad/i],
  },
  {
    id: "omega-3",
    plain: "Omega-3 source",
    hint: "Fatty fish, walnuts, or flax",
    patterns: [/salmon/i, /sardine/i, /walnut/i, /flax/i, /mackerel/i],
  },
  {
    id: "fermented",
    plain: "Fermented",
    hint: "Yogurt, kefir, kimchi, or miso",
    patterns: [/yogurt/i, /kefir/i, /kimchi/i, /miso/i, /sauerkraut/i],
  },
  {
    id: "leafy-greens",
    plain: "Leafy greens",
    hint: "Spinach, kale, or lettuce",
    patterns: [/spinach/i, /kale/i, /lettuce/i, /arugula/i, /greens/i],
  },
  {
    id: "fried",
    plain: "Fried",
    hint: "Deep fried or pan fried",
    patterns: [/fried/i, /nugget/i, /tempura/i, /french fries/i],
  },
  {
    id: "spicy",
    plain: "Spicy",
    hint: "Chili or hot sauce",
    patterns: [/chili/i, /spicy/i, /hot sauce/i, /jalape/i, /sriracha/i],
  },
];

const TAG_IDS = new Set(TAGS.map((tag) => tag.id));

export function isTagId(value: string): value is TagId {
  return TAG_IDS.has(value as TagId);
}

export function tagPlain(id: string): string {
  return TAGS.find((tag) => tag.id === id)?.plain ?? id;
}
