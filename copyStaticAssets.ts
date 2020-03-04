import * as shell from "shelljs";

shell.mkdir("-p", "dist/public/");
shell.mkdir("-p", "dist/downloaded/");
shell.cp("-R", "src/public/*", "dist/public/");
