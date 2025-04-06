const apiKey = 'ecf26f78d899754853efc76e880258b3'; // Your TMDB API key
const movieContainer = document.getElementById('movie-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const movieModal = document.getElementById('movie-modal'); // Target the dialog
let currentPage = 1;
let totalShows = 0;

// Function to fetch *popular, recent* TV shows (no talk/reality)
async function fetchShows(page) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/discover/tv?api_key=${apiKey}&sort_by=popularity.desc&first_air_date.gte=2023-01-01&page=${page}&with_original_language=en&without_genres=10767,10764`
    );
    const data = await response.json();

    if (data.results) {
      totalShows = data.total_results;
      displayShows(data.results);
    } else {
      console.error("No data found.");
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}


function displayShows(shows) {
  // Optional: sort shows by popularity descending (just to be safe)
  shows.sort((a, b) => b.popularity - a.popularity);

  shows.forEach(show => {
    const showElement = document.createElement('div');
    showElement.classList.add('show');

    const showPoster = `https://image.tmdb.org/t/p/w500${show.poster_path}`;
    const showTitle = show.name;

    showElement.innerHTML = `
      <img src="${showPoster}" alt="${showTitle}" class="show-poster">
      <p>${showTitle}</p>
    `;

    showElement.addEventListener('click', () => {
      showShowDetails(show.id);
    });

    movieContainer.appendChild(showElement);
  });
}


// Function to show TV show details in the modal
async function showShowDetails(showId) {
  try {
    const response = await fetch(`https://api.themoviedb.org/3/tv/${showId}?api_key=${apiKey}&append_to_response=watch_providers,credits,videos`);
    const show = await response.json();

    // Populate the modal content
    document.getElementById('modal-poster').src = `https://image.tmdb.org/t/p/w500${show.poster_path}` || 'default-poster.jpg';
    document.getElementById('modal-title').textContent = show.name;
    document.getElementById('modal-release-date').textContent = `First Air Date: ${show.first_air_date || "Unknown"}`;
    document.getElementById('modal-overview').textContent = `Overview: ${show.overview || "No overview available."}`;

    // Handle cast
    const castList = show.credits?.cast?.slice(0, 5).map(actor => actor.name).join(", ") || "Cast unavailable";
    document.getElementById('modal-cast').textContent = `Cast: ${castList}`;

    // Handle streaming providers
    let providerMessage = "Not available for streaming";
    const providers = show.watch_providers?.results?.US?.flatrate || show.watch_providers?.results?.GB?.flatrate;
    if (providers && providers.length > 0) {
      const providerNames = providers.map(provider => provider.provider_name).join(", ");
      providerMessage = `Available to watch on: ${providerNames}`;
    } else if (show.status === 'Ended' && !providers) {
      providerMessage = "Not streaming anymore";
    }
    document.getElementById('modal-streaming').textContent = providerMessage;

    // Handle trailer
    const trailer = show.videos?.results?.find(video => video.type === "Trailer");
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
    favoriteButton.addEventListener('click', () => addToFavorites(show.id, 'tv'));
  } catch (error) {
    console.error('Error fetching TV show details:', error);
  }
}

// Load TV shows on page load
fetchShows(currentPage);

// Event listener for "Load More" button
loadMoreBtn.addEventListener('click', () => {
  currentPage++;
  fetchShows(currentPage);
});
