---
rank: 5
title: Practical Gatsby.js
date: 2016-04-21T22:48:55.316Z
layout: post
path: /practical-gatsby-js/
next: /contract-react-training/
previous: /static-site-generation-with-gatsby-js/
tags:
  - reactjs
  - gatsbyjs
  - javascript
  - open-source
  - software
---

_[Check out my [introduction to Gatsby.js post and screencast](/static-site-generation-with-gatsby-js/) if you're not already familiar with it! Also, you can get into the deep details now that [this blog is open source!](/this-blog-is-now-open-source/)]_

So you want to use [React.js](https://facebook.github.io/react/) to build your site, and you want to deploy just static files? [Gatsby.js](https://github.com/gatsbyjs/gatsby) is a great choice! But [it's dangerous to go alone](https://en.wikipedia.org/wiki/It%27s_dangerous_to_go_alone!) - take these hard-won tips!

<div class='fold'></div>

## Directory structure

You probably started with the [Gatsby Blog Starter Kit](https://github.com/gatsbyjs/gatsby-starter-blog). It puts each entry in its own directory, but that's not at all required. It would be equivalent to name each markdown file with the path you'd like.

But really, you probably don't want your project directory structure dictated by the URLs you'd like to surface to the web. That's where the `path` [_frontmatter_](https://jekyllrb.com/docs/frontmatter/) property comes in. You can give a file whatever URL you want! The only real requirement is that it's a file Gatsby understands under the `pages` directory.

## Upgrades

Gatsby is still evolving, so upgrading between versions can be pretty rough. `0.7` to `0.8` was a good amount of work because [React-Router](https://github.com/reactjs/react-router) updated beneath it. `0.8` to `0.9` was far easier. Happily, the [release notes](https://github.com/gatsbyjs/gatsby/releases) are getting better with every release.

## Hot reload

Hot reload is really great, hugely useful when iterating on your site structure, style, or post contents. Be aware, however, that you will need to restart your `gatsby develop` command whenever you add, rename, or remove files Gatsby cares about. [Webpack](https://webpack.github.io/)'s hot reload does not pick up these kinds of filesystem changes.

## Navigate hook

Gatsby generates static HTML and CSS for your site, as you might expect. But it also generates a complete [Single Page App (SPA)](https://en.wikipedia.org/wiki/Single-page_application). Your users will download your entire site, and then subsequent clicks through the site no longer hit your server since they are generated by Javascript on the fly.

Your server will count just one page request, so it's up to your client-side analytics tool to tell you how many visitors are hitting your pages. Some site usage trackers aren't History API-aware, and won't capture additional page views, even if the browser location box is changing. Sign up for route change notifications in [`gatsby-browser.js`](https://github.com/gatsbyjs/gatsby#structure-of-a-gatsby-site) and you can help your tracker out.

## Caching

The Gatsby Blog Starter Kit [doesn't support good caching practices by default](https://github.com/gatsbyjs/gatsby-starter-blog/blob/dc2746a93f8a553985366a0c00c137e3a381b8d5/html.js#L35). You can fix that by adding a cache buster to your HTML React component (`html.js` in the root directory). Then you can tell your host that `bundle.js` or `style.css` should be cached by browsers for a long time.

```javascript
// outside the HTML component
const now = new Date();
const buster = now.getTime();

// inside its render() method
<script src={`/bundle.js?t=${buster}`}/>
```

## HTML Previews

You might have noticed that my blog's [front page](/) has a couple entries at the top with full HTML previews, then a couple more with text previews. And the Blog Starter Kit just has a list of links for its front page. The starter kit does include a `TextPreview` React component for the 'Read Next' link at the bottom of posts, but I wanted a bit more.

The big question for an `HTMLPreview` React component is figuring out what to show. I didn't want to subdivide my post HTML algorithmically, so I inserted a marker into all of my posts to tell me where the 'fold' is:

```html
<div class="fold"></div>
```

Once you have the subset of HTML you'd like to show as the preview, you'll probably discover that you want a 'Read More' link shown as well. I have a little function that inserts it at the end of the last text block. This ensures that my link is visually connected with the post HTML, and not separated by a blank line.

## Local links

By default, links to other pages in your site from markdown-generated HTML will cause a full refresh of the page, defeating the purpose of a SPA. You can fix that with the [`catch-links`](https://github.com/substack/catch-links) node module. Try something like this in `wrappers/md.js`:

```javascript
import catchLinks from 'catch-links';

// inside MarkdownWrapper component
contextTypes: {
  router: React.PropTypes.object.isRequired
},

componentDidMount: function() {
  const _this = this;
  catchLinks(this.refs.markdown, function(href) {
    _this.context.router.push(href);
  });
},

render: function() {
  const htmlFromMarkdown = this.props.route.data.body;
  // ...
  <div
    ref="markdown"
    dangerouslySetInnerHTML={{__html: htmlFromMarkdown}}
  />
  // ...
}
```

## Meta tags

For the [best formatting in your shares to social media](https://moz.com/blog/meta-data-templates-123), and the [best treatment by search engines](https://support.google.com/webmasters/answer/79812?hl=en), you'll want to add some structured data to your page (usually `meta` tags). To do that, you'll need page-specific details in your HTML React component. You can get it in `render()` via [React-Router](https://github.com/reactjs/react-router) information on `props`:

  * `location` - its `pathname` key will give you the current base URL, with other parts of the URL available too.
  * `routes` - an array of all matched routes. The last one will be the target page, and its `data` key will include all _frontmatter_ from the top of the file as well as `body`, the final HTML generated from the target file.

Just remember that you won't get these in `develop` mode, only `build`.

## Anchor links

Say you'd like enable links into a specific section of your posts ([like this](/static-site-generation-with-gatsby-js/#getting-started)). First, there's a great plugin for [`markdown-it`](https://github.com/markdown-it/markdown-it) to generate an `id` for each header based on the slug of its text: [`markdown-it-anchor`](https://www.npmjs.com/package/markdown-it-anchor).

Sadly, without Gatsby's [planned plugin system (slide 25)](http://www.slideshare.net/kylemathews/presentation-on-gatsby-to-sf-static-web-tech-meetup), I need to maintain my own local fork to use `markdown-it-anchor` to change how markdown is generated. The good news is that it's really quite painless with [npm scripts](https://docs.npmjs.com/misc/scripts) and an [`npm link`](https://docs.npmjs.com/cli/link) command on both sides.

However, the world of scrolling in SPAs is pretty nasty. Browsers have some interesting built-in scroll behavior around anchor links (regarding back/forward navigations and delayed asset loading), and today a SPA needs to try to replicate all that. I've tried this code in `wrappers/md.js`, but I'm not really satisfied with it.

```javascript
// inside MarkdownWrapper component
scroll: function() {
  const hash = window.location.hash;
  if (hash) {
    const id = hash.replace('#','');
    const element = document.getElementById(id);
    if (element && element.scrollIntoView) {
      element.scrollIntoView();
    }
  }
},

componentDidMount: function() {
  setTimeout(this.scroll, 0);
},

componentWillReceiveProps: function() {
  setTimeout(this.scroll, 0);
},
```

I also tried looking at the [action type](https://github.com/reactjs/react-router/blob/70c23b4fb9604deebe0d441e1d42379a8b82798f/docs/Glossary.md#action) provided by [`React-Router`](https://github.com/reactjs/react-router), but that didn't seem to differentiate adequately between the various scenarios (initial load, in-page link, back, forward, reload). I'll dig into this again if I decide to use Gatsby with the SPA turned on.

## Don't want the Single-Page App?

I [don't use Gatsby's generated `bundle.js` for this blog](/static-site-generation-with-gatsby-js/#why-single-page-web-app), because it's a pretty big initial download. If you choose choose to do the same, you'll need to include `bundle.js` in `develop` mode because there's no server rendering, but not in `build` mode. And you won't want `styles.css` in `develop` mode, but you will need it in `build` mode because Webpack won't be there to inject the styles.

The key is to know which mode you're in. This is how I do it in my HTML React component:

```javascript
// inside HTML component render() method
const productionBuild = Boolean(this.props.body);
```

## Processing markdown directly

I've found a few reasons to parse my markdown files outside of the Gatsby infrastructure:

* I have a tool that connects to my analytics system to get the latest stats, then injects a `rank` property into the _frontmatter_ of my markdown files. I sort on that to generate my [popular](/popular/) page.
* I wrote a little script to generate [Atom](http://blog.scottnonnenberg.com/atom.xml)/[RSS](/rss.xml) feed XML files. The excellent [`feed`](https://github.com/jpmonette/feed) node module made it pretty easy.
* My [tags](/tags/) page is built with _frontmatter_ data from all my posts. My tool generates a very basic javascript file for each tag into the `pages/tags` directory of my project. This is because [Gatsby doesn't yet support dynamic routing](https://github.com/gatsbyjs/gatsby/issues/33).

So, here's my code to get all posts ready for further processing. Note that I use a simple `readdirSync()` because all my posts are in that single directory for now. You could easily switch this to using [`glob`](https://github.com/isaacs/node-glob).

```javascript
import fs from 'fs';
import path from 'path';

import _ from 'lodash';
import frontMatter from 'front-matter';
import markdownIt from 'markdown-it';

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true
});

export default function loadPosts() {
  const postsPath = path.join(__dirname, '../pages/posts');
  const postFiles = fs.readdirSync(postsPath);

  const posts = _.map(postFiles, function(file) {
    const filePath = path.join(postsPath, file);
    const contents = fs.readFileSync(filePath).toString();
    const metadata = frontMatter(contents);

    return {
      path: filePath,
      contents: contents,
      body: md.render(metadata.body),
      data: metadata.attributes
    };
  });
}

```

## Go forth and create!

I've really enjoyed using and contributing to Gatsby. This blog is generated with it. All the code samples were copied from within this same git repository. Meta.

I look forward to seeing what great sites you make with it!
