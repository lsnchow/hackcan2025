Description

Canify boosts the Canadian economy by rewarding consumers who support the “Made in Canada” movement 🇨🇦. This is particularly important when international trade policies pose challenges to our economic growth (ahem, USA). Users who back Canadian businesses receive cryptocurrency rewards and government incentives 💰. Using blockchain technology, Canify provides a transparent and secure way for consumers to be recognized for their commitment to supporting local products.

We developed a Google Chrome extension that analyzes the items in your Amazon cart, assessing them based on whether they are Canadian-made, ethically sourced, and provide good value for money. 🛍️.

For the reward system, users earn NEAR coins based on the Canadian content of their purchases. The coin transactions are funded through affiliate earnings generated from Amazon, creating a sustainable ecosystem that benefits both consumers and the Canadian economy 🌱.

Tools and Technologies:
Frontend Development: JavaScript Tailwind CSS Gemini API

Backend Development: Flask (Python) Rust & Cargo Shade Agents NEAR Protocol

Infrastructure: Phala Network Docker

NEAR Shade Agents 🔒:
To enhance security and efficiency, Canify integrates with NEAR Protocol and Shade Agents. Here's how:

Smart Contract Deployment: We developed smart contracts using Rust & Cargo, which define the rules for minting and distributing Canify Coins. These contracts ensure that rewards are allocated based on user purchases and Canadian content.
Trusted Execution Environments (TEEs): Shade Agents host these smart contracts, providing a secure environment for executing sensitive operations and safeguarding user data. This guarantees that all transactions and rewards are handled transparently and securely.
Token Management: When users earn NEAR Coins, Shade Agents manage the token distribution, ensuring that transactions are processed efficiently and accurately.
Google Toolkit 🛠️:
Our implementation of the Google Toolkit, specifically the Gemini API and the Chrome extension, plays a vital role in the user experience:

Chrome Extension Development: Using JavaScript and Tailwind CSS, we created a user-friendly Chrome extension that interacts seamlessly with Amazon’s interface. The extension provides real-time feedback to users about their cart items, enhancing their shopping experience.
Gemini API Integration: This API facilitates communication between the frontend and backend. By leveraging Gemini, we provide users with immediate results and scores for their selected products.
User Engagement: The Google Toolkit enhances user engagement by allowing them to easily track their rewards and see how their purchases contribute to the Canadian economy.
Pipeline Process:
Cart Scanning 🛒:

The extension scans the user’s Amazon cart in real-time, retrieving product details such as name, category, and origin.
It collects data on each item to prepare for the assessment process.
Assessment Algorithm ⚙️:

The backend algorithm evaluates each item based on three key criteria: Canadian Origin, Ethical Sourcing, and Value for Money
Each item receives a score reflecting its alignment with these criteria.
Scoring and Rewards Calculation 📊:

The algorithm calculates the total Canadian content percentage of the cart based on individual item scores.
Users are rewarded with NEAR Coins, which are awarded in proportion to the Canadian content of their purchases.
Transaction Management 🔗:

Shade Agents interact with the backend to manage the secure awarding of tokens.
NEAR Coins are minted and transferred to users’ wallets based on their purchases.
