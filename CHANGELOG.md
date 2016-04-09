MASTER:

* By default, require 'opal' includes bundled opal in this package, you are discouraged from mixing this compiler with your own runtime
* File caching between runs
* Supports passing stubs in via global options
* Avoid absolute path in opal module names (e.g. `Opal.modules['/root/something']`)
* Make load path more explicit to behave more like Opal does (either load path is current directory and everything must be in there or the load path must be defined)
* Test pure JS require (using similar semantics to Opal)
* require_relative works properly
* require_tree will once opal issues are fixed
* Better test coverage
* Removal Babel compilation (can assume code running under Node has es6 covered)

# v1.0.0
* Upgrade to Opal 0.9.2 [#2](https://github.com/cj/opalrb-loader/issues/2).
* Opal compiler bundled is now minified.

# v0.0.3

* Fix source map bug

# v0.0.2

* Fix "stdlib/native" parsing issue

# v0.0.1

* Initial release
