Synopsis
========
Currently, there is no cross-platform solution that allows a front-end developer to alter some code (flavor agnostic) and immediately see the result occur in the browser.

This is a poor man's solution to solving that problem half way. The code base has been split up into two halves; a script that watches specific URL's for any content changes and another script which gathers the resources used on the page.

This script is the second half.

How It Works
============
ResourceCollector looks at the HTML of your page and the DOM to find all resources that have been referenced. These can be image links to script tags to some CSS background images.

After all the url's have been collected, they are deduplicated and returned in an array.

Note: For CSS background images (and the like), if the path is relative, it is converted to an absolute path in reference to the stylesheet.

Develop with a hands-free refresh
=================================
ResourceCollector was initially built as a part of a sister script called FileWatcher. When these scripts are used together, they allow for webpages to dynamically refresh whenever there is an HTML change and seamlessly update images and CSS.

Below are two common examples of how to use the scripts.

Refresh always
--------------
This snippet will make the entire webpage reload on any resource change (HTML, CSS, script, or image). Place this snippet at the bottom of the body of your HTML page since collector will not find all the resources otherwise.

    <script src="//raw.github.com/twolfson/File-Watcher/master/src/watcher.js"></script>
    <script src="//raw.github.com/twolfson/Resource-Collector/master/src/collector.js"></script>
    <script>
        (function () {
           var watcher = new FileWatcher(),
               resources = ResourceCollector.collect();
           watcher.addListener(function () {
             location.reload();
           });
           watcher.watch(resources);
        }());
    </script>

Smart refresh
-------------
This snippet will reload when there is an HTML or script change. Additionally, we will watch CSS and images for changes (which when the browser sees a change has occurred, will update without a refresh).

    <script src="//raw.github.com/twolfson/File-Watcher/master/src/watcher.js"></script>
    <script src="//raw.github.com/twolfson/Resource-Collector/master/src/collector.js"></script>
    <script>
        (function () {
           var watcher = new FileWatcher(),
               resources = ResourceCollector.collect();
           watcher.addListener(function (url) {
             if (url.match(/(js|html)$/)) {
               location.reload();
             }
           });
           watcher.watch(resources);
        }());
    </script>

Standalone Usage
========
To collect the resources on your current page, download and include the ResourceCollector script on your page (either via &lt;script&gt; or an AMD loader).

    <script src="//raw.github.com/twolfson/Resource-Collector/master/src/collector.js"></script>
    OR
    require(['ResourceCollector'], function (ResourceCollector) { /* Your code goes here */ });

Then, collects all the resources in one fell swoop.

    var resources = ResourceCollector.collect();
    /* Do stuff with your array of resources */

To change what is collected, please refer to the API.

Tested in
=========
 - Firefox 7
 - IE 6

The API
=========

Static methods
--------------
 - **collect**([options]) - Creates a new ResourceCollector, collects the resources from the page, and returns the array of resources. The method takes in an optional options object which has the following optional properties.
    - options.inline - Boolean flag. If set to true, collect resources from inline elements - &lt;elt src=''&gt; and &lt;link href=''&gt;
    - options.css - Boolean flag. If set to true, collect resources from CSS urls - * { property: url('') }
    - options.self - Boolean flag. If set to true, collect current webpage url
    - options.sameDomainOnly- Boolean flag. If set to true, only collect resources from the same domain

Constructor
----------------
 - **ResourceCollector**([options]) - Takes in same optional set of options as listed in the static method above. If no options are given, we fall back to

        {'inline': true, 'css': true, 'self': true, 'sameDomainOnly': true}

 Otherwise, options are merged onto

         {'inline': false, 'css': false, 'self': false, 'sameDomainOnly': true}

Instance methods
----------------
 - **collect**() - Collects resources from the page using the options attached to the instance and returns an array of urls.

Enjoy!