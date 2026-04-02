const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
    {
        ignores: [
            'node_modules/**',
            'public/**'
        ]
    },
    js.configs.recommended,
    {
        files: [ '**/*.js' ],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: {
                ...globals.node
            }
        },
        rules: {
            'no-unused-vars': [ 'error', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_'
            } ]
        }
    }
];
