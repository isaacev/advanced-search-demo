export default {
  current_user_id: 1,

  users: [{
    id           : 1,
    display_name : 'Harry Potter',
    login_name   : 'hpotter',
    role         : 'editor',
  }, {
    id           : 2,
    display_name : 'Ron Weasley',
    login_name   : 'rweasley',
    role         : 'editor',
  }, {
    id           : 3,
    display_name : 'Hermione Granger',
    login_name   : 'hgranger',
    role         : 'editor',
  }, {
    id           : 4,
    display_name : 'Albus Dumbledore',
    login_name   : 'dumbledore',
    role         : 'admin',
  }],

  posts: [{
    id         : 1,
    author     : 1,
    title      : 'Post Title 1',
    slug       : 'post-title-1',
    date       : '2017-10-23T06:25:50',
    status     : 'complete',
    categories : [ 1, 2 ],
  }, {
    id         : 2,
    author     : 3,
    title      : 'Post Title 2',
    slug       : 'post-title-2',
    date       : '2018-02-12T09:03:34',
    status     : 'complete',
    categories : [ 1, 2 ],
  }, {
    id         : 3,
    author     : 1,
    title      : 'Post Title 3',
    slug       : 'post-title-3',
    date       : '2018-02-12T09:03:34',
    status     : 'in-progress',
    categories : [ 3, 4 ],
  }, {
    id         : 4,
    author     : 2,
    title      : 'Post Title 4',
    slug       : 'post-title-4',
    date       : '2018-02-12T09:03:34',
    status     : 'in-progress',
    categories : [ 3, 4 ],
  }, {
    id         : 5,
    author     : 3,
    title      : 'Post Title 5',
    slug       : 'post-title-5',
    date       : '2018-02-12T09:03:34',
    status     : 'submission',
    categories : [],
  }, {
    id         : 6,
    author     : 3,
    title      : 'Post Title 6',
    slug       : 'post-title-6',
    date       : '2018-02-12T09:03:34',
    status     : 'submission',
    categories : [],
  }],

  categories: [{
    id   : 1,
    name : '2017',
    slug : 'year-2017',
  }, {
    id   : 2,
    name : 'Fall 2017',
    slug : 'fall-2017',
  }, {
    id   : 3,
    name : '2018',
    slug : 'year-2018',
  }, {
    id   : 4,
    name : 'Spring 2018',
    slug : 'spring-2018',
  }]
}
