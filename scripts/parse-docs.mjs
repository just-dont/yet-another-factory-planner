import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parseDocs from 'satisfactory-docs-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const DOCS_PATH = path.join(ROOT_DIR, 'data/Docs_U5.json');
const OUTPUT_DIR = path.join(ROOT_DIR, 'src/data/json');

const data = parseDocs(fs.readFileSync(DOCS_PATH));

const buildings = {};
Object.entries(data.buildables).forEach(([buildingKey, buildingData]) => {
  if (!(buildingData.isProduction || buildingData.isGenerator || buildingData.isResourceExtractor)) {
    return;
  }
  let power = 0;
  if (buildingData.meta.generatorInfo) {
    power = -buildingData.meta.generatorInfo.powerProduction;
  } else if (buildingData.meta.powerInfo) {
    power = buildingData.meta.powerInfo.consumption;
  }

  let area = 0;
  if (buildingData.meta.size) {
    const { length, width } = buildingData.meta.size;
    area = length * width;
  }

  let buildCost = [];
  const recipeData = Object.values(data.buildableRecipes).find((br) => br.product === buildingKey);
  if (recipeData) {
    buildCost = recipeData.ingredients;
  } else {
    console.warn(`BUILDING ${buildingKey} HAS NO BUILD COST`);
  }

  buildings[buildingKey] = {
    slug: buildingData.slug.replaceAll('-', '_'),
    name: buildingData.name,
    power,
    area,
    buildCost,
    isFicsmas: buildingData.event === 'FICSMAS',
  }
});

const recipes = {};
Object.entries((data.productionRecipes)).forEach(([recipeKey, recipeData]) => {
  if (!recipeData.producedIn) {
    return;
  }
  const craftTime = recipeData.craftTime;
  const ingredients = recipeData.ingredients.map(({ itemClass, quantity }) => {
    const perMinute = 60 * quantity / craftTime;
    return {
      itemClass,
      perMinute,
    };
  });
  const products = recipeData.products.map(({ itemClass, quantity }) => {
    const perMinute = 60 * quantity / craftTime;
    return {
      itemClass,
      perMinute,
    };
  });

  recipes[recipeKey] = {
    slug: recipeData.slug.replaceAll('-', '_'),
    name: recipeData.name,
    isAlternate: recipeData.isAlternate,
    ingredients,
    products,
    producedIn: recipeData.producedIn,
    isFicsmas: recipeData.event === 'FICSMAS',
  };
});

recipes['Recipe_CUSTOM_NuclearPower_C'] = {
  slug: 'uranium_power_recipe',
  name: 'Uranium Power',
  isAlternate: false,
  ingredients: [{ itemClass: 'Desc_NuclearFuelRod_C', perMinute: 0.2 }, { itemClass: 'Desc_Water_C', perMinute: 300 }],
  products: [{ itemClass: 'Desc_NuclearWaste_C', perMinute: 10 }],
  producedIn: 'Desc_GeneratorNuclear_C',
  isFicsmas: false,
};
recipes['Recipe_CUSTOM_PlutoniumPower_C'] = {
  slug: 'plutonium_power_recipe',
  name: 'Plutonium Power',
  isAlternate: false,
  ingredients: [{ itemClass: 'Desc_PlutoniumFuelRod_C', perMinute: 0.1 }, { itemClass: 'Desc_Water_C', perMinute: 300 }],
  products: [{ itemClass: 'Desc_PlutoniumWaste_C', perMinute: 1 }],
  producedIn: 'Desc_GeneratorNuclear_C',
  isFicsmas: false,
};

const resources = {};
let maxExtraction = 0;
Object.entries(data.resources).forEach(([resourceKey, resourceData]) => {
  if (resourceData.maxExtraction !== Infinity) {
    if (resourceData.maxExtraction > maxExtraction) {
      maxExtraction = resourceData.maxExtraction;
    }
  }
  resources[resourceKey] = {
    itemClass: resourceData.itemClass,
    maxExtraction: resourceData.maxExtraction,
    relativeValue: 1,
  };
});

Object.entries(resources).forEach(([resourceKey, resourceData]) => {
  if (resourceData.maxExtraction && resourceData.maxExtraction !== Infinity) {
    resourceData.relativeValue = Math.floor(maxExtraction / resourceData.maxExtraction * 100);
  }
});

const items = {};
const handGatheredItems = {};
Object.entries(data.items).forEach(([itemKey, itemData]) => {
  const usedInRecipes = [];
  const producedFromRecipes = [];
  Object.entries(recipes).forEach(([recipeKey, recipeData]) => {
    if (recipeData.ingredients.find((i) => i.itemClass === itemKey)) {
      usedInRecipes.push(recipeKey);
    }
    if (recipeData.products.find((p) => p.itemClass === itemKey)) {
      producedFromRecipes.push(recipeKey);
    }
  });

  if (usedInRecipes.length === 0 && producedFromRecipes.length === 0) return;
  if (producedFromRecipes.length === 0 && !resources[itemKey]) {
    handGatheredItems[itemKey] = itemKey;
  }
  items[itemKey] = {
    slug: itemData.slug.replaceAll('-', '_'),
    name: itemData.name,
    sinkPoints: itemData.isFluid ? 0 : itemData.sinkPoints,
    usedInRecipes,
    producedFromRecipes,
    isFicsmas: itemData.event === 'FICSMAS',
  };
});

writeFileSafe(path.join(OUTPUT_DIR, 'buildings.json'), buildings);
writeFileSafe(path.join(OUTPUT_DIR, 'recipes.json'), recipes);
writeFileSafe(path.join(OUTPUT_DIR, 'resources.json'), resources);
writeFileSafe(path.join(OUTPUT_DIR, 'items.json'), items);
writeFileSafe(path.join(OUTPUT_DIR, 'handGatheredItems.json'), handGatheredItems);

function writeFileSafe(filePath, data) {
  const json = JSON.stringify(data, null, 2);
  const pathInfo = path.parse(filePath);
  fs.mkdirSync(pathInfo.dir, { recursive: true });
  fs.writeFileSync(filePath, json);
}
