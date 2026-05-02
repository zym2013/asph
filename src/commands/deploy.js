/**
 * @fileoverview ASPH 博客部署工具
 * @description 自动构建并使用 pnpm 部署到 GitHub Pages (gh-pages 分支)
 * @author zym2013
 * @version 1.0.2
 * @license AGPL-3.0
 */

import { execa } from 'execa';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import chalk from 'chalk';
import * as p from '@clack/prompts';
import ora from 'ora';

/**
 * 检测项目使用的包管理器（强制优先 pnpm）
 * @param {string} cwd - 当前工作目录
 * @returns {string} 包管理器名称
 */
function detectPackageManager(cwd) {
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.packageManager && pkg.packageManager.startsWith('pnpm')) {
        return 'pnpm';
      }
    } catch (e) { }
  }
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  return 'pnpm';
}

/**
 * 验证当前目录是否是有效的 ASPH 项目
 * @param {string} cwd - 当前工作目录
 * @returns {boolean} 是否为有效项目
 */
function isValidAsphProject(cwd) {
  const markers = ['src/config/home.yaml', 'astro.config.mjs', 'src/layouts/Layout.astro'];
  return markers.some(marker => existsSync(join(cwd, marker)));
}

/**
 * 获取 Git 远程仓库信息
 * @param {string} cwd - 当前工作目录
 * @returns {Promise<string|null>} 仓库信息 (user/repo) 或 null
 */
async function getGitRemoteInfo(cwd) {
  try {
    const { stdout } = await execa('git', ['remote', 'get-url', 'origin'], { cwd });
    const match = stdout.match(/github\.com[:/](.+?)\.git$/);
    if (match) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 部署命令主函数
 * @param {Object} options - 部署选项
 * @returns {Promise<void>}
 */
export default async function deploy(options) {
  const cwd = process.cwd();

  if (!isValidAsphProject(cwd)) {
    p.intro(chalk.cyan('ASPH 部署向导'));
    p.log.error(
      chalk.red('[FAIL]') + chalk.gray(' 当前目录不是有效的 ASPH 项目。') + '\n\n' +
      chalk.gray('请确保你在项目根目录运行此命令。')
    );
    p.outro(chalk.red('[CANC]') + chalk.gray(' 部署中止'));
    process.exit(1);
  }

  p.intro(chalk.cyan('ASPH 部署向导'));

  const pm = 'pnpm';

  const envSpinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(' 检查 Git 环境...')).start();

  const repoInfo = await getGitRemoteInfo(cwd);

  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd });
    envSpinner.text = chalk.whiteBright('[LOG]') + chalk.gray(' 检查 Git 远程仓库...');

    if (!repoInfo) {
      envSpinner.fail(chalk.red('[FAIL]') + chalk.gray(' 未找到 Git 远程仓库 (origin)。'));
      p.log.message(
        chalk.gray('请先初始化 Git 并添加远程仓库:\n') +
        chalk.gray('   git init\n') +
        chalk.gray('   git remote add origin <你的仓库地址>\n') +
        chalk.gray('   git add . && git commit -m "init"')
      );
      process.exit(1);
    }

    envSpinner.succeed(chalk.green('[SUCC]') + chalk.gray(` 检测到仓库: ${chalk.cyan(repoInfo)}`));

  } catch (err) {
    envSpinner.fail(chalk.red('[FAIL]') + chalk.gray(' 当前目录不是 Git 仓库。'));
    p.log.message(
      chalk.gray('请先运行:\n') +
      chalk.gray('   git init\n') +
      chalk.gray('   git remote add origin <你的仓库地址>')
    );
    process.exit(1);
  }

  const confirmDeploy = await p.confirm({
    message: chalk.yellow('[QUES]') + chalk.gray(` 确认使用 ${chalk.cyan('pnpm')} 部署到 GitHub Pages (${chalk.cyan(repoInfo)})？`),
    initialValue: true,
  });

  if (p.isCancel(confirmDeploy) || !confirmDeploy) {
    p.cancel(chalk.red('[CANC]') + chalk.gray(' 部署已取消'));
    process.exit(0);
  }

  const installSpinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(' 确保 gh-pages 已安装...')).start();
  try {
    const ghPagesPath = join(cwd, 'node_modules', 'gh-pages');
    if (!existsSync(ghPagesPath)) {
      installSpinner.text = chalk.whiteBright('[LOG]') + chalk.gray(' 正在安装 gh-pages (devDependency)...');
      await execa(pm, ['add', '-D', 'gh-pages'], {
        cwd,
        stdio: 'inherit',
        env: { ...process.env, FORCE_COLOR: '1' }
      });
      installSpinner.succeed(chalk.green('[SUCC]') + chalk.gray(' gh-pages 安装完成'));
    } else {
      installSpinner.succeed(chalk.green('[SUCC]') + chalk.gray(' gh-pages 已存在'));
    }
  } catch (err) {
    installSpinner.fail(chalk.red('[FAIL]') + chalk.gray(' 安装 gh-pages 失败。'));
    p.log.error(chalk.red('[ERR]') + chalk.gray(' 请手动运行: pnpm add -D gh-pages'));
    process.exit(1);
  }

  const buildSpinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(' 正在构建项目 (pnpm build)...')).start();
  try {
    await execa(pm, ['run', 'build'], {
      cwd,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    buildSpinner.succeed(chalk.green('[SUCC]') + chalk.gray(' 构建完成 (dist/)'));
  } catch (err) {
    buildSpinner.fail(chalk.red('[FAIL]') + chalk.gray(' 构建失败。'));
    p.log.error(chalk.red('[ERR]') + chalk.gray(' 请修复构建错误后重试。'));
    process.exit(1);
  }

  const deploySpinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(' 正在部署到 gh-pages 分支...')).start();

  try {
    if (!existsSync(join(cwd, 'dist'))) {
      throw new Error('dist 目录不存在，构建可能未成功。');
    }

    await execa(pm, ['exec', 'gh-pages', '-d', 'dist', '-m', 'chore: deploy site [skip ci]'], {
      cwd,
      stdio: 'pipe',
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    deploySpinner.succeed(chalk.green('[SUCC]') + chalk.gray(' 部署成功！'));

    p.outro(chalk.green('[SUCC]') + chalk.gray(' 部署完成！'));

    const [user, repo] = repoInfo.split('/');
    const url = `https://${user}.github.io/${repo}/`;

    p.note(
      [
        `访问地址: ${chalk.cyan(url)}`,
        chalk.gray('注意: GitHub Pages 可能需要 1-2 分钟生效。'),
        chalk.gray('如果使用的是自定义域名，请确保在仓库 Settings > Pages 中配置。')
      ].join('\n'),
      '下一步',
    );

  } catch (err) {
    deploySpinner.fail(chalk.red('[FAIL]') + chalk.gray(' 部署失败。'));

    let errorMsg = err.message;
    if (err.stderr) errorMsg += `\n${err.stderr}`;

    p.log.error(chalk.red('[ERR]') + chalk.gray(` ${errorMsg}`));
    p.log.message(
      chalk.gray('\n排查建议:\n') +
      chalk.gray('   1. 确保已配置 Git 用户:\n') +
      chalk.gray('      git config --global user.name "你的名字"\n') +
      chalk.gray('      git config --global user.email "你的邮箱"\n') +
      chalk.gray('   2. 确保已设置 GitHub SSH 密钥或 Token\n') +
      chalk.gray('   3. 尝试手动运行: pnpm exec gh-pages -d dist')
    );

    process.exit(1);
  }
}