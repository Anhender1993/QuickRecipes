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

// Fetches recipes from the Spoonacular API
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

// Fetches full recipe details and displays them in a modal
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
            ingredients: data.extendedIngredients ? data.extendedIngredients.map(ing => ing.original) : [],
            instructions: data.instructions ? data.instructions.replace(/<\/?[^>]+(>|$)/g, "") : "Instructions not available."
        };

        document.getElementById("recipeTitle").innerText = currentRecipe.title;
        document.getElementById("recipeIngredients").innerHTML = currentRecipe.ingredients
            .map(ing => `<li class="list-group-item">${ing}</li>`).join("");
        document.getElementById("recipeInstructions").innerText = currentRecipe.instructions;

        // Ensure the Export to DOCX button is properly set up
        let modalFooter = document.querySelector(".modal-footer");
        let exportButton = document.getElementById("exportDocxBtn");

        if (!exportButton) {
            exportButton = document.createElement("button");
            exportButton.innerText = "Export to document (DOCX)";
            exportButton.classList.add("btn", "btn-success");
            exportButton.id = "exportDocxBtn";
            modalFooter.appendChild(exportButton);
        }

        // Make sure the button always has a valid event listener
        exportButton.onclick = exportRecipeToDOCX;

        // Show the modal
        const recipeModal = new bootstrap.Modal(document.getElementById("recipeModal"));
        recipeModal.show();
    } catch (error) {
        console.error("Error fetching recipe details:", error);
        showToast("Failed to load recipe details.", "danger");
    }
}

// Exports the currently viewed recipe as a DOCX file
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

// Displays a toast message (fallback uses alert)
function showToast(message, type) {
    alert(message);
}