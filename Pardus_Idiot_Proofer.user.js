// ==UserScript==
// @name        Pardus Idiot Proofer
// @namespace   fear.math@gmail.com
// @description Warns you if you have a lot of cash and aren't docked, or if you are docked and don't have all your cash back.
// @include     http*://orion.pardus.at/main.php*
// @include     http*://orion.pardus.at/logout.php*
// @version     1
// @grant       none
// ==/UserScript==

var MAX_CASH = 600000; //maximum number of credits you're willing to lose
var MIN_CASH = 2000000; //minimum number of credits you need for crew payment

// Determine current number of credits
var creditSpan = document.getElementById("credits");
var credits;
if (creditSpan.innerHTML.indexOf("<") > -1) {
	credits = creditSpan.firstChild.innerHTML;
} else {
	credits = creditSpan.innerHTML;
}
//remove commas from number of credits
credits = credits.replace(/,/g, "");


//Warn if necessary
if (location.href.indexOf("main.php") > -1) {	
	if (credits > MAX_CASH) {
		alert("You have too many credits!");
	}
} else if (location.href.indexOf("logout.php") > -1) {
	if (credits < MIN_CASH) {
		alert("You don't have enough credits!");
	}
}