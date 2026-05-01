import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';

export default async function dev(options) {
  console.log(chalk.cyan('\n🔥 启动本地开发服务器...\n'));
  
  const spinner = ora('🚀 启动 Astro 开发服务器...').start();
  
  try {
    // 执行 astro dev
    const args = ['dev'];
    if (options.port) args.push('--port', options.port);
    if (options.host) args.push('--host', options.host);
    
    const subprocess = execa('npx', ['astro', ...args], {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    subprocess.on('error', (err) => {
      spinner.fail('❌ 启动失败');
      console.error(err);
      process.exit(1);
    });
    
    subprocess.on('exit', (code) => {
      if (code !== 0) {
        spinner.fail('❌ 开发服务器意外退出');
        process.exit(code);
      }
    });
    
    spinner.succeed('✅ 开发服务器已经转接，稍等~');
    console.log(chalk.gray('\n💡 按 Ctrl+C 停止服务器\n'));
    
  } catch (err) {
    spinner.fail('❌ 启动失败');
    console.error(err);
    process.exit(1);
  }
}