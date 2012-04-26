// AMD inspired by domready
(function (name, definition) {
  if (typeof define === 'function') {
    define(function () {
      return definition;
    });
  } else if (typeof exports !== 'undefined') {
    exports[name] = definition;
  } else {
    this[name] = definition;
  }
}('ResourceCollector', (function (document) {
/*** BEGIN: Helper objects/functions ***/
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
    this._set[key] = 1;
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

// TODO: Objectify URL's?
/**
 * Helper method that checks grabs the hostname and protocol if available
 * @param {String} url Url to check on
 * @returns {String|Boolean} Hostname and protocol if there is one, false otherwise.
 */
function getHostAndProtocol(url) {
  var urlArr = url.match(/^[^*\/]*\/\/(?:[^\/]*\/)/),
      retVal = false;
  if (urlArr) {
    retVal = urlArr[0];
  }
  return retVal;
}

/**
 * Helper method that checks if a url has a protocol
 * @param {String} url Url to check on
 * @returns {String|Boolean} Hostname if there is one, false otherwise.
 */
function getHostname(url) {
  var urlArr = url.match(/\/\/([^\/]*)/),
      retVal = false;
  if (urlArr) {
    retVal = urlArr[1];
  }
  return retVal;
}

/**
 * Helper method that checks if a url is absolute or relative
 * @param {String} url Url to check on
 * @returns {Boolean} True if the url is absolute, false otherwise.
 */
function isAbsoluteUrl(url) {
  return !!getHostname(url) || (url.length > 0 && url.charAt(0) === '/');
}

var host = location.hostname,
    _location = location + '',
    _hostAndProtocol = getHostAndProtocol(_location);
/**
 * Helper method that checks if a url is on the same domain (needs some robustification with different subdomains)
 * @param {String} url Url to check on
 * @returns {Boolean} True if the url has the same domain, false otherwise.
 */
function isSameDomain(url) {
  // Assume the url is relative to start
  var retBool = true,
      urlHost = getHostname(url);

  // If the url has a hostname
  if (urlHost !== false) {
    // Assume different domain
    retBool = false;

    // TODO: Robustify this? (www. vs www2. will not match)
    // Check if one is a subdomain of the other (this also accounts for same domain)
    if( host.indexOf(urlHost) !== -1 || urlHost.indexOf(host) !== -1 ) {
      retBool = true;
    }
  }

  return retBool;
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

  // If one of the quotes doesn't exist, use the second index
  if (quoteIndex === -1) {
    quoteIndex = Math.max(singleQuoteIndex, doubleQuoteIndex);

    // If there still is no quote, return early
    if (quoteIndex === -1) {
      return false;
    }
  }

  // Grab the actual quote and find the next one
  var quote = str.charAt(quoteIndex),
      endIndex = str.indexOf(quote, quoteIndex + 1),
      url;

  // If there is no end quote, return early
  if (endIndex === -1) {
    return false;
  }

  // Collect the URL
  url = str.slice(quoteIndex + 1, endIndex);

  // Return the valid relative url
  return url;
}

/**
 * Helper function that trims css url's (both unquoted and quoted)
 * @param {String} str String to extract on
 * @returns {String|Boolean} If successful, a url is returned. If unsuccessful, false will be returned.
 */
function stripCssUrl(url) {
  var retVal = stripQuotes(url),
      urlArr;

  // If the stripQuotes attempt failed
  if (retVal === false) {
    // Get the url via regexp
    urlArr = url.match(/url\(([^\)]*)\)/i);
    if (urlArr) {
      retVal = urlArr[1];
    }
  }

  return retVal;
}

/**
 * Takes a filename and returns the base directory
 * @param {String} filename Name of file to get base directory from
 * @returns {String} Base directory of file
 */
function basePath(filename) {
  var lastSlashIndex = filename.lastIndexOf('/'),
  // The return string will include the slash (if there is none, it will truncate to an empty string)
      retStr = filename.slice(0, lastSlashIndex + 1);
  return retStr;
}

/**
 * Takes a url and removes the anchor (if it exists)
 * @param {String} url Url to strip anchor from
 * @returns {String} Anchor-free url
 */
function stripAnchor(url) {
  var anchorIndex = url.indexOf('#'),
      retVal = url;
  if (anchorIndex !== -1) {
    retVal = url.slice(0, anchorIndex);
  }
  return retVal;
}

/*** END: Helper objects/functions ***/
/*** BEGIN: ResourceCollector core ***/

/**
 * Resource collector constructor function
 * @constructor
 * @param {Object} [options] Options of what to watch on the resources. By default, everything is enabled. Once options is specified, it turns into a whitelist.
 * @param {Boolean} [options.inline=false] Collect resources from inline elements - <elt src=''> and <link href=''>
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
  return rc.collect();
};

/**
 * Function that collects all inline sources from the document
 * @returns {String[]} Unfiltered array of inline urls (WARNING: May contain duplicates)
 */
var htmlElt = document.documentElement;
ResourceCollector.collectInline = function () {
  // Collect the link href's and src's seperately
  var docHtml = htmlElt.innerHTML,
      hrefWithExcessArr = docHtml.match(/<link[^>]*href=([^>]*>)/gi) || [],
      hrefWithExcess,
      i = 0,
      len = hrefWithExcessArr.length;

  // Iterate the href's and extract the substring so 'strips' go accordingly
  for (; i < len; i++) {
    hrefWithExcess = hrefWithExcessArr[i];
    hrefWithExcessArr[i] = hrefWithExcess.slice(hrefWithExcess.indexOf('href='));
  }

  var srcWithExcessArr = docHtml.match(/src=([^>]*>)/gi) || [],
  // Then, concatenate them together
      urlWithExcessArr = hrefWithExcessArr.concat(srcWithExcessArr),
      urlWithExcess,
      url,
      retArr = [];

  // Loop through all the sources
  for (i = 0, len = urlWithExcessArr.length; i < len; i++) {
    // Strip the quotes from the source
    urlWithExcess = urlWithExcessArr[i];
    url = stripQuotes(urlWithExcess);

    // If there is a url found, append it to the retArr
    if( url !== false ) {
      retArr[retArr.length] = url;
    }
  }

  // Return the sources
  return retArr;
};

/**
 * Collector function for urls within style sheets. Relative paths are automatically mapped to absolute paths due to the nature of CSS
 * @returns {String[]} Unfiltered array of CSS urls (WARNING: May contain duplicates)
 */
ResourceCollector.collectCss = function () {
  // Get the stylesheets attached to the page
  var stylesheets = document.styleSheets || [],
      stylesheet,
      stylesheetUrl,
      stylesheetDir,
      i = 0,
      len = stylesheets.length,
  // Set up preparatory variables
      rules,
      j,
      len2,
      rule,
      ruleContent,
      ruleStyle,
      urlWithExcessArr,
      urlWithExcess,
      k,
      len3,
      url,
      retArr = [];

  // Iterate each stylesheet
  for (; i < len; i++) {
    stylesheet = stylesheets[i];

    // Grab the stylesheet's url (for relative paths)
    stylesheetUrl = stylesheet.href || _location;
    stylesheetDir = basePath(stylesheetUrl);
    stylesheetHostAndProtocol = getHostAndProtocol(stylesheetUrl);
    isNotSameHostandProtocol = stylesheetHostAndProtocol !== _hostAndProtocol;

    // Get the stylesheet's rules
    rules = [];
    try {
      rules = stylesheet.cssRules || stylesheet.rules || [];
    } catch (e) {}

    // Iterate the rules
    for (j = 0, len2 = rules.length; j < len2; j++) {
      rule = rules[j];
      // Get the rule's content
      ruleContent = rule.cssText;

      // If the cssText was not found at first
      if (ruleContent === undefined) {
        // Look for the rule's style
        ruleStyle = rule.style;

        // If the rule's style exists
        if (ruleStyle !== undefined) {
          // Use the cssText
          ruleContent = ruleStyle.cssText || '';
        } else {
        // Otherwise, skip this rule
          continue;
        }
      }

      // Find any url's mentioned in the css
      urlWithExcessArr = ruleContent.match(/url\([^\)]*\)/gi) || [];
      for (k = 0, len3 = urlWithExcessArr.length; k < len3; k++) {
        urlWithExcess = urlWithExcessArr[k];
        url = stripCssUrl(urlWithExcess);

        // If there is a url
        if (url !== false) {
          // If the url is not absolute
          if (!isAbsoluteUrl(url)) {
            // Prepend the stylesheet location
            url = stylesheetDir + url;
          } else if (!getHostname(url) && isNotSameHostandProtocol) {
          // Otherwise, if the url does not have its own domain AND the domain name and protocol of the stylesheet does not match the location's
            // Prepend the domain and protocol
            url = stylesheetHostAndProtocol + url;
          }

          // Add it to the return array
          retArr[retArr.length] = url;
        }
      }
    }
  }

  // Return the url's
  return retArr;
};

ResourceCollector.prototype = {
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
        url,
        i,
        len,
    // Set up resources set (prevent redundancy)
        resourceSet = new Set();

    // If we need to collect inline elements
    if (inline === true) {
      // Collect them and add to the resource collection
      arr = ResourceCollector.collectInline();
      for (i = 0, len = arr.length; i < len; i++) {
        url = stripAnchor(arr[i]);
        resourceSet.add(url);
      }
    }

    // If we need to collect css url's
    if (css === true) {
      // Collect them and add to the resource collection
      arr = ResourceCollector.collectCss();
      for (i = 0, len = arr.length; i < len; i++) {
        url = stripAnchor(arr[i]);
        resourceSet.add(url);
      }
    }

    // If we should be tracking this document, add it to the collection
    if (self === true) {
      url = stripAnchor(_location);
      resourceSet.add(url);
    }

    // Collect all resource filtering options
    var sameDomain = this._sameDomain,
        resources = resourceSet.items(),
        resource,
        retArr = resources;

    // If we are to filter by the same domain
    if (sameDomain === true) {
      // Reset retArr
      retArr = [];

      // Iterate each item
      for (i = 0, len = resources.length; i < len; i++) {
        resource = resources[i];

        // If the url is on the same domain, add it to the retArr
        if (isSameDomain(resource)) {
          retArr[retArr.length] = resource;
        }
      }
    }

    return retArr;
  }
};

return ResourceCollector;
}(document))
));