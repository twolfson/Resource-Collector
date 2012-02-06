// TODO: Be sure to surround the 'href' and 'source' with additional attributes
function matchInArray(arr, str) {
  var i = 0,
      len = arr.length,
      retBool = false;
  for (; i < len; i++) {
    if (arr[i].match(str)) {
      retBool = true;
      break;
    }
  }
  return retBool;
}

function addScript(url) {
  scriptElt = document.createElement('script');
  scriptElt.setAttribute('type', 'text/javascript');
  scriptElt.setAttribute('src', url);
  // The initial purpose of this line was to wrap 'src' on both sides with attributes, now that is no longer guaranteed thanks to IE6's innerHTML
  scriptElt.setAttribute('language', 'Javascript');
  document.body.appendChild(scriptElt);
}

function addCss(url) {
  linkElt = document.createElement('link');
  linkElt.setAttribute('type', 'text/css');
  linkElt.setAttribute('src', url);
  linkElt.setAttribute('media', 'screen');
  document.body.appendChild(linkElt);
}

TestCase('ResourceCollector', {
  'test An inline ResourceCollector': function () {
    var rc = new ResourceCollector({'inline': true}),
    // when collecting
        urls = rc.collect(),
        isInArray;

    assertArray('collects an array', urls);

    isInArray = matchInArray(urls, 'src-test/relativeScript.js');
    assert('on a page with a script element in the head, there is a matching url', isInArray);

    addScript(location + '/absoluteScript.js');
    urls = rc.collect();
    isInArray = matchInArray(urls, /http.*\/absoluteScript.js/i);
    assert('on a page with a script element in the body, there is a matching url', isInArray);

    isInArray = matchInArray(urls, 'src-test/relativeUrl.css');
    assert('on a page with a stylesheet link in the head, there is a matching url', isInArray);

    addCss(location + '/absoluteUrl.css');
    urls = rc.collect();
    isInArray = matchInArray(urls, /http.*\/absoluteUrl.css/i);
    assert('on a page with a stylesheet link in the body, there is a matching url', isInArray);
  },
  'test A CSS ResourceCollector': function () {
    var rc = new ResourceCollector({'css': true}),
    // when collecting
        urls = rc.collect(),
        isInArray;

    isInArray = matchInArray(urls, 'relative1.png');
    alert(JSON.stringify(urls));
    assert('collects relative urls', isInArray);
    isInArray = matchInArray(urls, 'http:\/\/localhost:8080/relative2.png');
    assert('collects relative urls and coerces them to absolute urls', isInArray);

    isInArray = matchInArray(urls, /http.*\/absolute2\.png/i);
    assert('collects absolute urls', isInArray);
  },
  'test A \'self\' ResourceCollector': function () {
    var rc = new ResourceCollector({'self': true}),
    // when collecting
        urls = rc.collect(),
        isInArray;

    isInArray = matchInArray(urls, location + '');
    assert('collects the current webpage\'s url', isInArray);
  }
});

TestCase('ResourceCollector 2', {
  'test A ResourceCollector': function () {
    var body = document.body,
        rc = new ResourceCollector(),
    // when collecting
        urls = rc.collect(),
        isInArray;

    addCss(location + '/absoluteUrl.css');
    addCss(location + '/absoluteUrl.css');
    urls = rc.collect();
    var count = 0,
        i = urls.length;
    while (i--) {
      if (urls[i].match('absoluteUrl.css')) {
        count += 1;
      }
    }
    assertSame('deduplicates references to the same file', 1, count);

    isInArray = matchInArray(urls, 'src-test/relativeScript.js');
    assert('collects relative urls', isInArray);

    addScript(location + '/absoluteScript.js');
    urls = rc.collect();
    isInArray = matchInArray(urls, 'absoluteScript.js');
    assert('collects absolute urls', isInArray);

    addScript('//github.com/notARealScript.js');
    isInArray = matchInArray(urls, 'notARealScript.js');
    assertFalse('throws away foreign urls', isInArray);
  }
});