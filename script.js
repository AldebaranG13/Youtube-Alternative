document.addEventListener('DOMContentLoaded', () => {

    // --- PASTE YOUR (FULL!) API KEY HERE ---
    const API_KEY = 'AIzaSyAJszk6T_pxgXTIahpGXfrU8e8-nf9a5y0';

    // Get the HTML elements
    // const pageContainer = document.getElementById('page-container'); // DELETED
    const searchButton = document.getElementById('search-button');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('results-container');
    const loadMoreButton = document.getElementById('load-more-button');
    const modalContainer = document.getElementById('modal-container');
    const modalCloseButton = document.getElementById('modal-close-button');
    const videoPlayerContainer = document.getElementById('video-player-container');
    const analyticsContainer = document.getElementById('video-analytics-container');

    // --- Variables for search pagination ---
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
            let videoId, videoTitle, videoThumbnail, channelName;
            
            if (video.kind === 'youtube#searchResult') {
                videoId = video.id.videoId;
                videoTitle = video.snippet.title;
                videoThumbnail = video.snippet.thumbnails.high.url;
                channelName = video.snippet.channelTitle;
            } else {
                return; // Unknown, skip
            }

            const videoElement = document.createElement('div');
            videoElement.className = 'video-item';

            videoElement.innerHTML = `
                <img src="${videoThumbnail}" alt="${videoTitle}">
                <h4>${videoTitle}</h4>
                <p class="channel-name">${channelName}</p> 
            `;
            
            videoElement.addEventListener('click', () => {
                getVideoDetailsAndOpenModal(videoId);
            });

            resultsContainer.appendChild(videoElement);
        });
    }

    // --- NEW FUNCTION ---
    // This makes a 2nd API call to get stats
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++
    async function getVideoDetailsAndOpenModal(videoId) {
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.items && data.items.length > 0) {
                const videoDetails = data.items[0];
                openModal(videoId, videoDetails);
            } else {
                throw new Error('Video details not found.');
            }
        } catch (error) {
            openModal(videoId, null); 
            console.error('Error loading video details:', error.message);
        }
    }

    // --- UPDATED openModal FUNCTION ---
    // It now accepts 'videoDetails'
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++
    function openModal(videoId, videoDetails) {
        // 1. Add the video player (this is the same)
        videoPlayerContainer.innerHTML = `
            <iframe 
                src="https://www.youtube.com/embed/${videoId}?autoplay=1" 
                title="YouTube video player" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        
        // 2. Check if we have details to show
        if (videoDetails) {
            const stats = videoDetails.statistics;
            const snippet = videoDetails.snippet;

            const viewCount = parseInt(stats.viewCount ?? 0).toLocaleString();
            const likeCount = parseInt(stats.likeCount ?? 0).toLocaleString();
            const commentCount = parseInt(stats.commentCount ?? 0).toLocaleString();

            const uploadDate = new Date(snippet.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // 3. Build the HTML for the stats
            analyticsContainer.innerHTML = `
                <p>${snippet.title}</p>
                <div class="stats-grid">
                    <div class="stat-item">
                        <strong>${viewCount}</strong>
                        Views
                    </div>
                    <div class="stat-item">
                        <strong>${likeCount}</strong>
                        Likes
                    </div>
                    <div class="stat-item">
                        <strong>${commentCount}</strong>
                        Comments
                    </div>
                    <div class="stat-item">
                        <strong>${uploadDate}</strong>
                        Uploaded
                    </div>
                </div>
            `;
            // 4. Make the analytics box visible
            analyticsContainer.classList.add('visible');
        }
        
        // 5. Show the modal
        modalContainer.style.display = 'flex'; 
    }

    // --- UPDATED closeModal FUNCTION ---
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++
    function closeModal() {
        videoPlayerContainer.innerHTML = '';
        analyticsContainer.innerHTML = '';
        analyticsContainer.classList.remove('visible');
        
        modalContainer.style.display = 'none';
    }

    //
    // --- (All other functions are the same) ---
    //

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
            currentSearchQuery = query;
            loadMoreButton.style.display = 'none'; 
            resultsContainer.innerHTML = ''; 
            
            // --- LAYOUT SWITCHING CODE DELETED ---

            searchVideos(currentSearchQuery);
        }
    });

    // Add event listener for the load more button
    loadMoreButton.addEventListener('click', () => {
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

    // --- Search function ---
    async function searchVideos(query) {
        // --- THIS NEW LINE SETS THE QUERY FOR "LOAD MORE" ---
        currentSearchQuery = query;

        let url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&key=${API_KEY}&type=video&maxResults=50`;
        
        if (nextPageToken) {
            url += `&pageToken=${nextPageToken}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.items) {
                nextPageToken = data.nextPageToken; 
                displayVideos(data.items); 
                
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

        } 
        catch (error) {
            resultsContainer.innerHTML = `<p><strong>Error:</strong> <pre>${error.toString()}</pre></p>`;
        }
    }

    // ---
    // NEW: LOAD DEFAULT VIDEOS ON STARTUP
    // ---
    searchVideos('popular educational videos');

}); // <-- This closes the DOMContentLoaded listener
