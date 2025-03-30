import { Card } from "./stores/useCardGame";

// Define card data for the game
export const allCards: Card[] = [
  // Attack Cards
  {
    id: 1,
    name: "Fireball",
    type: "attack",
    cost: 3,
    attack: 4,
    defense: 1,
    description: "Deal 4 damage to a target."
  },
  {
    id: 2,
    name: "Quick Strike",
    type: "attack",
    cost: 1,
    attack: 2,
    defense: 1,
    description: "A fast attack that can strike first."
  },
  {
    id: 3,
    name: "Meteor Shower",
    type: "attack",
    cost: 6,
    attack: 7,
    defense: 2,
    description: "Rain down destruction upon your enemies."
  },
  {
    id: 4,
    name: "Assassin's Blade",
    type: "attack",
    cost: 4,
    attack: 5,
    defense: 2,
    description: "Strike from the shadows for increased damage."
  },
  {
    id: 5,
    name: "Thunder Strike",
    type: "attack",
    cost: 5,
    attack: 6,
    defense: 2,
    description: "Call lightning to strike your opponents."
  },
  
  // Defense Cards
  {
    id: 11,
    name: "Shield Wall",
    type: "defense",
    cost: 2,
    attack: 0,
    defense: 5,
    description: "Create a defensive barrier."
  },
  {
    id: 12,
    name: "Healing Light",
    type: "defense",
    cost: 3,
    attack: 0,
    defense: 4,
    description: "Restore health to your character."
  },
  {
    id: 13,
    name: "Iron Fortress",
    type: "defense",
    cost: 5,
    attack: 1,
    defense: 8,
    description: "A nearly impenetrable defensive structure."
  },
  {
    id: 14,
    name: "Guardian Angel",
    type: "defense",
    cost: 4,
    attack: 2,
    defense: 6,
    description: "Protects you from harm and strikes back."
  },
  {
    id: 15,
    name: "Reflective Barrier",
    type: "defense",
    cost: 4,
    attack: 0,
    defense: 7,
    description: "Reflects some damage back to the attacker."
  },
  
  // Magic Cards
  {
    id: 21,
    name: "Arcane Missile",
    type: "magic",
    cost: 2,
    attack: 3,
    defense: 1,
    description: "A magical projectile that never misses."
  },
  {
    id: 22,
    name: "Mind Control",
    type: "magic",
    cost: 7,
    attack: 3,
    defense: 3,
    description: "Take control of an enemy creature temporarily."
  },
  {
    id: 23,
    name: "Frost Nova",
    type: "magic",
    cost: 3,
    attack: 2,
    defense: 2,
    description: "Freeze all enemy creatures for one turn."
  },
  {
    id: 24,
    name: "Arcane Intellect",
    type: "magic",
    cost: 3,
    attack: 1,
    defense: 2,
    description: "Draw two additional cards from your deck."
  },
  {
    id: 25,
    name: "Polymorph",
    type: "magic",
    cost: 4,
    attack: 1,
    defense: 1,
    description: "Transform an enemy creature into a 1/1 sheep."
  },
  
  // Creature Cards
  {
    id: 31,
    name: "Knight",
    type: "creature",
    cost: 3,
    attack: 3,
    defense: 3,
    description: "A well-balanced warrior."
  },
  {
    id: 32,
    name: "Dragon",
    type: "creature",
    cost: 8,
    attack: 8,
    defense: 8,
    description: "A powerful flying creature that breathes fire."
  },
  {
    id: 33,
    name: "Wolf Pack",
    type: "creature",
    cost: 4,
    attack: 5,
    defense: 2,
    description: "A group of wolves that hunt together."
  },
  {
    id: 34,
    name: "Elf Archer",
    type: "creature",
    cost: 2,
    attack: 3,
    defense: 1,
    description: "A skilled archer with precision attacks."
  },
  {
    id: 35,
    name: "Golem",
    type: "creature",
    cost: 5,
    attack: 4,
    defense: 6,
    description: "A slow but powerful construct of stone."
  },
  {
    id: 36,
    name: "Giant",
    type: "creature",
    cost: 6,
    attack: 6,
    defense: 6,
    description: "A massive creature that towers over the battlefield."
  },
  {
    id: 37,
    name: "Wizard",
    type: "creature",
    cost: 4,
    attack: 2,
    defense: 3,
    description: "A spellcaster with arcane knowledge."
  },
  {
    id: 38,
    name: "Goblin Scout",
    type: "creature",
    cost: 1,
    attack: 2,
    defense: 1,
    description: "A quick and sneaky scout."
  },
  {
    id: 39,
    name: "Serpent",
    type: "creature",
    cost: 3,
    attack: 4,
    defense: 2,
    description: "A poisonous snake with deadly venom."
  },
  {
    id: 40,
    name: "Phoenix",
    type: "creature",
    cost: 7,
    attack: 6,
    defense: 5,
    description: "A mythical bird that can be reborn from its ashes."
  }
];
