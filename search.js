const API_KEY = 'ecf26f78d899754853efc76e880258b3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Search movies and shows based on user input
const searchMovies = async (query) => {
    const url = `${TMDB_BASE_URL}search/multi?api_key=${API_KEY}&query=${query}&language=en-US`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        renderSearchResults(data.results); // Display search results
    } catch (error) {
        console.error("Error fetching search results:", error);
    }
};

// Render search results (movies and TV shows) without carousel
const renderSearchResults = (items) => {
    const searchResultsContainer = document.getElementById('search-results');
    searchResultsContainer.innerHTML = ''; // Clear existing content

    if (items.length === 0) {
        searchResultsContainer.innerHTML = '<p>No results found. Try again with a different search term.</p>';
    }

    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('search-item');
        itemElement.innerHTML = `
            <img 
                src="${item.poster_path ? IMAGE_BASE_URL + item.poster_path : 'default-poster.jpg'}" 
                alt="${item.title || item.name}" 
                style="width: 100px; cursor: pointer;" 
                onclick="showDetails('${item.id}', '${item.media_type || 'movie'}')">
            <h3>${item.title || item.name}</h3>
            <button class="favorite-button" onclick="addToFavorites(${item.id}, '${item.media_type || 'movie'}')">
                + Add to My List
            </button>
        `;
        searchResultsContainer.appendChild(itemElement);
    });
};

// Show detailed information about the selected movie or show
const showDetails = async (id, type) => {
    const url = `${TMDB_BASE_URL}${type}/${id}?api_key=${API_KEY}&language=en-US&append_to_response=watch_providers,credits,videos`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Set modal poster and basic info
        document.getElementById('modal-poster').src = data.poster_path 
            ? `${IMAGE_BASE_URL}${data.poster_path}` 
            : 'default-poster.jpg';
        document.getElementById('modal-title').textContent = data.title || data.name;
        document.getElementById('modal-release-date').textContent = data.release_date || data.first_air_date || "Unknown";
        document.getElementById('modal-overview').textContent = data.overview || "No overview available.";

        // Handle cast
        const castList = data.credits?.cast?.slice(0, 5).map(actor => actor.name).join(", ") || "Cast unavailable";
        document.getElementById('modal-cast').textContent = castList;

        // Handle providers (streaming or in theaters)
        let providerMessage = "Not available for streaming";
        const providers = data.watch_providers?.results?.US?.flatrate || data.watch_providers?.results?.GB?.flatrate;
        if (providers && providers.length > 0) {
            const providerNames = providers.map(provider => provider.provider_name).join(", ");
            providerMessage = `Available to watch on: ${providerNames}`;
        } else if (data.status === 'Released' && !providers) {
            providerMessage = "Currently in theaters";
        }

        // Display provider or theater message
        document.getElementById('modal-streaming').textContent = providerMessage;

        // Handle trailer
        const trailer = data.videos?.results?.find(video => video.type === "Trailer");
        document.getElementById('modal-trailer').innerHTML = trailer
            ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
            : "<p>No trailer available</p>";

        // Show the modal
        const modal = document.getElementById('movie-modal');
        modal.showModal();

        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.close();
        });
    } catch (error) {
        console.error("Error fetching details:", error);
    }
};

// Fetch movies and shows based on search input as you type
const handleSearch = async () => {
    const query = document.querySelector('.search-bar').value.trim();
    if (query) {
        await searchMovies(query); // Fetch search results when typing
    } else {
        // Clear search results if the query is empty
        document.getElementById('search-results').innerHTML = '';
    }
};

// Listen to the input event on the search bar
document.querySelector('.search-bar').addEventListener('input', handleSearch);



// Add to favorites list
const addToFavorites = async (id, type) => {
    try {
        const response = await fetch(`${TMDB_BASE_URL}${type}/${id}?api_key=${API_KEY}`);
        const data = await response.json();

        const favoriteItem = {
            id: data.id,
            title: data.title || data.name,
            poster: data.poster_path ? `${IMAGE_BASE_URL}${data.poster_path}` : 'default-poster.jpg',
            type: type
        };

        let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
        if (!favorites.some(item => item.id === data.id)) {
            favorites.push(favoriteItem);
            localStorage.setItem("favorites", JSON.stringify(favorites));
            alert(`${data.title || data.name} added to your list!`);
        } else {
            alert(`${data.title || data.name} is already in your list!`);
        }
    } catch (error) {
        console.error("Error adding to favorites:", error);
    }
};

// Display favorites on favorites page
const displayFavorites = () => {
    const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    const favoritesContainer = document.getElementById("favorites-container");
    favoritesContainer.innerHTML = ""; // Clear the container before displaying new items

    favorites.forEach(movie => {
        const movieElement = document.createElement("div");
        movieElement.classList.add("favorite-item");

        movieElement.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}" style="width: 100px;">
            <h3>${movie.title}</h3>
            <button onclick="removeFromFavorites(${movie.id})">Remove</button>
        `;
        favoritesContainer.appendChild(movieElement);
    });
};

// Remove movie from favorites
const removeFromFavorites = (id) => {
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites = favorites.filter(item => item.id !== id);
    localStorage.setItem("favorites", JSON.stringify(favorites));
    displayFavorites(); // Refresh the displayed favorites
};

// Load favorites when the page is loaded
window.onload = () => {
    displayFavorites();
};

// Event listener for the search button
document.getElementById('search-button').addEventListener('click', handleSearch);
