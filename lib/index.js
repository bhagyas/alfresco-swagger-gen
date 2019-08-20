#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var glob = require("glob");
var path = require("path");
var fs = require("fs");
var parser = require("fast-xml-parser");
var yaml = require("js-yaml");
var mkdirp = require("mkdirp");
var he = require("he");
var util = require("util");
/*
 * Copyright (c) 2019.
 * Author: Bhagya Silva
 */
var readFile = util.promisify(fs.readFile);
var options = {
    attributeNamePrefix: "@_",
    attrNodeName: "attr",
    textNodeName: "#text",
    ignoreAttributes: false,
    ignoreNameSpace: false,
    allowBooleanAttributes: false,
    parseNodeValue: true,
    parseAttributeValue: false,
    trimValues: true,
    cdataTagName: "__cdata",
    cdataPositionChar: "\\c",
    localeRange: "",
    parseTrueNumberOnly: false,
    attrValueProcessor: function (a) { return he.decode(a, { isAttributeValue: true }); },
    tagValueProcessor: function (a) { return he.decode(a); } //default is a=>a
};
var SwaggerGen = /** @class */ (function () {
    function SwaggerGen(scanPath) {
        this.destinationYaml = "./target/output-swagger-def.yaml";
        this.customHeaderPath = "./templates/default_header.yaml";
        this.maxFileCount = -1; //-1 is all
        this.scanPath = scanPath;
    }
    SwaggerGen.prototype.getFullPath = function () {
        var fullPath = path.join(this.scanPath, "**/*.desc.xml");
        console.log("looking for descriptor files in path: " + fullPath);
        return fullPath;
    };
    SwaggerGen.prototype.generate = function () {
        var self = this;
        glob(self.getFullPath(), {}, function (er, files) {
            var _this = this;
            console.log("found " + files.length + " files");
            var selectedFiles = self.maxFileCount > 0 ? files.slice(0, self.maxFileCount) : files;
            function getResults() {
                return selectedFiles.map(function (fileName) {
                    return self
                        .getContent(fileName)
                        .then(function (content) {
                        return content.toString("utf8");
                    })
                        .then(function (content) {
                        return self.getYamlDefJson(content, fileName);
                    });
                });
            }
            Promise.all(getResults())
                .then(function (array) {
                return array.reduce(function (previous, current) {
                    for (var first in current) {
                        if (previous.hasOwnProperty(first)) {
                            //merge the methods instead.
                            console.log("#### merging : " + first);
                            Object.assign(previous[first], current[first]);
                            return previous;
                        }
                    }
                    return Object.assign(previous, current);
                }, {});
            })
                .then(function (combined) { return __awaiter(_this, void 0, void 0, function () {
                var outputFileContents, _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _b = (_a = yaml).safeLoad;
                            return [4 /*yield*/, self.getContent(self.customHeaderPath)];
                        case 1:
                            outputFileContents = _b.apply(_a, [_c.sent()]);
                            outputFileContents["paths"] = combined;
                            return [2 /*return*/, Promise.resolve(outputFileContents)];
                    }
                });
            }); })
                .then(function (combined) {
                //add defaults
                if (!combined.components) {
                    Object.assign(combined, {
                        components: {
                            securitySchemes: {
                                BasicAuth: { type: "http", scheme: "basic" },
                                AdminAuth: { type: "http", scheme: "basic" }
                            }
                        }
                    });
                }
                else {
                    Object.assign(combined["components"], {
                        securitySchemes: {
                            BasicAuth: { type: "http", scheme: "basic" },
                            AdminAuth: { type: "http", scheme: "basic" }
                        }
                    });
                }
                return combined;
            })
                .then(function (combined) {
                console.log("\n\n#### RESULT");
                var outputYaml = yaml.dump(combined);
                console.log(outputYaml);
                console.log("#### END RESULT\n\n");
                return outputYaml;
            })
                .then(function (outputYaml) {
                //write to file
                mkdirp(path.dirname(self.destinationYaml));
                fs.writeFileSync(self.destinationYaml, outputYaml);
            });
        });
    };
    SwaggerGen.prototype.getYamlDefJson = function (xmlData, fileName) {
        // console.log("parsing: " + xmlData);
        var jsonObj;
        if (parser.validate(xmlData) === true) {
            //optional (it'll return an object in case it's not valid)
            jsonObj = parser.parse(xmlData, options);
        }
        // console.log(jsonObj);
        var def = {};
        var urls = Array.isArray(jsonObj.webscript.url)
            ? jsonObj.webscript.url
            : Array(1).fill(jsonObj.webscript.url);
        urls.forEach(function (path) {
            def[path] = {};
            var method = SwaggerGen.getMethod(fileName);
            def[path][method] = {};
            def[path][method]["summary"] = jsonObj.webscript.shortname;
            var description = SwaggerGen.getCDataOrDesc(jsonObj.webscript.description);
            def[path][method]["description"] = description;
            if (jsonObj.webscript.format && jsonObj.webscript.format.attr) {
                // SwaggerGen.getMimeType(jsonObj.webscript.format.attr["@_default"]) !=
                var jsonSpecifiedMimeType = SwaggerGen.getMimeType(jsonObj.webscript.format.attr["@_default"]);
                var responseContents_1 = {};
                var fileMimeTypes = SwaggerGen.getFileDefinedMimeType(fileName)
                    .map(function (ext) {
                    return SwaggerGen.getMimeType(ext);
                })
                    .filter(function (mt) { return mt != null; })
                    .forEach(function (mt) {
                    responseContents_1[mt] = {};
                });
                if (jsonSpecifiedMimeType != null)
                    responseContents_1[jsonSpecifiedMimeType] = {};
                if (responseContents_1)
                    if (responseContents_1.hasOwnProperty("application/json")) {
                        if (jsonObj.webscript.responseType) {
                            responseContents_1["application/json"] = {
                                schema: {
                                    $ref: "#/components/schemas/" + jsonObj.webscript.responseType
                                }
                            };
                        }
                    }
                def[path][method]["responses"] = {
                    200: {
                        content: responseContents_1,
                        description: description
                    }
                };
            }
            if (jsonObj.webscript.transaction) {
                if (jsonObj.webscript.transaction["#text"])
                    def[path][method]["x-transaction-requiresnew"] =
                        jsonObj.webscript.transaction["#text"] == "requiresnew";
                if (jsonObj.webscript.transaction.attr &&
                    jsonObj.webscript.transaction.attr["@_allow"])
                    def[path][method]["x-transaction-allow"] =
                        jsonObj.webscript.transaction.attr["@_allow"];
                if (jsonObj.webscript.transaction.attr &&
                    jsonObj.webscript.transaction.attr["@_buffersize"])
                    def[path][method]["x-transaction-buffersize"] =
                        jsonObj.webscript.transaction.attr["@_buffersize"];
            }
            if (jsonObj.webscript.attr && jsonObj.webscript.attr["@_kind"])
                def[path][method]["x-kind"] = jsonObj.webscript.attr["@_kind"];
            if (jsonObj.webscript.authentication) {
                var authentication = void 0;
                if (jsonObj.webscript.authentication.hasOwnProperty("#text")) {
                    authentication = jsonObj.webscript.authentication["#text"];
                }
                else {
                    authentication = jsonObj.webscript.authentication;
                }
                if (authentication) {
                    def[path][method]["x-authentication"] = authentication;
                    if (authentication == "user") {
                        def[path][method]["security"] = [{ BasicAuth: [] }];
                    }
                    if (authentication == "admin") {
                        def[path][method]["security"] = [
                            { BasicAuth: [] },
                            { AdminAuth: [] }
                        ];
                    }
                }
                if (jsonObj.webscript.authentication.attr &&
                    jsonObj.webscript.authentication.attr["@_runas"])
                    def[path][method]["x-authentication-runas"] =
                        jsonObj.webscript.authentication.attr["@_runas"];
            }
            if (jsonObj.webscript.family) {
                def[path][method]["tags"] = Array(1).fill(jsonObj.webscript.family);
                def[path][method]["x-family"] = jsonObj.webscript.family;
            }
            if (jsonObj.webscript.lifecycle)
                def[path][method]["x-lifecycle"] = jsonObj.webscript.lifecycle;
            if (jsonObj.webscript.cache)
                def[path][method]["x-cache-never"] = !!jsonObj.webscript.cache.never;
            if (jsonObj.webscript.cache)
                def[path][method]["x-cache-public"] = !!jsonObj.webscript.cache.public;
            if (jsonObj.webscript.cache)
                def[path][method]["x-cache-mustrevalidate"] = !!jsonObj.webscript.cache
                    .mustrevalidate;
            //TODO: Implement negotiate: https://docs.alfresco.com/5.2/references/api-wsdl-negotiate.html
            var pathParams = path.match(/\/\{(\w+)\}/g);
            var queryParams = path.match(/=\{(\w+)\}/g);
            if (pathParams)
                def[path][method]["parameters"] = new Array();
            if (pathParams && pathParams.length > 0) {
                pathParams.forEach(function (item) {
                    // console.log("path contains: " + item);
                    def[path][method]["parameters"].push({
                        name: item.match(/\w+/)[0],
                        in: "path",
                        schema: { type: "string" },
                        required: true
                    });
                });
            }
            if (queryParams && !def[path][method]["parameters"])
                def[path][method]["parameters"] = new Array();
            queryParams &&
                queryParams.forEach(function (item) {
                    // console.log("path contains: " + item);
                    def[path][method]["parameters"].push({
                        name: item.match(/\w+/)[0],
                        in: "query",
                        schema: { type: "string" }
                    });
                });
            if (jsonObj.webscript.args) {
                // console.log(JSON.stringify(jsonObj.webscript.args.arg));
                var args = Array();
                if (Array.isArray(jsonObj.webscript.args.arg)) {
                    args.push.apply(args, jsonObj.webscript.args.arg);
                }
                else {
                    args.push(jsonObj.webscript.args.arg);
                }
                args.forEach(function (arg) {
                    //update if there's any existing path parameter;
                    var isPathParam = false;
                    if (!def[path][method]["parameters"])
                        def[path][method]["parameters"] = [];
                    def[path][method]["parameters"].forEach(function (existingParam) {
                        if (existingParam.name == arg.name) {
                            existingParam.description = SwaggerGen.getCDataOrDesc(arg.description);
                            isPathParam = true;
                        }
                    });
                    if (!isPathParam) {
                        //find if presetn
                        // console.log("parsing arg: " + arg.name);
                        // if (path.indexOf(`{${arg.name}}`) != -1) {
                        //all non-path parameters are considered query parameters
                        if (true) {
                            //arg is contained in path, so add to parameters
                            def[path][method]["parameters"].push({
                                name: arg.name,
                                in: "query",
                                description: SwaggerGen.getCDataOrDesc(arg.description),
                                schema: { type: "string" }
                            });
                        }
                    }
                });
            }
        });
        console.log("#### filename: " + fileName);
        // console.log(def);
        return def;
    };
    /**
     * Returns the mimetype for the given format shortname
     * @param key
     */
    SwaggerGen.getMimeType = function (key) {
        var mimeType = typesMap[key];
        if (mimeType)
            return mimeType;
        return null;
    };
    /**
     * Returns the request method based on the filename
     * @param fileName
     */
    SwaggerGen.getMethod = function (fileName) {
        return fileName.match(/get|post|put|delete/);
    };
    /**
     * Returns the content for a given file.
     * @param filename
     */
    SwaggerGen.prototype.getContent = function (filename) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        JSON.stringify(filename);
                        return [4 /*yield*/, readFile(filename)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Returns CDATA or text based on availability
     * @param prop
     */
    SwaggerGen.getCDataOrDesc = function (prop) {
        if (prop.__cdata) {
            return prop.__cdata.trim();
        }
        return prop.trim();
    };
    SwaggerGen.getFileDefinedMimeType = function (fileName) {
        var method = SwaggerGen.getMethod(fileName);
        //look for matching extensions
        // return fileName.match(/\.{json|html}\.xml/);
        var container = path.dirname(fileName);
        var baseFileName = path.parse(fileName).name.match(/\w+/);
        // console.log(baseFileName);
        // @ts-ignore
        var matchPattern = path.join(container, baseFileName[0]) + ".**.**";
        var matcher = new RegExp("\\w+." + method + ".(\\w+).ftl");
        var matches = glob.sync(matchPattern);
        return matches
            .filter(function (match) {
            var baseName = path.basename(match);
            return baseName.match(matcher);
        })
            .map(function (match) {
            return match.match(matcher);
        })
            .filter(function (match) { return match != null; })
            .map(function (match) {
            //@ts-ignore
            var extension = match[1];
            return extension;
        });
    };
    return SwaggerGen;
}());
/**
 * TypesMap for mimetype mapping
 */
var typesMap = {
    json: "application/json",
    html: "application/html",
    binary: "application/binary"
};
require("yargs") // eslint-disable-line
    .command("$0 [destination] [scanPath] [header]", "Generate OpenAPI (Swagger) definitions with Alfresco Webscript Descriptor files", function (yargs) {
    yargs
        .option("header", {
        describe: "Custom header file for the OpenAPI definition output",
        default: "./templates/default_header.yaml"
    })
        .option("destination", {
        describe: "Destination for the generated OpenAPI yaml file.",
        default: "./target/output.yaml"
    })
        .option("maxFileCount", {
        describe: "Maximum file count in case of testing.",
        default: -1
    })
        .option("scanPath", {
        describe: "Folder path to scan for webscript descriptors",
        default: "."
    });
}, function (argv) {
    if (argv.verbose)
        console.info("starting looking on :" + argv.scanPath);
    var swaggerGen = new SwaggerGen(argv.scanPath);
    swaggerGen.customHeaderPath = argv.header;
    swaggerGen.destinationYaml = argv.destination;
    swaggerGen.maxFileCount = argv.max;
    swaggerGen.generate();
})
    .option("verbose", {
    alias: "v",
    default: false
}).argv;
