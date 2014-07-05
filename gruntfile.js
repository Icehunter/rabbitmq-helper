'use strict';

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: true
            },
            all: [
                'lib/**/*.js',
                'test/**/*.js',
                'gruntfile.js'
            ]
        },
        jsbeautifier: {
            files: [
                'lib/**/*.js',
                'test/**/*.js',
                'gruntfile.js'
            ],
            options: {
                config: './.jsbeautifyrc'
            }
        },
        mochaTest: {
            bdd: {
                options: {
                    reporter: 'spec',
                    require: 'coverage/blanket'
                },
                src: [
                    'test/**/*.js'
                ]
            },
            coverageHtml: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: 'coverage/coverage.html'
                },
                src: [
                    'test/**/*.js'
                ]
            },
            coverageJson: {
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
            test: {
                files: [
                    'lib/**/*.js',
                    'test/**/*.js',
                    '.jsbeautifyrc',
                    '.jshintrc',
                    'gruntfile.js'
                ],
                tasks: [
                    'jshint',
                    'test'
                ]
            }
        },
        shell: {}
    });

    grunt.registerTask('test', [
        'env:test',
        'mochaTest'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'test',
        'watch:test'
    ]);
};