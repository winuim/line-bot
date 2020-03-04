import * as shell from "shelljs";

shell.mkdir("-p", "dist/public/downloaded/");
shell.cp("-R", "src/public/*", "dist/public/");
