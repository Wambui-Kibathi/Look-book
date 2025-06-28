## Look-book
Look-book is a simple web application designed to showcase various fashion outfits. Users can browse a curated collection of looks, filter them by style category, mark their favorite outfits, and explore complementary items for each look. The application features a clean, responsive design with a dark mode toggle and a newsletter subscription.

# Features
1. Outfit Display: Browse a collection of various fashion outfits.

2. Filtering: Filter outfits by style category (e.g., Formal, Casual, Preppy, Western, Maximalist).

3. Liking System: Mark outfits as liked/un-liked, with a dedicated "Favorites" section to view all liked items.

4. Complementary Items: Clicking on the discover more items-button reveals a section for complementary products, enhancing the user's fashion exploration.

5. Search Functionality: Easily search outfits by name or description.

6. Dark Mode Toggle: Switch between light and dark themes for a personalized Browse experience.

7. Newsletter Subscription: A simple form to subscribe to fashion updates.

8. Responsive Design: Optimized for various screen sizes, from mobile to desktop.

9. Local API Integration: Fetches outfit data from a local JSON server.

10. External API Integration: Fetches complimentary items data from an external API (Fake Store API)

# Technologies Used
- Frontend:
1. HTML5
2. CSS3 (with custom variables for theming)
3. JavaScript (ES6+)

- Local API:
JSON Server for serving the local db.json file.

- External API:
Fake Store API (https://fakestoreapi.com/products)-used to fetch product data for displaying complementary items within the application.

# Installation
To get a local copy up and running, follow these simple steps.

# Prerequisites
You need to have Node.js and npm (Node Package Manager) installed on your machine.
You also need json-server globally installed:

```bash
npm install -g json-server
```
# Fork and Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME # Replace YOUR_REPO_NAME with your actual repository name
```
# Setup Local API
Create a file named db.json in the root of your project directory with the following content:

```JSON

{
  "outfits": [
    {
      "id": "1",
      "name": "Business Chic",
      "style": "Formal",
      "avatar": "https://i.pinimg.com/736x/7b/16/f1/7b16f13e23097bbd2f8bc8930b50c141.jpg",
      "description": "",
      "liked": false
    },
    {
      "id": "2",
      "name": "Vintage Street ware",
      "style": "Casual",
      "avatar": "https://i.pinimg.com/736x/21/4e/0e/214e0ebcfb930c737bb6659c02ccde39.jpg",
      "description": "",
      "liked": false
    },
    {
      "id": "3",
      "name": "Korean Pastels",
      "style": "Casual",
      "avatar": "https://i.pinimg.com/736x/6f/37/e6/6f37e630c604b99aaa0cd5baab438459.jpg",
      "description": "",
      "liked": true
    },
    {
      "id": "4",
      "name": "Old Money Aesthetic",
      "style": "Preppy",
      "avatar": "https://i.pinimg.com/736x/f1/75/85/f175857fce59692bacda2cf2ea36c2da.jpg",
      "description": "",
      "liked": false
    },
    {
      "id": "5",
      "name": "Cowboy Carter",
      "style": "Western",
      "avatar": "https://i.pinimg.com/736x/99/fc/44/99fc44489d84a0ef400bc0b94763135b.jpg",
      "description": "",
      "liked": false
    },
    {
      "id": "6",
      "name": "Glam Grunge",
      "style": "Maximalist",
      "avatar": "https://i.pinimg.com/736x/f8/e5/60/f8e5607d838ae7a5de8c5e5c7a632315.jpg",
      "description": "",
      "liked": false
    }
  ]
}
```
- Note: Ensure the liked values are actual booleans (true/false) not strings ("true"/"false") for proper JavaScript handling.
- Start the JSON Server to serve your db.json file:

```bash
json-server --watch db.json --port 3000
```
This will start the API server at http://localhost:3000. Your application expects outfit data to be available at http://localhost:3000/outfits.

# Run the Application
- Open the index.html file in your web browser. You can usually do this by double-clicking the file or by navigating to its path in your browser (e.g., file:///path/to/your/project/index.html).
- Alternatively, if you have a live server extension (like Live Server for VS Code), you can use that for easier development.

# Usage
1. Once the application is running:

2. Browse Outfits: The main page displays all available outfits.

3. Filter Outfits: Use the "Filter by Style Category" dropdown to narrow down outfits by style.

4. Search Outfits: Use the "Search outfits by name or description..." input to find specific outfits.

5. Like Outfits: Click the heart icon on an outfit card to toggle its "liked" status. Liked outfits are saved and can be viewed in the "Favorites" section.

6. View Favorites: Click the "My Favorites" button in the navigation bar to see only your liked outfits. Click "Back to All Looks" to return to the main view.

7. Discover Complementary Items: Click on any outfit card to reveal a section below it with complementary product suggestions.

8. Toggle Dark Mode: Use the moon/sun icon in the navigation bar to switch between light and dark themes.

9. Newsletter: Enter your email in the footer to subscribe to the newsletter.

# Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

# License
MIT

# Author
Wambui Kibathi