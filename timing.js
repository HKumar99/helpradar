var time = require('moment');
var typed = require('typed.js');

function sortHelper (left, right) {
    return time.utc(left.timeStamp).diff(right.timeStamp);
}


module.exports = sortHelper;