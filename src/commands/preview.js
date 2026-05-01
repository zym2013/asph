import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';

export default async function preview(options) {
  console.log(chalk.cyan('\n👁️ 预览生产版本...\n'));
  
  const spinner = ora('🚀 启动预览服务器...').start();
  
  try {
    const args = ['preview'];
    if (options.port) args.push('--port', options.port);
    
    const subprocess = execa('npx', ['astro', ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    subprocess.on('error', (err) => {
      spinner.fail('❌ 启动失败');
      console.error(err);
      process.exit(1);
    });
    
    spinner.succeed('✅ 预览服务器已启动');
    console.log(chalk.gray('\n💡 按 Ctrl+C 停止服务器\n'));
    
  } catch (err) {
    spinner.fail('❌ 启动失败');
    console.error(err);
    process.exit(1);
  }
}