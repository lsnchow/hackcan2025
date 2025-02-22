// Script to extract text content from shopping cart/checkout pages

// Add this at the very top of extract.js
console.log('Content script loaded!');

// Function to extract all text content from the page
function extractPageContent() {
    // Helper to clean product names
    function cleanProductName(name) {
        return name
            .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
            .replace(/\n/g, '')    // Remove newlines
            .trim();               // Remove leading/trailing whitespace
    }

    // Helper to create unique product key
    function createProductKey(name) {
        return cleanProductName(name).toLowerCase();
    }

    // Use a Map to store unique products
    const productMap = new Map();

    // Get all product-like elements
    const productElements = document.querySelectorAll(
        '[class*="product"],[class*="item"],[class*="cart-item"],' +
        '[class*="checkout-item"],[class*="basket-item"]'
    );

    // Process each element
    productElements.forEach(el => {
        const nameElement = el.querySelector('h1, h2, h3, .title, [class*="title"], [class*="name"]');
        if (!nameElement) return;

        const rawName = nameElement.textContent;
        const cleanName = cleanProductName(rawName);
        const productKey = createProductKey(cleanName);

        if (productMap.has(productKey)) {
            // Product already exists, increment quantity
            const product = productMap.get(productKey);
            product.quantity += 1;
        } else {
            // New product
            productMap.set(productKey, {
                name: cleanName,
                quantity: 1,
                element: el.tagName,
                classes: el.className,
                text: el.innerText,
                html: el.innerHTML
            });
        }
    });

    // Convert Map to Array for response
    const products = Array.from(productMap.values());

    return {
        url: window.location.href,
        title: document.title,
        products,
        totalUniqueProducts: products.length,
        totalQuantity: products.reduce((sum, p) => sum + p.quantity, 0),
        timestamp: new Date().toISOString()
    };
}

// Function to check if current page is a cart/checkout page
function isCartPage() {
    console.log('Checking URL:', window.location.href);
    const currentUrl = window.location.href.toLowerCase();
    
    // Updated cart indicators
    const CART_INDICATORS = [
        '/cart',
        '/checkout',
        '/basket',
        'shopping-cart',
        'shopping-basket',
        'payment',
        'order-summary',
        'panier', // French
        'caisse'  // French
    ];

    // Check URL
    const isCartUrl = CART_INDICATORS.some(indicator => currentUrl.includes(indicator));
    console.log('Is cart URL:', isCartUrl);

    // Check page elements
    const cartElements = document.querySelectorAll(
        '[class*="cart"],[class*="checkout"],[id*="cart"],[id*="checkout"],' +
        '[class*="basket"],[id*="basket"],[class*="shopping"],[id*="shopping"]'
    );
    console.log('Cart elements found:', cartElements.length);

    return isCartUrl || cartElements.length > 0;
}

// Main function to analyze the page
function analyzePage() {
    console.log('Checking if cart page...');
    if (!isCartPage()) {
        console.log('Not a cart page');
        return {
            isCart: false,
            message: 'This does not appear to be a shopping cart or checkout page'
        };
    }

    console.log('Is cart page, extracting product info...');
    const results = extractPageContent();
    console.log('Extracted products:', results);
    return {
        isCart: true,
        ...results
    };
}

// Add listener for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in content script:', request);
    
    try {
        if (request.action === 'analyze') {
            console.log('Starting page analysis...');
            const pageData = extractPageContent();
            console.log('Page data:', pageData);
            sendResponse(pageData);
        }
    } catch (err) {
        console.error('Error in content script:', err);
        sendResponse({
            error: true,
            message: err.message
        });
    }
    
    return true;
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isCartPage,
        extractPageContent,
        analyzePage
    };
}