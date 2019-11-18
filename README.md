# jupyterlab-notifier

notifications for jupyterlab


## Requirements

* JupyterLab >= 0.30.0 

## Install

```bash
jupyter labextension install jupyterlab-topbar-extension jupyterlab-notifier
```

## Contributing

### Install

Using npm
```bash
jupyter labextension install jupyterlab-topbar-extension
npm install
npm run build
jupyter labextension install .
```

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Move to jupyterlab-notifier directory

# Install jupyterlab-topbar-extension
jupyter labextension install jupyterlab-topbar-extension

# Install dependencies
jlpm
# Build Typescript source
jlpm build
# Link your development version of the extension with JupyterLab
jupyter labextension link .
# Rebuild Typescript source after making changes
jlpm build
# Rebuild JupyterLab after making any changes
jupyter lab build
```

You can watch the source directory and run JupyterLab in watch mode to watch for changes in the extension's source and automatically rebuild the extension and application.

```bash
# Watch the source directory in another terminal tab
jlpm watch
# Run jupyterlab in watch mode in one terminal tab
jupyter lab --watch
```

### Uninstall

```bash
jupyter labextension uninstall jupyterlab-notifier
```

