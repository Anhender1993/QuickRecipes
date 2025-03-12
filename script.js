const API_KEY = "5645d4542683472ca9644df5cbc1feb7"; // API key for Spoonacular API

let currentRecipe = {}; // Stores the currently viewed recipe

// Ensures event listeners are added once the page has fully loaded
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

// Fetches recipes from the Spoonacular API based on search type
async function fetchRecipes() {
    let searchType = document.getElementById("searchType").value;
    let query = document.getElementById("searchQuery").value.trim();

    if (!query) {
        showToast("Please enter a search term!", "warning");
        return;
    }

    let url = "";

    if (searchType === "name") {
        // Search by recipe name
        url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=10&apiKey=${API_KEY}`;
    } else if (searchType === "ingredients") {
        // Search by ingredients (limit to 5)
        let ingredientsArray = query.split(",").map(item => item.trim()).slice(0, 5);
        let formattedQuery = ingredientsArray.join(",");
        url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${formattedQuery}&number=10&apiKey=${API_KEY}`;
    } else if (searchType === "genre") {
        // Search by cuisine type (genre)
        url = `https://api.spoonacular.com/recipes/complexSearch?cuisine=${query}&number=10&apiKey=${API_KEY}`;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            showToast(`Error ${response.status}: ${response.statusText}`, "danger");
            return;
        }

        const data = await response.json();
        if (!data || data.length === 0) {
            showToast("No recipes found. Try a different search term.", "warning");
            return;
        }

        displayRecipes(data.results || data); // Adjust for different API responses
    } catch (error) {
        console.error("Fetch Error:", error);
        showToast("Network error. Please try again later.", "danger");
    }
}

// Displays the fetched recipes in a card format
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

// Displays a toast message (fallback uses alert)
function showToast(message, type) {
    alert(message);
}
