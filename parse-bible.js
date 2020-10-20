const fs = require('fs')

const dirName = `${__dirname}/bible`;

function chapterToObject(chapters) {
  const res = {}
  for (const chapter of chapters)  {
    res[chapter.chapter] = versesToObject(chapter.verses)
  }

  return res;
}

function versesToObject(verses) {
  const res = {}
  for (const verse of verses)  {
    res[verse.verse] = verse.text
  }

  return res;
}

fs.readdir(dirName, (err, files) => {
  if (err) return console.log(error);
  const bible = {};
  for (const file of files) {
    // const file = files[0];
    const fileName = dirName + `/${file}`;
    const fileContent = JSON.parse(fs.readFileSync(fileName, 'utf8'))
    const chapters = chapterToObject(fileContent.chapters);

    bible[fileContent.book] = chapters
  //console.log(chapters)
 }


  fs.writeFileSync(`${__dirname}/bibledump.json`, JSON.stringify(bible))
})
