/**
 * Curated Interesting Comparisons
 * Used for loading states to engage users and showcase platform variety
 */

export type InterestingComparison = {
  termA: string;
  termB: string;
  emoji: string;
  category: string;
  description?: string;
};

export const INTERESTING_COMPARISONS: InterestingComparison[] = [
  // Tech Giants
  { termA: "ChatGPT", termB: "Gemini", emoji: "🤖", category: "AI" },
  { termA: "React", termB: "Vue", emoji: "⚛️", category: "Tech" },
  { termA: "Python", termB: "JavaScript", emoji: "💻", category: "Programming" },
  { termA: "AWS", termB: "Azure", emoji: "☁️", category: "Cloud" },
  { termA: "Mac", termB: "Windows", emoji: "💻", category: "Operating Systems" },
  { termA: "Android", termB: "iOS", emoji: "📱", category: "Mobile OS" },
  { termA: "Docker", termB: "Kubernetes", emoji: "🐳", category: "DevOps" },
  { termA: "VS Code", termB: "Sublime Text", emoji: "📝", category: "Editors" },

  // Movies & Shows
  { termA: "Marvel", termB: "DC", emoji: "🎬", category: "Superhero Universes" },
  { termA: "Avatar", termB: "Titanic", emoji: "🎥", category: "Box Office" },
  { termA: "Breaking Bad", termB: "Game of Thrones", emoji: "📺", category: "TV Series" },
  { termA: "Netflix", termB: "Disney+", emoji: "🍿", category: "Streaming" },
  { termA: "Harry Potter", termB: "Lord of the Rings", emoji: "⚡", category: "Fantasy" },
  { termA: "Star Wars", termB: "Star Trek", emoji: "🚀", category: "Sci-Fi" },
  { termA: "Inception", termB: "Interstellar", emoji: "🎬", category: "Mind-Bending" },

  // Music
  { termA: "Spotify", termB: "Apple Music", emoji: "🎵", category: "Music Streaming" },
  { termA: "Taylor Swift", termB: "Beyoncé", emoji: "🎤", category: "Pop Icons" },
  { termA: "Drake", termB: "Kendrick Lamar", emoji: "🎤", category: "Hip Hop" },
  { termA: "The Beatles", termB: "The Rolling Stones", emoji: "🎸", category: "Rock Legends" },
  { termA: "BTS", termB: "Blackpink", emoji: "🎵", category: "K-Pop" },
  { termA: "Ed Sheeran", termB: "Shawn Mendes", emoji: "🎸", category: "Singer-Songwriters" },

  // Gaming
  { termA: "Fortnite", termB: "Minecraft", emoji: "🎮", category: "Gaming" },
  { termA: "PlayStation 5", termB: "Xbox Series X", emoji: "🎮", category: "Consoles" },
  { termA: "League of Legends", termB: "Dota 2", emoji: "⚔️", category: "MOBA" },
  { termA: "Call of Duty", termB: "Battlefield", emoji: "🔫", category: "FPS" },
  { termA: "FIFA", termB: "PES", emoji: "⚽", category: "Sports Games" },
  { termA: "Pokemon", termB: "Digimon", emoji: "👾", category: "Monster Games" },
  { termA: "Zelda", termB: "Dark Souls", emoji: "🗡️", category: "Adventure" },
  { termA: "Among Us", termB: "Fall Guys", emoji: "🎮", category: "Party Games" },

  // Products & Brands
  { termA: "iPhone", termB: "Samsung Galaxy", emoji: "📱", category: "Smartphones" },
  { termA: "Tesla", termB: "BMW", emoji: "🚗", category: "Electric Cars" },
  { termA: "Nike", termB: "Adidas", emoji: "👟", category: "Sportswear" },
  { termA: "Coca-Cola", termB: "Pepsi", emoji: "🥤", category: "Soft Drinks" },
  { termA: "McDonald's", termB: "Burger King", emoji: "🍔", category: "Fast Food" },
  { termA: "AirPods", termB: "Galaxy Buds", emoji: "🎧", category: "Earbuds" },
  { termA: "MacBook", termB: "Surface", emoji: "💻", category: "Laptops" },

  // Companies
  { termA: "Google", termB: "Microsoft", emoji: "🏢", category: "Tech Giants" },
  { termA: "Amazon", termB: "Alibaba", emoji: "📦", category: "E-Commerce" },
  { termA: "Uber", termB: "Lyft", emoji: "🚗", category: "Rideshare" },
  { termA: "Zoom", termB: "Teams", emoji: "📞", category: "Video Calls" },
  { termA: "Facebook", termB: "Twitter", emoji: "📱", category: "Social Media" },
  { termA: "Instagram", termB: "TikTok", emoji: "📸", category: "Social Video" },

  // Sports & Athletes
  { termA: "Messi", termB: "Ronaldo", emoji: "⚽", category: "Football Legends" },
  { termA: "NBA", termB: "NFL", emoji: "🏈", category: "Sports Leagues" },
  { termA: "LeBron James", termB: "Michael Jordan", emoji: "🏀", category: "Basketball GOATs" },
  { termA: "Roger Federer", termB: "Rafael Nadal", emoji: "🎾", category: "Tennis" },
  { termA: "Olympics", termB: "World Cup", emoji: "🏆", category: "Global Events" },

  // Food & Lifestyle
  { termA: "Coffee", termB: "Tea", emoji: "☕", category: "Morning Drinks" },
  { termA: "Pizza", termB: "Burger", emoji: "🍕", category: "Comfort Food" },
  { termA: "Chocolate", termB: "Vanilla", emoji: "🍦", category: "Ice Cream" },
  { termA: "Cats", termB: "Dogs", emoji: "🐱", category: "Pets" },
  { termA: "Beach", termB: "Mountains", emoji: "🏖️", category: "Vacation" },

  // Cultural
  { termA: "Bollywood", termB: "Hollywood", emoji: "🎬", category: "Film Industries" },
  { termA: "K-Drama", termB: "Anime", emoji: "📺", category: "Asian Entertainment" },
  { termA: "Christmas", termB: "Halloween", emoji: "🎄", category: "Holidays" },

  // Finance & Crypto
  { termA: "Bitcoin", termB: "Ethereum", emoji: "₿", category: "Cryptocurrency" },
  { termA: "Stocks", termB: "Real Estate", emoji: "💰", category: "Investments" },
  { termA: "PayPal", termB: "Venmo", emoji: "💳", category: "Payments" },

  // Education
  { termA: "Harvard", termB: "MIT", emoji: "🎓", category: "Universities" },
  { termA: "Online Learning", termB: "Traditional School", emoji: "📚", category: "Education" },
  { termA: "Coursera", termB: "Udemy", emoji: "💻", category: "E-Learning" },

  // Unusual & Fun
  { termA: "Pineapple on Pizza", termB: "No Pineapple", emoji: "🍕", category: "Food Debates" },
  { termA: "Morning Person", termB: "Night Owl", emoji: "🌅", category: "Lifestyle" },
  { termA: "Books", termB: "Movies", emoji: "📚", category: "Entertainment" },
  { termA: "Summer", termB: "Winter", emoji: "☀️", category: "Seasons" },
  { termA: "Introvert", termB: "Extrovert", emoji: "🧠", category: "Personality" },
];

/**
 * Get a random comparison from the list
 */
export function getRandomComparison(): InterestingComparison {
  const index = Math.floor(Math.random() * INTERESTING_COMPARISONS.length);
  return INTERESTING_COMPARISONS[index];
}

/**
 * Get multiple random unique comparisons
 */
export function getRandomComparisons(count: number): InterestingComparison[] {
  const shuffled = [...INTERESTING_COMPARISONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get comparisons by category
 */
export function getComparisonsByCategory(category: string): InterestingComparison[] {
  return INTERESTING_COMPARISONS.filter(c => c.category === category);
}
