# alfresco-swagger-gen
OpenAPI (Swagger) definition generator for Alfresco Webscript Files

## Installation

### Via NPM 
Run `npm install -g alfresco-swagger-gen`

### Cloning 
Clone the repository and run `npm link` from the project root.

## Usage

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


## Mapping
### How to map  Response Schemas
Add `<x-response-schema>MyResponseSchema</x-response-schema>` to your webscript descriptor file.

`MyResponseSchema` can be defined in your header file.

## Author
- Bhagya Silva - [@bhagyas](https://linkedin.com/in/bhagyas)