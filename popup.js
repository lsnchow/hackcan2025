// Run scan immediately when popup opens
document.addEventListener('DOMContentLoaded', scanPage);


// Add this at the top of popup.js, after your existing event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Add the styles for the progress bar animation
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
    `;
    document.head.appendChild(style);
});

const BACKEND_URL = 'http://localhost:5000/api/cart-data';

function scanPage() {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '<p class="text-center text-gray-500">Scanning...</p>';

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
                                        productListHtml = `
                                            <div class="space-y-4">
                                                ${responseMatrix.map((row, index) => `
                                                    <div class="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-md p-4 hover:shadow-lg transition-all duration-300">
                                                        <div class="flex justify-between items-center">
                                                            <span class="bg-red-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Item ${index + 1}</span>
                                                            <span class="text-xs text-gray-400">In cart</span>
                                                        </div>
                                                        <div class="flex mt-2">
                                                            <div class="w-1/2 pr-2">
                                                                <p class="text-gray-700 font-medium text-sm leading-snug">${row[0]}</p>
                                                            </div>
                                                            <div class="w-1/2 pl-2 flex justify-center items-center">
                                                                <div class="relative w-20 h-20">
                                                                    <!-- Background circle -->
                                                                    <svg class="w-full h-full" viewBox="0 0 36 36">
                                                                        <path
                                                                            d="M18 2.0845
                                                                            a 15.9155 15.9155 0 0 1 0 31.831
                                                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke="#eee"
                                                                            stroke-width="3"
                                                                        />
                                                                        <!-- Foreground circle with animation -->
                                                                        <path
                                                                            d="M18 2.0845
                                                                            a 15.9155 15.9155 0 0 1 0 31.831
                                                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                                                            fill="none"
                                                                            stroke="#dc2626"
                                                                            stroke-width="3"
                                                                            stroke-dasharray="${Math.round((1.2*(Number(row[1]))+Number(row[2])+Number(row[3]))/3)}, 100"
                                                                            class="animate-progress"
                                                                        />
                                                                    </svg>
                                                                    <!-- Percentage text in the middle -->
                                                                    <div class="absolute inset-0 flex items-center justify-center">
                                                                        <span class="text-lg font-semibold text-gray-700">${Math.round((1.2*(Number(row[1]))+Number(row[2])+Number(row[3]))/3)}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        `;
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

