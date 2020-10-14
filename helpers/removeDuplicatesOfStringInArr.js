module.exports = (arrayOfStrings) => {
  if (!Array.isArray(arrayOfStrings)) {
    return;
  }

  return arrayOfStrings.reduce((acc, value) => {
    if (!acc.includes(`${value}`)) {
      acc.push(`${value}`);
    }

    return acc;
  }, [])
}
