---
title: Hexo优化之为外部链接添加nofollow
---

原文说明如下： https://liuzhichao.com/2016/hexo-auto-nofollow.html

我们在写博客的时候不免会引用一些外部连接，如果我们不想给这些外部链接传递权重，我们可以给这些外部链接加上 rel=”nofollw” 属性。nofollow是一个HTML标签的属性值。它的出现为网站管理员提供了一种方式，即告诉搜索引擎”不要追踪此网页上的链接”或”不要追踪此特定链接”。
简单的说就是，如果A网页上有一个链接指向B网页，但A网页给这个链接加上了 rel=”nofollow” 标注，则搜索引擎不把A网页计算入B网页的反向链接。搜索引擎看到这个标签就可能减少或完全取消链接的投票权重。

## nofollow 的使用方法

nofollow 有两种使用方法，一种是在meta标签中使用：
```
<meta name="robots" content="nofollow"> 
<meta name="BaiduSpider" content="nofollow">
```
使用meta标签告诉所有搜索引擎或具体的搜索引擎不要追踪此网页上的链接，并且不给页面上的链接传递权重。但是这样也会导致我们自己网站的页面也不被追踪，除非你确实不想被搜索引擎收录，否则一定不要这样使用。

另一种是给链接加上nofollow 属性，如：
```
<a href="www.ooxx.com/1234.html" rel="nofollow"> 我是外部链接</a> 
<a href="www.ooxx.com/1234.html" rel="external nofollow"> 我是外部链接</a>
```
rel=”nofollow”是通用的格式，也就是告诉搜索引擎不要跟踪此链接；rel=”external nofollow”是更专业的写法，进一步告诉搜索引擎这是一个外部的链接，不要追踪它。

## hexo-autonofollow

所以我们使用第二种方式给外部链接添加上”external nofollow”即可。但和之前[修改图片标签实现CDN和懒加载](https://liuzhichao.com/2016/hexo-cdn-lazyload.html)一样，标准的Markdown语法也没有为链接添加属性的方法。如果每次都要手动的添加或是修改也是一件很麻烦的事，于是我开发一个插件，可以在生成html页面的时候自动为外部链接添加rel=”external nofollow”.

插件已经开源: https://github.com/liuzc/hexo-autonofollow

并上传到npm: https://www.npmjs.com/package/hexo-autonofollow

使用方式也很简单，直接在你Hexo博客目录安装即可：
```
npm install hexo-autonofollow --save
```
具体的说明请查看[Github上的说明](https://github.com/liuzc/hexo-autonofollow)。目前觉得还有一点不够完善的地方是现在是采用判断hostname而不是判断domain的方式。也就是说www.liuzhichao.com和blog.liuzhichao.com的hostname不同，但domain都是liuzhichao.com，显然我希望自己域名下的子站都应该不被判断成外部站。所以我添加了一个exclude字段，把你不需要添加rel=”external nofollow”的hostname列出即可。代码已经开源，如果大家有好的实现方式欢迎pull request.

## 个人修改

因为自己使用的是 yelee 主题，在解析 html 文件时，会报各种错，试了不同的 [hexo 过滤器](https://hexo.io/zh-cn/api/filter.html)，还是有问题，所以自己做了部分修改，主要是将原文件 hexo-autonofollow/lib/filter.js 中的部分函数直接移到了 hexo-autonofollow/index.js 中，并修改了内部方法，具体请参见 index.js 文件。
```
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
```