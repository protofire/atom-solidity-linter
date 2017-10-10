'use babel';

const path = require('path');
const atomlinter = require('atom-linter');


async function getConfigPath (fileDir) {
    const validNames = ['.solhint.json'];

    const configFile = await atomlinter.findCachedAsync(fileDir, validNames);

    if (!configFile) {  //check the project directory for .solhint.json
        const projDir = atom.project.relativizePath(fileDir)[0];
        const configFile = await atomlinter.findCachedAsync(projDir, validNames);

        if(!configFile) {
            return null;
        }
    }

    return configFile;
}


const configMemo = {};

function requireConfig(filePath) {
    let curConfig = configMemo[filePath];

    if (!curConfig) {
        curConfig = configMemo[filePath] = require(filePath);
    }

    return curConfig;
}


export async function loadConfig(filepath) {
    const filedir = path.dirname(filepath);
    const configFile = await getConfigPath(filedir);

    let config;
    if (!configFile) {
        config = {rules: {}};
    } else {
        config = require(configFile);
    }

    return config;
}