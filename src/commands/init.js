/**
 * @fileoverview ASPH 博客项目初始化工具
 * @description 提供交互式命令行界面，用于创建和初始化 ASPH 博客项目
 * @author zym2013
 * @version 1.0.2
 * @license AGPL-3.0
 */

import { join, resolve, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { rm, mkdir, cp } from 'node:fs/promises';  // 改用原生 API
import { execa, execaSync } from 'execa';
import chalk from 'chalk';
import * as p from '@clack/prompts';

process.env.FORCE_COLOR = '3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const TEMPLATE_DIR = join(__dirname, '..', 'templates');

const ASPH_LOGO = `
\\\\\\\\ _      ____    ____    _   _ 
    / \\    / ___|  |  _ \\  | | | |
   / _ \\   \\___ \\  | |_)|  | |_| |
  / ___ \\   ___)|  |  __/  |  _  |
 /_/   \\_\\ |____/  |_|     |_| |_|
                                 \\\\\\\\

     便捷、快速、美观的博客框架。

   Build With Astro + Vite + Vue.
`.trim();

/**
 * 展示 ASPH ASCII Art Logo
 * @returns {void}
 */
function showLogo() {
  p.note(ASPH_LOGO, '感谢使用 ASPH');
}

/**
 * 递归复制目录（替代 fs-extra.copy）
 * @param {string} src - 源目录
 * @param {string} dest - 目标目录
 * @returns {Promise<void>}
 */
async function copyDir(src, dest) {
  await cp(src, dest, {
    recursive: true,
    filter: (srcPath) => {
      // 获取当前处理的文件/文件夹名称
      const name = basename(srcPath);
      
      // 1. 排除 node_modules 目录
      if (name === 'node_modules') return false;
      
      // 2. 排除 .git 目录 (注意：只排除名字叫 .git 的文件夹)
      // 这样 .gitignore, .gitattributes, .github 等文件/文件夹会被保留
      if (name === '.git') return false;

      // 3. (可选) 排除其他不想复制的系统文件
      if (name === '.DS_Store' || name === 'Thumbs.db') return false;

      // 4. 其他所有文件都复制 (包括 .gitignore)
      return true;
    }
  });
}

/**
 * 确保目录存在（替代 fs-extra.ensureDir）
 * @param {string} dirPath - 目录路径
 * @returns {Promise<void>}
 */
async function ensureDirNative(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

/**
 * 删除目录（替代 fs-extra.remove / rimraf）
 * @param {string} dirPath - 目录路径
 * @returns {Promise<void>}
 */
async function removeDir(dirPath) {
  await rm(dirPath, { recursive: true, force: true });
}

/**
 * 安装项目依赖（仅支持 pnpm）
 * @param {string} targetDir - 目标项目目录路径
 * @returns {Promise<boolean>} 安装是否成功
 */
async function installDependencies(targetDir) {
  p.log.info(`使用 ${chalk.bold('pnpm')} 安装依赖...`);
  try {
    await execa('pnpm', ['install', '--frozen-lockfile', '--ignore-scripts', '--prefer-offline'], {
      cwd: targetDir,
      stdio: 'inherit',
      env: { ...process.env, FORCE_COLOR: '1' }
    });
    return true;
  } catch (err) {
    p.log.error('pnpm install 失败');
    if (err.stderr?.includes('frozen-lockfile')) {
      p.note(
        '锁文件不匹配',
        '可能原因:\n• 模板的 pnpm-lock.yaml 与 package.json 不一致\n• 你修改了 package.json 但未更新锁文件',
      );
      p.log.message(`解决方案:\n  cd ${targetDir} && pnpm install --no-frozen-lockfile`);
    } else {
      p.log.message('建议:\n  1. 检查网络连接\n  2. 手动运行：pnpm install');
    }
    return false;
  }
}

/**
 * 初始化 ASPH 博客项目
 * @param {string} projectName - 项目名称
 * @param {Object} options - 初始化选项
 * @param {boolean} [options.force] - 是否强制覆盖已存在的目录
 * @returns {Promise<void>}
 */
export default async function init(projectName, options) {
  const isRelaunched = process.env.__ASPH_RELAUNCHED === '1';
  
  p.intro(chalk.cyan(`初始化 ASPH 项目`));

  // 终端检测逻辑
  if (!isRelaunched && isMintty()) {
    p.log.warn(
      chalk.yellow('[WARN]') + chalk.gray(' 检测到您在 Mintty (Git Bash) 中运行，交互可能异常。') + '\n\n' +
      chalk.gray('建议方案:\n') +
      chalk.gray('  • 使用 ') + chalk.cyan('winpty') + chalk.gray(' 自动重启动（推荐）\n') +
      chalk.gray('  • 或切换到 ') + chalk.cyan('Conhost.exe (CMD)') + chalk.gray(' 手动运行')
    );
    
    const useWinpty = await p.confirm({
      message: chalk.magentaBright('[QUES]') + chalk.gray(' 是否尝试使用 winpty 自动重启动？'),
      initialValue: true,
      active: '是，尝试重启动',
      inactive: '否，继续在当前终端运行',
    });
    
    if (useWinpty) {
      if (isWinptyAvailable()) {
        const args = process.argv.slice(2);
        relaunchWithWinpty(args);
      } else {
        p.log.error(chalk.red('[FAIL]') + chalk.gray(' winpty 未找到，无法自动重启动。'));
        p.log.message(chalk.gray('请确保已安装 Git for Windows（自带 winpty）'));
      }
    }
    
    p.log.warn(
      chalk.yellow('[WARN]') + chalk.gray(' 在 Mintty 中运行可能导致:\n') +
      chalk.gray('  • Chalk 颜色显示异常\n') +
      chalk.gray('  • 输入光标位置错乱\n') +
      chalk.gray('  • 某些交互功能失效')
    );
    
    const continueAnyway = await p.confirm({
      message: chalk.magentaBright('[QUES]') + chalk.gray(' 仍要继续使用当前终端吗？（不推荐）'),
      initialValue: false,
    });
    
    if (!continueAnyway) {
      p.cancel(chalk.red('[CANC]') + chalk.gray(' 已退出，请切换到 CMD 后重新运行。'));
      process.exit(0);
    }
    
    p.log.message(chalk.whiteBright('[LOG]') + chalk.gray(' 继续初始化（如遇问题请切换到 CMD）...\n'));
  }

  const targetDir = resolve(process.cwd(), projectName || 'asph-blog');

  // 检查目录是否存在，覆盖时显示加载动画
  if (existsSync(targetDir) && !options.force) {
    const overwrite = await p.confirm({
      message: chalk.yellow('[WARN]') + chalk.gray(` ${targetDir} 已存在，是否覆盖？`),
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel('操作取消');
      process.exit(0);
    }
    
    // 使用原生 API 删除目录
    const removeSpinner = p.spinner();
    removeSpinner.start(chalk.whiteBright(`[LOG]`) + chalk.gray(` 正在清理 ${targetDir}`));
    try {
      await removeDir(targetDir);  // 原生 rm()
      removeSpinner.stop(chalk.green('[SUCC]') + chalk.gray(' 目录清理完成。'));
    } catch (err) {
      removeSpinner.stop(chalk.red('[FAIL]') + chalk.gray(' 目录清理失败。'), 1);
      p.log.error(err.message);
      process.exit(1);
    }
  }

  // 使用原生 API 确保目录存在
  await ensureDirNative(targetDir);  // 原生 mkdir()

  // 复制模板文件（使用原生 cp）
  const s = p.spinner();
  s.start(chalk.whiteBright(`[LOG]`) + chalk.gray(' 复制模板文件...'));
  try {
    await copyDir(TEMPLATE_DIR, targetDir);  // 原生 cp()
    s.stop(chalk.green('[SUCC]') + chalk.gray(' 模板复制完成。'));
  } catch (err) {
    s.stop(chalk.red('[FAIL]') + chalk.gray(' 模板复制失败。'), 1);
    p.log.error(err.message);
    process.exit(1);
  }

  // 更新 package.json 项目名称
  const pkgPath = join(targetDir, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    pkg.name = projectName || 'asph-blog';
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
  }

  // 询问是否安装依赖
  const install = await p.confirm({
    message: chalk.magentaBright('[QUES]') + chalk.grey(' 是否立即安装依赖？'),
    initialValue: true,
  });

  if (p.isCancel(install)) {
    p.cancel(chalk.red('[CANC]') + chalk.gray(' 操作取消。'));
    process.exit(0);
  }

  if (install) {
    const success = await installDependencies(targetDir);
    if (success) {
      p.log.success(chalk.green('[SUCC]') + chalk.gray(' 依赖安装完成。'));
    } else {
      p.log.warn(chalk.yellow('[WARN]') + chalk.gray(' 依赖安装未完全成功，但项目已初始化。'));
      p.log.message(chalk.blueBright(`[INFO]`) + chalk.gray(` 可手动修复：`) + chalk.cyan(`cd ${projectName || 'asph-blog'} && pnpm install`) + chalk.gray('。'));
    }
  }

  showLogo();
  
  p.outro(chalk.green('[SUCC]') + chalk.gray(' 初始化完成！'));

  p.note(
    [
      `${chalk.gray('$')} cd ${projectName || 'asph-blog'}`,
      `${chalk.gray('$')} ${chalk.cyan('asph dev')}  ${chalk.gray('# 本地预览')}`,
      `${chalk.gray('$')} ${chalk.cyan('asph build')} ${chalk.gray('# 构建生产版本')}`,
      `${chalk.gray('$')} ${chalk.cyan('asph preview')} ${chalk.gray('# 预览生产版本')}`,
    ].join('\n'),
    '快速开始',
  );
  
  p.log.message(chalk.blueBright('[INFO]') + chalk.gray(' 如未自动退出请按 ') + chalk.cyan('Ctrl + C') + chalk.gray(' 退出 ~'));
}

// 辅助函数（保持原样）
function isMintty() {
  return (
    process.platform === 'win32' &&
    (process.env.MSYSTEM || process.env.TERM === 'cygwin' || process.env.TERM === 'msys')
  );
}

function isWinptyAvailable() {
  try {
    execaSync('winpty', ['--version'], { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

function relaunchWithWinpty(args) {
  p.log.message('');
  p.log.message(chalk.blueBright('[INFO]') + chalk.gray(' 终端环境检测:'));
  p.log.message(chalk.gray('  • PLATFORM: ') + chalk.cyan(process.platform));
  p.log.message(chalk.gray('  • MSYSTEM: ') + chalk.cyan(process.env.MSYSTEM || 'N/A'));
  p.log.message(chalk.gray('  • TERM: ') + chalk.cyan(process.env.TERM || 'N/A'));
  p.log.message(chalk.gray('  • SHELL: ') + chalk.cyan(process.env.SHELL || 'N/A'));
  
  p.log.message('');
  p.log.message(chalk.blueBright('[INFO]') + chalk.gray(' 准备通过 winpty 重启动:'));
  
  const nodePath = process.execPath;
  const scriptPath = __filename;
  const fullArgs = [nodePath, scriptPath, ...args];
  
  p.log.message(chalk.gray('  • Node 路径: ') + chalk.cyan(nodePath));
  p.log.message(chalk.gray('  • 脚本路径: ') + chalk.cyan(scriptPath));
  p.log.message(chalk.gray('  • 原始参数: ') + chalk.cyan(args.join(' ') || '(无)'));
  p.log.message(chalk.gray('  • 完整命令:'));
  p.log.message(chalk.gray('    ') + chalk.dim(`winpty ${fullArgs.join(' ')}`));
  
  p.log.message('');
  p.log.message(chalk.blueBright('[INFO]') + chalk.gray(' 环境变量设置:'));
  p.log.message(chalk.gray('  • __ASPH_RELAUNCHED: ') + chalk.cyan('1') + chalk.gray(' (防循环标记)'));
  p.log.message(chalk.gray('  • FORCE_COLOR: ') + chalk.cyan(process.env.FORCE_COLOR || '3'));
  
  p.log.message('');
  p.log.message(chalk.yellow('[WAIT]') + chalk.gray(' 正在启动新进程，请稍候...'));
  p.log.message(chalk.gray('  如果卡住超过 10 秒，请按 Ctrl+C 并手动运行:'));
  p.log.message(chalk.gray('     ') + chalk.cyan(`winpty ${nodePath} "${scriptPath}" ${args.join(' ')}`));
  p.log.message('');
  
  try {
    const startTime = Date.now();
    p.log.message(chalk.blueBright('[EXEC]') + chalk.gray(' 执行命令: winpty ...'));
    
    execaSync('winpty', fullArgs, {
      stdio: 'inherit',
      env: { ...process.env, __ASPH_RELAUNCHED: '1', FORCE_COLOR: '3' },
      timeout: 30000
    });
    
    const duration = Date.now() - startTime;
    p.log.warn(chalk.yellow('[WARN]') + chalk.gray(` winpty 进程已退出 (耗时 ${duration}ms)`));
    
  } catch (err) {
    const duration = Date.now() - startTime;
    p.log.error(chalk.red('[FAIL]') + chalk.gray(` winpty 重启动失败 (耗时 ${duration}ms):`));
    p.log.error(chalk.gray('  ┌─ 错误信息:'));
    p.log.error(chalk.gray('  │ ') + chalk.red(err.message || 'Unknown error'));
    
    if (err.stderr) {
      p.log.error(chalk.gray('  ┌─ 标准错误输出:'));
      err.stderr.split('\n').forEach(line => {
        if (line.trim()) p.log.error(chalk.gray('  │ ') + chalk.dim(line));
      });
    }
    
    p.log.error(chalk.gray('  └─ 错误码: ') + chalk.red(err.code || 'N/A'));
    
    p.log.message('');
    p.log.message(chalk.yellow('[TIPS]') + chalk.gray(' 排查建议:'));
    p.log.message(chalk.gray('  1. 确认 winpty 已安装: ') + chalk.cyan('where winpty'));
    p.log.message(chalk.gray('  2. 确认 Git Bash 路径在 PATH 中: ') + chalk.cyan('echo $PATH'));
    p.log.message(chalk.gray('  3. 尝试手动执行: ') + chalk.cyan(`winpty ${process.execPath} "${__filename}" ${args.join(' ')}`));
    p.log.message(chalk.gray('  4. 如仍失败，请切换到 CMD 运行: ') + chalk.cyan('asph init ' + (args[1] || 'my-blog')));
    p.log.message('');
    
    process.exit(1);
  }
}