/**
 * Mock Data for Peak Explanation Testing
 * Simulates responses from Wikipedia and GDELT APIs
 */

import type { WikipediaEventResult } from './wikipedia-events';
import type { GDELTNewsResult } from './gdelt-news';

// Mock Wikipedia Events
export const mockWikipediaEvents = {
  // Apple events - Sept 12, 2023
  appleTech: {
    text: "Apple Inc. unveils iPhone 15 at its annual product event",
    year: 2023,
    pages: [{
      title: "iPhone 15",
      extract: "The iPhone 15 and iPhone 15 Plus are smartphones designed and marketed by Apple Inc. They are the seventeenth generation of iPhones, succeeding the iPhone 14. Apple announced the devices on September 12, 2023, at the Steve Jobs Theater in Cupertino, California.",
      content_urls: {
        desktop: {
          page: "https://en.wikipedia.org/wiki/iPhone_15"
        }
      }
    }]
  } as any,

  appleFruit: {
    text: "Washington State begins annual apple harvest season",
    year: 2023,
    pages: [{
      title: "Apple Production",
      extract: "Washington State begins its annual apple harvest season in September, with Honeycrisp and Gala varieties being the first to be picked.",
      content_urls: {
        desktop: {
          page: "https://en.wikipedia.org/wiki/Apple_production"
        }
      }
    }]
  } as any,

  // Java events
  javaProgramming: {
    text: "Oracle Corporation releases Java 20 with new features",
    year: 2023,
    pages: [{
      title: "Java 20",
      extract: "Java 20 is a version of the Java programming language released by Oracle Corporation on March 21, 2023. It introduces virtual threads, pattern matching enhancements, and scoped values.",
      content_urls: {
        desktop: {
          page: "https://en.wikipedia.org/wiki/Java_version_history"
        }
      }
    }]
  } as any,

  javaIsland: {
    text: "Earthquake strikes Java island in Indonesia",
    year: 2023,
    pages: [{
      title: "2023 Java earthquake",
      extract: "A magnitude 6.1 earthquake struck the Indonesian island of Java on March 21, 2023, affecting several major cities.",
      content_urls: {
        desktop: {
          page: "https://en.wikipedia.org/wiki/Java_earthquake_2023"
        }
      }
    }]
  } as any,

  // Tesla events
  teslaCar: {
    text: "Tesla Inc. reports record quarterly vehicle deliveries",
    year: 2023,
    pages: [{
      title: "Tesla, Inc.",
      extract: "Tesla, Inc. reported record Q2 2023 deliveries of 466,140 vehicles on July 19, 2023, surpassing analyst expectations and marking a 10% increase from the previous quarter.",
      content_urls: {
        desktop: {
          page: "https://en.wikipedia.org/wiki/Tesla,_Inc."
        }
      }
    }]
  } as any,

  teslaScientist: {
    text: "Nikola Tesla Museum opens new electricity exhibit in Belgrade",
    year: 2023,
    pages: [{
      title: "Nikola Tesla Museum",
      extract: "The Nikola Tesla Museum in Belgrade, Serbia, opened a new exhibit on July 19, 2023, showcasing Tesla's contributions to alternating current electricity.",
      content_urls: {
        desktop: {
          page: "https://en.wikipedia.org/wiki/Nikola_Tesla_Museum"
        }
      }
    }]
  } as any,

  // Python events
  pythonProgramming: {
    text: "Python Software Foundation releases Python 3.12 beta",
    year: 2023,
    pages: [{
      title: "Python 3.12",
      extract: "Python 3.12 beta was released on June 5, 2023, featuring improved performance, better error messages, and type parameter syntax.",
      content_urls: {
        desktop: {
          page: "https://en.wikipedia.org/wiki/Python_3.12"
        }
      }
    }]
  } as any,

  pythonSnake: {
    text: "Florida wildlife officials capture 17-foot Burmese python in Everglades",
    year: 2023,
    pages: [{
      title: "Burmese python in Florida",
      extract: "Florida Fish and Wildlife Conservation Commission captured a record 17-foot Burmese python in the Everglades on June 5, 2023, one of the largest invasive pythons ever found in Florida.",
      content_urls: {
        desktop: {
          page: "https://en.wikipedia.org/wiki/Burmese_pythons_in_Florida"
        }
      }
    }]
  } as any,
};

// Mock GDELT News Articles
export const mockGDELTArticles = {
  appleTech: [
    {
      title: "Apple unveils iPhone 15 Pro with titanium design and new camera",
      url: "https://techcrunch.com/2023/09/12/iphone-15-pro-announced",
      domain: "techcrunch.com",
      seendate: "20230912143000",
      language: "en",
      sourcecountry: "US"
    },
    {
      title: "Everything Apple announced at its iPhone 15 event",
      url: "https://theverge.com/2023/09/12/iphone-15-event-recap",
      domain: "theverge.com",
      seendate: "20230912150000",
      language: "en",
      sourcecountry: "US"
    },
    {
      title: "iPhone 15 Pro gets A17 Pro chip, USB-C, and Action button",
      url: "https://macrumors.com/2023/09/12/iphone-15-pro-features",
      domain: "macrumors.com",
      seendate: "20230912152000",
      language: "en",
      sourcecountry: "US"
    }
  ],

  appleFruit: [
    {
      title: "Washington apple harvest season begins with strong crop forecast",
      url: "https://capitalpress.com/apple-harvest-2023",
      domain: "capitalpress.com",
      seendate: "20230912100000",
      language: "en",
      sourcecountry: "US"
    }
  ],

  javaProgramming: [
    {
      title: "Java 20 released with virtual threads and pattern matching",
      url: "https://infoworld.com/java-20-release",
      domain: "infoworld.com",
      seendate: "20230321090000",
      language: "en",
      sourcecountry: "US"
    },
    {
      title: "Oracle announces Java 20 with performance improvements",
      url: "https://oracle.com/news/java-20",
      domain: "oracle.com",
      seendate: "20230321100000",
      language: "en",
      sourcecountry: "US"
    }
  ],

  javaIsland: [
    {
      title: "6.1 magnitude earthquake strikes Java, Indonesia",
      url: "https://reuters.com/java-earthquake-2023",
      domain: "reuters.com",
      seendate: "20230321080000",
      language: "en",
      sourcecountry: "UK"
    }
  ],

  javaCoffee: [
    {
      title: "Starbucks introduces new Java roast blend for fall season",
      url: "https://starbucks.com/news/java-blend",
      domain: "starbucks.com",
      seendate: "20230321110000",
      language: "en",
      sourcecountry: "US"
    }
  ],

  teslaCar: [
    {
      title: "Tesla reports record Q2 deliveries, stock surges",
      url: "https://reuters.com/tesla-q2-deliveries",
      domain: "reuters.com",
      seendate: "20230719080000",
      language: "en",
      sourcecountry: "US"
    },
    {
      title: "Tesla beats analyst estimates with 466,140 deliveries",
      url: "https://cnbc.com/tesla-deliveries-record",
      domain: "cnbc.com",
      seendate: "20230719090000",
      language: "en",
      sourcecountry: "US"
    }
  ],

  teslaScientist: [
    {
      title: "Belgrade museum celebrates Nikola Tesla with new exhibit",
      url: "https://smithsonianmag.com/tesla-museum-exhibit",
      domain: "smithsonianmag.com",
      seendate: "20230719100000",
      language: "en",
      sourcecountry: "US"
    }
  ],

  pythonProgramming: [
    {
      title: "Python 3.12 beta brings major performance improvements",
      url: "https://python.org/news/3.12-beta",
      domain: "python.org",
      seendate: "20230605090000",
      language: "en",
      sourcecountry: "US"
    }
  ],

  pythonSnake: [
    {
      title: "Record 17-foot python captured in Florida Everglades",
      url: "https://nationalgeographic.com/python-capture-florida",
      domain: "nationalgeographic.com",
      seendate: "20230605100000",
      language: "en",
      sourcecountry: "US"
    },
    {
      title: "Florida wildlife officials remove massive Burmese python",
      url: "https://myfwc.com/python-removal-2023",
      domain: "myfwc.com",
      seendate: "20230605110000",
      language: "en",
      sourcecountry: "US"
    }
  ]
};

// Mock AI Responses (what Claude would return)
export const mockAIResponses = {
  appleTech_iPhoneContext: {
    relevance: 98,
    interpretation: "Apple Inc. (technology company)",
    reasoning: "iPhone 15 launch directly relates to tech comparison of 'iPhone vs Android'",
    confidence: 99,
    contextMatch: true
  },

  appleFruit_iPhoneContext: {
    relevance: 5,
    interpretation: "Apple (fruit)",
    reasoning: "Fruit harvest does NOT relate to technology comparison context",
    confidence: 98,
    contextMatch: false
  },

  appleTech_fruitContext: {
    relevance: 8,
    interpretation: "Apple Inc. (technology company)",
    reasoning: "Tech product launch does NOT relate to food comparison 'Oranges vs Apples'",
    confidence: 95,
    contextMatch: false
  },

  appleFruit_fruitContext: {
    relevance: 92,
    interpretation: "Apple (fruit)",
    reasoning: "Apple harvest directly relates to fruit comparison context",
    confidence: 97,
    contextMatch: true
  },

  javaProgramming_programmingContext: {
    relevance: 96,
    interpretation: "Java (programming language)",
    reasoning: "Java 20 release directly relates to programming comparison 'Java vs Python'",
    confidence: 98,
    contextMatch: true
  },

  javaIsland_programmingContext: {
    relevance: 3,
    interpretation: "Java (Indonesian island)",
    reasoning: "Geographic earthquake does NOT relate to programming context",
    confidence: 99,
    contextMatch: false
  },

  javaCoffee_programmingContext: {
    relevance: 12,
    interpretation: "Java (coffee slang)",
    reasoning: "Coffee product does NOT relate to programming comparison",
    confidence: 95,
    contextMatch: false
  },

  teslaCar_autoContext: {
    relevance: 94,
    interpretation: "Tesla Inc. (automotive company)",
    reasoning: "Tesla car deliveries directly relate to electric vehicle comparison 'Model 3 vs Bolt'",
    confidence: 97,
    contextMatch: true
  },

  teslaScientist_autoContext: {
    relevance: 15,
    interpretation: "Nikola Tesla (scientist/inventor)",
    reasoning: "Historical museum exhibit does NOT relate to car comparison",
    confidence: 96,
    contextMatch: false
  },

  pythonProgramming_animalContext: {
    relevance: 8,
    interpretation: "Python (programming language)",
    reasoning: "Software release does NOT relate to animal comparison 'Snakes vs Lizards'",
    confidence: 98,
    contextMatch: false
  },

  pythonSnake_animalContext: {
    relevance: 88,
    interpretation: "Python (snake species)",
    reasoning: "Burmese python capture directly relates to reptile/animal comparison context",
    confidence: 95,
    contextMatch: true
  }
};

// Test scenarios with expected outcomes
export const testScenarios = [
  {
    name: "iPhone vs Android - Apple peak (tech context)",
    peakKeyword: "Apple",
    peakDate: new Date('2023-09-12'),
    peakValue: 87,
    comparisonContext: {
      termA: "iPhone",
      termB: "Android",
      category: "technology"
    },
    expectedInterpretation: "Apple Inc. (technology company)",
    expectedStatus: "verified",
    expectedMinConfidence: 90,
    shouldIncludeEvents: ["iPhone 15"],
    shouldExcludeEvents: ["apple harvest", "fruit", "Beatles"]
  },
  {
    name: "Oranges vs Apples - Apple peak (food context)",
    peakKeyword: "Apple",
    peakDate: new Date('2023-09-12'),
    peakValue: 45,
    comparisonContext: {
      termA: "Oranges",
      termB: "Apples",
      category: "food"
    },
    expectedInterpretation: "Apple (fruit)",
    expectedStatus: "probable",
    expectedMinConfidence: 70,
    shouldIncludeEvents: ["harvest", "fruit"],
    shouldExcludeEvents: ["iPhone", "MacBook", "tech"]
  },
  {
    name: "Java vs Python - Java peak (programming context)",
    peakKeyword: "Java",
    peakDate: new Date('2023-03-21'),
    peakValue: 62,
    comparisonContext: {
      termA: "Java",
      termB: "Python",
      category: "technology"
    },
    expectedInterpretation: "Java (programming language)",
    expectedStatus: "verified",
    expectedMinConfidence: 85,
    shouldIncludeEvents: ["Java 20", "Oracle", "programming"],
    shouldExcludeEvents: ["earthquake", "Indonesia", "coffee", "Starbucks"]
  },
  {
    name: "Tesla Model 3 vs Chevy Bolt - Tesla peak (auto context)",
    peakKeyword: "Tesla",
    peakDate: new Date('2023-07-19'),
    peakValue: 78,
    comparisonContext: {
      termA: "Tesla Model 3",
      termB: "Chevy Bolt",
      category: "automotive"
    },
    expectedInterpretation: "Tesla Inc. (automotive company)",
    expectedStatus: "verified",
    expectedMinConfidence: 85,
    shouldIncludeEvents: ["deliveries", "Tesla Inc", "vehicle"],
    shouldExcludeEvents: ["Nikola Tesla", "museum", "scientist"]
  },
  {
    name: "Snakes vs Lizards - Python peak (animal context)",
    peakKeyword: "Python",
    peakDate: new Date('2023-06-05'),
    peakValue: 52,
    comparisonContext: {
      termA: "Snakes",
      termB: "Lizards",
      category: "animals"
    },
    expectedInterpretation: "Python (snake species)",
    expectedStatus: "probable",
    expectedMinConfidence: 75,
    shouldIncludeEvents: ["Burmese python", "Florida", "Everglades"],
    shouldExcludeEvents: ["Python 3.12", "programming", "software"]
  }
];
