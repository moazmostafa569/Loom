const axios = require('axios');
axios.get('https://route-posts.routemisr.com/posts')
  .then(res => {
    console.log(JSON.stringify(res.data.posts && res.data.posts[0], null, 2));
  })
  .catch(err => {
    console.error(err.toString());
    process.exit(1);
  });
