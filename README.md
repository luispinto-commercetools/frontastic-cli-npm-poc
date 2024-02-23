# npm-cli-poc

![license](https://img.shields.io/npm/l/npm-cli-poc)

A proof of concept Node.js package for wrapping frontastic-cli binaries, enabling their usage within a Node application seamlessly.

## Overview

This package provides a convenient way to incorporate frontastic-cli functionalities directly into your Node.js projects. By wrapping frontastic-cli binaries, developers can leverage the power of frontastic-cli within their Node applications without the need for additional setups or dependencies.

## Features

- Simplified integration of frontastic-cli functionalities into Node.js projects.
- Easy-to-use API for executing frontastic-cli commands programmatically.
- Seamless compatibility with existing Node.js workflows.
- Can be used as a global CLI tool for quick access to version information and basic functionalities.

## Installation

To install `npm-cli-poc`, you can either install it globally to use it as a CLI tool or locally to use it within your Node.js projects.

### Global Installation (CLI)

To install globally and use it as a CLI tool:

```bash
npm install -g npm-cli-poc
```

### Local Installation (Library)

To install locally and use it within your Node.js projects:

```bash
npm install npm-cli-poc
```

## Usage

### Global Usage (CLI)

As a global package, you can use `npm-cli-poc` from the command line to access version information and basic functionalities. Here are some examples:

```bash
# Get the package version
cli-npm-poc --version

# Display help information
cli-npm-poc --help

# Execute a specific command
cli-npm-poc some-command
```

### Local Usage (Library)

Once installed locally, you can import and use `npm-cli-poc` in your Node.js project. Here's a basic example of how to use it:

```javascript
const npmCliPoc = require('npm-cli-poc');

// Example usage
npmCliPoc.runBinary('--version');
```
