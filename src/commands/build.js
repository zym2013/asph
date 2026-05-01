import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';

export default async function build() {
  console.log(chalk.cyan('\n🔨 构建生产版本...\n'));
  
  const spinner = ora('🚀 执行 Astro 构建...').start();
  
  try {
    await execa('npx', ['astro', 'build'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    spinner.succeed('✅ 构建完成！');
    console.log(chalk.green('\n📦 输出目录: dist/'));
    console.log(chalk.gray('\n💡 使用 `asph preview` 预览生产版本\n'));
    
  } catch (err) {
    spinner.fail('❌ 构建失败');
    console.error(err);
    process.exit(1);
  }
}