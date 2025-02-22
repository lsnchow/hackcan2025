// Run scan immediately when popup opens
document.addEventListener('DOMContentLoaded', scanPage);

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
                                            <div class="text-center py-8 space-y-4">
                                                <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                                    <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                    </svg>
                                                </div>
                                                <h3 class="text-lg font-semibold text-red-800">Empty Cart Detected</h3>
                                                <p class="text-sm text-red-400 max-w-xs mx-auto">
                                                    We couldn't find any products in your shopping cart. Try adding items first.
                                                </p>
                                            </div>
                                        `;
                                    } else {
                                        productListHtml = `
                                            <div class="grid gap-4">
                                                ${responseMatrix.map((row, index) => `
                                                    <div class="group relative bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300 border-l-4 border-red-500">
                                                        <div class="flex justify-between items-start">
                                                            <div class="pr-4">
                                                                <span class="text-xs font-semibold text-red-600">#${index + 1}</span>
                                                                <h3 class="text-base font-medium text-gray-800 mt-1">${row[0]}</h3>
                                                                <div class="flex items-center mt-2 space-x-2">
                                                                    <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">80% Canadian</span>
                                                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Certified</span>
                                                                </div>
                                                            </div>
                                                            <div class="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                                                                <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button class="p-1 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-600">
                                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                                                </svg>
                                                            </button>
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

