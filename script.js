const API_KEY = "5645d4542683472ca9644df5cbc1feb7"; // API key for accessing the Spoonacular API

let currentRecipe = {}; // Stores details of the currently viewed recipe

// Waits for the DOM content to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchQuery"); // Gets the search input field

    // Checks if the search input exists
    if (searchInput) {
        // Adds an event listener to detect when the user presses a key
        searchInput.addEventListener("keydown", function (event) {
            // Checks if the "Enter" key was pressed
            if (event.key === "Enter") {
                event.preventDefault(); // Prevents the default form submission behavior
                fetchRecipes(); // Calls the function to fetch recipes
            }
        });
    }
});

// Fetches recipes from the Spoonacular API based on user input
async function fetchRecipes() {
    let query = document.getElementById("searchQuery").value.trim(); // Retrieves and trims the search query input
    if (!query) { // Checks if the query is empty
        showToast("Please enter ingredients or a recipe name!", "warning"); // Shows a warning message
        return; // Stops execution if no input is provided
    }

    // Formats the query by trimming spaces and ensuring ingredients are properly formatted
    let formattedQuery = query.split(",").map(item => item.trim()).join(",");
    // Constructs the API URL for searching recipes by ingredients
    const url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${formattedQuery}&number=10&apiKey=${API_KEY}`;

    try {
        const response = await fetch(url); // Sends a request to the API and waits for the response
        if (!response.ok) { // Checks if the response is not successful
            showToast(`Error ${response.status}: ${response.statusText}`, "danger"); // Shows an error message
            return; // Stops execution if the request fails
        }

        const data = await response.json(); // Converts the response into JSON format

        if (!data || data.length === 0) { // Checks if no recipes were found
            showToast("No recipes found for these ingredients.", "warning"); // Shows a warning message
            return; // Stops execution if no results are returned
        }

        displayRecipes(data); // Calls the function to display the retrieved recipes
    } catch (error) {
        console.error("Fetch Error:", error); // Logs the error to the console
        showToast("Network error. Please try again later.", "danger"); // Shows an error message for network issues
    }
}

// Displays the retrieved recipes in the UI
function displayRecipes(recipes) {
    const container = document.getElementById("recipeContainer"); // Gets the container where recipes will be displayed
    container.innerHTML = ""; // Clears any existing content

    // Iterates through each recipe and creates a card element for display
    recipes.forEach(recipe => {
        const recipeDiv = document.createElement("div"); // Creates a new div element
        recipeDiv.classList.add("col-md-4", "mb-4"); // Adds Bootstrap classes for styling

        // Sets the inner HTML of the recipe card
        recipeDiv.innerHTML = `
            <div class="card shadow-sm">
                <img src="${recipe.image}" class="card-img-top" alt="${recipe.title}"> <!-- Displays the recipe image -->
                <div class="card-body">
                    <h5 class="card-title">${recipe.title}</h5> <!-- Displays the recipe title -->
                    <button class="btn btn-primary" onclick="fetchRecipeDetails(${recipe.id})">View Details</button> <!-- Button to view details -->
                </div>
            </div>
        `;

        container.appendChild(recipeDiv); // Appends the recipe card to the container
    });
}

// Fetches full recipe details for the modal when a user clicks "View Details"
async function fetchRecipeDetails(recipeId) {
    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`; // Constructs the API URL for retrieving full recipe details

    try {
        const response = await fetch(url); // Sends a request to the API and waits for the response
        if (!response.ok) { // Checks if the response is not successful
            showToast(`Error fetching recipe details (${response.status})`, "danger"); // Shows an error message
            return; // Stops execution if the request fails
        }

        const data = await response.json(); // Converts the response into JSON format

        // Stores recipe details in the currentRecipe object
        currentRecipe = {
            id: data.id,
            title: data.title,
            image: data.image,
            ingredients: data.extendedIngredients ? data.extendedIngredients.map(ing => ing.original) : [], // Retrieves ingredient list
            instructions: data.instructions ? data.instructions.replace(/<\/?[^>]+(>|$)/g, "") : "Instructions not available." // Strips HTML tags from instructions
        };

        // Updates the modal elements with recipe details
        document.getElementById("recipeTitle").innerText = currentRecipe.title; // Sets recipe title
        document.getElementById("recipeImage").src = currentRecipe.image; // Sets recipe image
        document.getElementById("recipeIngredients").innerHTML = currentRecipe.ingredients
            .map(ing => `<li class="list-group-item">${ing}</li>`).join(""); // Displays ingredients as a list
        document.getElementById("recipeInstructions").innerText = currentRecipe.instructions; // Sets recipe instructions

        // Displays the Bootstrap modal containing the recipe details
        const recipeModal = new bootstrap.Modal(document.getElementById("recipeModal"));
        recipeModal.show();
    } catch (error) {
        console.error("Error fetching recipe details:", error); // Logs error to the console
        showToast("Failed to load recipe details.", "danger"); // Shows an error message
    }
}

// Displays a toast notification (or an alert as a fallback)
function showToast(message, type) {
    alert(message); // Uses a simple alert as a fallback notification method
}