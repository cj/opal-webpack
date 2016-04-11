# opalrb-loader
> Opal is a compiler for writing JavaScript in Ruby.

This package allows transpiling Ruby files using [Opal](http://opalrb.org) and [webpack](https://github.com/webpack/webpack).

Check out [this blog post](https://medium.com/@zetachang/from-sprockets-to-webpack-5f3d1afbd1b0) if you are interested in the project background.

[![npm version](https://img.shields.io/npm/v/opal-webpack.svg?style=flat-square)](https://www.npmjs.com/package/opal-webpack)
[![npm downloads](https://img.shields.io/npm/dt/opal-webpack.svg?style=flat-square)](https://www.npmjs.com/package/opal-webpack)
[![Quality](http://img.shields.io/codeclimate/github/cj/opal-webpack.svg?style=flat-square)](https://codeclimate.com/github/cj/opal-webpack)
[![Build Status](http://img.shields.io/travis/cj/opal-webpack/master.svg?style=flat)](http://travis-ci.org/cj/opal-webpack)

## Installation

```bash
npm install opal-webpack --save-dev
```
## Requirements

* Node/Webpack obviously
* Opal 0.9.2 or 0.10 (see below for information on this)

## Usage

[Documentation: Using loaders](http://webpack.github.io/docs/using-loaders.html)

```javascript
// webpack.config.js
module: {
  loaders: [
    {
      test: /\.rb?$/,
      loader: 'opalrb-loader'
    }
  ]
}
```

This is all you need to get started with a basic setup. No installation of Opal or Ruby is required. See below for more information.

### Options

See `Opal::Compiler` [options](https://github.com/opal/opal/blob/master/lib/opal/compiler.rb) for possible options.

```javascript
// webpack.config.js
module: {
  loaders: [
    {
      test: /\.rb?$/,
      loader: 'opalrb-loader',
      query: {
        requirable: false,
        freezing: false,
      }
    }
  ]
}
```

You can also supply global options that apply to any Opal loaded file, not just a single test:

```javascript
// webpack.config.js
module: {
  loaders: [
    {
      test: /\.rb?$/,
      loader: 'opalrb-loader',
    }
  ],
  opal: {
    requirable: false,
    freezing: false,
  }
}
```

### Requires

With your Ruby/Opal `require` statements, you can either use the Sprockets/Ruby/Opal convention or you can use the node convention of `require './some_file'`, which will be relative to path of the file doing the require. If you do this though, you **must** consistently require the file that way. A require to 'some_file' will include the module a second time.

### Stubs

To tell the Opal compiler to stub out certain dependencies, do this

```js
{
  module: {
    loaders: [
      {
        test: /\.rb?$/,
        loader: 'opalrb-loader'
      }
    ]
  },
  opal: {
    stubs: ['dependency']
  }
}
```

### Caching

Just like the Babel loader, you can cache compilation results on the filesystem to improve load times
between invocations of webpack.

```js
{
  module: {
    loaders: [
      {
        test: /\.rb?$/,
        loader: 'opalrb-loader'
      }
    ]
  },
  opal: {
    cacheDirectory: './tmp/cache'
  }
}
```

### Opal version

By default, When you `require 'opal'` in any asset, this loader will use the version of Opal bundled with this tool. This is meant to get you started but not meant to cover all use cases (for example, opal/mini, opal/full are not supported).

Here are the options you have for choosing which compiler/runtime you wish to use:

1. Default (Runtime and compiler provided with this package): Opal is included in the webpack bundle as soon as you do a `require 'opal'` in your code.
2. Opal compiler provided by `Gemfile`: Opal runtime files are included in your bundle on a granular basis when you do `require 'opal'`.
3. Opal loaded externally outside of webpack.
4. A compiler+runtime you provide the location to: Opal is also included in the bundle the same way as #1.

Here are some details about options 2-4:

#### Opal compiler provided by `Gemfile`

**When to use it:** You use Opal with a server side Ruby application and want to have granular includes (e.g. `opal/mini`) of Opal when your assets are served to browsers (size).

**How:** set the `OPAL_USE_BUNDLER` environment variable to true.

#### Opal loaded externally outside of webpack

**When to use it:** You have a unit test setup like opal-rspec with some big assets that are not being tested/changing with your application and want a quick feedback cycle.

**How:** You can mix and match this option with the others. One common way would be to:

1. Set the `OPAL_USE_BUNDLER` environment variable to true to load the compiler that way.
2. Build an opal distribution and include that in the browser/testing tool separately from Webpack.
3. Set your webpack config as follows:
```js
{
  module: {
    loaders: [
      {
        test: /\.rb?$/,
        loader: 'opalrb-loader'
      }
    ]
  },
  opal: {
    externalOpal: true
  }
}
```

Then you'll have assets compiled with the version of Opal that you have in your `Gemfile` and webpack can focus on leaner assets that don't change. `externalOpal` basically is equivalent to stubbing `['opal', 'opal/mini', 'opal/full']`. That way any requires in your code will not cause the full Opal library to be included in your bundle.

#### A compiler+runtime you provide the location to

**When to use it:** You like the default setup of this tool but want to hack around and use a different compiler. Not a common use case.

**How:** set the `OPAL_COMPILER_PATH` environment variable to the compiled asset. You'll need to ensure it can do bootstrap compilation (see the `package.json` file for how we build ours).

#### OPAL_LOAD_PATH

By passing `OPAL_LOAD_PATH` environment variable to webpack, the loader will correctly resolve file other than relative path.

See the example [Rakefile](https://github.com/cj/opal-webpack/blob/master/examples/complex/Rakefile) for how to integrate using other Opal gems.

## Known issues/limitations
* This loader uses a bootstrapped Opal compiler. This means that a compiled version of the compiler is compiling your code. There may some issues (like [this one](https://github.com/opal/opal/pull/1422)) that are still being addressed in Opal that affect the compiler.
* First time compiling is relatively slow compared to Ruby one, use `--watch` option for webpack to speed up dev iteration or use the cache option which will cache compiled assets to the filesystem.
* erb is not supported (which should be implemented as separate loader).

## Examples

It's under [Examples](https://github.com/cj/opal-webpack/tree/master/examples) folder.

* simple: Basic setup without further dependency.
* complex: Compile opal/corelib and other gems.

## Development

* `npm install`
* `npm run build_compiler` to build compiler
* `npm start` to compile & watch `index.js`

## Contact

[CJ Lazell](http://github.com/cj)
[@ceej](https://twitter.com/cj)
Brady Wied

## License

Available under the MIT license. See the LICENSE file for more info.
