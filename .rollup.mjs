import vue from 'rollup-plugin-vue'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import postcss from 'rollup-plugin-postcss'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import minify from 'rollup-plugin-babel-minify'
import fs from 'fs'
import _ from 'lodash'


let pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
//let env = process.env.NODE_ENV


let optBabel = {
    runtimeHelpers: true,
    //exclude: 'node_modules/**', //can not exclude node_modules, need compile wsemi
    presets: [
        [
            '@babel/preset-env',
            {
                useBuiltIns: 'entry', //entry usage, usage is not stable
                corejs: 3,
            }
        ]
    ],
}


let optPlugins = [
    vue(),
    // replace({
    //     'process.env.NODE_ENV': JSON.stringify(env)
    //   }),
    commonjs(),
    resolve({
        preferBuiltins: false,
        browser: true,
    }),
    babel(optBabel),
    //buble(),
    postcss({
        extensions: ['.css']
    }),
    minify({ comments: false, }),
]


let fd_src = '{fd_src}'
let fd_tar = '{fd_tar}'
let cps = {cps}


let rs = _.map(cps, function(v) {
    let name = _.kebabCase(v)
    let input = `${fd_src}${v}.mjs`
    let file = `${fd_tar}${name}.umd.js`
    let banner = `/*!\n * ${name} v${pkg.version}\n * (c) 2018-2019 ${pkg.author}\n * Released under the MIT License.\n */`
    return {
        input: input,
        output: {
            banner: banner,
            globals: { //指定哪些外部模組的名稱，左邊為內部模組名稱，右邊為外部提供模組名稱
                'nodemailer': 'nodemailer',
            },
            format: 'umd',
            name: name,
            file: file,
            sourcemap: true
        },
        external: [ //指定哪些模組需視為外部模組
            'nodemailer',
        ],
        plugins: optPlugins
    }
})


export default rs
