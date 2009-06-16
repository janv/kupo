var JSON   = require('json')
var Errors = require('kupo/errors').Errors

/**
 * Base class for Custom- and ResourceController
 * @class
 */
var Controller = exports.Controller = {
  /** Stores the Jack Request */
  request : null,
  /** Stores the Cookies */
  cookies : null,
  /** Stores the Session */
  session : null,
  
  //Cookies
  /** Extract the Cookies from the request and store them in the Controller instance */
  cookiesLoad : function() {
    var crappyCookies = this.request.cookies();
    this.cookies = {}
    for (var key in crappyCookies) {
      this.cookies[key.match(/^ *(.*)/)[1]] = crappyCookies[key]
    }
  },
  
  /** Modify the response so the cookies are stored to the client */
  cookiesStore : function() {
    var pairs = []
    for(var key in this.cookies) {
      pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(this.cookies[key].toString())) 
    }
    this.response[1]["Set-Cookie"] = pairs.join(", ")
  },

  //Sessionstuff
  /** Extract the session from the cookies and store it in this.session */
  sessionSetup : function() {
    if (this.cookies['kupo_session']) {
      this.session = JSON.decode(this.cookies['kupo_session']);
    } else {
      this.session = {}
    }
  },
  
  /** Store the session in a cookie */
  sessionTeardown : function() {
    this.cookies['kupo_session'] = JSON.stringify(this.session);
  },
  
  /** Handle a Jack request */
  handle : function(_request) {
    try {
      this.request = _request;
      this.cookiesLoad();
      this.sessionSetup();
      
      this.response = this.process();
      
      this.sessionTeardown();
      this.cookiesStore();
      this.request = null;
      return this.response;      
    } catch (e) {
      if (!e.isKupoError) { e = Errors.wrap(e); }
      return e.to(this.request.contentType());
    }
  }
}