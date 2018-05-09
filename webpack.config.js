

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
        new webpack.DefinePlugin({
            FIREBASE_APIKEY : JSON.stringify('AIzaSyCS1Uk49GLk-jPgpz_l0rgCUO7gg5JFBsA'), // JSON.stringify('AIzaSyAlity13cdD9lp9YGXwcBTxlcC6DRdWMMs'),
            FIREBASE_AUTHDOMAIN : JSON.stringify('pwangtest-eefde.firebaseapp.com'), // JSON.stringify('test-neargroup.firebaseapp.com'),
            FIREBASE_DATABASE_URL : JSON.stringify('https://pwangtest-eefde.firebaseio.com'),  //JSON.stringify('https://test-neargroup.firebaseio.com'),
            FIREBASE_PROJECT_ID : JSON.stringify('pwangtest-eefde'), //JSON.stringify('test-neargroup'),
            FIREBASE_MESSAGING_ID : JSON.stringify('590817841198'),  // JSON.stringify('485643019459'),
            FIREBASE_STORAGE_BUCKET : JSON.stringify('pwangtest-eefde.appspot.com'),  //JSON.stringify('test-neargroup.appspot.com'),
            // API: JSON.stringify('https://stark-chamber-45207.herokuapp.com/'), //JSON.stringify('http://localhost:8081/'),
            API: JSON.stringify('https://workly.neargroup.me/abc/'),
            LIVEAPI: JSON.stringify('https://wisp.neargroup.me/wisp/'),
            AVTAR: JSON.stringify('avtar.svg'),
            'process.env': {
                NODE_ENV: JSON.stringify('production')
            },


        })
      ]
};
