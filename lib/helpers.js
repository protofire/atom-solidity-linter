'use babel';

const path = require('path');
const {readFile} = require('fs');
const atomlinter = require('atom-linter');


async function getConfigPath (fileDir) {
    const validNames = ['.solhint.json'];

    const configFile = await atomlinter.findCachedAsync(fileDir, validNames);

    if (!configFile) {  //check the project directory for .solhint.json
        const projDir = atom.project.relativizePath(fileDir)[0];
        const configFile = await atomlinter.findCachedAsync(projDir, validNames);

        if (!configFile) {
            return null;
        }
    }

    return configFile;
}


function readJson (file) {
    return new Promise(function (resolve, reject) {
        readFile(file, 'utf-8', (err, data) =>
            (!err) && resolve(parseJson(data)) || reject(err)
        );
    });
}


function parseJson(json) {
    try {
        return JSON.parse(json);
    } catch (e) {
        return { rules: {} };
    }
}


export async function loadConfig(filepath) {
    const filedir = path.dirname(filepath);
    const configFile = await getConfigPath(filedir);

    return (configFile) ? await readJson(configFile) : { rules: {} };
}
