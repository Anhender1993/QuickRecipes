const API_KEY = "5645d4542683472ca9644df5cbc1feb7"; // API key for authenticating requests to the Spoonacular API

let currentRecipe = {}; // Stores details of the currently viewed recipe to persist data between interactions

// Ensures event listeners are added once the page has fully loaded
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchQuery"); // Retrieves the search input field

    if (searchInput) { // Checks if the search input field exists
        searchInput.addEventListener("keydown", function (event) { // Listens for key presses
            if (event.key === "Enter") { // Triggers search when the 'Enter' key is pressed
                event.preventDefault(); // Prevents default form submission behavior
                fetchRecipes(); // Calls the function to fetch recipe results
            }
        });
    }
});

// Fetches recipes from the Spoonacular API based on user input
async function fetchRecipes() {
    let query = document.getElementById("searchQuery").value.trim(); // Retrieves and sanitizes user input
    if (!query) { // Ensures the user provides input before making an API call
        showToast("Please enter ingredients or a recipe name!", "warning"); // Provides user feedback
        return;
    }

    let formattedQuery = query.split(",").map(item => item.trim()).join(","); // Formats input to match API requirements
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${formattedQuery}&number=10&apiKey=${API_KEY}`; // Constructs API request URL

    try {
        const response = await fetch(url); // Sends API request asynchronously
        if (!response.ok) { // Handles unsuccessful API responses
            showToast(`Error ${response.status}: ${response.statusText}`, "danger"); // Displays an error message
            return;
        }

        const data = await response.json(); // Converts response into JSON

        if (!data || data.length === 0) { // Checks if API returns no results
            showToast("No recipes found for these ingredients.", "warning"); // Notifies the user
            return;
        }

        displayRecipes(data); // Calls function to display the fetched recipes
    } catch (error) {
        console.error("Fetch Error:", error); // Logs error for debugging
        showToast("Network error. Please try again later.", "danger"); // Displays a network error message
    }
}

// Displays the fetched recipes in a card format
function displayRecipes(recipes) {
    const container = document.getElementById("recipeContainer"); // Retrieves container for displaying recipes
    container.innerHTML = ""; // Clears previous results to prevent duplicates

    recipes.forEach(recipe => { // Iterates over each recipe and creates a display card
        const recipeDiv = document.createElement("div"); // Creates a new div for each recipe
        recipeDiv.classList.add("col-md-4", "mb-4"); // Adds Bootstrap classes for layout and spacing

        // Generates HTML structure for each recipe card
        recipeDiv.innerHTML = `
            <div class="card shadow-sm">
                <img src="${recipe.image}" class="card-img-top" alt="${recipe.title}"> <!-- Recipe image -->
                <div class="card-body">
                    <h5 class="card-title">${recipe.title}</h5> <!-- Recipe title -->
                    <button class="btn btn-primary" onclick="fetchRecipeDetails(${recipe.id})">View Details</button> <!-- Fetches recipe details -->
                </div>
            </div>
        `;

        container.appendChild(recipeDiv); // Appends the created recipe card to the container
    });
}

// Fetches full recipe details and displays them in a modal
async function fetchRecipeDetails(recipeId) {
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`; // API request URL

    try {
        const response = await fetch(url); // Sends API request
        if (!response.ok) { // Handles unsuccessful API responses
            showToast(`Error fetching recipe details (${response.status})`, "danger"); // Displays an error message
            return;
        }

        const data = await response.json(); // Converts response to JSON

        // Stores detailed recipe data for display
        currentRecipe = {
            id: data.id,
            title: data.title,
            image: data.image,
            ingredients: data.extendedIngredients ? data.extendedIngredients.map(ing => ing.original) : [], // Extracts ingredient list
            instructions: data.instructions ? data.instructions.replace(/<\/?[^>]+(>|$)/g, "") : "Instructions not available." // Removes HTML tags from instructions
        };

        // Updates the modal elements with recipe details
        document.getElementById("recipeTitle").innerText = currentRecipe.title;
        document.getElementById("recipeImage").src = currentRecipe.image;
        document.getElementById("recipeIngredients").innerHTML = currentRecipe.ingredients
            .map(ing => `<li class="list-group-item">${ing}</li>`).join(""); // Displays ingredients as a list
        document.getElementById("recipeInstructions").innerText = currentRecipe.instructions;

        // Displays the modal using Bootstrap
        const recipeModal = new bootstrap.Modal(document.getElementById("recipeModal"));
        recipeModal.show();
    } catch (error) {
        console.error("Error fetching recipe details:", error); // Logs error for debugging
        showToast("Failed to load recipe details.", "danger"); // Notifies the user of failure
    }
}

// Displays a toast message (fallback uses alert)
function showToast(message, type) {
    alert(message); // Uses simple alert as fallback for user feedback
}