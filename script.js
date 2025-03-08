const API_KEY = "c8b9ab68a87b487e921d1ea4dbf8a5f5";

let currentRecipe = {}; // Stores the currently viewed recipe

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchQuery");

    if (searchInput) {
        searchInput.addEventListener("keydown", function (event) {
            if (event.key === "Enter") {
                event.preventDefault();
                fetchRecipes();
            }
        });
    }

    if (window.location.pathname.includes("favorites.html")) {
        loadFavorites();
    }
});

// Search function
async function fetchRecipes() {
    let query = document.getElementById("searchQuery").value.trim();
    if (!query) {
        showToast("Please enter ingredients or a recipe name!", "warning");
        return;
    }

    let formattedQuery = query.split(",").map(item => item.trim()).join(",");
    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${formattedQuery}&number=10&apiKey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            showToast(`Error ${response.status}: ${response.statusText}`, "danger");
            return;
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            showToast("No recipes found for this search.", "warning");
            return;
        }

        displayRecipes(data.results);
    } catch (error) {
        console.error("Fetch Error:", error);
        showToast("Network error. Please try again later.", "danger");
    }
}

// Display Function to Handle "View Details" Properly
function displayRecipes(recipes) {
    const container = document.getElementById("recipeContainer");
    container.innerHTML = "";

    recipes.forEach(recipe => {
        const recipeDiv = document.createElement("div");
        recipeDiv.classList.add("col-md-4", "mb-4");

        recipeDiv.innerHTML = `
            <div class="card shadow-sm">
                <img src="${recipe.image}" class="card-img-top" alt="${recipe.title}">
                <div class="card-body">
                    <h5 class="card-title">${recipe.title}</h5>
                    <button class="btn btn-primary" onclick="fetchRecipeDetails(${recipe.id})">View Details</button>
                </div>
            </div>
        `;

        container.appendChild(recipeDiv);
    });
}

// Recipe Details Load Properly
async function fetchRecipeDetails(recipeId) {
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            showToast(`Error fetching recipe details (${response.status})`, "danger");
            return;
        }

        const data = await response.json();

        currentRecipe = {
            id: data.id,
            title: data.title,
            image: data.image,
            ingredients: data.extendedIngredients.map(ing => ing.original),
            instructions: data.instructions ? data.instructions.replace(/<\/?[^>]+(>|$)/g, "") : "Instructions not available."
        };

        document.getElementById("recipeTitle").innerText = currentRecipe.title;
        document.getElementById("recipeImage").src = currentRecipe.image;
        document.getElementById("recipeIngredients").innerHTML = currentRecipe.ingredients
            .map(ing => `<li class="list-group-item">${ing}</li>`).join("");
        document.getElementById("recipeInstructions").innerText = currentRecipe.instructions;

        document.getElementById("favoriteButton").onclick = addToFavorites;

        const recipeModal = new bootstrap.Modal(document.getElementById("recipeModal"));
        recipeModal.show();
    } catch (error) {
        console.error("Error fetching recipe details:", error);
        showToast("Failed to load recipe details.", "danger");
    }
}

// Add to Favorites (Now Saves & Persists Correctly)
function addToFavorites() {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (favorites.some(recipe => recipe.id === currentRecipe.id)) {
        showToast("This recipe is already in your favorites!", "warning");
        return;
    }

    favorites.push(currentRecipe);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    showToast(`${currentRecipe.title} added to favorites!`, "success");
}

// Load Favorites (Now Displays on `favorites.html`)
function loadFavorites() {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const container = document.getElementById("favoritesContainer");

    if (favorites.length === 0) {
        container.innerHTML = "<p class='text-center text-muted'>No favorite recipes added yet.</p>";
        return;
    }

    container.innerHTML = "";

    favorites.forEach(recipe => {
        const recipeDiv = document.createElement("div");
        recipeDiv.classList.add("col-md-4", "mb-4");

        recipeDiv.innerHTML = `
            <div class="card shadow-sm">
                <img src="${recipe.image}" class="card-img-top" alt="${recipe.title}">
                <div class="card-body">
                    <h5 class="card-title">${recipe.title}</h5>
                    <button class="btn btn-danger" onclick="removeFromFavorites(${recipe.id})">Remove</button>
                </div>
            </div>
        `;

        container.appendChild(recipeDiv);
    });
}

// Remove Recipe from Favorites
function removeFromFavorites(recipeId) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites = favorites.filter(recipe => recipe.id !== recipeId);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    loadFavorites();
    showToast("Recipe removed from favorites.", "warning");
}

// Show Toast Notification
function showToast(message, type) {
    const toastElement = new bootstrap.Toast(document.getElementById("toastMessage"));
    document.getElementById("toastText").innerText = message;
    toastElement.show();
}