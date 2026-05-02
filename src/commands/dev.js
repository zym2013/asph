/**
 * @fileoverview ASPH 博客开发服务器启动工具
 * @author zym2013
 * @version 1.0.2
 * @license AGPL-3.0
 */

import { execa } from 'execa';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
// import { spawnSync } from 'node:child_process'; // 👈 删除这一行
import chalk from 'chalk';
import ora from 'ora';
import * as p from '@clack/prompts';

function detectPackageManager(cwd) {
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.packageManager) {
        const [pm] = pkg.packageManager.split('@');
        if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) return pm;
      }
    } catch (e) {}
  }
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';
  if (existsSync(join(cwd, 'package-lock.json'))) return 'npm';
  return 'npm';
}

function isValidAsphProject(cwd) {
  const markers = ['src/config/home.yaml', 'astro.config.mjs', 'src/layouts/Layout.astro'];
  return markers.some(marker => existsSync(join(cwd, marker)));
}

function getDevCommand(pm, options) {
  const args = ['dev'];
  if (options?.port) args.push('--port', String(options.port));
  if (options?.host) args.push('--host', options.host);
  return { command: pm, args };
}

export default async function dev(options) {
  const cwd = process.cwd();
  
  if (!isValidAsphProject(cwd)) {
    p.intro(chalk.cyan('ASPH 开发服务器'));
    p.log.error(
      chalk.red('[ERROR]') + chalk.gray(' 当前目录不是有效的 ASPH 项目。') + '\n\n' +
      chalk.gray('正确用法:\n') +
      chalk.gray('  1. asph init my-blog\n') +
      chalk.gray('  2. cd my-blog\n') +
      chalk.gray('  3. asph dev')
    );
    p.outro(chalk.red('启动中止'));
    process.exit(1);
  }
  
  const pm = detectPackageManager(cwd);
  console.log(chalk.cyan(`\n启动本地开发服务器...`) + chalk.gray(` (检测到包管理器: ${chalk.cyan(pm)})\n`));
  
  const spinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(` 使用 ${pm} 启动 Astro 开发服务器...\n\n`)).start();
  
  let subprocess;
  let isExiting = false;
  
  // 👇 最简化清理退出函数
  const cleanupAndExit = (code = 0) => {
    if (isExiting) return;
    isExiting = true;

    if (process.stdin.isTTY) {
      try { process.stdin.setRawMode(false); } catch (e) {}
    }
    process.stdin.pause();
    process.stdout.write('\n');
    
    if (code === 0) {
      console.log(chalk.gray('[INFO] 进程已终止。'));
    }

    // 延迟 200ms 直接退出
    setTimeout(() => {
      process.exit(code);
    }, 200);
  };

  try {
    const { command, args } = getDevCommand(pm, options);
    
    subprocess = execa(command, args, {
      stdio: 'inherit',
      cwd,
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    
    subprocess.on('error', (err) => {
      if (err.isCanceled) return;
      // 只有在非正常退出且未手动停止时才报错
      if (!isExiting) {
        spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 启动失败'));
        console.error(chalk.red('\n[ERROR]'), err.message);
      }
      cleanupAndExit(1);
    });
    
    subprocess.on('exit', (code, signal) => {
      if (isExiting) return;
      isExiting = true;
      
      spinner.stop();
      if (signal === 'SIGINT' || code === 0) {
        cleanupAndExit(0);
      } else {
        spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 开发服务器意外退出'));
        cleanupAndExit(code || 1);
      }
    });
    
    spinner.succeed(chalk.green('[SUCC]') + chalk.gray(' 开发服务器已转接'));
    console.log(chalk.blueBright('[INFO]') + chalk.gray(' 按 ') + chalk.cyan('Ctrl + C') + chalk.gray(' 停止服务器'));
    
    const onSigInt = () => {
      if (isExiting) return;
      isExiting = true;
      
      spinner.stop();
      console.log(chalk.whiteBright('[LOG]') + chalk.gray('正在停止开发服务器...'));
      
      if (subprocess && !subprocess.killed) {
        try {
          subprocess.kill({ signal: 'SIGINT', forceKillAfterTimeout: 3000 });
        } catch (e) {
          cleanupAndExit(0);
        }
      } else {
        cleanupAndExit(0);
      }
    };
    
    process.on('SIGINT', onSigInt);
    process.on('SIGTERM', onSigInt);
    
    await subprocess;
    
  } catch (err) {
    if (err.isCanceled) return;
    if (!isExiting) {
      spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 启动失败'));
      console.error(chalk.red('\n[ERROR]'), err.message);
    }
    cleanupAndExit(1);
  }
}