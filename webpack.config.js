module.exports =  {
    entry: "./src/picViewer.js",
    output: {
        path: "./docs",
        filename: "index.js",
        library : 'sfPicviewer'
    },
	//devtool: "source-map",
    resolve:{
        extensions: ['', '.js', '.vue']
    },
    module: {
        loaders: [
            {test: /.html/, loader: 'html'},
			{test: /.scss$/,  loader: "style!css!sass" }
        ]
    }
}