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

console.log("\n🧪 COGNITIVE LENS SYSTEM TEST\n");
console.log("=" .repeat(60));

for (const category of testCategories) {
  console.log(`\n📁 Category: ${category}`);
  console.log("-".repeat(60));
  
  for (const test of testCases) {
    const result = selectAngle(category, test.postType, test.history);
    
    console.log(`\n  Post Type: ${test.postType}`);
    console.log(`  History: ${test.history.length > 0 ? test.history.join(", ") : "None"}`);
    console.log(`  ✓ Selected Lens: ${result.lens}`);
    console.log(`  ✓ Definition: ${result.lensDefinition.slice(0, 80)}...`);
    console.log(`  ✓ Context: ${result.categoryContext.slice(0, 80)}...`);
  }
}

console.log("\n" + "=".repeat(60));
console.log("✅ Test complete!\n");