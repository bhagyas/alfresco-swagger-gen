# alfresco-swagger-gen
OpenAPI (Swagger) definition generator for Alfresco Webscript Files

## Installation

### Via NPM 
Run `npm install -g alfresco-swagger-gen`

Official NPM Package is at https://www.npmjs.com/package/alfresco-swagger-gen

### Via Cloning 
Clone the repository and run `npm link` from the project root.

## Usage

### Generating OpenAPI (Swagger) Document
Refer to the command line syntax below.

```
alfresco-swagger-gen --header ../my-project/my-header.yaml \
                     --destination ./my-project/swagger-definitions.yaml \
                     --scanPath ./my-project/src  
```                  

### Parameter Reference
| Parameter | Description |
|-----------|-------------|
| header  | Specify a custom header file to be used for OpenAPI (Swagger) definition generation |
| destination | Destination path (target file) for the generated API definition file. |
| scanPath | Root path for scanning for Alfresco webscript descriptor files |

* An example header file is found in `./templates/default_header.yaml` within the source.

### Running Swagger-UI

alfresco-swagger-gen allows you to run Swagger-UI with your generated OpenAPI document. It copies the specified OpenAPI document to a custom folder and mounts it to a docker image running Swagger-UI.

The following command runs the built-in `docker-compose` file and opens the browser showing the Swagger-UI.

```
alfresco-swagger-gen ui --destination ./my-project/swagger-definitions.yaml \
&& open http://localhost:80
```



## Mapping
### How to map  Response Schemas
Add `<x-response-schema>MyResponseSchema</x-response-schema>` to your webscript descriptor file.

`MyResponseSchema` can be defined in your header file.

## Author
- Bhagya Silva - [@bhagyas](https://linkedin.com/in/bhagyas)