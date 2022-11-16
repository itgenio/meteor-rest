# REST for Meteor [![Build Status](https://travis-ci.org/itgenio/meteor-rest.svg)](https://travis-ci.org/itgenio/meteor-rest)

**Up-to-date fork of stubailo/meteor-rest**

A set of packages that makes it easy to make your Meteor app's data accessible over HTTP. Easily integrate your Meteor backend into a native mobile app or query your data from your Rails or PHP app.

## Packages

- [itgenio:json-routes](https://github.com/itgenio/meteor-rest/tree/master/packages/json-routes) - the simplest way to define a server-side route in your Meteor app, with no external dependencies.
- [itgenio:rest-json-error-handler](https://github.com/itgenio/meteor-rest/blob/master/packages/rest-json-error-handler/README.md) - middleware for handling standard Meteor.Error errors
- [itgenio:rest](https://github.com/itgenio/meteor-rest/blob/master/packages/rest/README.md) - just add the package, and all of your Meteor methods and publications will become accessible over HTTP.
- [itgenio:rest-accounts-password](https://github.com/itgenio/meteor-rest/blob/master/packages/rest-accounts-password/README.md) - add this package to enable password login over HTTP.
- [itgenio:authenticate-user-by-token](https://github.com/itgenio/meteor-rest/blob/master/packages/authenticate-user-by-token/README.md) - authenticate user via auth token
- [itgenio:rest-bearer-token-parser](https://github.com/itgenio/meteor-rest/blob/master/packages/rest-bearer-token-parser/README.md) - parse standard bearer token via request headers, query params, or body
- [itgenio:rest-method-mixin](https://github.com/itgenio/meteor-rest/blob/master/packages/rest-method-mixin/README.md) - add REST options to methods defined using [ValidatedMethod](https://github.com/meteor/validated-method)
