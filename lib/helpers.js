'use babel';

let atomlinter = require('atom-linter');


export async function getConfigPath (fileDir) {
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