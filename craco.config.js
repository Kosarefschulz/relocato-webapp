module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Optimize for production builds
      if (process.env.NODE_ENV === 'production') {
        // Disable source maps completely
        webpackConfig.devtool = false;
        
        // Optimize split chunks
        webpackConfig.optimization = {
          ...webpackConfig.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              default: false,
              vendors: false,
              vendor: {
                name: 'vendor',
                chunks: 'all',
                test: /node_modules/,
                priority: 20
              },
              common: {
                name: 'common',
                minChunks: 2,
                chunks: 'all',
                priority: 10,
                reuseExistingChunk: true,
                enforce: true
              }
            }
          }
        };

        // Limit parallel builds to reduce memory usage
        webpackConfig.parallelism = 2;
      }

      // Add memory limit for TypeScript checker
      const ForkTsCheckerWebpackPlugin = webpackConfig.plugins.find(
        plugin => plugin.constructor.name === 'ForkTsCheckerWebpackPlugin'
      );
      
      if (ForkTsCheckerWebpackPlugin) {
        ForkTsCheckerWebpackPlugin.options.typescript = {
          ...ForkTsCheckerWebpackPlugin.options.typescript,
          memoryLimit: 4096
        };
      }

      return webpackConfig;
    }
  }
};