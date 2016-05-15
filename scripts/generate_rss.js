import './util/setupModulePath'; // eslint-disable-line

import loadPosts from 'scripts/util/loadPosts';
import buildFeeds from 'scripts/util/buildFeeds';

const posts = loadPosts({
  limit: 20,
});

buildFeeds(posts);
