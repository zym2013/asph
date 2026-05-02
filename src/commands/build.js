/**
 * @fileoverview ASPH 博客生产版本构建工具
 * @description 提供项目构建功能，将博客项目编译为生产优化版本
 * @author zym2013
 * @version 1.0.2
 * @license AGPL-3.0
 */

import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';

/**
 * 构建生产版本
 * @description 执行 Astro 构建命令，将项目编译为生产优化版本，输出到 dist 目录
 * @async
 * @returns {Promise<void>}
 * @throws {Error} 当构建过程失败时抛出错误
 */
export default async function build() {
  console.log(chalk.cyan('\n构建生产版本...\n'));
  
  const spinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(' 执行 Astro 构建...')).start();
  
  try {
    await execa('npx', ['astro', 'build'], {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        FORCE_COLOR: '1'
      }
    });
    
    spinner.succeed(chalk.green('[SUCC]') + chalk.gray(' 构建完成'));
    console.log(chalk.blueBright('[INFO]') + chalk.gray(' 输出目录: ') + chalk.cyan('dist/'));
    console.log(chalk.blueBright('[INFO]') + chalk.gray(' 使用 ') + chalk.cyan('asph preview') + chalk.gray(' 预览生产版本\n'));
    
  } catch (err) {
    spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 构建失败'));
    console.error(chalk.red('[ERR]') + chalk.gray(` ${err.message}`));
    console.log(chalk.blueBright('[INFO]') + chalk.gray(' 尝试手动运行: ') + chalk.cyan('npx astro build') + chalk.gray('\n'));
    process.exit(1);
  }
}