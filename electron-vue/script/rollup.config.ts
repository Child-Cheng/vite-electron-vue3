import { join } from 'path';
import { RollupOptions } from 'rollup';
// 为了支持import xx from 'xxx'
import nodeResolve from '@rollup/plugin-node-resolve';
// 为了让rollup识别commonjs类型的包,默认只支持导入ES6
import commonjs from '@rollup/plugin-commonjs';
// ts转js的编译器
import typescript from '@rollup/plugin-typescript';
import alias from '@rollup/plugin-alias';
// 支持加载json文件
import json from '@rollup/plugin-json';
// 读取package.json
import pkg from '../package.json';

import { builtins } from './utils';

export default (env = 'production') => {
  const options: RollupOptions = {
    input: join(__dirname, '../src/main/app.ts'),
    output: [{
      file: pkg.main, 
      format: 'cjs',// 使用 CommonJs 模块化
      name: 'ElectronMainBundle',
      sourcemap: true,
    }
      // , {
      // file: "dist/preload/preload.js", 
      // format: 'cjs',// 使用 CommonJs 模块化
      // name: 'preload',
      // sourcemap: true,
      // }
    ],
    plugins: [
      typescript({
        exclude: 'node_modules/**',
        typescript: require('typescript'),
      }),
      json(),// 支持引入 json 文件
      commonjs({
        // 支持 CommonJs 模块
          include: 'node_modules/**'
      }),
      nodeResolve(),// 支持 node_modules 下面的包查找
      alias({
        //路径别名
        entries: [
          { find: '@render', replacement: join(__dirname, '../src/render') },
          { find: '@main', replacement: join(__dirname, '../src/main') },
          { find: '@src', replacement: join(__dirname, '../src') },
          { find: '@root', replacement: join(__dirname, '..') },
        ]
      }),
    ],
    external: [
      // 打包避开内置模块
      ...builtins(),
      'electron',
    ],
  }

  return options
}