/* Options */
// Boolean to watch inline relative elements <elt src=''>
var watchInlineElements = true,
// Boolean to relative urls in CSS * { property: url('') }
    watchCssUrls = true,
// An object best represents a set
    resources = (function(){
      var retObj = {},
          set = {};
      retObj.add = function (key) {
        set[key] = 1;
      };
      retObj.items = function () {
        // Localize for faster multiple lookups [Zakas]
        var _set = set,
            key,
            retArr = [];
        for( key in _set ) {
          if( _set.hasOwnProperty(key) ) {
            // Faster than push [Zakas]
            retArr[retArr.length] = key;
          }
        }
      };
      return retObj;
    }());

// TODO: Allow for other hosts, paths, etc
// TODO: Test in IE6
// TODO: Wrap in anonymous function

// Wait until DOM is ready. I would use DOM Parsed but can't find a good snippet
/* Attribution: https://github.com/ded/domready */
!function(a,b){this[a]=this.domReady=b()}("domready",function(a){function l(a){k=1;while(a=b.shift())a()}var b=[],c,d=!1,e=document,f=e.documentElement,g=f.doScroll,h="DOMContentLoaded",i="addEventListener",j="onreadystatechange",k=/^loade|c/.test(e.readyState);e[i]&&e[i](h,c=function(){e.removeEventListener(h,c,d),l()},d),g&&e.attachEvent(j,c=function(){/^c/.test(e.readyState)&&(e.detachEvent(j,c),l())});return a=g?function(c){self!=top?k?c():b.push(c):function(){try{f.doScroll("left")}catch(b){return setTimeout(function(){a(c)},50)}c()}()}:function(a){k?a():b.push(a)}});

function grabRelativePath(str, quoteIndex) {
  var quote = str[quoteIndex],
      endIndex,
      url;
  
  // Skip any wierd script instances
  if( !quote.match(/['"]/) ) {
    return;
  }

  // Find the true source (4 is allow for checking \)
  // TODO: Test \"
  endIndex = quoteIndex;
  do {
    endIndex = str.indexOf(quote, quoteIndex + 1);

    // If there is no end quote, something is wrong and continue
    if( endIndex === -1 ) {
      return;
    }
  } while( str[endIndex - 1] === "\\" );

  // Collect the URL
  url = str.slice(quoteIndex + 1, endIndex);
  
  // TODO: Move out to another function
  // Check for absolute url
  if( url.match(/([^:]*:)?\/\//) ) {
    // TODO: Handle same hostname
    return;
  }
  
  // Return the valid relative url
  return url;
}

// In innerHTML, find all src=""
if( watchInlineElements ) {
  domready(function(){
    var srcWithJunkArr = document.body.innerHTML.match(/src=([^>]*>)/g),
        srcWithJunk,
        i = srcWithJunkArr.length,
        srcStr;

    // Loop through all the sources
    while( i-- ) {
      // Find the quote used for the source
      srcWithJunk = srcWithJunkArr[i];
      srcStr = grabRelativePath(srcWithJunk, 4);
      if( srcStr !== undefined ) {
        resources.add(srcStr);
      }
    }
  });
}

// In styleSheets, find all url()
if( watchCssUrls ) {
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
    // TODO: Collect stylesheet url
    // TODO: Only parse if styleSheet is relative
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