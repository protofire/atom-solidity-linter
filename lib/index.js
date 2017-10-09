'use babel';

import path from 'path';
import {readFileSync} from 'fs';
import {CompositeDisposable} from 'atom';

// Dependencies
let solhint;
let atomlinter;
let helpers;

// Internal variables
const idleCallbacks = new Set();


function loadDeps() {
    if(!helpers) {
        helpers = require('./helpers');
    }

    if(!solhint) {
        solhint = require('solhint/lib/index');
    }

    if(!atomlinter) {
        atomlinter = require('atom-linter');
    }
}


export function activate() {
    let callbackID;

    const installDeps = () => {
        idleCallbacks.delete(callbackID);

        if(!atom.inSpecMode()) {
            require('atom-package-deps').install('atom-solidity-linter');
        }
    };

    callbackID = window.requestIdleCallback(installDeps);
    idleCallbacks.add(callbackID);

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(
        atom.config.observe('atom-solidity-linter.solhintConfigFilename', (value) => {
            this.soliumConfigFilename = value;
        }),
        atom.config.observe('atom-solidity-linter.solhintIgnoreFilename', (value) => {
            this.soliumIgnoreFilename = value;
        })
    );

    //TODO: add debug message
    //this.subscriptions.add(
    //  atom.commands.add('atom-text-editor', {
    //    'linter-jshint:debug': async () => {
    //      loadDeps();
    //      const debugString = await helpers.generateDebugString();
    //      const notificationOptions = { detail: debugString, dismissable: true };
    //      atom.notifications.addInfo('linter-jshint:: Debugging information', notificationOptions);
    //    },
    //  }),
    //);
}


export function deactivate() {
    idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    idleCallbacks.clear();
    this.subscriptions.dispose();
}


export function provideLinter() {
    return {
        name: 'Solhint',
        scope: 'file',
        lintsOnChange: true,
        grammarScopes: ['source.solidity'],
        lint: async (textEditor) => {
            loadDeps();

            const results = [];
            const filepath = textEditor.getPath();
            const filedir = path.dirname(filepath);
            const configFile = await helpers.getConfigPath(filedir);

            let config;
            if(!configFile) {
                config = {rules: {}};
            } else {
                config = require(configFile); // TODO: potentially a slow point here
            }

            const text = textEditor.getText();
            const report = solhint.processStr(text, config);

            report.messages.forEach(err => {
                let message;
                let position = atomlinter.generateRange(textEditor, err.line - 1, err.column - 1);
                message = {
                    severity: err.severity === 2 && 'error' || 'warning',
                    excerpt: `${err.message} (${err.ruleId})`,
                    location: {
                        file: filepath,
                        position
                    }
                };
                results.push(message);
            });

            return results;
        }
    }
}