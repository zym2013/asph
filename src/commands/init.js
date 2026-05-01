import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { copy, ensureDir, remove } from 'fs-extra';
import { execa } from 'execa';
import ora from 'ora';
import chalk from 'chalk';
import prompts from 'prompts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = join(__filename, '..');
const TEMPLATE_DIR = join(__dirname, '..', 'templates');

export default async function init(projectName, options) {
  const targetDir = resolve(process.cwd(), projectName || 'asph-blog');
  
  console.log(chalk.cyan('\n🚀 初始化 ASPH 博客项目...\n'));
  
  // 👇 检查目录是否存在
  if (existsSync(targetDir) && !options.force) {
    const { overwrite } = await prompts({
      type: 'confirm',
      name: 'overwrite',
      message: chalk.yellow(`📁 ${targetDir} 已存在，是否覆盖？`),
      initial: false
    });
    if (!overwrite) {
      console.log(chalk.red('❌ 操作取消'));
      process.exit(0);
    }
    await remove(targetDir);
  }
  
  await ensureDir(targetDir);
  
  // 👇 复制模板文件
  const spinner = ora('📦 复制模板文件...').start();
  try {
    await copy(TEMPLATE_DIR, targetDir, {
      filter: (src) => !src.includes('node_modules') && !src.includes('.git')
    });
    spinner.succeed('✅ 模板复制完成');
  } catch (err) {
    spinner.fail('❌ 模板复制失败');
    console.error(err);
    process.exit(1);
  }
  
  // 👇 更新 package.json 中的项目名称
  const pkgPath = join(targetDir, 'package.json');
  if (existsSync(pkgPath)) {
    const pkg = JSON.parse(await import('node:fs').then(m => m.readFileSync(pkgPath, 'utf-8')));
    pkg.name = projectName || 'asph-blog';
    await import('node:fs').then(m => m.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2)));
  }
  
  // 👇 安装依赖
  const { install } = await prompts({
    type: 'confirm',
    name: 'install',
    message: chalk.cyan('📦 是否立即安装依赖？'),
    initial: true
  });
  
  if (install) {
    const installSpinner = ora('🔧 安装依赖中...').start();
    try {
      // 检测包管理器
      const hasPnpm = await execa('pnpm', ['--version']).catch(() => null);
      const hasYarn = await execa('yarn', ['--version']).catch(() => null);
      const pm = hasPnpm ? 'pnpm' : hasYarn ? 'yarn' : 'npm';
      
      await execa(pm, ['install'], { cwd: targetDir, stdio: 'ignore' });
      installSpinner.succeed(`✅ 依赖安装完成（使用 ${pm}）`);
    } catch (err) {
      installSpinner.fail('❌ 依赖安装失败');
      console.error(err);
    }
  }
  
  // 👇 完成提示
  console.log(chalk.green('\n✨ 初始化完成！\n'));
  console.log(`📁 项目目录: ${chalk.cyan(targetDir)}`);
  console.log('\n🚀 快速开始:');
  console.log(`  ${chalk.gray('$')} cd ${projectName || 'asph-blog'}`);
  console.log(`  ${chalk.gray('$')} ${chalk.cyan('asph dev')}  ${chalk.gray('# 本地预览')}`);
  console.log(`  ${chalk.gray('$')} ${chalk.cyan('asph build')} ${chalk.gray('# 构建生产版本')}`);
  console.log('\n📖 文档: https://github.com/zym2013/asph\n');
}