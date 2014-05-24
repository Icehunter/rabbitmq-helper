'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        jshint: {
            options: {
                strict: true,
                node: true,
                unused: true,
                bitwise: true,
                curly: true,
                eqeqeq: true,
                immed: true,
                latedef: true,
                newcap: true,
                noarg: true,
                quotmark: true,
                regexp: true,
                undef: true,
                trailing: true,
                smarttabs: true,
                globals: {
                    describe: false,
                    it: false,
                    before: false,
                    beforeEach: false,
                    after: false,
                    afterEach: false
                }
            },
            all: [
                'gruntfile.js',
                'lib/**/*.js',
                'test/**/*.js'
            ]
        },
        mochaTest: {
            moduleBDD: {
                options: {
                    reporter: 'spec',
                    require: 'coverage/blanket'
                },
                src: [
                    'test/**/*.js'
                ]
            },
            moduleBDDCoverageHTML: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: 'coverage/coverage.html'
                },
                src: [
                    'test/**/*.js'
                ]
            },
            moduleBDDCoverageJSON: {
                options: {
                    reporter: 'json-cov',
                    quiet: true,
                    captureFile: 'coverage/coverage.json'
                },
                src: [
                    'test/**/*.js'
                ]
            }
        },
        env: {
            options: {},
            dev: {
                NODE_ENV: 'development'
            },
            test: {
                NODE_ENV: 'test'
            },
            production: {
                NODE_ENV: 'production'
            }
        },
        watch: {
            files: [
                'lib/**/*.js',
                'test/**/*.js',
                'gruntfile.js'
            ],
            tasks: [
                'test',
                'jshint'
            ]
        }
    });

    grunt.registerTask('test', [
        'env:test',
        'jshint',
        'mochaTest:moduleBDD',
        'mochaTest:moduleBDDCoverageHTML',
        'mochaTest:moduleBDDCoverageJSON'
    ]);

    grunt.registerTask('default', [
        'test', 'jshint', 'watch'
    ]);
};
