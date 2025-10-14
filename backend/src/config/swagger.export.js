// swagger-export.js
import fs from "fs";
import { swaggerSpec } from "./swagger.config.js";

const outputPath = "./swagger.yaml";
import yaml from "yaml";

const yamlData = yaml.stringify(swaggerSpec);

fs.writeFileSync(outputPath, yamlData, "utf8");
console.log(`Swagger exporté dans ${outputPath}`);
