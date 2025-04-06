function displayFavorites() {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const favoritesList = document.getElementById("favorites-list");
    favoritesList.innerHTML = "";

    if (favorites.length === 0) {
        favoritesList.innerHTML = "<p>No favorites added yet...</p>";
    } else {
        favorites.forEach(favorite => {
            const movieElement = document.createElement('div');
            movieElement.classList.add('favorite-item');
            movieElement.innerHTML = `
                <img 
                    src="${favorite.poster}" 
                    alt="${favorite.title || favorite.name}" 
                    onclick="showDetails('${favorite.id}', '${favorite.type}')">
                <h3>${favorite.title || favorite.name}</h3>
                <button onclick="removeFromFavorites(${favorite.id}, '${favorite.type}')">Remove</button>
            `;
            favoritesList.appendChild(movieElement);
        });
    }
}






function addFavorite(movie) {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || []; // Get current favorites
    
    if (!favorites.some(fav => fav.id === movie.id)) { // Check if movie is already in favorites
        favorites.push(movie);  // Add movie object to the list
        localStorage.setItem("favorites", JSON.stringify(favorites)); // Save to localStorage
        
        // Ensure we display a valid title or name
        const movieTitle = movie.title || movie.name || "Unknown Item";
        alert(movieTitle + " added to favorites!");
    } else {
        const movieTitle = movie.title || movie.name || "Unknown Item";
        alert(movieTitle + " is already in favorites!");
    }
}


// Remove from favorites functionality
const removeFromFavorites = (id, type) => {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites = favorites.filter(fav => fav.id !== id); // Remove movie/show with the same ID

    localStorage.setItem("favorites", JSON.stringify(favorites));

    displayFavorites(); // Refresh the favorites list
};


// Function to clear all favorites
function clearFavorites() {
    localStorage.removeItem("favorites");  // Remove from localStorage
    displayFavorites();  // Refresh the list
}

// Run this function when the page loads
window.onload = displayFavorites;

