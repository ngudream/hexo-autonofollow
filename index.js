
// if (hexo.config.nofollow && hexo.config.nofollow.enable) {
//     hexo.extend.filter.register('after_render:html', require('./lib/filter'));
// }

'use strict';
var cheerio = require('cheerio');
var URL = require('url');

// http://stackoverflow.com/questions/14480345/how-to-get-the-nth-occurrence-in-a-string
function getPosition(str, m, i) {
  return str.split(m, i).join(m).length;
}

function isExternal(url,config) {
    var exclude = config.nofollow.exclude;
    var myhost = URL.parse(config.url).hostname;
    var hostname = URL.parse(url).hostname;
    if (!hostname) {
        return false;
    }

    if (exclude && !Array.isArray(exclude)) {
        exclude = [exclude];
    }

    if (exclude && exclude.length) {
        for (var i = 0, len = exclude.length; i < len; i++) {
            if (hostname == exclude[i]) return false;
        }
    }

    if (hostname != myhost) {
        return true;
    }
    return false;
}

hexo.extend.filter.register('after_post_render', function(data){
  var config = hexo.config;
  if(hexo.config.nofollow && hexo.config.nofollow.enable){
    var link = data.permalink;
  	var beginPos = getPosition(link, '/', 3) + 1;
  	// In hexo 3.1.1, the permalink of "about" page is like ".../about/index.html".
  	var endPos = link.lastIndexOf('/') + 1;
      link = link.substring(beginPos, endPos);
      var toprocess = ['excerpt', 'more', 'content'];
      for(var i = 0; i < toprocess.length; i++){
        var key = toprocess[i];

        var $ = cheerio.load(data[key], {
          ignoreWhitespace: false,
          xmlMode: false,
          lowerCaseTags: false
        });

        //加nofollow，防止爬虫外链
        $('a').each(function(index, element) {
            var href = $(element).attr('href');
            if (href && isExternal(href,config)) {
                $(element).attr({
                    rel: 'external nofollow noopener noreferrer',
                    target: '_blank'
                });
            }
        });
        data[key] = $.html();
      }
  }
});
