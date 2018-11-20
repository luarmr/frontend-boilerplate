/* eslint-disable global-require, one-var */
const express = require('express');
const path = require('path');
const isDev = require('isdev');
const compression = require('compression');

// Dev middleware
const addDevMiddlewares = (app, webpackConfig) => {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const compiler = webpack(webpackConfig);
  const middleware = webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    logLevel: 'silent',
  });
  const hotMiddleware = webpackHotMiddleware(compiler, {
    log: false,
  });

  app.use(middleware);
  app.use(hotMiddleware);

  // Since webpackDevMiddleware uses memory-fs internally to store build
  // artifacts, we use it instead
  const fs = middleware.fileSystem;

  app.get('*', (req, res) => {
    fs.readFile(path.join(compiler.outputPath, 'index.html'), (err, file) => {
      if (err) {
        res.sendStatus(404);
      } else {
        res.send(file.toString());
      }
    });
  });
};

// Production middlewares
const addProdMiddlewares = (app, options) => {
  const publicPath = options.publicPath || '/';
  const outputPath = options.outputPath || path.join(__dirname, '../../build');

  // compression middleware compresses your server responses which makes them
  // smaller (applies also to assets). You can read more about that technique
  // and other good practices on official Express.js docs http://mxs.is/googmy
  app.use(compression());
  app.use(publicPath, express.static(outputPath));

  app.get('*', (req, res) => res.sendFile(path.resolve(outputPath, 'index.html')));
};


/**
 * Front-end middleware
 */
module.exports = (app, options) => {
  if (isDev) {
    const webpackConfig = require('../../config/webpack.dev');
    addDevMiddlewares(app, webpackConfig);
  } else {
    addProdMiddlewares(app, options);
  }

  return app;
};
