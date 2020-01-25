const CONSTANTS = require("../helpers/constants");

const sleep = sec => new Promise(res => setTimeout(res, sec * 1000));

/**
 * Get the length of a String or Array
 * @param {Any} x Value to get the length of
 */
const len = x => x.length;

/**
 * Generate a random number from a range of 2 numbers
 * @param {Number} min The minimum number for the random number
 * @param {Number} max The maximum number for the random number
 */
const genRandNum = (min, max) =>
  Math.floor(Math.random() * (1 + max - min)) + min;

/**
 * @param {Object} params This should be an Object with fields you need in order to manipulate the date.
 * Currently there are 2 fields used which is: `monthInText` and `dayInText`
 * `monthInText`: if true then the name of the month will be returned instead of its index
 * e.g 2018-Nov-02 not 2018-12-02
 */
const date = ({ toUTC, defDate = null }) => {
  const today = defDate ? defDate : new Date();
  const dateNumber = today.getDate();
  const month = toUTC ? today.getMonth() : today.getMonth() + 1;
  const year = today.getFullYear();

  if (toUTC) {
    return Date.UTC(year, month, dateNumber);
  }

  return `${year}-${month < 10 ? "0" + month : month}-${
    dateNumber < 10 ? "0" + dateNumber : dateNumber
  }`;;
};

/**
 * Get the current time
 * @param {Number} value A number either to add or subtract from the hours in a day
 * @param {String} arithmeticOption This would be either "+" or "-". It determines if we want to add or subtract from time
 */
const time = (value, arithmeticOption) => {
  const today = new Date();
  let seconds = today.getSeconds();
  let minutes = today.getMinutes();
  let hour = today.getHours();

  if (value) {
    if (arithmeticOption === "+") {
      hour = today.getHours() + value;

      if (hour === 24) {
        hour = 0;
      } else if (hour > 24) {
        hour = hour - 24;
      }
    } else {
      if (hour < value) {
        let midnight = value - hour;
        if (midnight === 0) hour = 0;
        else hour = 24 - midnight;
      } else {
        hour = today.getHours() - value;
      }
    }
  }

  if (seconds < 10) seconds = "0" + seconds;
  if (minutes < 10) minutes = "0" + minutes;
  if (hour < 10) hour = "0" + hour;

  let returnVal = hour + ":" + minutes + ":" + seconds;
  return returnVal;
};

/**
 * Increase todays todate by any number of your choice or by a particular date
 *
 * @param {Number} value The number by which you want to increase the date
 * @param {Date} date (optional) The date you want to begin increasing from.
 */
const increaseDay = (value, date) => {
  const today = new Date();
  // if the date is undefined then I use the date of that day
  // if the date is defined e.g 2018-01-10, I want only the day which is 10 so I use regex to get it.
  !date
    ? today.setDate(today.getDate() + value)
    : today.setDate(parseInt(date.replace(/\d+(-)\d+(-)(0)/g, "")) + value);

  const increasedDay = today.getDate();
  const increasedMonth = today.getMonth() + 1;
  const increasedYear = today.getFullYear();

  const future = `${increasedYear}-${
    increasedMonth < 10 ? "0" + increasedMonth : increasedMonth
  }-${increasedDay < 10 ? "0" + increasedDay : increasedDay}`;

  return future;
};

/**
 * Reduce todays todate by any number of your choice or by a particular date
 *
 * @param {Number} value The number by which you want to reduce the date
 * @param {Date} date (optional) The date you want to begin reducing from.
 */
const reduceDay = (value, date, toUTC) => {
  const today = new Date();
  //if the date is undefined then I use todays date
  //else if the date is defined e.g 2018-01-10, I want only the day which is 10 so I use regex to get it.
  !date
    ? today.setDate(today.getDate() - value)
    : today.setDate(parseInt(date.replace(/\d+(-)\d+(-)(0)/g, "")) - value);
  const reducedDay = today.getDate();
  const reducedMonth = toUTC ? today.getMonth() : today.getMonth() + 1;
  const reducedYear = today.getFullYear();

  if (toUTC) {
    return Date.UTC(reducedYear, reducedMonth, reducedDay);
  }

  const past = `${reducedYear}-${
    reducedMonth < 10 ? "0" + reducedMonth : reducedMonth
  }-${reducedDay < 10 ? "0" + reducedDay : reducedDay}`;

  return past;
};


const capitalize = str => str[0].toUpperCase() + str.substring(1);

module.exports = {
  len,
  time,
  date,
  sleep,
  reduceDay,
  increaseDay,
  capitalize,
  genRandNum
};
