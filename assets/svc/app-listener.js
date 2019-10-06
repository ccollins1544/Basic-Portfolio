/*********************************************************
 * Simplicity Via Clarity
 * @package simplicityviaclarity
 * @subpackage app listener
 * @author Christopher C, Blake, Sultan
 * @version 2.0.0
 * ===============[ TABLE OF CONTENTS ]===================
 * 0. Globals
 * 
 * 1. Firebase
 *   1.1 Firebase Configuration
 *   1.2 Initialize Firebase
 *   1.3 saveToFirebase
 *   1.4 _pushChild
 * 
 * 2. Helper Functions
 *   2.1 loadXMLDoc
 *   2.2 consoleResults
 *   2.3 formatDate
 *   2.4 getHeaders
 *   2.5 getSiteURL
 * 
 * 3. svcData Functions
 *   3.1 build_svcData
 *   3.2 ipGeoLocation
 * 
 * 4. Collect Site Data
 *   4.1 Set svcData.ip
 *   4.2 Set svcData.site_url and svcData.pages
 *   4.3 Firebase Connection Watcher
 * 
 * A. Debugging
 *********************************************************/
/* ===============[ 0. GLOBALS ]=========================*/
var svcData = (localStorage.getItem("svc_data") === null) ? {} : JSON.parse(localStorage.getItem("svc_data"));

/* ===============[ 1. Firebase ]=========================*/
/**
 * 1.1 Firebase Configuration
 * https://firebase.google.com/docs/database/admin/retrieve-data
 */
var firebaseConfig = {
  apiKey: "AIzaSyAVj1DhT_LO-Nn_YcBVhpHRgGbn2JCth6E",
  authDomain: "ccollins-fall2019.firebaseapp.com",
  databaseURL: "https://ccollins-fall2019.firebaseio.com",
  projectId: "ccollins-fall2019",
  storageBucket: "",
  messagingSenderId: "541445299555",
  appId: "1:541445299555:web:d9ceca0430a78546108756"
};

// 1.2 Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

var _fdb = firebase.database();
var _dbRef = _fdb.ref("/svc");

// connectionsRef references a specific location in our database.
// All of our connections will be stored in this directory.
var _connectionsRef = _fdb.ref("/svc/connections");

// '.info/connected' is a special location provided by Firebase that is updated every time
// the client's connection state changes.
// '.info/connected' is a boolean value, true if the client is connected and false if they are not.
var _connectedRef = _fdb.ref(".info/connected");

/**
 * 1.3 saveToFirebase
 * @param {object} dataObj - represents svcData object
 * 
 * NOTE: passing an object or array as an argument to a method will
 * change the object since it's passed by reference. 
 * Where as other variable types will pass by value and not change 
 * the passed argument. 
 */
function saveToFirebase(dataObj) {
  dataObj.dateAdded = firebase.database.ServerValue.TIMESTAMP;

  _fdb.ref().once('value', function (sn) {
    if (sn.hasChild('/svc')) {
      _checkfirebaseforip(dataObj);

    } else {
      _pushChild(dataObj);
    }
  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  }); // END _fdb.once('value', function(sn){

  return;
} // END saveToFirebase

/**
 * 1.4 _pushChild
 * @param {object} dataObj 
 * 
 * NOTE: This function must be separate from saveToFirebase due to the fact that 
 * it has a promise which takes time and would simultaneously try to _pushChild
 * when it didn't really need to. 
 */
function _pushChild(dataObj) {
  _dbRef.push(dataObj).then((snap) => {
    dataObj.key = snap.key;

    // Save svcData to LocalStorage
    console.log("Saved To Firebase");
    localStorage.setItem("svc_data", JSON.stringify(svcData));

  }, function (errorObject) {
    console.log("The read failed: " + errorObject.code);
  }); // END _dbRef.push(dataObj).then( (snap) => {
} // END _pushChild

/**
 * 1.5 checkfirebaseforip
 * Check if ip exists in firebase and return out of the function if it does.
 * @param {object} dataObj - represents svcData object
 */
function _checkfirebaseforip(dataObj) {
  if (dataObj.hasOwnProperty('key')) {
    _dbRef.once('value', function (snapshot) {

      if (snapshot.numChildren() > 0) {
        snapshot.forEach(function (snap) {

          for (var property in snap.val()) {
            if (snap.val().hasOwnProperty(property) && svcData.hasOwnProperty('ip') && svcData.hasOwnProperty('site_url') && svcData.hasOwnProperty('pages')) {

              if (property === "ip" && snap.val()[property].hasOwnProperty("address") && svcData.ip.hasOwnProperty('address')) {

                if (snap.val()[property]['address'] === svcData.ip.address) {
                  console.log('Already saved this ip in firebase', svcData.ip.address);
                  // return;

                } else {
                  // child doesn't exists so push it. 
                  dataObj.key = snap.key;
                  _pushChild(dataObj);
                } // END else-if (snap.val()[property]['address'] === svcData.ip.address) {

              } else if (property === "site_url") {

                if (snap.val()[property] === svcData.site_url) {
                  console.log('Already saved this site_url in firebase', svcData.ip.address);
                  // return;

                } else {
                  // child doesn't exists so push it. 
                  dataObj.key = snap.key;
                  _pushChild(dataObj);
                } // END else-if (snap.val()[property]['address'] === svcData.ip.address) {

              } else if (property === "pages") {
                for (var i = 0; i < snap.val()[property].length; i++) {
                  if (snap.val()[property][i].hasOwnProperty('page')) {
                    if (snap.val()[property][i]['page'] === svcData.pages[i].page) {
                      console.log('Already saved this page in firebase', svcData.pages[i].page);
                      // return;
                    } else {
                      dataObj.key = snap.key;
                      _pushChild(dataObj);
                    }
                  }
                }
              } // END if property === ip, site_url, pages

            } else {
              console.log("------------------------------------------------------------------------------");
              console.log("Something doesn't look right.");
            } // END if (snap.val().hasOwnProperty(property) && svcData.hasOwnProperty('ip')) {
          } // END for (var property in snap.val()) {

        }); // END snapshot.forEach(function(snap)
      } // END if (snapshot.numChildren() > 0) {

    }, function (errorObject) {
      console.log("The read failed: " + errorObject.code);
    }); // END _dbRef.once('value', function(snapshot){
  
  }else{
    _pushChild(dataObj)
  } // END if (dataObj.hasOwnProperty('key')) {
  return;
} // END _checkfirebaseforip

/** ===============[ 2. Helper Functions ]================
 * 2.1 loadXMLDoc
 * Uses GET method to fetch JSON object from ajaxURL.
 * @param {string} ajaxURL 
 * @param {function} cb - callback function on success. 
 * @param {function} cbErr  - callback function on error.
 */
function loadXMLDoc(ajaxURL, cb, cbErr) {
  var xmlhttp = new XMLHttpRequest();

  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == XMLHttpRequest.DONE) { // XMLHttpRequest.DONE == 4
      if (xmlhttp.status == 200) {
        //document.getElementById("myDiv").innerHTML = xmlhttp.responseText;
        var json = JSON.parse(xmlhttp.responseText);
        cb(json);

      } else if (xmlhttp.status == 400) {
        var errorMessage = "There was an error 400.";
        console.log("Error Message: ", errorMessage);
        cbErr(errorMessage);

      } else {
        var errorMessage = "Something else other than 200 was returned.";
        console.log("Response: ", JSON.parse(xmlhttp.responseText));
        console.log("Error Message: ", errorMessage);
        cbErr(errorMessage);
      }
    }
  };

  xmlhttp.open("GET", ajaxURL, true);
  xmlhttp.send();

  return;
} // END loadXMLDoc

/**
 * 2.2 consoleResults
 * @param {*} data 
 */
function consoleResults(data) {
  console.log("results", data);
}

/**
 * 2.3 formatDate
 * @param {string} datetime
 * @param {string} format - long or short
 * @return {string} formatedDate
 */
formatDate = function (unformatedDate, format = "long", time = true) {
  const monthNamesLong = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthNamesShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var unformatedDate = new Date(unformatedDate);
  var day = unformatedDate.getDate();
  var month = (format === "long") ? monthNamesLong[unformatedDate.getMonth()] : monthNamesShort[unformatedDate.getMonth()];
  var year = unformatedDate.getFullYear();

  var hours = unformatedDate.getHours();
  var ampm = "AM";
  if (hours > 12) {
    hours -= 12;
    ampm = "PM";
  }

  var minutes = unformatedDate.getMinutes();
  if (minutes < 10) {
    minutes = "0" + minutes;
  }

  var formatedDate = (format === "long") ? month + " " + day + ", " + year : month + "/" + day + "/" + year;

  if (time) {
    formatedDate += " [" + hours + ":" + minutes + " " + ampm + "]";
  }

  return formatedDate;
};

/**
 * 2.4 getHeaders
 */
function getHeaders() {
  var req = new XMLHttpRequest();
  req.open('GET', document.location, false);
  req.send(null);

  // associate array to store all values
  var data = new Object();

  // get all headers in one call and parse each item
  var headers = req.getAllResponseHeaders().toLowerCase();
  var aHeaders = headers.split('\n');
  var i = 0;
  for (i = 0; i < aHeaders.length; i++) {
    var thisItem = aHeaders[i];
    var key = thisItem.substring(0, thisItem.indexOf(':'));
    var value = thisItem.substring(thisItem.indexOf(':') + 1);
    data[key] = value;
  }

  // get referer
  var referer = document.referrer;
  data["Referer"] = referer;

  //get useragent
  var useragent = navigator.userAgent;
  data["UserAgent"] = useragent;


  //extra code to display the values in html
  var display = "";
  for (var key in data) {
    if (key != "")
      display += "<b>" + key + "</b> : " + data[key] + "<br>";
    console.log(key + " : " + data[key]);
  }
  // document.getElementById("dump").innerHTML = display;
  return display;
}

/**
 * 2.5 getSiteURL
 * @param {string} url_piece - full, site, or page
 */
function getSiteURL(url_piece = "full") {
  var fullURL = window.location.href;

  switch (url_piece) {
    case "page":
      return "/" + fullURL.split("/").pop();

    case "site":
      var page = "/" + fullURL.split("/").pop();
      return fullURL.replace(page, "");

    default:
      return fullURL;
  }
}

/**===============[ 3. svcData Functions ]===============
 * These functions will build the following object and 
 * save it to localStorage,
 * 
 * svcData = {
 *   key: <unique-key>
 *   dateAdded: <timestamp>
 *   ip: ipGeoLocation
 *   site_url : window.location.href,
 *   pages : [
 *     '0': {
 *       page: /index.html,
 *       date_added: <timestamp>,
 *     },
 *   ],
 * };
 * 
 * svcData.key - the firebase key obtained when pushed to firebase.
 * svcData.dateAdded - represents the date when object was pushed to firebase.
 * svcData.ip - represents geo location data retrieved from ip address.
 * svcData.site_url - main site url like http://127.0.0.1:5500
 * svcData.pages - array of pages accessed. 
 ********************************************************
 /**
  * 3.1 build_svcData
  */
function build_svcData() {

  // Set site_url
  var siteFound = false;
  if (svcData.hasOwnProperty('site_url')) {
    if (svcData.site_url !== getSiteURL("site")) {
      svcData.site_url = getSiteURL("site");

    } else {
      siteFound = true;
    }

  } else {
    svcData.site_url = getSiteURL("site");
  }

  // Set pages
  var pageFound = false;
  if (svcData.hasOwnProperty('pages')) {
    if (typeof (svcData.pages) == 'object' && svcData.pages instanceof Array) {
      var thisPage = getSiteURL("page");

      for (var i = 0; i < svcData.pages.length; i++) {
        if (svcData.pages[i].hasOwnProperty('page')) {
          if (svcData.pages[i].page === thisPage) {
            pageFound = true;
          }
        } // if(svcData.pages[i].hasOwnProperty('page')){
      } // END for(var i=0; i < svcData.pages.length; i++ ){
    } // END if(typeof(svcData.pages) == 'object' && svcData.pages instanceof Array){
  } // if(svcData.hasOwnProperty('pages')){

  if (pageFound === false) {
    var d = new Date();
    var timestamp = d.getTime();
    var pageObj = {
      "page": getSiteURL("page"),
      "date_added": timestamp,
    };

    svcData.pages = [];
    svcData.pages.push(pageObj);
  }; // if(pageFound === false){

  if (siteFound === false || pageFound === false) {
    // Save svcData to LocalStorage
    localStorage.setItem("svc_data", JSON.stringify(svcData));
    console.log("build_svcData", svcData);
  } else {
    console.log("Already saved site in localStorage", svcData.site_url);
  }

  // saveToFirebase(svcData);
} // END build_svcData

/**
 * 3.2 ipGeoLocation
 * @param {string} ip 
 */
function ipGeoLocation(ip) {
  // Get IP if it's undefined
  if (ip === undefined) {
    var _ip = function (r) {
      ipGeoLocation(r.ip);
    };

    var _c = function (r) {
      console.log(r);
    };

    loadXMLDoc("https://api.ipify.org?format=json", _ip, _c);
    return;
  } else if (svcData.hasOwnProperty('ip')) {
    // Check if locally stored IP is the same as current ip
    if (svcData.ip.hasOwnProperty('address')) {
      if (svcData.ip.address === ip) {
        saveToFirebase(svcData);
        console.log('Already saved this ip to localStorage', ip);
        return;
      }
    }
  }

  // Fetch IPGeoLocation data and save it
  var data = null;
  var xhr = new XMLHttpRequest();
  xhr.withCredentials = true;

  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === this.DONE) {
      var res = JSON.parse(this.responseText)
      svcData.ip = res.ip;

      // Save svcData to LocalStorage
      localStorage.setItem("svc_data", JSON.stringify(svcData));
      saveToFirebase(svcData);
      console.log("ipGeoLocation", svcData);
    }
  });

  var API_KEY = "0acc44c0f4msh221a1ccbfc7d4d9p13dc6bjsn4e0e4d40f033";
  var queryURL = "https://apility-io-ip-geolocation-v1.p.rapidapi.com/" + ip;

  xhr.open("GET", queryURL);
  xhr.setRequestHeader("x-rapidapi-host", "apility-io-ip-geolocation-v1.p.rapidapi.com");
  xhr.setRequestHeader("x-rapidapi-key", API_KEY);
  xhr.setRequestHeader("accept", "application/json");

  xhr.send(data);
  return;
} // ipGeoLocation

/** ===============[ 4. Collect Site Data ]===============
 * Will run the svcData functions to collect site data and
 * push changes to firebase.
 ********************************************************/
// 4.1 Set svcData.ip
build_svcData();

// 4.2 Set svcData.site_url and svcData.pages
// NOTE: This will also invoke saveToFirebase(svcData);
ipGeoLocation();

//-------------------------------------[ 4.3 Firebase Connection Watcher ]---------------------------
_connectedRef.on("value", function (snap) {

  var currentPage = getSiteURL("page");
  var pageIndex = 1;
  
  if (svcData.hasOwnProperty('pages')) {
    if (typeof (svcData.pages) == 'object' && svcData.pages instanceof Array) {

      for (var i = 0; i < svcData.pages.length; i++) {
        if (svcData.pages[i].hasOwnProperty('page')) {
          if (svcData.pages[i].page === currentPage) {
            pageIndex = i;
          }
        } // if(svcData.pages[i].hasOwnProperty('page')){
      } // END for(var i=0; i < svcData.pages.length; i++ ){
    } // END if(typeof(svcData.pages) == 'object' && svcData.pages instanceof Array){
  } // if(svcData.hasOwnProperty('pages')){

  //var pageRef = _fdb.ref("/svc/" + svcData.key + "/pages/" + pageIndex + "/active");
  var pageRef = _fdb.ref("/svc/" + svcData.key + "/activePage/");

  // If they are connected..
  if (snap.val()) {

    // Add user to the connections list.
    var con = _connectionsRef.push(true);
    var activePage = pageRef.push({"index": pageIndex, "page": currentPage});

    // Remove user from the connection list when they disconnect.
    con.onDisconnect().remove();
    activePage.onDisconnect().remove();
  }
});
//-------------------------------------[ Firebase Connection Watcher ]---------------------------