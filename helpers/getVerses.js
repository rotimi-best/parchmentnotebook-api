const { bible } = require('./getBible');

module.exports = (passage) => {
  const passages = []
  if (!passage || typeof(passage) !== "string") {
    return passages;
  }

  const isMultipleBooks = /^\d/.test(passage);
  const passageFragments = passage.split(' ');
  const book = isMultipleBooks ? passageFragments[0] + ` ${passageFragments[1]}` : passageFragments[0];
  const chapter = passageFragments[isMultipleBooks ? 2 : 1].replace(':', '');
  const rawVerses = passageFragments.slice(isMultipleBooks ? 3 : 2, passageFragments.length - 1);
  const verses = [];

  for (const rawVerse of rawVerses) {
    const number = rawVerse.replace(',', '');
    if (number.includes('-')) {
      const [startNo, endNo] = number.split('-');
      for (let i = parseInt(startNo); i <= parseInt(endNo); i++) {
        verses.push(i)
      }
    } else {
      verses.push(parseInt(number))
    }
  }

  const foundBook = bible[book];

  if (foundBook) {
    const foundChapter = foundBook[chapter];
    if (foundChapter) {
      for (const verse of verses) {
        passages.push({
          verse,
          content: foundChapter[verse]
        })
      }
    }
  }

  return passages;
}
