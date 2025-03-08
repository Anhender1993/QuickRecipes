const API_KEY = "c8b9ab68a87b487e921d1ea4dbf8a5f5";

let currentRecipe = {}; // Stores the recipe being viewed

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

// ✅ FIXED: Search Now Works Properly
async function fetchRecipes() {
    const query = document.getElementById("searchQuery").value.trim();
    if (!query) {
        showToast("Please enter a recipe name!", "warning");
        return;
    }

    const url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=10&apiKey=${API_KEY}`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            showToast(`Error ${response.status}: ${response.statusText}`, "danger");
            return;
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            showToast("No recipes found.", "warning");
            return;
        }

        displayRecipes(data.results);
    } catch (error) {
        console.error("Fetch Error:", error);
        showToast("Network error. Please try again later.", "danger");
    }
}

// ✅ Display Recipes in Search Results
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

// ✅ Get Recipe Details and Open Modal
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

// ✅ FIXED: Favorites Now Save & Display Properly
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

// ✅ Load & Display Favorites in `favorites.html`
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

// ✅ Remove Recipe from Favorites
function removeFromFavorites(recipeId) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites = favorites.filter(recipe => recipe.id !== recipeId);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    loadFavorites();
    showToast("Recipe removed from favorites.", "warning");
}

// ✅ FIXED: Download Favorites as PDFs (Images Included)
function downloadFavoritesAsPDFs() {
    const { jsPDF } = window.jspdf;
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

    if (favorites.length === 0) {
        showToast("No favorites to download!", "warning");
        return;
    }

    favorites.forEach(async (recipe) => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(recipe.title, 10, 10);

        try {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = recipe.image;
            await img.decode();

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);

            const imgData = canvas.toDataURL("image/jpeg");
            doc.addImage(imgData, "JPEG", 10, 20, 60, 50);
        } catch (error) {
            console.error("Failed to load image for PDF:", error);
        }

        let yPosition = 80;
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
        doc.text(recipe.instructions, 10, yPosition);

        doc.save(`${recipe.title}.pdf`);
    });

    showToast("Favorites downloaded as PDFs!", "success");
}

// ✅ Show Toast Notification
function showToast(message, type) {
    const toastElement = new bootstrap.Toast(document.getElementById("toastMessage"));
    document.getElementById("toastText").innerText = message;
    toastElement.show();
}