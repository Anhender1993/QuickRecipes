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
});

// FIXED: Search Now Works Correctly
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

// FIXED: Display Function for Recipes
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

// FIXED: Fetch Full Recipe Details for PDF
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

        const recipeModal = new bootstrap.Modal(document.getElementById("recipeModal"));
        recipeModal.show();
    } catch (error) {
        console.error("Error fetching recipe details:", error);
        showToast("Failed to load recipe details.", "danger");
    }
}

// FIXED: Download Recipe as PDF (Without Images)
function downloadCurrentRecipeAsPDF() {
    if (!currentRecipe.id || !currentRecipe.title) {
        showToast("Error: Recipe details not fully loaded.", "danger");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(currentRecipe.title, 10, 10);

    generatePDFContent(doc, currentRecipe);
}

// FIXED: Generate PDF Content (No Images, Just Text)
function generatePDFContent(doc, recipe) {
    let yPosition = 20;
    doc.setFontSize(14);
    doc.text("Ingredients:", 10, yPosition);
    yPosition += 10;

    recipe.ingredients.forEach(ingredient => {
        doc.text(`• ${ingredient}`, 15, yPosition);
        yPosition += 7;
    });

    yPosition += 10;
    doc.text("Instructions:", 10, yPosition);
    yPosition += 10;

    let splitInstructions = doc.splitTextToSize(recipe.instructions, 180);
    splitInstructions.forEach(line => {
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
        doc.text(line, 10, yPosition);
        yPosition += 7;
    });

    doc.save(`${recipe.title}.pdf`);
    showToast(`Downloaded: ${recipe.title}`, "success");
}

// Show Toast Notification
function showToast(message, type) {
    const toastElement = new bootstrap.Toast(document.getElementById("toastMessage"));
    document.getElementById("toastText").innerText = message;
    toastElement.show();
}