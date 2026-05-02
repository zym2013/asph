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
 * 检测项目使用的包管理器 (强制优先 pnpm)
 */
function detectPackageManager(cwd) {
  const pkgPath = join(cwd, 'package.json');
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.packageManager && pkg.packageManager.startsWith('pnpm')) {
        return 'pnpm';
      }
    } catch (e) {}
  }
  // 即使检测到其他锁文件，ASPH 也推荐/强制使用 pnpm
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) return 'pnpm';
  
  //  fallback 到 pnpm (因为 ASPH 模板默认就是 pnpm)
  return 'pnpm';
}

/**
 * 验证当前目录是否是有效的 ASPH 项目
 */
function isValidAsphProject(cwd) {
  const markers = ['src/config/home.yaml', 'astro.config.mjs', 'src/layouts/Layout.astro'];
  return markers.some(marker => existsSync(join(cwd, marker)));
}

/**
 * 获取 Git 远程仓库信息
 */
async function getGitRemoteInfo(cwd) {
  try {
    const { stdout } = await execa('git', ['remote', 'get-url', 'origin'], { cwd });
    const match = stdout.match(/github\.com[:/](.+?)\.git$/);
    if (match) {
      return match[1]; // 返回 user/repo
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 部署命令主函数
 */
export default async function deploy(options) {
  const cwd = process.cwd();
  
  // 👇 1. 验证项目目录
  if (!isValidAsphProject(cwd)) {
    p.intro(chalk.cyan('ASPH 部署向导'));
    p.log.error(
      chalk.red('[ERROR]') + chalk.gray(' 当前目录不是有效的 ASPH 项目。') + '\n\n' +
      chalk.gray('请确保你在项目根目录运行此命令。')
    );
    p.outro(chalk.red('部署中止'));
    process.exit(1);
  }

  p.intro(chalk.cyan('ASPH 部署向导'));

  const pm = 'pnpm'; // 强制使用 pnpm

  // 👇 2. 检查 Git 环境
  const spinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(' 检查 Git 环境...')).start();
  
  try {
    await execa('git', ['rev-parse', '--is-inside-work-tree'], { cwd });
    spinner.text = chalk.whiteBright('[LOG]') + chalk.gray(' 检查 Git 远程仓库...');
    
    const repoInfo = await getGitRemoteInfo(cwd);
    if (!repoInfo) {
      spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 未找到 Git 远程仓库 (origin)。'));
      p.log.message(
        chalk.gray('💡 请先初始化 Git 并添加远程仓库:\n') +
        chalk.gray('   git init\n') +
        chalk.gray('   git remote add origin <你的仓库地址>\n') +
        chalk.gray('   git add . && git commit -m "init"')
      );
      process.exit(1);
    }
    
    spinner.succeed(chalk.green('[SUCC]') + chalk.gray(` 检测到仓库: ${chalk.cyan(repoInfo)}`));
    
  } catch (err) {
    spinner.fail(chalk.red('[FAIL]') + chalk.gray(' 当前目录不是 Git 仓库。'));
    p.log.message(
      chalk.gray('💡 请先运行:\n') +
      chalk.gray('   git init\n') +
      chalk.gray('   git remote add origin <你的仓库地址>')
    );
    process.exit(1);
  }

  // 👇 3. 确认部署信息
  const confirmDeploy = await p.confirm({
    message: chalk.yellow('[QUES]') + chalk.gray(` 确认使用 ${chalk.cyan('pnpm')} 部署到 GitHub Pages (${chalk.cyan(repoInfo)})？`),
    initialValue: true,
  });

  if (p.isCancel(confirmDeploy) || !confirmDeploy) {
    p.cancel('部署已取消');
    process.exit(0);
  }

  // 👇 4. 确保 gh-pages 已安装 (使用 pnpm add -D)
  const installSpinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(' 确保 gh-pages 已安装...')).start();
  try {
    // 检查 node_modules 中是否有 gh-pages
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
    p.log.error(chalk.gray('请手动运行: pnpm add -D gh-pages'));
    process.exit(1);
  }

  // 👇 5. 执行构建 (pnpm build)
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
    p.log.error(chalk.gray('请修复构建错误后重试。'));
    process.exit(1);
  }

  // 👇 6. 部署到 gh-pages 分支 (使用 pnpm exec gh-pages)
  const deploySpinner = ora(chalk.whiteBright('[LOG]') + chalk.gray(' 正在部署到 gh-pages 分支...')).start();
  
  try {
    if (!existsSync(join(cwd, 'dist'))) {
      throw new Error('dist 目录不存在，构建可能未成功。');
    }

    // 使用 pnpm exec 调用本地安装的 gh-pages
    // 参数: -d dist (目录), -m "chore: deploy site" (提交消息)
    await execa(pm, ['exec', 'gh-pages', '-d', 'dist', '-m', 'chore: deploy site [skip ci]'], {
      cwd,
      stdio: 'pipe', 
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    deploySpinner.succeed(chalk.green('[SUCC]') + chalk.gray(' 部署成功！'));
    
    p.outro(chalk.green('🎉 部署完成！'));
    
    // 生成访问链接
    const [user, repo] = repoInfo.split('/');
    const url = `https://${user}.github.io/${repo}/`;

    p.note(
      [
        `🌐 访问地址: ${chalk.cyan(url)}`,
        chalk.gray('💡 注意: GitHub Pages 可能需要 1-2 分钟生效。'),
        chalk.gray('💡 如果使用的是自定义域名，请确保在仓库 Settings > Pages 中配置。')
      ].join('\n'),
      '下一步',
    );
    
  } catch (err) {
    deploySpinner.fail(chalk.red('[FAIL]') + chalk.gray(' 部署失败。'));
    
    let errorMsg = err.message;
    if (err.stderr) errorMsg += `\n${err.stderr}`;
    
    p.log.error(chalk.gray(errorMsg));
    p.log.message(
      chalk.gray('\n💡 排查建议:\n') +
      chalk.gray('   1. 确保已配置 Git 用户:\n') +
      chalk.gray('      git config --global user.name "你的名字"\n') +
      chalk.gray('      git config --global user.email "你的邮箱"\n') +
      chalk.gray('   2. 确保已设置 GitHub SSH 密钥或 Token\n') +
      chalk.gray('   3. 尝试手动运行: pnpm exec gh-pages -d dist')
    );
    
    process.exit(1);
  }
}