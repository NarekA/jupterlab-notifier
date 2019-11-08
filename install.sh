#!/usr/bin/env bash

    jupyter labextension install jupyterlab-topbar-extension
npm install
npm run build
jupyter labextension install .
