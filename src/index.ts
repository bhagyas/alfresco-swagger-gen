#!/usr/bin/env node

import glob = require("glob");
import * as path from "path";
import * as fs from "fs";
import * as parser from "fast-xml-parser";
import * as yaml from "js-yaml";
var mkdirp = require("mkdirp");

var he = require("he");
const util = require("util");

/*
 * Copyright (c) 2019.
 * Author: Bhagya Silva
 */

const readFile = util.promisify(fs.readFile);
var options = {
  attributeNamePrefix: "@_",
  attrNodeName: "attr", //default is 'false'
  textNodeName: "#text",
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: false,
  trimValues: true,
  cdataTagName: "__cdata", //default is 'false'
  cdataPositionChar: "\\c",
  localeRange: "", //To support non english character in tag/attribute values.
  parseTrueNumberOnly: false,
  attrValueProcessor: a => he.decode(a, { isAttributeValue: true }), //default is a=>a
  tagValueProcessor: a => he.decode(a) //default is a=>a
};

class SwaggerGen{
  scanPath;
  destinationYaml = "./target/output-swagger-def.yaml";
  customHeaderPath = "./templates/default_header.yaml";
  maxFileCount = -1; //-1 is all

  constructor(scanPath){
    this.scanPath = scanPath
  }

  getFullPath(){
    let fullPath = path.join(this.scanPath, "**/*.desc.xml");
    console.log("looking for descriptor files in path: " + fullPath);
    return fullPath;
  }
  generate(){
    let self = this;
    
    glob(self.getFullPath(), {}, function(er, files) {
      console.log("found " + files.length + " files");
      let selectedFiles = self.maxFileCount > 0 ? files.slice(0, self.maxFileCount) : files;

      function getResults() {
        return selectedFiles.map(fileName => {
          return self.getContent(fileName)
              .then(content => {
                return content.toString("utf8");
              })
              .then(content => {
                return self.getYamlDefJson(content, fileName);
              });
        });
      }
      Promise.all(getResults())
          .then(array => {
            return array.reduce((r, c) => Object.assign(r, c), {});
          })
          .then(async combined => {
            // yaml.
            let outputFileContents = yaml.safeLoad(
                await self.getContent(self.customHeaderPath)
            );
            outputFileContents["paths"] = combined;
            return Promise.resolve(outputFileContents);
          })

          .then(combined => {
            console.log("\n\n#### RESULT");
            const outputYaml = yaml.dump(combined);
            console.log(outputYaml);
            console.log("#### END RESULT\n\n");
            return outputYaml;
          })
          .then(outputYaml => {
            //write to file                        
            mkdirp(path.dirname(self.destinationYaml));
            fs.writeFileSync(self.destinationYaml, outputYaml);
          });
    })
  }

  getYamlDefJson(xmlData: string, fileName: string) {
    // console.log("parsing: " + xmlData);
    var jsonObj: any;
    if (parser.validate(xmlData) === true) {
      //optional (it'll return an object in case it's not valid)
      jsonObj = parser.parse(xmlData, options);
    }
    // console.log(jsonObj);

    let def = {};
    let urls = Array.isArray(jsonObj.webscript.url)
        ? jsonObj.webscript.url
        : Array(1).fill(jsonObj.webscript.url);

    urls.forEach(path => {
      def[path] = {};
      let method = SwaggerGen.getMethod(fileName);
      def[path][method] = {};
      def[path][method]["summary"] = jsonObj.webscript.shortname;
      def[path][method]["description"] = SwaggerGen.getCDataOrDesc(
          jsonObj.webscript.description
      );
      if (jsonObj.webscript.format && jsonObj.webscript.format.attr) {
        def[path][method]["responses"] = {
          200: {
            content: SwaggerGen.getMimeType(jsonObj.webscript.format.attr["@_default"])
          }
        };
      }

if(jsonObj.webscript.transaction){      if(jsonObj.webscript.transaction["#text"])
        def[path][method]["x-transaction-requiresnew"] =
            jsonObj.webscript.transaction["#text"] == "requiresnew";
      if (
          jsonObj.webscript.transaction.attr &&
          jsonObj.webscript.transaction.attr["@_allow"]
      )
        def[path][method]["x-transaction-allow"] =
            jsonObj.webscript.transaction.attr["@_allow"];
      if (
          jsonObj.webscript.transaction.attr &&
          jsonObj.webscript.transaction.attr["@_buffersize"]
      )
        def[path][method]["x-transaction-buffersize"] =
            jsonObj.webscript.transaction.attr["@_buffersize"];
}

      if (jsonObj.webscript.attr && jsonObj.webscript.attr["@_kind"])
        def[path][method]["x-kind"] = jsonObj.webscript.attr["@_kind"];

      if (jsonObj.webscript.authentication){
      if (jsonObj.webscript.authentication["#text"])
        def[path][method]["x-authentication"] =
            jsonObj.webscript.authentication["#text"];

      if (
          jsonObj.webscript.authentication.attr &&
          jsonObj.webscript.authentication.attr["@_runas"]
      )
        def[path][method]["x-authentication-runas"] =
            jsonObj.webscript.authentication.attr["@_runas"];
      }

      if (jsonObj.webscript.family)
        def[path][method]["x-family"] = jsonObj.webscript.family;
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

      let pathParams = path.match(/\{(\w+)\}/g);
      if (pathParams) def[path][method]["parameters"] = new Array();

      if (pathParams && pathParams.length > 0) {
        pathParams.forEach(item => {
          // console.log("path contains: " + item);
          def[path][method]["parameters"].push({
            in: "path",
            name: item.match(/\w+/)[0]
          });
        });
      }

      if (jsonObj.webscript.args) {
        def[path][method]["x-family"] = jsonObj.webscript.family;
        // console.log(JSON.stringify(jsonObj.webscript.args.arg));

        jsonObj.webscript.args.arg.forEach(arg => {
          //update if there's any existing path parameter;
          let isPathParam = false;
          def[path][method]["parameters"].forEach(existingParam => {
            if (existingParam.name == arg.name) {
              existingParam.description = SwaggerGen.getCDataOrDesc(arg.description);
              isPathParam = true;
            }
          });

          if (!isPathParam) {
            //find if presetn
            console.log("parsing arg: " + arg.name);
            if (path.indexOf(`{${arg.name}}`) != -1) {
              //arg is contained in path, so add to parameters
              def[path][method]["parameters"].push({
                in: "query",
                name: arg.name,
                description: SwaggerGen.getCDataOrDesc(arg.description)
              });
            }
          }
        });
      }
    });

    console.log("#### filename: " + fileName);
    console.log(def);
    return def;
  }


  /**
   * Returns the mimetype for the given format shortname
   * @param key
   */
  static getMimeType(key) {
    let mimeType = typesMap[key];
    if (mimeType) return mimeType;
    return "unknown";
  }


  /**
   * Returns the request method based on the filename
   * @param fileName
   */
  static  getMethod(fileName) {
    return fileName.match(/get|post|put|delete/);
  }

  /**
   * Returns the content for a given file.
   * @param filename
   */
  async getContent(filename: string) {
    JSON.stringify(filename);
    return await readFile(filename);
  }

  /**
   * Returns CDATA or text based on availability
   * @param prop
   */
   static getCDataOrDesc(prop) {
    if (prop.__cdata) {
      return prop.__cdata.trim();
    }
    return prop.trim();
  }




};

/**
 * TypesMap for mimetype mapping
 */
let typesMap = {
  json: "application/json",
  binary: "application/binary",
  unknown: "application/binary"
};



require('yargs') // eslint-disable-line
    .command('$0 [destination] [scanPath] [header]' , 'Generate OpenAPI (Swagger) definitions with Alfresco Webscript Descriptor files', (yargs) => {
      yargs
          .option('header', {
            describe: 'Custom header file for the OpenAPI definition output',
            default: "./templates/default_header.yaml"
          })
          .option('destination', {
            describe: 'Destination for the generated OpenAPI yaml file.',
            default: './output.yaml'
          })
          .option('maxFileCount', {
            describe: 'Maximum file count in case of testing.',
            default: -1
          })
          .option('scanPath', {
            describe: 'Folder path to scan for webscript descriptors',
            default: '.'
          })

    }, (argv) => {
      if (argv.verbose) console.info(`start server on :${argv.port}`)
      let swaggerGen = new SwaggerGen(argv.scanPath);
      swaggerGen.customHeaderPath = argv.header;
      swaggerGen.destinationYaml = argv.destination;
      swaggerGen.maxFileCount = argv.max;
      swaggerGen.generate();
    })
    .option('verbose', {
      alias: 'v',
      default: false
    })
    .argv;

