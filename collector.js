/* Options */
// Boolean to watch inline relative elements <elt src=''>
var watchInlineElements = true,
// Boolean to relative urls in CSS * { property: url('') }
    watchCssUrls = true,
// Boolean to relative href's in the head <elt href=''>
    headLinks = true,
    resources = [];

// TODO: Test in IE6
// TODO: Wrap in anonymous function

// Wait until DOM is ready. I would use DOM Parsed but can't find a good snippet
/* Attribution: https://github.com/ded/domready */
!function(a,b){this[a]=this.domReady=b()}("domready",function(a){function l(a){k=1;while(a=b.shift())a()}var b=[],c,d=!1,e=document,f=e.documentElement,g=f.doScroll,h="DOMContentLoaded",i="addEventListener",j="onreadystatechange",k=/^loade|c/.test(e.readyState);e[i]&&e[i](h,c=function(){e.removeEventListener(h,c,d),l()},d),g&&e.attachEvent(j,c=function(){/^c/.test(e.readyState)&&(e.detachEvent(j,c),l())});return a=g?function(c){self!=top?k?c():b.push(c):function(){try{f.doScroll("left")}catch(b){return setTimeout(function(){a(c)},50)}c()}()}:function(a){k?a():b.push(a)}});


// In innerHTML, find all src=""
if( watchInlineElements ) {
  domready(function(){
    var srcWithJunkArr = document.body.innerHTML.match(/src=([^>]*>)/g),
        srcWithJunk,
        i = srcWithJunkArr.length,
        quote,
        endIndex;


    // Loop through all the sources
    while( i-- ) {
      // Find the quote used for the source
      srcWithJunk = srcWithJunkArr[i];
      quote = srcWithJunk[4];

      // Skip any wierd script instances
      if( !quote.match(/['"]/) ) {
        continue;
      }

      // Find the true source (4 is allow for checking \)
      // TODO: Test \"
      endIndex = 4;
      do {
        endIndex = srcWithJunk.indexOf(quote, endIndex + 1);

        // If there is no end quote, something is wrong and continue
        if( endIndex === -1 ) {
          continue;
        }
      } while( srcWithJunk[endIndex - 1] === "\\" );

      // TODO: Check for relative path
      console.log( srcWithJunk.slice(5, endIndex) );
    }
  });
}

// In styleSheets, find all url()
// link href= seems to be the only anomaly