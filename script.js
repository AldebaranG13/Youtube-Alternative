// --- PASTE YOUR (FULL!) API KEY HERE ---
const API_KEY = 'AIzaSyAJszk6T_pxgXTIahpGXfrU8e8-nf9a5y0';

// Get the HTML elements we need to work with
const pageContainer = document.getElementById('page-container');
const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const loadMoreButton = document.getElementById('load-more-button');

// --- Get the modal elements ---
const modalContainer = document.getElementById('modal-container');
const modalCloseButton = document.getElementById('modal-close-button');
const videoPlayerContainer = document.getElementById('video-player-container');

// --- NEW: Variables for search pagination ---
let nextPageToken = '';
let currentSearchQuery = ''; 

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
// This function builds the HTML for each video
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
function displayVideos(videos) {
    if (!videos || videos.length === 0) {
        if (resultsContainer.innerHTML === '') {
             resultsContainer.innerHTML = '<p>No videos found.</p>';
        }
        return;
    }

    videos.forEach(video => {
        let videoId, videoTitle, videoThumbnail;
        
        // This is a SEARCH result
        if (video.kind === 'youtube#searchResult') {
            videoId = video.id.videoId;
            videoTitle = video.snippet.title;
            videoThumbnail = video.snippet.thumbnails.high.url;
        } else {
            return; // Unknown, skip
        }

        const videoElement = document.createElement('div');
        videoElement.className = 'video-item';

        videoElement.innerHTML = `
            <img src="${videoThumbnail}" alt="${videoTitle}">
            <h4>${videoTitle}</h4>
        `;
        
        videoElement.addEventListener('click', () => {
            openModal(videoId);
        });

        resultsContainer.appendChild(videoElement);
    });
}
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++
// END OF FUNCTION
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++

// Event listener for "Press Enter to Search"
searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        searchButton.click();
    }
});

// Add an event listener to the search button
searchButton.addEventListener('click', () => {
    const query = searchInput.value;
    if (query) {
        // --- NEW: This is a BRAND NEW search ---
        nextPageToken = ''; // Reset the token
        currentSearchQuery = query; // Remember this query
        loadMoreButton.style.display = 'none'; // Hide button
        resultsContainer.innerHTML = ''; // Clear old results
        
        // --- NEW: Change the layout ---
        pageContainer.classList.add('results-layout');
        pageContainer.classList.remove('centered-layout');

        searchVideos(currentSearchQuery); // Call the search
    }
});

// Add event listener for the load more button
loadMoreButton.addEventListener('click', () => {
    // This now loads more SEARCH results
    if (currentSearchQuery) {
        searchVideos(currentSearchQuery);
    }
});

// --- Event listeners for closing the modal ---
modalCloseButton.addEventListener('click', () => {
    closeModal();
});
modalContainer.addEventListener('click', (event) => {
    if (event.target === modalContainer) {
        closeModal();
    }
});

// --- Function to open the modal ---
function openModal(videoId) {
    videoPlayerContainer.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
            title="YouTube video player" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
    modalContainer.style.display = 'flex'; 
}

// --- Function to close the modal ---
function closeModal() {
    videoPlayerContainer.innerHTML = '';
    modalContainer.style.display = 'none';
}

// --- UPDATED: This function now handles pagination ---
async function searchVideos(query) {
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}&type=video&maxResults=50`;
    
    // --- NEW: If this is a "Load More" click, add the token ---
    if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.items) {
            nextPageToken = data.nextPageToken; // Save the *new* token
            displayVideos(data.items); // Display videos
            
            // Show the button ONLY if there is a *next* page
            if (nextPageToken) {
                loadMoreButton.style.display = 'block';
            } else {
                loadMoreButton.style.display = 'none';
            }
        } else if (data.error) {
            throw new Error(data.error.message);
        } else {
            throw new Error("API returned no videos for this search.");
        }

    } S    catch (error) {
        resultsContainer.innerHTML = `<p><strong>Error:</strong> <pre>${error.toString()}</pre></p>`;
    }
}

// --- NO LONGER LOADING VIDEOS ON PAGE LOAD ---
