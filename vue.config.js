module.exports = {
  publicPath: process.env.NODE_ENV === 'production' 
    // ? '/article-assets/create-a-liquidfun-box2d-via-web-assembly-waterslide-with-three-js/dist/'
    ? '//mikatalk.github.io/penguin-water-slide/'
    : `/`,
  devServer: {
    hot: false,
    liveReload: true
  }
}
