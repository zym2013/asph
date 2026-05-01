import { execa } from 'execa';

export const exec = async (command, args = [], options = {}) => {
  try {
    const { stdout, stderr } = await execa(command, args, {
      stdio: 'pipe',
      ...options
    });
    return { success: true, stdout, stderr };
  } catch (err) {
    return { success: false, error: err };
  }
};