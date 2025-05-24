import * as core from '@actions/core'
import { existsSync, mkdirSync, readFileSync } from 'fs';
import path from 'path';
import { unzip } from './unzip.js'
import { execSync } from 'child_process';

/**
 * The main function for the action.
 *
 * @returns Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    let mcr = core.getInput('modcoreroot');
    let url : string | null = core.getInput('downloadurl');
    if(url == '' || !url) {
      url = 'https://github.com/dead-cells-core-modding/core/releases/latest/download/win-x64.zip';
    }
    if(mcr == '' || !mcr) {
      mcr = path.join(core.getInput("GITHUB_WORKSPACE"), '.dccm-mdk');
      mkdirSync(mcr, {
        recursive: true
      });
    } else {
      url = null;
    }

    let modcoreRoot = path.resolve(mcr);

    core.debug(`ModCoreRoot: ${modcoreRoot}`);
    core.debug(`Download url: ${url}`);

    if(url) {
      core.info(`Downloading dccm from ${url}`);
      const resp = await fetch(url);
      const data = await resp.arrayBuffer();
      core.debug(`Resp ${resp.statusText}: ${data.byteLength}`);
      core.info(`Extracting DCCM`);
      await unzip(Buffer.from(data), modcoreRoot);
      if(existsSync(path.join(modcoreRoot, 'win-x64', 'ModCoreVersion.txt'))) {
        modcoreRoot = path.join(modcoreRoot, 'win-x64');
      }
    }

    const mdkRoot = path.resolve(modcoreRoot, "core", "mdk");

    const modcoreVersionTxt = path.join(modcoreRoot, 'ModCoreVersion.txt');
    core.debug(`ModCoreVersion.txt path: ${modcoreVersionTxt}`);
    if(!existsSync(modcoreVersionTxt)) {
      core.setFailed('Unable to find `ModCoreVersion.txt`, MDK may be corrupted.');
      return;
    }
    const dccmVer = readFileSync(modcoreVersionTxt, 'utf-8');
    core.info(`Dead Cells Core Modding Version: ${dccmVer}`);

    core.info(`Installing`);
    const installScript = path.join(mdkRoot, 'install.ps1');
    execSync(`pwsh -File "${installScript}"`);

    core.info('DCCM MDK is installed');
    
    // Set outputs for other workflow steps to use
    core.exportVariable("DCCM_MDK_ROOT", mdkRoot);
    core.setOutput('mdkroot', mdkRoot);
    core.setOutput('modcoreroot', modcoreRoot);
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
