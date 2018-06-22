
/*var CompressionPlugin = require('compression-webpack-plugin');

new CompressionPlugin({
          asset: "[path].gz[query]",
          algorithm: "gzip",
          test: /\.js$|\.css$|\.html$/,
          threshold: 10240,
          minRatio: 0.8
        })

        */

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: './src/index.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [/node_modules/],
                use: [
                    {
                        loader: 'babel-loader',
                        options: { presets: ['es2015', 'react'] }
                    }
                ]
            },
            {
                test: /(\.scss|\.css)$/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            localIdentName: '[name]_[local]_[hash:base64:5]'
                        }
                    },
                    {
                        loader: 'sass-loader',
                    }
                ]
            }
        ]
    },
    plugins: [
        new UglifyJsPlugin({
          uglifyOptions: {
            compress : {
              dead_code: true,
              // drop_console: true,
              unused: true
            }
          }
        }),
        new webpack.DefinePlugin({
            FIREBASE_APIKEY : JSON.stringify('AIzaSyCS1Uk49GLk-jPgpz_l0rgCUO7gg5JFBsA'),
            FIREBASE_AUTHDOMAIN : JSON.stringify('pwangtest-eefde.firebaseapp.com'),
            FIREBASE_DATABASE_URL : JSON.stringify('https://pwangtest-eefde.firebaseio.com'),
            FIREBASE_PROJECT_ID : JSON.stringify('pwangtest-eefde'),
            FIREBASE_MESSAGING_ID : JSON.stringify('590817841198'),
            FIREBASE_STORAGE_BUCKET : JSON.stringify('pwangtest-eefde.appspot.com'),
            API: JSON.stringify('https://wisppwa.neargroup.me/wisp/'),
            LIVEAPI: JSON.stringify('https://wisp.neargroup.me/wisp/'),
            AVTAR: JSON.stringify('avtar.svg'),
            ISDEV: true,
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            }

        })
      ]
};
