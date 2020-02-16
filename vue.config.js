module.exports = {
  publicPath: process.env.NODE_ENV === 'production' 
    ? '//mikatalk.github.io/penguin-water-slide/'
    : `/`,
  devServer: {
    hot: false,
    liveReload: true
  }
}
