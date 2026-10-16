import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginReactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: { ...globals.browser, ...globals.node },
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
            },
        },
        settings: {
            react: {
                version: "19",
            },
        },
    },
    {
        files: ["**/*.{ts,tsx}"],
        plugins: {
            "react-hooks": pluginReactHooks,
            "react-refresh": pluginReactRefresh,
        },
        rules: {
            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
        },
    },
);
