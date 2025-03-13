const API_KEY = "736c4b6768174668815f3bdf3c366298"; // Updated valid Spoonacular API key

let currentRecipe = {}; // Stores the currently viewed recipe

// Fetches recipes based on a single search query (reverting multi-search)
async function fetchRecipes() {
    let query = document.getElementById("searchQuery").value.trim();

    if (!query) {
        showToast("Please enter a search term!", "warning");
        return;
    }

    let url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=10&apiKey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            showToast(`Error ${response.status}: ${response.statusText}`, "danger");
            return;
        }

        const data = await response.json();
        if (!data || data.results.length === 0) {
            showToast("No recipes found. Try a different search term.", "warning");
            return;
        }

        displayRecipes(data.results);
    } catch (error) {
        console.error("Fetch Error:", error);
        showToast("Network error. Please try again later.", "danger");
    }
}

// Displays the fetched recipes
function displayRecipes(recipes) {
    const container = document.getElementById("recipeContainer");
    container.innerHTML = "";

    recipes.forEach(recipe => {
        let recipeDiv = document.createElement("div");
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

// Fetches full recipe details and displays them in a modal
async function fetchRecipeDetails(recipeId) {
    if (!recipeId) {
        showToast("Error: Recipe ID is missing.", "danger");
        console.error("Missing recipeId");
        return;
    }

    console.log(`Fetching details for Recipe ID: ${recipeId}`);

    const url = `https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            showToast(`Error fetching recipe details (${response.status})`, "danger");
            return;
        }

        const data = await response.json();
        console.log("Recipe Data Retrieved:", data);

        // Ensure ingredients and instructions are valid
        const ingredientsList = data.extendedIngredients
            ? data.extendedIngredients.map(ing => ing.original)
            : ["No ingredients available"];

        const instructionsText = data.instructions && data.instructions.trim().length > 0
            ? data.instructions.replace(/<\/?[^>]+(>|$)/g, "")
            : "Instructions not available.";

        currentRecipe = {
            id: data.id,
            title: data.title || "Unknown Recipe",
            ingredients: ingredientsList,
            instructions: instructionsText
        };

        // Ensure modal elements exist
        let titleElement = document.getElementById("recipeTitle");
        let ingredientsElement = document.getElementById("recipeIngredients");
        let instructionsElement = document.getElementById("recipeInstructions");

        if (!titleElement || !ingredientsElement || !instructionsElement) {
            console.error("Missing modal elements. Ensure 'recipeTitle', 'recipeIngredients', and 'recipeInstructions' exist in HTML.");
            showToast("Error: Modal elements are missing.", "danger");
            return;
        }

        titleElement.innerText = currentRecipe.title;
        ingredientsElement.innerHTML = currentRecipe.ingredients
            .map(ing => `<li class="list-group-item">${ing}</li>`).join("");
        instructionsElement.innerText = currentRecipe.instructions;

        let modalFooter = document.querySelector(".modal-footer");
        modalFooter.innerHTML = "";

        let saveButton = document.createElement("button");
        saveButton.innerText = "Save to Favorites";
        saveButton.classList.add("btn", "btn-warning");
        saveButton.onclick = saveToFavorites;
        modalFooter.appendChild(saveButton);

        let exportButton = document.createElement("button");
        exportButton.innerText = "Export to DOCX";
        exportButton.classList.add("btn", "btn-success");
        exportButton.onclick = exportRecipeToDOCX;
        modalFooter.appendChild(exportButton);

        const recipeModal = new bootstrap.Modal(document.getElementById("recipeModal"));
        recipeModal.show();

    } catch (error) {
        console.error("Error fetching recipe details:", error);
        showToast("Failed to load recipe details.", "danger");
    }
}

// Saves the current recipe to local storage (Favorites)
function saveToFavorites() {
    if (!currentRecipe || !currentRecipe.id) {
        showToast("Error: No recipe selected to save.", "danger");
        return;
    }

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    
    if (favorites.some(recipe => recipe.id === currentRecipe.id)) {
        showToast("Recipe is already in favorites!", "warning");
        return;
    }

    favorites.push(currentRecipe);
    localStorage.setItem("favorites", JSON.stringify(favorites));

    showToast("Recipe saved to favorites!", "success");
}

// Exports the current recipe to a DOCX file
function exportRecipeToDOCX() {
    const { title, ingredients, instructions } = currentRecipe;

    const doc = new docx.Document({
        sections: [
            {
                properties: {},
                children: [
                    new docx.Paragraph({
                        text: title,
                        heading: docx.HeadingLevel.TITLE,
                        spacing: { after: 300 }
                    }),
                    new docx.Paragraph({
                        text: "Ingredients:",
                        heading: docx.HeadingLevel.HEADING_1,
                        spacing: { after: 100 }
                    }),
                    ...ingredients.map(ing =>
                        new docx.Paragraph({
                            text: `- ${ing}`,
                            bullet: { level: 0 }
                        })
                    ),
                    new docx.Paragraph({
                        text: "Instructions:",
                        heading: docx.HeadingLevel.HEADING_1,
                        spacing: { before: 300, after: 100 }
                    }),
                    new docx.Paragraph({
                        text: instructions,
                        spacing: { after: 100 }
                    })
                ]
            }
        ]
    });

    docx.Packer.toBlob(doc).then(blob => {
        const blobURL = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobURL;
        a.download = `${title}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

// Prevent background shift when opening modal
document.addEventListener("DOMContentLoaded", () => {
    document.body.style.overflowY = "scroll";
});

// Displays a toast message (fallback uses alert)
function showToast(message, type) {
    alert(message);
}
