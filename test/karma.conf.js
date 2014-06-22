module.exports = function (config) {
    'use strict';

    config.set({
        basePath: '..',
        frameworks: ['jasmine'],

        files: [
            {
                pattern: 'js/3rd/*.js',
                included: true
            },
            'js/lib_core.js',
            'js/lib_keys.js',
            'js/lib_player.js',
            {
                pattern: 'test/lib/jasmine-jquery.js',
                included: true
            },
            {
                pattern: 'test/fixtures/*.*',
                included: false
            },
            {
                pattern: 'test/spec/Helper.js',
                included: true
            },
            {
                pattern: 'test/spec/*Spec.js',
                included: true
            }
        ],

        browsers: ['Firefox'],
        reporters: ['dots'],

        logLevel: config.LOG_INFO,

        autoWatch: false,
        singleRun: true
    });
};