const API_KEY = "5645d4542683472ca9644df5cbc1feb7"; // Updated API Key

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
});

// Fetch recipes from Spoonacular API
async function fetchRecipes() {
    let query = document.getElementById("searchQuery").value.trim();
    if (!query) {
        showToast("Please enter ingredients or a recipe name!", "warning");
        return;
    }

    let formattedQuery = query.split(",").map(item => item.trim()).join(",");
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${formattedQuery}&number=10&apiKey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            showToast(`Error ${response.status}: ${response.statusText}`, "danger");
            return;
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            showToast("No recipes found for these ingredients.", "warning");
            return;
        }

        displayRecipes(data);
    } catch (error) {
        console.error("Fetch Error:", error);
        showToast("Network error. Please try again later.", "danger");
    }
}

// Display recipes in the UI
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

// Fetch full recipe details for the modal
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
            ingredients: data.extendedIngredients ? data.extendedIngredients.map(ing => ing.original) : [],
            instructions: data.instructions ? data.instructions.replace(/<\/?[^>]+(>|$)/g, "") : "Instructions not available."
        };

        document.getElementById("recipeTitle").innerText = currentRecipe.title;
        document.getElementById("recipeImage").src = currentRecipe.image;
        document.getElementById("recipeIngredients").innerHTML = currentRecipe.ingredients
            .map(ing => `<li class="list-group-item">${ing}</li>`).join("");
        document.getElementById("recipeInstructions").innerText = currentRecipe.instructions;

        const recipeModal = new bootstrap.Modal(document.getElementById("recipeModal"));
        recipeModal.show();
    } catch (error) {
        console.error("Error fetching recipe details:", error);
        showToast("Failed to load recipe details.", "danger");
    }
}

// Show Toast Notification
function showToast(message, type) {
    alert(message); // Simple alert as fallback for debugging
}