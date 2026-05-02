/**
 * @fileoverview ASPH 博客开发服务器启动工具
 * @author zym2013
 * @version 1.0.2
 * @license AGPL-3.0
 */

import { execa } from 'execa';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import * as p from '@clack/prompts';

/**
 * 检测项目使用的包管理器
 * @param {string} cwd - 当前工作目录
 * @returns {string} 包管理器名称
 */
function detectPackageManager(cwd) {
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.packageManager) {
        const [pm] = pkg.packageManager.split('@');
        if (['pnpm', 'npm', 'yarn', 'bun'].includes(pm)) return pm;
      }
    } catch (e) { }
  }
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(cwd, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(cwd, 'bun.lockb')) || existsSync(join(cwd, 'bun.lock'))) return 'bun';
  if (existsSync(join(cwd, 'package-lock.json'))) return 'npm';
  return 'npm';
}

/**
 * 验证是否为有效的 ASPH 项目
 * @param {string} cwd - 当前工作目录
 * @returns {boolean} 是否为有效项目
 */
function isValidAsphProject(cwd) {
  const markers = ['src/config/home.yaml', 'astro.config.mjs', 'src/layouts/Layout.astro'];
  return markers.some(marker => existsSync(join(cwd, marker)));
}

/**
 * 获取开发服务器启动命令
 * @param {string} pm - 包管理器名称
 * @param {Object} options - 启动选项
 * @param {number} [options.port] - 端口号
 * @param {string} [options.host] - 主机地址
 * @returns {{ command: string, args: string[] }} 命令配置
 */
function getDevCommand(pm, options) {
  const args = ['dev'];
  if (options?.port) args.push('--port', String(options.port));
  if (options?.host) args.push('--host', options.host);
  return { command: pm, args };
}

/**
 * 启动 ASPH 开发服务器
 * @param {Object} options - 启动选项
 * @param {number} [options.port] - 端口号
 * @param {string} [options.host] - 主机地址
 * @returns {Promise<void>}
 */
export default async function dev(options) {
  const cwd = process.cwd();

  if (!isValidAsphProject(cwd)) {
    p.intro(chalk.cyan('ASPH 开发服务器'));
    p.log.error(
      chalk.red('[FAIL]') + chalk.gray(' 当前目录不是有效的 ASPH 项目。') + '\n\n' +
      chalk.gray('正确用法:\n') +
      chalk.gray('  1. asph init my-blog\n') +
      chalk.gray('  2. cd my-blog\n') +
      chalk.gray('  3. asph dev')
    );
    p.outro(chalk.red('[CANC]') + chalk.gray(' 启动中止'));
    process.exit(1);
  }

  const pm = detectPackageManager(cwd);
  p.log.info(chalk.whiteBright('[LOG]') + chalk.gray(` 检测到包管理器: ${chalk.cyan(pm)}`));

  const spinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(` 使用 ${pm} 启动 Astro 开发服务器...`)).start();

  let subprocess;
  let isExiting = false;

  /**
   * 清理资源并退出进程
   * @param {number} code - 退出码
   */
  const cleanupAndExit = (code = 0) => {
    if (isExiting) return;
    isExiting = true;

    if (process.stdin.isTTY) {
      try { process.stdin.setRawMode(false); } catch (e) { }
    }
    process.stdin.pause();
    process.stdout.write('\n');

    if (code === 0) {
      p.log.message(chalk.whiteBright('[LOG]') + chalk.gray(' 进程已终止。'));
    }

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
      if (!isExiting) {
        spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 启动失败'));
        p.log.error(chalk.red('[ERR]') + chalk.gray(` ${err.message}`));
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
    p.log.message(chalk.blueBright('[INFO]') + chalk.gray(' 按 ') + chalk.cyan('Ctrl + C') + chalk.gray(' 停止服务器'));

    const onSigInt = () => {
      if (isExiting) return;
      isExiting = true;

      spinner.stop();
      p.log.info(chalk.whiteBright('[LOG]') + chalk.gray(' 正在停止开发服务器...'));

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
      p.log.error(chalk.red('[ERR]') + chalk.gray(` ${err.message}`));
    }
    cleanupAndExit(1);
  }
}