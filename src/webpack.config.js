const path = require('path');
const  HtmlWebpackPlugin  = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    devServer: {
        contentBase: './dist' 
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin()
    ],
    // stats: {
    //     children: false
    // },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    }
};