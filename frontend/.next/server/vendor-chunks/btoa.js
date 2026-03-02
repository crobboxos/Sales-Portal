/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/btoa";
exports.ids = ["vendor-chunks/btoa"];
exports.modules = {

/***/ "(ssr)/./node_modules/btoa/index.js":
/*!************************************!*\
  !*** ./node_modules/btoa/index.js ***!
  \************************************/
/***/ ((module) => {

eval("(function () {\n  \"use strict\";\n\n  function btoa(str) {\n    var buffer;\n\n    if (str instanceof Buffer) {\n      buffer = str;\n    } else {\n      buffer = Buffer.from(str.toString(), 'binary');\n    }\n\n    return buffer.toString('base64');\n  }\n\n  module.exports = btoa;\n}());\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvYnRvYS9pbmRleC5qcyIsIm1hcHBpbmdzIjoiQUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxDQUFDIiwic291cmNlcyI6WyJDOlxcZGV2XFxTYWxlcy1Qb3J0YWxcXGZyb250ZW5kXFxub2RlX21vZHVsZXNcXGJ0b2FcXGluZGV4LmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiAoKSB7XG4gIFwidXNlIHN0cmljdFwiO1xuXG4gIGZ1bmN0aW9uIGJ0b2Eoc3RyKSB7XG4gICAgdmFyIGJ1ZmZlcjtcblxuICAgIGlmIChzdHIgaW5zdGFuY2VvZiBCdWZmZXIpIHtcbiAgICAgIGJ1ZmZlciA9IHN0cjtcbiAgICB9IGVsc2Uge1xuICAgICAgYnVmZmVyID0gQnVmZmVyLmZyb20oc3RyLnRvU3RyaW5nKCksICdiaW5hcnknKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYnVmZmVyLnRvU3RyaW5nKCdiYXNlNjQnKTtcbiAgfVxuXG4gIG1vZHVsZS5leHBvcnRzID0gYnRvYTtcbn0oKSk7XG4iXSwibmFtZXMiOltdLCJpZ25vcmVMaXN0IjpbMF0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/btoa/index.js\n");

/***/ })

};
;