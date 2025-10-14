import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { execSync } from 'child_process';
import * as schema from './shared/schema';

async function migrateData() {
  // Baza źródłowa (Replit)
  const sourceUrl = process.env.DATABASE_URL!;
  const sourceClient = neon(sourceUrl);
  const sourceDb = drizzle(sourceClient, { schema });

  // Baza docelowa (Render) - podaj URL jako argument
  const targetUrl = process.argv[2];
  if (!targetUrl) {
    console.error('❌ Podaj URL bazy Render jako argument!');
    console.log('Użycie: tsx migrate-to-render.ts "postgresql://user:pass@host/db"');
    process.exit(1);
  }

  const targetClient = neon(targetUrl);
  const targetDb = drizzle(targetClient, { schema });

  console.log('🔄 Kopiowanie danych z Replit do Render...\n');

  try {
    // 1. Najpierw utwórz tabele na Render
    console.log('1️⃣ Tworzenie tabel na Render...');
    execSync(`DATABASE_URL="${targetUrl}" npm run db:push --force`, { stdio: 'inherit' });
    console.log('✅ Tabele utworzone\n');

    // 2. Kopiuj kategorie składników
    console.log('2️⃣ Kopiowanie kategorii składników...');
    const ingredientCategories = await sourceDb.select().from(schema.ingredientCategories);
    if (ingredientCategories.length > 0) {
      await targetDb.insert(schema.ingredientCategories).values(ingredientCategories).onConflictDoNothing();
      console.log(`✅ Skopiowano ${ingredientCategories.length} kategorii składników\n`);
    }

    // 3. Kopiuj kategorie przepisów
    console.log('3️⃣ Kopiowanie kategorii przepisów...');
    const categories = await sourceDb.select().from(schema.categories);
    if (categories.length > 0) {
      await targetDb.insert(schema.categories).values(categories).onConflictDoNothing();
      console.log(`✅ Skopiowano ${categories.length} kategorii przepisów\n`);
    }

    // 4. Kopiuj składniki
    console.log('4️⃣ Kopiowanie składników...');
    const ingredients = await sourceDb.select().from(schema.ingredients);
    if (ingredients.length > 0) {
      await targetDb.insert(schema.ingredients).values(ingredients).onConflictDoNothing();
      console.log(`✅ Skopiowano ${ingredients.length} składników\n`);
    }

    // 5. Kopiuj przepisy
    console.log('5️⃣ Kopiowanie przepisów...');
    const recipes = await sourceDb.select().from(schema.recipes);
    if (recipes.length > 0) {
      await targetDb.insert(schema.recipes).values(recipes).onConflictDoNothing();
      console.log(`✅ Skopiowano ${recipes.length} przepisów\n`);
    }

    // 6. Kopiuj składniki przepisów
    console.log('6️⃣ Kopiowanie składników przepisów...');
    const recipeIngredients = await sourceDb.select().from(schema.recipeIngredients);
    if (recipeIngredients.length > 0) {
      await targetDb.insert(schema.recipeIngredients).values(recipeIngredients).onConflictDoNothing();
      console.log(`✅ Skopiowano ${recipeIngredients.length} powiązań składnik-przepis\n`);
    }

    // 7. Kopiuj logi inwentarza
    console.log('7️⃣ Kopiowanie logów inwentarza...');
    const inventoryLogs = await sourceDb.select().from(schema.inventoryLogs);
    if (inventoryLogs.length > 0) {
      await targetDb.insert(schema.inventoryLogs).values(inventoryLogs).onConflictDoNothing();
      console.log(`✅ Skopiowano ${inventoryLogs.length} logów inwentarza\n`);
    }

    // 8. Kopiuj plany produkcji
    console.log('8️⃣ Kopiowanie planów produkcji...');
    const productionPlans = await sourceDb.select().from(schema.productionPlans);
    if (productionPlans.length > 0) {
      await targetDb.insert(schema.productionPlans).values(productionPlans).onConflictDoNothing();
      console.log(`✅ Skopiowano ${productionPlans.length} planów produkcji\n`);
    }

    // 9. Kopiuj przepisy planów produkcji
    console.log('9️⃣ Kopiowanie przepisów planów produkcji...');
    const productionPlanRecipes = await sourceDb.select().from(schema.productionPlanRecipes);
    if (productionPlanRecipes.length > 0) {
      await targetDb.insert(schema.productionPlanRecipes).values(productionPlanRecipes).onConflictDoNothing();
      console.log(`✅ Skopiowano ${productionPlanRecipes.length} przepisów planów\n`);
    }

    console.log('\n🎉 SUKCES! Wszystkie dane zostały skopiowane do Render!');
    console.log('💡 Teraz zrestartuj aplikację na Render.\n');

  } catch (error) {
    console.error('❌ Błąd podczas kopiowania:', error);
    process.exit(1);
  }
}

migrateData();
