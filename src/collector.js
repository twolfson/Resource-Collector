// TODO: Test in IE6
// TODO: Wrap in anonymous function
// AMD inspired by domready
(function (name, definition) {
  var defObj;
  if (typeof define === 'function') {
    defObj[name] = definition;
    define(defObj);
  } else if (typeof exports !== 'undefined') {
    exports[name] = definition;
  } else {
    this[name] = definition;
  }
}('ResourceCollector', (function () {
function noop() {}

function Set() {
  this._set = {};
}
Set.prototype = {
  'add': function (key) {
    // Do not accept undefined keys
    if (!key) {
      return;
    }
    set[key] = 1;
  },
  // Late-binding array creator
  'items': function () {
    // Localize for set
    var set = this._set,
        key,
        retArr = [];

    for (key in set) {
      if (set.hasOwnProperty(key)) {
        // Faster than push [Zakas]
        retArr[retArr.length] = key;
      }
    }

    return retArr;
  }
};

/**
 * Resource collector constructor function
 * @constructor
 * @param {Object} [options] Options of what to watch on the resources. By default, everything is enabled. Once options is specified, it turns into a whitelist.
 * @param {Boolean} [options.inline=false] Collect resources from inline elements - <elt src=''>
 * @param {Boolean} [options.css=false] Collect resources from CSS urls - * { property: url('') }
 * @param {Boolean} [options.self=false] Collect own url
 * @param {Boolean} [options.sameDomainOnly=true] Only collect resources from the same domain
 * @returns {Object<ResourceCollector>} A resource collector object
 */
function ResourceCollector(options) {
  // Fallback options
  options = options || {'inline': true, 'css': true, 'self': true, 'sameDomainOnly': true};

  // Set up options on the resource collector
  this._inline = options.inline || false;
  this._css = options.css || false;
  this._self = options.self || false;
  this._sameDomain = options.sameDomainOnly || true;
}

/**
 * Instantiates a ResourceCollector, collects, and callsback with results
 * @see ResourceCollector and ResourceCollector.prototype.collect
 */
ResourceCollector.collect = function (options) {
  var rc = new ResourceCollector(options);
  return rc.collect(callback);
}

var htmlElt = document.documentElement;
ResourceCollector.prototype = {
  /**
   * Collect all inline items
   * @returns {String[]} Unfiltered array of inline urls (WARNING: May contain duplicates)
   */
  'collectInline': function () {
    // TODO: Also collect elements from the head (including link href=".css")
    var docHtml = htmlElt.innerHTML,
        srcWithExcessArr = docHtml.match(/src=([^>]*>)/g) || [],
        srcWithExcess,
        i = 0,
        len = srcWithExcessArr.length,
        src,
        retArr = [];

    // Loop through all the sources
    for (; i < len; i++) {
      // Strip the quotes from the source
      srcWithExcess = srcWithExcessArr[i];
      src = stripQuotes(srcWithExcess);

      // If there is a src found, append it to the retArr
      if( src !== false ) {
        retArr[retArr.length] = srcStr;
      }
    }

    return retArr;
  },
  /**
   * Collector function for urls within style sheets. Relative paths are automatically mapped to absolute paths due to the nature of CSS
   * @returns {String[]} Unfiltered array of CSS urls (WARNING: May contain duplicates)
   */
  'collectCss': function () {
    // Collect them and add to the resource collection
    var styleSheets = document.styleSheets || [],
      styleSheet,
      i = styleSheets.length,
      rules,
      j,
      text,
      urlMatches,
      k,
      urlStr;

    while( i-- ) {
      styleSheet = styleSheets[i];

      // Collect stylesheet url
      urlStr = styleSheet.href || '';
      if( checkUrlRelative(urlStr) ) {
        // Store stylesheet to resources
        resources.add(urlStr);
// TODO: handle relative path in stylesheet
        // Grab inner urls
        rules = styleSheet.cssRules || styleSheet.rules || [];
        j = rules.length;
        while( j-- ) {
          text = rules[j].cssText;
          urlMatches = text.match(/url\([^\)]*\)/g);
          if( urlMatches ) {
            k = urlMatches.length;
            while( k-- ) {
              var urlStr = grabRelativePath(urlMatches[k], 4);
              resources.add(urlStr);
            }
          }
        }
      }
    }
  },
  /**
   * Collect items with the options attached to this ResourceCollector
   * @returns {String[]} Array of resources on the page (with the specified options)
   */
  'collect': function (callback) {
    // Collect all resource collection-related options
    var inline = this._inline,
        css = this._css,
        self = this._self,
    // Set up intermediate variables
        arr,
        i,
        len,
    // Set up resources set (prevent redundancy)
        resources = new Set();

    // If we need to collect inline elements
    if (inline === true) {
      // Collect them and add to the resource collection
      arr = this.collectInline();
      for (i = 0, len = arr.length; i < len; i++) {
        resources.add(arr[i]);
      }
    }
    
    // If we need to collect css url's
    if (css === true) {
    }

    // If we should be tracking this document, add it to the collection
    if (self === true) {
      resources.add(location);
    }

    // Collect all resource filtering options
    var sameDomain = this._sameDomain,
        retArr = allResources;

    // If we are to filter by the same domain
    if (sameDomain === true) {
      // Reset retArr
      retArr = [];

      // Iterate each item

    }
  }
};

// TODO: Objectify URL's

var host = location.hostname;
function checkUrlRelative(url) {
  var relative = true,
      urlHostArr,
      _host;

  // If the url is absolute
  if( url.match(/([^:]*:)?\/\//) ) {
    relative = false;

    // Get hostname
    urlHostArr = url.match(/\/\/([^\/]*)/);
    if( urlHostArr ) {
      _host = host;
      urlHost = urlHostArr[1];

      // TODO: Robustify this? (www. vs www2. will not match)
      // Check if one is a subdomain of the other (this also accounts for same domain)
      if( _host.indexOf( urlHost ) !== -1 || urlHost.indexOf(_host) !== -1 ) {
        relative = true;
      }
    }
  }

  return relative;
}

/**
 * Helper function that takes out a string from the closest non-escaped quotes
 * @param {String} str String to extract on
 * @returns {String|Boolean} If successful, a url is returned. If unsuccessful, false will be returned.
 */
function stripQuotes(str) {
  // Determine which quote comes first
  var singleQuoteIndex = str.indexOf("'"),
      doubleQuoteIndex = str.indexOf('"'),
      quoteIndex = Math.min(singleQuoteIndex, doubleQuoteIndex);

  // If there is no quote, return early
  if (quoteIndex === -1) {
    return false;
  }

  // Grab the actual quote
  var quote = str[quoteIndex],
      endIndex,
      url;

  // Find the next quote
  // TODO: Test \"
  endIndex = quoteIndex;
  do {
    endIndex = str.indexOf(quote, endIndex + 1);

    // If there is no end quote, return early
    if (endIndex === -1) {
      return false;
    }

  // If it is preceded by a slash, keep on looping
  } while (str[endIndex - 1] === "\\");

  // Collect the URL
  url = str.slice(quoteIndex + 1, endIndex);

  // Return the valid relative url
  return url;
}

// Run collecter onces dom is ready
domready(function(){
  // In styleSheets, find all url()
  if( watchCssUrls ) {
    
  }

  // Execute callback function on resources
  callback(resources.items());
});