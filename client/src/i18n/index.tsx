import { createContext, ReactNode, useContext, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

export type Language = "pl" | "en";
export type TranslationValue = string | ((values: Record<string, string | number>) => string);

const pl: Record<string, TranslationValue> = {
  "nav.dashboard": "Pulpit", "nav.recipes": "Przepisy", "nav.ingredients": "Składniki",
  "nav.calculator": "Kalkulator", "nav.productionPlan": "Plan produkcji", "nav.inventory": "Magazyn",
  "nav.reports": "Raporty", "nav.ai": "Asystent AI", "nav.users": "Użytkownicy", "nav.admin": "Admin",
  "auth.logout": "Wyloguj się", "role.admin": "Administrator", "role.employee": "Pracownik",
  "common.save": "Zapisz", "common.saving": "Zapisywanie...", "common.error": "Błąd", "common.cancel": "Anuluj", "common.edit": "Edytuj", "common.delete": "Usuń", "common.close": "Zamknij",
  "ingredients.namePlaceholder": "np. Mąka pszenna typ 500", "ingredients.pricePlaceholder": "np. 3,50", "ingredients.selectCategory": "Wybierz kategorię",
  "ingredientCategories.title": "Zarządzanie kategoriami", "ingredientCategories.subtitle": "Twórz, edytuj i porządkuj kategorie składników.", "ingredientCategories.manage": "Zarządzaj kategoriami", "ingredientCategories.categories": "Kategorie", "ingredientCategories.add": "Dodaj kategorię", "ingredientCategories.edit": "Edytuj kategorię", "ingredientCategories.create": "Utwórz kategorię", "ingredientCategories.name": "Nazwa", "ingredientCategories.namePlaceholder": "np. Mąki, przyprawy, nabiał", "ingredientCategories.description": "Opis (opcjonalnie)", "ingredientCategories.descriptionPlaceholder": "Krótki opis kategorii", "ingredientCategories.yourCategories": "Twoje kategorie", "ingredientCategories.empty": "Nie masz jeszcze kategorii. Utwórz pierwszą powyżej.", "ingredientCategories.assignedCount": ({ count }) => `${count} ${count === 1 ? "przypisany składnik" : "przypisanych składników"}`, "ingredientCategories.created": "Kategoria utworzona", "ingredientCategories.createdDescription": "Kategoria składników jest gotowa do użycia.", "ingredientCategories.updated": "Kategoria zaktualizowana", "ingredientCategories.updatedDescription": "Zmiany w kategorii zostały zapisane.", "ingredientCategories.createFailed": "Nie udało się utworzyć kategorii.", "ingredientCategories.updateFailed": "Nie udało się zaktualizować kategorii.", "ingredientCategories.deleteTitle": "Usunąć kategorię?", "ingredientCategories.deleteDescription": ({ name, count }) => `Kategoria „${name}” ma przypisanych składników: ${count}. Wybierz, co zrobić z tymi składnikami. Tej operacji nie można cofnąć.`, "ingredientCategories.reassignLabel": "Po usunięciu przenieś składniki do", "ingredientCategories.noCategory": "Bez kategorii", "ingredientCategories.noCategoryHelp": "Przypisane składniki pozostaną bez kategorii.", "ingredientCategories.reassignHelp": "Przypisane składniki zostaną przeniesione do wybranej kategorii.", "ingredientCategories.deleting": "Usuwanie...", "ingredientCategories.deleted": "Kategoria usunięta", "ingredientCategories.deletedDescription": "Kategoria i przypisania składników zostały zaktualizowane.", "ingredientCategories.deleteFailed": "Nie udało się usunąć kategorii.",
  "login.tagline": "Profesjonalny system zarządzania recepturami", "login.signIn": "Zaloguj się",
  "login.createAccount": "Utwórz konto", "login.welcome": "Witaj ponownie",
  "login.continue": "Zaloguj się, aby kontynuować pracę", "login.username": "Nazwa użytkownika",
  "login.password": "Hasło", "login.enterUsername": "Wpisz nazwę użytkownika",
  "login.enterPassword": "Wpisz hasło", "login.loggingIn": "Logowanie...",
  "login.registerDescription": "Zarejestruj się, aby zarządzać przepisami",
  "login.name": "Imię i nazwisko", "login.optional": "opcjonalnie",
  "login.chooseUsername": "Wybierz nazwę użytkownika", "login.minPassword": "Minimum 6 znaków",
  "login.creatingAccount": "Tworzenie konta...", "login.invalidCredentials": "Nieprawidłowa nazwa użytkownika lub hasło",
  "login.loginFailed": "Nie udało się zalogować", "login.loginError": "Błąd logowania",
  "login.passwordShort": "Hasło za krótkie", "login.passwordMin": "Hasło musi mieć co najmniej 6 znaków",
  "login.usernameTaken": "Ta nazwa użytkownika jest już zajęta", "login.registrationFailed": "Rejestracja nie powiodła się",
  "login.registrationError": "Błąd rejestracji", "login.footer": "System recepturowy",
  "settings.title": "Ustawienia konta", "settings.subtitle": "Zarządzaj profilem i preferencjami aplikacji",
  "settings.profile": "Dane profilu", "settings.profileDescription": "Zmień swoje imię i nazwisko wyświetlane w aplikacji",
  "settings.displayName": "Imię i nazwisko", "settings.displayNamePlaceholder": "Twoje imię i nazwisko",
  "settings.displayNameHelp": "Ta nazwa jest widoczna w pasku bocznym i panelu admina",
  "settings.username": "Nazwa użytkownika (login)", "settings.usernameHelp": "Login można zmienić tylko przez administratora",
  "settings.saveProfile": "Zapisz dane", "settings.profileUpdated": "Profil zaktualizowany",
  "settings.profileUpdateFailed": "Nie udało się zaktualizować profilu", "settings.language": "Język",
  "settings.languageDescription": "Wybierz język interfejsu aplikacji", "settings.languageUpdated": "Język zaktualizowany",
  "settings.languageUpdateFailed": "Nie udało się zaktualizować języka", "settings.polish": "Polski", "settings.english": "English",
  "settings.changePassword": "Zmiana hasła", "settings.changePasswordDescription": "Ustaw nowe hasło do swojego konta",
  "settings.currentPassword": "Aktualne hasło", "settings.newPassword": "Nowe hasło", "settings.repeatPassword": "Powtórz nowe hasło",
  "settings.enterCurrentPassword": "Wpisz aktualne hasło", "settings.enterNewPassword": "Wpisz nowe hasło",
  "settings.passwordChanged": "Hasło zmienione pomyślnie", "settings.changePasswordFailed": "Nie udało się zmienić hasła",
  "settings.passwordsDiffer": "Nowe hasła nie są identyczne", "settings.passwordMin": "Hasło musi mieć min. 6 znaków",
  "settings.changing": "Zmieniam...", "settings.about": "O aplikacji", "settings.aboutDescription": "System zarządzania recepturami",
  "settings.version": "Wersja", "settings.loggedInAs": "Zalogowano jako",
  "error.title": "Coś poszło nie tak", "error.refresh": "Odśwież stronę",
  "notFound.title": "404 — Nie znaleziono strony", "notFound.description": "Ta strona nie istnieje.",
  "calculator.title": "Kalkulatory", "calculator.subtitle": "Narzędzia do przeliczania porcji, kosztów i jednostek",
  "calculator.recipeScale": "Skaler przepisu", "calculator.recipeScaleDescription": "Przelicz przepis na dowolną wagę z precyzyjnymi ilościami składników",
  "calculator.recipeScaleHelp": "Wybierz przepis i docelową wagę, aby automatycznie wyliczyć proporcje składników.",
  "calculator.portions": "Kalkulator porcji", "calculator.originalYield": "Wydajność oryginalna", "calculator.targetYield": "Wydajność docelowa",
  "calculator.scalingFactor": "Współczynnik skalowania", "calculator.calculatePortions": "Oblicz porcje",
  "calculator.cost": "Kalkulator kosztów", "calculator.selectRecipe": "Wybierz przepis", "calculator.totalCost": "Koszt całkowity:",
  "calculator.costPerServing": "Koszt za porcję:", "calculator.calculating": "Obliczanie...", "calculator.calculateCost": "Oblicz koszt",
  "calculator.converter": "Przelicznik jednostek", "calculator.from": "Z", "calculator.to": "Na", "calculator.convert": "Przelicz",
  "calculator.yield": "Kalkulator wydajności", "calculator.batchSize": "Liczba sztuk / porcji", "calculator.portionWeight": "Waga porcji (g)",
  "calculator.totalYield": "Łączna wydajność", "calculator.calculateYield": "Oblicz wydajność",
  "recipe.vegan": "Wegański", "recipe.glutenFree": "Bez glutenu", "recipe.lactoseFree": "Bez laktozy", "recipe.allergens": "Alergeny",
  "recipe.ingredientOne": "składnik", "recipe.ingredientFew": "składniki", "recipe.ingredientMany": "składników",
  "dashboard.title": "Pulpit", "dashboard.subtitle": "Witaj! Oto co dzieje się w Twojej kuchni.", "dashboard.lowStock": "Niski stan",
  "dashboard.categories": "Kategorie", "dashboard.recentRecipes": "Ostatnie przepisy", "dashboard.all": "Wszystkie",
  "dashboard.noRecipes": "Brak przepisów — dodaj swój pierwszy!", "dashboard.noCategory": "Bez kategorii", "dashboard.servings": "porcji",
  "dashboard.inventoryAlerts": "Alerty magazynowe", "dashboard.inventoryNormal": "Wszystkie stany magazynowe są w normie",
  "dashboard.expired": "Termin ważności minął", "dashboard.belowMinimum": "Poniżej minimum", "dashboard.low": "Niski stan",
  "dashboard.recipeLibrary": "Biblioteka przepisów",
};
const en: Record<string, TranslationValue> = {
  "nav.dashboard": "Dashboard", "nav.recipes": "Recipes", "nav.ingredients": "Ingredients",
  "nav.calculator": "Calculator", "nav.productionPlan": "Production plan", "nav.inventory": "Inventory",
  "nav.reports": "Reports", "nav.ai": "AI Assistant", "nav.users": "Users", "nav.admin": "Admin",
  "auth.logout": "Log out", "role.admin": "Administrator", "role.employee": "Employee",
  "common.save": "Save", "common.saving": "Saving...", "common.error": "Error", "common.cancel": "Cancel", "common.edit": "Edit", "common.delete": "Delete", "common.close": "Close",
  "ingredients.namePlaceholder": "e.g. Type 500 wheat flour", "ingredients.pricePlaceholder": "e.g. 3.50", "ingredients.selectCategory": "Select a category",
  "ingredientCategories.title": "Manage categories", "ingredientCategories.subtitle": "Create, edit, and organize ingredient categories.", "ingredientCategories.manage": "Manage categories", "ingredientCategories.categories": "Categories", "ingredientCategories.add": "Add category", "ingredientCategories.edit": "Edit category", "ingredientCategories.create": "Create category", "ingredientCategories.name": "Name", "ingredientCategories.namePlaceholder": "e.g. Flour, spices, dairy", "ingredientCategories.description": "Description (optional)", "ingredientCategories.descriptionPlaceholder": "A short category description", "ingredientCategories.yourCategories": "Your categories", "ingredientCategories.empty": "You do not have any categories yet. Create your first one above.", "ingredientCategories.assignedCount": ({ count }) => `${count} assigned ${count === 1 ? "ingredient" : "ingredients"}`, "ingredientCategories.created": "Category created", "ingredientCategories.createdDescription": "The ingredient category is ready to use.", "ingredientCategories.updated": "Category updated", "ingredientCategories.updatedDescription": "Category changes have been saved.", "ingredientCategories.createFailed": "Could not create the category.", "ingredientCategories.updateFailed": "Could not update the category.", "ingredientCategories.deleteTitle": "Delete category?", "ingredientCategories.deleteDescription": ({ name, count }) => `“${name}” has ${count} assigned ingredients. Choose what happens to those ingredients. This action cannot be undone.`, "ingredientCategories.reassignLabel": "Move ingredients after deletion to", "ingredientCategories.noCategory": "No category", "ingredientCategories.noCategoryHelp": "Assigned ingredients will remain uncategorized.", "ingredientCategories.reassignHelp": "Assigned ingredients will move to the selected category.", "ingredientCategories.deleting": "Deleting...", "ingredientCategories.deleted": "Category deleted", "ingredientCategories.deletedDescription": "The category and ingredient assignments have been updated.", "ingredientCategories.deleteFailed": "Could not delete the category.",
  "login.tagline": "Professional recipe management system", "login.signIn": "Sign in",
  "login.createAccount": "Create account", "login.welcome": "Welcome back",
  "login.continue": "Sign in to continue working", "login.username": "Username", "login.password": "Password",
  "login.enterUsername": "Enter your username", "login.enterPassword": "Enter your password",
  "login.loggingIn": "Signing in...", "login.registerDescription": "Register to manage recipes",
  "login.name": "Full name", "login.optional": "optional", "login.chooseUsername": "Choose a username",
  "login.minPassword": "At least 6 characters", "login.creatingAccount": "Creating account...",
  "login.invalidCredentials": "Invalid username or password", "login.loginFailed": "Sign-in failed",
  "login.loginError": "Sign-in error", "login.passwordShort": "Password too short",
  "login.passwordMin": "Password must be at least 6 characters", "login.usernameTaken": "This username is already taken",
  "login.registrationFailed": "Registration failed", "login.registrationError": "Registration error", "login.footer": "Recipe management system",
  "settings.title": "Account settings", "settings.subtitle": "Manage your profile and application preferences",
  "settings.profile": "Profile details", "settings.profileDescription": "Change the name displayed in the application",
  "settings.displayName": "Full name", "settings.displayNamePlaceholder": "Your full name",
  "settings.displayNameHelp": "This name is visible in the sidebar and admin panel",
  "settings.username": "Username (login)", "settings.usernameHelp": "Only an administrator can change the username",
  "settings.saveProfile": "Save details", "settings.profileUpdated": "Profile updated",
  "settings.profileUpdateFailed": "Could not update profile", "settings.language": "Language",
  "settings.languageDescription": "Choose the application interface language", "settings.languageUpdated": "Language updated",
  "settings.languageUpdateFailed": "Could not update language", "settings.polish": "Polski", "settings.english": "English",
  "settings.changePassword": "Change password", "settings.changePasswordDescription": "Set a new password for your account",
  "settings.currentPassword": "Current password", "settings.newPassword": "New password", "settings.repeatPassword": "Repeat new password",
  "settings.enterCurrentPassword": "Enter current password", "settings.enterNewPassword": "Enter new password",
  "settings.passwordChanged": "Password changed successfully", "settings.changePasswordFailed": "Could not change password",
  "settings.passwordsDiffer": "New passwords do not match", "settings.passwordMin": "Password must have at least 6 characters",
  "settings.changing": "Changing...", "settings.about": "About", "settings.aboutDescription": "Recipe management system",
  "settings.version": "Version", "settings.loggedInAs": "Signed in as",
  "error.title": "Something went wrong", "error.refresh": "Refresh page",
  "notFound.title": "404 — Page not found", "notFound.description": "This page does not exist.",
  "calculator.title": "Calculators", "calculator.subtitle": "Tools for calculating portions, costs, and units",
  "calculator.recipeScale": "Recipe scaler", "calculator.recipeScaleDescription": "Scale a recipe to any weight with precise ingredient quantities",
  "calculator.recipeScaleHelp": "Select a recipe and target weight to automatically calculate ingredient proportions.",
  "calculator.portions": "Portion calculator", "calculator.originalYield": "Original yield", "calculator.targetYield": "Target yield",
  "calculator.scalingFactor": "Scaling factor", "calculator.calculatePortions": "Calculate portions",
  "calculator.cost": "Cost calculator", "calculator.selectRecipe": "Select recipe", "calculator.totalCost": "Total cost:",
  "calculator.costPerServing": "Cost per serving:", "calculator.calculating": "Calculating...", "calculator.calculateCost": "Calculate cost",
  "calculator.converter": "Unit converter", "calculator.from": "From", "calculator.to": "To", "calculator.convert": "Convert",
  "calculator.yield": "Yield calculator", "calculator.batchSize": "Number of items / servings", "calculator.portionWeight": "Portion weight (g)",
  "calculator.totalYield": "Total yield", "calculator.calculateYield": "Calculate yield",
  "recipe.vegan": "Vegan", "recipe.glutenFree": "Gluten-free", "recipe.lactoseFree": "Lactose-free", "recipe.allergens": "Allergens",
  "recipe.ingredientOne": "ingredient", "recipe.ingredientFew": "ingredients", "recipe.ingredientMany": "ingredients",
  "dashboard.title": "Dashboard", "dashboard.subtitle": "Welcome! Here's what's happening in your kitchen.", "dashboard.lowStock": "Low stock",
  "dashboard.categories": "Categories", "dashboard.recentRecipes": "Recent recipes", "dashboard.all": "All",
  "dashboard.noRecipes": "No recipes — add your first one!", "dashboard.noCategory": "Uncategorized", "dashboard.servings": "servings",
  "dashboard.inventoryAlerts": "Inventory alerts", "dashboard.inventoryNormal": "All inventory levels are normal",
  "dashboard.expired": "Expired", "dashboard.belowMinimum": "Below minimum", "dashboard.low": "Low stock",
  "dashboard.recipeLibrary": "Recipe library",
};
const resources = { pl, en };
pl["recipes.title"] = "Przepisy"; pl["recipes.subtitle"] = "Zarządzaj i organizuj przepisy"; pl["recipes.new"] = "Nowy przepis";
pl["recipes.search"] = "Szukaj przepisów..."; pl["recipes.allCategories"] = "Wszystkie kategorie"; pl["recipes.none"] = "Brak przepisów";
pl["recipes.adjustFilters"] = "Spróbuj zmienić wyszukiwanie lub filtr"; pl["recipes.addFirst"] = "Zacznij od dodania pierwszego przepisu"; pl["recipes.add"] = "Dodaj przepis";
pl["recipes.deleted"] = "Przepis usunięty"; pl["recipes.deleteFailed"] = "Nie udało się usunąć przepisu."; pl["recipes.category"] = "Kategoria";
pl["recipes.ingredients"] = "Składniki"; pl["recipes.actions"] = "Akcje"; pl["recipes.preview"] = "Podgląd"; pl["recipes.delete"] = "Usuń";
pl["recipes.cancel"] = "Anuluj"; pl["recipes.deleteTitle"] = "Usuń przepis"; pl["recipes.scale"] = "Skaluj przepis"; pl["recipes.edit"] = "Edytuj przepis";
en["recipes.title"] = "Recipes"; en["recipes.subtitle"] = "Manage and organize recipes"; en["recipes.new"] = "New recipe";
en["recipes.search"] = "Search recipes..."; en["recipes.allCategories"] = "All categories"; en["recipes.none"] = "No recipes";
en["recipes.adjustFilters"] = "Try changing the search or filter"; en["recipes.addFirst"] = "Start by adding your first recipe"; en["recipes.add"] = "Add recipe";
en["recipes.deleted"] = "Recipe deleted"; en["recipes.deleteFailed"] = "Could not delete recipe."; en["recipes.category"] = "Category";
en["recipes.ingredients"] = "Ingredients"; en["recipes.actions"] = "Actions"; en["recipes.preview"] = "Preview"; en["recipes.delete"] = "Delete";
en["recipes.cancel"] = "Cancel"; en["recipes.deleteTitle"] = "Delete recipe"; en["recipes.scale"] = "Scale recipe"; en["recipes.edit"] = "Edit recipe";
Object.assign(pl, {
  "recipes.filteredCount": ({ filtered, total }) => `${filtered} z ${total}`,
  "recipes.totalCost": "Koszt całkowity", "recipes.costPerKg": "Koszt / kg", "recipes.totalWeight": "Waga łączna",
  "recipes.instructions": "Sposób wykonania", "recipes.nutritionPer100g": "Wartości odżywcze (na 100g)",
  "recipes.calories": "Kcal", "recipes.protein": "Białko", "recipes.fat": "Tłuszcze", "recipes.carbs": "Węgl.",
  "recipes.glutenFreeShort": "Bez gl.", "recipes.lactoseFreeShort": "Bez lak.", "recipes.diet": "Dieta",
  "recipes.ingredientsShort": "skł.", "recipes.deleteDescription": ({ name }) => `Usunąć „${name}”? Tej operacji nie można cofnąć.`
} satisfies Record<string, TranslationValue>);
Object.assign(en, {
  "recipes.filteredCount": ({ filtered, total }) => `${filtered} of ${total}`,
  "recipes.totalCost": "Total cost", "recipes.costPerKg": "Cost / kg", "recipes.totalWeight": "Total weight",
  "recipes.instructions": "Instructions", "recipes.nutritionPer100g": "Nutrition facts (per 100g)",
  "recipes.calories": "Kcal", "recipes.protein": "Protein", "recipes.fat": "Fat", "recipes.carbs": "Carbs",
  "recipes.glutenFreeShort": "Gluten-free", "recipes.lactoseFreeShort": "Lactose-free", "recipes.diet": "Diet",
  "recipes.ingredientsShort": "ing.", "recipes.deleteDescription": ({ name }) => `Delete “${name}”? This action cannot be undone.`
} satisfies Record<string, TranslationValue>);
Object.assign(pl, {
  "settings.currentPasswordInvalid": "Aktualne hasło jest nieprawidłowe", "settings.newPasswordPlaceholder": "Min. 6 znaków", "settings.repeatNewPassword": "Wpisz nowe hasło ponownie",
  "ingredients.title": "Zarządzanie składnikami", "ingredients.subtitle": "Śledź stany magazynowe, koszty i dostawców", "ingredients.fillNutritionTitle": "Uzupełnij wartości odżywcze AI dla wszystkich składników", "ingredients.aiFilling": "AI uzupełnia...", "ingredients.done": "Gotowe", "ingredients.aiNutrition": "AI: wartości odżywcze", "ingredients.nutritionComplete": "Wszystkie składniki mają już wartości odżywcze", "ingredients.nutritionUpdated": ({ updated, total }) => `Uzupełniono ${updated} z ${total} składników`, "ingredients.nutritionErrors": ({ errors }) => `Nie udało się: ${errors}`, "ingredients.aiError": "Błąd AI", "ingredients.nutritionFailed": "Nie udało się uzupełnić wartości odżywczych", "ingredients.deleted": "Składnik usunięty", "ingredients.deletedDescription": "Składnik został usunięty pomyślnie.", "ingredients.deleteFailed": "Nie udało się usunąć składnika. Może być używany w przepisach.", "ingredients.stockLow": "Mały zapas", "ingredients.stockExpired": "Przeterminowane", "ingredients.stockOk": "OK", "ingredients.search": "Szukaj składników...", "ingredients.empty": "Brak składników", "ingredients.adjustSearch": "Spróbuj zmienić wyszukiwanie", "ingredients.addFirst": "Zacznij od dodania pierwszego składnika", "ingredients.add": "Dodaj składnik", "ingredients.name": "Składnik", "ingredients.category": "Kategoria", "ingredients.pricePerKg": "Cena/kg", "ingredients.stock": "Stan", "ingredients.minimumStock": "Min. stan", "ingredients.status": "Status", "ingredients.supplier": "Dostawca", "ingredients.deleteTitle": "Usuń składnik", "ingredients.deleteDescription": ({ name }) => `Usunąć „${name}”? Tej operacji nie można cofnąć. Może to wpłynąć na przepisy korzystające z tego składnika.`, "ingredients.deleting": "Usuwanie...",
  "ingredientForm.enterName": "Wprowadź nazwę", "ingredientForm.enterNameDescription": "Wpisz nazwę składnika, aby AI mogło go wyszukać.", "ingredientForm.aiFilled": "AI uzupełniło dane!", "ingredientForm.aiFound": ({ name }) => `Znaleziono informacje o: ${name}`, "ingredientForm.aiFailed": "Nie udało się pobrać danych z AI. Spróbuj ponownie.", "ingredientForm.updated": "Składnik zaktualizowany", "ingredientForm.created": "Składnik dodany", "ingredientForm.updatedDescription": "Składnik został pomyślnie zaktualizowany.", "ingredientForm.createdDescription": "Składnik został pomyślnie dodany.", "ingredientForm.updateFailed": "Nie udało się zaktualizować składnika.", "ingredientForm.createFailed": "Nie udało się dodać składnika.", "ingredientForm.edit": "Edytuj składnik", "ingredientForm.add": "Dodaj nowy składnik", "ingredientForm.adding": "Dodawanie...", "ingredientForm.update": "Zaktualizuj składnik", "ingredientForm.name": "Nazwa składnika", "ingredientForm.aiFill": "Wypełnij dane za pomocą AI", "ingredientForm.pricePerKg": "Cena za kg (PLN)", "ingredientForm.supplierPlaceholder": "np. Młyny Polskie", "ingredientForm.dietaryProperties": "Właściwości dietetyczne", "ingredientForm.scalingParameters": "Parametry skalowania (opcjonalnie)", "ingredientForm.density": "Gęstość (g/ml)", "ingredientForm.densityPlaceholder": "np. 1.000 woda, 0.915 olej", "ingredientForm.densityHelp": "Do przeliczania ml/l na gramy przy skalowaniu przepisu", "ingredientForm.pieceWeight": "Masa sztuki (g)", "ingredientForm.pieceWeightPlaceholder": "np. 60 jajko duże, 2 migdał", "ingredientForm.pieceWeightHelp": "Do przeliczania sztuk na gramy przy skalowaniu przepisu", "ingredientForm.nutrition": "Wartości odżywcze (na 100g)", "ingredientForm.calories": "Kalorie (kcal)", "ingredientForm.protein": "Białko (g)", "ingredientForm.fat": "Tłuszcz (g)", "ingredientForm.carbs": "Węglowodany (g)", "ingredientForm.fiber": "Błonnik (g)", "ingredientForm.currentStock": "Stan magazynowy (kg)", "ingredientForm.minimumStock": "Min. stan (kg)", "ingredientForm.expiryDate": "Data ważności",
  "ingredientForm.dialogDescription": "Uzupełnij dane składnika, jego cenę, kategorię i właściwości.",
  "recipeCategories.add": "Dodaj kategorię przepisów", "recipeCategories.dialogDescription": "Utwórz kategorię ułatwiającą organizację receptur.", "recipeCategories.adding": "Dodawanie...", "recipeCategories.name": "Nazwa kategorii", "recipeCategories.namePlaceholder": "np. Ciasta drożdżowe", "recipeCategories.description": "Opis (opcjonalnie)", "recipeCategories.descriptionPlaceholder": "Opis kategorii przepisów...", "recipeCategories.created": "Kategoria dodana", "recipeCategories.createdDescription": "Kategoria przepisów została dodana pomyślnie.", "recipeCategories.createFailed": "Nie udało się dodać kategorii przepisów.",
  "recipeForm.edit": "Edytuj przepis", "recipeForm.add": "Dodaj nowy przepis", "recipeForm.dialogDescription": "Uzupełnij recepturę, składniki, proporcje i instrukcje wykonania.", "recipeForm.adding": "Dodawanie...", "recipeForm.update": "Zaktualizuj przepis", "recipeForm.updated": "Przepis zaktualizowany", "recipeForm.created": "Przepis dodany", "recipeForm.updatedDescription": "Przepis został pomyślnie zaktualizowany.", "recipeForm.createdDescription": "Przepis został pomyślnie dodany.", "recipeForm.updateFailed": "Nie udało się zaktualizować przepisu.", "recipeForm.createFailed": "Nie udało się dodać przepisu.", "recipeForm.name": "Nazwa przepisu", "recipeForm.namePlaceholder": "np. Sernik krakowski", "recipeForm.selectCategory": "Wybierz kategorię", "recipeForm.noCategory": "Bez kategorii", "recipeForm.description": "Opis (opcjonalnie)", "recipeForm.descriptionPlaceholder": "Opis przepisu...", "recipeForm.totalYield": "Całkowita wydajność (g) — opcjonalnie", "recipeForm.totalYieldPlaceholder": "np. 1200 (końcowa masa gotowego wyrobu)", "recipeForm.totalYieldHelp": "Używane jako zapasowa wartość przy skalowaniu przepisu", "recipeForm.instructions": "Instrukcje (opcjonalnie)", "recipeForm.addStep": "Dodaj krok", "recipeForm.stepPlaceholder": ({ step }) => `Krok ${step} — opisz co należy zrobić...`, "recipeForm.noSteps": "Nie dodano jeszcze żadnych kroków.", "recipeForm.selectIngredient": "Wybierz składnik", "recipeForm.pieces": "szt.", "recipeForm.noIngredients": "Nie dodano jeszcze żadnych składników.", "recipeForm.analysis": "Analiza przepisu", "recipeForm.totalCost": ({ cost }) => `${cost} PLN łącznie`, "recipeForm.totalWeight": ({ weight }) => `Łączna masa: ${weight}g`, "recipeForm.ingredientBreakdown": "Podział składników:", "recipeForm.detectedAllergens": "Wykryte alergeny:"
} satisfies Record<string, TranslationValue>);
Object.assign(en, {
  "settings.currentPasswordInvalid": "Current password is incorrect", "settings.newPasswordPlaceholder": "At least 6 characters", "settings.repeatNewPassword": "Enter the new password again",
  "ingredients.title": "Ingredient management", "ingredients.subtitle": "Track inventory levels, costs, and suppliers", "ingredients.fillNutritionTitle": "Use AI to fill nutrition values for all ingredients", "ingredients.aiFilling": "AI is filling in...", "ingredients.done": "Done", "ingredients.aiNutrition": "AI: nutrition values", "ingredients.nutritionComplete": "All ingredients already have nutrition values", "ingredients.nutritionUpdated": ({ updated, total }) => `Updated ${updated} of ${total} ingredients`, "ingredients.nutritionErrors": ({ errors }) => `Could not update: ${errors}`, "ingredients.aiError": "AI error", "ingredients.nutritionFailed": "Could not fill nutrition values", "ingredients.deleted": "Ingredient deleted", "ingredients.deletedDescription": "The ingredient was deleted successfully.", "ingredients.deleteFailed": "Could not delete the ingredient. It may be used in recipes.", "ingredients.stockLow": "Low stock", "ingredients.stockExpired": "Expired", "ingredients.stockOk": "OK", "ingredients.search": "Search ingredients...", "ingredients.empty": "No ingredients", "ingredients.adjustSearch": "Try changing your search", "ingredients.addFirst": "Start by adding your first ingredient", "ingredients.add": "Add ingredient", "ingredients.name": "Ingredient", "ingredients.category": "Category", "ingredients.pricePerKg": "Price/kg", "ingredients.stock": "Stock", "ingredients.minimumStock": "Min. stock", "ingredients.status": "Status", "ingredients.supplier": "Supplier", "ingredients.deleteTitle": "Delete ingredient", "ingredients.deleteDescription": ({ name }) => `Delete “${name}”? This action cannot be undone. It may affect recipes that use this ingredient.`, "ingredients.deleting": "Deleting...",
  "ingredientForm.enterName": "Enter a name", "ingredientForm.enterNameDescription": "Enter an ingredient name so AI can look it up.", "ingredientForm.aiFilled": "AI filled in the details!", "ingredientForm.aiFound": ({ name }) => `Found information about: ${name}`, "ingredientForm.aiFailed": "Could not retrieve data from AI. Try again.", "ingredientForm.updated": "Ingredient updated", "ingredientForm.created": "Ingredient added", "ingredientForm.updatedDescription": "The ingredient was updated successfully.", "ingredientForm.createdDescription": "The ingredient was added successfully.", "ingredientForm.updateFailed": "Could not update the ingredient.", "ingredientForm.createFailed": "Could not add the ingredient.", "ingredientForm.edit": "Edit ingredient", "ingredientForm.add": "Add new ingredient", "ingredientForm.adding": "Adding...", "ingredientForm.update": "Update ingredient", "ingredientForm.name": "Ingredient name", "ingredientForm.aiFill": "Fill details with AI", "ingredientForm.pricePerKg": "Price per kg (PLN)", "ingredientForm.supplierPlaceholder": "e.g. Polish Mills", "ingredientForm.dietaryProperties": "Dietary properties", "ingredientForm.scalingParameters": "Scaling parameters (optional)", "ingredientForm.density": "Density (g/ml)", "ingredientForm.densityPlaceholder": "e.g. 1.000 water, 0.915 oil", "ingredientForm.densityHelp": "Used to convert ml/l to grams when scaling a recipe", "ingredientForm.pieceWeight": "Weight per piece (g)", "ingredientForm.pieceWeightPlaceholder": "e.g. 60 large egg, 2 almond", "ingredientForm.pieceWeightHelp": "Used to convert pieces to grams when scaling a recipe", "ingredientForm.nutrition": "Nutrition values (per 100g)", "ingredientForm.calories": "Calories (kcal)", "ingredientForm.protein": "Protein (g)", "ingredientForm.fat": "Fat (g)", "ingredientForm.carbs": "Carbohydrates (g)", "ingredientForm.fiber": "Fiber (g)", "ingredientForm.currentStock": "Current stock (kg)", "ingredientForm.minimumStock": "Min. stock (kg)", "ingredientForm.expiryDate": "Expiry date",
  "ingredientForm.dialogDescription": "Enter the ingredient details, price, category, and properties.",
  "recipeCategories.add": "Add recipe category", "recipeCategories.dialogDescription": "Create a category to keep your recipes organized.", "recipeCategories.adding": "Adding...", "recipeCategories.name": "Category name", "recipeCategories.namePlaceholder": "e.g. Yeast cakes", "recipeCategories.description": "Description (optional)", "recipeCategories.descriptionPlaceholder": "Recipe category description...", "recipeCategories.created": "Category added", "recipeCategories.createdDescription": "The recipe category was added successfully.", "recipeCategories.createFailed": "Could not add the recipe category.",
  "recipeForm.edit": "Edit recipe", "recipeForm.add": "Add new recipe", "recipeForm.dialogDescription": "Enter the recipe, ingredients, proportions, and preparation steps.", "recipeForm.adding": "Adding...", "recipeForm.update": "Update recipe", "recipeForm.updated": "Recipe updated", "recipeForm.created": "Recipe added", "recipeForm.updatedDescription": "The recipe was updated successfully.", "recipeForm.createdDescription": "The recipe was added successfully.", "recipeForm.updateFailed": "Could not update the recipe.", "recipeForm.createFailed": "Could not add the recipe.", "recipeForm.name": "Recipe name", "recipeForm.namePlaceholder": "e.g. Kraków cheesecake", "recipeForm.selectCategory": "Select a category", "recipeForm.noCategory": "No category", "recipeForm.description": "Description (optional)", "recipeForm.descriptionPlaceholder": "Recipe description...", "recipeForm.totalYield": "Total yield (g) — optional", "recipeForm.totalYieldPlaceholder": "e.g. 1200 (final weight of the finished product)", "recipeForm.totalYieldHelp": "Used as a fallback value when scaling a recipe", "recipeForm.instructions": "Instructions (optional)", "recipeForm.addStep": "Add step", "recipeForm.stepPlaceholder": ({ step }) => `Step ${step} — describe what needs to be done...`, "recipeForm.noSteps": "No steps have been added yet.", "recipeForm.selectIngredient": "Select an ingredient", "recipeForm.pieces": "pcs.", "recipeForm.noIngredients": "No ingredients have been added yet.", "recipeForm.analysis": "Recipe analysis", "recipeForm.totalCost": ({ cost }) => `${cost} PLN total`, "recipeForm.totalWeight": ({ weight }) => `Total weight: ${weight}g`, "recipeForm.ingredientBreakdown": "Ingredient breakdown:", "recipeForm.detectedAllergens": "Detected allergens:"
} satisfies Record<string, TranslationValue>);
Object.assign(pl, {
  "allergens.Gluten": "Gluten", "allergens.Skorupiaki": "Skorupiaki", "allergens.Jaja": "Jaja", "allergens.Ryby": "Ryby", "allergens.Orzeszki ziemne": "Orzeszki ziemne", "allergens.Soja": "Soja", "allergens.Mleko": "Mleko", "allergens.Orzechy": "Orzechy", "allergens.Seler": "Seler", "allergens.Gorczyca": "Gorczyca", "allergens.Sezam": "Sezam", "allergens.Dwutlenek siarki": "Dwutlenek siarki", "allergens.Łubin": "Łubin", "allergens.Mięczaki": "Mięczaki",
});
Object.assign(en, {
  "allergens.Gluten": "Gluten", "allergens.Skorupiaki": "Crustaceans", "allergens.Jaja": "Eggs", "allergens.Ryby": "Fish", "allergens.Orzeszki ziemne": "Peanuts", "allergens.Soja": "Soy", "allergens.Mleko": "Milk", "allergens.Orzechy": "Nuts", "allergens.Seler": "Celery", "allergens.Gorczyca": "Mustard", "allergens.Sezam": "Sesame", "allergens.Dwutlenek siarki": "Sulphur dioxide", "allergens.Łubin": "Lupin", "allergens.Mięczaki": "Molluscs",
});

interface I18nContextValue { language: Language; t: (key: string, values?: Record<string, string | number>) => string; }
const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const language: Language = user?.language === "en" ? "en" : "pl";
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, t: (key: string, values = {}) => {
    const entry = resources[language][key] ?? resources.pl[key] ?? key;
    return typeof entry === "function" ? entry(values) : entry;
  }}), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}