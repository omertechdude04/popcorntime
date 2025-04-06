const API_KEY = 'ecf26f78d899754853efc76e880258b3';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3/';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Fetch movies and render them in a carousel
const fetchMovies = async (url, carouselId) => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        renderCarousel(data.results.slice(0, 10), carouselId); // Display top 10 results
    } catch (error) {
        console.error("Error fetching movies:", error);
    }
};

// Render carousel for movies, TV shows, or other content
const renderCarousel = (items, carouselId) => {
    const carousel = document.getElementById(carouselId);
    carousel.innerHTML = ''; // Clear existing content
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('carousel-item');
        itemElement.innerHTML = `
            <img 
                src="${item.poster_path ? IMAGE_BASE_URL + item.poster_path : 'default-poster.jpg'}" 
                alt="${item.title || item.name}" 
                style="cursor: pointer;" 
                onclick="showDetails('${item.id}', '${item.media_type || 'movie'}')">
                 <h3>${item.title || item.name}</h3>
                <button class="favorite-button" onclick="addToFavorites(${item.id}, '${item.media_type || 'movie'}')">
        + Add to My List
    </button>        `;
        carousel.appendChild(itemElement);
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
        let providerMessage = "";
        const results = data.watch_providers?.results;

        // Helper function to extract streaming providers
        const getProviderNames = (regionData) => {
            if (!regionData) return [];
            const allTypes = ['flatrate', 'subscription', 'ads']; // Types of streaming providers
            let providers = [];

            // Check all types of providers
            allTypes.forEach(type => {
                if (regionData[type]) {
                    providers = [...providers, ...regionData[type]];
                }
            });

            // Remove duplicates based on provider name
            const uniqueProviders = [...new Map(providers.map(p => [p.provider_name, p])).values()];
            return uniqueProviders.map(p => p.provider_name);
        };

        // Check for streaming providers in priority order
        let providerNames = getProviderNames(results?.US);
        if (providerNames.length === 0) {
            providerNames = getProviderNames(results?.GB);
        }

        // Build the provider message
        if (providerNames.length > 0) {
            providerMessage = `Streaming on: ${providerNames.join(", ")}`;
        } else if (data.media_type === "movie" && data.status === "Released") {
            providerMessage = "Not currently streaming online";
        } else if (data.media_type === "tv") {
            providerMessage = "Not currently streaming or unavailable in your region";
        } else {
            providerMessage = "Streaming availability unknown";
        }

        console.log('Streaming Info:', results); // Log for debugging

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

// Close the modal
const closeModal = () => {
    document.getElementById('movie-modal').close();
};

// Fetch new episodes this week and render them
const fetchNewEpisodesThisWeek = async () => {
    try {
        const response = await fetch(`${TMDB_BASE_URL}trending/tv/week?api_key=${API_KEY}&language=en-US`);
        const data = await response.json();

        const today = new Date();
        const weekStart = new Date(today); // Start date: today
        const weekEnd = new Date(today);
        weekEnd.setDate(today.getDate() + 6); // End date: 7 days ahead

        let episodesThisWeek = [];

        for (const show of data.results) {
            if (episodesThisWeek.length >= 10) break;

            const showDetails = await fetch(`${TMDB_BASE_URL}tv/${show.id}?api_key=${API_KEY}&language=en-US`);
            const showData = await showDetails.json();

            if (showData.next_episode_to_air) {
                const airDate = new Date(showData.next_episode_to_air.air_date);
                if (airDate >= weekStart && airDate <= weekEnd) {
                    episodesThisWeek.push({
                        id: show.id,
                        name: show.name,
                        poster_path: show.poster_path,
                        episode: showData.next_episode_to_air.name,
                        air_date: showData.next_episode_to_air.air_date,
                        network: showData.networks?.[0]?.name || 'TV'
                    });
                    
                }
            }
        }

        renderEpisodesThisWeek(episodesThisWeek);
    } catch (error) {
        console.error("Error fetching episodes this week:", error);
    }
};

// Format episode air date
// Format episode air date
const formatEpisodeDate = (dateString) => {
    const options = { 
        weekday: 'long', 
        month: '2-digit', 
        day: '2-digit',
        timeZone: 'UTC'  // Set timezone to UTC
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
};

// Render new episodes this week in carousel
const renderEpisodesThisWeek = (episodes) => {
    const carousel = document.getElementById('episodes-this-week-carousel');
    carousel.innerHTML = '';

    episodes.forEach(episode => {
        const episodeElement = document.createElement('div');
        episodeElement.classList.add('carousel-item');
        const airDate = new Date(episode.air_date);
        const today = new Date();

        // Normalize both dates to ignore time differences (hours/minutes)
        const getDateOnlyString = (date) => {
            return date.toISOString().split('T')[0]; // gives 'YYYY-MM-DD'
          };
          
          const isToday = getDateOnlyString(airDate) === getDateOnlyString(today);
          
        const displayDate = isToday 
            ? `New Episode Today on ${episode.network || 'TV'}`
            : `New Episode: ${formatEpisodeDate(episode.air_date)}`;

        episodeElement.innerHTML = `
            <img 
                src="${episode.poster_path ? IMAGE_BASE_URL + episode.poster_path : 'default-poster.jpg'}" 
                alt="${episode.name}" 
                style="cursor: pointer;" 
                onclick="showDetails('${episode.id}', 'tv')">
            <h3>${episode.name} - ${episode.episode}</h3>
            <p class="release-date"><span>${displayDate}</span></p>

        `;
        carousel.appendChild(episodeElement);
    });
};

// Fetch movies and episodes
fetchMovies(`${TMDB_BASE_URL}discover/movie?api_key=${API_KEY}&language=en-US&page=1&sort_by=popularity.desc`, 'popular-carousel');
fetchMovies(`${TMDB_BASE_URL}movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`, 'upcoming-carousel');
fetchMovies(`${TMDB_BASE_URL}movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`, 'top-rated-carousel');
fetchMovies(`${TMDB_BASE_URL}trending/tv/week?api_key=${API_KEY}&language=en-US`, 'trending-tvshows-carousel');
fetchMovies(`${TMDB_BASE_URL}movie/now_playing?api_key=${API_KEY}&language=en-US&page=1`, 'new-releases-carousel');
fetchNewEpisodesThisWeek();

// Add movies to the list (not a carousel)
const addMoviesToList = (movies, listId) => {
    const list = document.getElementById(listId);
    list.innerHTML = ''; // Clear existing content

    movies.forEach(movie => {
        const movieItem = document.createElement('li');
        movieItem.classList.add('movie-item');
        movieItem.innerHTML = `
            <img 
                src="${movie.poster_path ? IMAGE_BASE_URL + movie.poster_path : 'default-poster.jpg'}" 
                alt="${movie.title}" 
                style="width: 100px; cursor: pointer;" 
                onclick="showDetails('${movie.id}', 'movie')">
            <span>${movie.title} (${movie.release_date ? movie.release_date.split('-')[0] : 'Unknown'})</span>
            <button onclick="addToFavorites(${movie.id}, 'movie')">Add to Favorites</button>
        `;
        list.appendChild(movieItem);
    });
};

// Fetch movies and add them to a list
const fetchAndDisplayMovies = async (url, listId) => {
    try {
        const response = await fetch(url);
        const data = await response.json();
        addMoviesToList(data.results.slice(0, 10), listId);
    } catch (error) {
        console.error("Error fetching movies:", error);
    }
};

// Example usage - fetching and displaying movies
fetchAndDisplayMovies(`${TMDB_BASE_URL}discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc`, 'movies-list');

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
