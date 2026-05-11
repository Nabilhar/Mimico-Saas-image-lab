// test-lenses.ts

import { selectAngle } from './src/lib/angle-selector';

const testCategories = [
  "Health & Wellness",
  "Food & Beverage", 
  "Home Services"
];

const testCases = [
  { postType: "Tip of the Day", history: [] },
  { postType: "Behind the scenes", history: [] },
  { postType: "Myth-busting", history: ["Latent Point"] }, // Test variety
  { postType: "Tip of the Day", history: ["Latent Point", "Tradeoff Lock"] }, // Test with 2 used
];


for (const category of testCategories) {
  
  for (const test of testCases) {
    const result = selectAngle(category, test.postType, test.history);
    
  }
}
