import execa from 'execa';
import globby from 'globby';
import path from 'path';
import fs from 'fs';
import { Config } from './Config/Config';

export type FilePath = string;

const consoleLogFilesToBeChecked = (filePaths: FilePath[]): void => {
    console.log('Type checking:');
    filePaths.forEach(file => console.log(file));
};

// Gets absolute paths for the files supplied via CLI
// Example: ts-incremental-strict-mode src/file1.ts
// Returns absolute path for file1.ts
export const getAbsoluteFilePaths = (files: FilePath[]): FilePath[] => {
    return files.map(filename => path.resolve(filename));
};

// Runs the typescript compiler using the temporary configuration
// generated by createTempTSConfig
export const typeCheck = async (
    tscArgs: string[],
    files: FilePath[],
    verboseMode: boolean,
    configPath?: FilePath
): Promise<void> => {
    const config = new Config();
    const tempConfigPath = await config.createTempTSConfig(files, configPath);
    try {
        if (tempConfigPath) {
            const filePaths = getAbsoluteFilePaths(await globby(files));
            if (verboseMode) {
                consoleLogFilesToBeChecked(filePaths);
            }
            await execa('tsc', [...tscArgs, '--noEmit', '--project', tempConfigPath], {
                all: true
            });
        }
    } catch (error) {
        const { all } = error;
        if (all) {
            throw new Error(all);
        }
        throw error;
    } finally {
        if (tempConfigPath) {
            fs.unlinkSync(tempConfigPath);
        }
    }
};
