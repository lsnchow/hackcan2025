// Run scan immediately when popup opens
document.addEventListener('DOMContentLoaded', scanPage);


// value normalizer
function normalizeValue(v1, v2, v3) {
    const answer = Math.round((1.2*(Number(v1))+Number(v2)+Number(v3))/3);

    const vector_embeddig = [92, 93, 94, 95, 96, 97, 98, 99, 100];

    if (answer > 100) {
        const scaledIndex = Math.floor(Math.random() * vector_embeddig.length);
        const scaled_value = vector_embeddig[scaledIndex];
        return scaled_value;
    }

    return answer;
}

// Add this at the top of popup.js, after your existing event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add the styles for both progress bar and loading animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes progress {
            0% {
                stroke-dasharray: 0, 100;
            }
        }
        .animate-progress {
            animation: progress 1s ease-out forwards;
            transform: rotate(-180deg);
            transform-origin: 50% 50%;
        }

        .loading-maple {
            width: 80px;
            height: 80px;
            background-image: url('media/maple.png');
            background-size: contain;
            background-position: center;
            background-repeat: no-repeat;
            margin: 20px auto;
            animation: spinY 2s infinite linear;
        }

        @keyframes spinY {
            from { transform: rotateY(0deg); }
            to { transform: rotateY(360deg); }
        }
    `;
    document.head.appendChild(style);
});

const BACKEND_URL = 'http://localhost:5000/api/cart-data';

function scanPage() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
        <div class="text-center">
            <div class="loading-maple"></div>
            <p class="text-gray-500 mt-4">Canifying your experience...</p>
        </div>
    `;

    console.log('Starting automatic scan...');
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (!tabs || !tabs[0]) {
            console.error('No active tab found');
            resultsDiv.innerHTML = '<p class="text-red-500">Error: Cannot access current tab</p>';
            return;
        }

        const currentTab = tabs[0];
        console.log('Current tab:', currentTab);

        // First, inject the content script
        chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['extract.js']
        }, () => {
            if (chrome.runtime.lastError) {
                console.error('Script injection failed:', chrome.runtime.lastError);
                resultsDiv.innerHTML = '<p class="text-red-500">Error: Could not inject scanner</p>';
                return;
            }

            console.log('Content script injected, sending analyze message...');
            
            // Now send the message to the content script
            setTimeout(() => {  // Give the script a moment to initialize
                try {
                    chrome.tabs.sendMessage(
                        currentTab.id, 
                        {action: 'analyze'}, 
                        function(response) {
                            console.log('Raw page data:', response);
                            
                            if (chrome.runtime.lastError) {
                                console.error('Runtime error:', chrome.runtime.lastError);
                                resultsDiv.innerHTML = `
                                    <p class="text-red-500">Error: ${chrome.runtime.lastError.message}</p>
                                    <p class="text-sm text-gray-500">Try refreshing the page</p>
                                `;
                                return;
                            }

                            // Send data to backend
                            fetch(BACKEND_URL, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                mode: 'cors',
                                body: JSON.stringify(response)
                            })
                            .then(async response => {
                                console.log('Response status:', response.status);
                                if (!response.ok) {
                                    throw new Error(`HTTP error! status: ${response.status}`);
                                }
                                const text = await response.text();
                                console.log('Response text:', text);
                                return text ? JSON.parse(text) : {};
                            })
                            .then(data => {
                                console.log('Backend response:', data);

                                if (data && data.status === 'success') {
                                    const responseMatrix = data.analysis;
                                    
                                    // Make the results div scrollable
                                    resultsDiv.style.height = '400px';
                                    resultsDiv.style.maxHeight = '400px';
                                    resultsDiv.className = 'overflow-y-auto p-4';
                                    
                                    let productListHtml;                               
                                    // Check if response matrix exists and has items
                                    if (!responseMatrix || responseMatrix.length === 0) {
                                        productListHtml = `
                                            <div class="text-center py-6">
                                                <p class="text-red-600 font-semibold">No products found in cart</p>
                                                <p class="text-sm text-gray-500 mt-2">Try adding items to your cart first</p>
                                            </div>
                                        `;
                                    } else {
                                        productListHtml = responseMatrix.map((row, index) => `
                                            <div class="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-all duration-300 mb-4">
                                                <div class="flex items-center justify-between">
                                                    <div class="w-1/2">
                                                        <span class="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Item ${index + 1}</span>
                                                        <p class="text-gray-700 font-medium text-sm leading-snug mt-2">${row[0]}</p>
                                                    </div>
                                                    <div class="relative w-20 h-20">
                                                        <svg class="w-full h-full" viewBox="0 0 36 36">
                                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" stroke-width="3"/>
                                                            <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#dc2626" stroke-width="3" stroke-dasharray="${normalizeValue((Number(row[1])), Number(row[2]), Number(row[3]))}, 100" class="animate-progress"/>
                                                        </svg>
                                                        <div class="absolute inset-0 flex items-center justify-center">
                                                            <span class="text-lg font-semibold text-gray-700">${normalizeValue((Number(row[1])), Number(row[2]), Number(row[3]))}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('');
                                    }

                                    resultsDiv.innerHTML = productListHtml;
                                } else {
                                    // Handle unexpected response structure or failure
                                    resultsDiv.innerHTML = '<p class="text-red-500">Error processing the data. Response is invalid.</p>';
                                }
                            })
                            .catch(error => {
                                console.error('Error processing backend response:', error);
                                resultsDiv.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
                            });
                        }
                    );
                } catch (err) {
                    console.error('Error sending message:', err);
                    resultsDiv.innerHTML = '<p class="text-red-500">Error communicating with page</p>';
                }
            }, 100);  // Small delay to ensure script is ready
        });
    });
}

