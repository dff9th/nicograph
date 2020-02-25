/*
Copyright (c) 2017 noradium
Released under the MIT license
https://github.com/noradium/dac/blob/master/src/scripts/hack_fetch_thread.js
*/

import {setNicoads} from "./lib/cmt_graph";

try {
    init();
} catch (error) {
    console.error('[ERROR] Failed to initialize nicograph', error);
}

function init() {
    const libraryFunctions = window['webpackJsonp'][0][1];
    const nicoadsModuleIndex = libraryFunctions.findIndex((item) => {
        return item && !!item.toString().match(/\.getNicoads\s?=\s?function/);
    });

    // Overwrite the library that includes getNicoads function
    const originalNicoadsModule = libraryFunctions[nicoadsModuleIndex];

    libraryFunctions[nicoadsModuleIndex] = function (e, t, n) {
        originalNicoadsModule(e, t, n);

        // Find getNicoads function
        const getNicoadsBlockPropertyName = Object.getOwnPropertyNames(e.exports).find((propertyName) => {
            return e.exports[propertyName].Client.prototype && typeof e.exports[propertyName].Client.prototype.getNicoads === 'function';
        });
        const originalGetNicoadsFunction = e.exports[getNicoadsBlockPropertyName].Client.prototype.getNicoads;

        // Overwrite getNicoads function
        e.exports[getNicoadsBlockPropertyName].Client.prototype.getNicoads = function () {
            return originalGetNicoadsFunction.call(this, ...arguments).then((val) => {
                // Add custom process
                val ? setNicoads(true) : setNicoads(false);

                // Return original Promise
                return new Promise((resolve, reject) => {
                    resolve(val);
                });
            });
        }
    };
}
