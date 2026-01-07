/**
 * GeneratCPro Telegram Mini App - JavaScript
 * Fixed Ad Loading Issues
 */

// ===========================================
// CONFIGURATION - EDIT THESE VALUES
// ===========================================

const CONFIG = {
    // Your JSON data source for channels and links
    jsonDataUrl: '', // Leave empty to use defaults below
    
    // Default fallback data
    defaultChannels: [
        {
            id: 1,
            name: "GeneratCPro BOT News",
            description: "Latest updates about the bot",
            icon: "fas fa-robot",
            link: "https://t.me/+-ALd_P5x4dw4MmNk",
            color: "#0088cc"
        },
        {
            id: 2,
            name: "Canva Pro Team Link",
            description: "Direct link for FREE Canva Pro access",
            icon: "fas fa-users",
            link: "https://t.me/directcanvapro",
            color: "#34b7f1"
        }
    ],
    
    // Default redirect link
    defaultRedirectLink: "https://www.canva.com/brand/join?token=7kZK8fOHGeTW6wTOrVT2Sg&brandingVariant=edu&referrer=team-invite",
    
    // Ad settings
    adDuration: 5000, // 5 seconds
    adZoneId: "10310749"
};

// ===========================================
// APP STATE MANAGEMENT
// ===========================================

const AppState = {
    // Current state
    hasWatchedAd: false,
    isAdPlaying: false,
    timerInterval: null,
    
    // Data
    currentLink: CONFIG.defaultRedirectLink,
    channels: CONFIG.defaultChannels,
    
    // Ad SDK status
    adSDKLoaded: false,
    adSDKError: null,
    
    // Telegram WebApp
    isTelegramWebApp: false
};

// ===========================================
// DOM ELEMENTS
// ===========================================

const DOM = {
    // Main CTA button (changes between Watch and Get)
    ctaButton: null,
    
    // Status steps
    stepWatch: null,
    stepGet: null,
    
    // Ad timer elements
    adTimer: null,
    timerCount: null,
    timerProgress: null,
    
    // Channels section
    channelsContainer: null,
    loadingState: null
};

// ===========================================
// INITIALIZATION
// ===========================================

/**
 * Initialize the app when page loads
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 GeneratCPro App Initializing...');
    
    // Initialize DOM elements
    initializeDOMElements();
    
    // Check ad SDK status
    checkAdSDKStatus();
    
    // Check for Telegram WebApp
    checkTelegramEnvironment();
    
    // Setup button click handler
    setupCTAButton();
    
    // Load channels
    renderChannels();
    
    console.log('✅ App initialized successfully');
});

/**
 * Initialize all DOM elements
 */
function initializeDOMElements() {
    DOM.ctaButton = document.getElementById('main-cta');
    DOM.stepWatch = document.getElementById('step-watch');
    DOM.stepGet = document.getElementById('step-get');
    DOM.adTimer = document.getElementById('ad-timer');
    DOM.timerCount = document.getElementById('timer-count');
    DOM.timerProgress = document.querySelector('.timer-progress');
    DOM.channelsContainer = document.getElementById('channels-container');
    DOM.loadingState = document.getElementById('loading-state');
    
    console.log('✅ DOM elements initialized');
}

/**
 * Check ad SDK status and retry if not loaded
 */
function checkAdSDKStatus() {
    console.log('🔍 Checking Ad SDK status...');
    
    // Check if SDK script is in DOM
    const adScript = document.querySelector('script[src*="libtl.com"]');
    if (!adScript) {
        console.error('❌ Ad SDK script not found in HTML');
        AppState.adSDKError = 'SDK script not loaded';
        return;
    }
    
    // Check if SDK function exists
    if (typeof window.show_10310749 === 'function') {
        AppState.adSDKLoaded = true;
        console.log('✅ Ad SDK loaded: show_10310749() is available');
    } else {
        console.warn('⚠️ show_10310749() function not found yet');
        console.log('💡 The SDK might still be loading...');
        
        // Try to check again after delay
        setTimeout(() => {
            if (typeof window.show_10310749 === 'function') {
                AppState.adSDKLoaded = true;
                console.log('✅ Ad SDK loaded after delay');
            } else {
                AppState.adSDKError = 'SDK function not found';
                console.error('❌ Ad SDK failed to load');
                showAdStatusMessage('Ad service temporarily unavailable. You can still proceed.');
            }
        }, 2000);
    }
}

/**
 * Check if running inside Telegram WebApp
 */
function checkTelegramEnvironment() {
    if (window.Telegram && window.Telegram.WebApp) {
        AppState.isTelegramWebApp = true;
        console.log('🤖 Telegram WebApp detected');
        
        Telegram.WebApp.expand();
        Telegram.WebApp.ready();
    }
}

/**
 * Setup the CTA button with click handler
 */
function setupCTAButton() {
    if (!DOM.ctaButton) return;
    
    DOM.ctaButton.addEventListener('click', async function() {
        // If user hasn't watched ad yet, show ad
        if (!AppState.hasWatchedAd) {
            await handleWatchAd();
        } 
        // If user has watched ad, redirect to link
        else {
            handleGetLink();
        }
    });
    
    console.log('✅ CTA button setup complete');
}

// ===========================================
// WATCH AD PROCESS - IMPROVED
// ===========================================

/**
 * Handle the "Watch Ad" button click
 */
async function handleWatchAd() {
    // Prevent multiple clicks
    if (AppState.isAdPlaying) {
        console.log('Ad already playing...');
        return;
    }
    
    console.log('🎬 Starting ad process...');
    
    // Disable button and set state
    AppState.isAdPlaying = true;
    DOM.ctaButton.disabled = true;
    
    // Show ad timer
    showAdTimer();
    
    try {
        // Try to show ad
        await showRewardedAd();
        
        // Success - update UI
        onAdCompleted();
        
    } catch (error) {
        console.error('❌ Ad error:', error);
        
        // Even if ad fails, allow user to continue after delay
        showMessage('Ad failed. Continuing to next step...', 'warning');
        
        // Wait for timer to complete, then proceed
        setTimeout(() => {
            DOM.adTimer.style.display = 'none';
            onAdCompleted();
        }, 1000);
    }
}

/**
 * Show the 5-second ad timer with progress circle
 */
function showAdTimer() {
    if (!DOM.adTimer || !DOM.timerCount || !DOM.timerProgress) return;
    
    DOM.adTimer.style.display = 'flex';
    
    let timeLeft = 5;
    DOM.timerCount.textContent = timeLeft;
    
    const circumference = 2 * Math.PI * 35;
    DOM.timerProgress.style.strokeDasharray = circumference;
    DOM.timerProgress.style.strokeDashoffset = circumference;
    
    // Clear any existing interval
    if (AppState.timerInterval) {
        clearInterval(AppState.timerInterval);
    }
    
    // Start countdown
    AppState.timerInterval = setInterval(() => {
        timeLeft--;
        DOM.timerCount.textContent = timeLeft;
        
        const progress = ((5 - timeLeft) / 5) * circumference;
        DOM.timerProgress.style.strokeDashoffset = circumference - progress;
        
        if (timeLeft <= 0) {
            clearInterval(AppState.timerInterval);
            DOM.adTimer.style.display = 'none';
        }
    }, 1000);
}

/**
 * Show the rewarded interstitial ad - IMPROVED VERSION
 */
function showRewardedAd() {
    return new Promise((resolve, reject) => {
        console.log('🎯 Attempting to show ad...');
        
        // OPTION 1: Try to use your SDK
        if (AppState.adSDKLoaded && typeof window.show_10310749 === 'function') {
            console.log('🔄 Using show_10310749() from SDK');
            
            try {
                window.show_10310749()
                    .then(() => {
                        console.log('✅ Ad completed via SDK');
                        alert('You have seen an ad!');
                        resolve();
                    })
                    .catch(error => {
                        console.error('❌ SDK ad error:', error);
                        reject(error);
                    });
            } catch (error) {
                console.error('❌ Error calling SDK:', error);
                reject(error);
            }
        }
        // OPTION 2: SDK not loaded, use fallback
        else {
            console.warn('⚠️ SDK not available, using fallback');
            
            // Show a mock ad interface
            showMockAdInterface()
                .then(() => {
                    console.log('✅ Fallback ad completed');
                    alert('You have seen an ad!');
                    resolve();
                })
                .catch(error => {
                    console.error('❌ Fallback ad error:', error);
                    reject(error);
                });
        }
    });
}

/**
 * Show a mock ad interface for testing/fallback
 */
function showMockAdInterface() {
    return new Promise((resolve) => {
        console.log('🎬 Showing mock ad interface');
        
        // Update timer message to show it's a mock ad
        const timerMsg = DOM.adTimer.querySelector('.timer-message');
        if (timerMsg) {
            timerMsg.textContent = 'Demo Ad - Testing Mode';
            timerMsg.style.color = '#ff9800';
        }
        
        // Wait for 5 seconds (simulating ad)
        setTimeout(() => {
            console.log('✅ Mock ad completed');
            resolve();
        }, 5000);
    });
}

/**
 * Update UI after ad completes
 */
function onAdCompleted() {
    console.log('✅ Ad process completed, activating Get Link button');
    
    AppState.hasWatchedAd = true;
    AppState.isAdPlaying = false;
    
    // Update status indicator
    if (DOM.stepWatch) DOM.stepWatch.classList.add('completed');
    if (DOM.stepGet) DOM.stepGet.classList.add('active');
    
    // Change button to "Get Now"
    if (DOM.ctaButton) {
        DOM.ctaButton.innerHTML = `
            <i class="fas fa-fire"></i>
            <span>🔥 Get Now</span>
        `;
        DOM.ctaButton.classList.remove('watch-button');
        DOM.ctaButton.classList.add('get-button');
        DOM.ctaButton.disabled = false;
    }
    
    console.log('🎯 Button changed to "Get Now"');
}

// ===========================================
// GET LINK PROCESS
// ===========================================

/**
 * Handle the "Get Link" button click
 */
function handleGetLink() {
    console.log('🔗 Redirecting to:', AppState.currentLink);
    
    if (!DOM.ctaButton) return;
    
    DOM.ctaButton.disabled = true;
    DOM.ctaButton.classList.add('success-animation');
    
    setTimeout(() => {
        window.open(AppState.currentLink, '_blank');
        
        // Reset button
        setTimeout(() => {
            DOM.ctaButton.disabled = false;
            DOM.ctaButton.classList.remove('success-animation');
        }, 1000);
        
    }, 500);
}

// ===========================================
// CHANNELS RENDERING
// ===========================================

/**
 * Render channels to the UI
 */
function renderChannels() {
    if (!DOM.channelsContainer) return;
    
    DOM.channelsContainer.innerHTML = '';
    
    // Hide loading
    if (DOM.loadingState) {
        DOM.loadingState.style.display = 'none';
    }
    
    // Check if we have channels
    if (!AppState.channels || AppState.channels.length === 0) {
        DOM.channelsContainer.innerHTML = `
            <div class="loading-state">
                <p>No channels available</p>
            </div>
        `;
        return;
    }
    
    // Create and append channel cards
    AppState.channels.forEach(channel => {
        const channelCard = createChannelCard(channel);
        DOM.channelsContainer.appendChild(channelCard);
    });
    
    console.log(`📱 Rendered ${AppState.channels.length} channel(s)`);
}

/**
 * Create a single channel card element
 */
function createChannelCard(channel) {
    const card = document.createElement('a');
    card.className = 'channel-card';
    card.href = channel.link || '#';
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    
    const iconColor = channel.color || '#0088cc';
    const darkerColor = darkenColor(iconColor, 20);
    
    card.innerHTML = `
        <div class="channel-icon" style="background: linear-gradient(135deg, ${iconColor}, ${darkerColor})">
            <i class="${channel.icon || 'fab fa-telegram-plane'}"></i>
        </div>
        <div class="channel-info">
            <div class="channel-name">${escapeHtml(channel.name)}</div>
            <div class="channel-description">${escapeHtml(channel.description)}</div>
        </div>
        <div class="channel-arrow">
            <i class="fas fa-chevron-right"></i>
        </div>
    `;
    
    return card;
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Darken a hex color
 */
function darkenColor(hex, percent) {
    hex = hex.replace(/^#/, '');
    
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    r = Math.floor(r * (100 - percent) / 100);
    g = Math.floor(g * (100 - percent) / 100);
    b = Math.floor(b * (100 - percent) / 100);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Show message to user
 */
function showMessage(message, type = 'info') {
    console.log(`${type}: ${message}`);
}

/**
 * Show ad status message in timer
 */
function showAdStatusMessage(message) {
    if (!DOM.adTimer) return;
    
    const timerMsg = DOM.adTimer.querySelector('.timer-message');
    if (timerMsg) {
        timerMsg.textContent = message;
        timerMsg.style.color = '#ff9800';
    }
}

// ===========================================
// DEBUGGING & TESTING
// ===========================================

// Add debug functions to window
window.debugGeneratCPro = {
    // Test ad directly
    testAd: function() {
        console.log('🔧 Testing ad...');
        handleWatchAd();
    },
    
    // Skip to Get Now
    skipToGet: function() {
        console.log('🔧 Skipping to Get Now...');
        onAdCompleted();
    },
    
    // Check SDK status
    checkSDK: function() {
        console.log('🔍 SDK Status:');
        console.log('- show_10310749 exists:', typeof window.show_10310749);
        console.log('- SDK Loaded:', AppState.adSDKLoaded);
        console.log('- SDK Error:', AppState.adSDKError);
    },
    
    // Reload SDK
    reloadSDK: function() {
        console.log('🔄 Attempting to reload SDK...');
        const script = document.createElement('script');
        script.src = '//libtl.com/sdk.js';
        script.setAttribute('data-zone', '10310749');
        script.setAttribute('data-sdk', 'show_10310749');
        document.head.appendChild(script);
        
        setTimeout(() => {
            console.log('✅ SDK reload attempted');
            this.checkSDK();
        }, 2000);
    }
};

console.log('🔧 Debug: window.debugGeneratCPro available');

console.log('💡 Try: debugGeneratCPro.testAd() to test ad');


