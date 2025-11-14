document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Element Selectors ---
    const splashScreen = document.getElementById('splash-screen');
    const enterBtn = document.getElementById('enter-btn');
    
    const homePage = document.getElementById('home-page');
    const messagePage = document.getElementById('message-page');
    const readListenBtn = document.getElementById('read-listen-btn');
    
    const messageText = document.getElementById('message-text');
    const listenBtn = document.getElementById('listen-btn');
    const btnYes = document.getElementById('btn-yes');
    const btnNo = document.getElementById('btn-no');

    const bgMusic = document.getElementById('bg-music');
    const voiceMessage = document.getElementById('voice-message');
    
    const playPauseBtn = document.getElementById('play-pause-btn');
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const currentTrackName = document.getElementById('current-track-name');

    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');
    const themeSelect = document.getElementById('theme-select');
    const playlistEditor = document.getElementById('playlist-editor');

    // --- 2. Data & State ---

    // TODO: Replace with actual paths to your music files
    const allTracks = [
        'audio/backgroundmusic1.mp3',
        'audio/backgroundmusic2.mp3',
        'audio/backgroundmusic3.mp3',
        'audio/backgroundmusic4.mp3',
        'audio/backgroundmusic5.mp3',
    ];

    let activeTracks = [...allTracks];
    let currentTrackIndex = 0;
    let isPlaying = false;
    let originalBgVolume = 0.5;

    // TODO: Replace with actual path to the voice recording
    voiceMessage.src = 'audio/audio.mp3';

    // TODO: This is the time-mapping JSON for lyric highlighting.
    // You MUST create this map by listening to your audio.mp3
    // The keys (e.g., "line-1") must match the <span> IDs in the HTML.
    const timestamps = {
        "line-1": { start: 0.5, end: 4.8 },
        "line-2": { start: 5.5, end: 9.0 },
        "line-3": { start: 9.1, end: 13.0 },
        "line-4": { start: 13.1, end: 20.2 },
        "line-5": { start: 20.3, end: 24.5 },
        "line-6": { start: 24.6, end: 33.0 },
        "line-7": { start: 33.5, end: 34.8 },
        "line-8": { start: 35.5, end: 37.5 },
        "line-9": { start: 37.6, end: 46.0 },
        "line-10": { start: 46.5, end: 51.8 },
        "line-11": { start: 52.3, end: 56.5 },
        "line-12": { start: 56.6, end: 59.2 },
        "line-13": { start: 59.8, end: 63.0 },
        "line-14": { start: 63.5, end: 66.2 },
        "line-15": { start: 66.8, end: 68.5 },
    };

    // --- 3. Splash Screen & App Init ---
    enterBtn.addEventListener('click', () => {
        splashScreen.classList.add('fade-out');
        // We must wait for user interaction to play audio.
        // This click is that interaction.
        playMusic();
        
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 500); // Match CSS transition
    });

    readListenBtn.addEventListener('click', () => {
        homePage.classList.add('hidden');
        messagePage.classList.remove('hidden');
    });

    // --- 4. Music Player Logic ---
    function loadTrack(index) {
        if (activeTracks.length === 0) return;
        currentTrackIndex = index % activeTracks.length;
        if (currentTrackIndex < 0) {
            currentTrackIndex = activeTracks.length - 1;
        }
        bgMusic.src = activeTracks[currentTrackIndex];
        currentTrackName.textContent = activeTracks[currentTrackIndex].split('/').pop();
    }

    function playMusic() {
        if (activeTracks.length === 0) return;
        bgMusic.play().then(() => {
            isPlaying = true;
            playPauseBtn.textContent = '⏸';
        }).catch(e => console.error("Audio playback failed:", e));
    }

    function pauseMusic() {
        bgMusic.pause();
        isPlaying = false;
        playPauseBtn.textContent = '▶️';
    }

    playPauseBtn.addEventListener('click', () => {
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    });

    nextBtn.addEventListener('click', () => {
        loadTrack(currentTrackIndex + 1);
        playMusic();
    });

    prevBtn.addEventListener('click', () => {
        loadTrack(currentTrackIndex - 1);
        playMusic();
    });

    bgMusic.addEventListener('ended', () => {
        // Automatically play next track when one ends
        nextBtn.click();
    });

    volumeSlider.addEventListener('input', (e) => {
        originalBgVolume = parseFloat(e.target.value);
        bgMusic.volume = originalBgVolume;
    });

    // --- 5. Message & "Listen" Logic ---
    listenBtn.addEventListener('click', () => {
        if (voiceMessage.paused) {
            // Duck the background music
            originalBgVolume = bgMusic.volume;
            bgMusic.volume = originalBgVolume * 0.2; // Reduce to 20%
            
            voiceMessage.play();
            listenBtn.textContent = 'Pause Recording';
        } else {
            voiceMessage.pause();
            listenBtn.textContent = 'Listen to this Letter';
            // Restore background volume
            bgMusic.volume = originalBgVolume;
        }
    });

    voiceMessage.addEventListener('ended', () => {
        // Restore background volume when voice ends
        bgMusic.volume = originalBgVolume;
        listenBtn.textContent = 'Listen to this Letter';
        clearHighlights();
    });

    // The core "lyric-sync" logic
    voiceMessage.addEventListener('timeupdate', () => {
        const currentTime = voiceMessage.currentTime;
        let activeLineId = null;

        // Find which line is currently active
        for (const [id, times] of Object.entries(timestamps)) {
            if (currentTime >= times.start && currentTime <= times.end) {
                activeLineId = id;
                break;
            }
        }

        // Update highlights
        messageText.querySelectorAll('span[id^="line-"]').forEach(span => {
            if (span.id === activeLineId) {
                span.classList.add('highlight');
            } else {
                span.classList.remove('highlight');
            }
        });
    });

    function clearHighlights() {
        messageText.querySelectorAll('span.highlight').forEach(span => {
            span.classList.remove('highlight');
        });
    }

    // --- 6. Response Button Logic ---
    btnYes.addEventListener('click', () => sendResponse('yes'));
    btnNo.addEventListener('click', () => sendResponse('no'));

    function sendResponse(response) {
        // Disable buttons to prevent multiple submissions
        btnYes.disabled = true;
        btnNo.disabled = true;

        const data = {
            response: response,
            timestamp: new Date().toISOString()
        };

        // --- SIMULATION ---
        // In a real app, you'd use fetch() to send this to your Firebase Cloud Function.
        // e.g., fetch('https://your-function-url...', { method: 'POST', body: JSON.stringify(data) })
        console.log('Simulating API call to Firebase Function:');
        console.log('Sending data:', data);

        // Show a confirmation to the user
        setTimeout(() => {
            alert(`Thank you for your response. You selected: "${response}"`);
            messagePage.innerHTML = `<h2>Thank you.</h2><p>Your response has been sent.</p>`;
        }, 500);
        // --- END SIMULATION ---
    }

    // --- 7. Settings Modal Logic ---
    settingsToggleBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    // Theme Switching
    const systemThemeMatcher = window.matchMedia('(prefers-color-scheme: dark)');
    
    function applyTheme(theme) {
        if (theme === 'system') {
            document.body.dataset.theme = systemThemeMatcher.matches ? 'dark' : 'light';
        } else {
            document.body.dataset.theme = theme;
        }
        localStorage.setItem('theme', theme);
    }

    systemThemeMatcher.addEventListener('change', () => {
        if (themeSelect.value === 'system') {
            applyTheme('system');
        }
    });
    
    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    // Playlist Editor
    function renderPlaylistEditor() {
        playlistEditor.innerHTML = '';
        allTracks.forEach(track => {
            const trackName = track.split('/').pop();
            const li = document.createElement('li');
            li.innerHTML = `
                <input type="checkbox" id="${trackName}" data-track="${track}" ${activeTracks.includes(track) ? 'checked' : ''}>
                <label for="${trackName}">${trackName}</label>
            `;
            playlistEditor.appendChild(li);
        });
    }

    playlistEditor.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const track = e.target.dataset.track;
            if (e.target.checked) {
                if (!activeTracks.includes(track)) {
                    // Maintain original order
                    activeTracks = allTracks.filter(t => 
                        activeTracks.includes(t) || t === track
                    );
                }
            } else {
                activeTracks = activeTracks.filter(t => t !== track);
            }
            
            // Check if current track was disabled
            if (!activeTracks.includes(bgMusic.src.split('/').pop())) {
                pauseMusic();
                loadTrack(0); // Load first available track
            }
        }
    });

    // --- 8. Initial Load ---
    loadTrack(0);
    bgMusic.volume = originalBgVolume;
    volumeSlider.value = originalBgVolume;
    renderPlaylistEditor();
    
    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'system';
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
});
