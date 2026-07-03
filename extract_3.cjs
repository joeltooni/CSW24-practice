const fs = require('fs');

// Read the original data
const rawData = fs.readFileSync('public/words-data.json', 'utf8');
const data = JSON.parse(rawData);

// Extract words
const threeLetterWords = data.words.filter(w => w.length === 3);
const remainingWords = data.words.filter(w => w.length !== 3);

// Write 3-letter words to a new file (as a bare array, like the user's 2-letter words file)
fs.writeFileSync('public/3-letters.json', JSON.stringify(threeLetterWords, null, 2));

// Update original data and rewrite
data.words = remainingWords;
fs.writeFileSync('public/words-data.json', JSON.stringify(data, null, 2));

console.log('Extracted ' + threeLetterWords.length + ' 3-letter words.');
