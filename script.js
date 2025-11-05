// --- PASTE YOUR (FULL!) API KEY HERE ---
const API_KEY = 'AIzaSyAJszk6T_pxgXTIahpGXfrU8e8-nf9a5y0';

// Get the HTML elements we need to work with
const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');
const loadMoreButton = document.getElementById('load-more-button');

// A variable to hold our "magic ticket"
let nextPageToken = '';
let currentChannelId = 'UCaO-aO_m-iN8G0_7-yE-1fQ'; // FIWA Official ID

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
        nextPageToken = ''; 
        loadMoreButton.style.display = 'none';
        searchVideos(query);
    }
});

// Add event listener for the load more button
loadMoreButton.addEventListener('click', () => {
    loadChannelVideos();
});

// This function calls the YouTube API for SEARCH
async function searchVideos(query) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}&type=video&maxResults=12`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        resultsContainer.innerHTML = ''; // Clear old results

        // --- NEW SAFETY CHECK ---
        if (data.items) {
            displayVideos(data.items);
        } else if (data.error) {
            // Throw the error message from Google
            throw new Error(data.error.message);
        } else {
            throw new Error("API returned no videos for this search.");
        }
        // --- END OF SAFETY CHECK ---

    } 
    catch (error) {
        resultsContainer.innerHTML = `<p><strong>Error:</strong> <pre>${error.toString()}</pre></p>`;
    }
}

// This function loads the FIWA channel videos
async function loadChannelVideos() {
    let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${currentChannelId}&order=date&type=video&key=${API_KEY}&maxResults=50`;

    if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        // --- NEW SAFETY CHECK ---
        if (data.items) {
            nextPageToken = data.nextPageToken; // Save the token

            if (!url.includes(`&pageToken=`)) {
                 resultsContainer.innerHTML = ''; // Clear only on first load
            }
            
            displayVideos(data.items); // Call the function

            if (nextPageToken) {
                loadMoreButton.style.display = 'block';
            } else {
                loadMoreButton.style.display = 'none';
            }
        } else if (data.error) {
            // Throw the error message from Google
            throw new Error(data.error.message);
        } else {
            // This happens if the channel has no videos or there's an issue
            if (resultsContainer.innerHTML === '') {
                 resultsContainer.innerHTML = '<p>Could not load channel videos.</p>';
            }
        }
        // --- END OF SAFETY CHECK ---

    } catch (error) {
        resultsContainer.innerHTML = `<p><strong>Error loading channel videos:</strong> <pre>${error.toString()}</pre></p>`;
    }
}

// This function takes the video data and builds the HTML
function displayVideos(videos) {
    // --- NEW BULLETPROOF CHECK ---
    // If 'videos' is undefined, null, or has no length, stop.
    if (!videos || videos.length === 0) {
        if (resultsContainer.innerHTML === '') {
             resultsContainer.innerHTML = '<p>No videos found.</p>';
        }
        return;
    }
    // --- END OF CHECK ---

    videos.forEach(video => {
        const videoId = video.id.videoId;
        const videoTitle = video.snippet.title;
        const videoThumbnail = video.snippet.thumbnails.high.url;

        const videoElement = document.createElement('div');
        videoElement.className = 'video-item';

        videoElement.innerHTML = `
            <img src="${videoThumbnail}" alt="${videoTitle}">
            <h4>${videoTitle}</h4>
        `;
        
        videoElement.addEventListener('click', () => {
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
        });

        resultsContainer.appendChild(videoElement);
    });
}

// Call the function to load the *first page* of channel videos when the script first runs
loadChannelVideos();
