'use babel';

import {readFileSync} from 'fs';
import {CompositeDisposable} from 'atom';


let solhint;
let atomlinter;
let helpers;

const idleCallbacks = new Set();


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
}


export function deactivate() {
    idleCallbacks.forEach(callbackID => window.cancelIdleCallback(callbackID));
    idleCallbacks.clear();
}


export function provideLinter() {
    return {
        name: 'Solhint',
        scope: 'file',
        lintsOnChange: true,
        grammarScopes: ['source.solidity'],
        lint: async (textEditor) => {
            loadDeps();

            const filepath = textEditor.getPath();

            return solhint
                .processStr(textEditor.getText(), await helpers.loadConfig(filepath))
                .messages
                .map(makeErrorMessage(atomlinter, textEditor, filepath));
        }
    }
}


function loadDeps() {
    if (!helpers) {
        helpers = require('./helpers');
    }

    if (!solhint) {
        solhint = require('solhint/lib/index');
    }

    if (!atomlinter) {
        atomlinter = require('atom-linter');
    }
}


function makeErrorMessage(atomLinter, textEditor, filepath) {
    return (err) => ({
        severity: err.severity === 2 && 'error' || 'warning',
        excerpt: `${err.message} (${err.ruleId})`,
        location: {
            file: filepath,
            position: generateRange(atomLinter, textEditor, err)
        }
    });
}


function generateRange(atomLinter, textEditor, err) {
    return atomLinter.generateRange(textEditor, err.line - 1, err.column - 1);
}
