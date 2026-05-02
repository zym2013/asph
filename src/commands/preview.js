/**
 * @fileoverview ASPH 博客生产版本预览工具
 * @description 提供预览生产构建版本功能，启动预览服务器用于查看最终效果
 * @author zym2013
 * @version 1.0.2
 * @license AGPL-3.0
 */

import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';

/**
 * 启动生产版本预览服务器
 * @description 使用 Astro 预览模式启动服务器，用于查看生产构建后的网站效果
 * @async
 * @param {Object} [options] - 预览服务器启动选项
 * @param {number} [options.port] - 自定义端口号
 * @returns {Promise<void>}
 * @throws {Error} 当预览服务器启动失败时抛出错误
 */
export default async function preview(options) {
  console.log(chalk.cyan('\n预览生产版本...\n'));
  
  const spinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(' 启动预览服务器...')).start();
  
  try {
    const args = ['preview'];
    if (options?.port) args.push('--port', options.port);
    
    const subprocess = execa('npx', ['astro', ...args], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        FORCE_COLOR: '1'
      }
    });
    
    subprocess.on('error', (err) => {
      spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 启动失败'));
      console.error(chalk.red('[ERR]') + chalk.gray(` ${err.message}`));
      console.log(chalk.blueBright('[INFO]') + chalk.gray(' 请确保已先运行 ') + chalk.cyan('asph build') + chalk.gray(' 构建项目\n'));
      process.exit(1);
    });
    
    subprocess.on('exit', (code) => {
      if (code !== 0) {
        spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 预览服务器意外退出'));
        process.exit(code);
      }
    });
    
    spinner.succeed(chalk.green('[SUCC]') + chalk.gray(' 预览服务器已启动'));
    console.log(chalk.blueBright('[INFO]') + chalk.gray(' 按 ') + chalk.cyan('Ctrl + C') + chalk.gray(' 停止服务器\n'));
    
  } catch (err) {
    spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 启动失败'));
    console.error(chalk.red('[ERR]') + chalk.gray(` ${err.message}`));
    console.log(chalk.blueBright('[INFO]') + chalk.gray(' 请确保已先运行 ') + chalk.cyan('asph build') + chalk.gray(' 构建项目\n'));
    process.exit(1);
  }
}