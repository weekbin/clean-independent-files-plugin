<div align="center">
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" src="https://webpack.js.org/assets/icon-square-big.svg">
  </a>
</div>

[![NPM version][npm-image]][npm-url]
[![NPM language][language-image]][language-url]
[![NPM license][license-image]][license-url]

[npm-image]: https://img.shields.io/npm/v/@weekbin/clean-independent-files-plugin.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@weekbin/clean-independent-files-plugin
[language-image]: https://img.shields.io/github/languages/top/weekbin/clean-independent-files-plugin.svg
[language-url]: https://github.com/weekbin/clean-independent-files-plugin
[license-image]: https://img.shields.io/github/license/weekbin/clean-independent-files-plugin.svg
[license-url]: https://github.com/weekbin/clean-independent-files-plugin

# clean-independent-files-plugin

A tool to clean independent files. Useful when refactoring code.

## Getting started

To begin, you'll need to install `@weekbin/clean-independent-files-plugin`:

```
npm install @weekbin/clean-independent-files-plugin --save-dev
```

or

```
yarn add -D @weekbin/clean-independent-files-plugin
```

Then add the plugin to your `webpack` config. For example:

**webpack.config.js**

```js
const { WebpackCleanUndependentFilesPlugin } = require("@weekbin/clean-independent-files-plugin");

module.exports = {
  plugins: [
    new WebpackCleanUndependentFilesPlugin({
      autoDelete: true
    })
  ]
};
```

And run `webpack` via your preferred method.

## Options

- **[`entry`](#entry)**
- **[`autoDelete`](#autoDelete)**
- **[`outputLogs`](#outputLogs)**
- **[`outputLogsPath`](#outputLogsPath)**
- **[`exclude`](#exclude)**
- **[`externalDependencies`](#externalDependencies)**
- **[`callback`](#callback)**
- **[`useColor`](#useColor)**
- **[`debug`](#debug)**

### `entry`

Type: `Array<string>`

Description: entry of the source code dir. Support muti-entry.

Default: `['./src']`

### `autoDelete`

Type: `boolean`

Description: auto remove independent files when it was set to `true`. For security reasons, default is `false`.

Default: `false`

### `outputLogs`

Type: `boolean`

Description: if output logs of inpendent files list.

Default: `true`

### `outputLogsPath`

Type: `string`

Description: the path of output logs.

Default: `./wcufp.json`

### `exclude`

Type: `Array<string | RegExp>`

Description: Even if the file has no dependencies, it will not be cleaned up.

Default: `[/typings/, /.+\.d\.ts/]`

### `externalDependencies`

Type: `Array<string | RegExp>`

Description: external dependencies. In production, modules will be imported by script. Thus external should be set.

Default: `[]`

### `callback`

Type: `function(this: WebpackCleanUndependentFilesPlugin, files2Delete: string[]): void | null`

Description: custom callback before cleanFiles. Throw Errors internal will interrupted the build.

Default: `null`

### `useColor`

Type: `boolean`

Description: if use color of console logs.

Default: `true`

### `debug`

Type: `boolean`

Description: open debug mode will show more info in console logs.

Default: `false`

## Examples

```js
const { WebpackCleanUndependentFilesPlugin } = require("@weekbin/clean-independent-files-plugin");

module.exports = {
  plugins: [
    new WebpackCleanUndependentFilesPlugin({
      autoDelete: true,
      exclude: [/[T|t]yping/, /[U|u]til/, /.+\.d\.ts/, 'setProxy.js'],
      externalDependencies: [/myOwnCDNFiles/],
      callback(files){
          console.log(files)
      }
    })
  ]
};
```

You can also use defaultConfig from package
```js
const defaultConfig = {
  entry: ['./src'],
  exclude: [/[t|T]yping/, /.+\.d\.ts/, /[u|U]til/, /[p|P]ublic/]
}
```

```js
const { defaultConfig } = require("@weekbin/clean-independent-files-plugin");

module.exports = {
  plugins: [
    new WebpackCleanUndependentFilesPlugin(defaultConfig)
  ]
};
```