// ==UserScript==
// @name        Pardus Starbase Logger
// @author		Math (Orion)
// @namespace   fear.math@gmail.com
// @description Logs various data about starbases such as location, stockpiles, missiles, squads, population, etc.
// @include     http*://orion.pardus.at/main.php*
// @include     http*://orion.pardus.at/starbase_trade.php*
// @include     http*://orion.pardus.at/starbase.php*
// @include     http*://orion.pardus.at/ship_equipment.php?sort=weapon
// @include     http*://orion.pardus.at/shipyard.php*
// @include     http*://orion.pardus.at/hire_squadrons.php*
// @include		http*://orion.pardus.at/statistics.php*
// @version     1.3
// @grant   	GM_getValue
// @grant   	GM_setValue
// @grant   	unsafeWindow
// @grant       GM_xmlhttpRequest
// ==/UserScript==

//A whole bunch of giant integers used to match the data we gather with the right box in the google form. Just leave them alone. :P
var idEntry = 739792085;
var sectorEntry = 73407189;
var coordsEntry = 1620987660;
var nameEntry = 932022425;
var tradeEntry = 771089909;
/* //Each commodity in Pardus is assigned a number; SBs can trade most of the commodities from 1-29.
var commodEntry = {'1': 788923467,'2': 1071763083,'3': 629918519,'4': 1317748808,'5': 1860830985,'6': 538972529,'7': 2070804836,'8': 851589146,'9': 1607861586,'10': 701423246,'11': 1045542530,'12': 1804913664,'13': 1839016337,'14': 963955785,'15': 1036415886,'16': 820778916,'17': 1123920621,'18': 594833476,'19': 902033400,'20': 871952539,'21': 421333495,'23': 789897563,'27': 301806987,'28': 1636585423,'29': 554812611}; */
var creditsEntry = 429260807;
var workersEntry = 134005076;
var ownerEntry = 1541790867;
var missileEntry = [902999506,600019963,1726576399,1987011540,2019460239]; //The five neutral missiles from smallest to largest
var shipEntry = {	'Sabre' : 579755107,
					'Wasp' : 1566988664,
					'Rustclaw' : 1860434988,
					'Adder' : 954035102,
					'Interceptor' : 1329130975,
					'Thunderbird' : 1743300736,
					'Viper Defence Craft' : 642938825,
					'Harrier' : 2110595096,
					'Mercury' : 1352058358,
					'Babel Transporter' : 1190389262,
					'Piranha' : 1240151411,
					'Hercules' : 1088702902,
					'Hawk' : 1003315136,
					'Nighthawk' : 1078301396,
					'Gargantua' : 34395974,
					'Nighthawk Deluxe' : 405559882,
					'Mantis' : 702478293,
					'Extender' : 718747336,
					'Behemoth' : 1469810423,
					'Gauntlet' : 1418836800,
					'Liberator' : 1859350143,
					'Leviathan' : 1391451691,
					'Doomstar' : 802093148,
					'War Nova' : 718810478
				}
var fightersEntry = 1798794895;
var bombersEntry = 1575901099;
var sbStatsEntry = [1031727216,1090285757,918357285]; //[fed, emp, uni]

var dataStr = '';

if (location.href.indexOf("main.php") > -1) {
	
	//Find the sector, coords, and tile id. If necessary trim away links (such as if QI Augmenter executes first and makes the coordinates a link to a map). Store info in a local variable.
	var sector = document.getElementById("sector").innerHTML;
	if (sector.indexOf("<") > -1) {
		sector = document.getElementById("sector").firstChild.innerHTML;
	}
	var coords = document.getElementById("coords").innerHTML;
	if (coords.indexOf("<") > -1) {
		coords = document.getElementById("coords").firstChild.innerHTML;
	}
	var userLoc = unsafeWindow.userloc;
	GM_setValue("currentSector",sector);
	GM_setValue("currentCoords",coords);
	GM_setValue("currentUserLoc",userLoc);
	
} else if (location.href.indexOf("starbase_trade.php") > -1) {
	
	addIdAndSectorAndCoordsToDataStr();
    
	//Find the name of the SB
	var images = document.getElementsByTagName("IMG");
	var baseName;
	for (i=0; i < images.length; i++) {
		if (images[i].src.indexOf("starbase") > -1) {
			baseName = images[i].alt;
			break;
		}
	}
	addToDataStr(nameEntry,baseName);
    
    //Find the name, amount, min, max, sell, and buy prices of the SB
    var res_names = unsafeWindow.res_names;
    var amount = unsafeWindow.amount;
    var min = unsafeWindow.amount_min;
    var max = unsafeWindow.amount_max;
    var sell = unsafeWindow.player_buy_price; //backwards to switch to SB perspective
    var buy = unsafeWindow.player_sell_price; //backwards to switch to SB perspective
    
    var tradeData = '';
    for (var index in amount) {
        tradeData += ";" + res_names[index] + ";" + amount[index] + ";" + min[index] + ";" + max[index] + ";" + sell[index] + ";" + buy[index];
    }
    tradeData = tradeData.replace(/;/,'');
    addToDataStr(tradeEntry,tradeData);
    
/* 	//Find the amount of each resource and attach it to the correct entry number for the form
	var amount = unsafeWindow.amount;
	for (var commod in amount) {
		addToDataStr(commodEntry[commod],amount[commod]);
	} */
	
	//Check how many credits are in the SB
	var credits = unsafeWindow.obj_credits;
	addToDataStr(creditsEntry,credits);
	
	//Calculate the (approximate) number of workers
	var foodBal = document.getElementById("baserow1").cells[3].firstChild.firstChild.innerHTML;
	var workers = "~" + Math.floor(-1000*foodBal/3);
	addToDataStr(workersEntry,workers);
	
	sendData();
	
} else if (location.href.indexOf("starbase.php") > -1) {
	
	addIdAndSectorAndCoordsToDataStr();
	
	//get SB name
	var baseName;	
	var spans = document.getElementsByTagName("span");
	for (i=0; i < spans.length; i++) {
		if (spans[i].style.cssText === "font-size: 24px; line-height: 29px; font-weight: bold;") {
			baseName = spans[i].innerHTML;
		}
	}
	addToDataStr(nameEntry,baseName);
	
	//get SB owner's name
	var baseOwner, ownerTable;
	var tables = document.getElementsByTagName("table");
	for (i=0; i < tables.length; i++) {
		if (tables[i].style.cssText === 'margin-bottom: 10px;') {
			ownerTable = tables[i];
			break;
		}
	}
	var links = ownerTable.getElementsByTagName("a");
	for (i=0; i < links.length; i++) {
		if (links[i].href.indexOf("sendmsg") > -1) {
			baseOwner = links[i].innerHTML;
		}
	}
	addToDataStr(ownerEntry,baseOwner);
	
	//get (exact) number of Workers
	var workers;
	for (i=0; i < spans.length; i++) {
		if (spans[i].style.cssText === 'font-size: 9px;') {
			workers = spans[i].innerHTML;
			//trim the string to everything before '|'
			workers = workers.substring(0,workers.indexOf('|'));
			//remove all non-digits
			workers = workers.replace(/\D/g,'');
		}
	}
	addToDataStr(workersEntry,workers);
	
	sendData();
	
} else if (location.href.indexOf("ship_equipment.php?sort=weapon") > -1) {
	
	addIdAndSectorAndCoordsToDataStr();
	
	//get SB name
	var links = document.getElementsByTagName("a");
	var baseName;
	for (i=0; i < links.length; i++) {
		if (links[i].href.indexOf("starbase.php") > -1) {
			baseName = links[i].innerHTML;
		}
	}
	//trim "Return to ... 's menu"
	baseName = baseName.substring(10,baseName.indexOf("'"));
	addToDataStr(nameEntry,baseName);
	
	//get number of missiles
	var table = document.getElementsByClassName("messagestyle")[0];
	var available;
	for (i = 0; i < 5; i++) {
		available = table.rows[i+1].cells[6].innerHTML;
		//if 0 are available, it will be red and bold, so trim this extra HTML away
		if (available.indexOf("<") > -1) {
			available = table.rows[i+1].cells[6].firstChild.firstChild.innerHTML
		}
		addToDataStr(missileEntry[i],available);
	}
	
	sendData();
	
} else if (location.href.indexOf("shipyard.php") > -1) {
	
	addIdAndSectorAndCoordsToDataStr();
	
	//get SB name
	var links = document.getElementsByTagName("a");
	var baseName;
	for (i=0; i < links.length; i++) {
		if (links[i].href.indexOf("starbase.php") > -1) {
			baseName = links[i].innerHTML;
		}
	}
	//trim "Return to ... 's menu"
	baseName = baseName.substring(10,baseName.indexOf("'"));
	addToDataStr(nameEntry,baseName);
	
	//get number of ships in stock
	var tables = document.getElementsByTagName("table");
	var shipTable;
	for (i = 0; i < tables.length; i++) {
		if (tables[i].style.cssText.indexOf('bg.gif') > -1) {
			shipTable = tables[i];
			break;
		}
	}
	var shipName, available;
	for (i=1; i<shipTable.rows.length; i++) {
		shipName = shipTable.rows[i].cells[1].firstChild.innerHTML;
		if (shipEntry[shipName]) {
			available = shipTable.rows[i].cells[2].innerHTML;
			//If you click on a ship it makes the number bold. This trims the extra html to make the number bold.
			if (available.indexOf("<") > -1) {
				available = shipTable.rows[i].cells[2].firstChild.innerHTML;
			}
			addToDataStr(shipEntry[shipName],available);
		}
	}
	
	sendData();
	
} else if (location.href.indexOf("hire_squadrons.php") > -1) {
	
	addIdAndSectorAndCoordsToDataStr();
	
	//get SB name
	var links = document.getElementsByTagName("a");
	var baseName;
	for (i=0; i < links.length; i++) {
		if (links[i].href.indexOf("starbase.php") > -1) {
			baseName = links[i].innerHTML;
		}
	}
	addToDataStr(nameEntry,baseName);
	
	//get array of squad tables
	var tables = document.getElementsByTagName("table");
	var squadTables = [];
	for (i=0; i<tables.length; i++) {
		if (tables[i].style.cssText.indexOf('bgd.gif') > -1) {
			squadTables[squadTables.length] = tables[i];
		}
	}	
	//get the size of each fighter and bomber
	var fighters = '';
	var bombers = '';
	var squad, number;
	for (i=0; i<squadTables.length; i++) {
		squad = squadTables[i].rows[0].cells[0].children[1].innerHTML;
		number = squad.replace(/\D/g,'');
		if (squad.indexOf("Fighter") > -1) {
			fighters += ", " + number;
		} else {
			bombers += ", " + number;
		}
	}
	//remove leading comma
	fighters = fighters.replace(/, /,'');
	bombers = bombers.replace(/, /,'');	
	addToDataStr(fightersEntry,fighters);
	addToDataStr(bombersEntry,bombers);
	
	sendData();
	
} else if (location.href.indexOf("statistics.php") > -1) {
	
	//send userid only, sector and coords are meaningless
	var userid = unsafeWindow.userid;
	addToDataStr(idEntry, userid);
	
	//get table of PFC, PEC, and PUC SBs
	var tables = document.getElementsByTagName("table");
	var sbTables = [];
	for (i=0; i<tables.length; i++) {
		if (tables[i].width === '90%') {
			sbTables[sbTables.length] = tables[i];
		}
	}	
	//For each P*C, get SB names and populations and combine into one string to send to the google doc.
	for (i=0; i<3; i++) {
		var table = sbTables[i];
		var result = '';
		var baseName, workers;
		for (j=1; j<table.rows.length; j++) {
			baseName = table.rows[j].cells[2].innerHTML;
			workers = table.rows[j].cells[3].innerHTML.replace(/,/g,''); //remove commas
			result += ";" + baseName + ";" + workers;
		}
		result = result.replace(/;/,''); //remove leading semicolon
		//Add result (i=0,1,2 corresponds to Fed, Emp, Uni) to data string
		addToDataStr(sbStatsEntry[i],result);
	}
	
	sendData();	
}

function sendData() {
	//Remove leading ampersand
	dataStr = dataStr.replace(/&/,'');
	//Send data to google form
	GM_xmlhttpRequest({
		method: "POST",
		url: "https://docs.google.com/forms/d/1CoIqDfFOscVUBUSncXJNaDKMkFg5W3ckCwI3N8sZr5I/formResponse",
		data: dataStr,
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
	});
}

function addIdAndSectorAndCoordsToDataStr() {
	var userid = unsafeWindow.userid;
	addToDataStr(idEntry, userid);
	//Off the nav screen, Pardus will only tell you the tile id, so check that the stored tile id is correct to make sure partial refresh didn't screw us up.
	//If everything is good, grab the stored sector and coords.
	var sector, coords;
	if (GM_getValue("currentUserLoc","undefined") === unsafeWindow.userloc) {
		sector = GM_getValue("currentSector","undefined");
		coords = GM_getValue("currentCoords","undefined");
	}
	if (sector) {addToDataStr(sectorEntry,sector)}
	if (coords) {addToDataStr(coordsEntry,coords)}
}

function addToDataStr(entry, data) {
	dataStr += "&entry." + entry + "=" + data;
}