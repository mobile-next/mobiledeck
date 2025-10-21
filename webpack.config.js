//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
	target: 'node', // vscode extensions run in a node.js context

	entry: './src/extension.ts', // the entry point of this extension
	output: {
		// the bundle is stored in the 'dist' folder
		path: path.resolve(__dirname, 'dist'),
		filename: 'extension.js',
		libraryTarget: 'commonjs2',
		devtoolModuleFilenameTemplate: '../[resource-path]'
	},
	devtool: 'source-map',
	externals: {
		vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded
	},
	resolve: {
		// support reading typescript and javascript files
		mainFields: ['main', 'module'],
		extensions: ['.ts', '.js']
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				exclude: /node_modules/,
				use: [
					{
						loader: 'ts-loader'
					}
				]
			}
		]
	},
	optimization: {
		minimize: false // keep readable for debugging
	}
};
module.exports = config;
