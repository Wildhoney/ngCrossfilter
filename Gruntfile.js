module.exports = function(grunt) {

    grunt.initConfig({

        /**
         * @property pkg
         * @type {Object}
         */
        pkg: grunt.file.readJSON('package.json'),

        /**
         * @property jshint
         * @type {Object}
         */
        jshint: {
            all: 'module/ngCrossfilter.js',
            options: {
                jshintrc: '.jshintrc'
            }
        },

        /**
         * @property uglify
         * @type {Object}
         */
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> by <%= pkg.author %> created on <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: ['module/ngCrossfilter.js'],
                dest: 'dist/<%= pkg.name %>.min.js'
            }
        },

        /**
         * @property copy
         * @type {Object}
         */
        copy: {
            main: {
                files: [
                    { flatten: true, src: ['module/ngCrossfilter.js'], dest: 'dist/ng-crossfilter.js' }
                ]
            },
            test: {
                src: 'module/ngCrossfilter.js',
                dest: 'example/js/vendor/ng-crossfilter/ng-crossfilter.js'
            },
            release: {
                src: 'releases/<%= pkg.version %>.zip',
                dest: 'releases/master.zip'
            }

        },

        /**
         * @property compress
         * @type {Object}
         */
        compress: {
            main: {
                options: {
                    archive: 'releases/<%= pkg.version %>.zip'
                },
                files: [
                    { flatten: true, src: ['dist/**'], dest: './', filter: 'isFile' }
                ]
            }
        },

        /**
         * @property jasmine
         * @type {Object}
         */
        jasmine: {
            pivotal: {
                src: 'module/ngCrossfilter.js',
                options: {
                    specs: 'tests/spec.js',
                    helpers: [
                        'example/js/vendor/angular/angular.js',
                        'example/js/vendor/moment/moment.js',
                        'example/js/vendor/crossfilter/crossfilter.js',
                        'example/js/vendor/angular-mocks/angular-mocks.js'
                    ]
                }
            }
        },

        /**
         * @property comments
         * @type {Object}
         */
        comments: {
            dist: {
                options: {
                    singleline: true,
                    multiline: true
                },
                src: ['dist/ng-crossfilter.js']
            }
        },

        /**
         * @property jsbeautifier
         * @type {Object}
         */
        jsbeautifier : {
            files: ['dist/ng-crossfilter.js'],
            options: {
                js: {
                    preserveNewlines: true,
                    jslintHappy: true,
                    keepArrayIndentation: false,
                    keepFunctionIndentation: false,
                    spaceBeforeConditional: true,
                    spaceInParen: true
                }
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('build', ['copy', 'uglify', 'compress']);
    grunt.registerTask('test', ['jasmine', 'jshint']);
    grunt.registerTask('default', ['jshint', 'jasmine', 'compress', 'copy', 'uglify']);

};