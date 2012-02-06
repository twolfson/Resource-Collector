// TODO: Be sure to surround the 'href' and 'source' with additional attributes
// First batch
var batches = [
{
  'An inline ResourceCollector': {
    'when collecting': {
      'on a page with a script element in the head': {
        'retrieves its url': function () {}
      },
      'on a page with a script element in the body': {
        'retrieves its url': function () {}
      },
      'on a page with a stylesheet link in the head': {
        'retrieves its url': function () {}
      },
      'on a page with a stylesheet link in the body': {
        'retrieves its url': function () {}
      },
    }
  },
  'A CSS ResourceCollector': {
    'when collecting': {
      'on a page with a relative url in the css': {
        'retrieves its url': function () {}
      },
      'on a page with an absolute url in the css': {
        'can retrieve its url': function () {}
      },
    },
  },
  'A \'self\' ResourceCollector': {
    'when collecting': {
      'retrieves the current webpage\'s url': function () {}
    }
  }
},

// Second batch
{
  'A ResourceCollector': {
    'when collecting': {
      'deduplicates': function () {},
      'collects relative urls': function () {},
      'collects absolute urls': function () {},
      'throws away foreign urls': function () {}
    }
  }
}];