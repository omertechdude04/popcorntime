const apiKey = 'ecf26f78d899754853efc76e880258b3'; // Your TMDB API key
const movieContainer = document.getElementById('movie-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const movieModal = document.getElementById('movie-modal'); // Target the dialog
let currentPage = 1;
let totalMovies = 0;

// Function to fetch movies from TMDB
async function fetchMovies(page) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&page=${page}`);
    const data = await response.json();

    if (data.results) {
      totalMovies = data.total_results;
      displayMovies(data.results);
    } else {
      console.error("No data found.");
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

// Function to display movies
function displayMovies(movies) {
  movies.forEach(movie => {
    const movieElement = document.createElement('div');
    movieElement.classList.add('movie');

    const moviePoster = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    const movieTitle = movie.title;

    movieElement.innerHTML = `
      <img src="${moviePoster}" alt="${movieTitle}" class="movie-poster">
      <p>${movieTitle}</p>
    `;

    // Add click event to show movie details
    movieElement.addEventListener('click', () => {
      showMovieDetails(movie.id);
    });

    movieContainer.appendChild(movieElement);
  });
}

// Function to show movie details in the modal
async function showMovieDetails(movieId) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=watch_providers,credits,videos`);
    const movie = await response.json();

    // Populate the modal content
    document.getElementById('modal-poster').src = `https://image.tmdb.org/t/p/w500${movie.poster_path}` || 'default-poster.jpg';
    document.getElementById('modal-title').textContent = movie.title;
    document.getElementById('modal-release-date').textContent = `Release Date: ${movie.release_date || "Unknown"}`;
    document.getElementById('modal-overview').textContent = `Overview: ${movie.overview || "No overview available."}`;

    // Handle cast
    const castList = movie.credits?.cast?.slice(0, 5).map(actor => actor.name).join(", ") || "Cast unavailable";
    document.getElementById('modal-cast').textContent = `Cast: ${castList}`;

    // Handle streaming providers
    let providerMessage = "Not available for streaming";
    const providers = movie.watch_providers?.results?.US?.flatrate || movie.watch_providers?.results?.GB?.flatrate;
    if (providers && providers.length > 0) {
      const providerNames = providers.map(provider => provider.provider_name).join(", ");
      providerMessage = `Available to watch on: ${providerNames}`;
    } else if (movie.status === 'Released' && !providers) {
      providerMessage = "Currently in theaters";
    }
    document.getElementById('modal-streaming').textContent = providerMessage;

    // Handle trailer
    const trailer = movie.videos?.results?.find(video => video.type === "Trailer");
    document.getElementById('modal-trailer').innerHTML = trailer
      ? `<iframe width="560" height="315" src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allowfullscreen></iframe>`
      : "<p>No trailer available</p>";

    // Show the modal
    movieModal.showModal();

    // Close modal logic
    movieModal.addEventListener('click', (event) => {
      if (event.target === movieModal) {
        movieModal.close();
      }
    });

    // Add "Add to Favorites" button functionality
    const favoriteButton = document.querySelector('.favorite-button');
    favoriteButton.addEventListener('click', () => addToFavorites(movie.id, 'movie'));
  } catch (error) {
    console.error('Error fetching movie details:', error);
  }
}

// Function to add a movie to the favorites list
const addToFavorites = async (id, type) => {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`);
    const movie = await response.json();

    const favoriteItem = {
      id: movie.id,
      title: movie.title || movie.name,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'default-poster.jpg',
      type: type
    };

    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (!favorites.some(item => item.id === movie.id)) {
      favorites.push(favoriteItem);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      alert(`${movie.title || movie.name} added to your list!`);
    } else {
      alert(`${movie.title || movie.name} is already in your list!`);
    }
  } catch (error) {
    console.error("Error adding to favorites:", error);
  }
};

// Load movies on page load
fetchMovies(currentPage);

// Event listener for "Load More" button
loadMoreBtn.addEventListener('click', () => {
  currentPage++;
  fetchMovies(currentPage);
});
